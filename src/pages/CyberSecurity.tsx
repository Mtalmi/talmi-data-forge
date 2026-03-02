import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield, ShieldCheck, ShieldAlert, Wifi, WifiOff, Eye, EyeOff,
  Fingerprint, Lock, Unlock, AlertTriangle, Activity, Users,
  Server, Globe, Zap, Radio, MapPin, Clock, CheckCircle,
  XCircle, Ban, RefreshCw, Search, Cpu, HardDrive, Network,
  Scan, Bug, KeyRound, Radar, LayoutGrid, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Design tokens ──────────────────────────────────────────────
const T = {
  bg: '#0B1120',
  card: 'rgba(17,27,46,0.85)',
  cardBorder: 'rgba(255,215,0,0.10)',
  gold: '#FFD700',
  goldDim: 'rgba(255,215,0,0.12)',
  green: '#22C55E',
  greenDim: 'rgba(34,197,94,0.12)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.12)',
  cyan: '#06B6D4',
  cyanDim: 'rgba(6,182,212,0.12)',
  purple: '#A855F7',
  purpleDim: 'rgba(168,85,247,0.12)',
  amber: '#F59E0B',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textDim: '#64748B',
  border: 'rgba(255,255,255,0.06)',
};
const MONO = "'JetBrains Mono', monospace";
const SANS = "'DM Sans', sans-serif";

// ─── IDS Packet Stream Simulator ──────────────────────────────
function usePacketStream(count = 20) {
  const [packets, setPackets] = useState<Array<{
    id: number; src: string; dst: string; protocol: string;
    size: number; status: 'clean' | 'suspicious' | 'blocked';
    timestamp: string; port: number;
  }>>([]);

  useEffect(() => {
    const protocols = ['TCP', 'UDP', 'HTTPS', 'DNS', 'MQTT', 'SSH', 'MODBUS'];
    const statuses: ('clean' | 'suspicious' | 'blocked')[] = ['clean', 'clean', 'clean', 'clean', 'suspicious', 'blocked'];
    const genIP = () => `${10 + Math.floor(Math.random() * 240)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    
    const initial = Array.from({ length: count }, (_, i) => ({
      id: i,
      src: genIP(),
      dst: genIP(),
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      size: Math.floor(Math.random() * 9000) + 64,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: new Date(Date.now() - Math.random() * 60000).toISOString(),
      port: [80, 443, 8080, 22, 502, 1883, 53][Math.floor(Math.random() * 7)],
    }));
    setPackets(initial);

    const iv = setInterval(() => {
      setPackets(prev => {
        const newPacket = {
          id: Date.now(),
          src: genIP(),
          dst: genIP(),
          protocol: protocols[Math.floor(Math.random() * protocols.length)],
          size: Math.floor(Math.random() * 9000) + 64,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          timestamp: new Date().toISOString(),
          port: [80, 443, 8080, 22, 502, 1883, 53][Math.floor(Math.random() * 7)],
        };
        return [newPacket, ...prev.slice(0, count - 1)];
      });
    }, 2200);
    return () => clearInterval(iv);
  }, [count]);
  return packets;
}

// ─── Threat Level Gauge ───────────────────────────────────────
function ThreatGauge({ level }: { level: number }) {
  const color = level > 75 ? T.red : level > 40 ? T.amber : T.green;
  const label = level > 75 ? 'CRITIQUE' : level > 40 ? 'ÉLEVÉ' : 'NOMINAL';
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${level * 2.64} 264`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color }}>{level}</span>
          <span style={{ fontFamily: SANS, fontSize: 9, color: T.textDim, letterSpacing: 1.5 }}>/ 100</span>
        </div>
      </div>
      <Badge style={{ background: color + '22', color, border: `1px solid ${color}44`, fontFamily: MONO, fontSize: 11, letterSpacing: 2 }}>
        {label}
      </Badge>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────
function AnimNum({ val, color = T.textPri }: { val: number; color?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = display;
    const step = () => {
      start += (val - start) * 0.15;
      if (Math.abs(val - start) < 0.5) { setDisplay(val); return; }
      setDisplay(Math.round(start));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [val]);
  return <span style={{ fontFamily: MONO, color, fontWeight: 800 }}>{display.toLocaleString()}</span>;
}

// ─── Access Zone Card ─────────────────────────────────────────
function AccessZone({ name, occupancy, maxOccupancy, status, icon: Icon }: {
  name: string; occupancy: number; maxOccupancy: number;
  status: 'secure' | 'alert' | 'locked'; icon: React.ElementType;
}) {
  const pct = Math.round((occupancy / maxOccupancy) * 100);
  const statusColors = { secure: T.green, alert: T.amber, locked: T.red };
  const statusLabels = { secure: 'SÉCURISÉ', alert: 'ALERTE', locked: 'VERROUILLÉ' };
  const c = statusColors[status];
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} color={T.gold} />
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.textPri }}>{name}</span>
        </div>
        <Badge style={{ background: c + '22', color: c, border: `1px solid ${c}44`, fontSize: 9, fontFamily: MONO, letterSpacing: 1.5 }}>
          {statusLabels[status]}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 3, background: pct > 80 ? T.red : pct > 50 ? T.amber : T.green }}
            />
          </div>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 12, color: T.textSec }}>{occupancy}/{maxOccupancy}</span>
      </div>
    </div>
  );
}

