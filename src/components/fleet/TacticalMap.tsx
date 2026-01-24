import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Truck, 
  Target, 
  Navigation2, 
  AlertTriangle, 
  Fuel, 
  Clock, 
  Phone,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  MapPin,
  Radio,
  Crosshair
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGPSTracking, TruckPosition, Geofence, GeofenceEvent, GPSHistoryPoint } from '@/hooks/useGPSTracking';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Morocco bounds for initial view
const MOROCCO_CENTER: [number, number] = [-7.0926, 31.7917];
const DEFAULT_ZOOM = 6;
const FOCUSED_ZOOM = 14;

// Obsidian dark map style (Mapbox dark style)
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

interface MapLibreMap {
  on: (event: string, callback: (e?: any) => void) => void;
  off: (event: string, callback: (e?: any) => void) => void;
  addControl: (control: any, position?: string) => void;
  addSource: (id: string, source: any) => void;
  addLayer: (layer: any) => void;
  getSource: (id: string) => any;
  getLayer: (id: string) => any;
  removeLayer: (id: string) => void;
  removeSource: (id: string) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  flyTo: (options: { center: [number, number]; zoom?: number; duration?: number }) => void;
  getZoom: () => number;
  getCenter: () => { lng: number; lat: number };
  resize: () => void;
  remove: () => void;
  loaded: () => boolean;
}

interface DemoAlert {
  id: string;
  id_camion: string;
  event_type: string;
  latitude: number;
  longitude: number;
  duration_minutes: number;
  acknowledged: boolean;
  created_at: string;
}

interface TacticalMapProps {
  demoMode?: boolean;
  demoTrucks?: TruckPosition[];
  demoAlerts?: DemoAlert[];
  onAcknowledgeDemoAlert?: (alertId: string) => void;
  getDemoTruckHistory?: (truckId: string) => { latitude: number; longitude: number; recorded_at: string; speed_kmh: number }[];
}

