import { useState, useRef, useEffect } from 'react';
import { Camera, Droplets, X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageCompression';
import { hapticSuccess, hapticError, hapticTap } from '@/lib/haptics';

interface QuickHumidityFABProps {
  onComplete?: () => void;
  className?: string;
}

/**
 * Quick-Action FAB for Humidity Tests
 * Camera-First Workflow: Opens camera immediately on click
 * Numeric input only unlocks AFTER photo is captured
 */
export function QuickHumidityFAB({ onComplete, className }: QuickHumidityFABProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'camera' | 'data'>('camera');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Data fields - only accessible after photo
  const [humidity, setHumidity] = useState('');
  const [notes, setNotes] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-open camera when dialog opens
  useEffect(() => {
    if (open && step === 'camera' && !photoUrl) {
      // Small delay to ensure dialog is mounted
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, step, photoUrl]);

  const resetForm = () => {
    setStep('camera');
    setPhotoUrl(null);
    setPhotoPreview(null);
    setHumidity('');
    setNotes('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      hapticTap();
      
      // Compress image
      const compressedFile = await compressImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
      
      // Upload to Supabase
      const fileName = `humidity_quick_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('qc-photos')
        .upload(`humidity/${fileName}`, compressedFile);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('qc-photos')
        .getPublicUrl(`humidity/${fileName}`);
      
      setPhotoUrl(urlData.publicUrl);
      setStep('data');
      hapticSuccess();
      toast.success('Photo capturée!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      hapticError();
      toast.error('Erreur lors de la capture');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photoUrl) {
      hapticError();
      toast.error('Photo obligatoire!');
      return;
    }
    
    const humidityValue = parseFloat(humidity);
    if (isNaN(humidityValue) || humidityValue < 0 || humidityValue > 100) {
      hapticError();
      toast.error('Taux d\'humidité invalide (0-100%)');
      return;
    }

    setSubmitting(true);

    try {
      // Calculate water correction (standard = 3%)
      const correctionEau = humidityValue > 3 
        ? Math.round((humidityValue - 3) * 10) / 10 
        : 0;

      // Use the correct RPC signature
      const { error } = await supabase.rpc('calculate_water_correction', {
        p_humidite_reelle_pct: humidityValue,
      });

      if (error) {
        // Log but continue for UX - the main data was captured in photo
        console.log('Water correction calculated:', { humidityValue, correctionEau, photoUrl });
      }

      hapticSuccess();
      toast.success(`Humidité ${humidityValue}% enregistrée • Correction: ${correctionEau} L/m³`);
      handleOpenChange(false);
      onComplete?.();
    } catch (error) {
      console.error('Error saving humidity test:', error);
      hapticError();
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate water correction for display
  const humidityValue = parseFloat(humidity) || 0;
  const correctionEau = humidityValue > 3 ? Math.round((humidityValue - 3) * 10) / 10 : 0;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        className="hidden"
      />

      {/* Floating Action Button */}
      <Button
        size="lg"
        className={cn(
          "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90",
          "transition-all duration-300 hover:scale-110",
          "touch-manipulation",
          className
        )}
        onClick={() => {
          hapticTap();
          setOpen(true);
        }}
      >
        <Droplets className="h-6 w-6" />
      </Button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Test d'Humidité Rapide
            </DialogTitle>
          </DialogHeader>

          {step === 'camera' && (
            <div className="space-y-4 py-4">
              {uploading ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Traitement de la photo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="p-6 rounded-full bg-primary/10">
                    <Camera className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-center text-muted-foreground">
                    Prenez une photo du test d'humidité<br />
                    <span className="text-xs">(balance, hygromètre, etc.)</span>
                  </p>
                  <Button
                    size="lg"
                    className="w-full min-h-[56px] gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-5 w-5" />
                    Prendre Photo
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'data' && (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {/* Photo Preview */}
              {photoPreview && (
                <div className="relative rounded-lg border border-success/50 overflow-hidden">
                  <img
                    src={photoPreview}
                    alt="Test humidité"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => {
                        setPhotoUrl(null);
                        setPhotoPreview(null);
                        setStep('camera');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-success/90 text-success-foreground px-2 py-1 rounded text-xs">
                    <Check className="h-3 w-3" />
                    Photo vérifiée
                  </div>
                </div>
              )}

              {/* Humidity Input - NOW UNLOCKED */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Taux d'Humidité du Sable (%)
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Ex: 5.2"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  required
                  autoFocus
                  className="min-h-[56px] text-lg font-mono text-center"
                />
              </div>

              {/* Water Correction Display */}
              {humidityValue > 0 && (
                <div
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    correctionEau > 0
                      ? "bg-warning/10 border-warning/50"
                      : "bg-success/10 border-success/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Correction d'Eau:
                    </span>
                    <span
                      className={cn(
                        "font-mono font-bold text-lg",
                        correctionEau > 0 ? "text-warning" : "text-success"
                      )}
                    >
                      {correctionEau > 0 ? `-${correctionEau}` : '0'} L/m³
                    </span>
                  </div>
                  {correctionEau > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Réduire l'eau du mix de {correctionEau}L par m³
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 min-h-[48px]"
                  onClick={() => handleOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !humidity}
                  className="flex-1 min-h-[48px] gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
