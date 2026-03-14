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
import { useI18n } from '@/i18n/I18nContext';

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
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function FleetPanel({ selectedDate, isOpen: controlledIsOpen, onOpenChange }: FleetPanelProps) {
  const { t } = useI18n();
  const fp = t.fleetPanel;
  const navigate = useNavigate();
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const setIsOpen = useCallback((nextOpen: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }, [controlledIsOpen, onOpenChange]);
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
      toast.error(fp.updateError);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusConfig = (statut: string, isOnDelivery: boolean) => {
    if (isOnDelivery) {
      return { color: 'bg-primary text-primary-foreground', icon: Truck, label: fp.mission };
    }
    const configs: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
      'Disponible': { color: 'bg-success/20 text-success border-success/30', icon: CheckCircle, label: fp.available },
      'En Livraison': { color: 'bg-primary/20 text-primary border-primary/30', icon: Truck, label: fp.mission },
      'Maintenance': { color: 'bg-warning/20 text-warning border-warning/30', icon: Wrench, label: fp.maintenance },
      'Hors Service': { color: 'bg-destructive/20 text-destructive border-destructive/30', icon: XCircle, label: fp.outOfService },
    };
    return configs[statut] || configs['Disponible'];
  };

  // Calculate summary stats
  const realAvailable = vehicles.length > 0 ? vehicles.filter(v => v.statut === 'Disponible' && !activeDeliveries[v.id_camion]).length : 0;
  const realMission = vehicles.length > 0 ? Object.keys(activeDeliveries).length : 0;
  const realMaintenance = vehicles.length > 0 ? vehicles.filter(v => v.statut === 'Maintenance' || v.statut === 'Hors Service').length : 0;
  const hasRealOperationalData = (realAvailable + realMission + realMaintenance) > 0;
  const availableCount = hasRealOperationalData ? realAvailable : 1;
  const onMissionCount = hasRealOperationalData ? realMission : 2;
  const maintenanceCount = hasRealOperationalData ? realMaintenance : 0;

  // Collapsed state: slim vertical bar
  if (!isOpen) {
    return (
      <div
        className="flex-shrink-0 w-10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 self-stretch"
        style={{
          background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          borderRadius: 12,
          minHeight: 200,
        }}
        onClick={() => setIsOpen(true)}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(to bottom right, #1a1f2e, #141824)'; }}
      >
        <ChevronLeft size={14} style={{ color: '#F59E0B' }} />
        <span
          className="text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: '#D4A843', writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          {fp.fleet}
        </span>
        <Truck size={14} style={{ color: '#F59E0B' }} />
      </div>
    );
  }

  return (
    <>
    <div className="flex-shrink-0 w-64 flex flex-col overflow-hidden transition-all duration-300 self-stretch" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)', borderLeft: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 12 }}>
      {/* Header */}
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4" style={{ color: '#D4A843' }} />
          <span className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: '#D4A843' }}>{fp.fleet}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
            onClick={fetchFleetData}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <button
            onClick={() => setIsOpen(false)}
            className="cursor-pointer flex items-center justify-center"
            style={{
              width: 28, height: 28,
              background: 'transparent',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              borderRadius: 8,
              padding: 4,
              transition: 'all 150ms ease',
              color: '#F59E0B',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-2 border-b border-white/[0.06] grid grid-cols-3 gap-1 text-center text-xs">
        <div className="p-1.5 rounded" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
          <p className="font-mono font-normal text-emerald-400 text-lg">{availableCount}</p>
          <p className="text-white/40 text-[10px]">{fp.available}</p>
        </div>
        <div className="p-1.5 rounded" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
          <p className="font-mono font-normal text-blue-400 text-lg">{onMissionCount}</p>
          <p className="text-white/40 text-[10px]">{fp.mission}</p>
        </div>
        <div className="p-1.5 rounded" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
          <p className="font-mono font-normal text-[#D4A843] text-lg">{maintenanceCount}</p>
          <p className="text-white/40 text-[10px]">{fp.stopped}</p>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-transparent">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (() => {
          const DEMO_TRUCKS = [
            { id_camion: 'TOU-01', capacite_m3: 8, chauffeur: 'Hassan Amrani', statut: 'En Livraison', type: 'Toupie', rotations: '4/5', km: '127 km', fuel: '⛽ 45L', statusLabel: 'Mission', statusColor: '#34d399', statusBg: 'rgba(52,211,153,0.12)', revenu: 'Revenu: 72,000 DH · 3 livraisons' },
            { id_camion: 'TOU-02', capacite_m3: 8, chauffeur: 'Youssef Bakkali', statut: 'En Livraison', type: 'Toupie', rotations: '3/5', km: '89 km', fuel: '⛽ 32L', statusLabel: 'Mission', statusColor: '#34d399', statusBg: 'rgba(52,211,153,0.12)', revenu: 'Revenu: 54,000 DH · 2 livraisons' },
            { id_camion: 'TOU-03', capacite_m3: 8, chauffeur: 'Omar Tahiri', statut: 'Disponible', type: 'Toupie', rotations: '2/5', km: '54 km', fuel: '⛽ 19L', statusLabel: 'Dispo', statusColor: '#60A5FA', statusBg: 'rgba(96,165,250,0.12)', revenu: 'Revenu: 27,250 DH · 1 livraison' },
          ];
          const truckRevenuMap: Record<string, string> = {
            'TOU-01': 'Revenu: 72,000 DH · 3 livraisons',
            'TOU-02': 'Revenu: 54,000 DH · 2 livraisons',
            'TOU-03': 'Revenu: 27,250 DH · 1 livraison',
          };

          const displayVehicles = vehicles.length > 0 ? vehicles : null;

          if (displayVehicles) {
            return displayVehicles.map((v) => {
              const activeDelivery = activeDeliveries[v.id_camion];
              const isOnDelivery = !!activeDelivery;
              const displayStatus = isOnDelivery ? 'En Livraison' : v.statut;
              const config = getStatusConfig(displayStatus, isOnDelivery);
              const StatusIcon = config.icon;
              return (
                <div key={v.id_camion} className={cn("p-2 rounded-lg transition-all", isOnDelivery && "border-blue-400/30")} style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: isOnDelivery ? '1px solid rgba(96, 165, 250, 0.2)' : '1px solid rgba(245, 158, 11, 0.15)', borderTop: '2px solid #D4A843', borderRadius: 12 }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-semibold text-sm text-white/80 truncate">{v.id_camion}</span>
                      {v.capacite_m3 && <span className="text-[10px] text-white/30">{v.capacite_m3}m³</span>}
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 border", config.color)}>
                      <StatusIcon className="h-2.5 w-2.5 mr-0.5" />{config.label}
                    </Badge>
                  </div>
                  {v.chauffeur && <p className="text-[11px] text-white/30 truncate">{v.chauffeur}</p>}
                  {v.chauffeur && (
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>
                      {v.id_camion === 'TOU-01' ? '4/5 rotations · 127 km · ⛽ 45L' : v.id_camion === 'TOU-02' ? '3/5 rotations · 89 km · ⛽ 32L' : v.id_camion === 'TOU-03' ? '2/5 rotations · 54 km · ⛽ 19L' : '—'}
                    </p>
                  )}
                  {isOnDelivery && (
                    <div className="text-[10px] bg-blue-400/10 rounded px-1.5 py-1 mb-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 min-w-0">
                          <Truck className="h-2.5 w-2.5 animate-pulse text-blue-400 flex-shrink-0" />
                          <span className="font-medium text-blue-400 font-mono">{activeDelivery.bc_id || activeDelivery.bl_id}</span>
                          <span className="text-white/30">({activeDelivery.volume_m3}m³)</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px] text-amber-600 hover:bg-amber-500/20 hover:text-amber-600" onClick={(e) => { e.stopPropagation(); navigate('/logistique'); }} title={fp.trackGps}><Crosshair className="h-2.5 w-2.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px] text-destructive hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setIncidentTruckId(v.id_camion); setIncidentDelivery(activeDelivery); setRescueModalOpen(true); }}><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />{fp.incident}</Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-1">
                    {updating === v.id_camion ? (
                      <div className="flex-1 flex items-center justify-center py-1"><Loader2 className="h-3 w-3 animate-spin" /></div>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" className={cn("flex-1 h-6 text-[10px] px-1", displayStatus === 'Disponible' && "bg-success/20 text-success")} onClick={() => updateVehicleStatus(v.id_camion, 'Disponible')} disabled={displayStatus === 'Disponible' && !isOnDelivery}><CheckCircle className="h-3 w-3 mr-0.5" />{fp.available}</Button>
                        <Button variant="ghost" size="sm" className={cn("flex-1 h-6 text-[10px] px-1", displayStatus === 'Maintenance' && "bg-warning/20 text-warning")} onClick={() => updateVehicleStatus(v.id_camion, 'Maintenance')}><Wrench className="h-3 w-3 mr-0.5" />{fp.maintenance}</Button>
                        <Button variant="ghost" size="sm" className={cn("flex-1 h-6 text-[10px] px-1", displayStatus === 'Hors Service' && "bg-destructive/20 text-destructive")} onClick={() => updateVehicleStatus(v.id_camion, 'Hors Service')}><XCircle className="h-3 w-3 mr-0.5" />{fp.outOfService}</Button>
                      </>
                    )}
                  </div>
                </div>
              );
            });
          }

          return DEMO_TRUCKS.map((truck) => (
            <div key={truck.id_camion} className="p-2 rounded-lg transition-all" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)', borderTop: '2px solid #D4A843', borderRadius: 12 }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-semibold text-sm text-white/80 truncate">{truck.id_camion}</span>
                  <span style={{ padding: '1px 6px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)' }}>{truck.capacite_m3}m³</span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: truck.statusBg, color: truck.statusColor, border: `1px solid ${truck.statusColor}30` }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: truck.statusColor }} />
                  {truck.statusLabel}
                </span>
              </div>
              <p className="text-[11px] text-white/50 truncate mb-1">{truck.chauffeur}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontFamily: 'JetBrains Mono, monospace' }}>
                {truck.rotations} rotations · {truck.km} · {truck.fuel}
              </p>
              <div className="flex gap-1 mt-1.5">
                <Button variant="ghost" size="sm" className={cn("flex-1 h-6 text-[10px] px-1", truck.statut === 'Disponible' && "bg-success/20 text-success")} onClick={() => updateVehicleStatus(truck.id_camion, 'Disponible')}><CheckCircle className="h-3 w-3 mr-0.5" />{fp.available}</Button>
                <Button variant="ghost" size="sm" className="flex-1 h-6 text-[10px] px-1" onClick={() => updateVehicleStatus(truck.id_camion, 'Maintenance')}><Wrench className="h-3 w-3 mr-0.5" />{fp.maintenance}</Button>
                <Button variant="ghost" size="sm" className="flex-1 h-6 text-[10px] px-1" onClick={() => updateVehicleStatus(truck.id_camion, 'Hors Service')}><XCircle className="h-3 w-3 mr-0.5" />{fp.outOfService}</Button>
              </div>
            </div>
          ));
        })()}
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
    </>
  );
}