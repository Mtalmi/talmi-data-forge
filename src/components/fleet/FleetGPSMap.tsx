import { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, Source, Layer } from 'react-map-gl';
import { supabase } from '@/integrations/supabase/client';
import { MAPBOX_TOKEN } from '@/apiConfig';
import { Truck, Factory, MapPin, Signal, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface GPSVehicle {
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

export interface FleetGPSMapProps {
  className?: string;
  externalVehicles?: GPSVehicle[];
  hideOverlay?: boolean;
}

const PLANT_COORDS = { latitude: 33.5731, longitude: -7.5898 };

// ── Seeded vehicles for demo ──
const SEEDED_VEHICLES: (GPSVehicle & { speed: number; eta: string; destLat: number; destLng: number; destName: string })[] = [
  {
    id_camion: 'T-04', chauffeur: 'Youssef Benali', statut: 'en_mission', type: 'Toupie 8m³',
    last_latitude: 33.5894, last_longitude: -7.6311, last_gps_update: new Date(Date.now() - 120000).toISOString(), gps_provider: 'GPS-Tracker',
    speed: 42, eta: '14 min', destLat: 33.5553, destLng: -7.6354, destName: 'Chantier Maarif',
  },
  {
    id_camion: 'T-07', chauffeur: 'Karim Idrissi', statut: 'en_mission', type: 'Toupie 10m³',
    last_latitude: 34.0209, last_longitude: -6.8416, last_gps_update: new Date(Date.now() - 60000).toISOString(), gps_provider: 'GPS-Tracker',
    speed: 65, eta: '23 min', destLat: 34.0531, destLng: -6.7986, destName: 'Résidence Rabat Center',
  },
  {
    id_camion: 'T-12', chauffeur: 'Mehdi Tazi', statut: 'en_mission', type: 'Toupie 8m³',
    last_latitude: 34.2610, last_longitude: -6.5802, last_gps_update: new Date(Date.now() - 90000).toISOString(), gps_provider: 'GPS-Tracker',
    speed: 38, eta: '9 min', destLat: 34.2741, destLng: -6.5714, destName: 'Projet Marina Kénitra',
  },
];

function getMinutesAgo(lastUpdate: string | null): number {
  if (!lastUpdate) return Infinity;
  return Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 60000);
}

function getMarkerColor(minutesAgo: number): string {
  if (minutesAgo < 5) return '#22c55e';
  if (minutesAgo < 30) return '#eab308';
  return '#ef4444';
}

// Route GeoJSON for seeded vehicles
function buildRouteGeoJSON() {
  return {
    type: 'FeatureCollection' as const,
    features: SEEDED_VEHICLES.map(v => ({
      type: 'Feature' as const,
      properties: { id: v.id_camion },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [v.last_longitude, v.last_latitude],
          [v.destLng, v.destLat],
        ],
      },
    })),
  };
}

