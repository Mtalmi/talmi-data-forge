import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PartialPayment {
  id: string;
  montant_paye: number;
  mode_paiement: string;
  reference_paiement: string | null;
  date_paiement: string;
  notes: string | null;
  created_by_name: string | null;
  created_at: string;
}

interface PartialPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factureId: string;
  totalTTC: number;
  existingPayments: PartialPayment[];
  onSuccess?: () => void;
}

const PAYMENT_MODES = [
  { value: 'virement', label: 'Virement Bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'especes', label: 'Espèces' },
  { value: 'traite', label: 'Traite' },
  { value: 'effet', label: 'Effet de Commerce' },
];

export function PartialPaymentDialog({
  open, onOpenChange, factureId, totalTTC, existingPayments, onSuccess
}: PartialPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('virement');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const totalPaid = existingPayments.reduce((sum, p) => sum + Number(p.montant_paye), 0);
  const remaining = totalTTC - totalPaid;
  const progressPct = totalTTC > 0 ? (totalPaid / totalTTC) * 100 : 0;

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Montant invalide');
      return;
    }
    if (numAmount > remaining + 0.01) {
      toast.error(`Le montant dépasse le reste à payer (${remaining.toLocaleString()} DH)`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('paiements_partiels').insert({
        facture_id: factureId,
        montant_paye: numAmount,
        mode_paiement: mode,
        reference_paiement: reference || null,
        notes: notes || null,
      });

      if (error) throw error;

      // If fully paid, update facture status
      if (totalPaid + numAmount >= totalTTC - 0.01) {
        await supabase.from('factures').update({ statut: 'payee' }).eq('facture_id', factureId);
      }

      toast.success(`Paiement de ${numAmount.toLocaleString()} DH enregistré`);
      setAmount('');
      setReference('');
      setNotes('');
      onSuccess?.();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error('Erreur lors de l\'enregistrement du paiement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Paiement — {factureId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression du paiement</span>
              <span className="font-mono font-medium">{progressPct.toFixed(0)}%</span>
            </div>
            <Progress value={progressPct} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Payé: <span className="font-mono text-success">{totalPaid.toLocaleString()} DH</span></span>
              <span>Reste: <span className="font-mono text-warning">{remaining.toLocaleString()} DH</span></span>
            </div>
          </div>

          <Separator />

          {/* Payment history */}
          {existingPayments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Historique ({existingPayments.length})
              </Label>
              <div className="max-h-32 overflow-y-auto space-y-1.5">
                {existingPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-success" />
                      <span className="font-mono">{Number(p.montant_paye).toLocaleString()} DH</span>
                      <Badge variant="outline" className="text-[10px]">
                        {PAYMENT_MODES.find(m => m.value === p.mode_paiement)?.label || p.mode_paiement}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(p.date_paiement), 'dd/MM/yy')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* New payment form */}
          {remaining > 0.01 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Montant (DH)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={`Max: ${remaining.toLocaleString()}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mode de paiement</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Référence (optionnel)</Label>
                <Input
                  placeholder="N° chèque, référence virement..."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes (optionnel)</Label>
                <Textarea
                  placeholder="Commentaires..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-16"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="font-semibold text-success">Facture entièrement payée</p>
                <p className="text-xs text-muted-foreground">Tous les paiements ont été enregistrés.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          {remaining > 0.01 && (
            <Button onClick={handleSave} disabled={saving || !amount} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              Enregistrer le paiement
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
