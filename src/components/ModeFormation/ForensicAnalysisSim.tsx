import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Search, ArrowRight, RotateCcw, FileCheck, Eye, AlertTriangle, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ForensicAnalysisSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DEMO_AUDIT_ENTRIES = [
  { id: '1', action: 'UPDATE', table: 'devis', user: 'Agent Admin', time: '10:45', field: 'prix_m3', oldValue: '850', newValue: '920', flag: 'price_change' },
  { id: '2', action: 'INSERT', table: 'depenses', user: 'Comptable', time: '11:22', field: 'montant', oldValue: '-', newValue: '4500', flag: null },
  { id: '3', action: 'UPDATE', table: 'formules', user: 'Resp. Technique', time: '14:30', field: 'dosage_ciment', oldValue: '350', newValue: '380', flag: 'formula_change' },
  { id: '4', action: 'DELETE', table: 'bons_livraison', user: 'Unknown', time: '23:15', field: '-', oldValue: 'BL-2024-001', newValue: '-', flag: 'deletion_attempt' },
];

export function ForensicAnalysisSim({ onComplete, onClose }: ForensicAnalysisSimProps) {
  const [step, setStep] = useState(1);
  const [logsReviewed, setLogsReviewed] = useState(false);
  const [comparisonDone, setComparisonDone] = useState(false);
  const [anomaliesIdentified, setAnomaliesIdentified] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
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
    console.log('[SIMULATION] Forensic Analysis:', {
      logsReviewed,
      comparisonDone,
      anomaliesIdentified,
      reportGenerated,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Analyse forensique complète',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setLogsReviewed(false);
    setComparisonDone(false);
    setAnomaliesIdentified(false);
    setReportGenerated(false);
  };

  const getFlagBadge = (flag: string | null) => {
    if (!flag) return null;
    switch (flag) {
      case 'price_change':
        return <Badge className="bg-amber-100 text-amber-700 text-xs">💰 Prix</Badge>;
      case 'formula_change':
        return <Badge className="bg-orange-100 text-orange-700 text-xs">🧪 Formule</Badge>;
      case 'deletion_attempt':
        return <Badge className="bg-rose-100 text-rose-700 text-xs">🚨 Suppression</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-amber-500" />
            Simulation: Analyse Forensique
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
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Étape 1: Revue des Logs d'Audit
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Examinez les entrées récentes du journal d'audit.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {DEMO_AUDIT_ENTRIES.map(entry => (
                    <div 
                      key={entry.id}
                      className={cn(
                        "p-2 rounded-lg border text-xs",
                        entry.flag === 'deletion_attempt' 
                          ? "bg-rose-50 border-rose-200" 
                          : "bg-white dark:bg-gray-900"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{entry.action}</span>
                          <span className="text-muted-foreground"> sur {entry.table}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">{entry.time}</span>
                          {getFlagBadge(entry.flag)}
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-1">Par: {entry.user}</p>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setLogsReviewed(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    logsReviewed && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {logsReviewed ? 'Logs examinés ✓' : 'Confirmer la revue'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!logsReviewed}
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
                  <GitCompare className="h-4 w-4" />
                  Étape 2: Comparaison Avant/Après
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Analysez les changements de valeurs.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
                    <p className="text-xs font-medium text-amber-600 mb-2">Modification de Prix (Devis)</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 bg-rose-50 rounded text-center">
                        <p className="text-xs text-muted-foreground">Avant</p>
                        <p className="font-bold text-rose-600 line-through">850 DH</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 p-2 bg-emerald-50 rounded text-center">
                        <p className="text-xs text-muted-foreground">Après</p>
                        <p className="font-bold text-emerald-600">920 DH</p>
                      </div>
                    </div>
                    <p className="text-xs text-amber-600 mt-2">+8.2% de variation</p>
                  </div>
                  
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
                    <p className="text-xs font-medium text-orange-600 mb-2">Modification Formule</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 bg-rose-50 rounded text-center">
                        <p className="text-xs text-muted-foreground">Avant</p>
                        <p className="font-bold text-rose-600 line-through">350 kg</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 p-2 bg-emerald-50 rounded text-center">
                        <p className="text-xs text-muted-foreground">Après</p>
                        <p className="font-bold text-emerald-600">380 kg</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setComparisonDone(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    comparisonDone && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {comparisonDone ? 'Comparaison terminée ✓' : 'Analyser les différences'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!comparisonDone}
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
                  Étape 3: Identifier les Anomalies
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Marquez les entrées suspectes.
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-lg border border-rose-300">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                      <span className="text-sm font-medium text-rose-700">Tentative de suppression détectée</span>
                    </div>
                    <p className="text-xs text-rose-600 mt-1">
                      Utilisateur "Unknown" à 23:15 - Action bloquée par RLS
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-300">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">Activité hors heures</span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      Transaction nocturne sans justification
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setAnomaliesIdentified(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    anomaliesIdentified && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {anomaliesIdentified ? 'Anomalies identifiées ✓' : 'Confirmer identification'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!anomaliesIdentified}
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
                  Étape 4: Générer le Rapport
                </h4>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entrées analysées:</span>
                    <span className="font-medium">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Anomalies détectées:</span>
                    <span className="font-medium text-rose-600">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actions bloquées:</span>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Niveau de risque:</span>
                    <Badge className="bg-amber-100 text-amber-700">MOYEN</Badge>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setReportGenerated(true)}
                  className={cn(
                    "w-full gap-2",
                    reportGenerated && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  <FileCheck className="h-4 w-4" />
                  {reportGenerated ? 'Rapport généré ✓' : 'Générer rapport forensique'}
                </Button>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !reportGenerated}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Finalisation...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Terminer l'Analyse
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
