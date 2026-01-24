import { useState, useRef, useEffect } from 'react';
import { Camera, Package, Check, Loader2, X, ChevronRight, Lock, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { CaptureRealityZone } from '@/components/ui/VaultWizard';
import { TacticalSwitch } from '@/components/ui/TacticalSwitch';
import { VaultSubmitButton } from '@/components/ui/VaultSubmitButton';

interface Stock {
  materiau: string;
  unite: string;
  quantite_actuelle: number;
}

interface TwoStepReceptionWizardProps {
  stocks: Stock[];
  onRefresh?: () => void;
}

// Material icons for Tactical Switch
const MATERIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Ciment': Shield,
  'Sable': Package,
  'Gravette': Truck,
};

/**
 * 2-Step Stock Reception Wizard - VAULT Edition
 * Camera-First workflow with minimalist one-question-at-a-time UX
 * "Obsidian & Liquid Gold" aesthetic
 */
export function TwoStepReceptionWizard({ stocks, onRefresh }: TwoStepReceptionWizardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Step 1 - Capture Reality (Photo)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step 2 - Material Selection (Tactical Switch)
  const [materiau, setMateriau] = useState('');

  // Step 3 - Quantity
  const [quantite, setQuantite] = useState('');

  // Step 4 - Additional Data
  const [fournisseur, setFournisseur] = useState('');
  const [numeroBl, setNumeroBl] = useState('');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoCapture = async (file: File) => {
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
      
      // Auto-advance after capture
      setTimeout(() => {
        setStep(2);
      }, 800);
    } catch (error) {
      console.error('Error uploading photo:', error);
      hapticError();
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!photoUrl) {
      hapticError();
      toast.error('Photo du BL obligatoire!');
      throw new Error('Missing photo');
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
        throw new Error(result.error);
      }

      hapticSuccess();
      toast.success(result.message || 'Réception sécurisée avec succès!');
      
      setTimeout(() => {
        handleOpenChange(false);
        onRefresh?.();
      }, 1500);
    } catch (error) {
      console.error('Error adding reception:', error);
      hapticError();
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStock = stocks.find((s) => s.materiau === materiau);

  // Prepare material options for Tactical Switch
  const materialOptions = stocks.map(s => ({
    value: s.materiau,
    label: s.materiau,
    icon: MATERIAL_ICONS[s.materiau] || Package,
  }));

  // Calculate step completion
  const isStep1Complete = !!photoUrl;
  const isStep2Complete = !!materiau;
  const isStep3Complete = !!quantite && parseFloat(quantite) > 0;
  const isStep4Complete = !!fournisseur && !!numeroBl;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button 
            className="gap-2 min-h-[44px] btn-premium-primary" 
            onClick={() => hapticTap()}
          >
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle Réception</span>
            <span className="sm:hidden">Réception</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0 bg-background border-primary/20">
          {/* Vault Header */}
          <div className="p-6 border-b border-border/30 bg-gradient-to-r from-background to-muted/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-foreground">Vault Reception</span>
                  <p className="text-xs font-normal text-muted-foreground mt-0.5">
                    Protocole sécurisé d'entrée de stock
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Progress Indicators */}
            <div className="flex items-center justify-between mt-6">
              {[
                { step: 1, label: 'Preuve', complete: isStep1Complete },
                { step: 2, label: 'Quoi?', complete: isStep2Complete },
                { step: 3, label: 'Combien?', complete: isStep3Complete },
                { step: 4, label: 'Qui?', complete: isStep4Complete },
              ].map((s, i) => (
                <div key={s.step} className="flex items-center">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'transition-all duration-500 border-2',
                    s.complete ? [
                      'bg-gradient-to-br from-primary to-primary/80',
                      'border-primary',
                      'shadow-[0_0_20px_hsl(var(--primary)/0.4)]',
                    ] : step === s.step ? [
                      'bg-transparent border-primary',
                      'shadow-[0_0_15px_hsl(var(--primary)/0.2)]',
                    ] : [
                      'bg-transparent border-border/40',
                    ]
                  )}>
                    {s.complete ? (
                      <Check className="h-5 w-5 text-primary-foreground" />
                    ) : step === s.step ? (
                      <span className="text-sm font-bold text-primary">{s.step}</span>
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                  {i < 3 && (
                    <div className={cn(
                      'w-6 h-0.5 mx-1 transition-all duration-500',
                      s.complete ? 'bg-primary' : 'bg-border/30'
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6 min-h-[350px] flex flex-col">
            {/* Step 1: Capture Reality */}
            {step === 1 && (
              <div className="flex-1 flex flex-col animate-fade-in-up">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Preuve?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Capturez le Bon de Livraison fournisseur
                  </p>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <CaptureRealityZone
                    photoUrl={photoUrl}
                    photoPreview={photoPreview}
                    onCapture={handlePhotoCapture}
                    uploading={uploadingPhoto}
                    label="Scanner le BL"
                    sublabel="Photo obligatoire pour continuer"
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Material Selection - Tactical Switch */}
            {step === 2 && (
              <div className="flex-1 flex flex-col animate-fade-in-up">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Quoi?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez le matériau reçu
                  </p>
                </div>

                <div className="flex-1 flex items-center">
                  <TacticalSwitch
                    options={materialOptions}
                    value={materiau}
                    onChange={(val) => {
                      setMateriau(val);
                      // Auto-advance after selection
                      setTimeout(() => setStep(3), 400);
                    }}
                    className="w-full"
                  />
                </div>

                {/* Photo thumbnail */}
                {photoPreview && (
                  <div className="flex items-center gap-3 p-3 mt-4 rounded-xl bg-primary/5 border border-primary/20">
                    <img src={photoPreview} alt="BL" className="h-10 w-10 rounded object-cover" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-primary">Preuve capturée ✓</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Quantity */}
            {step === 3 && (
              <div className="flex-1 flex flex-col animate-fade-in-up">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Combien?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Quantité de {materiau} reçue
                  </p>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={quantite}
                      onChange={(e) => setQuantite(e.target.value)}
                      className={cn(
                        'h-20 text-4xl text-center font-bold rounded-xl',
                        'bg-transparent border-2',
                        quantite ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.2)]' : 'border-border/50'
                      )}
                    />
                    {selectedStock && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-semibold">
                        {selectedStock.unite}
                      </span>
                    )}
                  </div>

                  {/* Stock preview */}
                  {selectedStock && quantite && (
                    <div className="p-4 rounded-xl border border-border/30 bg-muted/10">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-muted-foreground">Stock actuel</span>
                        <span className="font-mono font-bold">
                          {selectedStock.quantite_actuelle.toLocaleString()} {selectedStock.unite}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Après réception</span>
                        <span className="font-mono font-bold text-primary">
                          {(selectedStock.quantite_actuelle + parseFloat(quantite || '0')).toLocaleString()} {selectedStock.unite}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="flex-none"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!isStep3Complete}
                    className={cn(
                      'flex-1 gap-2',
                      isStep3Complete && 'btn-premium-primary'
                    )}
                  >
                    Continuer
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Supplier Info + Submit */}
            {step === 4 && (
              <div className="flex-1 flex flex-col animate-fade-in-up">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Pour qui?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Informations fournisseur
                  </p>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Fournisseur
                    </Label>
                    <Input
                      placeholder="Nom du fournisseur"
                      value={fournisseur}
                      onChange={(e) => setFournisseur(e.target.value)}
                      className="min-h-[52px] text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      N° Bon de Livraison
                    </Label>
                    <Input
                      placeholder="BL-2024-001"
                      value={numeroBl}
                      onChange={(e) => setNumeroBl(e.target.value)}
                      className="min-h-[52px] text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Notes (optionnel)
                    </Label>
                    <Textarea
                      placeholder="Remarques..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Summary Card */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-4 mt-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Matériau:</span>
                    <span className="font-semibold text-foreground">{materiau}</span>
                    <span className="text-muted-foreground">Quantité:</span>
                    <span className="font-semibold text-primary">{quantite} {selectedStock?.unite}</span>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(3)}
                    className="flex-none"
                  >
                    Retour
                  </Button>
                  <div className="flex-1">
                    <VaultSubmitButton
                      onClick={handleSubmit}
                      disabled={!isStep4Complete || submitting}
                    >
                      Sécuriser la Réception
                    </VaultSubmitButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
