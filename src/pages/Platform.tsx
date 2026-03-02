import { useState, useEffect, useCallback, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Settings, Plus, Trash2, GripVertical, LayoutGrid, Monitor, Wifi, WifiOff,
  Cpu, Server, Radio, Thermometer, Gauge, Zap, Activity, Eye, Clock,
  BarChart3, TrendingUp, MapPin, Layers, Save, RotateCcw, Maximize2,
  Smartphone, Tablet, ChevronDown, Check, X, ArrowUpRight,
  LineChart, PieChart, Grid3X3, Boxes, Wrench, Database, GitMerge,
  Timer, AlertTriangle, CheckCircle, Signal, Power, Cable, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

// ─── Design Tokens ────────────────────────────────────────────
const T = {
  bg: '#0B1120', card: 'rgba(17,27,46,0.85)', cardBorder: 'rgba(255,215,0,0.10)',
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.12)',
  green: '#22C55E', greenDim: 'rgba(34,197,94,0.12)',
  red: '#EF4444', redDim: 'rgba(239,68,68,0.12)',
  cyan: '#06B6D4', cyanDim: 'rgba(6,182,212,0.12)',
  purple: '#A855F7', purpleDim: 'rgba(168,85,247,0.12)',
  amber: '#F59E0B', amberDim: 'rgba(245,158,11,0.12)',
  blue: '#3B82F6', blueDim: 'rgba(59,130,246,0.12)',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  border: 'rgba(255,255,255,0.06)',
};
const MONO = "'JetBrains Mono', monospace";
const SANS = "'DM Sans', sans-serif";

// ─── TYPES ────────────────────────────────────────────────────
interface Equipment {
  id: string; name: string; type: string; protocol: string;
  status: 'online' | 'offline' | 'warning'; ip?: string;
  metrics: { label: string; value: string; unit: string }[];
  lastSeen: string;
}

interface DashWidget {
  id: string; type: string; title: string; w: number; h: number;
  config?: Record<string, any>;
}

interface FusionSource {
  id: string; name: string; type: string; active: boolean;
  dataPoints: number; lastSync: string;
}

// ─── EQUIPMENT DATA ───────────────────────────────────────────
const PROTOCOLS = ['MODBUS TCP', 'MQTT', 'OPC-UA', 'REST API', 'BACnet', 'Profinet', 'Custom HTTP'];
const EQUIP_TYPES = ['Capteur', 'Automate PLC', 'Variateur', 'Compteur', 'Caméra', 'Balance', 'Sonde', 'API Externe'];

const INITIAL_EQUIPMENT: Equipment[] = [
  { id: 'e1', name: 'Malaxeur Principal', type: 'Automate PLC', protocol: 'MODBUS TCP', status: 'online', ip: '192.168.1.10',
    metrics: [{ label: 'Vitesse', value: '42', unit: 'RPM' }, { label: 'Temp', value: '67', unit: '°C' }, { label: 'Charge', value: '78', unit: '%' }], lastSeen: 'Maintenant' },
  { id: 'e2', name: 'Sonde Humidité Sable', type: 'Capteur', protocol: 'MQTT', status: 'online', ip: '192.168.1.25',
    metrics: [{ label: 'Humidité', value: '4.2', unit: '%' }, { label: 'Temp', value: '23', unit: '°C' }], lastSeen: 'il y a 5s' },
  { id: 'e3', name: 'Balance Camion', type: 'Balance', protocol: 'REST API', status: 'online', ip: '192.168.1.30',
    metrics: [{ label: 'Poids', value: '24.5', unit: 'T' }, { label: 'Tare', value: '8.2', unit: 'T' }], lastSeen: 'il y a 12s' },
  { id: 'e4', name: 'Compresseur Air', type: 'Variateur', protocol: 'Profinet', status: 'warning', ip: '192.168.1.45',
    metrics: [{ label: 'Pression', value: '6.8', unit: 'bar' }, { label: 'Débit', value: '320', unit: 'L/min' }], lastSeen: 'il y a 2min' },
  { id: 'e5', name: 'Station Météo', type: 'API Externe', protocol: 'REST API', status: 'online',
    metrics: [{ label: 'Temp', value: '28', unit: '°C' }, { label: 'Vent', value: '12', unit: 'km/h' }, { label: 'Humidité', value: '45', unit: '%' }], lastSeen: 'il y a 30s' },
  { id: 'e6', name: 'Silo Ciment #1', type: 'Sonde', protocol: 'OPC-UA', status: 'offline', ip: '192.168.1.60',
    metrics: [{ label: 'Niveau', value: '—', unit: '%' }], lastSeen: 'il y a 15min' },
];

