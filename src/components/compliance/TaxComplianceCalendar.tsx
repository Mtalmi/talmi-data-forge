import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, XCircle, Clock, CheckCircle2 } from 'lucide-react';
import { TaxObligation, ObligationType } from '@/hooks/useTaxCompliance';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface TaxComplianceCalendarProps {
  obligations: TaxObligation[];
  onPayObligation: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500', paid: 'bg-green-500', overdue: 'bg-destructive', partially_paid: 'bg-blue-500',
};

const TYPE_ABBREV: Record<ObligationType, string> = {
  cnss: 'CNSS', mutuelle: 'MUT', ir: 'IR', tva: 'TVA', timbre: 'TIM', patente: 'PAT', taxe_professionnelle: 'TP', other: 'AUT',
};

export function TaxComplianceCalendar({ obligations, onPayObligation }: TaxComplianceCalendarProps) {
  const { t, lang } = useI18n();
  const tc = t.taxCalendar;
  const dateLocale = getDateLocale(lang);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const monthObligations = obligations.filter(o => isSameMonth(new Date(o.due_date), currentMonth));
  const selectedObligations = selectedDate ? obligations.filter(o => isSameDay(new Date(o.due_date), selectedDate)) : [];

  const obligationDates = obligations.reduce((acc, ob) => {
    const dateKey = ob.due_date;
    if (!acc[dateKey]) acc[dateKey] = { pending: 0, paid: 0, overdue: 0, partially_paid: 0 };
    acc[dateKey][ob.status]++;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">{tc.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-medium min-w-[150px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: dateLocale || undefined })}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single" selected={selectedDate} onSelect={setSelectedDate} month={currentMonth} onMonthChange={setCurrentMonth}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              hasObligation: (date) => !!obligationDates[format(date, 'yyyy-MM-dd')],
              hasOverdue: (date) => (obligationDates[format(date, 'yyyy-MM-dd')]?.overdue || 0) > 0,
              hasPending: (date) => (obligationDates[format(date, 'yyyy-MM-dd')]?.pending || 0) > 0,
              hasPaid: (date) => { const d = obligationDates[format(date, 'yyyy-MM-dd')]; return (d?.paid || 0) > 0 && !d?.overdue && !d?.pending; },
            }}
            modifiersClassNames={{
              hasOverdue: 'bg-destructive/20 text-destructive font-bold',
              hasPending: 'bg-amber-500/20 text-amber-700 font-bold',
              hasPaid: 'bg-green-500/20 text-green-700',
            }}
          />
          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-destructive/50" /><span>{tc.legendOverdue}</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500/50" /><span>{tc.legendToPay}</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500/50" /><span>{tc.legendPaid}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: dateLocale || undefined }) : tc.selectDate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-muted-foreground text-sm">{tc.clickToSee}</p>
          ) : selectedObligations.length === 0 ? (
            <p className="text-muted-foreground text-sm">{tc.noObligationDate}</p>
          ) : (
            <div className="space-y-3">
              {selectedObligations.map(ob => (
                <div key={ob.id} className={`p-3 rounded-lg border ${ob.status === 'overdue' ? 'border-destructive bg-destructive/5' : ob.status === 'pending' ? 'border-amber-500 bg-amber-500/5' : 'border-green-500 bg-green-500/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={ob.status === 'paid' ? 'default' : ob.status === 'overdue' ? 'destructive' : 'secondary'}>{TYPE_ABBREV[ob.obligation_type]}</Badge>
                    {ob.status === 'paid' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : ob.status === 'overdue' ? <XCircle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-amber-500" />}
                  </div>
                  <p className="font-medium text-sm">{ob.name}</p>
                  <p className="font-bold mt-1">{Number(ob.amount).toLocaleString()} DH</p>
                  {ob.status === 'overdue' && <p className="text-xs text-destructive mt-1">+{Number(ob.penalty_amount).toLocaleString()} DH {tc.colPenalty.toLowerCase()}</p>}
                  {ob.status !== 'paid' && (
                    <Button variant={ob.status === 'overdue' ? 'destructive' : 'outline'} size="sm" className="w-full mt-2" onClick={() => onPayObligation(ob.id)}>{tc.pay}</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-lg">{tc.obligationsMonth} - {format(currentMonth, 'MMMM yyyy', { locale: dateLocale || undefined })}</CardTitle>
        </CardHeader>
        <CardContent>
          {monthObligations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{tc.noObligationMonth}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">{tc.colDate}</th>
                    <th className="text-left p-2">{tc.colType}</th>
                    <th className="text-left p-2">{tc.colObligation}</th>
                    <th className="text-right p-2">{tc.colAmount}</th>
                    <th className="text-right p-2">{tc.colPenalty}</th>
                    <th className="text-center p-2">{tc.colStatus}</th>
                    <th className="text-right p-2">{tc.colAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthObligations.map(ob => (
                    <tr key={ob.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{format(new Date(ob.due_date), 'dd/MM', { locale: dateLocale || undefined })}</td>
                      <td className="p-2"><Badge variant="outline">{TYPE_ABBREV[ob.obligation_type]}</Badge></td>
                      <td className="p-2">{ob.name}</td>
                      <td className="p-2 text-right font-medium">{Number(ob.amount).toLocaleString()} DH</td>
                      <td className="p-2 text-right text-destructive">{Number(ob.penalty_amount) > 0 ? `${Number(ob.penalty_amount).toLocaleString()} DH` : '-'}</td>
                      <td className="p-2 text-center">
                        <Badge variant={ob.status === 'paid' ? 'default' : ob.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {ob.status === 'paid' ? tc.statusPaid : ob.status === 'overdue' ? tc.statusOverdue : ob.status === 'partially_paid' ? tc.statusPartial : tc.statusToPay}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        {ob.status !== 'paid' && <Button variant="ghost" size="sm" onClick={() => onPayObligation(ob.id)}>{tc.pay}</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
