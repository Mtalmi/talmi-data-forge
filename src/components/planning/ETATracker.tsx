import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Clock, Navigation, MapPin, AlertTriangle } from 'lucide-react';
import { format, addMinutes, parseISO, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface ETATrackerProps {
  departureTime: string | null;
  scheduledTime: string | null;
  zoneCode?: string | null;
  status: string;
  deliveryDate: string;
}

const ZONE_TRAVEL_TIMES: Record<string, number> = {
  'Z1': 15,
  'Z2': 25,
  'Z3': 40,
  'Z4': 60,
  'default': 30,
};

export function ETATracker({
  departureTime,
  scheduledTime,
  zoneCode,
  status,
  deliveryDate,
}: ETATrackerProps) {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const s = t.etaTracker;

  const eta = useMemo(() => {
    const travelTime = zoneCode ? (ZONE_TRAVEL_TIMES[zoneCode] || ZONE_TRAVEL_TIMES.default) : ZONE_TRAVEL_TIMES.default;

    if (departureTime && (status === 'en_livraison' || status === 'en_chargement')) {
      const departure = parseISO(departureTime);
      const estimatedArrival = addMinutes(departure, travelTime);
      const now = new Date();
      const minutesRemaining = differenceInMinutes(estimatedArrival, now);
      
      return {
        arrivalTime: estimatedArrival,
        minutesRemaining: Math.max(0, minutesRemaining),
        isLate: minutesRemaining < -10,
        isOnTime: minutesRemaining >= -10 && minutesRemaining <= 15,
        hasStarted: true,
        travelTime,
      };
    }

    if (scheduledTime) {
      try {
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const scheduledDate = new Date(deliveryDate);
        scheduledDate.setHours(hours, minutes, 0, 0);
        const estimatedArrival = addMinutes(scheduledDate, travelTime);
        
        return {
          arrivalTime: estimatedArrival,
          minutesRemaining: null,
          isLate: false,
          isOnTime: true,
          hasStarted: false,
          travelTime,
        };
      } catch {
        return null;
      }
    }

    return null;
  }, [departureTime, scheduledTime, zoneCode, status, deliveryDate]);

  if (!eta) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{s.timeNotSet}</span>
      </div>
    );
  }

  if (status === 'livre') {
    return (
      <Badge variant="outline" className="border-success/50 text-success gap-1">
        <MapPin className="h-3 w-3" />
        {s.delivered}
      </Badge>
    );
  }

  if (eta.hasStarted) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium",
            eta.isLate
              ? "bg-destructive/20 text-destructive"
              : eta.minutesRemaining !== null && eta.minutesRemaining <= 5
                ? "bg-success/20 text-success"
                : "bg-primary/20 text-primary"
          )}>
            <Navigation className="h-3 w-3 animate-pulse" />
            {eta.isLate ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {s.late}
              </span>
            ) : (
              <span>
                ETA: {eta.minutesRemaining} min
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <p>{s.estimatedArrival}: {format(eta.arrivalTime, 'HH:mm', { locale: dateLocale || undefined })}</p>
            <p>{s.travelTime}: ~{eta.travelTime} min</p>
            {zoneCode && <p>{s.zone}: {zoneCode}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-xs">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span>{s.scheduledAt} {format(eta.arrivalTime, 'HH:mm')}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <p>{s.scheduledDeparture}: {scheduledTime}</p>
          <p>{s.estimatedTravel}: ~{eta.travelTime} min</p>
          {zoneCode && <p>{s.zone}: {zoneCode}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
