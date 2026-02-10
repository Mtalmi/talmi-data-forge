import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, ArrowRight, RotateCcw, FileCheck, AlertTriangle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAITrainingCoach } from '@/hooks/useAITrainingCoach';
import { AICoachPanel } from './AICoachPanel';

interface AuditComplianceSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DEMO_AUDIT_ITEMS = [
  { id: '1', category: 'RLS Policies', status: 'ok', details: '28 policies actives' },
  { id: '2', category: 'Audit Triggers', status: 'ok', details: '15 triggers configurés' },
  { id: '3', category: 'Photo Evidence', status: 'warning', details: '2 entrées sans photo' },
  { id: '4', category: 'Access Logs', status: 'ok', details: '1,247 accès ce mois' },
];

export function AuditComplianceSim({ onComplete, onClose }: AuditComplianceSimProps) {
  const [step, setStep] = useState(1);
  const [auditReviewed, setAuditReviewed] = useState(false);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scenario, setScenario] = useState<Record<string, any> | null>(null);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;
  const complianceScore = 94;

  const { getCoachFeedback, generateScenario, isCoaching, lastFeedback, averageScore, resetSession } = useAITrainingCoach();

  useEffect(() => {
    generateScenario('audit_compliance').then(data => { if (data) setScenario(data); });
  }, [generateScenario]);

  const handleNext = () => {
    if (step < totalSteps) {
      const next = step + 1;
      setStep(next);
      getCoachFeedback({ simulation: 'audit_compliance', step: next, totalSteps, action: `Étape ${step} complétée`, data: { auditReviewed, complianceChecked, reportGenerated } });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Audit & Compliance:', {
      auditReviewed,
      complianceChecked,
      reportGenerated,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Audit de conformité complété',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setAuditReviewed(false);
    setComplianceChecked(false);
    setReportGenerated(false);
    resetSession();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Simulation: Audit & Conformité
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

        {/* Compliance Score */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Score de Conformité</span>
            <span className="text-2xl font-bold text-emerald-600">{complianceScore}%</span>
          </div>
          <Progress 
            value={complianceScore} 
            className="h-3" 
            indicatorClassName="bg-emerald-500"
          />
        </div>

        {/* Steps */}
        <div className="space-y-4 py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Étape 1: Revue du Trail d'Audit
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Examinez les différentes catégories d'audit.
                </p>
                <div className="space-y-2">
                  {DEMO_AUDIT_ITEMS.map(item => (
                    <div 
                      key={item.id}
                      className="p-3 bg-white dark:bg-gray-900 rounded-lg border"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-sm">{item.category}</span>
                          <p className="text-xs text-muted-foreground">{item.details}</p>
                        </div>
                        {item.status === 'ok' ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> OK
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Attention
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setAuditReviewed(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    auditReviewed && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {auditReviewed ? 'Audit examiné ✓' : 'Confirmer la revue'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!auditReviewed}
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
                  <Shield className="h-4 w-4" />
                  Étape 2: Vérification de Conformité
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Vérifiez les points de conformité critiques.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm">Toutes les transactions ont un audit trail</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm">RLS actif sur toutes les tables sensibles</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm">2 dépenses sans justificatif photo</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setComplianceChecked(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    complianceChecked && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {complianceChecked ? 'Conformité vérifiée ✓' : 'Confirmer vérification'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!complianceChecked}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Étape 3: Générer le Rapport
                </h4>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score global:</span>
                    <span className="font-bold text-emerald-600">{complianceScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Catégories OK:</span>
                    <span className="font-medium">3/4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Points d'attention:</span>
                    <span className="font-medium text-amber-600">1</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Verdict:</span>
                    <Badge className="bg-emerald-600 text-white">CONFORME</Badge>
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
                  {reportGenerated ? 'Rapport généré ✓' : 'Générer rapport PDF'}
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
                    Terminer l'Audit
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
