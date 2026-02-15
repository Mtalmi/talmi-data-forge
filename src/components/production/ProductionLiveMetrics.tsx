import { useMemo } from 'react';
import { TrendingUp, AlertTriangle, Clock, Truck, Package } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isToday, isBefore, set, parseISO } from 'date-fns';


interface BonProduction {
  bl_id: string;
  date_livraison: string;
  volume_m3: number;
  heure_prevue?: string | null;
  workflow_status: string | null;
  camion_assigne?: string | null;
  chauffeur_nom?: string | null;
}

interface Stock {
  materiau: string;
  quantite: number;
  seuil: number;
  unite: string;
}

interface ProductionLiveMetricsProps {
  bons: BonProduction[];
  selectedDate: Date;
  dailyTarget?: number;
  stocks?: Stock[];
  avgConsumptionPerM3?: {
    ciment: number;
    sable: number;
    gravette: number;
    adjuvant: number;
  };
  className?: string;
}

export function ProductionLiveMetrics({
  bons,
  selectedDate,
  dailyTarget = 100,
  stocks = [],
  avgConsumptionPerM3 = { ciment: 350, sable: 0.4, gravette: 0.45, adjuvant: 3 },
  className,
}: ProductionLiveMetricsProps) {
  const isViewingToday = isToday(selectedDate);
  const currentHour = new Date().getHours();

  // Calculate cumulative volume metrics
  const volumeMetrics = useMemo(() => {
    const produced = bons
      .filter(b => b.workflow_status === 'validation_technique')
      .reduce((sum, b) => sum + b.volume_m3, 0);
    
    const inProgress = bons
      .filter(b => b.workflow_status === 'production')
      .reduce((sum, b) => sum + b.volume_m3, 0);
    
    const planned = bons
      .filter(b => b.workflow_status === 'planification')
      .reduce((sum, b) => sum + b.volume_m3, 0);
    
    const totalPlanned = produced + inProgress + planned;
    const percentComplete = dailyTarget > 0 ? (produced / dailyTarget) * 100 : 0;
    
    return { produced, inProgress, planned, totalPlanned, percentComplete };
  }, [bons, dailyTarget]);

  // Find late orders (past their scheduled hour but not completed)
  const lateOrders = useMemo(() => {
    if (!isViewingToday) return [];
    
    return bons.filter(bon => {
      if (bon.workflow_status === 'validation_technique') return false;
      if (!bon.heure_prevue) return false;
      
      const scheduledHour = parseInt(bon.heure_prevue.split(':')[0], 10);
      return scheduledHour < currentHour;
    });
  }, [bons, currentHour, isViewingToday]);

  // Calculate material autonomy (hours remaining based on stock)
  const materialAutonomy = useMemo(() => {
    const remainingVolume = volumeMetrics.inProgress + volumeMetrics.planned;
    if (remainingVolume === 0) return null;

    const autonomyData: { material: string; hoursRemaining: number; critical: boolean }[] = [];

    // Calculate hours of work remaining (assume 8 m³/hour production rate)
    const productionRate = 8; // m³ per hour
    const hoursOfWorkRemaining = remainingVolume / productionRate;

    stocks.forEach(stock => {
      let consumptionPerM3 = 0;
      
      if (stock.materiau.toLowerCase().includes('ciment')) {
        consumptionPerM3 = avgConsumptionPerM3.ciment / 1000; // Convert kg to tons
      } else if (stock.materiau.toLowerCase().includes('sable')) {
        consumptionPerM3 = avgConsumptionPerM3.sable;
      } else if (stock.materiau.toLowerCase().includes('gravette') || stock.materiau.toLowerCase().includes('gravier')) {
        consumptionPerM3 = avgConsumptionPerM3.gravette;
      } else if (stock.materiau.toLowerCase().includes('adjuvant')) {
        consumptionPerM3 = avgConsumptionPerM3.adjuvant;
      }

      if (consumptionPerM3 > 0) {
        const volumeCapacity = stock.quantite / consumptionPerM3;
        const hoursCapacity = volumeCapacity / productionRate;
        
        autonomyData.push({
          material: stock.materiau,
          hoursRemaining: Math.round(hoursCapacity),
          critical: hoursCapacity < hoursOfWorkRemaining,
        });
      }
    });

    return autonomyData;
  }, [stocks, volumeMetrics, avgConsumptionPerM3]);

  // Orders without truck assigned
  const unassignedTrucks = useMemo(() => {
    return bons.filter(b => 
      b.workflow_status === 'planification' && 
      !b.camion_assigne
    ).length;
  }, [bons]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Cumulative Volume */}
        <div className="bg-card border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Production Jour</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-primary">{volumeMetrics.produced.toFixed(0)}</span>
            <span className="text-sm text-muted-foreground">/ {dailyTarget} m³</span>
          </div>
          <Progress value={volumeMetrics.percentComplete} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>+{volumeMetrics.inProgress.toFixed(0)} en cours</span>
            <span>{volumeMetrics.percentComplete.toFixed(0)}%</span>
          </div>
        </div>

        {/* Work Queue */}
        <div className="bg-card border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">File d'Attente</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-500">{volumeMetrics.planned.toFixed(0)}</span>
            <span className="text-sm text-muted-foreground">m³ à produire</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {bons.filter(b => b.workflow_status === 'planification').length} commandes
          </div>
        </div>

        {/* Truck Assignment Status */}
        <div className="bg-card border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Truck className={cn("h-4 w-4", unassignedTrucks > 0 ? "text-warning" : "text-success")} />
            <span className="text-xs text-muted-foreground">Toupies Assignées</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-bold",
              unassignedTrucks > 0 ? "text-warning" : "text-success"
            )}>
              {bons.filter(b => b.camion_assigne).length}
            </span>
            <span className="text-sm text-muted-foreground">
              / {bons.filter(b => b.workflow_status !== 'validation_technique').length}
            </span>
          </div>
          {unassignedTrucks > 0 && (
            <Badge variant="outline" className="text-warning border-warning/30 text-[10px] mt-1">
              {unassignedTrucks} sans toupie
            </Badge>
          )}
        </div>

        {/* Late Orders Alert */}
        <div className={cn(
          "border rounded-lg p-3",
          lateOrders.length > 0 ? "bg-destructive/5 border-destructive/30" : "bg-card"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className={cn("h-4 w-4", lateOrders.length > 0 ? "text-destructive" : "text-muted-foreground")} />
            <span className="text-xs text-muted-foreground">Retards</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-bold",
              lateOrders.length > 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {lateOrders.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {lateOrders.length === 1 ? 'commande' : 'commandes'}
            </span>
          </div>
          {isViewingToday && lateOrders.length === 0 && (
            <span className="text-[10px] text-success">✓ Tout à l'heure</span>
          )}
          {!isViewingToday && (
            <span className="text-[10px] text-muted-foreground">Données historiques</span>
          )}
        </div>
      </div>

      {/* Late Orders Banner */}
      {isViewingToday && lateOrders.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium text-sm text-destructive">
              {lateOrders.length} commande{lateOrders.length > 1 ? 's' : ''} en retard
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lateOrders.slice(0, 5).map(order => (
              <Badge 
                key={order.bl_id} 
                variant="outline" 
                className="bg-background border-destructive/30 text-destructive"
              >
                {order.bl_id} • {order.heure_prevue} • {order.volume_m3}m³
                {order.camion_assigne && (
                  <span className="ml-1 text-muted-foreground">🚛 {order.camion_assigne}</span>
                )}
              </Badge>
            ))}
            {lateOrders.length > 5 && (
              <Badge variant="secondary">+{lateOrders.length - 5} autres</Badge>
            )}
          </div>
        </div>
      )}

      {/* Material Autonomy Warning */}
      {materialAutonomy && materialAutonomy.some(m => m.critical) && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="font-medium text-sm text-warning">Autonomie Matériaux Limitée</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {materialAutonomy
              .filter(m => m.critical)
              .map(m => (
                <div key={m.material} className="flex items-center gap-1">
                  <span className="text-muted-foreground">{m.material}:</span>
                  <span className="font-semibold text-warning">~{m.hoursRemaining}h</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
