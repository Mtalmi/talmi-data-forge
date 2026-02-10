import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAITrainingCoach } from '@/hooks/useAITrainingCoach';
import { AICoachPanel } from './AICoachPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wallet,
  Camera,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Upload,
  AlertTriangle,
  X,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExpenseEntrySimProps {
  onComplete: () => void;
  onClose: () => void;
}

const EXPENSE_CATEGORIES = [
  'Carburant',
  'Maintenance',
  'Fournitures',
  'Services',
  'Divers',
];

const DEMO_BUDGET = {
  current: 8500,
  max: 15000,
};

export function ExpenseEntrySim({ onComplete, onClose }: ExpenseEntrySimProps) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [scenario, setScenario] = useState<Record<string, any> | null>(null);
  const totalSteps = 5;

  const {
    getCoachFeedback,
    generateScenario,
    isCoaching,
    isGenerating,
    lastFeedback,
    averageScore,
    resetSession,
  } = useAITrainingCoach();

  // Generate dynamic scenario on mount
  useEffect(() => {
    generateScenario('expense_entry').then(data => {
      if (data) setScenario(data);
    });
  }, [generateScenario]);

  const amountNum = parseFloat(amount) || 0;
  const newTotal = DEMO_BUDGET.current + amountNum;
  const budgetExceeded = newTotal > DEMO_BUDGET.max;
  const remaining = DEMO_BUDGET.max - DEMO_BUDGET.current;
  const budgetUsedPct = (DEMO_BUDGET.current / DEMO_BUDGET.max) * 100;

  const handleReceiptUpload = () => {
    setTimeout(() => {
      setReceiptUploaded(true);
      toast.success('[SIMULATION] Justificatif capturé');
    }, 500);
  };

  const handleSubmit = () => {
    toast.success('[SIMULATION] Dépense Enregistrée!', {
      description: `Audit log: SIMULATION_EXPENSE_ENTRY - ${amountNum} DH`,
    });
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setCategory('');
    setAmount('');
    setDescription('');
    setReceiptUploaded(false);
    resetSession();
  };

  // Coach feedback on step transitions
  const handleStepChange = (nextStep: number, action: string) => {
    setStep(nextStep);
    getCoachFeedback({
      simulation: 'expense_entry',
      step: nextStep,
      totalSteps,
      action,
      data: { category, amount: amountNum, description, receiptUploaded, budgetExceeded },
    });
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full p-4 sm:p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Wallet className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Simulation: Saisie Dépense</h2>
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

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">Étape {step}/{totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="flex-1 max-w-2xl mx-auto w-full">
          {/* Step 1: View Budget */}
          {step === 1 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PieChart className="h-5 w-5 text-amber-600" />
                  État du Budget Mensuel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Budget Gauge */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {DEMO_BUDGET.current.toLocaleString()} DH
                    </span>
                    <span className="text-muted-foreground">
                      / {DEMO_BUDGET.max.toLocaleString()} DH
                    </span>
                  </div>
                  <Progress
                    value={budgetUsedPct}
                    className={cn(
                      "h-4",
                      budgetUsedPct > 80
                        ? "[&>div]:bg-destructive"
                        : budgetUsedPct > 60
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-emerald-500"
                    )}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Budget restant:{' '}
                    <span className="font-semibold text-foreground">
                      {remaining.toLocaleString()} DH
                    </span>
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Plafond Autonomie:</strong> 15,000 DH/mois
                    <br />
                    Au-delà, approbation CEO requise.
                  </p>
                </div>

                <Button
                  className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => handleStepChange(2, 'Consulte le budget mensuel')}
                >
                  Nouvelle Dépense
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Category */}
          {step === 2 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-5 w-5 text-amber-600" />
                  Catégorie de Dépense
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label>Sélectionnez la catégorie:</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="w-full mt-4 gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => handleStepChange(3, `Sélectionne la catégorie: ${category}`)}
                  disabled={!category}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Enter Amount */}
          {step === 3 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-5 w-5 text-amber-600" />
                  Montant & Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Montant (DH):</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-background text-lg font-mono"
                  />
                </div>

                {/* Real-time Validation */}
                {amountNum > 0 && (
                  <div
                    className={cn(
                      "p-3 rounded-lg border",
                      budgetExceeded
                        ? "bg-destructive/10 border-destructive/50"
                        : "bg-emerald-100/50 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700"
                    )}
                  >
                    {budgetExceeded ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Budget Dépassé! Approbation CEO requise.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Budget OK - Reste: {(remaining - amountNum).toLocaleString()} DH
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Description:</Label>
                  <Textarea
                    placeholder="Décrivez la dépense..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-background"
                  />
                </div>

                <Button
                  className="w-full mt-4 gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => handleStepChange(4, `Saisie montant: ${amount} DH, description: ${description}`)}
                  disabled={!amount || !description}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Receipt Upload */}
          {step === 4 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-amber-600" />
                  Justificatif Obligatoire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Photographiez le reçu ou la facture.
                </p>

                {!receiptUploaded ? (
                  <button
                    onClick={handleReceiptUpload}
                    className={cn(
                      "w-full h-40 rounded-xl border-2 border-dashed transition-all",
                      "border-amber-300 bg-amber-100/50 dark:bg-amber-900/20",
                      "hover:border-amber-400 hover:bg-amber-200/50",
                      "flex flex-col items-center justify-center gap-3"
                    )}
                  >
                    <Upload className="h-10 w-10 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Cliquez pour capturer
                    </span>
                  </button>
                ) : (
                  <div className="w-full h-40 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Justificatif capturé
                    </span>
                  </div>
                )}

                <Button
                  className="w-full mt-4 gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => handleStepChange(5, 'Justificatif photo téléchargé')}
                  disabled={!receiptUploaded}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Submit */}
          {step === 5 && (
            <Card
              className={cn(
                "border",
                budgetExceeded
                  ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
                  : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2
                    className={cn(
                      "h-5 w-5",
                      budgetExceeded ? "text-amber-600" : "text-emerald-600"
                    )}
                  />
                  Récapitulatif
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    budgetExceeded
                      ? "bg-amber-100/50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800"
                      : "bg-emerald-100/50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800"
                  )}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Catégorie:</span>
                      <Badge variant="outline">{category}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Montant:</span>
                      <span className="font-bold font-mono">
                        {amountNum.toLocaleString()} DH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Description:</span>
                      <span className="text-right max-w-[200px] truncate">
                        {description}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Justificatif:</span>
                      <Badge className="bg-emerald-500">✓ Validé</Badge>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span>Statut Budget:</span>
                      {budgetExceeded ? (
                        <Badge className="bg-amber-500">
                          ⚠️ Approbation CEO
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500">✓ OK</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  className={cn(
                    "w-full gap-2",
                    budgetExceeded
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-emerald-500 hover:bg-emerald-600"
                  )}
                  onClick={handleSubmit}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {budgetExceeded
                    ? 'Soumettre pour Approbation'
                    : 'Valider la Dépense'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Coach Panel */}
        <div className="max-w-2xl mx-auto w-full mt-4">
          <AICoachPanel
            feedback={lastFeedback}
            isCoaching={isCoaching}
            averageScore={averageScore}
          />
          {scenario && (
            <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">
                🎲 <strong>Scénario dynamique:</strong> {scenario.context || scenario.description || 'Scénario AI généré'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
