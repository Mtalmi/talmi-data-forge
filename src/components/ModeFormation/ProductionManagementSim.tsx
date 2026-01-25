import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Factory, ArrowRight, RotateCcw, PlayCircle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductionManagementSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DEMO_FORMULAS = [
  { id: 'b25', name: 'B25 S3', ciment: 350, sable: 800, gravier: 1100 },
  { id: 'b30', name: 'B30 S3', ciment: 400, sable: 750, gravier: 1150 },
  { id: 'b35', name: 'B35 S4', ciment: 450, sable: 700, gravier: 1100 },
];

export function ProductionManagementSim({ onComplete, onClose }: ProductionManagementSimProps) {
  const [step, setStep] = useState(1);
  const [selectedFormula, setSelectedFormula] = useState('');
  const [volume, setVolume] = useState('8');
  const [productionStarted, setProductionStarted] = useState(false);
  const [productionProgress, setProductionProgress] = useState(0);
  const [metricsRecorded, setMetricsRecorded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const simulateProduction = () => {
    setProductionStarted(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      setProductionProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
      }
    }, 500);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Production:', {
      selectedFormula,
      volume,
      productionProgress,
      metricsRecorded,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Lot de production complété',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setSelectedFormula('');
    setVolume('8');
    setProductionStarted(false);
    setProductionProgress(0);
    setMetricsRecorded(false);
  };

  const formula = DEMO_FORMULAS.find(f => f.id === selectedFormula);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-amber-500" />
            Simulation: Gestion Production
            <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-700 border-amber-300">
              SANDBOX
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Étape {step}/{totalSteps}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" indicatorClassName="bg-amber-500" />
        </div>

        {/* Steps */}
        <div className="space-y-4 py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">🧪 Étape 1: Sélection Formule</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Choisissez la formule de béton à produire.
                </p>
                <Label>Formule</Label>
                <Select value={selectedFormula} onValueChange={setSelectedFormula}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une formule..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_FORMULAS.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formula && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Ciment:</span>
                      <span className="font-medium">{formula.ciment} kg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sable:</span>
                      <span className="font-medium">{formula.sable} kg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gravier:</span>
                      <span className="font-medium">{formula.gravier} kg/m³</span>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!selectedFormula}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📦 Étape 2: Définir le Volume</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Indiquez le volume à produire.
                </p>
                <Label>Volume (m³)</Label>
                <Input
                  type="number"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  min="1"
                  max="12"
                  className="mt-1"
                />
                {formula && volume && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg text-sm">
                    <p className="font-medium mb-1">Matériaux nécessaires:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Ciment:</span>
                        <span>{formula.ciment * parseInt(volume)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sable:</span>
                        <span>{formula.sable * parseInt(volume)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gravier:</span>
                        <span>{formula.gravier * parseInt(volume)} kg</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!volume || parseInt(volume) <= 0}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  Étape 3: Lancer la Production
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Démarrez le processus de production.
                </p>
                
                {!productionStarted ? (
                  <Button 
                    onClick={simulateProduction}
                    className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Démarrer Production
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Production en cours...</span>
                      <span className="text-sm font-mono">{productionProgress}%</span>
                    </div>
                    <Progress 
                      value={productionProgress} 
                      className="h-3"
                      indicatorClassName={productionProgress < 100 ? "bg-amber-500" : "bg-emerald-500"}
                    />
                    {productionProgress >= 100 && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Production terminée!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button 
                onClick={handleNext} 
                disabled={productionProgress < 100}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Étape 4: Enregistrer les Métriques
                </h4>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Formule:</span>
                    <span className="font-medium">{formula?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume:</span>
                    <span className="font-medium">{volume} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temps de cycle:</span>
                    <span className="font-medium">12 min</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Statut:</span>
                    <Badge className="bg-emerald-600 text-white">TERMINÉ</Badge>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setMetricsRecorded(true)}
                  className={cn(
                    "w-full gap-2",
                    metricsRecorded && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {metricsRecorded ? 'Métriques enregistrées ✓' : 'Enregistrer métriques'}
                </Button>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !metricsRecorded}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Finalisation...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Compléter le Lot
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Reset Button */}
        <div className="flex justify-center pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
