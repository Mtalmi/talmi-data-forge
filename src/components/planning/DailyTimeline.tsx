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
  'en_attente_validation': 'bg-[#D4A843]',
  'planification': 'bg-white/50',
  'production': 'bg-[#D4A843]',
  'en_chargement': 'bg-blue-400',
  'en_livraison': 'bg-emerald-400',
  'livre': 'bg-emerald-600',
};

const STATUS_GRADIENTS: Record<string, string> = {
  'en_attente_validation': 'bg-gradient-to-r from-[#D4A843] to-[#E8D5A3]',
  'planification': 'bg-gradient-to-r from-white/50 to-white/30',
  'production': 'bg-gradient-to-r from-[#D4A843] to-[#E8D5A3]',
  'en_chargement': 'bg-gradient-to-r from-blue-400 to-blue-300',
  'en_livraison': 'bg-gradient-to-r from-emerald-400 to-emerald-300',
  'livre': 'bg-gradient-to-r from-emerald-600 to-emerald-500',
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

  const STATUS_LABELS: Record<string, string> = {
    'en_attente_validation': 'En Attente Validation',
    'planification': 'Planification',
    'production': 'Production',
    'en_chargement': 'En Chargement',
    'en_livraison': 'En Livraison',
    'livre': 'Livré',
  };

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" style={{ color: '#D4A843' }} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#D4A843' }}>
            {t.dailyTimeline.title}
          </span>
        </div>
        <span className="text-xs font-mono text-white/40">
          {bons.length} {t.dailyTimeline.deliveries}
        </span>
      </div>

      {/* Hour labels */}
      <div className="flex justify-between text-xs text-white/30 mb-2 px-1 font-mono">
        {hours.filter((_, i) => i % 2 === 0).map(hour => (
          <span key={hour} className="w-8 text-center">{hour}h</span>
        ))}
      </div>

      {/* Timeline lanes */}
      <div className="space-y-3">
        {truckLanes.length === 0 ? (
          <div className="h-12 flex items-center justify-center text-sm text-white/30 border border-dashed border-white/[0.08] rounded-lg">
            {t.dailyTimeline.noDeliveries}
          </div>
        ) : (
          truckLanes.map(([truck, laneBons]) => (
            <div key={truck} className="relative">
              {/* Truck label */}
              <div className="flex items-center gap-1 text-xs text-white/40 mb-1">
                <Truck className="h-3 w-3" />
                <span className="font-mono">{truck}</span>
              </div>

              {/* Timeline bar */}
              <div className="relative h-10 bg-white/[0.03] rounded-lg border border-white/[0.06] overflow-visible">
                {/* Hour grid lines */}
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute top-0 bottom-0 w-px bg-white/[0.04]"
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
                          STATUS_GRADIENTS[bon.workflow_status] || 'bg-white/20',
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
                    <TooltipContent className="bg-[#111B2E] text-white border-white/10">
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
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/[0.06]">
        {Object.entries(STATUS_COLORS).slice(0, 5).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs">
            <div className={cn("w-2.5 h-2.5 rounded", color)} />
            <span className="text-white/40">
              {STATUS_LABELS[status] || status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
