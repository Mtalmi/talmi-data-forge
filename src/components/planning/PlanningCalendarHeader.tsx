import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayDeliveryData {
  date: string;
  totalVolume: number;
  count: number;
  statuses: {
    planification: number;
    production: number;
    livre: number;
  };
}

interface PlanningCalendarHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  deliveryData: DayDeliveryData[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanningCalendarHeader({
  selectedDate,
  onDateChange,
  deliveryData,
  isOpen,
  onOpenChange,
}: PlanningCalendarHeaderProps) {
  const currentDate = parseISO(selectedDate);
  const [viewMonth, setViewMonth] = useState(startOfMonth(currentDate));

  // Generate calendar grid (6 weeks x 7 days)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewMonth]);

  // Map delivery data by date for quick lookup
  const deliveryByDate = useMemo(() => {
    const map = new Map<string, DayDeliveryData>();
    deliveryData.forEach(d => map.set(d.date, d));
    return map;
  }, [deliveryData]);

  const goToToday = () => {
    const today = new Date();
    setViewMonth(startOfMonth(today));
    onDateChange(format(today, 'yyyy-MM-dd'));
  };

  const getStatusColor = (statuses: DayDeliveryData['statuses']) => {
    if (statuses.livre > 0 && statuses.production === 0 && statuses.planification === 0) {
      return 'bg-success text-success-foreground';
    }
    if (statuses.production > 0) {
      return 'bg-warning text-warning-foreground';
    }
    return 'bg-primary text-primary-foreground';
  };

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card className="border-primary/20">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Calendrier des Livraisons</h3>
                <p className="text-sm text-muted-foreground">
                  {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Aujourd'hui
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold min-w-[150px] text-center">
                  {format(viewMonth, 'MMMM yyyy', { locale: fr })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="w-[88px]" /> {/* Spacer for balance */}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const data = deliveryByDate.get(dateStr);
                const isSelected = isSameDay(day, currentDate);
                const isCurrentMonth = isSameMonth(day, viewMonth);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={idx}
                    onClick={() => onDateChange(dateStr)}
                    className={cn(
                      "relative min-h-[70px] p-1 rounded-lg border transition-all text-left",
                      "hover:border-primary/50 hover:bg-muted/50",
                      isSelected && "border-primary ring-2 ring-primary/20 bg-primary/5",
                      !isCurrentMonth && "opacity-40",
                      isTodayDate && !isSelected && "border-primary/30"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      isTodayDate && "text-primary",
                      !isCurrentMonth && "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>

                    {/* Delivery badges */}
                    {data && data.count > 0 && (
                      <div className="mt-1 space-y-0.5">
                        <Badge
                          className={cn(
                            "text-[10px] px-1 py-0 h-auto block truncate",
                            getStatusColor(data.statuses)
                          )}
                        >
                          {data.totalVolume}m³
                        </Badge>
                        {data.count > 1 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{data.count - 1} autres
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Planifié</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-warning" />
                <span>En Production</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-success" />
                <span>Livré</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
