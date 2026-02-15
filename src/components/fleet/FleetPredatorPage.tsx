import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Map, 
  Crosshair, 
  Shield, 
  Server, 
  AlertTriangle,
  Plus,
  Trash2,
  MapPin,
  Copy,
  Check,
  Play,
  Square,
  RefreshCw,
  Truck,
  Radio,
  PanelRightOpen,
  PanelRightClose,
  Clock,
  X,
  Signal,
  Fuel
} from 'lucide-react';
import { FleetGPSMap, type GPSVehicle } from './FleetGPSMap';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { useGPSDemoMode } from '@/hooks/useGPSDemoMode';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

export function FleetPredatorPage() {
  const { t } = useI18n();
  const fp = t.fleetPredator;
  const { geofences, alerts, addGeofence, fetchGeofences, trucks, fetchTrucks } = useGPSTracking();
  const { 
    demoEnabled, 
    demoTrucks, 
    demoAlerts, 
    toggleDemo, 
    acknowledgeDemoAlert,
  } = useGPSDemoMode();
  
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneLat, setNewZoneLat] = useState('');
  const [newZoneLng, setNewZoneLng] = useState('');
  const [newZoneRadius, setNewZoneRadius] = useState('500');
  const [addingZone, setAddingZone] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [vehiclePanelOpen, setVehiclePanelOpen] = useState(false);

  // Determine active data source
  const activeTrucks = demoEnabled ? demoTrucks : trucks;
  const activeAlerts = demoEnabled ? demoAlerts : alerts;

  // Stats
  const movingCount = activeTrucks.filter(t => t.is_moving).length;
  const stoppedCount = activeTrucks.filter(t => !t.is_moving).length;

  // Convert demo trucks to GPSVehicle format for FleetGPSMap
  const mapVehicles: GPSVehicle[] | undefined = useMemo(() => {
    if (!demoEnabled) return undefined; // let FleetGPSMap fetch its own data
    return demoTrucks.map(t => ({
      id_camion: t.id_camion,
      chauffeur: t.chauffeur,
      statut: t.statut,
      type: t.type,
      last_latitude: t.latitude,
      last_longitude: t.longitude,
      last_gps_update: t.last_gps_update,
      gps_provider: null,
    }));
  }, [demoEnabled, demoTrucks]);

  const handleAddZone = async () => {
    if (!newZoneName || !newZoneLat || !newZoneLng) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    const lat = parseFloat(newZoneLat);
    const lng = parseFloat(newZoneLng);
    const radius = parseInt(newZoneRadius) || 500;
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Coordonnées invalides');
      return;
    }
    const success = await addGeofence(newZoneName, 'custom', lat, lng, radius);
    if (success) {
      setNewZoneName('');
      setNewZoneLat('');
      setNewZoneLng('');
      setNewZoneRadius('500');
      setAddingZone(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const { error } = await supabase
        .from('geofences')
        .update({ is_active: false })
        .eq('id', zoneId);
      if (error) throw error;
      toast.success('Zone désactivée');
      fetchGeofences();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const copyEndpoint = () => {
    const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gps-ingest`;
    navigator.clipboard.writeText(endpoint);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
    toast.success('Endpoint copié!');
  };

  const samplePayload = `{
  "device_id": "2413 A 1",
  "latitude": 33.5731,
  "longitude": -7.5898,
  "speed": 45,
  "heading": 180,
  "fuel_level": 75,
  "timestamp": "${new Date().toISOString()}"
}`;

  const getSignalColor = (lastUpdate: string | null) => {
    if (!lastUpdate) return 'bg-muted';
    const minutes = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 60000);
    if (minutes < 5) return 'bg-emerald-500';
    if (minutes < 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTimeAgo = (lastUpdate: string | null) => {
    if (!lastUpdate) return 'Jamais';
    const minutes = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 60000);
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Crosshair className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Fleet Predator</h2>
            <p className="text-xs text-muted-foreground">Centre de commandement GPS tactique</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Stats */}
          <div className="hidden md:flex items-center gap-1.5 bg-card/80 border border-border rounded-lg px-3 py-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <Signal className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Actifs</span>
              <span className="font-bold text-foreground">{activeTrucks.length}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-xs">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span className="text-muted-foreground">En mouv.</span>
              <span className="font-bold text-emerald-500">{movingCount}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-xs">
              <Square className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Arrêtés</span>
              <span className="font-bold text-muted-foreground">{stoppedCount}</span>
            </div>
          </div>

          {/* Demo Toggle */}
          <div className="flex items-center gap-2 bg-card/80 border border-border rounded-lg px-3 py-1.5">
            {demoEnabled ? (
              <Play className="h-3.5 w-3.5 text-primary animate-pulse" />
            ) : (
              <Square className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Démo</span>
            <Switch
              checked={demoEnabled}
              onCheckedChange={() => {
                toggleDemo();
                toast.success(demoEnabled ? 'Mode démo désactivé' : 'Mode démo activé — Simulation GPS');
              }}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            className="min-h-[36px]"
            onClick={() => {
              fetchTrucks();
              toast.success('Données GPS actualisées');
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Vehicle Panel Toggle */}
          <Button
            variant="outline"
            size="sm"
            className={cn("min-h-[36px]", vehiclePanelOpen && "bg-primary/10 border-primary/30")}
            onClick={() => setVehiclePanelOpen(!vehiclePanelOpen)}
          >
            {vehiclePanelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Demo Banner */}
      {demoEnabled && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <Play className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">
            <span className="font-medium text-primary">Mode Démo actif</span> — {demoTrucks.length} camions simulés autour de Casablanca. Données non enregistrées.
          </p>
          <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
            {demoAlerts.length} alertes
          </Badge>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="bg-card/50 border border-border">
          <TabsTrigger value="map" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1.5">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Carte Tactique</span>
            <span className="sm:hidden">Carte</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1.5">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Zones Sécurisées</span>
            <span className="sm:hidden">Zones</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1.5">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">API Hardware</span>
            <span className="sm:hidden">API</span>
          </TabsTrigger>
        </TabsList>

        {/* Map Tab */}
        <TabsContent value="map" className="mt-0">
          <div className="relative overflow-hidden rounded-2xl">
            <FleetGPSMap
              className="min-h-[600px] h-[calc(100vh-340px)]"
              externalVehicles={mapVehicles}
              hideOverlay={false}
            />

            {/* Collapsible Vehicle Panel */}
            <div className={cn(
              "absolute top-0 right-0 h-full w-80 bg-card/95 backdrop-blur-xl border-l border-border transition-transform duration-300 z-10",
              vehiclePanelOpen ? "translate-x-0" : "translate-x-full"
            )}>
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Véhicules ({activeTrucks.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setVehiclePanelOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="h-[calc(100%-52px)]">
                <div className="p-2 space-y-1.5">
                  {activeTrucks.map(truck => (
                    <div
                      key={truck.id_camion}
                      className="p-2.5 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-foreground">{truck.id_camion}</span>
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-2 w-2 rounded-full", getSignalColor(truck.last_gps_update))} />
                          <Badge
                            variant={truck.is_moving ? 'default' : 'secondary'}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {truck.is_moving ? 'En mouv.' : 'Arrêté'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-0.5 text-[10px] text-muted-foreground">
                        {truck.chauffeur && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{truck.chauffeur}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-2.5 w-2.5 shrink-0" />
                            <span>{formatTimeAgo(truck.last_gps_update)}</span>
                          </div>
                          {truck.speed_kmh > 0 && (
                            <span className="font-mono font-medium">{Math.round(truck.speed_kmh)} km/h</span>
                          )}
                        </div>
                        {truck.fuel_level_pct !== null && truck.fuel_level_pct !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <Fuel className="h-2.5 w-2.5 shrink-0" />
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  truck.fuel_level_pct < 20 ? "bg-red-500" : truck.fuel_level_pct < 50 ? "bg-yellow-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${Math.min(100, truck.fuel_level_pct)}%` }}
                              />
                            </div>
                            <span className="font-mono">{Math.round(truck.fuel_level_pct)}%</span>
                          </div>
                        )}
                        {truck.mission && (
                          <div className="mt-1 pt-1 border-t border-border">
                            <span className="text-primary font-medium">{truck.mission.bc_id}</span>
                            <span className="mx-1">•</span>
                            <span>{truck.mission.client_nom}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {activeTrucks.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      {fp.noGpsVehicles}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Active Zones */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {fp.activeSecurityZones}
                  </CardTitle>
                  <Dialog open={addingZone} onOpenChange={setAddingZone}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-1" />
                        {fp.add}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{fp.newSecurityZone}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>{fp.zoneName}</Label>
                          <Input
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            placeholder={fp.zoneNamePlaceholder}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{fp.latitude}</Label>
                            <Input value={newZoneLat} onChange={(e) => setNewZoneLat(e.target.value)} placeholder="33.5731" />
                          </div>
                          <div>
                            <Label>{fp.longitude}</Label>
                            <Input value={newZoneLng} onChange={(e) => setNewZoneLng(e.target.value)} placeholder="-7.5898" />
                          </div>
                        </div>
                        <div>
                          <Label>{fp.radiusMeters}</Label>
                          <Input type="number" value={newZoneRadius} onChange={(e) => setNewZoneRadius(e.target.value)} placeholder="500" />
                        </div>
                        <Button onClick={handleAddZone} className="w-full">{fp.createZone}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {geofences.map(zone => (
                      <div key={zone.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">{zone.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)} • {zone.radius_meters}m
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={zone.type === 'plant' ? 'default' : zone.type === 'client_site' ? 'secondary' : 'outline'}>
                            {zone.type === 'plant' ? fp.plant : zone.type === 'client_site' ? fp.clientSite : fp.custom}
                          </Badge>
                          {zone.type !== 'plant' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteZone(zone.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {geofences.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">{fp.noZoneConfigured}</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Alerts History */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {fp.geofenceAlerts}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {activeAlerts.map(alert => (
                      <div key={alert.id} className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-destructive">🚨 {alert.id_camion}</span>
                          <Badge variant="destructive" className="text-[10px]">
                            {alert.event_type === 'unplanned_stop' ? fp.stop : alert.event_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {fp.duration}: {Math.round(alert.duration_minutes || 0)} min
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fp.position}: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </p>
                      </div>
                    ))}
                    {activeAlerts.length === 0 && (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                        <p className="text-emerald-500 font-medium">{fp.noAlert}</p>
                        <p className="text-muted-foreground text-sm">{fp.allZonesSecure}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  GPS Ingestion API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Endpoint</Label>
                  <div className="flex gap-2 mt-1">
                    <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-primary text-sm font-mono">
                      POST /functions/v1/gps-ingest
                    </code>
                    <Button size="sm" variant="outline" onClick={copyEndpoint}>
                      {copiedEndpoint ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Headers Requis</Label>
                  <div className="bg-muted p-3 rounded-lg mt-1 text-sm font-mono space-y-1">
                    <p className="text-foreground">Content-Type: application/json</p>
                    <p className="text-foreground">x-api-key: YOUR_GPS_TRACKER_KEY</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fréquence Recommandée</Label>
                  <p className="text-foreground">
                    Envoyer une position toutes les <span className="text-primary font-bold">30 secondes</span>
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    ℹ️ Le système détecte automatiquement les arrêts non planifiés (&gt;15 min hors zone) et génère des alertes en temps réel.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-500">Exemple de Payload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm font-mono text-foreground">{samplePayload}</pre>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-foreground">Champs:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li><code className="text-primary">device_id</code> — ID du camion (doit exister dans la flotte)</li>
                    <li><code className="text-primary">latitude</code> — Latitude GPS (-90 à 90)</li>
                    <li><code className="text-primary">longitude</code> — Longitude GPS (-180 à 180)</li>
                    <li><code className="text-muted-foreground">speed</code> — Vitesse en km/h (optionnel)</li>
                    <li><code className="text-muted-foreground">heading</code> — Direction en degrés (optionnel)</li>
                    <li><code className="text-muted-foreground">fuel_level</code> — Niveau carburant % (optionnel)</li>
                    <li><code className="text-muted-foreground">timestamp</code> — ISO 8601 (optionnel)</li>
                  </ul>
                </div>
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary">
                    💡 Envoi batch supporté: utilisez <code>{"{ positions: [...] }"}</code> pour envoyer plusieurs positions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}