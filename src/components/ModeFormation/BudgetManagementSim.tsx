import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, PieChart, ArrowRight, RotateCcw, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAITrainingCoach } from '@/hooks/useAITrainingCoach';
import { AICoachPanel } from './AICoachPanel';

interface BudgetManagementSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DEMO_CATEGORIES = [
  { name: 'Carburant', spent: 3200, budget: 5000 },
  { name: 'Maintenance', spent: 1800, budget: 3000 },
  { name: 'Fournitures', spent: 2500, budget: 4000 },
  { name: 'Divers', spent: 1000, budget: 3000 },
];

export function BudgetManagementSim({ onComplete, onClose }: BudgetManagementSimProps) {
  const [step, setStep] = useState(1);
  const [reviewedCategories, setReviewedCategories] = useState<string[]>([]);
  const [forecastViewed, setForecastViewed] = useState(false);
  const [alertsChecked, setAlertsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scenario, setScenario] = useState<Record<string, any> | null>(null);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;
  const totalSpent = DEMO_CATEGORIES.reduce((sum, c) => sum + c.spent, 0);
  const totalBudget = 15000;

  const { getCoachFeedback, generateScenario, isCoaching, lastFeedback, averageScore, resetSession } = useAITrainingCoach();

  useEffect(() => {
    generateScenario('budget_management').then(data => { if (data) setScenario(data); });
  }, [generateScenario]);

  const handleNext = () => {
    if (step < totalSteps) {
      const next = step + 1;
      setStep(next);
      getCoachFeedback({ simulation: 'budget_management', step: next, totalSteps, action: `Étape ${step} complétée`, data: { reviewedCategories, forecastViewed, alertsChecked } });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Gestion budget terminée:', {
      reviewedCategories,
      forecastViewed,
      alertsChecked,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Revue budgétaire complète',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setReviewedCategories([]);
    setForecastViewed(false);
    setAlertsChecked(false);
    resetSession();
  };

  const toggleCategory = (name: string) => {
    setReviewedCategories(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-amber-500" />
            Simulation: Gestion Budget
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

        {/* Budget Overview */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Budget Mensuel</span>
            <span className="text-lg font-bold">{totalSpent.toLocaleString()} / {totalBudget.toLocaleString()} DH</span>
          </div>
          <Progress 
            value={(totalSpent / totalBudget) * 100} 
            className="h-3" 
            indicatorClassName={totalSpent / totalBudget > 0.8 ? "bg-rose-500" : "bg-amber-500"}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Reste: {(totalBudget - totalSpent).toLocaleString()} DH ({Math.round(((totalBudget - totalSpent) / totalBudget) * 100)}%)
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📊 Étape 1: Revue par Catégorie</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Passez en revue chaque catégorie de dépenses.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-1">
                  👆 Cliquez sur chaque catégorie pour la valider ({reviewedCategories.length}/{DEMO_CATEGORIES.length})
                </p>
                <div className="space-y-2">
                  {DEMO_CATEGORIES.map(cat => (
                    <div 
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        reviewedCategories.includes(cat.name) 
                          ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700" 
                          : "bg-white dark:bg-gray-900 hover:border-amber-300 hover:bg-amber-50/50"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium flex items-center gap-2">
                          {reviewedCategories.includes(cat.name) && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                          {cat.name}
                        </span>
                        <span className="text-sm">
                          {cat.spent.toLocaleString()} / {cat.budget.toLocaleString()} DH
                        </span>
                      </div>
                      <Progress 
                        value={(cat.spent / cat.budget) * 100} 
                        className="h-1.5 mt-2" 
                        indicatorClassName={cat.spent / cat.budget > 0.8 ? "bg-rose-500" : "bg-amber-500"}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={reviewedCategories.length < DEMO_CATEGORIES.length}
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
                  <TrendingUp className="h-4 w-4" />
                  Étape 2: Prévisions
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Analysez les tendances et prévisions.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Projection fin de mois:</span>
                      <span className="font-bold text-amber-600">12,800 DH</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Tendance vs mois dernier:</span>
                      <span className="font-bold text-emerald-600">-8%</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setForecastViewed(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    forecastViewed && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {forecastViewed ? 'Prévisions analysées ✓' : 'Voir détails prévisions'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!forecastViewed}
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
                  <AlertTriangle className="h-4 w-4" />
                  Étape 3: Alertes Budget
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Vérifiez les alertes de dépassement.
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg border border-amber-300">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Carburant proche du seuil</p>
                        <p className="text-xs text-amber-600">64% du budget utilisé</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg border border-emerald-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800">Divers sous contrôle</p>
                        <p className="text-xs text-emerald-600">33% du budget utilisé</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setAlertsChecked(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    alertsChecked && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {alertsChecked ? 'Alertes vérifiées ✓' : 'Confirmer vérification'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!alertsChecked}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-medium mb-2">✅ Résumé de la Revue</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Catégories vérifiées:</span>
                    <span className="font-medium">{reviewedCategories.length}/4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget utilisé:</span>
                    <span className="font-medium">{Math.round((totalSpent / totalBudget) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut:</span>
                    <Badge className="bg-emerald-100 text-emerald-700">Sous contrôle</Badge>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Finalisation...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Terminer la Revue
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
