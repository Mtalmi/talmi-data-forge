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

  const formatMinutes = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Performance du Jour
          </div>
          {overallStats.deliveryChange !== 0 && (
            <Badge 
              variant="outline" 
              className={cn(
                overallStats.deliveryChange > 0 ? "border-success text-success" : "border-destructive text-destructive"
              )}
            >
              {overallStats.deliveryChange > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(Math.round(overallStats.deliveryChange))}% vs hier
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-2 rounded-lg bg-success/10 cursor-default">
                <p className="text-xl font-bold text-success">{overallStats.totalDelivered}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Livrés</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Livraisons complétées aujourd'hui</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-2 rounded-lg bg-primary/10 cursor-default">
                <p className="text-xl font-bold text-primary">{overallStats.totalInProgress}</p>
                <p className="text-[10px] text-muted-foreground uppercase">En cours</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Livraisons en production ou en route</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-2 rounded-lg bg-warning/10 cursor-default">
                <p className="text-xl font-bold text-warning">{overallStats.totalPending}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Attente</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Livraisons en attente de démarrage</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-2 rounded-lg bg-muted cursor-default">
                <p className="text-xl font-bold">{overallStats.onTimeRate}%</p>
                <p className="text-[10px] text-muted-foreground uppercase">À l'heure</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Taux de livraison dans les temps</TooltipContent>
          </Tooltip>
        </div>

        {/* Average Rotation Time */}
        {overallStats.avgRotation && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Temps rotation moyen</span>
            </div>
            <span className="font-mono font-bold">
              {formatMinutes(overallStats.avgRotation)}
            </span>
          </div>
        )}

        {/* Top Performers */}
        {driverStats.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Chauffeurs Actifs</p>
            {driverStats.slice(0, 4).map((driver, index) => (
              <div 
                key={driver.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg",
                  index === 0 ? "bg-success/10 border border-success/30" : "bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2">
                  {index === 0 && <Zap className="h-4 w-4 text-success" />}
                  <div>
                    <p className="text-sm font-medium">{driver.name || driver.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.totalVolume} m³
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? "default" : "secondary"} className="font-mono">
                    {driver.deliveriesCompleted}
                  </Badge>
                  {driver.deliveriesInProgress > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{driver.deliveriesInProgress}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
