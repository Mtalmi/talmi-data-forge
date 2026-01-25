import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, BarChart3, ArrowRight, RotateCcw, TrendingUp, TrendingDown, Wallet, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FinancialReportingSimProps {
  onComplete: () => void;
  onClose: () => void;
}

export function FinancialReportingSim({ onComplete, onClose }: FinancialReportingSimProps) {
  const [step, setStep] = useState(1);
  const [dailyReviewed, setDailyReviewed] = useState(false);
  const [cashFlowAnalyzed, setCashFlowAnalyzed] = useState(false);
  const [marginsChecked, setMarginsChecked] = useState(false);
  const [forecastViewed, setForecastViewed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Financial Reporting:', {
      dailyReviewed,
      cashFlowAnalyzed,
      marginsChecked,
      forecastViewed,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Rapport financier généré',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setDailyReviewed(false);
    setCashFlowAnalyzed(false);
    setMarginsChecked(false);
    setForecastViewed(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-500" />
            Simulation: Reporting Financier
            <Badge variant="outline" className="ml-2 bg-rose-100 text-rose-700 border-rose-300">
              EXECUTIVE
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Étape {step}/{totalSteps}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" indicatorClassName="bg-rose-500" />
        </div>

        {/* Steps */}
        <div className="space-y-4 py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📊 Étape 1: Rapport Journalier</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Consultez les indicateurs clés du jour.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-muted-foreground">CA du jour</p>
                    <p className="text-lg font-bold text-emerald-600">87,500 DH</p>
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <TrendingUp className="h-3 w-3" />
                      +12% vs hier
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-muted-foreground">Livraisons</p>
                    <p className="text-lg font-bold">12</p>
                    <p className="text-xs text-muted-foreground">Total: 96 m³</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-muted-foreground">Encaissements</p>
                    <p className="text-lg font-bold text-emerald-600">65,000 DH</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-muted-foreground">Dépenses</p>
                    <p className="text-lg font-bold text-rose-600">12,500 DH</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setDailyReviewed(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    dailyReviewed && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {dailyReviewed ? 'Rapport consulté ✓' : 'Valider consultation'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!dailyReviewed}
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
                  <Wallet className="h-4 w-4" />
                  Étape 2: Analyse Cash-Flow
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Évaluez la trésorerie et les prévisions.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Solde actuel</span>
                      <span className="text-lg font-bold text-emerald-600">245,000 DH</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Créances clients</span>
                      <span className="text-lg font-bold text-amber-600">128,500 DH</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Dettes fournisseurs</span>
                      <span className="text-lg font-bold text-rose-600">67,200 DH</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Position nette</span>
                      <span className="text-lg font-bold text-emerald-600">+306,300 DH</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setCashFlowAnalyzed(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    cashFlowAnalyzed && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {cashFlowAnalyzed ? 'Cash-flow analysé ✓' : 'Analyser le cash-flow'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!cashFlowAnalyzed}
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
                  <TrendingUp className="h-4 w-4" />
                  Étape 3: Analyse des Marges
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Vérifiez la rentabilité par produit.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">B25 S3</span>
                      <Badge className="bg-emerald-100 text-emerald-700">32%</Badge>
                    </div>
                    <Progress value={32} className="h-2" indicatorClassName="bg-emerald-500" />
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">B30 S3</span>
                      <Badge className="bg-emerald-100 text-emerald-700">28%</Badge>
                    </div>
                    <Progress value={28} className="h-2" indicatorClassName="bg-emerald-500" />
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">B35 S4</span>
                      <Badge className="bg-amber-100 text-amber-700">22%</Badge>
                    </div>
                    <Progress value={22} className="h-2" indicatorClassName="bg-amber-500" />
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Marge moyenne</p>
                    <p className="text-xl font-bold text-emerald-600">27.3%</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setMarginsChecked(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    marginsChecked && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {marginsChecked ? 'Marges vérifiées ✓' : 'Valider analyse marges'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!marginsChecked}
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
                  <FileCheck className="h-4 w-4" />
                  Étape 4: Prévisions 30 Jours
                </h4>
                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>CA projeté</span>
                      <span className="font-bold">2,450,000 DH</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Point le plus bas (trésorerie)</span>
                      <span className="font-bold text-amber-600">J+12: 85,000 DH</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Niveau de risque</span>
                      <Badge className="bg-emerald-100 text-emerald-700">Faible</Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setForecastViewed(true)}
                  className={cn(
                    "w-full gap-2",
                    forecastViewed && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  <FileCheck className="h-4 w-4" />
                  {forecastViewed ? 'Prévisions consultées ✓' : 'Voir prévisions détaillées'}
                </Button>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !forecastViewed}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Génération...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Générer le Rapport
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
