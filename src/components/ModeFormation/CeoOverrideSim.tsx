import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Key, ArrowRight, RotateCcw, Shield, Timer, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAITrainingCoach } from '@/hooks/useAITrainingCoach';
import { AICoachPanel } from './AICoachPanel';

interface CeoOverrideSimProps {
  onComplete: () => void;
  onClose: () => void;
}

export function CeoOverrideSim({ onComplete, onClose }: CeoOverrideSimProps) {
  const [step, setStep] = useState(1);
  const [tokenGenerated, setTokenGenerated] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  const [tokenExpiry, setTokenExpiry] = useState(30 * 60);
  const [enteredToken, setEnteredToken] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scenario, setScenario] = useState<Record<string, any> | null>(null);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const { getCoachFeedback, generateScenario, isCoaching, lastFeedback, averageScore, resetSession } = useAITrainingCoach();

  useEffect(() => {
    generateScenario('ceo_override').then(data => { if (data) setScenario(data); });
  }, [generateScenario]);

  // Token expiry countdown
  useEffect(() => {
    if (tokenGenerated && tokenExpiry > 0) {
      const timer = setInterval(() => {
        setTokenExpiry(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [tokenGenerated, tokenExpiry]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateToken = () => {
    const token = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedToken(token);
    setTokenGenerated(true);
    setTokenExpiry(30 * 60);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      const next = step + 1;
      setStep(next);
      getCoachFeedback({ simulation: 'ceo_override', step: next, totalSteps, action: `Étape ${step} complétée`, data: { tokenGenerated, enteredToken, justification } });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] CEO Override:', {
      token: generatedToken,
      justification,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Override CEO autorisé avec succès',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setTokenGenerated(false);
    setGeneratedToken('');
    setTokenExpiry(30 * 60);
    setEnteredToken('');
    setJustification('');
    resetSession();
  };

  const tokenValid = enteredToken === generatedToken && tokenExpiry > 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-500" />
            Simulation: CEO Emergency Override
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

        {/* Emergency Context */}
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 text-sm">
          <div className="flex items-center gap-2 text-rose-700 font-medium mb-1">
            <Zap className="h-4 w-4" />
            Transaction d'Urgence
          </div>
          <p className="text-rose-600 text-xs">
            Cette simulation montre comment autoriser une transaction bloquée hors limites.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Étape 1: Générer le Token d'Override
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Le CEO génère un token temporaire valide 30 minutes.
                </p>
                
                {!tokenGenerated ? (
                  <Button 
                    onClick={generateToken}
                    className="w-full gap-2 bg-rose-600 hover:bg-rose-700"
                  >
                    <Key className="h-4 w-4" />
                    Générer Token CEO
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border-2 border-rose-300 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Token d'Override</p>
                      <p className="text-3xl font-mono font-bold tracking-widest text-rose-600">
                        {generatedToken}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Timer className="h-4 w-4 text-amber-600" />
                      <span className="font-mono text-amber-600">{formatTime(tokenExpiry)}</span>
                      <span className="text-muted-foreground">restantes</span>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!tokenGenerated}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">🔑 Étape 2: Saisir le Token</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  L'opérateur saisit le token fourni par le CEO.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label>Token d'Override</Label>
                    <Input
                      type="text"
                      value={enteredToken}
                      onChange={(e) => setEnteredToken(e.target.value)}
                      placeholder="Entrez le code à 4 chiffres"
                      maxLength={4}
                      className="mt-1 text-center text-2xl font-mono tracking-widest"
                    />
                  </div>
                  {enteredToken.length === 4 && (
                    <Badge className={tokenValid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
                      {tokenValid ? '✓ Token valide' : '✗ Token invalide'}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!tokenValid}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-medium mb-2">📝 Étape 3: Justification & Approbation</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Documentez la raison de l'override pour l'audit trail.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label>Justification d'urgence</Label>
                    <Textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Expliquez pourquoi cet override est nécessaire..."
                      className="mt-1 min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 20 caractères requis
                    </p>
                  </div>
                  
                  {justification.length >= 20 && (
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-2">Récapitulatif</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Token utilisé:</span>
                          <span className="font-mono">{generatedToken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Autorisé par:</span>
                          <span className="font-medium">CEO (Simulation)</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t">
                          <span>Audit:</span>
                          <Badge className="bg-emerald-100 text-emerald-700">Enregistré</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || justification.length < 20}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Autorisation en cours...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Approuver l'Override
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
