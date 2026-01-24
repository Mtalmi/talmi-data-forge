import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  PackagePlus, 
  Loader2, 
  Camera, 
  X, 
  CheckCircle, 
  Moon, 
  Clock,
  GraduationCap,
  PartyPopper,
  RotateCcw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Mock stocks for training
const TRAINING_STOCKS = [
  { materiau: 'Ciment CPJ 45', unite: 'Tonnes', quantite_actuelle: 150 },
  { materiau: 'Sable 0/3', unite: 'Tonnes', quantite_actuelle: 320 },
  { materiau: 'Gravette 8/15', unite: 'Tonnes', quantite_actuelle: 280 },
  { materiau: 'Adjuvant Plastifiant', unite: 'Litres', quantite_actuelle: 450 },
];

interface TrainingReceptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function TrainingReceptionForm({ open, onOpenChange, onComplete }: TrainingReceptionFormProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [materiau, setMateriau] = useState('');
  const [quantite, setQuantite] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [numeroBl, setNumeroBl] = useState('');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setStep(1);
    setMateriau('');
    setQuantite('');
    setFournisseur('');
    setNumeroBl('');
    setNotes('');
    setPhotoPreview(null);
    setShowSuccess(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
      toast.success('📸 Photo capturée avec succès!');
      setStep(2);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photoPreview) {
      toast.error('Photo du BL obligatoire (Règle #1: Photo First!)');
      return;
    }
    
    setSubmitting(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitting(false);
    setShowSuccess(true);
    toast.success('🎓 Formation réussie! La réception a été simulée.');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
    if (showSuccess) {
      onComplete();
    }
  };

  const selectedStock = TRAINING_STOCKS.find(s => s.materiau === materiau);
  
  const getStepGuide = () => {
    switch (step) {
      case 1:
        return {
          title: 'Étape 1: Photographier le BL',
          description: 'Commencez par capturer une photo claire du bon de livraison fournisseur.',
          icon: Camera,
          color: 'text-primary',
        };
      case 2:
        return {
          title: 'Étape 2: Remplir les informations',
          description: 'Sélectionnez le matériau et entrez les détails de la réception.',
          icon: PackagePlus,
          color: 'text-warning',
        };
      case 3:
        return {
          title: 'Étape 3: Valider',
          description: 'Vérifiez les informations et confirmez la réception.',
          icon: CheckCircle,
          color: 'text-success',
        };
      default:
        return null;
    }
  };

  const currentGuide = getStepGuide();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Mode Formation - Réception Stock
            <Badge className="bg-primary/20 text-primary border-primary/30">
              SIMULATION
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Entraînez-vous sans affecter les données réelles
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
              <PartyPopper className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-xl font-bold text-success">Formation Réussie! 🎉</h3>
            <p className="text-muted-foreground">
              Vous avez correctement simulé une réception de stock.
            </p>
            <div className="bg-muted/30 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm font-medium">Récapitulatif:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Photo du BL capturée</li>
                <li>✓ Matériau: {materiau}</li>
                <li>✓ Quantité: {quantite} {selectedStock?.unite}</li>
                <li>✓ Fournisseur: {fournisseur}</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={resetForm} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Recommencer
              </Button>
              <Button onClick={handleClose} className="gap-2 bg-success hover:bg-success/90">
                <CheckCircle className="h-4 w-4" />
                Terminer
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Step Guide Banner */}
            {currentGuide && (
              <Alert className="border-primary/30 bg-primary/5">
                <currentGuide.icon className={cn("h-4 w-4", currentGuide.color)} />
                <AlertDescription>
                  <span className="font-semibold">{currentGuide.title}</span>
                  <br />
                  <span className="text-xs text-muted-foreground">{currentGuide.description}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Photo Upload Section */}
            <div className="space-y-2">
              <Label className="form-label-industrial flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <span className="font-semibold">Règle #1: Photo First</span>
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  REQUIS
                </Badge>
              </Label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              {photoPreview ? (
                <div className="relative rounded-lg border-2 border-success bg-success/10 p-2">
                  <img 
                    src={photoPreview} 
                    alt="BL Preview" 
                    className="w-full h-32 object-cover rounded"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-3 right-3 h-8 w-8"
                    onClick={handleRemovePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2 mt-2 text-success text-sm font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Preuve Capturée ✓
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full min-h-[80px] border-dashed border-primary/50 hover:border-primary hover:bg-primary/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center">
                    <Camera className="h-8 w-8 mb-2 text-primary" />
                    <span className="font-medium">📸 Photographier le BL Fournisseur</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Cliquez pour ouvrir la caméra
                    </span>
                  </div>
                </Button>
              )}
            </div>

            {/* Form Fields - Only show after photo */}
            {photoPreview && (
              <>
                <div className="space-y-2">
                  <Label className="form-label-industrial">Matériau</Label>
                  <Select value={materiau} onValueChange={(val) => { setMateriau(val); setStep(3); }} required>
                    <SelectTrigger className="min-h-[48px]">
                      <SelectValue placeholder="Sélectionner le matériau..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_STOCKS.map((s) => (
                        <SelectItem key={s.materiau} value={s.materiau}>
                          {s.materiau} ({s.unite})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="form-label-industrial">
                      Quantité {selectedStock ? `(${selectedStock.unite})` : ''}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 25"
                      value={quantite}
                      onChange={(e) => setQuantite(e.target.value)}
                      required
                      className="min-h-[48px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="form-label-industrial">N° BL</Label>
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
                  <Label className="form-label-industrial">Fournisseur</Label>
                  <Input
                    placeholder="Ex: LAFARGE MAROC"
                    value={fournisseur}
                    onChange={(e) => setFournisseur(e.target.value)}
                    required
                    className="min-h-[48px]"
                  />
                </div>

                {selectedStock && quantite && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Stock actuel (simulé):</span>
                      <span className="font-mono font-semibold">
                        {selectedStock.quantite_actuelle.toLocaleString()} {selectedStock.unite}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-muted-foreground">Après réception:</span>
                      <span className="font-mono font-semibold text-success">
                        {(selectedStock.quantite_actuelle + parseFloat(quantite || '0')).toLocaleString()} {selectedStock.unite}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="form-label-industrial">Notes (optionnel)</Label>
                  <Textarea
                    placeholder="Remarques sur la livraison..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || !photoPreview || !materiau || !quantite || !fournisseur}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Simulation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Valider (Simulation)
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Training Mode Notice */}
        <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-warning mt-0.5" />
            <div className="text-xs text-warning">
              <strong>Mode Formation:</strong> Aucune donnée n'est enregistrée dans la base de données réelle.
              Vous pouvez pratiquer en toute sécurité.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
