import { useState, useMemo } from 'react';
import type { Language } from '@/i18n/I18nContext';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nContext';
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
  Car, HardHat, Footprints, CircleAlert, Maximize2, Move, ZoomIn,
  Radio, MonitorPlay, Settings2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';

function getEventTypeConfig(t: any) {
  const s = t.pages.surveillance;
  return {
    anpr: { icon: Car, label: s.eventAnpr || 'ANPR', color: 'text-blue-500' },
    intrusion: { icon: AlertTriangle, label: s.eventIntrusion || 'Intrusion', color: 'text-red-500' },
    ppe_violation: { icon: HardHat, label: s.eventPpe || 'PPE', color: 'text-red-500' },
    motion: { icon: Eye, label: s.eventMotion || 'Motion', color: 'text-muted-foreground' },
    line_crossing: { icon: Footprints, label: s.eventLineCrossing || 'Line Crossing', color: 'text-amber-500' },
    zone_entry: { icon: Footprints, label: s.eventZoneEntry || 'Zone Entry', color: 'text-green-500' },
    zone_exit: { icon: Footprints, label: s.eventZoneExit || 'Zone Exit', color: 'text-amber-500' },
    loitering: { icon: CircleAlert, label: s.eventLoitering || 'Loitering', color: 'text-amber-500' },
    unattended_object: { icon: Package, label: s.eventUnattended || 'Unattended', color: 'text-red-500' },
    object_removal: { icon: Package, label: s.eventRemoval || 'Removal', color: 'text-amber-500' },
  } as Record<string, { icon: React.ElementType; label: string; color: string }>;
}

