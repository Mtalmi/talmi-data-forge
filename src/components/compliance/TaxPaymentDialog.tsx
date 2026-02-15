import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { TaxObligation } from '@/hooks/useTaxCompliance';
import { useTaxCompliance } from '@/hooks/useTaxCompliance';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface TaxPaymentDialogProps {
  obligationId: string;
  obligations: TaxObligation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TaxPaymentDialog({ 
  obligationId, 
  obligations, 
  open, 
  onOpenChange,
  onSuccess 
}: TaxPaymentDialogProps) {
  const { recordPayment, calculatePenalty } = useTaxCompliance();
  const { t, lang } = useI18n();
  const tp = t.taxPayment;
  const dateLocale = getDateLocale(lang);
  
  const obligation = obligations.find(o => o.id === obligationId);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paidAmount: obligation ? Number(obligation.amount) - Number(obligation.paid_amount) : 0,
    paidDate: format(new Date(), 'yyyy-MM-dd'),
    paymentReference: '',
    paymentMethod: 'virement',
    notes: '',
  });

  if (!obligation) return null;

  const remainingAmount = Number(obligation.amount) - Number(obligation.paid_amount);
  const isOverdue = obligation.status === 'overdue';
  const penalty = isOverdue ? Number(obligation.penalty_amount) : 0;
  const totalWithPenalty = formData.paidAmount + penalty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await recordPayment(obligationId, {
      paidAmount: formData.paidAmount,
      paidDate: formData.paidDate,
      paymentReference: formData.paymentReference,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
    });

    setLoading(false);

    if (success) {
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tp.title}
            {isOverdue && <Badge variant="destructive">{tp.overdue}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tp.obligation}:</span>
              <span className="font-medium">{obligation.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tp.dueDate}:</span>
              <span>{format(new Date(obligation.due_date), 'dd MMM yyyy', { locale: dateLocale })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tp.amount}:</span>
              <span className="font-medium">{Number(obligation.amount).toLocaleString()} DH</span>
            </div>
            {Number(obligation.paid_amount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tp.alreadyPaid}:</span>
                <span className="text-green-600">{Number(obligation.paid_amount).toLocaleString()} DH</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">{tp.remaining}:</span>
              <span className="font-bold">{remainingAmount.toLocaleString()} DH</span>
            </div>
          </div>

          {isOverdue && penalty > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">{tp.penaltyTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {obligation.days_overdue} {tp.penaltyDesc}
                </p>
                <p className="font-bold text-destructive mt-1">
                  +{penalty.toLocaleString()} DH
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paidAmount">{tp.paidAmount}</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  step="0.01"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                  max={remainingAmount}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidDate">{tp.paymentDate}</Label>
                <Input
                  id="paidDate"
                  type="date"
                  value={formData.paidDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">{tp.paymentMethod}</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tp.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virement">{tp.bankTransfer}</SelectItem>
                    <SelectItem value="cheque">{tp.cheque}</SelectItem>
                    <SelectItem value="especes">{tp.cash}</SelectItem>
                    <SelectItem value="prelevement">{tp.directDebit}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentReference">{tp.reference}</Label>
                <Input
                  id="paymentReference"
                  value={formData.paymentReference}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentReference: e.target.value }))}
                  placeholder={tp.referencePlaceholder}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{tp.notesOptional}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={tp.notesPlaceholder}
                rows={2}
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex justify-between items-center">
              <span className="font-medium">{tp.totalToPay}:</span>
              <span className="text-2xl font-bold text-primary">
                {totalWithPenalty.toLocaleString()} DH
              </span>
            </div>
            {penalty > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {tp.principalLabel}: {formData.paidAmount.toLocaleString()} DH + {tp.penaltyLabel}: {penalty.toLocaleString()} DH
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tp.cancel}
            </Button>
            <Button type="submit" disabled={loading || formData.paidAmount <= 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tp.saving}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {tp.save}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
