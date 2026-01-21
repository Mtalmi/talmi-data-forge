import { useMemo } from 'react';
import { Clock, Factory, CheckCircle, Play, AlertTriangle, User, MapPin } from 'lucide-react';
import { format, parseISO, isToday, isBefore, isAfter, set } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BonProduction {
  bl_id: string;
  date_livraison: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  heure_prevue?: string | null;
  workflow_status: string | null;
  bc_id?: string | null;
  client?: { nom_client: string } | null;
  bon_commande?: {
    client_nom: string | null;
  } | null;
}

interface DailyProductionTimelineProps {
  bons: BonProduction[];
  selectedDate: Date;
  onSelectBon?: (bon: BonProduction) => void;
  onStartProduction?: (bon: BonProduction) => void;
  className?: string;
}

// Generate hours from 6:00 to 18:00
const WORK_HOURS = Array.from({ length: 13 }, (_, i) => i + 6);

export function DailyProductionTimeline({
  bons,
  selectedDate,
  onSelectBon,
  onStartProduction,
  className,
}: DailyProductionTimelineProps) {
  const currentHour = new Date().getHours();
  const isViewingToday = isToday(selectedDate);

  // Group bons by hour
  const bonsByHour = useMemo(() => {
    const grouped: Record<number, BonProduction[]> = {};
    
    // Initialize all work hours
    WORK_HOURS.forEach(hour => {
      grouped[hour] = [];
    });

    // Group bons that have heure_prevue
    bons.forEach(bon => {
      if (bon.heure_prevue) {
        const hour = parseInt(bon.heure_prevue.split(':')[0], 10);
        if (grouped[hour]) {
          grouped[hour].push(bon);
        } else {
          // If hour is outside work hours, put in closest slot
          const closestHour = hour < 6 ? 6 : hour > 18 ? 18 : hour;
          grouped[closestHour] = grouped[closestHour] || [];
          grouped[closestHour].push(bon);
        }
      }
    });

    // Bons without scheduled time go to "Non planifié"
    const unscheduled = bons.filter(bon => !bon.heure_prevue);

    return { grouped, unscheduled };
  }, [bons]);

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case 'planification':
        return { 
          label: 'À Démarrer', 
          color: 'bg-blue-500', 
          textColor: 'text-blue-600',
          bgLight: 'bg-blue-500/10',
          icon: Clock 
        };
      case 'production':
        return { 
          label: 'En Cours', 
          color: 'bg-warning', 
          textColor: 'text-warning',
          bgLight: 'bg-warning/10',
          icon: Factory 
        };
      case 'validation_technique':
        return { 
          label: 'À Valider', 
          color: 'bg-purple-500', 
          textColor: 'text-purple-600',
          bgLight: 'bg-purple-500/10',
          icon: CheckCircle 
        };
      default:
        return { 
          label: 'En Attente', 
          color: 'bg-muted', 
          textColor: 'text-muted-foreground',
          bgLight: 'bg-muted/50',
          icon: Clock 
        };
    }
  };

  const totalBons = bons.length;
  const completedBons = bons.filter(b => b.workflow_status === 'validation_technique').length;
  const inProgressBons = bons.filter(b => b.workflow_status === 'production').length;
  const pendingBons = bons.filter(b => b.workflow_status === 'planification').length;

  return (
    <div className={cn("bg-card border rounded-lg overflow-hidden", className)}>
      {/* Header with summary */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Planning Horaire</h3>
          </div>
          <Badge variant="outline" className="font-mono">
            {format(selectedDate, 'EEEE d MMM', { locale: fr })}
          </Badge>
        </div>
        
        {/* Quick stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">À faire:</span>
            <span className="font-semibold">{pendingBons}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">En cours:</span>
            <span className="font-semibold">{inProgressBons}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-muted-foreground">À valider:</span>
            <span className="font-semibold">{completedBons}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-2">
          {/* Unscheduled orders first if any */}
          {bonsByHour.unscheduled.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">Sans heure programmée</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {bonsByHour.unscheduled.length}
                </Badge>
              </div>
              <div className="space-y-2 pl-6">
                {bonsByHour.unscheduled.map(bon => (
                  <BonTimelineCard
                    key={bon.bl_id}
                    bon={bon}
                    statusConfig={getStatusConfig(bon.workflow_status)}
                    onSelect={() => onSelectBon?.(bon)}
                    onStart={() => onStartProduction?.(bon)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hourly timeline */}
          {WORK_HOURS.map(hour => {
            const hourBons = bonsByHour.grouped[hour] || [];
            const isPastHour = isViewingToday && hour < currentHour;
            const isCurrentHour = isViewingToday && hour === currentHour;
            const isFutureHour = isViewingToday && hour > currentHour;
            const hasOrders = hourBons.length > 0;

            return (
              <div 
                key={hour} 
                className={cn(
                  "relative",
                  isCurrentHour && "bg-primary/5 rounded-lg -mx-2 px-2"
                )}
              >
                {/* Hour marker */}
                <div className={cn(
                  "flex items-center gap-3 py-2",
                  isPastHour && !hasOrders && "opacity-40"
                )}>
                  {/* Time indicator */}
                  <div className={cn(
                    "w-14 flex-shrink-0 text-right",
                    isCurrentHour && "font-bold text-primary"
                  )}>
                    <span className="font-mono text-sm">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>

                  {/* Timeline dot and line */}
                  <div className="relative flex flex-col items-center">
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 z-10",
                      isCurrentHour && "bg-primary border-primary animate-pulse",
                      isPastHour && hasOrders && "bg-success border-success",
                      isPastHour && !hasOrders && "bg-muted border-muted-foreground/30",
                      isFutureHour && hasOrders && "bg-blue-500 border-blue-500",
                      isFutureHour && !hasOrders && "bg-background border-muted-foreground/30",
                      !isViewingToday && hasOrders && "bg-primary border-primary",
                      !isViewingToday && !hasOrders && "bg-muted border-muted-foreground/30"
                    )} />
                    {hour < 18 && (
                      <div className={cn(
                        "absolute top-3 w-0.5 h-full",
                        isPastHour ? "bg-success/30" : "bg-muted"
                      )} />
                    )}
                  </div>

                  {/* Hour label or orders */}
                  <div className="flex-1 min-w-0">
                    {hasOrders ? (
                      <div className="space-y-2">
                        {hourBons.map(bon => (
                          <BonTimelineCard
                            key={bon.bl_id}
                            bon={bon}
                            statusConfig={getStatusConfig(bon.workflow_status)}
                            onSelect={() => onSelectBon?.(bon)}
                            onStart={() => onStartProduction?.(bon)}
                            isCurrentHour={isCurrentHour}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">
                        {isPastHour ? '—' : 'Disponible'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      {totalBons === 0 && (
        <div className="p-6 text-center border-t">
          <Factory className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune production prévue pour cette journée
          </p>
        </div>
      )}
    </div>
  );
}

interface BonTimelineCardProps {
  bon: BonProduction;
  statusConfig: ReturnType<typeof getStatusConfig>;
  onSelect?: () => void;
  onStart?: () => void;
  isCurrentHour?: boolean;
}

function getStatusConfig(status: string | null) {
  switch (status) {
    case 'planification':
      return { 
        label: 'À Démarrer', 
        color: 'bg-blue-500', 
        textColor: 'text-blue-600',
        bgLight: 'bg-blue-500/10',
        icon: Clock 
      };
    case 'production':
      return { 
        label: 'En Cours', 
        color: 'bg-warning', 
        textColor: 'text-warning',
        bgLight: 'bg-warning/10',
        icon: Factory 
      };
    case 'validation_technique':
      return { 
        label: 'À Valider', 
        color: 'bg-purple-500', 
        textColor: 'text-purple-600',
        bgLight: 'bg-purple-500/10',
        icon: CheckCircle 
      };
    default:
      return { 
        label: 'En Attente', 
        color: 'bg-muted', 
        textColor: 'text-muted-foreground',
        bgLight: 'bg-muted/50',
        icon: Clock 
      };
  }
}

function BonTimelineCard({ 
  bon, 
  statusConfig, 
  onSelect, 
  onStart,
  isCurrentHour 
}: BonTimelineCardProps) {
  const StatusIcon = statusConfig.icon;
  const clientName = bon.bon_commande?.client_nom || bon.client?.nom_client || bon.client_id;
  const canStart = bon.workflow_status === 'planification';

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-all cursor-pointer",
        "hover:shadow-md hover:border-primary/30",
        statusConfig.bgLight,
        isCurrentHour && "ring-2 ring-primary/20"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          statusConfig.color,
          "text-white"
        )}>
          <StatusIcon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-semibold text-sm">{bon.bl_id}</span>
            <Badge variant="outline" className={cn("text-[10px]", statusConfig.textColor)}>
              {statusConfig.label}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1 truncate">
              <User className="h-3 w-3" />
              {clientName}
            </span>
            <span className="font-mono">{bon.formule_id}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{bon.volume_m3} m³</span>
            
            {canStart && (
              <Button
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onStart?.();
                }}
              >
                <Play className="h-3 w-3" />
                Démarrer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
