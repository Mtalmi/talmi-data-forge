import { useState } from 'react';
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
  Radio, 
  AlertTriangle,
  Plus,
  Trash2,
  MapPin,
  Server,
  Copy,
  Check,
  Play,
  Square
} from 'lucide-react';
import { TacticalMap } from './TacticalMap';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { useGPSDemoMode } from '@/hooks/useGPSDemoMode';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

export function FleetPredatorPage() {
  const { geofences, alerts, addGeofence, fetchGeofences } = useGPSTracking();
  const { 
    demoEnabled, 
    demoTrucks, 
    demoAlerts, 
    toggleDemo, 
    acknowledgeDemoAlert,
    getDemoTruckHistory 
  } = useGPSDemoMode();
  
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneLat, setNewZoneLat] = useState('');
  const [newZoneLng, setNewZoneLng] = useState('');
  const [newZoneRadius, setNewZoneRadius] = useState('500');
  const [addingZone, setAddingZone] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

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
    } catch (error) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-400 flex items-center gap-3">
            <Crosshair className="h-8 w-8" />
            Fleet Predator
          </h1>
          <p className="text-gray-400 mt-1">
            Centre de commandement GPS tactique
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              {demoEnabled ? (
                <Play className="h-4 w-4 text-amber-400 animate-pulse" />
              ) : (
                <Square className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-sm font-medium text-gray-300">Mode Démo</span>
            </div>
            <Switch
              checked={demoEnabled}
              onCheckedChange={() => {
                toggleDemo();
                toast.success(demoEnabled ? 'Mode démo désactivé' : 'Mode démo activé - Simulation GPS en cours');
              }}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
          
          <Badge className={demoEnabled 
            ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
          }>
            <Radio className="h-3 w-3 mr-1 animate-pulse" />
            {demoEnabled ? 'SIMULATION' : 'SYSTÈME ACTIF'}
          </Badge>
        </div>
      </div>
      
      {/* Demo Mode Banner */}
      {demoEnabled && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Play className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-400">Mode Démonstration Actif</h3>
              <p className="text-sm text-gray-400">
                {demoTrucks.length} camions simulés en mouvement autour de Casablanca. 
                Les données sont générées localement et ne sont pas enregistrées.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-400">{demoTrucks.length}</div>
              <div className="text-xs text-gray-500">véhicules</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-400">{demoAlerts.length}</div>
              <div className="text-xs text-gray-500">alertes</div>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="bg-gray-800/50 border border-gray-700">
          <TabsTrigger value="map" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Map className="h-4 w-4 mr-2" />
            Carte Tactique
          </TabsTrigger>
          <TabsTrigger value="zones" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Shield className="h-4 w-4 mr-2" />
            Zones Sécurisées
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Server className="h-4 w-4 mr-2" />
            API Hardware
          </TabsTrigger>
        </TabsList>

        {/* Tactical Map Tab */}
        <TabsContent value="map" className="mt-0">
          <TacticalMap 
            demoMode={demoEnabled}
            demoTrucks={demoTrucks}
            demoAlerts={demoAlerts}
            onAcknowledgeDemoAlert={acknowledgeDemoAlert}
            getDemoTruckHistory={getDemoTruckHistory}
          />
        </TabsContent>

        {/* Geofencing Tab */}
        <TabsContent value="zones" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Active Zones */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Zones de Sécurité Actives
                  </CardTitle>
                  <Dialog open={addingZone} onOpenChange={setAddingZone}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-amber-400">Nouvelle Zone de Sécurité</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Nom de la zone</Label>
                          <Input
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            placeholder="Ex: Chantier Client ABC"
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Latitude</Label>
                            <Input
                              value={newZoneLat}
                              onChange={(e) => setNewZoneLat(e.target.value)}
                              placeholder="33.5731"
                              className="bg-gray-800 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label>Longitude</Label>
                            <Input
                              value={newZoneLng}
                              onChange={(e) => setNewZoneLng(e.target.value)}
                              placeholder="-7.5898"
                              className="bg-gray-800 border-gray-600"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Rayon (mètres)</Label>
                          <Input
                            type="number"
                            value={newZoneRadius}
                            onChange={(e) => setNewZoneRadius(e.target.value)}
                            placeholder="500"
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                        <Button 
                          onClick={handleAddZone}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                        >
                          Créer la Zone
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {geofences.map(zone => (
                      <div 
                        key={zone.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="font-medium text-white">{zone.name}</p>
                            <p className="text-xs text-gray-400">
                              {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)} • {zone.radius_meters}m
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            zone.type === 'plant' 
                              ? 'bg-amber-500/20 text-amber-400'
                              : zone.type === 'client_site'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }>
                            {zone.type === 'plant' ? 'Centrale' : zone.type === 'client_site' ? 'Client' : 'Custom'}
                          </Badge>
                          {zone.type !== 'plant' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleDeleteZone(zone.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {geofences.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        Aucune zone configurée
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Alerts History */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes Géofencing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div 
                        key={alert.id}
                        className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-red-400">🚨 {alert.id_camion}</span>
                          <Badge className="bg-red-500/20 text-red-400">
                            {alert.event_type === 'unplanned_stop' ? 'Arrêt' : alert.event_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          Durée: {Math.round(alert.duration_minutes || 0)} min
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Position: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </p>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                        <p className="text-emerald-400 font-medium">Aucune alerte</p>
                        <p className="text-gray-500 text-sm">Toutes les zones sont sécurisées</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Documentation Tab */}
        <TabsContent value="api" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Endpoint Info */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  GPS Ingestion API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-400">Endpoint</Label>
                  <div className="flex gap-2 mt-1">
                    <code className="flex-1 bg-gray-800 px-3 py-2 rounded-lg text-amber-400 text-sm font-mono">
                      POST /functions/v1/gps-ingest
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600"
                      onClick={copyEndpoint}
                    >
                      {copiedEndpoint ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-400">Headers Requis</Label>
                  <div className="bg-gray-800 p-3 rounded-lg mt-1 text-sm font-mono">
                    <p className="text-gray-300">Content-Type: application/json</p>
                    <p className="text-gray-300">x-api-key: YOUR_GPS_TRACKER_KEY</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-400">Fréquence Recommandée</Label>
                  <p className="text-white">
                    Envoyer une position toutes les <span className="text-amber-400 font-bold">30 secondes</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
                    ℹ️ Le système détecte automatiquement les arrêts non planifiés (&gt;15 min hors zone)
                    et génère des alertes en temps réel.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sample Payload */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-400">
                  Exemple de Payload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-950 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm font-mono text-gray-300">
                    {samplePayload}
                  </pre>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-white">Champs:</h4>
                  <ul className="text-sm space-y-1 text-gray-400">
                    <li><code className="text-amber-400">device_id</code> - ID du camion (doit exister dans la flotte)</li>
                    <li><code className="text-amber-400">latitude</code> - Latitude GPS (-90 à 90)</li>
                    <li><code className="text-amber-400">longitude</code> - Longitude GPS (-180 à 180)</li>
                    <li><code className="text-gray-500">speed</code> - Vitesse en km/h (optionnel)</li>
                    <li><code className="text-gray-500">heading</code> - Direction en degrés (optionnel)</li>
                    <li><code className="text-gray-500">fuel_level</code> - Niveau carburant % (optionnel)</li>
                    <li><code className="text-gray-500">timestamp</code> - ISO 8601 (optionnel)</li>
                  </ul>
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">
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
