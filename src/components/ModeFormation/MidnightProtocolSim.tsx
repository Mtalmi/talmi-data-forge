import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MidnightProtocolSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const CEO_OVERRIDE_REASONS = [
  'Commande Urgente Client VIP',
  'Coulage Nuit Programmé',
  'Réparation Infrastructure Critique',
  'Demande Chantier Public',
  'Autre (Justifier)',
];

const DEMO_TRANSACTION = {
  type: 'Bon de Commande',
  client: 'Client Urgence SA',
  amount: 45000,
  volume: '12 m³',
};

export function MidnightProtocolSim({ onComplete, onClose }: MidnightProtocolSimProps) {
  const [step, setStep] = useState(1);
  const [currentTime, setCurrentTime] = useState('');
  const [justification, setJustification] = useState('');
  const [ceoReason, setCeoReason] = useState('');
  const totalSteps = 4;

  useEffect(() => {
    // Simulate night time (21:30)
    setCurrentTime('21:30');
  }, []);

  const handleApprove = () => {
    toast.success('[SIMULATION] Protocole Minuit Validé!', {
      description: 'Audit log: SIMULATION_MIDNIGHT_BYPASS - CEO Override',
    });
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setJustification('');
    setCeoReason('');
  };

  const progress = (step / totalSteps) * 100;
  const justificationValid = justification.length >= 20;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full p-4 sm:p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/20">
              <Moon className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Simulation: Protocole Minuit</h2>
              <p className="text-xs text-muted-foreground">
                Données Sandbox - Aucune écriture réelle
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="mb-6 p-3 rounded-lg bg-pink-500/20 border border-pink-500/50 flex items-center gap-3">
          <div className="p-2 rounded-full bg-pink-500/30 animate-pulse">
            <Moon className="h-4 w-4 text-pink-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-pink-200">
              🌙 MODE NUIT ACTIF - Heure simulée: {currentTime}
            </p>
            <p className="text-xs text-pink-300/70">
              Fenêtre 18h00 - 00h00: Justification obligatoire
            </p>
          </div>
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
            <Card className="bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldAlert className="h-5 w-5 text-pink-600" />
                  Transaction Hors-Heures Détectée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-pink-100/50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-pink-500" />
                    <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
                      Heure: {currentTime} - Zone Critique
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
                      <span className="text-muted-foreground">Montant:</span>
                      <p className="font-mono font-bold">
                        {DEMO_TRANSACTION.amount.toLocaleString()} DH
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Volume:</span>
                      <p className="font-medium">{DEMO_TRANSACTION.volume}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">
                      Cette transaction requiert une justification d'urgence
                      (minimum 20 caractères) et une raison CEO.
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full gap-2 bg-pink-500 hover:bg-pink-600"
                  onClick={() => setStep(2)}
                >
                  Justifier l'Urgence
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Enter Justification */}
          {step === 2 && (
            <Card className="bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-pink-600" />
                  Justification d'Urgence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Expliquez pourquoi cette opération est urgente:
                    <span className="text-xs text-muted-foreground ml-2">
                      (min. 20 caractères)
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
                  onClick={() => setStep(3)}
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
            <Card className="bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldAlert className="h-5 w-5 text-pink-600" />
                  Raison Override CEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label>Sélectionnez la raison de l'override:</Label>
                <Select value={ceoReason} onValueChange={setCeoReason}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Choisir une raison" />
                  </SelectTrigger>
                  <SelectContent>
                    {CEO_OVERRIDE_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="w-full mt-4 gap-2 bg-pink-500 hover:bg-pink-600"
                  onClick={() => setStep(4)}
                  disabled={!ceoReason}
                >
                  Soumettre
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Approval */}
          {step === 4 && (
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Approbation Accordée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">
                        Protocole Minuit - Bypass Autorisé
                      </span>
                    </div>
                    <div className="pt-3 border-t border-emerald-300 dark:border-emerald-700 space-y-2">
                      <div className="flex justify-between">
                        <span>Heure:</span>
                        <span className="font-mono">{currentTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Justification:</span>
                        <Badge className="bg-emerald-500">✓ Validée</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Raison CEO:</span>
                        <span className="text-right max-w-[200px]">
                          {ceoReason}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Audit Log:</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          MIDNIGHT_BYPASS
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    ✓ Cette transaction a été enregistrée dans le journal de
                    sécurité avec la signature 'SIMULATION_MIDNIGHT_BYPASS'.
                  </p>
                </div>

                <Button
                  className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleApprove}
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
