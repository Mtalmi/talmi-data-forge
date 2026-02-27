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
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Scale,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Camion {
  id_camion: string;
  immatriculation: string | null;
  chauffeur: string | null;
  statut: string;
  capacite_m3: number | null;
}

interface BonLivraison {
  bl_id: string;
  volume_m3: number;
  toupie_assignee: string | null;
  workflow_status: string;
}

interface FleetCapacityOptimizerProps {
  camions: Camion[];
  bons: BonLivraison[];
  compact?: boolean;
  demoPreset?: 'planning';
}

interface TruckLoad {
  camion: Camion;
  assignedVolume: number;
  utilizationPct: number;
  deliveryCount: number;
  status: 'optimal' | 'underutilized' | 'overloaded' | 'idle';
}

export function FleetCapacityOptimizer({
  camions,
  bons,
  compact = false,
  demoPreset,
}: FleetCapacityOptimizerProps) {
  const { truckLoads, summary } = useMemo(() => {
    if (demoPreset === 'planning') {
      return {
        truckLoads: [
          {
            camion: { id_camion: 'TOU-01', immatriculation: 'TOU-01', chauffeur: 'Hassan Amrani', statut: 'En Livraison', capacite_m3: 100 },
            assignedVolume: 75,
            utilizationPct: 75,
            deliveryCount: 2,
            status: 'optimal' as const,
          },
          {
            camion: { id_camion: 'TOU-02', immatriculation: 'TOU-02', chauffeur: 'Youssef Bakkali', statut: 'Disponible', capacite_m3: 100 },
            assignedVolume: 60,
            utilizationPct: 60,
            deliveryCount: 2,
            status: 'optimal' as const,
          },
          {
            camion: { id_camion: 'TOU-03', immatriculation: 'TOU-03', chauffeur: 'Omar Tahiri', statut: 'Maintenance', capacite_m3: 100 },
            assignedVolume: 45,
            utilizationPct: 45,
            deliveryCount: 1,
            status: 'underutilized' as const,
          },
        ],
        summary: {
          totalCapacity: 300,
          totalAssigned: 180,
          avgUtilization: 60,
          activeCount: 2,
          idleCount: 1,
          overloadedCount: 0,
        },
      };
    }

    const loads: TruckLoad[] = camions.map(camion => {
      const assignedBons = bons.filter(b => 
        b.toupie_assignee === camion.id_camion &&
        !['livre', 'annule'].includes(b.workflow_status)
      );
      
      const assignedVolume = assignedBons.reduce((sum, b) => sum + b.volume_m3, 0);
      const capacity = camion.capacite_m3 || 8;
      const utilizationPct = (assignedVolume / capacity) * 100;
      
      let status: TruckLoad['status'];
      if (assignedBons.length === 0) {
        status = 'idle';
      } else if (utilizationPct > 100) {
        status = 'overloaded';
      } else if (utilizationPct < 50) {
        status = 'underutilized';
      } else {
        status = 'optimal';
      }
      
      return {
        camion,
        assignedVolume,
        utilizationPct: Math.min(utilizationPct, 150),
        deliveryCount: assignedBons.length,
        status,
      };
    });

    const activeTrucks = loads.filter(l => l.status !== 'idle');
    const totalCapacity = camions.reduce((sum, c) => sum + (c.capacite_m3 || 8), 0);
    const totalAssigned = loads.reduce((sum, l) => sum + l.assignedVolume, 0);
    const avgUtilization = activeTrucks.length > 0
      ? activeTrucks.reduce((sum, l) => sum + l.utilizationPct, 0) / activeTrucks.length
      : 0;

    return {
      truckLoads: loads.sort((a, b) => b.utilizationPct - a.utilizationPct),
      summary: {
        totalCapacity,
        totalAssigned,
        avgUtilization,
        activeCount: activeTrucks.length,
        idleCount: loads.filter(l => l.status === 'idle').length,
        overloadedCount: loads.filter(l => l.status === 'overloaded').length,
      },
    };
  }, [camions, bons, demoPreset]);

  const getStatusColor = (status: TruckLoad['status']) => {
    switch (status) {
      case 'optimal': return 'text-success';
      case 'underutilized': return 'text-warning';
      case 'overloaded': return 'text-destructive';
      case 'idle': return 'text-muted-foreground';
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct > 100) return 'bg-destructive';
    if (pct >= 70) return 'bg-success';
    if (pct >= 40) return 'bg-warning';
    return 'bg-muted';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{Math.round(summary.avgUtilization)}%</span>
        </div>
        <div className="flex gap-1">
          {summary.overloadedCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {summary.overloadedCount} surchargé
            </Badge>
          )}
          {summary.idleCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {summary.idleCount} disponible
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid #1E2D4A' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4" style={{ color: '#D4A843' }} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#D4A843' }}>Capacité Flotte</span>
        </div>
        <span className="font-mono text-xs text-white/40">
          {summary.totalAssigned}/{summary.totalCapacity} m³
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center mb-4">
        <div className="p-2 rounded-lg bg-[#D4A843]/10">
          <p className="text-lg font-mono font-normal text-[#D4A843]">{summary.activeCount}</p>
          <p className="text-[10px] text-white/40 uppercase">Actifs</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.04]">
          <p className="text-lg font-mono font-normal text-white/60">{summary.idleCount}</p>
          <p className="text-[10px] text-white/40 uppercase">Disponibles</p>
        </div>
        <div className={cn(
          "p-2 rounded-lg",
          summary.overloadedCount > 0 ? "bg-red-400/10" : "bg-white/[0.04]"
        )}>
          <p className={cn(
            "text-lg font-mono font-normal",
            summary.overloadedCount > 0 ? "text-red-400" : "text-white/60"
          )}>
            {summary.overloadedCount}
          </p>
          <p className="text-[10px] text-white/40 uppercase">Surchargés</p>
        </div>
      </div>

      {/* Truck Bars */}
      <div className="space-y-2">
        {truckLoads.slice(0, 6).map(({ camion, assignedVolume, utilizationPct, deliveryCount, status }) => (
          <Tooltip key={camion.id_camion}>
            <TooltipTrigger asChild>
              <div className="space-y-1 cursor-default">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className={cn("h-3 w-3", getStatusColor(status))} />
                    <span className="font-mono text-white/60">{camion.id_camion}</span>
                  </div>
                  <span className={cn("font-mono font-normal", getStatusColor(status))}>
                    {Math.round(utilizationPct)}%
                  </span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all", getProgressColor(utilizationPct))}
                    style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-[#111B2E] text-white border-white/10">
              <div className="space-y-1 text-xs">
                <p className="font-semibold">{camion.chauffeur || 'Sans chauffeur'}</p>
                <p>Volume: {assignedVolume} / {camion.capacite_m3 || 8} m³</p>
                <p>Livraisons: {deliveryCount}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Average Utilization */}
      <div className="pt-3 mt-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/40">Utilisation moyenne</span>
          <span className={cn(
            "font-mono font-normal",
            summary.avgUtilization >= 70 ? "text-emerald-400" :
            summary.avgUtilization >= 40 ? "text-[#D4A843]" : "text-white/40"
          )}>
            {Math.round(summary.avgUtilization)}%
          </span>
        </div>
      </div>
    </div>
  );
}
