import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { subHours, format } from 'date-fns';

export interface TruckPosition {
  id_camion: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading: number;
  fuel_level_pct: number | null;
  last_gps_update: string | null;
  is_moving: boolean;
  stopped_since: string | null;
  chauffeur: string | null;
  telephone_chauffeur: string | null;
  statut: string;
  type: string;
  bc_mission_id: string | null;
}

export interface GPSHistoryPoint {
  latitude: number;
  longitude: number;
  recorded_at: string;
  speed_kmh: number;
}

export interface Geofence {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  color: string;
  is_active: boolean;
}

export interface GeofenceEvent {
  id: string;
  id_camion: string;
  event_type: string;
  latitude: number;
  longitude: number;
  duration_minutes: number | null;
  acknowledged: boolean;
  created_at: string;
  geofence?: Geofence;
}

export function useGPSTracking() {
  const [trucks, setTrucks] = useState<TruckPosition[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<GeofenceEvent[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [truckHistory, setTruckHistory] = useState<GPSHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const historyLoadedRef = useRef<string | null>(null);

  // Fetch all trucks with GPS data
  const fetchTrucks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('flotte')
        .select(`
          id_camion,
          last_latitude,
          last_longitude,
          last_speed_kmh,
          last_heading,
          last_fuel_level_pct,
          last_gps_update,
          is_moving,
          stopped_since,
          chauffeur,
          telephone_chauffeur,
          statut,
          type,
          bc_mission_id
        `)
        .not('last_latitude', 'is', null);

      if (error) throw error;

      const positions: TruckPosition[] = (data || []).map(t => ({
        id_camion: t.id_camion,
        latitude: Number(t.last_latitude),
        longitude: Number(t.last_longitude),
        speed_kmh: Number(t.last_speed_kmh) || 0,
        heading: Number(t.last_heading) || 0,
        fuel_level_pct: t.last_fuel_level_pct ? Number(t.last_fuel_level_pct) : null,
        last_gps_update: t.last_gps_update,
        is_moving: t.is_moving || false,
        stopped_since: t.stopped_since,
        chauffeur: t.chauffeur,
        telephone_chauffeur: t.telephone_chauffeur,
        statut: t.statut,
        type: t.type,
        bc_mission_id: t.bc_mission_id,
      }));

      setTrucks(positions);
    } catch (error) {
      console.error('Error fetching truck positions:', error);
    }
  }, []);

  // Fetch geofences
  const fetchGeofences = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('geofences')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setGeofences((data || []).map(g => ({
        ...g,
        latitude: Number(g.latitude),
        longitude: Number(g.longitude),
        radius_meters: Number(g.radius_meters),
      })));
    } catch (error) {
      console.error('Error fetching geofences:', error);
    }
  }, []);

  // Fetch unacknowledged alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('geofence_events')
        .select('*, geofences(*)')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts((data || []).map(a => ({
        ...a,
        latitude: Number(a.latitude),
        longitude: Number(a.longitude),
        duration_minutes: a.duration_minutes ? Number(a.duration_minutes) : null,
        geofence: a.geofences ? {
          ...a.geofences,
          latitude: Number(a.geofences.latitude),
          longitude: Number(a.geofences.longitude),
          radius_meters: Number(a.geofences.radius_meters),
        } : undefined,
      })));
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, []);

  // Fetch GPS history for a specific truck (last 2 hours)
  const fetchTruckHistory = useCallback(async (truckId: string) => {
    if (historyLoadedRef.current === truckId) return;
    
    try {
      const twoHoursAgo = subHours(new Date(), 2).toISOString();
      
      const { data, error } = await supabase
        .from('gps_positions')
        .select('latitude, longitude, recorded_at, speed_kmh')
        .eq('id_camion', truckId)
        .gte('recorded_at', twoHoursAgo)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      const history: GPSHistoryPoint[] = (data || []).map(p => ({
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        recorded_at: p.recorded_at,
        speed_kmh: Number(p.speed_kmh) || 0,
      }));

      setTruckHistory(history);
      historyLoadedRef.current = truckId;
    } catch (error) {
      console.error('Error fetching truck history:', error);
    }
  }, []);

  // Select a truck and load its history
  const selectTruck = useCallback((truckId: string | null) => {
    setSelectedTruck(truckId);
    if (truckId) {
      historyLoadedRef.current = null;
      fetchTruckHistory(truckId);
    } else {
      setTruckHistory([]);
      historyLoadedRef.current = null;
    }
  }, [fetchTruckHistory]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback(async (alertId: string, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('geofence_events')
        .update({
          acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
          notes,
        })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Alerte acquittée');
      await fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Erreur lors de l\'acquittement');
    }
  }, [fetchAlerts]);

  // Add a new geofence
  const addGeofence = useCallback(async (
    name: string,
    type: 'plant' | 'client_site' | 'custom',
    latitude: number,
    longitude: number,
    radiusMeters: number = 500,
    clientId?: string
  ) => {
    try {
      const { error } = await supabase
        .from('geofences')
        .insert({
          name,
          type,
          latitude,
          longitude,
          radius_meters: radiusMeters,
          client_id: clientId,
        });

      if (error) throw error;
      toast.success('Zone de sécurité ajoutée');
      await fetchGeofences();
      return true;
    } catch (error) {
      console.error('Error adding geofence:', error);
      toast.error('Erreur lors de l\'ajout de la zone');
      return false;
    }
  }, [fetchGeofences]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTrucks(), fetchGeofences(), fetchAlerts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchTrucks, fetchGeofences, fetchAlerts]);

  // Realtime subscriptions
  useEffect(() => {
    // Subscribe to GPS position changes
    const gpsChannel = supabase
      .channel('gps-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gps_positions' },
        () => {
          fetchTrucks();
          if (selectedTruck) {
            historyLoadedRef.current = null;
            fetchTruckHistory(selectedTruck);
          }
        }
      )
      .subscribe();

    // Subscribe to geofence events
    const alertsChannel = supabase
      .channel('geofence-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'geofence_events' },
        (payload) => {
          fetchAlerts();
          // Show toast for new alerts
          const event = payload.new as GeofenceEvent;
          if (event.event_type === 'unplanned_stop') {
            toast.error(`🚨 ARRÊT NON PLANIFIÉ: ${event.id_camion}`, {
              description: `Durée: ${Math.round(event.duration_minutes || 0)} min`,
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    // Polling fallback every 10 seconds
    const pollInterval = setInterval(() => {
      fetchTrucks();
      fetchAlerts();
    }, 10000);

    return () => {
      supabase.removeChannel(gpsChannel);
      supabase.removeChannel(alertsChannel);
      clearInterval(pollInterval);
    };
  }, [fetchTrucks, fetchAlerts, selectedTruck, fetchTruckHistory]);

  return {
    trucks,
    geofences,
    alerts,
    selectedTruck,
    truckHistory,
    loading,
    selectTruck,
    acknowledgeAlert,
    addGeofence,
    fetchTrucks,
    fetchGeofences,
    fetchAlerts,
  };
}
