import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, ArrowRight, RotateCcw, Truck, Fuel, AlertTriangle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAITrainingCoach } from '@/hooks/useAITrainingCoach';
import { AICoachPanel } from './AICoachPanel';

interface FleetPredatorSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DEMO_TRUCKS = [
  { id: 'T-01', name: 'Toupie 01', status: 'en_route', fuel: 75, location: 'Casablanca Centre' },
  { id: 'T-02', name: 'Toupie 02', status: 'disponible', fuel: 45, location: 'Centrale' },
  { id: 'T-03', name: 'Toupie 03', status: 'maintenance', fuel: 90, location: 'Garage' },
];

export function FleetPredatorSim({ onComplete, onClose }: FleetPredatorSimProps) {
  const [step, setStep] = useState(1);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [fuelChecked, setFuelChecked] = useState(false);
  const [maintenanceChecked, setMaintenanceChecked] = useState(false);
  const [geofenceSet, setGeofenceSet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scenario, setScenario] = useState<Record<string, any> | null>(null);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const { getCoachFeedback, generateScenario, isCoaching, lastFeedback, averageScore, resetSession } = useAITrainingCoach();

  useEffect(() => {
    generateScenario('fleet_predator').then(data => { if (data) setScenario(data); });
  }, [generateScenario]);

  const handleNext = () => {
    if (step < totalSteps) {
      const next = step + 1;
      setStep(next);
      getCoachFeedback({ simulation: 'fleet_predator', step: next, totalSteps, action: `Étape ${step} complétée`, data: { selectedTruck, fuelChecked, maintenanceChecked, geofenceSet } });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Fleet Predator:', {
      selectedTruck,
      fuelChecked,
      maintenanceChecked,
      geofenceSet,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Surveillance flotte configurée',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setSelectedTruck(null);
    setFuelChecked(false);
    setMaintenanceChecked(false);
    setGeofenceSet(false);
    resetSession();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_route':
        return <Badge className="bg-blue-100 text-blue-700">En route</Badge>;
      case 'disponible':
        return <Badge className="bg-emerald-100 text-emerald-700">Disponible</Badge>;
      case 'maintenance':
        return <Badge className="bg-rose-100 text-rose-700">Maintenance</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-500" />
            Simulation: Fleet Predator GPS
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
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Étape 1: Sélection Véhicule
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Choisissez un véhicule à surveiller.
                </p>
                <div className="space-y-2">
                  {DEMO_TRUCKS.map(truck => (
                    <div 
                      key={truck.id}
                      onClick={() => setSelectedTruck(truck.id)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        selectedTruck === truck.id 
                          ? "bg-amber-100 border-amber-400" 
                          : "bg-white dark:bg-gray-900 hover:border-amber-300"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{truck.name}</span>
                          <p className="text-xs text-muted-foreground">{truck.location}</p>
                        </div>
                        {getStatusBadge(truck.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!selectedTruck}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Étape 2: Surveillance Carburant
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Analysez la consommation de carburant.
                </p>
                {selectedTruck && (
                  <div className="space-y-3">
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Niveau actuel:</span>
                        <span className="font-bold">{DEMO_TRUCKS.find(t => t.id === selectedTruck)?.fuel}%</span>
                      </div>
                      <Progress 
                        value={DEMO_TRUCKS.find(t => t.id === selectedTruck)?.fuel || 0} 
                        className="h-2"
                        indicatorClassName={(DEMO_TRUCKS.find(t => t.id === selectedTruck)?.fuel || 0) < 30 ? "bg-rose-500" : "bg-emerald-500"}
                      />
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Consommation moyenne:</span>
                        <span className="font-medium">32 L/100km</span>
                      </div>
                    </div>
                    {DEMO_TRUCKS.find(t => t.id === selectedTruck)?.fuel === 45 && (
                      <div className="p-2 bg-amber-100 rounded-lg flex items-center gap-2 text-sm text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        Niveau bas - Ravitaillement recommandé
                      </div>
                    )}
                  </div>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setFuelChecked(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    fuelChecked && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {fuelChecked ? 'Carburant vérifié ✓' : 'Confirmer vérification'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!fuelChecked}
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
                  <Settings className="h-4 w-4" />
                  Étape 3: Statut Maintenance
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Vérifiez l'état de maintenance du véhicule.
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Dernière vidange:</span>
                      <span className="font-medium">Il y a 2,500 km</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Prochaine visite technique:</span>
                      <span className="font-medium">Dans 45 jours</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Statut global:</span>
                      <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setMaintenanceChecked(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    maintenanceChecked && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {maintenanceChecked ? 'Maintenance vérifiée ✓' : 'Confirmer vérification'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!maintenanceChecked}
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
                  <MapPin className="h-4 w-4" />
                  Étape 4: Configuration Geofence
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Définissez une zone de surveillance.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <p className="text-sm font-medium mb-2">Zone: Centrale + 15km</p>
                    <p className="text-xs text-muted-foreground">
                      Alerte si le véhicule sort de cette zone sans livraison active.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setGeofenceSet(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    geofenceSet && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {geofenceSet ? 'Geofence configuré ✓' : 'Activer geofence'}
                </Button>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !geofenceSet}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Finalisation...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Terminer Configuration
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* AI Coach Panel */}
        <AICoachPanel feedback={lastFeedback} isCoaching={isCoaching} averageScore={averageScore} />
        {scenario && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs">
            <span className="font-medium">🎯 Scénario IA:</span> {JSON.stringify(scenario).substring(0, 120)}...
          </div>
        )}

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
