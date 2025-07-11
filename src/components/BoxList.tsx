
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Package, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { BoxItem } from '@/pages/Index';

interface BoxListProps {
  boxes: BoxItem[];
  onEdit: (box: BoxItem) => void;
  onDelete: (boxId: string) => void;
}

const BoxList: React.FC<BoxListProps> = ({ boxes, onEdit, onDelete }) => {
  const [expandedBoxes, setExpandedBoxes] = useState<Set<string>>(new Set());

  const toggleExpanded = (boxId: string) => {
    const newExpanded = new Set(expandedBoxes);
    if (newExpanded.has(boxId)) {
      newExpanded.delete(boxId);
    } else {
      newExpanded.add(boxId);
    }
    setExpandedBoxes(newExpanded);
  };

  if (boxes.length === 0) {
    return (
      <Card className="text-center py-12 rounded-2xl border-dashed border-2 border-gray-200">
        <CardContent>
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No boxes yet</h3>
          <p className="text-gray-500">Start by scanning a QR code or adding a box manually</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Boxes ({boxes.length})</h2>
      
      {boxes.map((box) => {
        const isExpanded = expandedBoxes.has(box.id);
        const showViewMore = box.contents.length > 5;
        const displayedContents = isExpanded ? box.contents : box.contents.slice(0, 5);

        return (
          <Card key={box.id} className="shadow-lg rounded-2xl border-0 hover:shadow-xl transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{box.title}</h3>
                  {box.description && (
                    <p className="text-sm text-gray-600 mb-2">{box.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="bg-gray-100 px-2 py-1 rounded-lg font-mono">
                      {box.qrCode}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1 ml-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(box)}
                    className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(box.id)}
                    className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {box.location && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{box.location}</span>
                </div>
              )}

              {box.contents.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Contents:</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <ul className="space-y-1">
                      {displayedContents.map((item, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {showViewMore && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(box.id)}
                        className="mt-2 p-1 h-auto text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3 mr-1" />
                            View less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3 mr-1" />
                            View more ({box.contents.length - 5} more items)
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>
                  {box.createdAt === box.updatedAt 
                    ? `Created ${new Date(box.createdAt).toLocaleDateString()}`
                    : `Updated ${new Date(box.updatedAt).toLocaleDateString()}`
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BoxList;
