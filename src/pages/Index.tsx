import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  ScanQrCode,
  Package,
  Plus,
  Edit,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import QRScanner from "@/components/QRScanner";
import BoxList from "@/components/BoxList";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export interface BoxItem {
  id: string;
  qr_code: string;
  title: string;
  description: string;
  contents: string[];
  location: string;
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBox, setEditingBox] = useState<BoxItem | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPending, setSyncPending] = useState(false);

  const [formData, setFormData] = useState({
    qrCode: "",
    title: "",
    description: "",
    contents: "",
    location: "",
  });

  const [supabaseConfig, setSupabaseConfig] = useState({
    url: localStorage.getItem("box-tracker-supabase-url") || supabaseUrl,
    key: localStorage.getItem("box-tracker-supabase-key") || supabaseKey,
  });

  const [showSupabaseInput, setShowSupabaseInput] = useState(
    !supabaseConfig.url || !supabaseConfig.key
  );

  const { toast } = useToast();

  // Initialize Supabase client
  const supabase =
    supabaseConfig.url && supabaseConfig.key
      ? createClient(supabaseConfig.url, supabaseConfig.key)
      : null;

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncPending) {
        syncWithSupabase();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPending]);

  useEffect(() => {
    loadLocalData();
    if (supabase && isOnline && syncPending) {
      syncWithSupabase();
    }
  }, [supabase, isOnline, syncPending]);

  useEffect(() => {
    if (supabaseConfig.url && supabaseConfig.key) {
      localStorage.setItem("box-tracker-supabase-url", supabaseConfig.url);
      localStorage.setItem("box-tracker-supabase-key", supabaseConfig.key);
    }
  }, [supabaseConfig]);

  const loadLocalData = () => {
    const savedBoxes = localStorage.getItem("box-tracker-data");
    if (savedBoxes) {
      const parsedBoxes = JSON.parse(savedBoxes);
      // Convert database format to app format
      const formattedBoxes = parsedBoxes.map((box: BoxItem) => ({
        ...box,
        qr_code: box.qr_code || box.qr_code,
        created_at: box.created_at || box.created_at,
        updated_at: box.updated_at || box.updated_at,
      }));
      setBoxes(formattedBoxes);
    }
  };

  const saveToLocalStorage = (updatedBoxes: BoxItem[]) => {
    localStorage.setItem("box-tracker-data", JSON.stringify(updatedBoxes));
  };

  const syncWithSupabase = async () => {
    if (!supabase || !isOnline) return;

    try {
      const { data, error } = await supabase
        .from("boxes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Convert database format to app format
        const formattedBoxes: BoxItem[] = data.map((box: BoxItem) => ({
          id: box.id,
          qr_code: box.qr_code,
          title: box.title,
          description: box.description || "",
          contents: box.contents || [],
          location: box.location || "",
          created_at: box.created_at,
          updated_at: box.updated_at,
        }));

        setBoxes(formattedBoxes);
        saveToLocalStorage(formattedBoxes);
        setSyncPending(false);

        toast({
          title: "Synced",
          description: "Data synchronized with Supabase",
        });
      }
    } catch (error) {
      console.error("Error syncing with Supabase:", error);
      setSyncPending(true);
      toast({
        title: "Sync Error",
        description: "Could not sync with Supabase. Will retry when online.",
        variant: "destructive",
      });
    }
  };

  const saveToSupabase = async (action: "add" | "update", box: BoxItem) => {
    if (!supabase) return;

    try {
      // Convert app format to database format
      const dbBox = {
        id: box.id,
        qr_code: box.qr_code,
        title: box.title,
        description: box.description,
        contents: box.contents,
        location: box.location,
        updated_at: new Date().toISOString(),
      };

      if (action === "add") {
        const { error } = await supabase
          .from("boxes")
          .insert([{ ...dbBox, created_at: new Date().toISOString() }]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("boxes")
          .update(dbBox)
          .eq("id", box.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Box ${
          action === "add" ? "added to" : "updated in"
        } Supabase`,
      });
    } catch (error) {
      console.error("Error saving to Supabase:", error);
      setSyncPending(true);
      toast({
        title: "Save Error",
        description: `Could not ${action} box in Supabase. Changes saved locally.`,
        variant: "destructive",
      });
    }
  };

  const deleteFromSupabase = async (boxId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase.from("boxes").delete().eq("id", boxId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Box deleted from Supabase",
      });
    } catch (error) {
      console.error("Error deleting from Supabase:", error);
      setSyncPending(true);
      toast({
        title: "Delete Error",
        description: "Could not delete from Supabase. Changes saved locally.",
        variant: "destructive",
      });
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
        updated_at: now,
      };

      const updatedBoxes = boxes.map((box) =>
        box.id === editingBox.id ? updatedBox : box
      );

      setBoxes(updatedBoxes);
      saveToLocalStorage(updatedBoxes);

      // Save to Supabase if online
      if (isOnline && supabase) {
        await saveToSupabase("update", updatedBox);
      } else {
        setSyncPending(true);
      }

      toast({
        title: "Box Updated!",
        description: `${updatedBox.title} has been updated`,
      });
    } else {
      const newBox: BoxItem = {
        id: Date.now().toString(),
        qr_code: formData.qrCode || `BOX-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        contents: contentsArray,
        location: formData.location,
        created_at: now,
        updated_at: now,
      };

      const updatedBoxes = [...boxes, newBox];
      setBoxes(updatedBoxes);
      saveToLocalStorage(updatedBoxes);

      // Save to Supabase if online
      if (isOnline && supabase) {
        await saveToSupabase("add", newBox);
      } else {
        setSyncPending(true);
      }

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
      qrCode: box.qr_code,
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

    // Delete from Supabase if online
    if (isOnline && supabase) {
      await deleteFromSupabase(boxId);
    } else {
      setSyncPending(true);
    }

    toast({
      title: "Box Deleted",
      description: `${boxToDelete.title} has been removed`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto p-4 max-w-md">
        {/* Supabase Configuration */}
        {showSupabaseInput ? (
          <div className="mb-4 bg-white rounded-xl shadow p-3 flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Supabase Configuration
            </label>
            <input
              type="text"
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="Supabase URL"
              value={supabaseConfig.url}
              onChange={(e) =>
                setSupabaseConfig((prev) => ({ ...prev, url: e.target.value }))
              }
            />
            <input
              type="text"
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="Supabase Anon Key"
              value={supabaseConfig.key}
              onChange={(e) =>
                setSupabaseConfig((prev) => ({ ...prev, key: e.target.value }))
              }
            />
            <Button
              onClick={() => setShowSupabaseInput(false)}
              disabled={!supabaseConfig.url || !supabaseConfig.key}
              className="text-sm"
            >
              Save Configuration
            </Button>
            <span className="text-xs text-gray-400">
              Get these from your Supabase project settings
            </span>
          </div>
        ) : (
          <div className="mb-4 bg-white rounded-xl shadow p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">
                  Supabase {isOnline ? "Connected" : "Offline"}
                  {syncPending && " (Sync Pending)"}
                </span>
                <span className="text-xs text-blue-700">
                  {supabaseConfig.url.replace("https://", "").split(".")[0]}
                </span>
              </div>
            </div>
            <button
              className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
              onClick={() => setShowSupabaseInput(true)}
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
          {supabase && (
            <Button
              onClick={syncWithSupabase}
              variant="outline"
              size="sm"
              disabled={!isOnline}
              className="rounded-xl"
            >
              Sync
            </Button>
          )}
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
