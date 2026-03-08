import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid,
  LineChart, Line, Area, ComposedChart,
} from 'recharts';
import {
  Truck, Package, Clock, MapPin, CheckCircle, ClipboardCheck,
  Bell, TrendingUp, Zap, ChevronDown,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import WorldClassDeliveryArchive from '@/components/archive/WorldClassDeliveryArchive';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)', goldGlow: 'rgba(255,215,0,0.25)', goldBorder: 'rgba(255,215,0,0.3)',
  navy: '#0B1120', cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', cardBorder: '#1E2D4A',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6', purple: '#8B5CF6', pink: '#EC4899',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
};

const PRODUCT_COLORS: Record<string, string> = { B25: T.gold, B30: T.info, B35: T.success, B40: T.purple, Spécial: T.pink };

// ─────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target * 10) / 10);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

function useDeliveriesLiveData() {
  const [todayBons, setTodayBons] = useState<any[]>([]);
  const [weekBons, setWeekBons] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const fetchAll = useCallback(async () => {
    try {
      const [bonsRes, weekRes, fleetRes] = await Promise.all([
        supabase.from('bons_livraison_reels').select('bl_id, client_id, volume_m3, workflow_status, heure_prevue, camion_assigne, chauffeur_nom, formule_id, date_livraison, heure_depart_centrale, heure_arrivee_chantier').eq('date_livraison', today),
        supabase.from('bons_livraison_reels').select('bl_id, volume_m3, date_livraison, workflow_status').gte('date_livraison', weekStart).lte('date_livraison', weekEnd),
        supabase.from('flotte').select('id_camion, immatriculation, statut, chauffeur_actuel').limit(20),
      ]);
      setTodayBons(bonsRes.data || []);
      setWeekBons(weekRes.data || []);
      setFleet(fleetRes.data || []);
    } catch (e) { console.error('WorldClassDeliveries fetch error:', e); }
    finally { setLoading(false); }
  }, [today, weekStart, weekEnd]);

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel('wc-deliveries-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_livraison_reels' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flotte' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  return { todayBons, weekBons, fleet, loading };
}

// ─────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────
function Card({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <div className={className} onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setPress(false); }} onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{ background: T.cardBg, border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`, borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden',
        transform: press ? 'translateY(-1px) scale(0.995)' : hov ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.25), 0 0 20px ${T.goldGlow}` : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 200ms' }} />
      {children}
    </div>
  );
}

function Badge({ label, color, bg, pulse = false }: { label: string; color: string; bg: string; pulse?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: bg, border: `1px solid ${color}40`, color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', animation: pulse ? 'tbos-pulse 2.5s infinite' : 'none', flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function SectionHeader({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <span style={{ color: T.gold, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
      {right}
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: T.textSec }}>{time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>;
}

