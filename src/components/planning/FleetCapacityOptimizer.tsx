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
}: FleetCapacityOptimizerProps) {
  const { truckLoads, summary } = useMemo(() => {
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
  }, [camions, bons]);

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Capacité Flotte
          </div>
          <Badge variant="outline" className="font-mono">
            {summary.totalAssigned}/{summary.totalCapacity} m³
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-success/10">
            <p className="text-lg font-bold text-success">{summary.activeCount}</p>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </div>
          <div className="p-2 rounded-lg bg-muted">
            <p className="text-lg font-bold">{summary.idleCount}</p>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            summary.overloadedCount > 0 ? "bg-destructive/10" : "bg-muted"
          )}>
            <p className={cn(
              "text-lg font-bold",
              summary.overloadedCount > 0 ? "text-destructive" : ""
            )}>
              {summary.overloadedCount}
            </p>
            <p className="text-xs text-muted-foreground">Surchargés</p>
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
                      <span className="font-mono">{camion.id_camion}</span>
                    </div>
                    <span className={cn("font-medium", getStatusColor(status))}>
                      {Math.round(utilizationPct)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all", getProgressColor(utilizationPct))}
                      style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
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
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Utilisation moyenne</span>
            <span className={cn(
              "font-bold",
              summary.avgUtilization >= 70 ? "text-success" :
              summary.avgUtilization >= 40 ? "text-warning" : "text-muted-foreground"
            )}>
              {Math.round(summary.avgUtilization)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