export function TacticalMap({ 
  demoMode = false, 
  demoTrucks = [], 
  demoAlerts = [],
  onAcknowledgeDemoAlert,
  getDemoTruckHistory,
}: TacticalMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [followMode, setFollowMode] = useState(false);

  const {
    trucks: realTrucks,
    geofences,
    alerts: realAlerts,
    selectedTruck,
    truckHistory: realTruckHistory,
    loading,
    selectTruck,
    acknowledgeAlert: acknowledgeRealAlert,
    fetchTrucks,
  } = useGPSTracking();

  // Use demo or real data based on mode
  const trucks = demoMode ? demoTrucks : realTrucks;
  const alerts = demoMode ? demoAlerts : realAlerts;
  const truckHistory = demoMode && selectedTruck && getDemoTruckHistory 
    ? getDemoTruckHistory(selectedTruck) 
    : realTruckHistory;
  
  const acknowledgeAlert = demoMode && onAcknowledgeDemoAlert 
    ? onAcknowledgeDemoAlert 
    : acknowledgeRealAlert;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initMap = async () => {
      // Dynamically import mapbox-gl
      const mapboxgl = await import('mapbox-gl');
      await import('mapbox-gl/dist/mapbox-gl.css');
      
      // Get token from environment - use public key
      const token = import.meta.env.VITE_MAPBOX_TOKEN || 
        'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
      mapboxgl.default.accessToken = token;

      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: MAPBOX_STYLE,
        center: MOROCCO_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: false,
      }) as unknown as MapLibreMap;

      map.on('load', () => {
        setMapLoaded(true);
        
        // Add navigation controls
        map.addControl(
          new (mapboxgl.default as any).NavigationControl({ showCompass: true }),
          'top-right'
        );

        // Add scale
        map.addControl(
          new (mapboxgl.default as any).ScaleControl({ maxWidth: 100 }),
          'bottom-left'
        );
      });

      mapRef.current = map;
    };

    initMap().catch(console.error);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update truck markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const updateMarkers = async () => {
      const mapboxgl = await import('mapbox-gl');
      
      // Track which trucks are still present
      const currentTruckIds = new Set(trucks.map(t => t.id_camion));

      // Remove markers for trucks no longer in the list
      markersRef.current.forEach((marker, truckId) => {
        if (!currentTruckIds.has(truckId)) {
          marker.remove();
          markersRef.current.delete(truckId);
        }
      });

      // Add/update markers
      trucks.forEach(truck => {
        const existingMarker = markersRef.current.get(truck.id_camion);

        if (existingMarker) {
          // Update existing marker position
          existingMarker.setLngLat([truck.longitude, truck.latitude]);
          
          // Update popup content
          const popup = existingMarker.getPopup();
          if (popup) {
            popup.setHTML(createPopupHTML(truck));
          }
        } else {
          // Create new marker
          const el = createTruckMarkerElement(truck, selectedTruck === truck.id_camion);
          
          const marker = new mapboxgl.default.Marker({
            element: el,
            rotationAlignment: 'map',
            rotation: truck.heading || 0,
          })
            .setLngLat([truck.longitude, truck.latitude])
            .setPopup(
              new mapboxgl.default.Popup({ offset: 25, closeButton: false })
                .setHTML(createPopupHTML(truck))
            )
            .addTo(mapRef.current as any);

          // Click handler for selection
          el.addEventListener('click', () => {
            selectTruck(truck.id_camion);
          });

          markersRef.current.set(truck.id_camion, marker);
        }
      });
    };

    updateMarkers();
  }, [trucks, mapLoaded, selectedTruck, selectTruck]);

  // Draw geofences
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    // Remove existing geofence layers
    geofences.forEach((_, index) => {
      const layerId = `geofence-${index}`;
      const sourceId = `geofence-source-${index}`;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });

    // Add geofence circles
    geofences.forEach((fence, index) => {
      const sourceId = `geofence-source-${index}`;
      const layerId = `geofence-${index}`;

      // Create circle geometry
      const circleFeature = createCircleGeoJSON(
        fence.longitude,
        fence.latitude,
        fence.radius_meters
      );

      map.addSource(sourceId, {
        type: 'geojson',
        data: circleFeature,
      });

      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': fence.type === 'plant' ? '#f59e0b' : '#10b981',
          'fill-opacity': 0.15,
        },
      });
    });
  }, [geofences, mapLoaded]);

  // Draw truck trail when selected
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const trailSourceId = 'truck-trail';
    const trailLayerId = 'truck-trail-line';

    // Remove existing trail
    if (map.getLayer(trailLayerId)) map.removeLayer(trailLayerId);
    if (map.getSource(trailSourceId)) map.removeSource(trailSourceId);

    if (selectedTruck && truckHistory.length > 1) {
      const coordinates = truckHistory.map(p => [p.longitude, p.latitude]);

      map.addSource(trailSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      });

      map.addLayer({
        id: trailLayerId,
        type: 'line',
        source: trailSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#f59e0b',
          'line-width': 3,
          'line-opacity': 0.8,
          'line-dasharray': [2, 1],
        },
      });
    }
  }, [selectedTruck, truckHistory, mapLoaded]);

  // Follow mode - center on selected truck
  useEffect(() => {
    if (!mapRef.current || !selectedTruck || !followMode) return;

    const truck = trucks.find(t => t.id_camion === selectedTruck);
    if (truck) {
      mapRef.current.flyTo({
        center: [truck.longitude, truck.latitude],
        zoom: FOCUSED_ZOOM,
        duration: 1000,
      });
    }
  }, [selectedTruck, trucks, followMode]);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    setTimeout(() => {
      mapRef.current?.resize();
    }, 100);
  }, []);

  // Lock on truck
  const lockOnTruck = useCallback((truckId: string) => {
    selectTruck(truckId);
    setFollowMode(true);
    
    const truck = trucks.find(t => t.id_camion === truckId);
    if (truck && mapRef.current) {
      mapRef.current.flyTo({
        center: [truck.longitude, truck.latitude],
        zoom: FOCUSED_ZOOM,
        duration: 1500,
      });
    }
  }, [selectTruck, trucks]);

  // Stop following
  const stopFollowing = useCallback(() => {
    setFollowMode(false);
    selectTruck(null);
  }, [selectTruck]);

  const selectedTruckData = trucks.find(t => t.id_camion === selectedTruck);

  return (
    <div className={cn(
      "relative transition-all duration-300",
      isFullscreen 
        ? "fixed inset-0 z-50 bg-background" 
        : "h-[600px] rounded-2xl overflow-hidden border border-amber-500/20"
    )}>
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Title */}
        <div className="bg-gray-900/90 backdrop-blur-sm border border-amber-500/30 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-amber-500" />
            <span className="font-bold text-amber-400">FLEET PREDATOR</span>
            {demoMode ? (
              <Badge variant="outline" className="bg-amber-500/20 border-amber-500/50 text-amber-400">
                DEMO
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-500/20 border-emerald-500/50 text-emerald-400">
                LIVE
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-amber-500" />
            <span className="text-gray-400">Véhicules:</span>
            <span className="text-white font-bold">{trucks.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Radio className="h-4 w-4 text-emerald-500" />
            <span className="text-gray-400">En mouvement:</span>
            <span className="text-emerald-400 font-bold">
              {trucks.filter(t => t.is_moving).length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-gray-400">Alertes:</span>
            <span className="text-red-400 font-bold">{alerts.length}</span>
          </div>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-16 z-10 flex gap-2">
        {!demoMode && (
          <Button
            size="sm"
            variant="outline"
            className="bg-gray-900/90 border-gray-700 hover:bg-gray-800"
            onClick={() => fetchTrucks()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="bg-gray-900/90 border-gray-700 hover:bg-gray-800"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Selected Truck Panel */}
      {selectedTruckData && (
        <div className="absolute bottom-4 left-4 z-10 w-80">
          <Card className="bg-gray-900/95 backdrop-blur-sm border-amber-500/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {selectedTruckData.id_camion}
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={stopFollowing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Driver */}
              {selectedTruckData.chauffeur && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Chauffeur:</span>
                  <span className="text-white font-medium">{selectedTruckData.chauffeur}</span>
                </div>
              )}

              {/* Speed */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Vitesse:</span>
                <span className={cn(
                  "font-bold",
                  selectedTruckData.speed_kmh > 80 ? "text-red-400" : "text-emerald-400"
                )}>
                  {Math.round(selectedTruckData.speed_kmh)} km/h
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">État:</span>
                <Badge className={cn(
                  selectedTruckData.is_moving 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-gray-500/20 text-gray-400"
                )}>
                  {selectedTruckData.is_moving ? 'En mouvement' : 'Arrêté'}
                </Badge>
              </div>

              {/* Fuel */}
              {selectedTruckData.fuel_level_pct !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    <Fuel className="h-3 w-3" /> Carburant:
                  </span>
                  <span className={cn(
                    "font-bold",
                    selectedTruckData.fuel_level_pct < 20 ? "text-red-400" : "text-white"
                  )}>
                    {Math.round(selectedTruckData.fuel_level_pct)}%
                  </span>
                </div>
              )}

              {/* Last Update */}
              {selectedTruckData.last_gps_update && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Mise à jour:
                  </span>
                  <span className="text-gray-300 text-sm">
                    {formatDistanceToNow(new Date(selectedTruckData.last_gps_update), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant={followMode ? "default" : "outline"}
                  className={cn(
                    "flex-1",
                    followMode && "bg-amber-500 hover:bg-amber-600 text-black"
                  )}
                  onClick={() => setFollowMode(!followMode)}
                >
                  <Navigation2 className="h-4 w-4 mr-1" />
                  {followMode ? 'Suivi actif' : 'Suivre'}
                </Button>
                {selectedTruckData.telephone_chauffeur && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`tel:${selectedTruckData.telephone_chauffeur}`)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 w-72">
          <Card className="bg-gray-900/95 backdrop-blur-sm border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 animate-pulse" />
                Alertes Actives ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {alerts.slice(0, 5).map(alert => (
                    <div 
                      key={alert.id}
                      className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
                      onClick={() => lockOnTruck(alert.id_camion)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-medium text-sm">
                          🚨 {alert.id_camion}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeAlert(alert.id);
                          }}
                        >
                          OK
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {alert.event_type === 'unplanned_stop' && 'Arrêt non planifié'}
                        {alert.duration_minutes && ` - ${Math.round(alert.duration_minutes)} min`}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Truck List Panel */}
      <div className="absolute top-20 left-4 z-10 w-48">
        <Card className="bg-gray-900/90 backdrop-blur-sm border-gray-700 max-h-64 overflow-hidden">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs text-gray-400">Flotte</CardTitle>
          </CardHeader>
          <ScrollArea className="h-48">
            <div className="px-2 pb-2 space-y-1">
              {trucks.map(truck => (
                <div
                  key={truck.id_camion}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                    selectedTruck === truck.id_camion
                      ? "bg-amber-500/20 border border-amber-500/50"
                      : "hover:bg-gray-800"
                  )}
                  onClick={() => lockOnTruck(truck.id_camion)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      truck.is_moving ? "bg-emerald-500" : "bg-gray-500"
                    )} />
                    <span className="text-sm font-medium text-white">{truck.id_camion}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {Math.round(truck.speed_kmh)} km/h
                  </span>
                </div>
              ))}
              {trucks.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  Aucun véhicule avec GPS
                </p>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Loading overlay - only show for real mode */}
      {!demoMode && loading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20">
          <div className="text-amber-400 flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span>Chargement...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to create truck marker element
function createTruckMarkerElement(truck: TruckPosition, isSelected: boolean): HTMLElement {
  const el = document.createElement('div');
  el.className = 'truck-marker';
  el.style.cssText = `
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s;
  `;

  const inner = document.createElement('div');
  inner.style.cssText = `
    width: 32px;
    height: 32px;
    background: ${isSelected ? '#f59e0b' : truck.is_moving ? '#10b981' : '#6b7280'};
    border: 2px solid ${isSelected ? '#fbbf24' : '#ffffff'};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    ${isSelected ? 'animation: pulse 2s infinite;' : ''}
  `;

  const icon = document.createElement('span');
  icon.innerHTML = '🚛';
  icon.style.fontSize = '16px';
  inner.appendChild(icon);

  const label = document.createElement('div');
  label.textContent = truck.id_camion;
  label.style.cssText = `
    position: absolute;
    bottom: -18px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: #f59e0b;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    white-space: nowrap;
  `;

  el.appendChild(inner);
  el.appendChild(label);

  return el;
}

// Helper to create popup HTML
function createPopupHTML(truck: TruckPosition): string {
  return `
    <div style="color: #fff; font-family: system-ui; padding: 8px;">
      <div style="font-weight: bold; color: #f59e0b; font-size: 14px; margin-bottom: 8px;">
        ${truck.id_camion}
      </div>
      ${truck.chauffeur ? `<div style="margin-bottom: 4px;">👤 ${truck.chauffeur}</div>` : ''}
      <div style="margin-bottom: 4px;">🚗 ${Math.round(truck.speed_kmh)} km/h</div>
      <div style="margin-bottom: 4px;">
        ${truck.is_moving 
          ? '<span style="color: #10b981;">● En mouvement</span>' 
          : '<span style="color: #6b7280;">● Arrêté</span>'
        }
      </div>
      ${truck.fuel_level_pct !== null 
        ? `<div>⛽ ${Math.round(truck.fuel_level_pct)}%</div>` 
        : ''
      }
    </div>
  `;
}

// Helper to create circle GeoJSON (for geofences)
function createCircleGeoJSON(
  lng: number, 
  lat: number, 
  radiusMeters: number, 
  points: number = 64
): { type: 'Feature'; properties: Record<string, unknown>; geometry: { type: 'Polygon'; coordinates: [number, number][][] } } {
  const coords: [number, number][] = [];
  const distanceX = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusMeters / 110540;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }
  coords.push(coords[0]); // Close the polygon

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
}