function getZoneConfig(t: any) {
  const s = t.pages.surveillance;
  return {
    security: { icon: Shield, label: s.zoneSecurity, color: 'bg-red-500/10 text-red-500' },
    production: { icon: Factory, label: s.zoneProduction, color: 'bg-blue-500/10 text-blue-500' },
    fleet: { icon: Truck, label: s.zoneFleet, color: 'bg-green-500/10 text-green-500' },
    inventory: { icon: Package, label: s.zoneInventory, color: 'bg-amber-500/10 text-amber-500' },
  } as Record<string, { icon: React.ElementType; label: string; color: string }>;
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  warning: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
  info: { color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
};

const CAMERA_FEEDS = [
  { id: 'cam-01', name: 'CAM-01', location: 'Centrale — Malaxeur', zone: 'production', active: true },
  { id: 'cam-02', name: 'CAM-02', location: 'Entrée Principale', zone: 'security', active: true },
  { id: 'cam-03', name: 'CAM-03', location: 'Parc Toupies', zone: 'fleet', active: true },
  { id: 'cam-04', name: 'CAM-04', location: 'Silos Ciment', zone: 'inventory', active: true },
  { id: 'cam-05', name: 'CAM-05', location: 'Zone Stockage Agrégats', zone: 'inventory', active: false },
  { id: 'cam-06', name: 'CAM-06', location: 'Sortie Bascule', zone: 'fleet', active: true },
];

export default function Surveillance() {
  const { isCeo } = useAuth();
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const EVENT_TYPE_CONFIG = getEventTypeConfig(t);
  const ZONE_CONFIG = getZoneConfig(t);
  const { cameras, events, stats, loading, acknowledgeEvent, addCamera } = useCameraSurveillance();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedFeed, setSelectedFeed] = useState('cam-01');
  const [gridLayout, setGridLayout] = useState<'2x3' | '1+5' | 'single'>('1+5');

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

  const liveAlerts = filteredEvents.filter(e => !e.is_acknowledged);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const selectedCam = CAMERA_FEEDS.find(c => c.id === selectedFeed) || CAMERA_FEEDS[0];

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Shield className="h-7 w-7 text-red-500" />
              </div>
              <span>Security Command Center</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.pages.surveillance.subtitle} — Surveillance AI en temps réel
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Layout toggle */}
            <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
              {(['1+5', '2x3', 'single'] as const).map(layout => (
                <button
                  key={layout}
                  onClick={() => setGridLayout(layout)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    gridLayout === layout ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50 text-muted-foreground'
                  )}
                >
                  {layout === '1+5' ? '1+5' : layout === '2x3' ? '2×3' : '1×1'}
                </button>
              ))}
            </div>
            {isCeo && <AddCameraDialog onAdd={addCamera} t={t} />}
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label={t.pages.surveillance.cameras} value={stats.totalCameras} icon={Camera} />
          <StatCard label={t.pages.surveillance.active} value={stats.activeCameras} icon={Wifi} accent="text-green-500" />
          <StatCard label={t.pages.surveillance.today} value={stats.todayEvents} icon={Eye} />
          <StatCard label={t.pages.surveillance.critical} value={stats.criticalEvents} icon={AlertTriangle} accent="text-red-500" />
          <StatCard label={t.pages.surveillance.alerts} value={stats.warningEvents} icon={CircleAlert} accent="text-amber-500" />
          <StatCard label={t.pages.surveillance.plates} value={stats.anprEvents} icon={Car} accent="text-blue-500" />
          <StatCard label={t.pages.surveillance.total} value={stats.totalEvents} icon={Video} />
        </div>

        {/* ── MULTI-FEED GRID ── */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--card)/0.8) 100%)', border: '1px solid hsl(var(--border)/0.5)' }}>
          <div className="flex items-center justify-between p-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold">Flux Vidéo en Direct</span>
              <div className="flex items-center gap-1 ml-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">LIVE</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Radio className="h-3 w-3" />
              <span>{CAMERA_FEEDS.filter(c => c.active).length}/{CAMERA_FEEDS.length} en ligne</span>
            </div>
          </div>

          {gridLayout === '1+5' ? (
            <div className="flex gap-1 p-1" style={{ minHeight: '380px' }}>
              {/* Primary feed — large */}
              <div className="flex-[3] relative">
                <CameraFeedPlaceholder
                  cam={selectedCam}
                  large
                  zoneConfig={ZONE_CONFIG}
                />
              </div>
              {/* Secondary feeds — column */}
              <div className="flex-[1] flex flex-col gap-1 min-w-0">
                {CAMERA_FEEDS.filter(c => c.id !== selectedFeed).slice(0, 5).map(cam => (
                  <div key={cam.id} className="flex-1 cursor-pointer" onClick={() => setSelectedFeed(cam.id)}>
                    <CameraFeedPlaceholder cam={cam} zoneConfig={ZONE_CONFIG} />
                  </div>
                ))}
              </div>
            </div>
          ) : gridLayout === '2x3' ? (
            <div className="grid grid-cols-3 gap-1 p-1" style={{ minHeight: '380px' }}>
              {CAMERA_FEEDS.map(cam => (
                <div key={cam.id} className="cursor-pointer" onClick={() => { setSelectedFeed(cam.id); setGridLayout('single'); }}>
                  <CameraFeedPlaceholder cam={cam} zoneConfig={ZONE_CONFIG} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-1" style={{ minHeight: '420px' }}>
              <CameraFeedPlaceholder cam={selectedCam} large zoneConfig={ZONE_CONFIG} />
              <div className="flex gap-1 mt-1 overflow-x-auto">
                {CAMERA_FEEDS.map(cam => (
                  <button
                    key={cam.id}
                    onClick={() => setSelectedFeed(cam.id)}
                    className={cn(
                      'flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-all',
                      cam.id === selectedFeed ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    {cam.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── PTZ CONTROLS + ALERTS SPLIT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* PTZ Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Move className="h-4 w-4" />
                Contrôles PTZ — {selectedCam.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3">
                {/* PTZ D-Pad */}
                <div className="relative w-32 h-32">
                  <button className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors" title="Pan Up">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
                  </button>
                  <button className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors" title="Pan Down">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <button className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors" title="Pan Left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors" title="Pan Right">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-3 w-full">
                  <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary rounded-full" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">1.0×</span>
                </div>

                {/* Preset buttons */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  {['Entrée', 'Malaxeur', 'Silos'].map(preset => (
                    <Button key={preset} variant="outline" size="sm" className="text-xs">
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Alerts Feed */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Alertes en Direct
                  {liveAlerts.length > 0 && (
                    <Badge variant="destructive" className="ml-1">{liveAlerts.length}</Badge>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  <Settings2 className="h-3 w-3 mr-1" />
                  Règles
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {liveAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Shield className="h-10 w-10 text-green-500/50 mb-3" />
                  <p className="text-sm text-muted-foreground">{t.pages.surveillance.noUnacknowledged}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{t.pages.surveillance.allUnderControl}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {liveAlerts.slice(0, 10).map(event => (
                    <CompactEventCard
                      key={event.id}
                      event={event}
                      onAcknowledge={acknowledgeEvent}
                      typeConfig={EVENT_TYPE_CONFIG}
                      zoneConfig={ZONE_CONFIG}
                      t={t}
                      lang={lang}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── REGISTERED CAMERAS ── */}
        {cameras.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t.pages.surveillance.registeredCameras}
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

        {/* ── FULL EVENTS FEED ── */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.pages.surveillance.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.pages.surveillance.allTypes}</SelectItem>
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Zone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.pages.surveillance.allZones}</SelectItem>
                  {Object.entries(ZONE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Sévérité" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.pages.surveillance.allSeverities}</SelectItem>
                  <SelectItem value="critical">{t.pages.surveillance.severityCritical}</SelectItem>
                  <SelectItem value="warning">{t.pages.surveillance.severityWarning}</SelectItem>
                  <SelectItem value="info">{t.pages.surveillance.severityInfo}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="live" className="space-y-4">
          <TabsList>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {t.pages.surveillance.liveFeed}
              {stats.criticalEvents > 0 && (
                <Badge variant="destructive">{stats.criticalEvents}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">{t.pages.surveillance.history} ({filteredEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-2">
            {filteredEvents.filter(e => !e.is_acknowledged).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                   <Shield className="h-12 w-12 mx-auto text-green-500/50 mb-4" />
                   <p className="text-muted-foreground">{t.pages.surveillance.noUnacknowledged}</p>
                   <p className="text-sm text-muted-foreground">{t.pages.surveillance.allUnderControl}</p>
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
                  <p className="text-muted-foreground">{t.pages.surveillance.noEvents}</p>
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

/* ── Camera Feed Placeholder ── */
function CameraFeedPlaceholder({ cam, large, zoneConfig }: {
  cam: { id: string; name: string; location: string; zone: string; active: boolean };
  large?: boolean;
  zoneConfig: Record<string, any>;
}) {
  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden h-full group',
        !cam.active && 'opacity-50'
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(15,20,35,0.95) 0%, rgba(10,15,25,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.04)',
        minHeight: large ? '340px' : '60px',
      }}
    >
      {/* Scan lines */}
      <div className="absolute inset-0 z-[1]" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)',
      }} />

      {/* Center icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-[2] gap-2">
        <div className={cn('rounded-full flex items-center justify-center', large ? 'w-16 h-16' : 'w-8 h-8')}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Video className={cn('text-muted-foreground/30', large ? 'h-7 w-7' : 'h-3 w-3')} />
        </div>
        {large && (
          <span className="text-[10px] text-muted-foreground/40 font-mono">Feed en attente</span>
        )}
      </div>

      {/* Camera label */}
      <div className="absolute top-1.5 left-1.5 z-[4] flex items-center gap-1.5">
        <div className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <span className={cn('font-mono uppercase tracking-wider text-white/70', large ? 'text-[9px]' : 'text-[7px]')}>
            {cam.name}
          </span>
        </div>
        {cam.active && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className={cn('text-red-400/80 font-medium uppercase tracking-wider', large ? 'text-[8px]' : 'text-[6px]')}>REC</span>
          </div>
        )}
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-[3] px-2 py-1.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
        <div className="flex items-center justify-between">
          <span className={cn('text-white/50 truncate', large ? 'text-[9px]' : 'text-[7px]')} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {cam.location}
          </span>
          {large && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Move className="h-3 w-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Maximize2 className="h-3 w-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Compact Event Card for alerts panel ── */
function CompactEventCard({ event, onAcknowledge, typeConfig, zoneConfig, t, lang }: {
  event: CameraEvent;
  onAcknowledge: (id: string) => void;
  typeConfig: Record<string, any>;
  zoneConfig: Record<string, any>;
  t: any;
  lang: Language;
}) {
  const dateLocale = getDateLocale(lang);
  const cfg = typeConfig[event.event_type] || { icon: Eye, label: event.event_type, color: 'text-muted-foreground' };
  const sevCfg = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
  const TypeIcon = cfg.icon;
  const fmtOpts = dateLocale ? { addSuffix: true, locale: dateLocale } : { addSuffix: true };
  const timeAgo = formatDistanceToNow(new Date(event.created_at), fmtOpts);

  return (
    <div className={cn(
      'flex items-start gap-2 p-2 rounded-lg border transition-all',
      sevCfg.bg,
      event.severity === 'critical' && 'ring-1 ring-red-500/20',
    )}>
      <div className="p-1 rounded">
        <TypeIcon className={cn('h-3.5 w-3.5', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{event.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          {event.plate_number && (
            <span className="text-[10px] font-mono text-muted-foreground">🚛 {event.plate_number}</span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0" onClick={() => onAcknowledge(event.id)}>
        <Check className="h-3 w-3" />
      </Button>
    </div>
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
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const EVENT_TYPE_CONFIG = getEventTypeConfig(t);
  const ZONE_CONFIG = getZoneConfig(t);
  const typeConfig = EVENT_TYPE_CONFIG[event.event_type] || { icon: Eye, label: event.event_type, color: 'text-muted-foreground' };
  const sevConfig = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
  const TypeIcon = typeConfig.icon;
  const fmtOpts = dateLocale ? { addSuffix: true, locale: dateLocale } : { addSuffix: true };
  const timeAgo = formatDistanceToNow(new Date(event.created_at), fmtOpts);

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
                {event.severity === 'critical' ? t.pages.surveillance.severityCritical : event.severity === 'warning' ? t.pages.surveillance.severityWarning : t.pages.surveillance.severityInfo}
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
                <span className="font-mono">📄 BL : {event.matched_bl_id}</span>
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
                ✓
              </Button>
            )}
            {event.is_acknowledged && (
              <Badge variant="outline" className="text-green-600">
                <Check className="h-3 w-3 mr-1" /> ✓
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddCameraDialog({ onAdd, t }: { onAdd: (cam: Record<string, unknown>) => void; t: any }) {
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
          {t.pages.surveillance.addCamera}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.pages.surveillance.newCamera}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t.pages.surveillance.name}</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="CAM-01" />
          </div>
          <div>
            <Label>{t.pages.surveillance.location}</Label>
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Entrée principale" />
          </div>
          <div>
            <Label>{t.pages.surveillance.zone}</Label>
            <Select value={form.zone} onValueChange={v => setForm(f => ({ ...f, zone: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="security">{t.pages.surveillance.zoneSecurity}</SelectItem>
                <SelectItem value="production">{t.pages.surveillance.zoneProduction}</SelectItem>
                <SelectItem value="fleet">{t.pages.surveillance.zoneFleet}</SelectItem>
                <SelectItem value="inventory">{t.pages.surveillance.zoneInventory}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t.pages.surveillance.brand}</Label>
            <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Hikvision" />
          </div>
          <div>
            <Label>{t.pages.surveillance.ipAddress}</Label>
            <Input value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))} placeholder="192.168.1.100" />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            {t.pages.surveillance.addCamera}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
