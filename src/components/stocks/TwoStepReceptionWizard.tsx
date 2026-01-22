import { useState, useRef, useEffect } from 'react';
import { Camera, Package, Check, Loader2, X, ChevronRight, Lock } from 'lucide-react';
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
} from '@/components/ui/dialog';
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

interface TwoStepReceptionWizardProps {
  stocks: Stock[];
  onRefresh?: () => void;
}

/**
 * 2-Step Stock Reception Wizard for Agent Administratif
 * Step 1 (Evidence): Camera/Upload - MANDATORY before proceeding
 * Step 2 (Data): Enter quantities - LOCKED until Step 1 complete
 */
export function TwoStepReceptionWizard({ stocks, onRefresh }: TwoStepReceptionWizardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Step 1 - Evidence
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step 2 - Data (locked until photo captured)
  const [materiau, setMateriau] = useState('');
  const [quantite, setQuantite] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [numeroBl, setNumeroBl] = useState('');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-trigger camera on dialog open
  useEffect(() => {
    if (open && step === 1 && !photoUrl) {
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, step, photoUrl]);

  const resetForm = () => {
    setStep(1);
    setPhotoUrl(null);
    setPhotoPreview(null);
    setMateriau('');
    setQuantite('');
    setFournisseur('');
    setNumeroBl('');
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
      setUploadingPhoto(true);
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
      const fileName = `reception_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('documents')
        .upload(`receptions/${fileName}`, compressedFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(`receptions/${fileName}`);

      setPhotoUrl(urlData.publicUrl);
      hapticSuccess();
      toast.success('Photo du BL capturée!');
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
      toast.error('Photo du BL fournisseur obligatoire!');
      return;
    }
    hapticTap();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl) {
      hapticError();
      toast.error('Photo du BL obligatoire!');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('secure_add_reception', {
        p_materiau: materiau,
        p_quantite: parseFloat(quantite),
        p_fournisseur: fournisseur,
        p_numero_bl: numeroBl,
        p_photo_bl_url: photoUrl,
        p_notes: notes || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        hapticError();
        toast.error(result.error || 'Erreur lors de la réception');
        return;
      }

      hapticSuccess();
      toast.success(result.message || 'Réception enregistrée avec succès!');
      handleOpenChange(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error adding reception:', error);
      hapticError();
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStock = stocks.find((s) => s.materiau === materiau);

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

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="gap-2 min-h-[44px]" onClick={() => hapticTap()}>
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle Réception</span>
            <span className="sm:hidden">Réception</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Réception Matières Premières
            </DialogTitle>
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
              <span>1. Preuve</span>
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
              {step === 1 && <Lock className="h-3 w-3" />}
              <span>2. Données</span>
            </div>
          </div>

          {/* Step 1: Evidence */}
          {step === 1 && (
            <div className="space-y-4 py-4">
              {uploadingPhoto ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Traitement de la photo...</p>
                </div>
              ) : photoPreview ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg border border-success/50 overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="BL Fournisseur"
                      className="w-full h-48 object-cover"
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
                      Photo vérifiée
                    </div>
                  </div>

                  <Button
                    className="w-full min-h-[56px] gap-2"
                    onClick={handleProceedToStep2}
                  >
                    <ChevronRight className="h-5 w-5" />
                    Continuer vers Étape 2
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="p-6 rounded-full bg-primary/10">
                    <Camera className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Scanner le Bon de Livraison</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Photo du BL fournisseur obligatoire
                    </p>
                  </div>
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

          {/* Step 2: Data Entry */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {/* Thumbnail of captured photo */}
              {photoPreview && (
                <div className="flex items-center gap-3 p-2 bg-success/10 border border-success/30 rounded-lg">
                  <img
                    src={photoPreview}
                    alt="BL"
                    className="h-12 w-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-success">BL Vérifié</p>
                    <p className="text-xs text-muted-foreground">Photo capturée</p>
                  </div>
                  <Check className="h-5 w-5 text-success" />
                </div>
              )}

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

              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea
                  placeholder="Remarques..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Stock Preview */}
              {selectedStock && quantite && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Stock actuel:</span>
                    <span className="font-mono font-semibold">
                      {selectedStock.quantite_actuelle.toLocaleString()}{' '}
                      {selectedStock.unite}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">Après réception:</span>
                    <span className="font-mono font-semibold text-success">
                      {(
                        selectedStock.quantite_actuelle + parseFloat(quantite || '0')
                      ).toLocaleString()}{' '}
                      {selectedStock.unite}
                    </span>
                  </div>
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
