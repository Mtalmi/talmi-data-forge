import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Moon,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  X,
  Clock,
  ShieldAlert,
  Zap,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAITrainingCoach } from '@/hooks/useAITrainingCoach';
import { AICoachPanel } from './AICoachPanel';

interface MidnightProtocolSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const CEO_OVERRIDE_REASONS = [
  { id: 'urgence_client', label: 'Urgence client (Client emergency)' },
  { id: 'probleme_production', label: 'Problème production (Production issue)' },
  { id: 'situation_critique', label: 'Situation critique (Critical situation)' },
  { id: 'autre', label: 'Autre (Justifier)' },
];

const DEMO_TRANSACTION = {
  type: 'Livraison Béton Urgente',
  client: 'Chantier Nuit Express',
  volume: '12 m³',
  product: 'B/25',
  amount: 7200,
  reason: 'Coulage de dalle prévu cette nuit',
};

export function MidnightProtocolSim({ onComplete, onClose }: MidnightProtocolSimProps) {
  const [step, setStep] = useState(1);
  const [currentTime, setCurrentTime] = useState('22:30');
  const [justification, setJustification] = useState('Coulage de dalle prévu cette nuit, délai critique pour le client');
  const [ceoReason, setCeoReason] = useState('');
  const [overrideToken, setOverrideToken] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [scenario, setScenario] = useState<Record<string, any> | null>(null);
  const totalSteps = 4;

  const { getCoachFeedback, generateScenario, isCoaching, lastFeedback, averageScore, resetSession } = useAITrainingCoach();

  useEffect(() => {
    generateScenario('midnight_protocol').then(data => { if (data) setScenario(data); });
  }, [generateScenario]);

  const handleStepChange = (nextStep: number, action: string) => {
    setStep(nextStep);
    getCoachFeedback({ simulation: 'midnight_protocol', step: nextStep, totalSteps, action, data: { currentTime, justification, ceoReason, overrideToken } });
  };

  useEffect(() => {
    // Simulate night time
    setCurrentTime('22:30');
  }, []);

  const handleRequestApproval = async () => {
    setIsApproving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOverrideToken('DEMO-OVERRIDE-001');
    setIsApproving(false);
    setStep(4);
  };

  const handleComplete = () => {
    console.log('[SIMULATION] Midnight Protocol:', {
      time: currentTime,
      justification,
      ceoReason,
      overrideToken,
      transaction: DEMO_TRANSACTION,
    });
    toast.success('🎉 Protocole Minuit Validé!', {
      description: 'Transaction approuvée par CEO avec token d\'urgence.',
    });
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setJustification('Coulage de dalle prévu cette nuit, délai critique pour le client');
    setCeoReason('');
    setOverrideToken('');
    resetSession();
  };

  const progress = (step / totalSteps) * 100;
  const justificationValid = justification.length >= 20;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full p-4 sm:p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/20 animate-pulse">
              <Moon className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Simulation: Le Protocole Minuit</h2>
              <p className="text-xs text-muted-foreground">
                Transaction d'Urgence Hors-Heures - Sandbox
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-pink-100 text-pink-700 border-pink-300">
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

        {/* Night Mode Alert Banner */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/50 flex items-center gap-3">
          <div className="p-2 rounded-full bg-pink-500/30 animate-pulse">
            <Moon className="h-5 w-5 text-pink-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-pink-200">
              🌙 MODE NUIT ACTIF - Heure simulée: {currentTime}
            </p>
            <p className="text-sm text-pink-300/70">
              Fenêtre 18h00 - 00h00: Justification d'urgence et approbation CEO obligatoires
            </p>
          </div>
          <Badge className="bg-red-500 animate-pulse">URGENCE</Badge>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">Étape {step}/{totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2 [&>div]:bg-pink-500" />
        </div>

        {/* Steps */}
        <div className="flex-1 max-w-2xl mx-auto w-full">
          {/* Step 1: View Transaction */}
          {step === 1 && (
            <Card className="bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldAlert className="h-5 w-5 text-pink-600" />
                  Étape 1/4: Transaction d'Urgence Détectée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-pink-100/50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-pink-500" />
                    <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
                      Heure: {currentTime} - Zone Critique (Après 18h00)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">{DEMO_TRANSACTION.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Client:</span>
                      <p className="font-medium">{DEMO_TRANSACTION.client}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Volume:</span>
                      <p className="font-bold">{DEMO_TRANSACTION.volume} {DEMO_TRANSACTION.product}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Montant:</span>
                      <p className="font-mono font-bold text-pink-600">
                        {DEMO_TRANSACTION.amount.toLocaleString()} DH
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        ⚠️ Transaction Hors-Heures Détectée
                      </p>
                      <p className="text-xs text-destructive/80 mt-1">
                        Cette transaction requiert une justification d'urgence (minimum 20 caractères) 
                        et une raison d'override CEO pour être approuvée.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full gap-2 bg-pink-500 hover:bg-pink-600"
                  onClick={() => handleStepChange(2, 'Transaction urgence consultée')}
                >
                  Justifier l'Urgence
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Enter Justification */}
          {step === 2 && (
            <Card className="bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-pink-600" />
                  Étape 2/4: Justification d'Urgence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    📝 Expliquez pourquoi cette opération est urgente et ne peut pas attendre 
                    les heures normales de travail.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    Justification d'Urgence
                    <span className="text-xs text-muted-foreground ml-2">
                      (minimum 20 caractères)
                    </span>
                  </Label>
                  <Textarea
                    placeholder="Décrivez la situation d'urgence en détail..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="bg-background min-h-[120px]"
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs",
                        justificationValid
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {justification.length}/20 caractères minimum
                    </span>
                    {justificationValid && (
                      <Badge className="bg-emerald-500">✓ Valide</Badge>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full mt-4 gap-2 bg-pink-500 hover:bg-pink-600"
                  onClick={() => handleStepChange(3, 'Justification saisie')}
                  disabled={!justificationValid}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: CEO Override Reason */}
          {step === 3 && (
            <Card className="bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldAlert className="h-5 w-5 text-pink-600" />
                  Étape 3/4: Demande d'Approbation CEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-pink-100 dark:bg-pink-900/30 border border-pink-200">
                  <p className="text-sm text-pink-800 dark:text-pink-200">
                    🔐 Sélectionnez la raison de l'override CEO pour cette transaction d'urgence.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Raison de l'Override CEO</Label>
                  <Select value={ceoReason} onValueChange={setCeoReason}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choisir une raison" />
                    </SelectTrigger>
                    <SelectContent>
                      {CEO_OVERRIDE_REASONS.map((reason) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {ceoReason && (
                  <div className="p-4 rounded-lg bg-background border">
                    <h5 className="font-medium mb-2 text-sm">Récapitulatif de la Demande:</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Heure:</span>
                        <span className="font-mono">{currentTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction:</span>
                        <span>{DEMO_TRANSACTION.amount.toLocaleString()} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Raison:</span>
                        <span className="text-right max-w-[180px]">
                          {CEO_OVERRIDE_REASONS.find(r => r.id === ceoReason)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full mt-4 gap-2 bg-pink-500 hover:bg-pink-600"
                  onClick={handleRequestApproval}
                  disabled={!ceoReason || isApproving}
                >
                  {isApproving ? (
                    <>Demande en cours...</>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Demander Approbation CEO
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Approval Result */}
          {step === 4 && (
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Étape 4/4: Approbation CEO Reçue!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-3 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-bold">
                      ✅ Protocole Minuit - Bypass Autorisé
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heure:</span>
                      <span className="font-mono">{currentTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Justification:</span>
                      <Badge className="bg-emerald-500">✓ Validée</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Raison CEO:</span>
                      <span className="text-right max-w-[180px]">
                        {CEO_OVERRIDE_REASONS.find(r => r.id === ceoReason)?.label}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-emerald-300 dark:border-emerald-700">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Token d'Urgence:</span>
                        <Badge variant="outline" className="font-mono bg-emerald-100">
                          {overrideToken}
                        </Badge>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-muted-foreground">Durée Validité:</span>
                        <span className="font-bold text-emerald-600">30 minutes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                    [SIMULATION] Midnight Protocol - Approved - {CEO_OVERRIDE_REASONS.find(r => r.id === ceoReason)?.label} - Token: {overrideToken}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-200">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    ✓ Cette transaction a été enregistrée dans le journal de sécurité 
                    avec la signature 'SIMULATION_MIDNIGHT_BYPASS'. Le token est valide 
                    pour 30 minutes.
                  </p>
                </div>

                <Button
                  className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Terminer la Simulation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
