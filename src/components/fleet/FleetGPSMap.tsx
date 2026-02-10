import { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, Source, Layer } from 'react-map-gl';
import { supabase } from '@/integrations/supabase/client';
import { MAPBOX_TOKEN } from '@/apiConfig';
import { Truck, Factory, MapPin, Signal, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import 'mapbox-gl/dist/mapbox-gl.css';

interface GPSVehicle {
  id_camion: string;
  chauffeur: string | null;
  statut: string;
  type: string;
  last_latitude: number;
  last_longitude: number;
  last_gps_update: string | null;
  gps_provider: string | null;
}

interface PopupVehicle extends GPSVehicle {
  minutesAgo: number;
}

const PLANT_COORDS = { latitude: 33.5731, longitude: -7.5898 };

function getMinutesAgo(lastUpdate: string | null): number {
  if (!lastUpdate) return Infinity;
  return Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 60000);
}

function getMarkerColor(minutesAgo: number): string {
  if (minutesAgo < 5) return '#22c55e';
  if (minutesAgo < 30) return '#eab308';
  return '#ef4444';
}

function getStatusLabel(minutesAgo: number): { text: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (minutesAgo < 5) return { text: 'Actif', variant: 'default' };
  if (minutesAgo < 30) return { text: 'Signal faible', variant: 'secondary' };
  return { text: 'Signal perdu', variant: 'destructive' };
}

function formatTimeAgo(minutesAgo: number): string {
  if (minutesAgo === Infinity) return 'Jamais';
  if (minutesAgo < 1) return 'À l\'instant';
  if (minutesAgo < 60) return `${minutesAgo}m`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

export function FleetGPSMap() {
  const [vehicles, setVehicles] = useState<GPSVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<PopupVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);

  const fetchVehicles = useCallback(async () => {
    const { data, error } = await supabase
      .from('flotte')
      .select('id_camion, chauffeur, statut, type, last_latitude, last_longitude, last_gps_update, gps_provider')
      .eq('gps_enabled', true)
      .not('last_latitude', 'is', null)
      .not('last_longitude', 'is', null);

    if (error) {
      console.error('Error fetching GPS vehicles:', error);
      return;
    }

    setVehicles((data || []).map(v => ({
      ...v,
      last_latitude: Number(v.last_latitude),
      last_longitude: Number(v.last_longitude),
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('fleet-gps-map')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gps_positions' },
        () => {
          fetchVehicles();
        }
      )
      .subscribe();

    // Poll every 15s as fallback
    const interval = setInterval(fetchVehicles, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchVehicles]);

  const activeCount = vehicles.filter(v => getMinutesAgo(v.last_gps_update) < 5).length;
  const warningCount = vehicles.filter(v => {
    const m = getMinutesAgo(v.last_gps_update);
    return m >= 5 && m < 30;
  }).length;
  const lostCount = vehicles.filter(v => getMinutesAgo(v.last_gps_update) >= 30).length;

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-border">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: PLANT_COORDS.latitude,
          longitude: PLANT_COORDS.longitude,
          zoom: 11,
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {/* Plant Marker */}
        <Marker latitude={PLANT_COORDS.latitude} longitude={PLANT_COORDS.longitude} anchor="center">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-2 bg-primary/20 rounded-full animate-ping opacity-50" />
            <div className="relative h-10 w-10 rounded-full bg-primary flex items-center justify-center border-2 border-primary-foreground shadow-lg shadow-primary/40">
              <Factory className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </Marker>

        {/* Vehicle Markers */}
        {vehicles.map(v => {
          const minutesAgo = getMinutesAgo(v.last_gps_update);
          const color = getMarkerColor(minutesAgo);

          return (
            <Marker
              key={v.id_camion}
              latitude={v.last_latitude}
              longitude={v.last_longitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedVehicle({ ...v, minutesAgo });
              }}
            >
              <div className="cursor-pointer group relative">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: 'rgba(255,255,255,0.8)',
                    boxShadow: `0 0 12px ${color}80`,
                  }}
                >
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
                  {v.id_camion}
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Vehicle Popup */}
        {selectedVehicle && (
          <Popup
            latitude={selectedVehicle.last_latitude}
            longitude={selectedVehicle.last_longitude}
            anchor="bottom"
            onClose={() => setSelectedVehicle(null)}
            closeOnClick={false}
            className="fleet-popup"
          >
            <div className="p-2 min-w-[200px] space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-foreground">{selectedVehicle.id_camion}</span>
                <Badge variant={getStatusLabel(selectedVehicle.minutesAgo).variant} className="text-[10px]">
                  {getStatusLabel(selectedVehicle.minutesAgo).text}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{selectedVehicle.chauffeur || 'Sans chauffeur'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-3 w-3 shrink-0" />
                  <span>{selectedVehicle.statut} • {selectedVehicle.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>
                    Dernière MAJ: {selectedVehicle.last_gps_update
                      ? new Date(selectedVehicle.last_gps_update).toLocaleString('fr-FR')
                      : 'Jamais'}
                    {' '}({formatTimeAgo(selectedVehicle.minutesAgo)})
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Vehicle Count Overlay */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-xl border border-border rounded-xl p-3 space-y-2 shadow-lg">
        <div className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Signal className="h-3.5 w-3.5 text-primary" />
          Flotte GPS
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{activeCount} actifs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">{warningCount} faibles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-muted-foreground">{lostCount} perdus</span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground border-t border-border pt-1.5">
          Total: {vehicles.length} véhicule{vehicles.length !== 1 ? 's' : ''} suivis
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-sm text-muted-foreground animate-pulse">Chargement de la carte GPS...</div>
        </div>
      )}
    </div>
  );
}