// ─── WIDGET LIBRARY ───────────────────────────────────────────
const WIDGET_LIBRARY = [
  { type: 'kpi', title: 'KPI Compteur', icon: Gauge, desc: 'Affiche une métrique clé avec tendance', defaultW: 1, defaultH: 1 },
  { type: 'chart-line', title: 'Courbe Temporelle', icon: LineChart, desc: 'Graphique linéaire interactif', defaultW: 2, defaultH: 1 },
  { type: 'chart-bar', title: 'Histogramme', icon: BarChart3, desc: 'Diagramme en barres comparatif', defaultW: 2, defaultH: 1 },
  { type: 'chart-pie', title: 'Camembert', icon: PieChart, desc: 'Répartition en secteurs', defaultW: 1, defaultH: 1 },
  { type: 'map', title: 'Carte GPS', icon: MapPin, desc: 'Localisation des équipements/camions', defaultW: 2, defaultH: 2 },
  { type: 'feed', title: 'Flux d\'Alertes', icon: Activity, desc: 'Alertes et événements en temps réel', defaultW: 1, defaultH: 2 },
  { type: 'table', title: 'Tableau de Données', icon: Grid3X3, desc: 'Données tabulaires filtrables', defaultW: 2, defaultH: 1 },
  { type: 'camera', title: 'Flux Caméra', icon: Eye, desc: 'Retransmission vidéo CCTV', defaultW: 1, defaultH: 1 },
  { type: 'heatmap', title: 'Carte de Chaleur', icon: Layers, desc: 'Heatmap de données fusionnées', defaultW: 2, defaultH: 2 },
  { type: 'timeline', title: 'Chronologie', icon: Clock, desc: 'Frise d\'événements multi-sources', defaultW: 3, defaultH: 1 },
];

const PRESET_LAYOUTS = [
  { name: 'CEO — Vue Stratégique', widgets: ['kpi', 'kpi', 'kpi', 'chart-line', 'chart-pie', 'feed'] },
  { name: 'Centraliste — Production', widgets: ['kpi', 'kpi', 'chart-bar', 'camera', 'feed', 'table'] },
  { name: 'Logistique — Dispatch', widgets: ['map', 'kpi', 'kpi', 'table', 'timeline'] },
  { name: 'Qualité — Laboratoire', widgets: ['chart-line', 'chart-line', 'kpi', 'kpi', 'heatmap'] },
];

