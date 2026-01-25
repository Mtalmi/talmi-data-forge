import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Camera,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Upload,
  Truck,
  X,
  Droplets,
  FlaskConical,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StockReceptionSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DEMO_ORDER = {
  id: 'DEMO-SAND-001',
  supplier: 'Carrière de Sable Premium',
  material: 'Sable (Sand)',
  quantity: 10,
  unit: 'Tonnes',
  unitPrice: 250,
  date: new Date().toLocaleDateString('fr-FR'),
};

const GRAVEL_GRADES = [
  { id: 'G1', name: 'G1 (Gravier 0-4mm)' },
  { id: 'G2', name: 'G2 (Gravier 4-10mm)' },
  { id: 'G3', name: 'G3 (Gravier 10-20mm)' },
];

export function StockReceptionSim({ onComplete, onClose }: StockReceptionSimProps) {
  const [step, setStep] = useState(1);
  const [humidityPhotoUploaded, setHumidityPhotoUploaded] = useState(false);
  const [humidityReading, setHumidityReading] = useState('8.5');
  const [gravelPhotoUploaded, setGravelPhotoUploaded] = useState(false);
  const [gravelGrade, setGravelGrade] = useState('G1');
  const [qualityAssessment, setQualityAssessment] = useState('conforme');
  const [confirmedQuantity, setConfirmedQuantity] = useState('10');
  const totalSteps = 5;

  const humidity = parseFloat(humidityReading) || 0;
  const isHighHumidity = humidity > 15;
  const totalAmount = DEMO_ORDER.unitPrice * parseFloat(confirmedQuantity || '0');

  const handleHumidityPhotoUpload = () => {
    setTimeout(() => {
      setHumidityPhotoUploaded(true);
      toast.success('[SIMULATION] Photo humidité capturée');
    }, 500);
  };

  const handleGravelPhotoUpload = () => {
    setTimeout(() => {
      setGravelPhotoUploaded(true);
      toast.success('[SIMULATION] Photo gravier capturée');
    }, 500);
  };

  const handleComplete = () => {
    console.log('[SIMULATION] Réception Stock:', {
      orderId: DEMO_ORDER.id,
      quantity: confirmedQuantity,
      humidity: humidityReading,
      gravelGrade,
      qualityAssessment,
    });
    toast.success('🎉 Réception de stock complétée avec succès!', {
      description: `Commande ${DEMO_ORDER.id} enregistrée dans l'inventaire.`,
    });
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setHumidityPhotoUploaded(false);
    setHumidityReading('8.5');
    setGravelPhotoUploaded(false);
    setGravelGrade('G1');
    setQualityAssessment('conforme');
    setConfirmedQuantity('10');
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full p-4 sm:p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Simulation: Réception Stock</h2>
              <p className="text-xs text-muted-foreground">
                Double Validation Obligatoire - Sandbox
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
              SANDBOX
            </Badge>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">Étape {step}/{totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" indicatorClassName="bg-amber-500" />
        </div>

        {/* Steps */}
        <div className="flex-1 max-w-2xl mx-auto w-full">
          {/* Step 1: View Incoming Delivery */}
          {step === 1 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-amber-600" />
                  Étape 1/5: Livraison Entrante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-background border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">N° Commande:</span>
                      <p className="font-mono font-bold text-amber-600">{DEMO_ORDER.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fournisseur:</span>
                      <p className="font-medium">{DEMO_ORDER.supplier}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Matériau:</span>
                      <p className="font-medium">{DEMO_ORDER.material}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantité:</span>
                      <p className="font-bold">{DEMO_ORDER.quantity} {DEMO_ORDER.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date Arrivée:</span>
                      <p>Aujourd'hui</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Statut:</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                        En attente
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    ℹ️ Cette réception nécessite <strong>2 validations obligatoires</strong>: 
                    Test d'humidité du sable et inspection du gravier.
                  </p>
                </div>

                <Button
                  className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => setStep(2)}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Sand Humidity Test */}
          {step === 2 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Droplets className="h-5 w-5 text-amber-600" />
                  Étape 2/5: Validation 1 - Test Humidité Sable
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    📸 <strong>Prenez une photo</strong> du sable en cours de test avec le 
                    dispositif d'humidité. Assurez-vous que le taux d'humidité est visible.
                  </p>
                </div>

                {!humidityPhotoUploaded ? (
                  <button
                    onClick={handleHumidityPhotoUpload}
                    className={cn(
                      "w-full h-36 rounded-xl border-2 border-dashed transition-all",
                      "border-amber-300 bg-amber-100/50 dark:bg-amber-900/20",
                      "hover:border-amber-400 hover:bg-amber-200/50",
                      "flex flex-col items-center justify-center gap-3"
                    )}
                  >
                    <Upload className="h-10 w-10 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Télécharger Photo Humidité
                    </span>
                  </button>
                ) : (
                  <div className="w-full h-36 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Photo humidité capturée ✓
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Taux d'humidité mesuré (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={humidityReading}
                    onChange={(e) => setHumidityReading(e.target.value)}
                    className="bg-background"
                    placeholder="Ex: 8.5"
                    disabled={!humidityPhotoUploaded}
                  />
                  <p className="text-xs text-muted-foreground">Plage valide: 0-30%</p>
                </div>

                {isHighHumidity && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">
                      ⚠️ Humidité élevée ({humidity}%) - Inspection supplémentaire requise
                    </p>
                  </div>
                )}

                {humidityPhotoUploaded && humidity > 0 && humidity <= 15 && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      ✅ Validation d'humidité réussie: {humidity}% (Acceptable)
                    </p>
                  </div>
                )}

                <Button
                  className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => setStep(3)}
                  disabled={!humidityPhotoUploaded || humidity <= 0}
                >
                  Valider Humidité
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Gravel Inspection */}
          {step === 3 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FlaskConical className="h-5 w-5 text-amber-600" />
                  Étape 3/5: Validation 2 - Inspection Gravier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    📸 <strong>Prenez une photo</strong> d'une poignée de gravier G1. 
                    Vérifiez que la granulométrie est conforme.
                  </p>
                </div>

                {!gravelPhotoUploaded ? (
                  <button
                    onClick={handleGravelPhotoUpload}
                    className={cn(
                      "w-full h-36 rounded-xl border-2 border-dashed transition-all",
                      "border-amber-300 bg-amber-100/50 dark:bg-amber-900/20",
                      "hover:border-amber-400 hover:bg-amber-200/50",
                      "flex flex-col items-center justify-center gap-3"
                    )}
                  >
                    <Camera className="h-10 w-10 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Télécharger Photo Gravier
                    </span>
                  </button>
                ) : (
                  <div className="w-full h-36 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Photo gravier capturée ✓
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Grade du gravier</Label>
                  <Select value={gravelGrade} onValueChange={setGravelGrade} disabled={!gravelPhotoUploaded}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Sélectionner le grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRAVEL_GRADES.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Évaluation Qualité</Label>
                  <RadioGroup
                    value={qualityAssessment}
                    onValueChange={setQualityAssessment}
                    className="flex flex-col gap-2"
                    disabled={!gravelPhotoUploaded}
                  >
                    <div className="flex items-center space-x-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                      <RadioGroupItem value="conforme" id="conforme" />
                      <Label htmlFor="conforme" className="text-emerald-700 dark:text-emerald-300 cursor-pointer">
                        ✅ Conforme (Compliant)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200">
                      <RadioGroupItem value="a_verifier" id="a_verifier" />
                      <Label htmlFor="a_verifier" className="text-yellow-700 dark:text-yellow-300 cursor-pointer">
                        ⚠️ À vérifier (Needs verification)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200">
                      <RadioGroupItem value="non_conforme" id="non_conforme" />
                      <Label htmlFor="non_conforme" className="text-red-700 dark:text-red-300 cursor-pointer">
                        ❌ Non-conforme (Non-compliant)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {gravelPhotoUploaded && qualityAssessment === 'conforme' && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      ✅ Inspection gravier réussie: {gravelGrade} - Conforme
                    </p>
                  </div>
                )}

                <Button
                  className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => setStep(4)}
                  disabled={!gravelPhotoUploaded || !qualityAssessment}
                >
                  Valider Inspection
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirm Quantities */}
          {step === 4 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-amber-600" />
                  Étape 4/5: Confirmer les Quantités
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-background border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Matériau:</span>
                      <p className="font-medium">{DEMO_ORDER.material}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantité Commandée:</span>
                      <p className="font-bold">{DEMO_ORDER.quantity} {DEMO_ORDER.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prix Unitaire:</span>
                      <p className="font-medium">{DEMO_ORDER.unitPrice} DH/{DEMO_ORDER.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <p className="font-bold text-emerald-600">{totalAmount.toLocaleString()} DH</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quantité Reçue ({DEMO_ORDER.unit})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={confirmedQuantity}
                    onChange={(e) => setConfirmedQuantity(e.target.value)}
                    className="bg-background"
                  />
                </div>

                <Button
                  className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => setStep(5)}
                  disabled={parseFloat(confirmedQuantity) <= 0}
                >
                  Confirmer Quantités
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Complete Reception */}
          {step === 5 && (
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Étape 5/5: Récapitulatif Final
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Validation d'humidité: Réussie ({humidityReading}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Inspection gravier: {gravelGrade} - {qualityAssessment === 'conforme' ? 'Conforme' : qualityAssessment}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Quantités confirmées: {confirmedQuantity} {DEMO_ORDER.unit}</span>
                  </div>
                  <div className="pt-3 border-t border-emerald-300 dark:border-emerald-700">
                    <div className="flex justify-between">
                      <span>Statut:</span>
                      <Badge className="bg-emerald-500">REÇU</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                    [SIMULATION] Réception Stock - {DEMO_ORDER.id} - {confirmedQuantity} {DEMO_ORDER.unit} - 
                    Humidity: {humidityReading}% - Gravel: {gravelGrade} {qualityAssessment === 'conforme' ? 'Conforme' : qualityAssessment}
                  </p>
                </div>

                <Button
                  className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finaliser Réception
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
