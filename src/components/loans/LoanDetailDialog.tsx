import { Loan, LoanPayment } from '@/hooks/useLoans';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, differenceInDays } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { ArrowDownLeft, ArrowUpRight, Calendar, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoanDetailDialogProps {
  loan: Loan;
  payments: LoanPayment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentClick: (payment: LoanPayment) => void;
}

export function LoanDetailDialog({ loan, payments, open, onOpenChange, onPaymentClick }: LoanDetailDialogProps) {
  const { lang, t } = useI18n();
  const ld = t.loanDetail;
  const dateLocale = getDateLocale(lang);
  const paidPayments = payments.filter(p => p.status === 'paid').length;
  const progress = (paidPayments / loan.term_months) * 100;
  const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'paid' || p.status === 'partial' ? Number(p.actual_amount) : 0), 0);
  const outstanding = Number(loan.principal_amount) - totalPaid;
  const today = new Date();

  const getPaymentStatus = (payment: LoanPayment) => {
    if (payment.status === 'paid') return 'paid';
    if (new Date(payment.due_date) < today) return 'overdue';
    return 'pending';
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { active: ld.active, paid_off: ld.paidOff, defaulted: ld.defaulted, cancelled: ld.cancelled };
    return map[s] || s;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {loan.loan_type === 'to_company' ? <ArrowDownLeft className="h-5 w-5 text-amber-500" /> : <ArrowUpRight className="h-5 w-5 text-emerald-500" />}
            {loan.loan_number}
          </DialogTitle>
          <DialogDescription>{loan.associate_name} • {loan.associate_relationship}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div><p className="text-xs text-muted-foreground">{ld.principal}</p><p className="font-semibold">{Number(loan.principal_amount).toLocaleString('fr-MA')} DH</p></div>
                <div><p className="text-xs text-muted-foreground">{ld.annualRate}</p><p className="font-semibold">{(Number(loan.interest_rate) * 100).toFixed(1)}%</p></div>
                <div><p className="text-xs text-muted-foreground">{ld.monthly}</p><p className="font-semibold">{Number(loan.monthly_payment).toLocaleString('fr-MA')} DH</p></div>
                <div>
                  <p className="text-xs text-muted-foreground">{ld.status}</p>
                  <Badge variant={loan.status === 'active' ? 'default' : loan.status === 'paid_off' ? 'secondary' : loan.status === 'defaulted' ? 'destructive' : 'outline'}>
                    {statusLabel(loan.status)}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><p className="text-xs text-muted-foreground">{ld.period}</p><p className="text-sm">{format(new Date(loan.start_date), 'dd MMM yyyy', { locale: dateLocale })} → {format(new Date(loan.end_date), 'dd MMM yyyy', { locale: dateLocale })}</p></div>
                <div><p className="text-xs text-muted-foreground">{ld.outstanding}</p><p className="font-semibold text-lg text-amber-500">{outstanding.toLocaleString('fr-MA')} DH</p></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs"><span>{ld.progress} {paidPayments}/{loan.term_months} {ld.installments}</span><span>{Math.round(progress)}%</span></div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />{ld.schedule}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-2">
                  {payments.map((payment) => {
                    const status = getPaymentStatus(payment);
                    const daysLate = status === 'overdue' ? differenceInDays(today, new Date(payment.due_date)) : 0;
                    return (
                      <div key={payment.id} className={cn("flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors", status === 'paid' && "bg-emerald-500/10", status === 'overdue' && "bg-destructive/10", status === 'pending' && "bg-muted/50 hover:bg-muted")} onClick={() => onPaymentClick(payment)}>
                        <div className="flex items-center gap-3">
                          {status === 'paid' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : status === 'overdue' ? <XCircle className="h-5 w-5 text-destructive" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                          <div>
                            <p className="font-medium text-sm">{ld.installment} #{payment.payment_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(payment.due_date), 'dd MMM yyyy', { locale: dateLocale })}
                              {status === 'overdue' && <span className="text-destructive ml-2">({daysLate} {ld.daysLate})</span>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{Number(payment.scheduled_amount).toLocaleString('fr-MA')} DH</p>
                          {status === 'paid' && payment.paid_date && <p className="text-xs text-emerald-500">{ld.paidOn} {format(new Date(payment.paid_date), 'dd/MM/yyyy')}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {loan.notes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />{ld.notes}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{loan.notes}</p></CardContent>
            </Card>
          )}

          <div className="flex justify-end"><Button variant="outline" onClick={() => onOpenChange(false)}>{ld.close}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
