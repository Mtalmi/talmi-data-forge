import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Clock, Navigation, MapPin, AlertTriangle } from 'lucide-react';
import { format, addMinutes, parseISO, differenceInMinutes, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ETATrackerProps {
  departureTime: string | null; // heure_depart_centrale (timestamp)
  scheduledTime: string | null; // heure_prevue (time)
  zoneCode?: string | null;
  status: string;
  deliveryDate: string;
}

// Estimated travel times by zone (in minutes) - could be from DB later
const ZONE_TRAVEL_TIMES: Record<string, number> = {
  'Z1': 15,   // Zone proche
  'Z2': 25,   // Zone moyenne
  'Z3': 40,   // Zone éloignée
  'Z4': 60,   // Zone très éloignée
  'default': 30,
};

export function ETATracker({
  departureTime,
  scheduledTime,
  zoneCode,
  status,
  deliveryDate,
}: ETATrackerProps) {
  const eta = useMemo(() => {
    const travelTime = zoneCode ? (ZONE_TRAVEL_TIMES[zoneCode] || ZONE_TRAVEL_TIMES.default) : ZONE_TRAVEL_TIMES.default;

    // If already departed, calculate ETA from departure
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

    // If not departed yet, calculate expected ETA from scheduled time
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
        <span>Heure non définie</span>
      </div>
    );
  }

  // Status-based display
  if (status === 'livre') {
    return (
      <Badge variant="outline" className="border-success/50 text-success gap-1">
        <MapPin className="h-3 w-3" />
        Livré
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
                Retard
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
            <p>Arrivée estimée: {format(eta.arrivalTime, 'HH:mm', { locale: fr })}</p>
            <p>Temps de trajet: ~{eta.travelTime} min</p>
            {zoneCode && <p>Zone: {zoneCode}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Not started yet
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-xs">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span>Prévu {format(eta.arrivalTime, 'HH:mm')}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <p>Départ prévu: {scheduledTime}</p>
          <p>Trajet estimé: ~{eta.travelTime} min</p>
          {zoneCode && <p>Zone: {zoneCode}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
