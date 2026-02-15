import { useState, useMemo } from 'react';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Package,
  Clock,
  MapPin,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface OrderCalendarViewProps {
  bcList: BonCommande[];
  onSelectBc: (bc: BonCommande) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pret_production: 'bg-primary',
  en_production: 'bg-warning',
  termine: 'bg-success',
  livre: 'bg-success',
  annule: 'bg-destructive',
};

export function OrderCalendarView({ bcList, onSelectBc }: OrderCalendarViewProps) {
  const { t, lang } = useI18n();
  const oc = t.orderCalendar;
  const dateLocale = getDateLocale(lang);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Group orders by date
  const ordersByDate = useMemo(() => {
    const map = new Map<string, BonCommande[]>();
    
    bcList.forEach(bc => {
      if (bc.date_livraison_souhaitee) {
        const dateKey = format(new Date(bc.date_livraison_souhaitee), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, bc]);
      }
    });
    
    return map;
  }, [bcList]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Get orders for selected date
  const selectedDateOrders = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return ordersByDate.get(dateKey) || [];
  }, [selectedDate, ordersByDate]);

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {oc.deliveryCalendar}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                {oc.today}
              </Button>
              <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
              </span>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {oc.dayNames.map((day: string) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayOrders = ordersByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isDayToday = isToday(day);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[80px] p-1 rounded-lg border transition-all text-left",
                    !isCurrentMonth && "opacity-40",
                    isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
                    isDayToday && !isSelected && "border-primary/50",
                    !isSelected && "hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isDayToday && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  {dayOrders.length > 0 && (
                    <div className="space-y-0.5">
                      {dayOrders.slice(0, 3).map((order, i) => (
                        <div
                          key={order.bc_id}
                          className={cn(
                            "text-[10px] px-1 py-0.5 rounded truncate text-white",
                            STATUS_COLORS[order.statut] || 'bg-muted'
                          )}
                        >
                          {order.volume_m3}m³
                        </div>
                      ))}
                      {dayOrders.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{dayOrders.length - 3} {oc.others}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-primary" />
              <span>{oc.ready}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-warning" />
              <span>{oc.inProduction}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-success" />
              <span>{oc.completedDelivered}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {selectedDate
              ? format(selectedDate, 'EEEE d MMMM', { locale: dateLocale })
              : oc.selectDate
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{oc.clickDateToView}</p>
            </div>
          ) : selectedDateOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{oc.noOrdersPlanned}</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-2">
                {selectedDateOrders.map(bc => (
                  <button
                    key={bc.bc_id}
                    onClick={() => onSelectBc(bc)}
                    className="w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-medium text-sm">{bc.bc_id}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          bc.statut === 'pret_production' && "bg-primary/10 text-primary",
                          bc.statut === 'en_production' && "bg-warning/10 text-warning",
                          (bc.statut === 'termine' || bc.statut === 'livre') && "bg-success/10 text-success"
                        )}
                      >
                        {bc.statut === 'pret_production' && oc.ready}
                        {bc.statut === 'en_production' && oc.production}
                        {(bc.statut === 'termine' || bc.statut === 'livre') && oc.delivered}
                      </Badge>
                    </div>
                    
                    <p className="text-sm font-medium truncate">
                      {bc.client?.nom_client || bc.client_id}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {bc.volume_m3} m³
                      </span>
                      {bc.heure_livraison_souhaitee && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {bc.heure_livraison_souhaitee.substring(0, 5)}
                        </span>
                      )}
                    </div>
                    
                    {bc.adresse_livraison && (
                      <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {bc.adresse_livraison}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
