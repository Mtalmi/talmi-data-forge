import { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  FlaskConical, 
  Check, 
  Loader2, 
  X, 
  ChevronRight, 
  Droplets,
  Eye,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageCompression';
import { hapticSuccess, hapticError, hapticTap } from '@/lib/haptics';

interface Stock {
  materiau: string;
  unite: string;
  quantite_actuelle: number;
}

interface QualityStockEntryDialogProps {
  stocks: Stock[];
  onRefresh?: () => void;
}

/**
 * Quality Stock Entry Dialog for Responsable Technique
 * Step 1 of the Double-Lock Protocol
 * - Mandatory photo of material
 * - Quality test results (humidity, visual)
 * - Creates pending entry for Admin validation
 */
export function QualityStockEntryDialog({ stocks, onRefresh }: QualityStockEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Step 1 - Photo Evidence
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [blPhotoUrl, setBlPhotoUrl] = useState<string | null>(null);
  const [blPhotoPreview, setBlPhotoPreview] = useState<string | null>(null);

  // Step 2 - Quality Data
  const [materiau, setMateriau] = useState('');
  const [quantite, setQuantite] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [numeroBl, setNumeroBl] = useState('');
  const [humiditePct, setHumiditePct] = useState('');
  const [qualiteVisuelle, setQualiteVisuelle] = useState<'conforme' | 'non_conforme' | 'reserve'>('conforme');
  const [notes, setNotes] = useState('');

  const materialPhotoRef = useRef<HTMLInputElement>(null);
  const blPhotoRef = useRef<HTMLInputElement>(null);

  // Auto-trigger camera on dialog open
  useEffect(() => {
    if (open && step === 1 && !photoUrl) {
      const timer = setTimeout(() => {
        materialPhotoRef.current?.click();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, step, photoUrl]);

  const resetForm = () => {
    setStep(1);
    setPhotoUrl(null);
    setPhotoPreview(null);
    setBlPhotoUrl(null);
    setBlPhotoPreview(null);
    setMateriau('');
    setQuantite('');
    setFournisseur('');
    setNumeroBl('');
    setHumiditePct('');
    setQualiteVisuelle('conforme');
    setNotes('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const handlePhotoCapture = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'material' | 'bl'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      hapticTap();

      const compressedFile = await compressImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'material') {
          setPhotoPreview(reader.result as string);
        } else {
          setBlPhotoPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(compressedFile);

      const fileName = `quality_${type}_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('documents')
        .upload(`quality-checks/${fileName}`, compressedFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(`quality-checks/${fileName}`);

      if (type === 'material') {
        setPhotoUrl(urlData.publicUrl);
      } else {
        setBlPhotoUrl(urlData.publicUrl);
      }
      
      hapticSuccess();
      toast.success(`Photo ${type === 'material' ? 'du matériau' : 'du BL'} capturée!`);
    } catch (error) {
      console.error('Error uploading photo:', error);
      hapticError();
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProceedToStep2 = () => {
    if (!photoUrl) {
      hapticError();
      toast.error('Photo du matériau obligatoire pour le contrôle qualité!');
      return;
    }
    hapticTap();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl) {
      hapticError();
      toast.error('Photo du matériau obligatoire!');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('create_quality_stock_entry', {
        p_materiau: materiau,
        p_quantite: parseFloat(quantite),
        p_fournisseur: fournisseur,
        p_numero_bl: numeroBl,
        p_photo_materiel_url: photoUrl,
        p_photo_bl_url: blPhotoUrl || null,
        p_humidite_pct: humiditePct ? parseFloat(humiditePct) : null,
        p_qualite_visuelle: qualiteVisuelle,
        p_notes: notes || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        hapticError();
        toast.error(result.error || 'Erreur lors de la création');
        return;
      }

      hapticSuccess();
      toast.success(result.message || 'Entrée qualité créée - En attente validation Admin');
      handleOpenChange(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error creating quality entry:', error);
      hapticError();
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStock = stocks.find((s) => s.materiau === materiau);

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={materialPhotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePhotoCapture(e, 'material')}
        className="hidden"
      />
      <input
        ref={blPhotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePhotoCapture(e, 'bl')}
        className="hidden"
      />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 min-h-[44px] border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => hapticTap()}
          >
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">Contrôle Qualité</span>
            <span className="sm:hidden">Qualité</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Contrôle Qualité Réception
            </DialogTitle>
            <DialogDescription className="text-xs">
              Double-Lock Step 1: Validation qualité avant approbation financière
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 py-2">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                step === 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-success/20 text-success'
              )}
            >
              {step > 1 ? <Check className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              <span>1. Photo</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                step === 2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <FlaskConical className="h-3 w-3" />
              <span>2. Qualité</span>
            </div>
          </div>

          {/* Step 1: Photo Evidence */}
          {step === 1 && (
            <div className="space-y-4 py-4">
              {uploadingPhoto ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Traitement de la photo...</p>
                </div>
              ) : photoPreview ? (
                <div className="space-y-4">
                  {/* Material Photo */}
                  <div className="relative rounded-lg border border-success/50 overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Matériau"
                      className="w-full h-40 object-cover"
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
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-success/90 text-success-foreground px-2 py-1 rounded text-xs">
                      <Check className="h-3 w-3" />
                      Photo Matériau
                    </div>
                  </div>

                  {/* Optional BL Photo */}
                  {!blPhotoPreview ? (
                    <Button
                      variant="outline"
                      className="w-full min-h-[48px] gap-2"
                      onClick={() => blPhotoRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                      Photo BL Fournisseur (optionnel)
                    </Button>
                  ) : (
                    <div className="relative rounded-lg border border-muted overflow-hidden">
                      <img
                        src={blPhotoPreview}
                        alt="BL"
                        className="w-full h-24 object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => {
                          setBlPhotoUrl(null);
                          setBlPhotoPreview(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <Button
                    className="w-full min-h-[56px] gap-2"
                    onClick={handleProceedToStep2}
                  >
                    <ChevronRight className="h-5 w-5" />
                    Continuer vers Tests Qualité
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  {/* Golden Audit Requirement Badge */}
                  <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-full">
                    <Shield className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-500">
                      Audit Requirement: Photo Mandatory
                    </span>
                  </div>
                  
                  <div className="p-6 rounded-full bg-primary/10">
                    <Camera className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Photo du Matériau Obligatoire</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contrôle visuel pour la traçabilité qualité
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="w-full min-h-[56px] gap-2"
                    onClick={() => materialPhotoRef.current?.click()}
                  >
                    <Camera className="h-5 w-5" />
                    Photographier Matériau
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Quality Data Entry */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {/* Photo Thumbnails */}
              <div className="flex gap-2">
                {photoPreview && (
                  <div className="flex items-center gap-2 p-2 bg-success/10 border border-success/30 rounded-lg flex-1">
                    <img
                      src={photoPreview}
                      alt="Matériau"
                      className="h-10 w-10 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-success">Matériau</p>
                    </div>
                    <Check className="h-4 w-4 text-success" />
                  </div>
                )}
                {blPhotoPreview && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 border rounded-lg flex-1">
                    <img
                      src={blPhotoPreview}
                      alt="BL"
                      className="h-10 w-10 object-cover rounded"
                    />
                    <p className="text-xs">BL</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Matériau</Label>
                <Select value={materiau} onValueChange={setMateriau} required>
                  <SelectTrigger className="min-h-[48px]">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stocks.map((s) => (
                      <SelectItem key={s.materiau} value={s.materiau}>
                        {s.materiau} ({s.unite})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantité {selectedStock ? `(${selectedStock.unite})` : ''}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value)}
                    required
                    className="min-h-[48px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>N° BL Fournisseur</Label>
                  <Input
                    placeholder="BL-2024-001"
                    value={numeroBl}
                    onChange={(e) => setNumeroBl(e.target.value)}
                    required
                    className="min-h-[48px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fournisseur</Label>
                <Input
                  placeholder="Nom du fournisseur"
                  value={fournisseur}
                  onChange={(e) => setFournisseur(e.target.value)}
                  required
                  className="min-h-[48px]"
                />
              </div>

              {/* Quality Tests */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  Tests Qualité
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      Humidité (%)
                    </Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="Ex: 5.2"
                      value={humiditePct}
                      onChange={(e) => setHumiditePct(e.target.value)}
                      className="min-h-[48px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Aspect Visuel
                    </Label>
                    <Select 
                      value={qualiteVisuelle} 
                      onValueChange={(v) => setQualiteVisuelle(v as 'conforme' | 'non_conforme' | 'reserve')}
                    >
                      <SelectTrigger className="min-h-[48px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conforme">
                          <span className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-success" />
                            Conforme
                          </span>
                        </SelectItem>
                        <SelectItem value="reserve">
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-warning" />
                            Avec Réserve
                          </span>
                        </SelectItem>
                        <SelectItem value="non_conforme">
                          <span className="flex items-center gap-2">
                            <X className="h-3 w-3 text-destructive" />
                            Non Conforme
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes Qualité (optionnel)</Label>
                <Textarea
                  placeholder="Observations, remarques..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Warning for non-conforme */}
              {qualiteVisuelle === 'non_conforme' && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">
                    Matériau non conforme - L'Admin sera alertée avant validation
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 min-h-[48px]"
                  onClick={() => setStep(1)}
                >
                  Retour
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-h-[48px] gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Soumettre Qualité
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
