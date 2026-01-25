import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, XCircle, Clock, CheckCircle2 } from 'lucide-react';
import { TaxObligation, ObligationType } from '@/hooks/useTaxCompliance';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaxComplianceCalendarProps {
  obligations: TaxObligation[];
  onPayObligation: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500',
  paid: 'bg-green-500',
  overdue: 'bg-destructive',
  partially_paid: 'bg-blue-500',
};

const TYPE_ABBREV: Record<ObligationType, string> = {
  cnss: 'CNSS',
  mutuelle: 'MUT',
  ir: 'IR',
  tva: 'TVA',
  timbre: 'TIM',
  patente: 'PAT',
  taxe_professionnelle: 'TP',
  other: 'AUT',
};

export function TaxComplianceCalendar({ obligations, onPayObligation }: TaxComplianceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const monthObligations = obligations.filter(o => 
    isSameMonth(new Date(o.due_date), currentMonth)
  );

  const selectedObligations = selectedDate 
    ? obligations.filter(o => isSameDay(new Date(o.due_date), selectedDate))
    : [];

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Get dates that have obligations
  const obligationDates = obligations.reduce((acc, ob) => {
    const dateKey = ob.due_date;
    if (!acc[dateKey]) {
      acc[dateKey] = { pending: 0, paid: 0, overdue: 0, partially_paid: 0 };
    }
    acc[dateKey][ob.status]++;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Calendar View */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Calendrier Fiscal</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[150px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              hasObligation: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return !!obligationDates[dateStr];
              },
              hasOverdue: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return obligationDates[dateStr]?.overdue > 0;
              },
              hasPending: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return obligationDates[dateStr]?.pending > 0;
              },
              hasPaid: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return obligationDates[dateStr]?.paid > 0 && !obligationDates[dateStr]?.overdue && !obligationDates[dateStr]?.pending;
              },
            }}
            modifiersClassNames={{
              hasOverdue: 'bg-destructive/20 text-destructive font-bold',
              hasPending: 'bg-amber-500/20 text-amber-700 font-bold',
              hasPaid: 'bg-green-500/20 text-green-700',
            }}
          />
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <span>En retard</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <span>À payer</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <span>Payé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate 
              ? format(selectedDate, 'dd MMMM yyyy', { locale: fr })
              : 'Sélectionnez une date'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-muted-foreground text-sm">
              Cliquez sur une date pour voir les obligations
            </p>
          ) : selectedObligations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune obligation à cette date
            </p>
          ) : (
            <div className="space-y-3">
              {selectedObligations.map(ob => (
                <div 
                  key={ob.id} 
                  className={`p-3 rounded-lg border ${
                    ob.status === 'overdue' ? 'border-destructive bg-destructive/5' :
                    ob.status === 'pending' ? 'border-amber-500 bg-amber-500/5' :
                    'border-green-500 bg-green-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={ob.status === 'paid' ? 'default' : ob.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {TYPE_ABBREV[ob.obligation_type]}
                    </Badge>
                    {ob.status === 'paid' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : ob.status === 'overdue' ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="font-medium text-sm">{ob.name}</p>
                  <p className="font-bold mt-1">{Number(ob.amount).toLocaleString()} DH</p>
                  
                  {ob.status === 'overdue' && (
                    <p className="text-xs text-destructive mt-1">
                      +{Number(ob.penalty_amount).toLocaleString()} DH pénalité
                    </p>
                  )}
                  
                  {ob.status !== 'paid' && (
                    <Button 
                      variant={ob.status === 'overdue' ? 'destructive' : 'outline'}
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => onPayObligation(ob.id)}
                    >
                      Payer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-lg">
            Obligations - {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthObligations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucune obligation ce mois
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Obligation</th>
                    <th className="text-right p-2">Montant</th>
                    <th className="text-right p-2">Pénalité</th>
                    <th className="text-center p-2">Statut</th>
                    <th className="text-right p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {monthObligations.map(ob => (
                    <tr key={ob.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {format(new Date(ob.due_date), 'dd/MM', { locale: fr })}
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{TYPE_ABBREV[ob.obligation_type]}</Badge>
                      </td>
                      <td className="p-2">{ob.name}</td>
                      <td className="p-2 text-right font-medium">
                        {Number(ob.amount).toLocaleString()} DH
                      </td>
                      <td className="p-2 text-right text-destructive">
                        {Number(ob.penalty_amount) > 0 ? `${Number(ob.penalty_amount).toLocaleString()} DH` : '-'}
                      </td>
                      <td className="p-2 text-center">
                        <Badge 
                          variant={
                            ob.status === 'paid' ? 'default' : 
                            ob.status === 'overdue' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {ob.status === 'paid' ? 'Payé' : 
                           ob.status === 'overdue' ? 'En retard' : 
                           ob.status === 'partially_paid' ? 'Partiel' : 'À payer'}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        {ob.status !== 'paid' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onPayObligation(ob.id)}
                          >
                            Payer
                          </Button>
                        )}
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
