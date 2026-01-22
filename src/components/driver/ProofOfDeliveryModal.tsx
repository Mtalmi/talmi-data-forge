import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Camera,
  Check,
  X,
  PenTool,
  Image,
  FileCheck,
  Loader2,
  Upload,
  Trash2,
} from 'lucide-react';
import { DigitalSignaturePad } from './DigitalSignaturePad';

interface ProofOfDeliveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blId: string;
  clientName: string;
  onComplete: (proofData: {
    photoUrl?: string;
    signatureDataUrl: string;
    signerName: string;
    signedAt: string;
  }) => void;
}

export function ProofOfDeliveryModal({
  open,
  onOpenChange,
  blId,
  clientName,
  onComplete,
}: ProofOfDeliveryModalProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<{
    signatureDataUrl: string;
    signerName: string;
    signedAt: string;
  } | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureComplete = (data: {
    signatureDataUrl: string;
    signerName: string;
    signedAt: string;
  }) => {
    setSignatureData(data);
    setShowSignaturePad(false);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearSignature = () => {
    setSignatureData(null);
  };

  const handleSubmit = async () => {
    if (!signatureData) {
      toast.error('Signature requise', {
        description: 'Veuillez obtenir la signature du client',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl: string | undefined;

      // Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${blId}-bl-photo-${Date.now()}.${fileExt}`;
        const filePath = `bl-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, photoFile);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          // Continue without photo - signature is the primary proof
        } else {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
          photoUrl = urlData.publicUrl;
        }
      }

      onComplete({
        photoUrl,
        signatureDataUrl: signatureData.signatureDataUrl,
        signerName: signatureData.signerName,
        signedAt: signatureData.signedAt,
      });

      // Reset state
      setPhotoFile(null);
      setPhotoPreview(null);
      setSignatureData(null);
      onOpenChange(false);

    } catch (error) {
      console.error('Proof of delivery error:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = !!signatureData; // Signature is required, photo is optional

  return (
    <>
      <Dialog open={open && !showSignaturePad} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Preuve de Livraison
            </DialogTitle>
            <DialogDescription>
              BL {blId} • {clientName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Step 1: Photo Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  Photo du BL Papier
                  <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                </Label>
                {photoPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearPhoto}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>

              {photoPreview ? (
                <div className="relative rounded-lg border overflow-hidden bg-muted/30">
                  <img
                    src={photoPreview}
                    alt="BL Photo"
                    className="w-full h-40 object-contain"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-medium">
                      <Check className="h-3 w-3" />
                      Capturée
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-6",
                    "border-2 border-dashed rounded-lg cursor-pointer",
                    "bg-muted/20 hover:bg-muted/40 hover:border-primary/50",
                    "transition-all duration-200"
                  )}
                >
                  <div className="p-3 rounded-full bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Prendre Photo du BL Papier</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cliquez ou utilisez l'appareil photo
                    </p>
                  </div>
                </div>
              )}

              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Signature requise
                </span>
              </div>
            </div>

            {/* Step 2: Digital Signature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <PenTool className="h-4 w-4 text-muted-foreground" />
                  Signature du Client
                  <span className="text-xs text-destructive font-normal">*</span>
                </Label>
                {signatureData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSignature}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Refaire
                  </Button>
                )}
              </div>

              {signatureData ? (
                <div className="relative rounded-lg border overflow-hidden bg-white p-3">
                  <img
                    src={signatureData.signatureDataUrl}
                    alt="Signature"
                    className="w-full h-24 object-contain"
                  />
                  <div className="mt-2 pt-2 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Signé par: <span className="font-medium text-foreground">{signatureData.signerName}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-medium">
                      <Check className="h-3 w-3" />
                      Validée
                    </span>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowSignaturePad(true)}
                  className={cn(
                    "w-full h-24 flex flex-col items-center justify-center gap-2",
                    "border-2 border-dashed hover:border-primary/50 hover:bg-muted/30"
                  )}
                >
                  <PenTool className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm">Obtenir la signature du client</span>
                </Button>
              )}
            </div>

            {/* Summary Info */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs text-muted-foreground">
                En validant, le BL <span className="font-medium text-foreground">{blId}</span> sera 
                marqué comme <span className="font-medium text-emerald-600">Livré & Signé</span> et 
                archivé automatiquement dans le module Archive BL.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Valider Livraison
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Digital Signature Pad - Opens as separate dialog */}
      <DigitalSignaturePad
        open={showSignaturePad}
        onOpenChange={setShowSignaturePad}
        blId={blId}
        clientName={clientName}
        onSignatureComplete={handleSignatureComplete}
      />
    </>
  );
}
