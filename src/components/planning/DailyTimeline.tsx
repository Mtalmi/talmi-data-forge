import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Clock, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface BonLivraison {
  bl_id: string;
  volume_m3: number;
  heure_prevue: string | null;
  toupie_assignee: string | null;
  workflow_status: string;
  clients?: { nom_client: string } | null;
  client_id: string;
}

interface DailyTimelineProps {
  bons: BonLivraison[];
  startHour?: number;
  endHour?: number;
  onBonClick?: (bon: BonLivraison) => void;
}

const STATUS_COLORS: Record<string, string> = {
  'en_attente_validation': 'bg-amber-500',
  'planification': 'bg-blue-600',
  'production': 'bg-orange-500',
  'en_chargement': 'bg-violet-600',
  'en_livraison': 'bg-rose-600',
  'livre': 'bg-emerald-600',
};

const STATUS_GRADIENTS: Record<string, string> = {
  'en_attente_validation': 'bg-gradient-to-r from-amber-500 to-amber-400',
  'planification': 'bg-gradient-to-r from-blue-600 to-sky-500',
  'production': 'bg-gradient-to-r from-orange-500 to-amber-400',
  'en_chargement': 'bg-gradient-to-r from-violet-600 to-purple-500',
  'en_livraison': 'bg-gradient-to-r from-rose-600 to-pink-500',
  'livre': 'bg-gradient-to-r from-emerald-600 to-teal-500',
};

export function DailyTimeline({
  bons,
  startHour = 6,
  endHour = 20,
  onBonClick,
}: DailyTimelineProps) {
  const { t } = useI18n();
  const hours = useMemo(() => {
    const hrs = [];
    for (let i = startHour; i <= endHour; i++) {
      hrs.push(i);
    }
    return hrs;
  }, [startHour, endHour]);

  const timelineBons = useMemo(() => {
    return bons
      .filter(b => b.heure_prevue)
      .map(bon => {
        const [hours, minutes] = (bon.heure_prevue || '08:00').split(':').map(Number);
        const position = ((hours - startHour) + (minutes / 60)) / (endHour - startHour) * 100;
        return {
          ...bon,
          position: Math.max(0, Math.min(100, position)),
          hour: hours,
        };
      })
      .sort((a, b) => a.hour - b.hour);
  }, [bons, startHour, endHour]);

  // Group by truck for multi-lane view
  const truckLanes = useMemo(() => {
    const lanes = new Map<string, typeof timelineBons>();
    
    timelineBons.forEach(bon => {
      const truck = bon.toupie_assignee || 'non-assigné';
      if (!lanes.has(truck)) {
        lanes.set(truck, []);
      }
      lanes.get(truck)!.push(bon);
    });

    return Array.from(lanes.entries()).sort((a, b) => {
      if (a[0] === 'non-assigné') return 1;
      if (b[0] === 'non-assigné') return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [timelineBons]);

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const nowPosition = ((currentHour - startHour) + (currentMinute / 60)) / (endHour - startHour) * 100;
  const showNowLine = nowPosition >= 0 && nowPosition <= 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          {t.dailyTimeline.title}
          <Badge variant="secondary" className="ml-auto">
            {bons.length} {t.dailyTimeline.deliveries}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Hour labels */}
        <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
          {hours.filter((_, i) => i % 2 === 0).map(hour => (
            <span key={hour} className="w-8 text-center">{hour}h</span>
          ))}
        </div>

        {/* Timeline lanes */}
        <div className="space-y-3">
          {truckLanes.length === 0 ? (
            <div className="h-12 flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              {t.dailyTimeline.noDeliveries}
            </div>
          ) : (
            truckLanes.map(([truck, laneBons]) => (
              <div key={truck} className="relative">
                {/* Truck label */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Truck className="h-3 w-3" />
                  <span className="font-mono">{truck}</span>
                </div>

                  {/* Timeline bar */}
                <div className="relative h-10 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-visible">
                  {/* Hour grid lines */}
                  {hours.map((hour, i) => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"
                      style={{ left: `${(i / (hours.length - 1)) * 100}%` }}
                    />
                  ))}

                  {/* Now indicator */}
                  {showNowLine && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                      style={{ left: `${nowPosition}%` }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/30" />
                    </div>
                  )}

                  {/* Delivery blocks */}
                  {laneBons.map((bon, index) => (
                    <Tooltip key={bon.bl_id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "absolute top-1 bottom-1 rounded-md cursor-pointer transition-all hover:scale-105 hover:z-10 shadow-sm hover:shadow-md",
                            STATUS_GRADIENTS[bon.workflow_status] || 'bg-slate-400',
                            "min-w-[60px] ring-1 ring-white/20"
                          )}
                          style={{ 
                            left: `${bon.position}%`,
                            width: `${Math.max(5, bon.volume_m3 * 1.5)}%`,
                          }}
                          onClick={() => onBonClick?.(bon)}
                        >
                          <div className="px-1.5 h-full flex items-center justify-center text-[10px] font-bold text-white truncate drop-shadow-sm">
                            {bon.volume_m3}m³
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 text-white border-slate-700">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{bon.bl_id}</p>
                          <p>{bon.clients?.nom_client || bon.client_id}</p>
                          <p>Volume: {bon.volume_m3} m³</p>
                          <p>Heure: {bon.heure_prevue}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
          {Object.entries(STATUS_COLORS).slice(0, 5).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs">
              <div className={cn("w-2.5 h-2.5 rounded", color)} />
              <span className="text-muted-foreground capitalize">
                {status.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
