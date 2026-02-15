import { useState } from 'react';
import { useLoans, LoanPayment, Loan } from '@/hooks/useLoans';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, differenceInDays } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface LoanPaymentDialogProps {
  payment: LoanPayment;
  loan?: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LoanPaymentDialog({ 
  payment, 
  loan, 
  open, 
  onOpenChange, 
  onSuccess 
}: LoanPaymentDialogProps) {
  const { recordPayment } = useLoans();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const lp = t.loanPayment;
  const dateLocale = getDateLocale(lang);
  
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(payment.scheduled_amount.toString());
  const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const dueDate = new Date(payment.due_date);
  const payDate = new Date(paidDate);
  const daysLate = differenceInDays(payDate, dueDate);
  const isLate = daysLate > 0;
  const lateFee = isLate ? Math.round(payment.scheduled_amount * 0.02 * (daysLate / 30) * 100) / 100 : 0;
  const isPaid = payment.status === 'paid';

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    const result = await recordPayment(payment.id, {
      actual_amount: parseFloat(amount),
      paid_date: paidDate,
      payment_method: paymentMethod,
      payment_reference: reference || undefined,
      notes: notes || undefined,
    }, user?.email || 'Système');
    setLoading(false);
    if (result) { onSuccess(); onOpenChange(false); }
  };

  const statusLabel = payment.status === 'paid' ? lp.paid
    : payment.status === 'late' ? lp.late
    : payment.status === 'partial' ? lp.partial : lp.pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {isPaid ? lp.detailsTitle : lp.recordTitle}
          </DialogTitle>
          <DialogDescription>
            {loan?.loan_number} • Échéance #{payment.payment_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{lp.scheduledAmount}</span>
                <span className="font-semibold">{Number(payment.scheduled_amount).toLocaleString('fr-MA')} DH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{lp.dueDate}</span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(dueDate, 'dd MMM yyyy', { locale: dateLocale })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{lp.status}</span>
                <Badge variant={
                  payment.status === 'paid' ? 'secondary' :
                  payment.status === 'late' ? 'destructive' :
                  payment.status === 'partial' ? 'outline' : 'default'
                }>{statusLabel}</Badge>
              </div>
            </CardContent>
          </Card>

          {isPaid && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {lp.paidOn.replace('{date}', format(new Date(payment.paid_date!), 'dd MMM yyyy', { locale: dateLocale }))}
                {payment.payment_method && ` ${lp.by.replace('{method}', payment.payment_method)}`}
                {payment.days_late > 0 && ` (${lp.daysLateInfo.replace('{days}', String(payment.days_late))})`}
              </AlertDescription>
            </Alert>
          )}

          {!isPaid && (
            <>
              {isLate && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {lp.lateWarning.replace('{days}', String(daysLate))} {lp.latePenalty.replace('{amount}', lateFee.toLocaleString('fr-MA'))}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>{lp.amountPaid}</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>{lp.paymentDate}</Label>
                <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{lp.paymentMethod}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">{lp.bankTransfer}</SelectItem>
                    <SelectItem value="check">{lp.check}</SelectItem>
                    <SelectItem value="cash">{lp.cash}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{lp.reference}</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={lp.refPlaceholder} />
              </div>
              <div className="space-y-2">
                <Label>{lp.notes}</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={lp.notesPlaceholder} rows={2} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>{lp.cancel}</Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? lp.saving : lp.save}
                </Button>
              </div>
            </>
          )}

          {isPaid && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>{lp.close}</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