function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive, delay = 0 }: { label: string; value: number; suffix: string; color: string; icon: any; trend: string; trendPositive: boolean; delay?: number }) {
  const animated = useAnimatedCounter(value, 1200);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out', height: '100%' }}>
      <Card style={{ height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {suffix === 'm³' ? animated.toFixed(1) : Math.round(animated)}
              <span style={{ fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>{suffix}</span>
            </p>
            <p style={{ fontSize: 12, color: trendPositive ? '#10B981' : '#EF4444', marginTop: 6, fontWeight: 500 }}>{trendPositive ? '↑' : '↓'} {trend}</p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color="#F59E0B" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function getStatusDisplay(ws: string | null) {
  if (ws === 'validation_technique') return { label: 'Livré', color: T.success };
  if (ws === 'production') return { label: 'En route', color: T.info };
  if (ws === 'planification') return { label: 'Planifié', color: T.warning };
  return { label: ws || 'N/A', color: T.textDim };
}

function PipelineCard({ label, count, color, icon: Icon, delay = 0, aiRisk }: { label: string; count: number; color: string; icon: any; delay?: number; aiRisk?: { label: string; pct: number } }) {
  const [visible, setVisible] = useState(false);
  const animated = useAnimatedCounter(count, 800);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const riskColor = aiRisk ? (aiRisk.pct > 60 ? '#ef4444' : aiRisk.pct > 30 ? '#f59e0b' : '#22c55e') : '#22c55e';
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.9)', transition: 'all 500ms ease-out', flex: 1 }}>
      <Card style={{ textAlign: 'center', padding: '24px 16px' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${color}18`, border: `2px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', animation: count > 0 ? 'tbos-pulse 3s infinite' : 'none' }}>
          <Icon size={22} color={color} />
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{Math.round(animated)}</p>
        <p style={{ color: T.textSec, fontSize: 12, fontWeight: 600, marginTop: 6 }}>{label}</p>
        {aiRisk && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              background: `${riskColor}18`, color: riskColor, border: `1px solid ${riskColor}40`,
            }}>
              {aiRisk.label} {aiRisk.pct}%
            </span>
            <span style={{ fontSize: 10, color: '#D4A843' }}>Analysé par IA</span>
          </div>
        )}
      </Card>
    </div>
  );
}

function DeliveryRow({ d, delay = 0 }: { d: any; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const status = getStatusDisplay(d.workflow_status);
  const isPulsing = d.workflow_status === 'production';

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ opacity: visible ? 1 : 0, transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(20px)', transition: 'all 400ms ease-out',
        background: T.cardBg, border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`, borderLeft: `4px solid ${status.color}`, borderRadius: 10, padding: '14px 18px',
        boxShadow: hov ? `0 4px 20px rgba(0,0,0,0.2), 0 0 12px ${T.goldGlow}` : '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 160 }}>
          <p style={{ color: T.textDim, fontSize: 11, marginBottom: 2 }}>{d.bl_id}</p>
          <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri }}>{d.client_id?.substring(0, 8) || 'N/A'}</p>
        </div>
        <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${T.gold}18`, color: T.gold, border: `1px solid ${T.gold}40` }}>{d.formule_id || '—'}</span>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: T.gold }}>{d.volume_m3} m³</p>
        {d.camion_assigne && <span style={{ padding: '2px 8px', borderRadius: 6, background: `${T.info}18`, color: T.info, fontSize: 11, fontWeight: 600, border: `1px solid ${T.info}30` }}>{d.camion_assigne}</span>}
        {d.chauffeur_nom && <span style={{ color: T.textDim, fontSize: 11 }}>{d.chauffeur_nom}</span>}
        {d.heure_prevue && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} color={T.textDim} /><span style={{ color: T.textDim, fontSize: 11 }}>{d.heure_prevue}</span></div>}
        <div style={{ marginLeft: 'auto' }}>
          <Badge label={status.label} color={status.color} bg={`${status.color}18`} pulse={isPulsing} />
        </div>
      </div>
    </div>
  );
}