// ─── FUSION SOURCES ───────────────────────────────────────────
const INITIAL_SOURCES: FusionSource[] = [
  { id: 'fs1', name: 'Production (BLs)', type: 'database', active: true, dataPoints: 12847, lastSync: 'Live' },
  { id: 'fs2', name: 'Capteurs IoT', type: 'mqtt', active: true, dataPoints: 847293, lastSync: 'Live' },
  { id: 'fs3', name: 'Caméras IA', type: 'webhook', active: true, dataPoints: 4521, lastSync: 'il y a 10s' },
  { id: 'fs4', name: 'ERP Comptable', type: 'api', active: true, dataPoints: 3200, lastSync: 'il y a 5min' },
  { id: 'fs5', name: 'Station Météo', type: 'api', active: true, dataPoints: 8640, lastSync: 'il y a 30s' },
  { id: 'fs6', name: 'GPS Flotte', type: 'websocket', active: false, dataPoints: 0, lastSync: 'Déconnecté' },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────
function EquipmentCard({ eq, onRemove }: { eq: Equipment; onRemove: (id: string) => void }) {
  const statusColors = { online: T.green, offline: T.red, warning: T.amber };
  const statusLabels = { online: 'EN LIGNE', offline: 'HORS LIGNE', warning: 'ALERTE' };
  const c = statusColors[eq.status];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '14px 16px', borderLeft: `3px solid ${c}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Cpu size={14} color={T.gold} />
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.textPri }}>{eq.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge style={{ background: c + '22', color: c, fontSize: 8.5, fontFamily: MONO, letterSpacing: 1.5, border: 'none' }}>
            <div className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: c, animation: eq.status === 'online' ? 'tbPulse 2s infinite' : undefined }} />
            {statusLabels[eq.status]}
          </Badge>
          <button onClick={() => onRemove(eq.id)} className="opacity-40 hover:opacity-100 transition-opacity">
            <Trash2 size={13} color={T.red} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <Badge variant="outline" style={{ fontSize: 9, fontFamily: MONO, color: T.textDim, borderColor: T.border }}>{eq.protocol}</Badge>
        <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>{eq.type}</span>
        {eq.ip && <span style={{ fontFamily: MONO, fontSize: 9.5, color: T.textDim }}>{eq.ip}</span>}
      </div>
      <div className="flex gap-3 flex-wrap">
        {eq.metrics.map((m, i) => (
          <div key={i} className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800, color: eq.status === 'offline' ? T.textDim : T.gold }}>{m.value}</div>
            <div style={{ fontFamily: SANS, fontSize: 9, color: T.textDim }}>{m.label} ({m.unit})</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2">
        <Clock size={10} color={T.textDim} />
        <span style={{ fontFamily: SANS, fontSize: 9, color: T.textDim }}>Vu : {eq.lastSeen}</span>
      </div>
    </motion.div>
  );
}

function WidgetPickerItem({ w, onAdd }: { w: typeof WIDGET_LIBRARY[0]; onAdd: () => void }) {
  return (
    <button onClick={onAdd} className="flex items-center gap-3 p-3 rounded-xl text-left w-full transition-colors"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = T.gold + '44')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
      <div className="p-2 rounded-lg" style={{ background: T.goldDim }}>
        <w.icon size={16} color={T.gold} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: T.textPri }}>{w.title}</div>
        <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>{w.desc}</div>
      </div>
      <Plus size={14} color={T.gold} />
    </button>
  );
}

function DashWidgetCard({ widget, onRemove, editMode }: { widget: DashWidget; onRemove: (id: string) => void; editMode: boolean }) {
  const lib = WIDGET_LIBRARY.find(w => w.type === widget.type);
  const Icon = lib?.icon || BarChart3;
  return (
    <motion.div layout className="relative group" style={{
      background: T.card, border: `1px solid ${editMode ? T.gold + '33' : T.cardBorder}`,
      borderRadius: 12, padding: '12px 14px', gridColumn: `span ${widget.w}`, gridRow: `span ${widget.h}`,
      transition: 'border-color 0.2s',
    }}>
      {editMode && (
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={() => onRemove(widget.id)} className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: T.red, color: 'white' }}>
            <X size={10} />
          </button>
        </div>
      )}
      {editMode && (
        <div className="absolute top-2 left-2 cursor-grab opacity-30 group-hover:opacity-70 transition-opacity">
          <GripVertical size={14} color={T.textDim} />
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} color={T.gold} />
        <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: T.textPri }}>{widget.title}</span>
      </div>
      {/* Placeholder content */}
      <div className="flex-1 flex items-center justify-center rounded-lg" style={{
        background: 'rgba(255,255,255,0.02)', minHeight: widget.h > 1 ? 140 : 60,
        border: `1px dashed ${T.border}`,
      }}>
        <div className="text-center">
          <Icon size={24} color={T.textDim} className="mx-auto mb-1 opacity-30" />
          <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>
            {editMode ? 'Glisser pour réorganiser' : 'Données en temps réel'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function FusionSourceCard({ src, onToggle }: { src: FusionSource; onToggle: (id: string) => void }) {
  const typeIcons: Record<string, React.ElementType> = { database: Database, mqtt: Radio, webhook: Zap, api: Globe, websocket: Signal };
  const Icon = typeIcons[src.type] || Database;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: '12px 14px' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} color={src.active ? T.cyan : T.textDim} />
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: src.active ? T.textPri : T.textDim }}>{src.name}</span>
        </div>
        <Switch checked={src.active} onCheckedChange={() => onToggle(src.id)} />
      </div>
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>{src.dataPoints.toLocaleString()} pts</span>
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: src.active ? T.green : T.red }}>{src.lastSync}</span>
      </div>
    </div>
  );
}

function CorrelationRow({ sources, insight, confidence, trend }: {
  sources: string[]; insight: string; confidence: number; trend: 'up' | 'down' | 'stable';
}) {
  const trendColor = trend === 'up' ? T.green : trend === 'down' ? T.red : T.amber;
  return (
    <div className="flex items-start gap-3 py-3 border-b" style={{ borderColor: T.border }}>
      <GitMerge size={14} color={T.purple} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: SANS, fontSize: 12, color: T.textPri, lineHeight: 1.5 }}>{insight}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {sources.map((s, i) => (
            <Badge key={i} style={{ fontSize: 8.5, fontFamily: MONO, background: T.purpleDim, color: T.purple, border: 'none' }}>{s}</Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 800, color: trendColor }}>{confidence}%</span>
        <TrendingUp size={12} color={trendColor} style={{ transform: trend === 'down' ? 'rotate(180deg)' : trend === 'stable' ? 'rotate(90deg)' : undefined }} />
      </div>
    </div>
  );
}

// Globe animation for Data Fusion
function DataGlobe() {
  return (
    <div className="relative w-24 h-24 mx-auto">
      <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${T.purple}22`, animation: 'spin 20s linear infinite' }} />
      <div className="absolute inset-2 rounded-full" style={{ border: `1px solid ${T.cyan}22`, animation: 'spin 15s linear infinite reverse' }} />
      <div className="absolute inset-4 rounded-full" style={{ border: `1px solid ${T.gold}22`, animation: 'spin 10s linear infinite' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <GitMerge size={20} color={T.purple} />
      </div>
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <div key={i} className="absolute w-2 h-2 rounded-full" style={{
          background: [T.cyan, T.gold, T.green, T.purple, T.amber, T.blue][i],
          top: `${50 + 42 * Math.sin(deg * Math.PI / 180)}%`,
          left: `${50 + 42 * Math.cos(deg * Math.PI / 180)}%`,
          transform: 'translate(-50%, -50%)',
          animation: `tbPulse ${2 + i * 0.3}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function Platform() {
  const [activeTab, setActiveTab] = useState('equipment');
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [dashWidgets, setDashWidgets] = useState<DashWidget[]>([
    { id: 'w1', type: 'kpi', title: 'Volume Jour', w: 1, h: 1 },
    { id: 'w2', type: 'kpi', title: 'Marge Brute', w: 1, h: 1 },
    { id: 'w3', type: 'kpi', title: 'Livraisons', w: 1, h: 1 },
    { id: 'w4', type: 'chart-line', title: 'Production 7j', w: 2, h: 1 },
    { id: 'w5', type: 'feed', title: 'Alertes', w: 1, h: 2 },
    { id: 'w6', type: 'chart-bar', title: 'Top Clients', w: 2, h: 1 },
  ]);
  const [editMode, setEditMode] = useState(false);
  const [fusionSources, setFusionSources] = useState<FusionSource[]>(INITIAL_SOURCES);
  const [addEquipOpen, setAddEquipOpen] = useState(false);
  const [newEquip, setNewEquip] = useState({ name: '', type: EQUIP_TYPES[0], protocol: PROTOCOLS[0], ip: '' });

  const handleAddEquipment = useCallback(() => {
    if (!newEquip.name.trim()) { toast.error('Nom requis'); return; }
    const eq: Equipment = {
      id: `e${Date.now()}`, name: newEquip.name, type: newEquip.type,
      protocol: newEquip.protocol, status: 'offline', ip: newEquip.ip || undefined,
      metrics: [{ label: 'Signal', value: '—', unit: '' }], lastSeen: 'Jamais',
    };
    setEquipment(prev => [eq, ...prev]);
    setNewEquip({ name: '', type: EQUIP_TYPES[0], protocol: PROTOCOLS[0], ip: '' });
    setAddEquipOpen(false);
    toast.success(`${eq.name} ajouté — en attente de connexion`);
  }, [newEquip]);

  const handleRemoveEquip = useCallback((id: string) => {
    setEquipment(prev => prev.filter(e => e.id !== id));
    toast.info('Équipement retiré');
  }, []);

  const handleAddWidget = useCallback((type: string) => {
    const lib = WIDGET_LIBRARY.find(w => w.type === type);
    if (!lib) return;
    const widget: DashWidget = {
      id: `w${Date.now()}`, type, title: lib.title,
      w: lib.defaultW, h: lib.defaultH,
    };
    setDashWidgets(prev => [...prev, widget]);
    toast.success(`Widget "${lib.title}" ajouté`);
  }, []);

  const handleRemoveWidget = useCallback((id: string) => {
    setDashWidgets(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleApplyPreset = useCallback((preset: typeof PRESET_LAYOUTS[0]) => {
    const widgets = preset.widgets.map((type, i) => {
      const lib = WIDGET_LIBRARY.find(w => w.type === type)!;
      return { id: `wp${Date.now()}_${i}`, type, title: lib.title, w: lib.defaultW, h: lib.defaultH };
    });
    setDashWidgets(widgets);
    toast.success(`Layout "${preset.name}" appliqué`);
  }, []);

  const handleToggleSource = useCallback((id: string) => {
    setFusionSources(prev => prev.map(s =>
      s.id === id ? { ...s, active: !s.active, lastSync: !s.active ? 'Connexion...' : 'Déconnecté', dataPoints: !s.active ? s.dataPoints : 0 } : s
    ));
  }, []);

  const handleSaveLayout = useCallback(() => {
    try {
      localStorage.setItem('tbos_dashboard_layout', JSON.stringify(dashWidgets));
      toast.success('Layout sauvegardé localement');
    } catch { toast.error('Erreur de sauvegarde'); }
  }, [dashWidgets]);

  // Load saved layout on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tbos_dashboard_layout');
      if (saved) setDashWidgets(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const equipStats = useMemo(() => ({
    online: equipment.filter(e => e.status === 'online').length,
    warning: equipment.filter(e => e.status === 'warning').length,
    offline: equipment.filter(e => e.status === 'offline').length,
  }), [equipment]);

  const activeSourceCount = useMemo(() => fusionSources.filter(s => s.active).length, [fusionSources]);

  return (
    <MainLayout>
      <div style={{ background: T.bg, minHeight: '100vh', padding: '0 20px 40px' }}>
        {/* ─── HEADER ─── */}
        <div className="flex items-center gap-3 pt-6 pb-2">
          <div style={{ width: 4, height: 32, background: T.gold, borderRadius: 2 }} />
          <Boxes size={22} color={T.gold} />
          <div>
            <h1 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: T.textPri, margin: 0, lineHeight: 1.2 }}>
              Plateforme <span style={{ color: T.gold }}>Universelle</span>
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, margin: 0 }}>
              Équipements • Dashboard Builder • Fusion de Données
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge style={{ background: T.greenDim, color: T.green, fontSize: 10, fontFamily: MONO, border: `1px solid ${T.green}33` }}>
              {equipStats.online} EN LIGNE
            </Badge>
            {equipStats.warning > 0 && (
              <Badge style={{ background: T.amberDim, color: T.amber, fontSize: 10, fontFamily: MONO, border: `1px solid ${T.amber}33` }}>
                {equipStats.warning} ALERTE
              </Badge>
            )}
          </div>
        </div>

        {/* ─── TABS ─── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5">
          <TabsList className="bg-transparent border p-1 rounded-xl" style={{ borderColor: T.cardBorder }}>
            {[
              { val: 'equipment', icon: Cable, label: 'Équipements' },
              { val: 'dashboard', icon: LayoutGrid, label: 'Dashboard Builder' },
              { val: 'fusion', icon: GitMerge, label: 'Fusion de Données' },
            ].map(tab => (
              <TabsTrigger key={tab.val} value={tab.val}
                className="gap-1.5 text-xs data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
                <tab.icon size={13} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ═══ TAB: EQUIPMENT ═══ */}
          <TabsContent value="equipment" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>
                  {equipment.length} Équipements Configurés
                </span>
              </div>
              <Dialog open={addEquipOpen} onOpenChange={setAddEquipOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Plus size={13} /> Ajouter Équipement
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-amber-500/20">
                  <DialogHeader>
                    <DialogTitle className="text-amber-400 flex items-center gap-2"><Wrench size={16} /> Nouvel Équipement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <Input placeholder="Nom de l'équipement" value={newEquip.name}
                      onChange={e => setNewEquip(p => ({ ...p, name: e.target.value }))}
                      className="bg-slate-800 border-slate-700" />
                    <Select value={newEquip.type} onValueChange={v => setNewEquip(p => ({ ...p, type: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent>{EQUIP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={newEquip.protocol} onValueChange={v => setNewEquip(p => ({ ...p, protocol: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent>{PROTOCOLS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Adresse IP (optionnel)" value={newEquip.ip}
                      onChange={e => setNewEquip(p => ({ ...p, ip: e.target.value }))}
                      className="bg-slate-800 border-slate-700" />
                    <Button onClick={handleAddEquipment} className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">
                      <Check size={14} className="mr-1.5" /> Connecter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Protocol Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'MODBUS TCP', count: equipment.filter(e => e.protocol === 'MODBUS TCP').length, icon: Server, color: T.cyan },
                { label: 'MQTT / IoT', count: equipment.filter(e => e.protocol === 'MQTT').length, icon: Radio, color: T.green },
                { label: 'REST API', count: equipment.filter(e => e.protocol === 'REST API').length, icon: Globe, color: T.purple },
                { label: 'Industriel', count: equipment.filter(e => ['OPC-UA', 'Profinet', 'BACnet'].includes(e.protocol)).length, icon: Cpu, color: T.amber },
              ].map((s, i) => (
                <div key={i} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim, letterSpacing: 1 }}>{s.label}</span>
                    <s.icon size={13} color={s.color} />
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.count}</div>
                </div>
              ))}
            </div>

            {/* Equipment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {equipment.map(eq => <EquipmentCard key={eq.id} eq={eq} onRemove={handleRemoveEquip} />)}
            </div>
          </TabsContent>

          {/* ═══ TAB: DASHBOARD BUILDER ═══ */}
          <TabsContent value="dashboard" className="mt-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>
                  Éditeur de Layout
                </span>
                <Badge style={{ background: editMode ? T.goldDim : 'rgba(255,255,255,0.06)', color: editMode ? T.gold : T.textDim, fontSize: 10, fontFamily: MONO, border: 'none' }}>
                  {editMode ? 'MODE ÉDITION' : `${dashWidgets.length} WIDGETS`}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditMode(!editMode)}
                  className={cn("gap-1.5 text-xs", editMode && "border-amber-500/40 text-amber-400")}>
                  {editMode ? <Check size={13} /> : <Settings size={13} />}
                  {editMode ? 'Terminer' : 'Éditer'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleSaveLayout} className="gap-1.5 text-xs">
                  <Save size={13} /> Sauvegarder
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Widget Canvas */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-3 gap-3 auto-rows-[120px]">
                  <AnimatePresence>
                    {dashWidgets.map(w => (
                      <DashWidgetCard key={w.id} widget={w} onRemove={handleRemoveWidget} editMode={editMode} />
                    ))}
                  </AnimatePresence>
                </div>
                {dashWidgets.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 rounded-xl" style={{ border: `2px dashed ${T.border}` }}>
                    <LayoutGrid size={32} color={T.textDim} className="mb-3 opacity-30" />
                    <span style={{ fontFamily: SANS, fontSize: 14, color: T.textDim }}>Ajoutez des widgets depuis le panneau latéral</span>
                  </div>
                )}
              </div>

              {/* Sidebar: Widget Library + Presets */}
              <div className="space-y-4">
                {/* Presets */}
                <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '14px 16px' }}>
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: T.gold, letterSpacing: 1 }}>LAYOUTS PRÉ-DÉFINIS</span>
                  <div className="space-y-2 mt-3">
                    {PRESET_LAYOUTS.map((p, i) => (
                      <button key={i} onClick={() => handleApplyPreset(p)}
                        className="w-full text-left p-2.5 rounded-lg transition-colors"
                        style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = T.gold + '44')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                        <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: T.textPri }}>{p.name}</span>
                        <div className="flex gap-1 mt-1">
                          {p.widgets.slice(0, 4).map((wt, j) => {
                            const lib = WIDGET_LIBRARY.find(w => w.type === wt);
                            const WIcon = lib?.icon || BarChart3;
                            return <WIcon key={j} size={10} color={T.textDim} />;
                          })}
                          {p.widgets.length > 4 && <span style={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>+{p.widgets.length - 4}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Widget Library */}
                <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '14px 16px' }}>
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: T.gold, letterSpacing: 1 }}>BIBLIOTHÈQUE WIDGETS</span>
                  <ScrollArea className="h-[350px] mt-3">
                    <div className="space-y-2">
                      {WIDGET_LIBRARY.map(w => (
                        <WidgetPickerItem key={w.type} w={w} onAdd={() => handleAddWidget(w.type)} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══ TAB: DATA FUSION ═══ */}
          <TabsContent value="fusion" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sources */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Database size={14} color={T.gold} />
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri }}>SOURCES DE DONNÉES</span>
                  <Badge style={{ background: T.cyanDim, color: T.cyan, fontSize: 10, fontFamily: MONO, border: 'none' }}>
                    {activeSourceCount}/{fusionSources.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {fusionSources.map(src => (
                    <FusionSourceCard key={src.id} src={src} onToggle={handleToggleSource} />
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <DataGlobe />
                  <p style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginTop: 8 }}>
                    {activeSourceCount} sources actives — corrélation en temps réel
                  </p>
                </div>
              </div>

              {/* Correlation Insights */}
              <div className="lg:col-span-2" style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '16px 20px' }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} color={T.gold} />
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri }}>INSIGHTS FUSIONNÉS</span>
                  <Badge style={{ background: T.greenDim, color: T.green, fontSize: 9, fontFamily: MONO, border: 'none' }}>IA ACTIVE</Badge>
                </div>
                <ScrollArea className="h-[420px]">
                  <CorrelationRow
                    sources={['Production', 'Météo']}
                    insight="Corrélation détectée : la température >35°C réduit le temps de prise de 18%. Recommandation : ajuster le dosage d'adjuvant retardateur."
                    confidence={94} trend="up" />
                  <CorrelationRow
                    sources={['Capteurs', 'BLs', 'Caméras']}
                    insight="Le malaxeur principal consomme 12% d'énergie supplémentaire depuis 3 jours. La charge est normale — maintenance préventive recommandée."
                    confidence={87} trend="down" />
                  <CorrelationRow
                    sources={['GPS', 'BLs', 'Clients']}
                    insight="Les livraisons vers la zone Est prennent en moyenne 23 min de plus que prévu. Embouteillage récurrent entre 10h-12h sur la N1."
                    confidence={91} trend="stable" />
                  <CorrelationRow
                    sources={['ERP', 'Production']}
                    insight="La marge brute sur B25 a augmenté de 3.2 pts suite à la renégociation fournisseur ciment. Impact estimé : +180k MAD/an."
                    confidence={96} trend="up" />
                  <CorrelationRow
                    sources={['Capteurs', 'Qualité']}
                    insight="L'humidité du sable oscillant entre 4-6% cause des écarts d'affaissement. Stabiliser à 4.5% ±0.3% via contrôle automatique."
                    confidence={82} trend="stable" />
                  <CorrelationRow
                    sources={['Caméras', 'GPS', 'Production']}
                    insight="Anomalie : 2 camions ont quitté le site sans bon de livraison associé hier à 17:42. Vérification recommandée."
                    confidence={78} trend="down" />
                </ScrollArea>
              </div>
            </div>

            {/* Fusion Timeline */}
            <div className="mt-4" style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '20px 24px' }}>
              <div className="flex items-center gap-2 mb-4">
                <Timer size={14} color={T.gold} />
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri }}>CHRONOLOGIE FUSIONNÉE — AUJOURD'HUI</span>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: T.border }} />
                {[
                  { time: '06:00', event: 'Démarrage centrale — tous capteurs connectés', type: 'system', color: T.green },
                  { time: '07:15', event: 'Pic humidité sable détecté (6.1%) — correction automatique eau activée', type: 'sensor', color: T.cyan },
                  { time: '08:30', event: 'Premier BL produit — B25 client ATLAS, 8m³', type: 'production', color: T.gold },
                  { time: '09:42', event: 'Alerte caméra : véhicule non identifié à l\'entrée — résolu (visiteur)', type: 'camera', color: T.amber },
                  { time: '10:15', event: 'Pression compresseur basse (6.2 bar) — maintenance alertée', type: 'sensor', color: T.red },
                  { time: '11:00', event: '15 BLs livrés — objectif journalier à 62%', type: 'production', color: T.gold },
                ].map((ev, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-4 mb-4 ml-1">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 relative z-10" style={{ background: ev.color, boxShadow: `0 0 8px ${ev.color}44` }} />
                    <div>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: ev.color, fontWeight: 700 }}>{ev.time}</span>
                      <p style={{ fontFamily: SANS, fontSize: 12, color: T.textPri, marginTop: 2 }}>{ev.event}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <style>{`
          @keyframes tbPulse { 0%,100%{opacity:.7} 50%{opacity:1} }
          @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>
      </div>
    </MainLayout>
  );
}
