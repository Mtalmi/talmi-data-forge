import { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCameraSurveillance, CameraEvent } from '@/hooks/useCameraSurveillance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Camera, Video, AlertTriangle, Shield, Search, RefreshCw,
  Check, Eye, Truck, Package, Factory, Loader2, Plus, Wifi, WifiOff,
  Car, HardHat, Footprints, CircleAlert
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const EVENT_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  anpr: { icon: Car, label: 'ANPR (Plaque)', color: 'text-blue-500' },
  intrusion: { icon: AlertTriangle, label: 'Intrusion', color: 'text-red-500' },
  ppe_violation: { icon: HardHat, label: 'Violation EPI', color: 'text-red-500' },
  motion: { icon: Eye, label: 'Mouvement', color: 'text-muted-foreground' },
  line_crossing: { icon: Footprints, label: 'Franchissement', color: 'text-amber-500' },
  zone_entry: { icon: Footprints, label: 'Entrée zone', color: 'text-green-500' },
  zone_exit: { icon: Footprints, label: 'Sortie zone', color: 'text-amber-500' },
  loitering: { icon: CircleAlert, label: 'Rôdage', color: 'text-amber-500' },
  unattended_object: { icon: Package, label: 'Objet suspect', color: 'text-red-500' },
  object_removal: { icon: Package, label: 'Retrait objet', color: 'text-amber-500' },
};

const ZONE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  security: { icon: Shield, label: 'Sécurité', color: 'bg-red-500/10 text-red-500' },
  production: { icon: Factory, label: 'Production', color: 'bg-blue-500/10 text-blue-500' },
  fleet: { icon: Truck, label: 'Flotte', color: 'bg-green-500/10 text-green-500' },
  inventory: { icon: Package, label: 'Inventaire', color: 'bg-amber-500/10 text-amber-500' },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  warning: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
  info: { color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
};