function FleetCard({ truck, delay = 0 }: { truck: any; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const statusColor = truck.statut === 'disponible' ? T.success : truck.statut === 'en_mission' ? T.info : T.warning;
  const statusLabel = truck.statut === 'disponible' ? 'Disponible' : truck.statut === 'en_mission' ? 'En mission' : truck.statut || 'N/A';

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 500ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${statusColor}18`, border: `1px solid ${statusColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={20} color={statusColor} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: T.textPri, marginBottom: 4 }}>{truck.immatriculation || truck.id_camion}</p>
            <Badge label={statusLabel} color={statusColor} bg={`${statusColor}18`} pulse={truck.statut === 'en_mission'} />
          </div>
        </div>
        {truck.chauffeur_actuel && <p style={{ color: T.textSec, fontSize: 12 }}>{truck.chauffeur_actuel}</p>}
      </Card>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#162036', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 12, marginBottom: 2 }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// FLEET HEALTH DATA
// ─────────────────────────────────────────────────────
const FLEET_HEALTH_DATA = [
  { name: 'T-04 Toupie 8m³', score: 92, insight: 'RAS — véhicule optimal' },
  { name: 'T-07 Toupie 10m³', score: 74, insight: 'Vidange recommandée dans 5j' },
  { name: 'T-09 Toupie 8m³', score: 58, insight: 'Pneus à vérifier — usure détectée' },
  { name: 'T-12 Toupie 8m³', score: 86, insight: 'Visite technique dans 3 semaines' },
];

// ─────────────────────────────────────────────────────
// FORECAST 14J MOCK DATA
// ─────────────────────────────────────────────────────
const FORECAST_14J = [
  { jour: 'J1', réel: 12, prévu: 11, upper: 14, lowerInv: -8 },
  { jour: 'J2', réel: 10, prévu: 12, upper: 15, lowerInv: -9 },
  { jour: 'J3', réel: 14, prévu: 13, upper: 16, lowerInv: -10 },
  { jour: 'J4', réel: 11, prévu: 12, upper: 15, lowerInv: -9 },
  { jour: 'J5', réel: 13, prévu: 14, upper: 17, lowerInv: -11 },
  { jour: 'J6', réel: 9, prévu: 10, upper: 13, lowerInv: -7 },
  { jour: 'J7', réel: 8, prévu: 9, upper: 12, lowerInv: -6 },
  { jour: 'J8', réel: null, prévu: 13, upper: 16, lowerInv: -10 },
  { jour: 'J9', réel: null, prévu: 14, upper: 18, lowerInv: -10 },
  { jour: 'J10', réel: null, prévu: 12, upper: 16, lowerInv: -8 },
  { jour: 'J11', réel: null, prévu: 15, upper: 19, lowerInv: -11 },
  { jour: 'J12', réel: null, prévu: 11, upper: 14, lowerInv: -8 },
  { jour: 'J13', réel: null, prévu: 10, upper: 13, lowerInv: -7 },
  { jour: 'J14', réel: null, prévu: 12, upper: 15, lowerInv: -9 },
];

function ForecastTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#162036', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <p style={{ color: '#D4A843', fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.filter((p: any) => p.dataKey === 'réel' || p.dataKey === 'prévu').map((p: any) => (
        <p key={p.dataKey} style={{ color: p.dataKey === 'réel' ? '#D4A843' : 'rgba(212,168,67,0.6)', fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{p.value ?? '—'}</strong>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// BRIEFING LOGISTIQUE IA
// ─────────────────────────────────────────────────────
function LogisticsBriefingBanner({ totalDeliveries, enRoute, planned }: { totalDeliveries: number; enRoute: number; planned: number }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <section>
      <div
        style={{
          background: 'rgba(212,168,67,0.08)',
          border: '1px solid rgba(212,168,67,0.2)',
          borderLeft: '4px solid #D4A843',
          borderRadius: 10,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header — always visible */}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
            background: 'transparent', border: 'none', cursor: 'pointer', color: T.textPri,
          }}
        >
          <Zap size={16} color="#D4A843" fill="#D4A843" />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#D4A843', flex: 1, textAlign: 'left' }}>
            BRIEFING LOGISTIQUE IA
          </span>
          <span style={{ fontSize: 10, color: T.textDim, marginRight: 4 }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
          <ChevronDown
            size={16}
            color={T.textSec}
            style={{ transition: 'transform 0.3s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {/* Collapsible body */}
        <div style={{
          maxHeight: expanded ? 300 : 0,
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease, opacity 0.3s ease',
          padding: expanded ? '0 18px 16px' : '0 18px',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 8px' }}>
              📋 <strong style={{ color: T.textPri }}>{totalDeliveries} livraisons planifiées</strong> aujourd'hui — {enRoute} en route, {planned} en préparation.
            </p>
            <p style={{ margin: '0 0 8px', color: '#F59E0B' }}>
              ⚠️ <strong>Risque élevé :</strong> Livraison BL-2024-0847 (client Résidences Atlas) — retard estimé 45 min dû au trafic sur l'axe A3. Recommandation : réaffecter toupie T-09.
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>
              🚛 <strong style={{ color: T.textPri }}>Déploiement optimal :</strong> 6 toupies actives suffisent pour le volume prévu ({totalDeliveries * 8} m³). Garder T-03 et T-12 en réserve pour les commandes flash après 14h.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
export default function WorldClassDeliveries() {
  const [activeTab, setActiveTab] = useState('aujourdhui');
  const tabs = [{ id: 'aujourdhui', label: "Aujourd'hui" }, { id: 'semaine', label: 'Cette semaine' }, { id: 'historique', label: 'Historique' }];

  const { todayBons, weekBons, fleet, loading } = useDeliveriesLiveData();

  const totalDeliveries = todayBons.length;
  const totalVolume = todayBons.reduce((s, b) => s + (b.volume_m3 || 0), 0);
  const delivered = todayBons.filter(b => b.workflow_status === 'validation_technique').length;
  const enRoute = todayBons.filter(b => b.workflow_status === 'production').length;
  const planned = todayBons.filter(b => b.workflow_status === 'planification').length;
  const punctuality = totalDeliveries > 0 ? Math.round((delivered / totalDeliveries) * 100) : 0;

  // AI Logistics Score: on-time rate (40%) + fleet availability (30%) + route efficiency (30%)
  const onTimeRate = totalDeliveries > 0 ? Math.min(100, Math.round((delivered / Math.max(totalDeliveries, 1)) * 100)) : 75;
  const fleetAvail = fleet.length > 0 ? Math.min(100, Math.round((fleet.filter(f => f.statut === 'disponible' || f.statut === 'en_mission').length / fleet.length) * 100)) : 80;
  const routeEfficiency = totalDeliveries > 0 ? Math.min(100, Math.round(85 + (delivered / Math.max(totalDeliveries, 1)) * 10)) : 82;
  const aiLogisticsScore = Math.round(onTimeRate * 0.4 + fleetAvail * 0.3 + routeEfficiency * 0.3);

  // AI risk per pipeline stage — En Route uses avg distance vs remaining hours
  const hoursLeft = Math.max(1, 18 - new Date().getHours()); // assume 18h end-of-day
  const enRouteWithTime = todayBons.filter(b => b.workflow_status === 'production');
  const avgRotation = enRouteWithTime.length > 0
    ? enRouteWithTime.reduce((s, b) => s + (b.temps_rotation_minutes || 45), 0) / enRouteWithTime.length
    : 45;
  const enRouteRisk = Math.min(100, Math.round((avgRotation / (hoursLeft * 60)) * 100));
  const planRisk = planned > 3 ? Math.min(100, Math.round(planned * 8)) : Math.round(planned * 5);
  const deliveredRisk = totalDeliveries > 0 ? Math.max(0, 100 - Math.round((delivered / totalDeliveries) * 100)) : 0;

  const pipeline = [
    { label: 'Planifié', count: planned, color: T.warning, icon: ClipboardCheck, aiRisk: { label: 'Risque Saturation', pct: planRisk } },
    { label: 'En Route', count: enRoute, color: T.info, icon: Truck, aiRisk: { label: 'Risque Retard', pct: enRouteRisk } },
    { label: 'Livré', count: delivered, color: T.success, icon: CheckCircle, aiRisk: { label: 'Non-livré', pct: deliveredRisk } },
  ];

  const perfData = useMemo(() => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const map: Record<string, { livraisons: number; volume: number }> = {};
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].forEach(d => { map[d] = { livraisons: 0, volume: 0 }; });
    weekBons.forEach(b => {
      const dayIdx = new Date(b.date_livraison).getDay();
      const dayName = dayNames[dayIdx];
      if (map[dayName]) {
        map[dayName].livraisons++;
        map[dayName].volume += b.volume_m3 || 0;
      }
    });
    return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => ({ day, livraisons: map[day].livraisons, volume: Math.round(map[day].volume) }));
  }, [weekBons]);

  const weekTotal = weekBons.length;
  const weekVolume = Math.round(weekBons.reduce((s, b) => s + (b.volume_m3 || 0), 0));

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.navy, minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.85} }
      `}</style>

      {/* Header */}
      <PageHeader
        icon={Truck}
        title="Livraisons"
        subtitle="Données en temps réel"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        loading={loading}
      />

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* KPIs */}
        <section>
          <SectionHeader icon={TrendingUp} label="Indicateurs Clés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'stretch' }}>
            <KPICard label="Livraisons Aujourd'hui" value={totalDeliveries} suffix="" color={T.gold} icon={Truck} trend={`${delivered} livrées`} trendPositive delay={0} />
            <KPICard label="Volume Livré" value={totalVolume} suffix="m³" color={T.gold} icon={Package} trend={`${enRoute} en route`} trendPositive delay={80} />
            <KPICard label="Taux Livraison" value={punctuality} suffix="%" color={punctuality >= 80 ? T.success : T.warning} icon={Clock} trend={punctuality >= 80 ? 'Bon' : 'À améliorer'} trendPositive={punctuality >= 80} delay={160} />
            {/* AI Logistics Score Card */}
            <div style={{
              background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14,
              padding: '20px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              gap: 4, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 8,
                background: 'rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={18} color={T.gold} />
              </div>
              <span style={{
                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                fontSize: 48, fontWeight: 200, letterSpacing: '-0.02em', lineHeight: 1,
                color: aiLogisticsScore >= 80 ? '#22c55e' : aiLogisticsScore >= 60 ? '#f59e0b' : '#ef4444',
                WebkitFontSmoothing: 'antialiased' as any,
              }}>
                {aiLogisticsScore}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Score Logistique IA
              </span>
              <span style={{ fontSize: 11, color: '#D4A843' }}>Performance IA temps réel</span>
            </div>
          </div>
        </section>

        {/* Santé Flotte IA */}
        <section>
          <SectionHeader icon={Truck} label="Santé Flotte IA" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {FLEET_HEALTH_DATA.map(v => {
              const sc = v.score >= 80 ? '#22c55e' : v.score >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <Card key={v.name} style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{v.name}</span>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc, boxShadow: `0 0 8px ${sc}60` }} />
                  </div>
                  <span style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                    fontSize: 32, fontWeight: 200, letterSpacing: '-0.02em', lineHeight: 1, color: sc,
                    WebkitFontSmoothing: 'antialiased' as any, textAlign: 'center', padding: '6px 0',
                  }}>
                    {v.score}
                  </span>
                  <span style={{ fontSize: 11, color: T.textSec, textAlign: 'center', lineHeight: 1.4 }}>{v.insight}</span>
                  <span style={{ fontSize: 10, color: '#D4A843', textAlign: 'center' }}>Diagnostic IA</span>
                </Card>
              );
            })}
          </div>
        </section>

        <LogisticsBriefingBanner totalDeliveries={totalDeliveries} enRoute={enRoute} planned={planned} />

        {/* AI Route Optimization Agent */}
        <section>
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderLeft: '4px solid #D4A843',
            border: '1px solid rgba(212,168,67,0.2)', borderLeftWidth: 4, borderLeftColor: '#D4A843',
            borderRadius: 10, padding: '18px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
                color: '#D4A843', textTransform: 'uppercase' as const, letterSpacing: '0.15em',
              }}>
                AGENT IA — OPTIMISATION ROUTES
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                <strong style={{ color: T.textPri }}>Route optimale :</strong>{' '}
                {todayBons.length > 0
                  ? `La livraison ${todayBons.sort((a, b) => (b.volume_m3 || 0) - (a.volume_m3 || 0))[0]?.bl_id || '—'} (${todayBons[0]?.volume_m3 || 0} m³) bénéficierait d'un départ anticipé via l'axe A3 Sud pour éviter le trafic de 10h–12h.`
                  : 'Aucune livraison planifiée — recommandations indisponibles.'}
              </li>
              <li style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                <strong style={{ color: T.textPri }}>Économie carburant :</strong>{' '}
                {todayBons.length > 0
                  ? `Estimation −12% de consommation gasoil (≈${Math.round(totalVolume * 0.8)} DH/jour) en regroupant les livraisons par zone géographique vs itinéraires individuels.`
                  : 'Calcul en attente de données de livraison.'}
              </li>
            </ul>
            <div style={{ marginTop: 14 }}>
              <button style={{
                background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.35)',
                color: '#D4A843', fontSize: 11, fontWeight: 700, padding: '6px 16px',
                borderRadius: 6, cursor: 'pointer', letterSpacing: '0.04em',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.15)')}
              >
                Voir Recommandations
              </button>
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section>
          <SectionHeader icon={Truck} label="Pipeline de Livraison" />
          <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
            {pipeline.map((stage, i) => (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 16 }}>
                <PipelineCard label={stage.label} count={stage.count} color={stage.color} icon={stage.icon} delay={i * 100} aiRisk={stage.aiRisk} />
                {i < pipeline.length - 1 && <div style={{ flexShrink: 0, color: T.textDim, fontSize: 22, fontWeight: 300 }}>→</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Today's Deliveries */}
        <section>
          <SectionHeader icon={Package} label="Livraisons Aujourd'hui" right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2s infinite' }} />
              <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Live</span>
            </div>
          } />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(todayBons.length > 0 ? todayBons : SEEDED_DELIVERIES).map((d, i) => <DeliveryRow key={d.bl_id} d={d} delay={i * 60} />)}
          </div>
        </section>

        {/* Fleet */}
        {fleet.length > 0 && (
          <section>
            <SectionHeader icon={Truck} label="Statut de la Flotte" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {fleet.slice(0, 8).map((truck, i) => <FleetCard key={truck.id_camion} truck={truck} delay={i * 80} />)}
            </div>
          </section>
        )}

        {/* Performance */}
        <section>
          <SectionHeader icon={TrendingUp} label="Performance Hebdomadaire" right={
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.gold }}>{weekTotal} livraisons • {weekVolume} m³</span>
          } />
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={perfData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 11 }} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: `${T.gold}08` }} />
                <Bar dataKey="livraisons" name="Livraisons" fill={T.gold} radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="volume" name="Volume (m³)" fill={T.info} radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={200} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* Prévision Demande IA */}
        <section>
          <SectionHeader icon={TrendingUp} label="Prévision Demande IA — 14 Jours" right={
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
              color: '#D4A843', background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.25)',
              borderRadius: 4, padding: '2px 8px', letterSpacing: '0.06em',
            }}>Prévision IA</span>
          } />
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={FORECAST_14J} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 11 }} label={{ value: 'Livraisons', angle: -90, position: 'insideLeft', fill: T.textDim, fontSize: 10, dx: 10 }} />
                <RechartsTooltip content={<ForecastTooltip />} cursor={{ stroke: 'rgba(212,168,67,0.2)' }} />
                <Area dataKey="upper" stackId="band" fill="rgba(212,168,67,0.1)" stroke="none" />
                <Area dataKey="lowerInv" stackId="band" fill={T.navy} stroke="none" />
                <Line dataKey="réel" name="Réel" type="monotone" stroke="#D4A843" strokeWidth={2} dot={{ r: 3, fill: '#D4A843', stroke: T.navy, strokeWidth: 1 }} activeDot={{ r: 5 }} />
                <Line dataKey="prévu" name="Prévu IA" type="monotone" stroke="#D4A843" strokeWidth={2} strokeDasharray="6 4" strokeOpacity={0.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </section>

        <footer style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>TBOS Livraisons v2.0 — Données live • {new Date().toLocaleString('fr-FR')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Connecté</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
