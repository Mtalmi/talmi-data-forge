import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Eraser,
  Check,
  X,
  PenTool,
  User,
  Camera,
  SwitchCamera,
} from 'lucide-react';

interface DigitalSignaturePadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blId: string;
  clientName: string;
  onSignatureComplete: (signatureData: {
    signatureDataUrl: string;
    signerName: string;
    signedAt: string;
  }) => void;
}

type CaptureMode = 'draw' | 'camera';

export function DigitalSignaturePad({
  open,
  onOpenChange,
  blId,
  clientName,
  onSignatureComplete,
}: DigitalSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [mode, setMode] = useState<CaptureMode>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Stop camera stream when modal closes or mode changes
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!open) {
      stopCamera();
      setCapturedImage(null);
      setMode('draw');
    }
  }, [open, stopCamera]);

  // Start camera when switching to camera mode
  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Impossible d\'accéder à la caméra', {
        description: 'Vérifiez les permissions de votre navigateur'
      });
      setMode('draw');
    }
  };

  // Handle mode switch
  const handleModeSwitch = async (newMode: CaptureMode) => {
    if (newMode === 'camera') {
      setMode('camera');
      setCapturedImage(null);
      await startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setMode('draw');
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
      setHasSignature(true);
      stopCamera();
    }
  };

  // Retake photo
  const retakePhoto = async () => {
    setCapturedImage(null);
    setHasSignature(false);
    await startCamera();
  };

  // Initialize canvas
  useEffect(() => {
    if (open && mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }
  }, [open, mode]);

  const getCoordinates = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, []);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (coords) {
      setIsDrawing(true);
      setLastPoint(coords);
      setHasSignature(true);
    }
  }, [getCoordinates]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPoint) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPoint(coords);
  }, [isDrawing, lastPoint, getCoordinates]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      setHasSignature(false);
    }
  };

  const handleConfirm = () => {
    if (!hasSignature) {
      toast.error('Veuillez signer ou capturer une signature');
      return;
    }
    if (!signerName.trim()) {
      toast.error('Veuillez entrer le nom du signataire');
      return;
    }

    let signatureDataUrl: string;
    
    if (mode === 'camera' && capturedImage) {
      signatureDataUrl = capturedImage;
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      signatureDataUrl = canvas.toDataURL('image/png');
    }
    
    onSignatureComplete({
      signatureDataUrl,
      signerName: signerName.trim(),
      signedAt: new Date().toISOString(),
    });

    toast.success('Signature enregistrée', {
      description: `Signé par ${signerName.trim()}`,
    });

    // Reset and close
    clearSignature();
    setSignerName('');
    setCapturedImage(null);
    setMode('draw');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            Signature Numérique
          </DialogTitle>
          <DialogDescription>
            BL {blId} • Client: {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Signer Name Input */}
          <div className="space-y-2">
            <Label htmlFor="signer-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nom du Signataire
            </Label>
            <Input
              id="signer-name"
              placeholder="Ex: Mohamed Ben Ali"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              className="text-base"
            />
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={mode === 'draw' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => handleModeSwitch('draw')}
            >
              <PenTool className="h-4 w-4" />
              Dessiner
            </Button>
            <Button
              variant={mode === 'camera' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => handleModeSwitch('camera')}
            >
              <Camera className="h-4 w-4" />
              Scanner
            </Button>
          </div>

          {/* Draw Mode - Signature Canvas */}
          {mode === 'draw' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  Signez ci-dessous
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSignature}
                  className="h-8 px-2 gap-1 text-muted-foreground hover:text-destructive"
                >
                  <Eraser className="h-4 w-4" />
                  Effacer
                </Button>
              </div>
              
              <div 
                className={cn(
                  "relative rounded-lg border-2 border-dashed overflow-hidden touch-none",
                  hasSignature ? "border-primary/50 bg-white" : "border-muted-foreground/30 bg-muted/20"
                )}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-48 cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground/50 text-sm">
                      Signez avec votre doigt ou stylet
                    </p>
                  </div>
                )}
                
                <div className="absolute bottom-8 left-8 right-8 border-b border-muted-foreground/30" />
                <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                  Signature du client
                </p>
              </div>
            </div>
          )}

          {/* Camera Mode */}
          {mode === 'camera' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                {capturedImage ? 'Signature capturée' : 'Pointez vers la signature'}
              </Label>
              
              <div className="relative rounded-lg border-2 border-dashed overflow-hidden bg-black">
                {/* Live camera feed */}
                {!capturedImage && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-48 object-cover"
                    />
                    {!cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <p className="text-muted-foreground text-sm">Chargement de la caméra...</p>
                      </div>
                    )}
                    {/* Capture frame overlay */}
                    <div className="absolute inset-4 border-2 border-white/50 border-dashed rounded pointer-events-none" />
                  </>
                )}
                
                {/* Captured image preview */}
                {capturedImage && (
                  <img 
                    src={capturedImage} 
                    alt="Signature capturée" 
                    className="w-full h-48 object-contain bg-white"
                  />
                )}
              </div>
              
              {/* Camera controls */}
              <div className="flex gap-2">
                {!capturedImage ? (
                  <Button
                    className="flex-1 gap-2"
                    onClick={capturePhoto}
                    disabled={!cameraActive}
                  >
                    <Camera className="h-4 w-4" />
                    Capturer
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={retakePhoto}
                  >
                    <SwitchCamera className="h-4 w-4" />
                    Reprendre
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Legal Notice */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground">
              En signant, vous confirmez la réception de {' '}
              <span className="font-medium text-foreground">BL {blId}</span> {' '}
              et attestez que la livraison est conforme.
              {mode === 'camera' && (
                <span className="block mt-1 text-amber-600">
                  Note: La signature manuscrite (dessinée) a une valeur légale plus forte.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            Annuler
          </Button>
          <Button
            className="flex-1 gap-2 bg-success hover:bg-success/90"
            onClick={handleConfirm}
            disabled={!hasSignature || !signerName.trim()}
          >
            <Check className="h-4 w-4" />
            Confirmer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}