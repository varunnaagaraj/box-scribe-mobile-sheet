
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Camera, AlertCircle, RefreshCw, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQRCode, setManualQRCode] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setPermissionDenied(false);
      
      // Check if camera permissions are available
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      if (permissionStatus.state === 'denied') {
        setPermissionDenied(true);
        toast({
          title: "Camera Access Denied",
          description: "Please enable camera permissions in your browser settings.",
          variant: "destructive",
        });
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
        setPermissionDenied(false);
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setPermissionDenied(true);
      
      let errorMessage = "Unable to access camera.";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Camera not supported in this browser.";
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const captureAndScan = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // For demonstration, generate a mock QR code result
      // In a real implementation, you would use a QR code library here
      const mockQRResult = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      onScan(mockQRResult);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQRCode.trim()) {
      onScan(manualQRCode.trim());
    }
  };

  const retryCamera = () => {
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm mx-auto rounded-2xl border-0 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan QR Code
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!permissionDenied && !showManualInput ? (
              <>
                <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-white opacity-50 rounded-xl"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-blue-500 rounded-lg"></div>
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="text-center text-sm text-gray-600 mb-4">
                  Position the QR code within the frame
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={captureAndScan}
                    disabled={!isScanning}
                    className="flex-1 rounded-xl"
                  >
                    Capture & Scan
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex flex-col items-center gap-3 p-4 bg-red-50 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <h3 className="font-medium text-red-800">Camera Access Required</h3>
                    <p className="text-sm text-red-600 mt-1">
                      Please enable camera permissions in your browser to scan QR codes.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">How to enable camera:</h4>
                  <div className="text-sm text-gray-600 space-y-2 text-left bg-gray-50 p-3 rounded-lg">
                    <p><strong>Chrome/Edge:</strong> Click the camera icon in the address bar</p>
                    <p><strong>Safari:</strong> Go to Settings → Websites → Camera</p>
                    <p><strong>Firefox:</strong> Click the shield icon, then permissions</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={retryCamera}
                    variant="outline"
                    className="flex-1 rounded-xl"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Camera
                  </Button>
                  <Button 
                    onClick={() => setShowManualInput(true)}
                    variant="outline"
                    className="flex-1 rounded-xl"
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    Manual Entry
                  </Button>
                </div>
              </div>
            )}

            {showManualInput && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Keyboard className="w-4 h-4" />
                  Enter QR code manually
                </div>
                
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="manual-qr">QR Code</Label>
                    <Input
                      id="manual-qr"
                      value={manualQRCode}
                      onChange={(e) => setManualQRCode(e.target.value)}
                      placeholder="Enter QR code or any identifier"
                      className="rounded-xl"
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button type="submit" disabled={!manualQRCode.trim()} className="flex-1 rounded-xl">
                      Use This Code
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowManualInput(false)}
                      className="rounded-xl"
                    >
                      Back
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <Button variant="outline" onClick={onClose} className="w-full rounded-xl">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;
