import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Banknote,
  Building2,
  AlertTriangle,
  Shield,
  Calculator,
  ArrowRight,
  CheckCircle,
  XCircle,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCashPaymentControls, CashPaymentValidation } from '@/hooks/useCashPaymentControls';
import { toast } from 'sonner';

interface CashPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string;
  expenseReference: string;
  amount: number;
  description: string;
  onConfirm: (method: string, fournisseurId?: string, fournisseurNom?: string, overrideReason?: string) => void;
}

export function CashPaymentDialog({
  open,
  onOpenChange,
  expenseId,
  expenseReference,
  amount,
  description,
  onConfirm,
}: CashPaymentDialogProps) {
  const { suppliers, canOverride, validateCashPayment, CASH_LIMIT } = useCashPaymentControls();
  const [paymentMethod, setPaymentMethod] = useState<'especes' | 'virement' | 'cheque'>('virement');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [validation, setValidation] = useState<CashPaymentValidation | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validate when supplier or payment method changes
  useEffect(() => {
    const validate = async () => {
      if (paymentMethod === 'especes') {
        const result = await validateCashPayment(amount, selectedSupplier || null);
        setValidation(result);
      } else {
        setValidation(null);
      }
    };
    validate();
  }, [paymentMethod, selectedSupplier, amount, validateCashPayment]);

  const handleConfirm = async () => {
    setLoading(true);
    
    const supplier = suppliers.find(s => s.id === selectedSupplier);
    
    if (paymentMethod === 'especes' && validation?.penaltyApplicable && showOverrideForm) {
      // Override scenario
      if (!overrideReason || overrideReason.length < 10) {
        toast.error('Raison obligatoire (minimum 10 caractères)');
        setLoading(false);
        return;
      }
      onConfirm('Espèces', selectedSupplier, supplier?.nom_fournisseur, overrideReason);
    } else {
      // Normal payment
      const methodLabel = paymentMethod === 'especes' ? 'Espèces' : paymentMethod === 'virement' ? 'Virement' : 'Chèque';
      onConfirm(methodLabel, selectedSupplier, supplier?.nom_fournisseur);
    }
    
    setLoading(false);
    onOpenChange(false);
  };

  const isBlocked = paymentMethod === 'especes' && validation?.penaltyApplicable && !showOverrideForm;
  const canProceed = paymentMethod !== 'especes' || 
    (validation?.isAllowed) || 
    (showOverrideForm && overrideReason.length >= 10);

  const limitUsagePercent = validation 
    ? Math.min(100, (validation.currentMonthlyTotal / CASH_LIMIT) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            Méthode de Paiement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Expense Info */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Référence:</span>
              <span className="font-mono">{expenseReference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant:</span>
              <span className="font-mono font-bold text-lg">
                {amount.toLocaleString('fr-FR')} DH
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-1">{description}</p>
          </div>

          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label>Fournisseur (optionnel mais recommandé)</Label>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le fournisseur..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nom_fournisseur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Méthode de Paiement</Label>
            <div className="grid grid-cols-3 gap-3">
              {/* Bank Transfer - Recommended */}
              <button
                type="button"
                onClick={() => setPaymentMethod('virement')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  paymentMethod === 'virement'
                    ? "border-success bg-success/10 shadow-[0_0_15px_hsl(var(--success)/0.3)]"
                    : "border-border hover:border-success/50 hover:bg-success/5"
                )}
              >
                <Building2 className={cn(
                  "h-6 w-6",
                  paymentMethod === 'virement' ? "text-success" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium">Virement</span>
                <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">
                  Recommandé
                </Badge>
              </button>

              {/* Check */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cheque')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  paymentMethod === 'cheque'
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <TrendingUp className={cn(
                  "h-6 w-6",
                  paymentMethod === 'cheque' ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium">Chèque</span>
              </button>

              {/* Cash */}
              <button
                type="button"
                onClick={() => setPaymentMethod('especes')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  paymentMethod === 'especes'
                    ? "border-warning bg-warning/10"
                    : "border-border hover:border-warning/50 hover:bg-warning/5"
                )}
              >
                <Banknote className={cn(
                  "h-6 w-6",
                  paymentMethod === 'especes' ? "text-warning" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium">Espèces</span>
                {amount > 50000 && (
                  <Badge variant="destructive" className="text-[10px]">
                    Interdit
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* Cash Payment Validation */}
          {paymentMethod === 'especes' && validation && (
            <div className="space-y-4">
              {/* Current Supplier Monthly Usage */}
              {selectedSupplier && (
                <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Cumul mensuel fournisseur:
                    </span>
                    <span className={cn(
                      "font-mono font-semibold",
                      limitUsagePercent >= 80 ? "text-destructive" : 
                      limitUsagePercent >= 60 ? "text-warning" : "text-success"
                    )}>
                      {validation.currentMonthlyTotal.toLocaleString('fr-FR')} / {CASH_LIMIT.toLocaleString('fr-FR')} DH
                    </span>
                  </div>
                  <Progress
                    value={limitUsagePercent}
                    className={cn(
                      "h-2",
                      limitUsagePercent >= 80 ? "[&>div]:bg-destructive" :
                      limitUsagePercent >= 60 ? "[&>div]:bg-warning" : "[&>div]:bg-success"
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    Restant: {(CASH_LIMIT - validation.currentMonthlyTotal).toLocaleString('fr-FR')} DH
                  </p>
                </div>
              )}

              {/* Warning Message */}
              {validation.warningMessage && !validation.penaltyApplicable && (
                <Alert className="border-warning/50 bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-sm text-warning">
                    {validation.warningMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Blocking Message */}
              {validation.blockingReason && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm text-destructive font-medium">
                    {validation.blockingReason}
                  </AlertDescription>
                </Alert>
              )}

              {/* Penalty Calculation */}
              {validation.penaltyApplicable && (
                <div className="p-4 rounded-xl border-2 border-destructive/50 bg-destructive/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-5 w-5 text-destructive" />
                    <span className="font-semibold text-destructive">
                      ⚠️ PÉNALITÉ APPLICABLE
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant mensuel cumulé:</span>
                      <span className="font-mono">{validation.newMonthlyTotal.toLocaleString('fr-FR')} DH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dépassement:</span>
                      <span className="font-mono text-destructive font-medium">
                        {validation.excessAmount.toLocaleString('fr-FR')} DH
                      </span>
                    </div>
                    <hr className="border-border/50" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pénalité 6%:</span>
                      <span className="font-mono text-destructive">
                        {validation.penaltyAmount.toFixed(2)} DH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Droit de timbre 0.25%:</span>
                      <span className="font-mono text-destructive">
                        {validation.stampDutyAmount.toFixed(2)} DH
                      </span>
                    </div>
                    <hr className="border-destructive/30" />
                    <div className="flex justify-between font-semibold">
                      <span>COÛT TOTAL DE LA PÉNALITÉ:</span>
                      <span className="font-mono text-destructive text-lg">
                        {validation.totalPenaltyCost.toFixed(2)} DH
                      </span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30">
                    <p className="text-sm text-success flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        💡 Utilisez un virement bancaire pour éviter cette pénalité
                      </span>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full border-success text-success hover:bg-success/20"
                      onClick={() => setPaymentMethod('virement')}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Changer pour Virement
                    </Button>
                  </div>

                  {/* Override Option (CEO/Karim only) */}
                  {canOverride && !showOverrideForm && (
                    <div className="mt-4 pt-4 border-t border-destructive/30">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-warning text-warning hover:bg-warning/10"
                        onClick={() => setShowOverrideForm(true)}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Procéder malgré la pénalité (Override CEO)
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Override Form */}
              {showOverrideForm && canOverride && (
                <div className="p-4 rounded-xl border-2 border-warning/50 bg-warning/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-warning" />
                    <span className="font-semibold text-warning">
                      Approbation CEO - Dépassement Autorisé
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Raison de l'approbation (obligatoire)</Label>
                      <Textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Ex: Fournisseur exige paiement en espèces, différence acceptable..."
                        className="mt-1"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum 10 caractères ({overrideReason.length}/10)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bank Transfer Benefits */}
          {paymentMethod === 'virement' && (
            <div className="p-4 rounded-xl border border-success/30 bg-success/5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="font-medium text-success">Virement Bancaire - Recommandé</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>✓ Aucune pénalité</li>
                <li>✓ Aucun droit de timbre</li>
                <li>✓ Transaction traçable</li>
                <li>✓ Documentation audit-ready</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              className={cn(
                "flex-1",
                !canProceed && "opacity-50 cursor-not-allowed"
              )}
              disabled={!canProceed || loading}
              onClick={handleConfirm}
            >
              {loading ? (
                "Traitement..."
              ) : paymentMethod === 'virement' ? (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Confirmer Virement
                </>
              ) : showOverrideForm ? (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Approuver et Continuer
                </>
              ) : (
                <>
                  <Banknote className="h-4 w-4 mr-2" />
                  Confirmer Paiement
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
