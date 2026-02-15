import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, 
  MapPin, 
  Navigation2, 
  RefreshCw, 
  AlertTriangle,
  Fuel,
  Clock,
  CheckCircle,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TruckPosition {
  id_camion: string;
  type: string;
  statut: string;
  chauffeur: string | null;
  capacite_m3: number | null;
  last_known_zone: string | null;
  current_mission: {
    bl_id: string;
    client_nom: string;
    volume_m3: number;
    workflow_status: string;
    zone_nom: string;
  } | null;
  fuel_status: 'normal' | 'warning' | 'alert';
  consumption_pct: number;
  last_activity: string;
}

interface FuelAlert {
  id: string;
  id_camion: string;
  chauffeur: string | null;
  consumption_actual: number;
  consumption_expected: number;
  variance_pct: number;
  detected_at: string;
  km_parcourus: number;
  litres: number;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  'en_livraison': { 
    color: 'bg-success/20 text-success border-success/30', 
    label: 'En Livraison',
    icon: <Navigation2 className="h-3 w-3 animate-pulse" />
  },
  'production': { 
    color: 'bg-primary/20 text-primary border-primary/30', 
    label: 'Production',
    icon: <Activity className="h-3 w-3" />
  },
  'planification': { 
    color: 'bg-warning/20 text-warning border-warning/30', 
    label: 'Planifié',
    icon: <Clock className="h-3 w-3" />
  },
  'Disponible': { 
    color: 'bg-muted text-muted-foreground border-muted', 
    label: 'Disponible',
    icon: <CheckCircle className="h-3 w-3" />
  },
  'Maintenance': { 
    color: 'bg-destructive/20 text-destructive border-destructive/30', 
    label: 'Maintenance',
    icon: <AlertTriangle className="h-3 w-3" />
  },
};

// Expected consumption baseline: 35 L/100km for concrete mixer trucks
const EXPECTED_CONSUMPTION_L_100KM = 35;
const FUEL_VARIANCE_THRESHOLD = 0.20; // 20% above average triggers alert

