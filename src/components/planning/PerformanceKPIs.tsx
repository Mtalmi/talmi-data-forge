import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Truck, 
  Target,
  Zap,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BonLivraison {
  bl_id: string;
  toupie_assignee: string | null;
  workflow_status: string;
  heure_depart_centrale: string | null;
  heure_retour_centrale?: string | null;
  temps_rotation_minutes?: number | null;
  volume_m3: number;
}

interface Camion {
  id_camion: string;
  chauffeur: string | null;
}

interface PerformanceKPIsProps {
  bons: BonLivraison[];
  camions: Camion[];
  historicalBons?: BonLivraison[]; // Previous day for comparison
  overrideStats?: { totalDelivered: number; totalInProgress: number; totalPending: number; onTimeRate: number };
}

interface DriverStats {
  id: string;
  name: string | null;
  deliveriesCompleted: number;
  deliveriesInProgress: number;
  avgRotationTime: number | null;
  totalVolume: number;
  efficiency: number;
}

export function PerformanceKPIs({
  bons,
  camions,
  historicalBons = [],
  overrideStats,
}: PerformanceKPIsProps) {
  const { driverStats, overallStats } = useMemo(() => {
    const statsMap = new Map<string, DriverStats>();

    // Initialize all trucks
    camions.forEach(c => {
      statsMap.set(c.id_camion, {
        id: c.id_camion,
        name: c.chauffeur,
        deliveriesCompleted: 0,
        deliveriesInProgress: 0,
        avgRotationTime: null,
        totalVolume: 0,
        efficiency: 0,
      });
    });

    // Calculate stats from today's bons
    const rotationTimes: number[] = [];
    
    bons.forEach(bon => {
      if (!bon.toupie_assignee) return;
      
      const existing = statsMap.get(bon.toupie_assignee);
      if (!existing) return;

      if (bon.workflow_status === 'livre') {
        existing.deliveriesCompleted++;
        existing.totalVolume += bon.volume_m3;
        
        if (bon.temps_rotation_minutes) {
          rotationTimes.push(bon.temps_rotation_minutes);
        }
      } else if (['production', 'en_chargement', 'en_livraison'].includes(bon.workflow_status)) {
        existing.deliveriesInProgress++;
        existing.totalVolume += bon.volume_m3;
      }
    });

    // Calculate averages and efficiency
    const activeDrivers = Array.from(statsMap.values()).filter(
      d => d.deliveriesCompleted > 0 || d.deliveriesInProgress > 0
    );

    const avgRotation = rotationTimes.length > 0
      ? rotationTimes.reduce((a, b) => a + b, 0) / rotationTimes.length
      : null;

    // Overall stats
    const totalDelivered = bons.filter(b => b.workflow_status === 'livre').length;
    const totalInProgress = bons.filter(b => 
      ['production', 'en_chargement', 'en_livraison'].includes(b.workflow_status)
    ).length;
    const totalPending = bons.filter(b => 
      ['planification', 'en_attente_validation'].includes(b.workflow_status)
    ).length;

    // Historical comparison
    const historicalDelivered = historicalBons.filter(b => b.workflow_status === 'livre').length;
    const deliveryChange = historicalDelivered > 0
      ? ((totalDelivered - historicalDelivered) / historicalDelivered) * 100
      : 0;

    return {
      driverStats: activeDrivers.sort((a, b) => b.deliveriesCompleted - a.deliveriesCompleted),
      overallStats: {
        totalDelivered,
        totalInProgress,
        totalPending,
        avgRotation,
        deliveryChange,
        onTimeRate: 95, // Would come from actual data
      },
    };
  }, [bons, camions, historicalBons]);

  const finalOverallStats = overrideStats ? { ...overallStats, ...overrideStats } : overallStats;

  const formatMinutes = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="rounded-xl p-4" style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid #1E2D4A' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: '#D4A843' }} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#D4A843' }}>Performance du Jour</span>
        </div>
        {finalOverallStats.deliveryChange !== 0 && (
          <span className={cn(
            "text-xs font-mono",
            finalOverallStats.deliveryChange > 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {finalOverallStats.deliveryChange > 0 ? '↑' : '↓'} {Math.abs(Math.round(finalOverallStats.deliveryChange))}% vs hier
          </span>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 text-center mb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="px-1.5 py-2 rounded-lg bg-emerald-400/10 cursor-default">
              <p className="text-lg font-mono font-normal text-emerald-400">{finalOverallStats.totalDelivered}</p>
              <p className="text-[9px] text-white/40 uppercase leading-tight">Livrés</p>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-[#111B2E] text-white border-white/10">Livraisons complétées aujourd'hui</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="px-1.5 py-2 rounded-lg bg-blue-400/10 cursor-default">
              <p className="text-lg font-mono font-normal text-blue-400">{finalOverallStats.totalInProgress}</p>
              <p className="text-[9px] text-white/40 uppercase leading-tight">En cours</p>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-[#111B2E] text-white border-white/10">Livraisons en production ou en route</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="px-1.5 py-2 rounded-lg bg-[#D4A843]/10 cursor-default">
              <p className="text-lg font-mono font-normal text-[#D4A843]">{finalOverallStats.totalPending}</p>
              <p className="text-[9px] text-white/40 uppercase leading-tight">Attente</p>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-[#111B2E] text-white border-white/10">Livraisons en attente de démarrage</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="px-1.5 py-2 rounded-lg bg-white/[0.04] cursor-default">
              <p className="text-lg font-mono font-normal text-white/70">{finalOverallStats.onTimeRate}%</p>
              <p className="text-[9px] text-white/40 uppercase leading-tight">À l'heure</p>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-[#111B2E] text-white border-white/10">Taux de livraison dans les temps</TooltipContent>
        </Tooltip>
      </div>

      {/* Average Rotation Time */}
      {overallStats.avgRotation && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-white/30" />
            <span className="text-sm text-white/50">Temps rotation moyen</span>
          </div>
          <span className="font-mono font-normal text-white/70">
            {formatMinutes(overallStats.avgRotation)}
          </span>
        </div>
      )}

      {/* Top Performers */}
      {driverStats.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Chauffeurs Actifs</p>
          {driverStats.slice(0, 4).map((driver, index) => (
            <div 
              key={driver.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                index === 0 ? "bg-emerald-400/10 border border-emerald-400/20" : "bg-white/[0.03]"
              )}
            >
              <div className="flex items-center gap-2">
                {index === 0 && <Zap className="h-4 w-4 text-emerald-400" />}
                <div>
                  <p className="text-sm font-medium text-white/80">{driver.name || driver.id}</p>
                  <p className="text-xs text-white/30 font-mono">
                    {driver.totalVolume} m³
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-mono text-sm px-2 py-0.5 rounded",
                  index === 0 ? "bg-emerald-400/20 text-emerald-400" : "bg-white/[0.06] text-white/50"
                )}>
                  {driver.deliveriesCompleted}
                </span>
                {driver.deliveriesInProgress > 0 && (
                  <span className="text-xs font-mono text-white/30">
                    +{driver.deliveriesInProgress}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