// ─── IDS Event Row ────────────────────────────────────────────
function IDSRow({ packet }: { packet: ReturnType<typeof usePacketStream>[0] }) {
  const colors = { clean: T.green, suspicious: T.amber, blocked: T.red };
  const icons = { clean: CheckCircle, suspicious: AlertTriangle, blocked: Ban };
  const Icon = icons[packet.status];
  const c = colors[packet.status];
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 py-1.5 border-b"
      style={{ borderColor: T.border }}
    >
      <Icon size={13} color={c} className="shrink-0" />
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: c, width: 68, flexShrink: 0 }}>{packet.protocol}</span>
      <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {packet.src}:{packet.port} → {packet.dst}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim, flexShrink: 0 }}>{packet.size}B</span>
      <Badge style={{ background: c + '18', color: c, fontSize: 8.5, fontFamily: MONO, letterSpacing: 1, padding: '1px 6px', border: 'none' }}>
        {packet.status === 'clean' ? 'OK' : packet.status === 'suspicious' ? 'WARN' : 'DROP'}
      </Badge>
    </motion.div>
  );
}

// ─── Incident Response Card ───────────────────────────────────
function IncidentCard({ severity, title, time, status }: {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string; time: string; status: 'active' | 'investigating' | 'resolved';
}) {
  const sevColors = { critical: T.red, high: '#F97316', medium: T.amber, low: T.cyan };
  const statColors = { active: T.red, investigating: T.amber, resolved: T.green };
  const c = sevColors[severity];
  return (
    <div style={{
      background: T.card, borderLeft: `3px solid ${c}`, borderRadius: 10,
      padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} color={c} />
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12.5, color: T.textPri }}>{title}</span>
        </div>
        <Badge style={{ background: statColors[status] + '22', color: statColors[status], fontSize: 9, fontFamily: MONO, letterSpacing: 1, border: 'none' }}>
          {status.toUpperCase()}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Clock size={11} color={T.textDim} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>{time}</span>
        <Badge style={{ background: c + '18', color: c, fontSize: 9, fontFamily: MONO, border: 'none', marginLeft: 'auto' }}>
          {severity.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CyberSecurity() {
  const packets = usePacketStream(25);
  const [threatLevel, setThreatLevel] = useState(28);
  const [activeTab, setActiveTab] = useState('ids');

  // Simulate threat level fluctuation
  useEffect(() => {
    const iv = setInterval(() => {
      setThreatLevel(prev => Math.max(12, Math.min(92, prev + (Math.random() - 0.52) * 8)));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // Derived stats
  const stats = useMemo(() => {
    const suspicious = packets.filter(p => p.status === 'suspicious').length;
    const blocked = packets.filter(p => p.status === 'blocked').length;
    return { suspicious, blocked, clean: packets.length - suspicious - blocked, total: packets.length };
  }, [packets]);

  return (
    <MainLayout>
      <div style={{ background: T.bg, minHeight: '100vh', padding: '0 20px 40px' }}>
        {/* ─── HEADER ─── */}
        <div className="flex items-center gap-3 pt-6 pb-2">
          <div style={{ width: 4, height: 32, background: T.gold, borderRadius: 2 }} />
          <Shield size={22} color={T.gold} />
          <div>
            <h1 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: T.textPri, margin: 0, lineHeight: 1.2 }}>
              DEFCON <span style={{ color: T.gold }}>Command Center</span>
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, margin: 0 }}>
              Cybersécurité • Détection d'intrusion • Contrôle d'accès
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: T.greenDim, border: `1px solid ${T.green}33` }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.green }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: T.green, letterSpacing: 1 }}>SYSTÈMES ACTIFS</span>
            </div>
          </div>
        </div>

        {/* ─── THREAT OVERVIEW BAR ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          {[
            { label: 'PAQUETS ANALYSÉS', val: 847293, icon: Network, color: T.cyan },
            { label: 'MENACES BLOQUÉES', val: stats.blocked * 127, icon: Ban, color: T.red },
            { label: 'ALERTES ACTIVES', val: stats.suspicious, icon: AlertTriangle, color: T.amber },
            { label: 'CONNEXIONS LIVE', val: 342, icon: Globe, color: T.green },
            { label: 'UPTIME', val: 99.97, icon: Server, color: T.gold, suffix: '%' },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: '14px 16px' }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim, letterSpacing: 1.5, fontWeight: 600 }}>{m.label}</span>
                <m.icon size={14} color={m.color} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, color: m.color }}>
                {typeof m.val === 'number' && !m.suffix ? <AnimNum val={m.val} color={m.color} /> :
                  <span>{m.val}{m.suffix || ''}</span>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ─── MAIN GRID ─── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="bg-transparent border p-1 rounded-xl" style={{ borderColor: T.cardBorder }}>
            {[
              { val: 'ids', icon: Radar, label: 'Détection d\'Intrusion' },
              { val: 'access', icon: Fingerprint, label: 'Contrôle d\'Accès' },
              { val: 'cyber', icon: ShieldCheck, label: 'Cybersécurité' },
              { val: 'incidents', icon: Zap, label: 'Réponse Incidents' },
            ].map(tab => (
              <TabsTrigger key={tab.val} value={tab.val}
                className={cn("gap-1.5 text-xs data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400")}
              >
                <tab.icon size={13} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ═══ TAB: IDS ═══ */}
          <TabsContent value="ids" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Threat Gauge */}
              <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: 24 }}
                className="flex flex-col items-center gap-4">
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri, letterSpacing: 1 }}>
                  NIVEAU DE MENACE
                </span>
                <ThreatGauge level={Math.round(threatLevel)} />
                <div className="grid grid-cols-3 gap-4 w-full mt-2">
                  {[
                    { label: 'Clean', val: stats.clean, color: T.green },
                    { label: 'Suspect', val: stats.suspicious, color: T.amber },
                    { label: 'Bloqué', val: stats.blocked, color: T.red },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                      <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Packet Feed */}
              <div className="lg:col-span-2" style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '16px 20px' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio size={14} color={T.red} className="animate-pulse" />
                    <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri }}>FLUX RÉSEAU EN DIRECT</span>
                  </div>
                  <Badge style={{ background: T.cyanDim, color: T.cyan, fontSize: 9, fontFamily: MONO, border: 'none' }}>
                    {stats.total} PAQUETS
                  </Badge>
                </div>
                {/* Header */}
                <div className="flex items-center gap-2 py-1.5 mb-1" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontFamily: SANS, fontSize: 9, color: T.textDim, width: 25 }}>ST</span>
                  <span style={{ fontFamily: SANS, fontSize: 9, color: T.textDim, width: 68 }}>PROTO</span>
                  <span style={{ fontFamily: SANS, fontSize: 9, color: T.textDim, flex: 1 }}>SOURCE → DESTINATION</span>
                  <span style={{ fontFamily: SANS, fontSize: 9, color: T.textDim, width: 48 }}>TAILLE</span>
                  <span style={{ fontFamily: SANS, fontSize: 9, color: T.textDim, width: 40 }}>FLAG</span>
                </div>
                <ScrollArea className="h-[340px]">
                  <AnimatePresence mode="popLayout">
                    {packets.map(p => <IDSRow key={p.id} packet={p} />)}
                  </AnimatePresence>
                </ScrollArea>
              </div>
            </div>

            {/* Network Topology Mini-Map */}
            <div className="mt-4" style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '20px 24px' }}>
              <div className="flex items-center gap-2 mb-4">
                <LayoutGrid size={14} color={T.gold} />
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri }}>TOPOLOGIE RÉSEAU INDUSTRIEL</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { name: 'Firewall', icon: Shield, status: 'online' },
                  { name: 'Routeur Core', icon: Network, status: 'online' },
                  { name: 'SCADA', icon: Cpu, status: 'online' },
                  { name: 'Automates PLC', icon: HardDrive, status: 'online' },
                  { name: 'Serveur BDD', icon: Server, status: 'online' },
                  { name: 'Caméras IA', icon: Eye, status: 'online' },
                  { name: 'IoT Capteurs', icon: Radio, status: 'warning' },
                ].map((node, i) => {
                  const c = node.status === 'online' ? T.green : T.amber;
                  return (
                    <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl"
                      style={{ background: c + '08', border: `1px solid ${c}22` }}>
                      <div className="relative">
                        <node.icon size={20} color={c} />
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ background: c }} />
                      </div>
                      <span style={{ fontFamily: SANS, fontSize: 10, color: T.textSec, textAlign: 'center' }}>{node.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ═══ TAB: ACCESS CONTROL ═══ */}
          <TabsContent value="access" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Access Points Status */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Fingerprint size={16} color={T.gold} />
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>POINTS D'ACCÈS BIOMÉTRIQUES</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { name: 'Entrée Principale', occupancy: 12, maxOccupancy: 50, status: 'secure' as const, icon: MapPin },
                    { name: 'Zone Production', occupancy: 8, maxOccupancy: 15, status: 'secure' as const, icon: Cpu },
                    { name: 'Silos & Stockage', occupancy: 3, maxOccupancy: 10, status: 'alert' as const, icon: HardDrive },
                    { name: 'Bureau Direction', occupancy: 4, maxOccupancy: 8, status: 'secure' as const, icon: KeyRound },
                    { name: 'Parc Camions', occupancy: 18, maxOccupancy: 30, status: 'secure' as const, icon: Globe },
                    { name: 'Zone Restreinte', occupancy: 0, maxOccupancy: 5, status: 'locked' as const, icon: Lock },
                  ].map((z, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}>
                      <AccessZone {...z} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent Access Log */}
              <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '16px 18px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} color={T.gold} />
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.textPri }}>JOURNAL D'ACCÈS</span>
                </div>
                <ScrollArea className="h-[380px]">
                  <div className="space-y-2">
                    {[
                      { user: 'Karim S.', zone: 'Direction', action: 'Entrée', time: '09:14', method: 'Empreinte', ok: true },
                      { user: 'Abdel S.', zone: 'Production', action: 'Entrée', time: '08:55', method: 'Badge + PIN', ok: true },
                      { user: 'Imad R.', zone: 'Silos', action: 'Entrée', time: '08:42', method: 'Empreinte', ok: true },
                      { user: 'Inconnu', zone: 'Zone Restreinte', action: 'Tentative', time: '08:30', method: 'Badge refusé', ok: false },
                      { user: 'Max CEO', zone: 'Direction', action: 'Entrée', time: '08:15', method: 'Face ID', ok: true },
                      { user: 'Opr. Ali', zone: 'Production', action: 'Sortie', time: '07:58', method: 'Badge', ok: true },
                      { user: 'Visiteur', zone: 'Entrée', action: 'Entrée', time: '07:45', method: 'QR Code', ok: true },
                      { user: 'Inconnu', zone: 'Parc Camions', action: 'Tentative', time: '03:12', method: 'Mouvement détecté', ok: false },
                      { user: 'Sys Auto', zone: 'Serveur', action: 'Verrouillage', time: '02:00', method: 'Programmé', ok: true },
                    ].map((e, i) => (
                      <div key={i} className="flex items-center gap-2 py-2 border-b" style={{ borderColor: T.border }}>
                        {e.ok ?
                          <CheckCircle size={12} color={T.green} className="shrink-0" /> :
                          <XCircle size={12} color={T.red} className="shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: e.ok ? T.textPri : T.red }}>{e.user}</span>
                            <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>→ {e.zone}</span>
                          </div>
                          <span style={{ fontFamily: MONO, fontSize: 9.5, color: T.textDim }}>{e.method}</span>
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>{e.time}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Occupancy Map */}
            <div className="mt-4" style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '20px 24px' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={14} color={T.gold} />
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri }}>CARTE D'OCCUPATION TEMPS RÉEL</span>
                </div>
                <Badge style={{ background: T.greenDim, color: T.green, fontSize: 10, fontFamily: MONO, border: 'none' }}>
                  45 PERSONNES SUR SITE
                </Badge>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { zone: 'Production', count: 8, color: T.cyan },
                  { zone: 'Silos', count: 3, color: T.amber },
                  { zone: 'Direction', count: 4, color: T.purple },
                  { zone: 'Parc Camions', count: 18, color: T.green },
                  { zone: 'Labo', count: 2, color: T.cyan },
                  { zone: 'Entrée', count: 10, color: T.gold },
                ].map((z, i) => (
                  <div key={i} className="flex flex-col items-center p-3 rounded-xl" style={{ background: z.color + '08', border: `1px solid ${z.color}22` }}>
                    <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: z.color }}>{z.count}</span>
                    <span style={{ fontFamily: SANS, fontSize: 10, color: T.textSec }}>{z.zone}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ═══ TAB: CYBERSECURITY ═══ */}
          <TabsContent value="cyber" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Security Posture */}
              <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: 24 }}
                className="flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} color={T.gold} />
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri }}>POSTURE DE SÉCURITÉ</span>
                </div>
                {[
                  { label: 'Firewall', val: 98, color: T.green },
                  { label: 'Antivirus', val: 100, color: T.green },
                  { label: 'Chiffrement', val: 95, color: T.green },
                  { label: 'MFA Activé', val: 87, color: T.amber },
                  { label: 'Patches', val: 92, color: T.green },
                  { label: 'Backup', val: 100, color: T.green },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <span style={{ fontFamily: SANS, fontSize: 11.5, color: T.textSec }}>{item.label}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: item.color, fontWeight: 700 }}>{item.val}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        style={{ height: '100%', borderRadius: 3, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Vulnerability Scanner */}
              <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '16px 20px' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Bug size={14} color={T.gold} />
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri }}>SCANNER VULNÉRABILITÉS</span>
                </div>
                <div className="space-y-3">
                  {[
                    { sev: 'Critique', count: 0, color: T.red },
                    { sev: 'Haute', count: 2, color: '#F97316' },
                    { sev: 'Moyenne', count: 5, color: T.amber },
                    { sev: 'Faible', count: 12, color: T.cyan },
                    { sev: 'Info', count: 28, color: T.textDim },
                  ].map((v, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: v.color }} />
                      <span style={{ fontFamily: SANS, fontSize: 12, color: T.textSec, flex: 1 }}>{v.sev}</span>
                      <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: v.color }}>{v.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Dernier scan complet</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T.green }}>il y a 2h</span>
                  </div>
                  <Button size="sm" className="w-full gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Scan size={13} /> Lancer Scan Complet
                  </Button>
                </div>
              </div>

              {/* SSL & Encryption */}
              <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '16px 20px' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={14} color={T.gold} />
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri }}>CHIFFREMENT & SSL</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Certificat SSL', status: 'Valide', expires: '287 jours', ok: true },
                    { label: 'TLS Version', status: '1.3', expires: 'À jour', ok: true },
                    { label: 'HSTS', status: 'Activé', expires: 'Strict', ok: true },
                    { label: 'Chiffrement BDD', status: 'AES-256', expires: 'Actif', ok: true },
                    { label: 'Backup Chiffré', status: 'GPG', expires: 'Vérifié', ok: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <CheckCircle size={13} color={item.ok ? T.green : T.red} className="shrink-0" />
                      <div className="flex-1">
                        <span style={{ fontFamily: SANS, fontSize: 11.5, color: T.textPri }}>{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: MONO, fontSize: 10, color: T.green }}>{item.status}</span>
                          <span style={{ fontFamily: SANS, fontSize: 9, color: T.textDim }}>• {item.expires}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══ TAB: INCIDENT RESPONSE ═══ */}
          <TabsContent value="incidents" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Active Incidents */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} color={T.gold} />
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>INCIDENTS EN COURS</span>
                  <Badge style={{ background: T.redDim, color: T.red, fontSize: 10, fontFamily: MONO, border: 'none' }}>2 ACTIFS</Badge>
                </div>
                {[
                  { severity: 'medium' as const, title: 'Tentative d\'accès non autorisé — Zone Restreinte', time: '08:30 — il y a 45 min', status: 'investigating' as const },
                  { severity: 'low' as const, title: 'Capteur IoT déconnecté — Silo #3', time: '07:15 — il y a 2h', status: 'investigating' as const },
                  { severity: 'high' as const, title: 'Activité suspecte détectée — Port 502 (MODBUS)', time: 'Hier 23:42', status: 'resolved' as const },
                  { severity: 'critical' as const, title: 'Brute-force SSH bloqué — 847 tentatives', time: 'Hier 18:15', status: 'resolved' as const },
                  { severity: 'medium' as const, title: 'Mise à jour firmware manquante — PLC Zone A', time: 'Hier 14:00', status: 'resolved' as const },
                ].map((inc, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}>
                    <IncidentCard {...inc} />
                  </motion.div>
                ))}
              </div>

              {/* Response Playbook */}
              <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '16px 20px' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={14} color={T.gold} />
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.textPri }}>PLAYBOOK DE RÉPONSE</span>
                </div>
                <div className="space-y-3">
                  {[
                    { step: 1, label: 'Identifier & Classifier', desc: 'Évaluer la sévérité et le périmètre', done: true },
                    { step: 2, label: 'Contenir', desc: 'Isoler les systèmes affectés', done: true },
                    { step: 3, label: 'Éradiquer', desc: 'Supprimer la menace identifiée', done: false },
                    { step: 4, label: 'Récupérer', desc: 'Restaurer les services normaux', done: false },
                    { step: 5, label: 'Post-mortem', desc: 'Analyser et documenter l\'incident', done: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: s.done ? T.greenDim : 'rgba(255,255,255,0.06)',
                            color: s.done ? T.green : T.textDim,
                            border: `1px solid ${s.done ? T.green + '44' : T.border}`,
                            fontFamily: MONO,
                          }}>
                          {s.done ? '✓' : s.step}
                        </div>
                        {i < 4 && <div className="w-px h-5" style={{ background: s.done ? T.green + '44' : T.border }} />}
                      </div>
                      <div>
                        <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: s.done ? T.green : T.textPri }}>{s.label}</span>
                        <p style={{ fontFamily: SANS, fontSize: 10, color: T.textDim, marginTop: 2 }}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 space-y-2" style={{ borderTop: `1px solid ${T.border}` }}>
                  <div className="flex items-center gap-2">
                    <Clock size={12} color={T.textDim} />
                    <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>MTTR moyen : <span style={{ color: T.gold, fontFamily: MONO, fontWeight: 700 }}>23 min</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={12} color={T.textDim} />
                    <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>Incidents résolus ce mois : <span style={{ color: T.green, fontFamily: MONO, fontWeight: 700 }}>17</span></span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ─── GLOBAL PULSE ANIMATION ─── */}
        <style>{`
          @keyframes tbPulse { 0%,100%{opacity:.7} 50%{opacity:1} }
        `}</style>
      </div>
    </MainLayout>
  );
}
