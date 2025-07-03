import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, ScanQrCode, Package, Plus, Edit, Trash2 } from "lucide-react";
import QRScanner from "@/components/QRScanner";
import BoxList from "@/components/BoxList";

export interface BoxItem {
  id: string;
  qrCode: string;
  title: string;
  description: string;
  contents: string[];
  location: string;
  createdAt: string;
  updatedAt: string;
}

const Index = () => {
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBox, setEditingBox] = useState<BoxItem | null>(null);

  const [formData, setFormData] = useState({
    qrCode: "",
    title: "",
    description: "",
    contents: "",
    location: "",
  });

  const [sheetsEndpoint, setSheetsEndpoint] = useState<string>(
    localStorage.getItem("box-tracker-sheets-endpoint") || ""
  );

  const [showSheetsInput, setShowSheetsInput] = useState<boolean>(
    !sheetsEndpoint
  );

  const { toast } = useToast();

  useEffect(() => {
    const savedBoxes = localStorage.getItem("box-tracker-data");
    if (savedBoxes) {
      setBoxes(JSON.parse(savedBoxes));
    }
    if (sheetsEndpoint) {
      fetchBoxesFromSheets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("box-tracker-sheets-endpoint", sheetsEndpoint);
  }, [sheetsEndpoint]);

  const fetchBoxesFromSheets = async () => {
    if (!sheetsEndpoint) return;
    try {
      const res = await fetch(sheetsEndpoint + "?action=get");
      if (!res.ok) throw new Error("Failed to fetch from Google Sheets");
      const data = await res.json();
      if (Array.isArray(data)) {
        setBoxes(data);
        localStorage.setItem("box-tracker-data", JSON.stringify(data));
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not fetch from Google Sheets",
        variant: "destructive",
      });
    }
  };

  const saveToSheets = async (updatedBoxes: BoxItem[]) => {
    if (!sheetsEndpoint) return;
    try {
      await fetch(sheetsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", boxes: updatedBoxes }),
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not save to Google Sheets",
        variant: "destructive",
      });
    }
  };

  const deleteFromSheets = async (boxId: string) => {
    if (!sheetsEndpoint) return;
    try {
      await fetch(sheetsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", boxId }),
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not delete from Google Sheets",
        variant: "destructive",
      });
    }
  };

  const saveToLocalStorage = (updatedBoxes: BoxItem[]) => {
    localStorage.setItem("box-tracker-data", JSON.stringify(updatedBoxes));
    if (sheetsEndpoint) {
      saveToSheets(updatedBoxes);
    }
  };

  const handleQRScan = (result: string) => {
    console.log("QR Code scanned:", result);
    setFormData((prev) => ({ ...prev, qrCode: result }));
    setShowScanner(false);
    setShowAddForm(true);
    toast({
      title: "QR Code Scanned!",
      description: `Code: ${result}`,
    });
  };

  const resetForm = () => {
    setFormData({
      qrCode: "",
      title: "",
      description: "",
      contents: "",
      location: "",
    });
    setShowAddForm(false);
    setEditingBox(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a box title",
        variant: "destructive",
      });
      return;
    }

    const contentsArray = formData.contents
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const now = new Date().toISOString();

    if (editingBox) {
      const updatedBox: BoxItem = {
        ...editingBox,
        title: formData.title,
        description: formData.description,
        contents: contentsArray,
        location: formData.location,
        updatedAt: now,
      };

      const updatedBoxes = boxes.map((box) =>
        box.id === editingBox.id ? updatedBox : box
      );

      setBoxes(updatedBoxes);
      saveToLocalStorage(updatedBoxes);

      toast({
        title: "Box Updated!",
        description: `${updatedBox.title} has been updated`,
      });
    } else {
      const newBox: BoxItem = {
        id: Date.now().toString(),
        qrCode: formData.qrCode || `BOX-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        contents: contentsArray,
        location: formData.location,
        createdAt: now,
        updatedAt: now,
      };

      const updatedBoxes = [...boxes, newBox];
      setBoxes(updatedBoxes);
      saveToLocalStorage(updatedBoxes);

      toast({
        title: "Box Added!",
        description: `${newBox.title} has been added to your inventory`,
      });
    }

    resetForm();
  };

  const handleEdit = (box: BoxItem) => {
    setEditingBox(box);
    setFormData({
      qrCode: box.qrCode,
      title: box.title,
      description: box.description,
      contents: box.contents.join(", "),
      location: box.location,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (boxId: string) => {
    const boxToDelete = boxes.find((box) => box.id === boxId);
    if (!boxToDelete) return;

    const updatedBoxes = boxes.filter((box) => box.id !== boxId);
    setBoxes(updatedBoxes);
    saveToLocalStorage(updatedBoxes);
    if (sheetsEndpoint) {
      await deleteFromSheets(boxId);
    }
    toast({
      title: "Box Deleted",
      description: `${boxToDelete.title} has been removed`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto p-4 max-w-md">
        {/* Google Sheets Endpoint Input */}
        {showSheetsInput ? (
          <div className="mb-4 bg-white rounded-xl shadow p-3 flex flex-col gap-2">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="sheets-endpoint"
            >
              Google Sheets API Endpoint
            </label>
            <input
              id="sheets-endpoint"
              type="text"
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="Paste your Google Apps Script Web App URL here"
              value={sheetsEndpoint}
              onChange={(e) => setSheetsEndpoint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setShowSheetsInput(false);
                }
              }}
              autoFocus
            />
            <span className="text-xs text-gray-400">
              This is required for cloud sync.{" "}
              <a
                href="https://developers.google.com/apps-script/guides/web"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                How to create?
              </a>
            </span>
          </div>
        ) : (
          <div className="mb-4 bg-white rounded-xl shadow p-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">
                Google Sheets Sync Enabled
              </span>
              <span className="text-xs text-blue-700 break-all">
                {sheetsEndpoint}
              </span>
            </div>
            <button
              className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
              onClick={() => setShowSheetsInput(true)}
            >
              Change
            </button>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Box Tracker</h1>
              <p className="text-sm text-gray-500">
                {boxes.length} boxes tracked
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            onClick={() => setShowScanner(true)}
            className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg rounded-2xl flex flex-col gap-1"
          >
            <ScanQrCode className="w-6 h-6" />
            <span className="text-sm">Scan QR</span>
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="h-16 border-blue-200 hover:bg-blue-50 rounded-2xl flex flex-col gap-1"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm">Add Box</span>
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-6 shadow-lg rounded-2xl border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                {editingBox ? (
                  <Edit className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {editingBox ? "Edit Box" : "Add New Box"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Box Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter box title"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="qrCode">QR Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="qrCode"
                      value={formData.qrCode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          qrCode: e.target.value,
                        }))
                      }
                      placeholder="Scan or enter manually"
                      className="rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScanner(true)}
                      className="rounded-xl px-3"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="contents">Contents</Label>
                  <Textarea
                    id="contents"
                    value={formData.contents}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contents: e.target.value,
                      }))
                    }
                    placeholder="List items separated by commas"
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Where is this box stored?"
                    className="rounded-xl"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 rounded-xl">
                    {editingBox ? "Update Box" : "Add Box"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Box List */}
        <BoxList boxes={boxes} onEdit={handleEdit} onDelete={handleDelete} />

        {/* QR Scanner Modal */}
        {showScanner && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
