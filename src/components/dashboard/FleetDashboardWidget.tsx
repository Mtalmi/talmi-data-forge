import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Truck, Gauge, Fuel, Route, Clock, AlertTriangle,
  Activity, Navigation2, ParkingCircle, Wrench
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface FleetStats {
  totalVehicles: number;
  activeToday: number;
  enLivraison: number;
  disponible: number;
  enMaintenance: number;
  horsService: number;
  avgKmToday: number;
  totalKmToday: number;
  avgFuelLevel: number;
  lowFuelCount: number;
  alertsCount: number;
  utilizationRate: number;
}

export function FleetDashboardWidget() {
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      // Fetch all vehicles
      const { data: vehicles } = await supabase
        .from('flotte')
        .select('id_camion, statut, last_fuel_level_pct, km_compteur, last_gps_update, is_moving');

      // Fetch unack geofence alerts
      const { count: alertsCount } = await supabase
        .from('geofence_events')
        .select('id', { count: 'exact', head: true })
        .eq('acknowledged', false);

      // Fetch today's fuel entries for km tracking
      const today = new Date().toISOString().split('T')[0];
      const { data: fuelEntries } = await supabase
        .from('suivi_carburant')
        .select('id_camion, km_compteur')
        .gte('date_plein', today);

      const allVehicles = vehicles || [];
      const total = allVehicles.length;

      // Count by status
      const statusCounts: Record<string, number> = {};
      allVehicles.forEach(v => {
        statusCounts[v.statut] = (statusCounts[v.statut] || 0) + 1;
      });

      // Active = had GPS update today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const activeToday = allVehicles.filter(v =>
        v.last_gps_update && new Date(v.last_gps_update) >= todayStart
      ).length;

      // Fuel stats
      const fuelLevels = allVehicles
        .map(v => v.last_fuel_level_pct)
        .filter((f): f is number => f !== null && f !== undefined);
      const avgFuel = fuelLevels.length > 0
        ? Math.round(fuelLevels.reduce((a, b) => a + b, 0) / fuelLevels.length)
        : 0;
      const lowFuel = fuelLevels.filter(f => f < 20).length;

      // Utilization = active / available
      const available = total - (statusCounts['Hors service'] || 0) - (statusCounts['En maintenance'] || 0);
      const utilization = available > 0 ? Math.round((activeToday / available) * 100) : 0;

      setStats({
        totalVehicles: total,
        activeToday,
        enLivraison: statusCounts['En Livraison'] || statusCounts['En livraison'] || 0,
        disponible: statusCounts['Disponible'] || 0,
        enMaintenance: statusCounts['En maintenance'] || 0,
        horsService: statusCounts['Hors service'] || 0,
        avgKmToday: 0,
        totalKmToday: 0,
        avgFuelLevel: avgFuel,
        lowFuelCount: lowFuel,
        alertsCount: alertsCount || 0,
        utilizationRate: utilization,
      });
    } catch (err) {
      console.error('Error fetching fleet stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <Card className="bg-card border-border animate-pulse">
        <CardContent className="p-6 h-48" />
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-border hover:shadow-lg hover:shadow-primary/5 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Flotte GPS
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={() => navigate('/logistique')}
          >
            <Navigation2 className="h-3 w-3 mr-1" />
            Carte
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Utilization Gauge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Taux d'utilisation</span>
            <span className={cn(
              "font-bold",
              stats.utilizationRate >= 70 ? "text-emerald-500" : stats.utilizationRate >= 40 ? "text-amber-500" : "text-destructive"
            )}>
              {stats.utilizationRate}%
            </span>
          </div>
          <Progress
            value={stats.utilizationRate}
            className="h-2"
          />
        </div>

        {/* Vehicle Status Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <Activity className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.activeToday}</p>
              <p className="text-[10px] text-muted-foreground">Actifs aujourd'hui</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <Truck className="h-4 w-4 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.enLivraison}</p>
              <p className="text-[10px] text-muted-foreground">En livraison</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <ParkingCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.disponible}</p>
              <p className="text-[10px] text-muted-foreground">Disponibles</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <Wrench className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.enMaintenance}</p>
              <p className="text-[10px] text-muted-foreground">Maintenance</p>
            </div>
          </div>
        </div>

        {/* Alerts & Fuel row */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Fuel className={cn("h-4 w-4", stats.lowFuelCount > 0 ? "text-destructive" : "text-muted-foreground")} />
            <span className="text-xs text-muted-foreground">
              Carburant moy. <span className="font-bold text-foreground">{stats.avgFuelLevel}%</span>
            </span>
            {stats.lowFuelCount > 0 && (
              <Badge variant="destructive" className="text-[9px] px-1.5">
                {stats.lowFuelCount} bas
              </Badge>
            )}
          </div>
          {stats.alertsCount > 0 && (
            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stats.alertsCount} alertes
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
