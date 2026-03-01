import { useState, useMemo } from 'react';
import { BonCommande } from '@/hooks/useSalesWorkflow';
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
  isBefore,
  startOfDay,
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

  // Month summary
  const monthSummary = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    let deliveries = 0;
    let totalVolume = 0;
    ordersByDate.forEach((orders, dateKey) => {
      const d = new Date(dateKey);
      if (d >= monthStart && d <= monthEnd) {
        deliveries += orders.length;
        totalVolume += orders.reduce((sum, o) => sum + o.volume_m3, 0);
      }
    });
    return { deliveries, totalVolume };
  }, [ordersByDate, currentMonth]);

  const today = startOfDay(new Date());

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
      <div className="lg:col-span-2" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 24,
      }}>
        <div className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-white font-medium">
              <CalendarIcon className="h-5 w-5 text-[#FDB913]" />
              {oc.deliveryCalendar}
            </h3>
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
        </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {oc.dayNames.map((day: string) => (
              <div key={day} style={{ fontSize: 11, fontWeight: 500, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }} className="text-center py-2">
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
              const isPast = isBefore(day, today) && !isDayToday;
              const dayOfWeek = day.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className="text-left transition-all duration-150 hover:bg-white/5 rounded-md cursor-pointer"
                  style={{
                    minHeight: 80,
                    padding: 8,
                    borderRadius: 8,
                    border: `1px solid ${isSelected ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)'}`,
                    background: isSelected ? 'rgba(253,185,19,0.06)' : isDayToday ? 'rgba(253,185,19,0.04)' : isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent',
                    opacity: isCurrentMonth ? 1 : 0.3,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: isDayToday ? '#FDB913' : isPast ? 'rgba(255,255,255,0.3)' : 'rgba(226,232,240,0.7)' }}>
                    {format(day, 'd')}
                  </div>
                  
                  {dayOrders.length > 0 && (
                    <div className="space-y-0.5">
                      {dayOrders.slice(0, 3).map((order) => (
                        <div
                          key={order.bc_id}
                          style={{
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            color: 'rgba(253,185,19,0.8)',
                            background: 'linear-gradient(90deg, rgba(253,185,19,0.15), rgba(253,185,19,0.08))',
                            borderLeft: '2px solid #FDB913',
                          }}
                          className="truncate"
                        >
                          {order.volume_m3}m³
                        </div>
                      ))}
                      {dayOrders.length > 3 && (
                        <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', paddingLeft: 4 }}>
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
          <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded" style={{ background: '#FDB913' }} />
              <span style={{ color: 'rgba(148,163,184,0.5)' }}>{oc.ready}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded" style={{ background: '#F59E0B' }} />
              <span style={{ color: 'rgba(148,163,184,0.5)' }}>{oc.inProduction}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded" style={{ background: '#10B981' }} />
              <span style={{ color: 'rgba(148,163,184,0.5)' }}>{oc.completedDelivered}</span>
            </div>
          </div>
      </div>

      {/* Selected Date Details */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 24,
      }}>
        <h4 className="text-sm font-medium text-white pb-2">
            {selectedDate
              ? format(selectedDate, 'EEEE d MMMM', { locale: dateLocale })
              : oc.selectDate
            }
        </h4>
          {!selectedDate ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-white/70 mb-1">{format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}</p>
              <p className="text-sm font-medium text-amber-400">{monthSummary.deliveries} {oc.deliveriesLabel} · {monthSummary.totalVolume}m³ {oc.totalLabel}</p>
              <p className="text-sm mt-3 text-muted-foreground">{oc.clickDateToView}</p>
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
      </div>
    </div>
  );
}