export default function Surveillance() {
  const { isCeo } = useAuth();
  const { cameras, events, stats, loading, acknowledgeEvent, addCamera } = useCameraSurveillance();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = !searchTerm ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.plate_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || e.event_type === typeFilter;
      const matchesZone = zoneFilter === 'all' || e.zone === zoneFilter;
      const matchesSeverity = severityFilter === 'all' || e.severity === severityFilter;
      return matchesSearch && matchesType && matchesZone && matchesSeverity;
    });
  }, [events, searchTerm, typeFilter, zoneFilter, severityFilter]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Video className="h-8 w-8 text-primary" />
              Surveillance IA
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoring caméras intelligentes en temps réel
            </p>
          </div>
          {isCeo && <AddCameraDialog onAdd={addCamera} />}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Caméras" value={stats.totalCameras} icon={Camera} />
          <StatCard label="Actives" value={stats.activeCameras} icon={Wifi} accent="text-green-500" />
          <StatCard label="Aujourd'hui" value={stats.todayEvents} icon={Eye} />
          <StatCard label="Critiques" value={stats.criticalEvents} icon={AlertTriangle} accent="text-red-500" />
          <StatCard label="Alertes" value={stats.warningEvents} icon={CircleAlert} accent="text-amber-500" />
          <StatCard label="Plaques" value={stats.anprEvents} icon={Car} accent="text-blue-500" />
          <StatCard label="Total" value={stats.totalEvents} icon={Video} />
        </div>

        {/* Camera Grid */}
        {cameras.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Caméras enregistrées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {cameras.map(cam => {
                  const zone = ZONE_CONFIG[cam.zone] || ZONE_CONFIG.security;
                  return (
                    <div key={cam.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{cam.name}</span>
                        {cam.is_active ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{cam.location}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={cn('text-xs', zone.color)}>
                          <zone.icon className="h-3 w-3 mr-1" />
                          {zone.label}
                        </Badge>
                        {cam.brand && (
                          <span className="text-xs text-muted-foreground">{cam.brand}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher (plaque, description...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes zones</SelectItem>
                  {Object.entries(ZONE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="warning">Alerte</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events Feed */}
        <Tabs defaultValue="live" className="space-y-4">
          <TabsList>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Flux en direct
              {stats.criticalEvents > 0 && (
                <Badge variant="destructive">{stats.criticalEvents}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">Historique ({filteredEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-2">
            {filteredEvents.filter(e => !e.is_acknowledged).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 mx-auto text-green-500/50 mb-4" />
                  <p className="text-muted-foreground">Aucun événement non acquitté</p>
                  <p className="text-sm text-muted-foreground">Tout est sous contrôle ✅</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents
                .filter(e => !e.is_acknowledged)
                .map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onAcknowledge={acknowledgeEvent}
                  />
                ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-2">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Aucun événement</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onAcknowledge={acknowledgeEvent}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: number; icon: React.ElementType; accent?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn('text-xl font-bold', accent)}>{value}</p>
          </div>
          <Icon className={cn('h-6 w-6 opacity-40', accent)} />
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event, onAcknowledge }: { event: CameraEvent; onAcknowledge: (id: string) => void }) {
  const typeConfig = EVENT_TYPE_CONFIG[event.event_type] || { icon: Eye, label: event.event_type, color: 'text-muted-foreground' };
  const sevConfig = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
  const TypeIcon = typeConfig.icon;
  const timeAgo = formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: fr });

  return (
    <Card className={cn(
      'transition-all',
      !event.is_acknowledged && event.severity === 'critical' && 'ring-2 ring-red-500/30',
      !event.is_acknowledged && event.severity === 'warning' && 'ring-1 ring-amber-500/20',
    )}>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', sevConfig.bg)}>
            <TypeIcon className={cn('h-5 w-5', typeConfig.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{typeConfig.label}</Badge>
              {event.zone && ZONE_CONFIG[event.zone] && (
                <Badge variant="outline" className={cn('text-xs', ZONE_CONFIG[event.zone].color)}>
                  {ZONE_CONFIG[event.zone].label}
                </Badge>
              )}
              <Badge className={cn('text-xs', sevConfig.bg, sevConfig.color)}>
                {event.severity === 'critical' ? 'Critique' : event.severity === 'warning' ? 'Alerte' : 'Info'}
              </Badge>
              {event.plate_number && (
                <Badge variant="secondary" className="font-mono text-xs">
                  🚛 {event.plate_number}
                </Badge>
              )}
              {!event.is_acknowledged && (
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <p className="text-sm font-medium mt-1.5">{event.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{timeAgo}</span>
              {event.matched_vehicle_id && (
                <span className="font-mono">🚛 {event.matched_vehicle_id}</span>
              )}
              {event.matched_bl_id && (
                <span className="font-mono">📄 BL: {event.matched_bl_id}</span>
              )}
              {event.auto_action_taken && (
                <span className="text-green-600">⚡ {event.auto_action_taken}</span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {!event.is_acknowledged && (
              <Button variant="outline" size="sm" onClick={() => onAcknowledge(event.id)}>
                <Check className="h-4 w-4 mr-1" />
                Acquitter
              </Button>
            )}
            {event.is_acknowledged && (
              <Badge variant="outline" className="text-green-600">
                <Check className="h-3 w-3 mr-1" /> Acquitté
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddCameraDialog({ onAdd }: { onAdd: (cam: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', zone: 'security', brand: '', ip_address: '' });

  const handleSubmit = () => {
    if (!form.name || !form.location) return;
    onAdd({ ...form, brand: form.brand || null, ip_address: form.ip_address || null });
    setOpen(false);
    setForm({ name: '', location: '', zone: 'security', brand: '', ip_address: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter Caméra
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle Caméra</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nom</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="CAM-01 Entrée" />
          </div>
          <div>
            <Label>Emplacement</Label>
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Portail principal" />
          </div>
          <div>
            <Label>Zone</Label>
            <Select value={form.zone} onValueChange={v => setForm(f => ({ ...f, zone: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="security">Sécurité</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="fleet">Flotte</SelectItem>
                <SelectItem value="inventory">Inventaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Marque</Label>
            <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Hikvision" />
          </div>
          <div>
            <Label>Adresse IP</Label>
            <Input value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))} placeholder="192.168.1.100" />
          </div>
          <Button onClick={handleSubmit} className="w-full">Enregistrer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
