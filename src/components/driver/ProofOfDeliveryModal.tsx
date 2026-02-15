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
import { useI18n } from '@/i18n/I18nContext';

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
  }) => Promise<void> | void;
}

export function ProofOfDeliveryModal({
  open,
  onOpenChange,
  blId,
  clientName,
  onComplete,
}: ProofOfDeliveryModalProps) {
  const { t } = useI18n();
  const p = t.proofOfDelivery;
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
        toast.error(p.selectImage);
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

    if (!photoFile) {
      (async () => {
        setIsSubmitting(true);
        try {
          await onComplete({
            signatureDataUrl: data.signatureDataUrl,
            signerName: data.signerName,
            signedAt: data.signedAt,
          });

          setPhotoFile(null);
          setPhotoPreview(null);
          setSignatureData(null);
          onOpenChange(false);
        } catch (error) {
          console.error('Auto proof finalize error:', error);
          toast.error(p.errorValidation);
        } finally {
          setIsSubmitting(false);
        }
      })();
    }
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
      toast.error(p.signatureRequiredError, {
        description: p.getClientSignatureDesc,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl: string | undefined;

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${blId}-bl-photo-${Date.now()}.${fileExt}`;
        const filePath = `bl-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, photoFile);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
          photoUrl = urlData.publicUrl;
        }
      }

      await onComplete({
        photoUrl,
        signatureDataUrl: signatureData.signatureDataUrl,
        signerName: signatureData.signerName,
        signedAt: signatureData.signedAt,
      });

      setPhotoFile(null);
      setPhotoPreview(null);
      setSignatureData(null);
      onOpenChange(false);

    } catch (error) {
      console.error('Proof of delivery error:', error);
      toast.error(p.errorValidation);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = !!signatureData;

  return (
    <>
      <Dialog open={open && !showSignaturePad} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              {p.title}
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
                  {p.photoPaperBL}
                  <span className="text-xs text-muted-foreground font-normal">({p.optional})</span>
                </Label>
                {photoPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearPhoto}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    {p.delete}
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
                      {p.captured}
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
                    <p className="text-sm font-medium">{p.takePhoto}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.clickOrCamera}
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
                  {p.signatureRequired}
                </span>
              </div>
            </div>

            {/* Step 2: Digital Signature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <PenTool className="h-4 w-4 text-muted-foreground" />
                  {p.clientSignature}
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
                    {p.redo}
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
                      {p.signedBy}: <span className="font-medium text-foreground">{signatureData.signerName}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-medium">
                      <Check className="h-3 w-3" />
                      {p.validated}
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
                  <span className="text-sm">{p.getClientSignature}</span>
                </Button>
              )}

              <p className="text-[11px] text-muted-foreground">
                {p.hint}
              </p>
            </div>

            {/* Summary Info */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs text-muted-foreground">
                {p.summaryText} <span className="font-medium text-foreground">{blId}</span> {p.willBeMarked}{' '}
                <span className="font-medium text-emerald-600">{p.deliveredSigned}</span> {p.autoArchived}
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
              {p.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {p.validating}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {p.validateDelivery}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