export function LiveFleetMap() {
  const [trucks, setTrucks] = useState<TruckPosition[]>([]);
  const [fuelAlerts, setFuelAlerts] = useState<FuelAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  const detectFuelTheft = useCallback(async () => {
    try {
      // Get recent fuel entries with consumption data
      const { data: fuelEntries, error } = await supabase
        .from('suivi_carburant')
        .select(`
          id,
          id_camion,
          litres,
          km_parcourus,
          consommation_l_100km,
          created_at
        `)
        .not('consommation_l_100km', 'is', null)
        .not('km_parcourus', 'is', null)
        .gt('km_parcourus', 0)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get truck details for driver names
      const { data: flotte } = await supabase
        .from('flotte')
        .select('id_camion, chauffeur');

      const truckDrivers = new Map(
        (flotte || []).map(f => [f.id_camion, f.chauffeur])
      );

      // Calculate average consumption per truck
      const truckConsumption = new Map<string, number[]>();
      (fuelEntries || []).forEach(entry => {
        if (!truckConsumption.has(entry.id_camion)) {
          truckConsumption.set(entry.id_camion, []);
        }
        truckConsumption.get(entry.id_camion)!.push(entry.consommation_l_100km!);
      });

      const avgConsumption = new Map<string, number>();
      truckConsumption.forEach((values, truckId) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        avgConsumption.set(truckId, avg);
      });

      // Detect anomalies
      const alerts: FuelAlert[] = [];
      (fuelEntries || []).slice(0, 20).forEach(entry => {
        const expected = avgConsumption.get(entry.id_camion) || EXPECTED_CONSUMPTION_L_100KM;
        const actual = entry.consommation_l_100km!;
        const variance = (actual - expected) / expected;

        if (variance > FUEL_VARIANCE_THRESHOLD) {
          alerts.push({
            id: entry.id,
            id_camion: entry.id_camion,
            chauffeur: truckDrivers.get(entry.id_camion) || null,
            consumption_actual: actual,
            consumption_expected: expected,
            variance_pct: variance * 100,
            detected_at: entry.created_at,
            km_parcourus: entry.km_parcourus!,
            litres: entry.litres,
          });
        }
      });

      setFuelAlerts(alerts);
      setActiveAlertCount(alerts.length);

      // Log critical alerts to audit
      if (alerts.length > 0) {
        const criticalAlerts = alerts.filter(a => a.variance_pct > 30);
        if (criticalAlerts.length > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('audit_superviseur').insert(
              criticalAlerts.map(alert => ({
                action: 'FUEL_THEFT_ALERT',
                table_name: 'suivi_carburant',
                user_id: user.id,
                record_id: alert.id,
                new_data: {
                  truck: alert.id_camion,
                  driver: alert.chauffeur,
                  variance_pct: alert.variance_pct.toFixed(1),
                  consumption_actual: alert.consumption_actual.toFixed(1),
                  consumption_expected: alert.consumption_expected.toFixed(1),
                  km: alert.km_parcourus,
                  litres: alert.litres,
                },
              }))
            );
          }
        }
      }
    } catch (error) {
      console.error('Error detecting fuel anomalies:', error);
    }
  }, []);

  const fetchFleetPositions = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get all trucks
      const { data: flotte, error: flotteError } = await supabase
        .from('flotte')
        .select('*')
        .order('id_camion');

      if (flotteError) throw flotteError;

      // Get active deliveries for today
      const { data: bls, error: blsError } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id,
          bc_id,
          volume_m3,
          workflow_status,
          camion_assigne,
          toupie_assignee,
          updated_at,
          clients (nom_client),
          zones_livraison (nom_zone)
        `)
        .eq('date_livraison', today)
        .in('workflow_status', ['planification', 'production', 'validation_technique', 'en_livraison'])
        .or('camion_assigne.not.is.null,toupie_assignee.not.is.null');

      if (blsError) throw blsError;

      // Get fuel consumption data
      const { data: fuelData } = await supabase
        .from('suivi_carburant')
        .select('id_camion, consommation_l_100km')
        .order('created_at', { ascending: false })
        .limit(200);

      // Calculate average consumption per truck
      const avgConsumption = new Map<string, number>();
      const consumptionCounts = new Map<string, { sum: number; count: number }>();
      
      (fuelData || []).forEach(f => {
        if (f.consommation_l_100km) {
          if (!consumptionCounts.has(f.id_camion)) {
            consumptionCounts.set(f.id_camion, { sum: 0, count: 0 });
          }
          const current = consumptionCounts.get(f.id_camion)!;
          current.sum += f.consommation_l_100km;
          current.count += 1;
        }
      });

      consumptionCounts.forEach((val, key) => {
        avgConsumption.set(key, val.sum / val.count);
      });

      // Build truck -> active mission map
      const truckMissions = new Map<string, TruckPosition['current_mission']>();
      (bls || []).forEach(bl => {
        const mission = {
          bl_id: bl.bl_id,
          client_nom: bl.clients?.nom_client || 'Client inconnu',
          volume_m3: bl.volume_m3,
          workflow_status: bl.workflow_status || 'production',
          zone_nom: bl.zones_livraison?.nom_zone || 'Zone inconnue',
        };
        if (bl.camion_assigne) truckMissions.set(bl.camion_assigne, mission);
        if (bl.toupie_assignee) truckMissions.set(bl.toupie_assignee, mission);
      });

      // Build final truck positions
      const positions: TruckPosition[] = (flotte || []).map(truck => {
        const mission = truckMissions.get(truck.id_camion) || null;
        const avgConsump = avgConsumption.get(truck.id_camion) || EXPECTED_CONSUMPTION_L_100KM;
        const varianceRatio = avgConsump / EXPECTED_CONSUMPTION_L_100KM;
        
        let fuelStatus: 'normal' | 'warning' | 'alert' = 'normal';
        if (varianceRatio > 1.3) fuelStatus = 'alert';
        else if (varianceRatio > 1.15) fuelStatus = 'warning';

        return {
          id_camion: truck.id_camion,
          type: truck.type,
          statut: mission?.workflow_status || truck.statut,
          chauffeur: truck.chauffeur,
          capacite_m3: truck.capacite_m3,
          last_known_zone: mission?.zone_nom || null,
          current_mission: mission,
          fuel_status: fuelStatus,
          consumption_pct: Math.min(100, Math.max(0, varianceRatio * 70)),
          last_activity: truck.updated_at || truck.mission_updated_at || new Date().toISOString(),
        };
      });

      setTrucks(positions);
    } catch (error) {
      console.error('Error fetching fleet positions:', error);
      toast.error('Erreur chargement flotte');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFleetPositions(), detectFuelTheft()]);
    setRefreshing(false);
    toast.success('Données flotte actualisées');
  };

  useEffect(() => {
    fetchFleetPositions();
    detectFuelTheft();

    // Realtime subscription
    const channel = supabase
      .channel('fleet-live-map')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bons_livraison_reels' },
        () => fetchFleetPositions()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'flotte' },
        () => fetchFleetPositions()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'suivi_carburant' },
        () => detectFuelTheft()
      )
      .subscribe();

    // Refresh every 30s
    const interval = setInterval(() => {
      fetchFleetPositions();
      detectFuelTheft();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchFleetPositions, detectFuelTheft]);

  const activeTrucks = trucks.filter(t => t.current_mission);
  const idleTrucks = trucks.filter(t => !t.current_mission && t.statut === 'Disponible');
  const maintenanceTrucks = trucks.filter(t => t.statut === 'Maintenance');

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Fleet Predator
                {activeAlertCount > 0 && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    {activeAlertCount} Alertes
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Surveillance GPS & Carburant
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Fleet Overview Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-success/10 rounded-lg border border-success/20">
            <Navigation2 className="h-4 w-4 text-success mx-auto mb-1" />
            <span className="text-lg font-bold">{activeTrucks.length}</span>
            <p className="text-[9px] text-muted-foreground">En Route</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <CheckCircle className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <span className="text-lg font-bold">{idleTrucks.length}</span>
            <p className="text-[9px] text-muted-foreground">Disponibles</p>
          </div>
          <div className="p-2 bg-warning/10 rounded-lg border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning mx-auto mb-1" />
            <span className="text-lg font-bold">{maintenanceTrucks.length}</span>
            <p className="text-[9px] text-muted-foreground">Maintenance</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border",
            activeAlertCount > 0 
              ? "bg-destructive/10 border-destructive/30" 
              : "bg-muted/30 border-transparent"
          )}>
            <Fuel className={cn(
              "h-4 w-4 mx-auto mb-1",
              activeAlertCount > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"
            )} />
            <span className="text-lg font-bold">{activeAlertCount}</span>
            <p className="text-[9px] text-muted-foreground">Fuel Alerts</p>
          </div>
        </div>

        {/* Fuel Theft Alerts */}
        {fuelAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
              <Zap className="h-4 w-4" />
              Alertes Consommation Anormale
            </h4>
            <ScrollArea className="h-[80px]">
              <div className="space-y-2">
                {fuelAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-destructive" />
                      <div>
                        <span className="font-mono font-medium">{alert.id_camion}</span>
                        {alert.chauffeur && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({alert.chauffeur})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        +{alert.variance_pct.toFixed(0)}%
                      </Badge>
                      <p className="text-[10px] text-muted-foreground">
                        {alert.consumption_actual.toFixed(1)} vs {alert.consumption_expected.toFixed(1)} L/100km
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Live Fleet Grid - Visual Map */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Positions en Temps Réel
          </h4>
          <ScrollArea className="h-[140px]">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted/20 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {trucks.slice(0, 8).map((truck) => {
                  const statusConfig = STATUS_CONFIG[truck.statut] || STATUS_CONFIG['Disponible'];
                  
                  return (
                    <div
                      key={truck.id_camion}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border transition-all',
                        truck.current_mission 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-muted/20 border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center',
                          truck.current_mission ? 'bg-primary/20' : 'bg-muted/50'
                        )}>
                          <Truck className={cn(
                            'h-4 w-4',
                            truck.current_mission ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">
                              {truck.id_camion}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn('text-[10px] h-5 gap-1', statusConfig.color)}
                            >
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
                            {truck.fuel_status !== 'normal' && (
                              <Fuel className={cn(
                                'h-3 w-3',
                                truck.fuel_status === 'alert' ? 'text-destructive' : 'text-warning'
                              )} />
                            )}
                          </div>
                          {truck.current_mission ? (
                            <p className="text-xs text-muted-foreground">
                              → {truck.current_mission.client_nom} • {truck.current_mission.zone_nom}
                            </p>
                          ) : truck.chauffeur ? (
                            <p className="text-xs text-muted-foreground">
                              {truck.chauffeur}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {truck.current_mission && (
                        <div className="text-right">
                          <span className="font-mono text-sm font-semibold">
                            {truck.current_mission.volume_m3}m³
                          </span>
                          <Progress 
                            value={50} 
                            className="w-16 h-1 mt-1 [&>div]:bg-primary"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
