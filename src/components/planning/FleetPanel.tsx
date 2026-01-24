import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Wrench, 
  XCircle, 
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Crosshair
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { TruckRescueModal } from '@/components/logistics/TruckRescueModal';

interface FleetVehicle {
  id_camion: string;
  chauffeur: string | null;
  statut: string;
  capacite_m3: number | null;
  type: string;
}

interface ActiveDelivery {
  bl_id: string;
  bc_id: string | null;
  client_nom: string | null;
  volume_m3: number;
  workflow_status: string;
}

type ActiveDeliveriesMap = Record<string, ActiveDelivery>;

interface FleetPanelProps {
  selectedDate: string;
}

export function FleetPanel({ selectedDate }: FleetPanelProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDeliveriesMap>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Incident/Rescue modal state
  const [rescueModalOpen, setRescueModalOpen] = useState(false);
  const [incidentTruckId, setIncidentTruckId] = useState<string>('');
  const [incidentDelivery, setIncidentDelivery] = useState<ActiveDelivery | null>(null);

  const fetchFleetData = useCallback(async () => {
    try {
      // Fetch all toupie vehicles
      const { data: fleetData, error: fleetError } = await supabase
        .from('flotte')
        .select('id_camion, chauffeur, statut, capacite_m3, type')
        .eq('type', 'Toupie')
        .order('id_camion');

      if (fleetError) throw fleetError;
      setVehicles(fleetData || []);

      // Fetch active deliveries for the selected date
      const { data: blData, error: blError } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id,
          bc_id,
          volume_m3,
          workflow_status,
          camion_assigne,
          toupie_assignee,
          clients (nom_client)
        `)
        .eq('date_livraison', selectedDate)
        .in('workflow_status', ['planification', 'production', 'validation_technique', 'en_livraison'])
        .or('camion_assigne.not.is.null,toupie_assignee.not.is.null');

      if (blError) throw blError;

      const deliveryMap: ActiveDeliveriesMap = {};
      (blData || []).forEach((bl) => {
        const delivery: ActiveDelivery = {
          bl_id: bl.bl_id,
          bc_id: bl.bc_id || null,
          client_nom: bl.clients?.nom_client || null,
          volume_m3: bl.volume_m3 || 0,
          workflow_status: bl.workflow_status || 'planification',
        };
        if (bl.camion_assigne) deliveryMap[bl.camion_assigne] = delivery;
        if (bl.toupie_assignee) deliveryMap[bl.toupie_assignee] = delivery;
      });
      setActiveDeliveries(deliveryMap);

    } catch (error) {
      console.error('Error fetching fleet data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchFleetData();
  }, [fetchFleetData]);

  // Realtime subscription for fleet and BL updates
  useEffect(() => {
    const channel = supabase
      .channel('fleet-panel-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flotte' }, fetchFleetData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_livraison_reels' }, fetchFleetData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFleetData]);

  const updateVehicleStatus = async (idCamion: string, newStatus: string) => {
    setUpdating(idCamion);
    try {
      const { error } = await supabase
        .from('flotte')
        .update({ statut: newStatus, updated_at: new Date().toISOString() })
        .eq('id_camion', idCamion);

      if (error) throw error;
      toast.success(`${idCamion} → ${newStatus}`);
      await fetchFleetData();
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast.error('Erreur de mise à jour');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusConfig = (statut: string, isOnDelivery: boolean) => {
    if (isOnDelivery) {
      return { color: 'bg-primary text-primary-foreground', icon: Truck, label: 'Mission' };
    }
    const configs: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
      'Disponible': { color: 'bg-success/20 text-success border-success/30', icon: CheckCircle, label: 'Dispo' },
      'En Livraison': { color: 'bg-primary/20 text-primary border-primary/30', icon: Truck, label: 'Mission' },
      'Maintenance': { color: 'bg-warning/20 text-warning border-warning/30', icon: Wrench, label: 'Maint.' },
      'Hors Service': { color: 'bg-destructive/20 text-destructive border-destructive/30', icon: XCircle, label: 'HS' },
    };
    return configs[statut] || configs['Disponible'];
  };

  // Calculate summary stats
  const availableCount = vehicles.filter(v => 
    v.statut === 'Disponible' && !activeDeliveries[v.id_camion]
  ).length;
  const onMissionCount = Object.keys(activeDeliveries).length;
  const maintenanceCount = vehicles.filter(v => v.statut === 'Maintenance' || v.statut === 'Hors Service').length;

  if (!isOpen) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="rounded-l-lg rounded-r-none h-24 px-1 bg-card border-r-0 shadow-lg hover:bg-muted"
        >
          <div className="flex flex-col items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            <Truck className="h-4 w-4" />
            <span className="text-xs font-bold">{availableCount}</span>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-20 bottom-4 w-64 bg-card border-l border-border shadow-xl z-40 flex flex-col rounded-l-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Flotte</span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={fetchFleetData}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-2 border-b border-border grid grid-cols-3 gap-1 text-center text-xs">
        <div className="p-1.5 rounded bg-success/10">
          <p className="font-bold text-success text-lg">{availableCount}</p>
          <p className="text-muted-foreground">Dispo</p>
        </div>
        <div className="p-1.5 rounded bg-primary/10">
          <p className="font-bold text-primary text-lg">{onMissionCount}</p>
          <p className="text-muted-foreground">Mission</p>
        </div>
        <div className="p-1.5 rounded bg-warning/10">
          <p className="font-bold text-warning text-lg">{maintenanceCount}</p>
          <p className="text-muted-foreground">Arrêt</p>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          vehicles.map((v) => {
            const activeDelivery = activeDeliveries[v.id_camion];
            const isOnDelivery = !!activeDelivery;
            const displayStatus = isOnDelivery ? 'En Livraison' : v.statut;
            const config = getStatusConfig(displayStatus, isOnDelivery);
            const StatusIcon = config.icon;

            return (
              <div 
                key={v.id_camion}
                className={cn(
                  "p-2 rounded-lg border transition-all",
                  isOnDelivery 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-card border-border hover:border-muted-foreground/30"
                )}
              >
                {/* Truck Info Row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-semibold text-sm truncate">{v.id_camion}</span>
                    {v.capacite_m3 && (
                      <span className="text-[10px] text-muted-foreground">{v.capacite_m3}m³</span>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("text-[10px] px-1.5 py-0 h-5 border", config.color)}
                  >
                    <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                    {config.label}
                  </Badge>
                </div>

                {/* Driver */}
                {v.chauffeur && (
                  <p className="text-[11px] text-muted-foreground truncate mb-1.5">
                    {v.chauffeur}
                  </p>
                )}

                {/* Active Delivery Info */}
                {isOnDelivery && (
                  <div className="text-[10px] bg-primary/10 rounded px-1.5 py-1 mb-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <Truck className="h-2.5 w-2.5 animate-pulse text-primary flex-shrink-0" />
                        <span className="font-medium text-primary font-mono">{activeDelivery.bc_id || activeDelivery.bl_id}</span>
                        <span className="text-muted-foreground">({activeDelivery.volume_m3}m³)</span>
                      </div>
                      <div className="flex gap-1">
                        {/* GPS Tracking Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[9px] text-amber-600 hover:bg-amber-500/20 hover:text-amber-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/logistique');
                          }}
                          title="Suivre sur GPS"
                        >
                          <Crosshair className="h-2.5 w-2.5" />
                        </Button>
                        {/* Incident Button for active deliveries */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[9px] text-destructive hover:bg-destructive/20 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIncidentTruckId(v.id_camion);
                            setIncidentDelivery(activeDelivery);
                            setRescueModalOpen(true);
                          }}
                        >
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          Incident
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex gap-1">
                  {updating === v.id_camion ? (
                    <div className="flex-1 flex items-center justify-center py-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "flex-1 h-6 text-[10px] px-1",
                          displayStatus === 'Disponible' && "bg-success/20 text-success"
                        )}
                        onClick={() => updateVehicleStatus(v.id_camion, 'Disponible')}
                        disabled={displayStatus === 'Disponible' && !isOnDelivery}
                      >
                        <CheckCircle className="h-3 w-3 mr-0.5" />
                        Dispo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "flex-1 h-6 text-[10px] px-1",
                          displayStatus === 'Maintenance' && "bg-warning/20 text-warning"
                        )}
                        onClick={() => updateVehicleStatus(v.id_camion, 'Maintenance')}
                      >
                        <Wrench className="h-3 w-3 mr-0.5" />
                        Maint
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "flex-1 h-6 text-[10px] px-1",
                          displayStatus === 'Hors Service' && "bg-destructive/20 text-destructive"
                        )}
                        onClick={() => updateVehicleStatus(v.id_camion, 'Hors Service')}
                      >
                        <XCircle className="h-3 w-3 mr-0.5" />
                        HS
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Truck Rescue Modal */}
      <TruckRescueModal
        open={rescueModalOpen}
        onOpenChange={setRescueModalOpen}
        truckId={incidentTruckId}
        activeDelivery={incidentDelivery}
        onComplete={fetchFleetData}
      />
    </div>
  );
}