export function FleetGPSMap({ className, externalVehicles, hideOverlay = false }: FleetGPSMapProps) {
  const { t } = useI18n();
  const g = t.fleetGPS;
  const [internalVehicles, setInternalVehicles] = useState<GPSVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<PopupVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);

  const hasExternal = !!externalVehicles;

  function getStatusLabel(minutesAgo: number): { text: string; variant: 'default' | 'secondary' | 'destructive' } {
    if (minutesAgo < 5) return { text: g.active, variant: 'default' };
    if (minutesAgo < 30) return { text: g.weakSignal, variant: 'secondary' };
    return { text: g.signalLost, variant: 'destructive' };
  }

  function formatTimeAgo(minutesAgo: number): string {
    if (minutesAgo === Infinity) return g.never;
    if (minutesAgo < 1) return g.justNow;
    if (minutesAgo < 60) return `${minutesAgo}m`;
    const hours = Math.floor(minutesAgo / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
  }

  const fetchVehicles = useCallback(async () => {
    if (hasExternal) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('flotte')
      .select('id_camion, chauffeur, statut, type, last_latitude, last_longitude, last_gps_update, gps_provider')
      .eq('gps_enabled', true)
      .not('last_latitude', 'is', null)
      .not('last_longitude', 'is', null);
    if (error) { console.error('Error fetching GPS vehicles:', error); return; }
    setInternalVehicles((data || []).map(v => ({
      ...v, last_latitude: Number(v.last_latitude), last_longitude: Number(v.last_longitude),
    })));
    setLoading(false);
  }, [hasExternal]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  useEffect(() => {
    if (hasExternal) return;
    const channel = supabase.channel('fleet-gps-map')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gps_positions' }, () => fetchVehicles())
      .subscribe();
    const interval = setInterval(fetchVehicles, 15000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [fetchVehicles, hasExternal]);

  useEffect(() => { if (hasExternal) setLoading(false); }, [hasExternal, externalVehicles]);

  // Use seeded vehicles as fallback when no real data
  const rawVehicles = externalVehicles ?? internalVehicles;
  const vehicles = rawVehicles.length > 0 ? rawVehicles : SEEDED_VEHICLES;
  const useSeeded = rawVehicles.length === 0;

  const activeCount = vehicles.filter(v => getMinutesAgo(v.last_gps_update) < 5).length;
  const warningCount = vehicles.filter(v => { const m = getMinutesAgo(v.last_gps_update); return m >= 5 && m < 30; }).length;
  const lostCount = vehicles.filter(v => getMinutesAgo(v.last_gps_update) >= 30).length;

  // Find seeded vehicle data for a given id
  const getSeededInfo = (id: string) => SEEDED_VEHICLES.find(s => s.id_camion === id);

  return (
    <div className={cn("relative w-full rounded-2xl overflow-hidden border border-border", className || "h-[600px]")} style={{ minHeight: 500 }}>
      <Map
        ref={mapRef}
        initialViewState={{ latitude: 33.82, longitude: -7.05, zoom: 7.2 }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {/* Route lines for seeded vehicles */}
        {useSeeded && (
          <Source id="routes" type="geojson" data={buildRouteGeoJSON()}>
            <Layer
              id="route-lines"
              type="line"
              paint={{
                'line-color': '#D4A843',
                'line-width': 2.5,
                'line-dasharray': [4, 3],
                'line-opacity': 0.7,
              }}
            />
          </Source>
        )}

        {/* Plant marker */}
        <Marker latitude={PLANT_COORDS.latitude} longitude={PLANT_COORDS.longitude} anchor="center">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-2 bg-primary/20 rounded-full animate-ping opacity-50" />
            <div className="relative h-10 w-10 rounded-full bg-primary flex items-center justify-center border-2 border-primary-foreground shadow-lg shadow-primary/40">
              <Factory className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </Marker>

        {/* Destination markers for seeded */}
        {useSeeded && SEEDED_VEHICLES.map(sv => (
          <Marker key={`dest-${sv.id_camion}`} latitude={sv.destLat} longitude={sv.destLng} anchor="center">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(212,168,67,0.3)', border: '2px solid #D4A843' }} />
          </Marker>
        ))}

        {/* Vehicle markers */}
        {vehicles.map(v => {
          const minutesAgo = getMinutesAgo(v.last_gps_update);
          const seeded = getSeededInfo(v.id_camion);
          const isGold = useSeeded;
          return (
            <Marker key={v.id_camion} latitude={v.last_latitude} longitude={v.last_longitude} anchor="center"
              onClick={(e) => { e.originalEvent.stopPropagation(); setSelectedVehicle({ ...v, minutesAgo }); }}>
              <div className="cursor-pointer group relative">
                {/* Marker circle */}
                <div className="h-9 w-9 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform hover:scale-110"
                  style={{
                    backgroundColor: isGold ? '#D4A843' : getMarkerColor(minutesAgo),
                    borderColor: 'rgba(255,255,255,0.8)',
                    boxShadow: `0 0 14px ${isGold ? 'rgba(212,168,67,0.5)' : getMarkerColor(minutesAgo) + '80'}`,
                  }}>
                  <Truck className="h-4 w-4 text-white" />
                </div>
                {/* ID label */}
                <div style={{
                  position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                  color: '#fff', background: 'rgba(0,0,0,0.75)', padding: '1px 5px', borderRadius: 3,
                }}>
                  {v.id_camion}
                </div>
                {/* Speed badge */}
                {seeded && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', fontSize: 8, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                    color: '#D4A843', background: 'rgba(11,17,32,0.9)', border: '1px solid rgba(212,168,67,0.3)',
                    padding: '1px 5px', borderRadius: 3,
                  }}>
                    {seeded.speed} km/h
                  </div>
                )}
                {/* ETA badge */}
                {seeded && (
                  <div style={{
                    position: 'absolute', bottom: -32, left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', fontSize: 8, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                    color: '#10B981', background: 'rgba(11,17,32,0.9)', border: '1px solid rgba(16,185,129,0.25)',
                    padding: '1px 5px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2,
                  }}>
                    <Zap size={7} /> ETA {seeded.eta}
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

        {selectedVehicle && (
          <Popup latitude={selectedVehicle.last_latitude} longitude={selectedVehicle.last_longitude} anchor="bottom"
            onClose={() => setSelectedVehicle(null)} closeOnClick={false} className="fleet-popup">
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
                  <span>{selectedVehicle.chauffeur || g.noDriver}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-3 w-3 shrink-0" />
                  <span>{selectedVehicle.statut} • {selectedVehicle.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>
                    {g.lastUpdate}: {selectedVehicle.last_gps_update
                      ? new Date(selectedVehicle.last_gps_update).toLocaleString('fr-FR')
                      : g.never}
                    {' '}({formatTimeAgo(selectedVehicle.minutesAgo)})
                  </span>
                </div>
                {(() => {
                  const s = getSeededInfo(selectedVehicle.id_camion);
                  if (!s) return null;
                  return (
                    <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                      <Zap className="h-3 w-3 shrink-0" style={{ color: '#D4A843' }} />
                      <span style={{ color: '#D4A843' }}>IA ETA: {s.eta} → {s.destName}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* GPS Fleet overlay */}
      {!hideOverlay && (
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-xl border border-border rounded-xl p-3 space-y-2 shadow-lg">
          <div className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Signal className="h-3.5 w-3.5 text-primary" />
            {g.fleetGps}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">{activeCount} {g.activeCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">{warningCount} {g.weakCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-muted-foreground">{lostCount} {g.lostCount}</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground border-t border-border pt-1.5">
            {t.common.total}: {vehicles.length} {g.totalTracked}
          </div>
        </div>
      )}

      {/* Legend card bottom-left */}
      {useSeeded && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16, zIndex: 5,
          background: 'rgba(17,27,46,0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(212,168,67,0.2)', borderRadius: 10,
          padding: '10px 14px', minWidth: 180,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Truck size={12} color="#D4A843" />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: '#D4A843', letterSpacing: '0.08em' }}>
              LÉGENDE FLOTTE
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#D4A843', flexShrink: 0 }} />
              Véhicule en mission
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(212,168,67,0.3)', border: '2px solid #D4A843', flexShrink: 0 }} />
              Destination
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ width: 20, height: 0, borderTop: '2px dashed #D4A843', flexShrink: 0 }} />
              Itinéraire prévu
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
              <Zap size={10} color="#10B981" />
              ETA prédite par IA
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-sm text-muted-foreground animate-pulse">{g.loadingMap}</div>
        </div>
      )}
    </div>
  );
}