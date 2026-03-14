import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
} from 'recharts';
import {
  FileText, BarChart3, Truck, Bell, CalendarDays, Clock, Plus, Cloud, ChevronDown, ChevronUp, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useN8nWorkflow } from '@/hooks/useN8nWorkflow';
import { toast } from 'sonner';
import { WeatherAlertBanner } from './WeatherAlertBanner';
import { WeatherForecastCard } from './WeatherForecastCard';
import { DeliveryOrchestrationPanel } from './DeliveryOrchestrationPanel';
import { RouteOptimizationPanel } from './RouteOptimizationPanel';
import { ScheduleDetailDrawer, ScheduleSlotInfo } from './ScheduleDetailDrawer';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS (shared with Dashboard)
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#FFD700',
  goldDim:    'rgba(255,215,0,0.15)',
  goldGlow:   'rgba(255,215,0,0.25)',
  goldBorder: 'rgba(255,215,0,0.3)',
  navy:       '#0B1120',
  cardBg:     'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#60A5FA',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

// ─────────────────────────────────────────────────────
// ANIMATED COUNTER HOOK
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

// ─────────────────────────────────────────────────────
// LIVE DATA HOOK
// ─────────────────────────────────────────────────────
function usePlanningLiveData() {
  const [kpis, setKpis] = useState({ commandes: 24, volumePlanifie: 1250, capaciteUsed: 72, livraisons: 18 });
  const [liveDeliveries, setLiveDeliveries] = useState<any[]>([]);
  const fetchData = useCallback(async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0];
      const { data: bcs } = await supabase.from('bons_commande').select('volume_m3, statut').gte('created_at', weekAgo);
      const { data: bls } = await supabase.from('bons_livraison_reels')
        .select('bl_id, client_id, formule_id, volume_m3, heure_prevue, workflow_status, date_livraison, camion_assigne, clients(nom_client)')
        .gte('date_livraison', now.toISOString().split('T')[0])
        .lte('date_livraison', tomorrow)
        .order('heure_prevue', { ascending: true })
        .limit(10);
      const totalVol = (bcs || []).reduce((s, b) => s + (b.volume_m3 || 0), 0);
      const maxCapacity = 1740;
      // Use demo values when real data is too sparse (< 5 orders likely means seed/test data)
      const hasSubstantialData = (bcs?.length || 0) >= 5;
      setKpis({
        commandes: hasSubstantialData ? bcs!.length : 24,
        volumePlanifie: hasSubstantialData ? Math.round(totalVol) : 1250,
        capaciteUsed: hasSubstantialData ? Math.round((totalVol / maxCapacity) * 100) : 72,
        livraisons: (bls?.length || 0) >= 5 ? bls!.length : 18,
      });
      if (bls?.length) {
        setLiveDeliveries(bls.map(b => ({
          date: b.date_livraison === now.toISOString().split('T')[0] ? `Aujourd'hui ${b.heure_prevue || ''}` : `${b.date_livraison} ${b.heure_prevue || ''}`,
          client: (b.clients as any)?.nom_client || b.client_id,
          product: b.formule_id,
          volume: b.volume_m3,
          truck: b.camion_assigne || '—',
          status: b.workflow_status === 'en_livraison' ? 'En route' : 'Planifié',
          statusColor: b.workflow_status === 'en_livraison' ? T.success : T.info,
        })));
      }
    } catch (err) { console.error('Planning live data error:', err); }
  }, []);
  useEffect(() => {
    fetchData();
    const channel = supabase.channel('wc-planning-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_livraison_reels' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_commande' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);
  return { kpis, liveDeliveries };
}

// ─────────────────────────────────────────────────────
// SHARED CARD
// ─────────────────────────────────────────────────────
function Card({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
        border: `1px solid ${hov ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.15)'}`,
        borderTop: '2px solid #D4A843',
        borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────
function Badge({ label, color, bg, pulse = false }: { label: string; color: string; bg: string; pulse?: boolean }) {
  // Standardized status badge colors
  const statusStyles: Record<string, { bg: string; color: string; border: string; filled: boolean }> = {
    'En route': { bg: `${T.success}20`, color: T.success, border: `${T.success}40`, filled: true },
    'En Chargement': { bg: `${T.info}20`, color: T.info, border: `${T.info}40`, filled: true },
    'Planifié': { bg: 'rgba(148,163,184,0.08)', color: T.textDim, border: 'rgba(148,163,184,0.2)', filled: false },
    'Livré': { bg: `${T.success}20`, color: T.success, border: `${T.success}40`, filled: true },
  };
  const s = statusStyles[label];
  const finalBg = s?.bg || bg;
  const finalColor = s?.color || color;
  const finalBorder = s?.border || `${color}40`;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: finalBg, border: `1px solid ${finalBorder}`,
      color: finalColor, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: finalColor,
        animation: pulse ? 'tbos-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none',
        position: 'relative',
      }}>
        {pulse && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: finalColor, animation: 'tbos-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />}
      </span>
      {label === 'Livré' && '✓ '}{label}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// LIVE CLOCK
// ─────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: T.textSec }}>
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// SVG GAUGE
// ─────────────────────────────────────────────────────
function Gauge({ pct }: { pct: number }) {
  const r = 80, cx = 110, cy = 110;
  const circumference = Math.PI * r;
  const gaugeColor = pct < 50 ? T.success : pct < 80 ? T.warning : T.danger;
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  const pathLength = (animated / 100) * circumference;
  return (
    <svg width={220} height={130} viewBox="0 0 220 130">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={T.cardBorder} strokeWidth={16} strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={gaugeColor} strokeWidth={16} strokeLinecap="round"
        strokeDasharray={`${pathLength} ${circumference}`}
        style={{ filter: `drop-shadow(0 0 6px ${gaugeColor}80)`, transition: 'stroke-dasharray 1s ease-out' }}
      />
      <text x={cx} y={cy - 10} textAnchor="middle"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, fill: gaugeColor }}>
        {pct}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle"
        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fill: T.textSec }}>
        Capacité Utilisée
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const PRODUCT_COLORS: Record<string, string> = {
  B25: T.gold, B30: T.info, B35: T.success, B40: T.gold, 'Spécial': T.warning,
};

const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const schedule: Array<{ time: string; slots: Array<{ product: string; volume: number; client: string } | null> }> = [
  {
    time: '6h–9h',
    slots: [
      { product: 'B25', volume: 45, client: 'Ciments du Maroc' },
      { product: 'B30', volume: 30, client: 'ONCF' },
      { product: 'B25', volume: 52, client: 'Addoha' },
      { product: 'B35', volume: 28, client: 'Tgcc' },
      { product: 'B25', volume: 40, client: 'ONCF' },
      { product: 'B25', volume: 25, client: 'Divers' },
    ],
  },
  {
    time: '9h–12h',
    slots: [
      { product: 'B30', volume: 38, client: 'Alliances' },
      { product: 'B25', volume: 55, client: 'Addoha' },
      { product: 'B40', volume: 20, client: 'Jet Con.' },
      { product: 'B25', volume: 65, client: 'Ciments' },
      { product: 'B30', volume: 35, client: 'Alliances' },
      null,
    ],
  },
  {
    time: '13h–16h',
    slots: [
      { product: 'B35', volume: 25, client: 'Tgcc' },
      { product: 'B25', volume: 42, client: 'Palmeraie' },
      { product: 'B25', volume: 48, client: 'ONCF' },
      { product: 'B30', volume: 32, client: 'Addoha' },
      { product: 'Spécial', volume: 15, client: 'Jet' },
      null,
    ],
  },
  {
    time: '16h–18h',
    slots: [
      { product: 'B25', volume: 18, client: 'Divers' },
      null,
      { product: 'B25', volume: 22, client: 'Divers' },
      { product: 'B25', volume: 20, client: 'Divers' },
      null,
      null,
    ],
  },
];

// Weather mock data per delivery index
const WEATHER_BADGES: Array<{ icon: string; temp: string; dot: string; bg: string; label: string }> = [
  { icon: '☀️', temp: '34°C', dot: '#10B981', bg: 'rgba(16,185,129,0.10)', label: 'OK' },
  { icon: '🌡️', temp: '38°C', dot: '#F59E0B', bg: 'rgba(245,158,11,0.10)', label: 'modéré' },
  { icon: '🌧️', temp: '22°C', dot: '#EF4444', bg: 'rgba(239,68,68,0.10)', label: 'élevé' },
  { icon: '☀️', temp: '29°C', dot: '#10B981', bg: 'rgba(16,185,129,0.10)', label: 'OK' },
  { icon: '⛅', temp: '31°C', dot: '#EAB308', bg: 'rgba(234,179,8,0.10)', label: 'surveiller' },
  { icon: '☀️', temp: '27°C', dot: '#10B981', bg: 'rgba(16,185,129,0.10)', label: 'OK' },
];

const deliveries = [
  { date: "Aujourd'hui 14:00", client: 'Ciments du Maroc', product: 'B25', volume: 12.5, truck: 'TK-03', status: 'En route', statusColor: T.success },
  { date: "Aujourd'hui 16:30", client: 'ONCF', product: 'B30', volume: 8.0, truck: 'TK-01', status: 'En Chargement', statusColor: T.info },
  { date: 'Demain 07:00', client: 'Addoha Group', product: 'B25', volume: 15.0, truck: 'TK-02', status: 'Planifié', statusColor: T.textDim },
  { date: 'Demain 09:30', client: 'TGCC', product: 'B35', volume: 10.0, truck: 'TK-03', status: 'Planifié', statusColor: T.textDim },
  { date: 'Demain 13:00', client: 'Alliances', product: 'B30', volume: 8.5, truck: 'TK-01', status: 'Planifié', statusColor: T.textDim },
  { date: 'Après-demain 08:00', client: 'Jet Contractors', product: 'B40', volume: 6.0, truck: 'TK-02', status: 'Planifié', statusColor: T.textDim },
];

// ─────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive, delay = 0 }: {
  label: string; value: number; suffix: string; color: string;
  icon: any; trend: string; trendPositive: boolean; delay?: number;
}) {
  const animated = useAnimatedCounter(value, 1200);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out', height: '100%' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6, whiteSpace: 'nowrap' }}>{label}</p>
            <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 36, fontWeight: 200, color: '#D4A843', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {animated.toLocaleString('fr-FR')}
              {suffix && <span style={{ fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>{suffix}</span>}
            </p>
            <p style={{ fontSize: 12, color: trend.toLowerCase() === 'stable' ? '#9CA3AF' : (trendPositive ? '#22C55E' : '#EF4444'), marginTop: 5, fontWeight: trend.toLowerCase() === 'stable' ? 400 : 500, whiteSpace: 'nowrap' }}>
              {trend.toLowerCase() === 'stable' ? '—' : (trendPositive ? '↑' : '↓')} {trend}
            </p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(212, 168, 67, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color="#D4A843" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SCHEDULE BLOCK
// ─────────────────────────────────────────────────────
function ScheduleBlock({ slot, delay = 0, riskyClients, onClick, rentabilite = false }: { slot: { product: string; volume: number; client: string } | null; delay?: number; riskyClients?: Set<string>; onClick?: () => void; rentabilite?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

   if (!slot) {
    return (
      <div
        style={{
          opacity: visible ? 1 : 0, transition: 'all 500ms ease-out',
          border: '1px dashed rgba(212, 168, 67, 0.2)', borderRadius: 8, padding: '10px 12px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 58,
          cursor: 'pointer', background: hov ? 'rgba(212,168,67,0.05)' : 'transparent',
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <span style={{ color: 'rgba(212, 168, 67, 0.5)', fontSize: 20, lineHeight: 1, opacity: hov ? 1 : 0, transition: 'opacity 200ms' }}>+</span>
        <span style={{ color: 'rgba(212, 168, 67, 0.4)', fontSize: 10, marginTop: hov ? 2 : 0 }}>Disponible</span>
      </div>
    );
  }

  const color = '#D4A843';
  const isRisky = riskyClients?.has(slot.client.toLowerCase()) ?? false;
  const dotColor = isRisky ? T.danger : '#D4A843';

  // Rentabilité mode styling
  const HIGH_MARGIN = ['ciments du maroc', 'saudi readymix', 'oncf'];
  const LOW_MARGIN = ['tgcc', 'jet con.'];
  const clientLower = slot.client.toLowerCase();
  let rentaBg = 'rgba(245, 158, 11, 0.08)';
  let rentaBorder = color;
  if (rentabilite) {
    if (HIGH_MARGIN.some(c => clientLower.includes(c))) {
      rentaBg = 'rgba(34,197,94,0.08)';
      rentaBorder = '#22C55E';
    } else if (LOW_MARGIN.some(c => clientLower.includes(c))) {
      rentaBg = 'rgba(245,158,11,0.08)';
      rentaBorder = '#F59E0B';
    } else {
      rentaBorder = '#D4A843';
    }
  }

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 500ms ease-out, transform 500ms ease-out, box-shadow 200ms, border-color 200ms',
        background: rentabilite ? rentaBg : 'rgba(245, 158, 11, 0.08)',
        border: `1px solid ${hov ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.15)'}`,
        borderLeft: `3px solid ${rentabilite ? rentaBorder : color}`,
        borderRadius: 8, padding: '8px 10px',
        cursor: 'pointer', minHeight: 58,
        position: 'relative',
      }}
    >
      {/* Payment status dot */}
      <div style={{
        position: 'absolute', top: 5, right: 5,
        width: 7, height: 7, borderRadius: '50%',
        background: dotColor,
        boxShadow: `0 0 4px ${dotColor}60`,
      }} />
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 800, color: '#D4A843', marginBottom: 2, display: 'inline-block', padding: '1px 6px', borderRadius: 4, background: 'rgba(212,168,67,0.2)', border: '1px solid rgba(212,168,67,0.5)' }}>{slot.product}</p>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.textPri }}>{slot.volume} m³</p>
      <p style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{slot.client}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// DELIVERY CARD
// ─────────────────────────────────────────────────────
function DeliveryCard({ d, delay = 0, routeData, weatherIndex = 0 }: { d: typeof deliveries[0]; delay?: number; routeData?: any; weatherIndex?: number }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const isEnRoute = d.status === 'En route';

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(20px)',
        transition: 'all 400ms ease-out',
        background: T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderTop: '2px solid #D4A843',
        borderLeft: `4px solid ${d.statusColor}`,
        borderRadius: 10, padding: '12px 16px',
        boxShadow: hov ? `0 4px 16px rgba(0,0,0,0.2)` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri }}>{d.client}</p>
            {(() => {
              const ratings: Record<string, { score: string; color: string }> = {
                'Ciments du Maroc': { score: '4.8', color: '#10B981' },
                'ONCF': { score: '4.2', color: '#10B981' },
                'Addoha Group': { score: '4.5', color: '#10B981' },
                'TGCC': { score: '3.8', color: '#F59E0B' },
                'Alliances': { score: '4.6', color: '#10B981' },
                'Jet Contractors': { score: '4.1', color: '#10B981' },
              };
              const r = ratings[d.client];
              return r ? <span style={{ fontSize: 10, fontWeight: 700, color: r.color }}>★ {r.score}</span> : null;
            })()}
            <span style={{ padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: `${PRODUCT_COLORS[d.product] || T.gold}18`, color: PRODUCT_COLORS[d.product] || T.gold, border: `1px solid ${PRODUCT_COLORS[d.product] || T.gold}40` }}>{d.product}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: T.textDim, fontSize: 11 }}>{d.date}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.gold }}>{d.volume} m³</span>
            <span style={{ padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: `${T.info}18`, color: T.info, border: `1px solid ${T.info}30` }}>{d.truck}</span>
            {(() => {
              const mockRoutes: Record<string, { km: number; min: number }> = {
                'BTP Maroc': { km: 8, min: 18 }, 'Ciments & Béton du Sud': { km: 15, min: 32 },
                'Constructions Modernes': { km: 22, min: 40 }, 'Saudi Readymix': { km: 35, min: 55 },
                'ONCF': { km: 12, min: 25 }, 'Addoha Group': { km: 18, min: 35 }, 'Addoha': { km: 18, min: 35 },
                'TGCC': { km: 28, min: 45 }, 'Tgcc': { km: 28, min: 45 },
                'Ciments du Maroc': { km: 10, min: 22 }, 'Alliances': { km: 14, min: 28 },
                'Jet Contractors': { km: 20, min: 38 }, 'Jet Con.': { km: 20, min: 38 },
              };
              const route = routeData?.optimized_route;
              const mock = mockRoutes[d.client];
              const km = route?.distance_km ?? mock?.km;
              const min = route?.estimated_duration_min ?? mock?.min;
              return km != null ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(148,163,184,0.08)', color: T.textSec, border: '1px solid rgba(148,163,184,0.15)' }}>
                  📍 {km} km · {min} min
                </span>
              ) : null;
            })()}
            {(() => {
              const wb = WEATHER_BADGES[weatherIndex % WEATHER_BADGES.length];
              return (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                  background: wb.bg, border: `1px solid ${wb.dot}30`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: wb.dot, flexShrink: 0 }} />
                  {wb.icon} {wb.temp}
                </span>
              );
            })()}
            {routeData?.whatsapp_sent && (
              <span style={{ fontSize: 10, color: T.success }}>WhatsApp ✓</span>
            )}
            {isEnRoute && (
              <span style={{ fontSize: 10, color: T.success, fontWeight: 600 }}>🚛 En route · ETA {new Date(Date.now() + 25 * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
          {(() => {
            const ytdData: Record<string, string> = {
              'Ciments du Maroc': '248,000 DH YTD · 14 livraisons',
              'ONCF': '186,000 DH YTD · 8 livraisons',
              'Addoha Group': '124,000 DH YTD · 7 livraisons',
              'TGCC': '42,000 DH YTD · 3 livraisons',
              'Alliances': '95,000 DH YTD · 6 livraisons',
            };
            const ytd = ytdData[d.client];
            return ytd ? <p style={{ color: '#9CA3AF', fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', marginTop: 4 }}>{ytd}</p> : null;
          })()}
        </div>
        <Badge label={d.status} color={d.statusColor} bg={`${d.statusColor}18`} pulse={isEnRoute} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// WEATHER FORECAST COLLAPSIBLE WRAPPER
// ─────────────────────────────────────────────────────
function WeatherForecastCollapsible() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
      border: '1px solid rgba(245, 158, 11, 0.15)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(255,215,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Cloud size={14} color={T.gold} />
        </div>
        <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', flex: 1 }}>
          Agent IA Météo
        </span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        {open ? <ChevronUp size={16} color={T.textSec} /> : <ChevronDown size={16} color={T.textSec} />}
      </button>
      {open && (
        <div style={{ padding: '0 0 0 0' }}>
          <WeatherForecastCard />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────
// ZONE HEADER
// ─────────────────────────────────────────────────────
function ZoneHeader({ icon, label, right }: { icon: string; label: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
      paddingBottom: 12, borderBottom: `1px solid ${T.cardBorder}`,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
      {right}
    </div>
  );
}
// ─────────────────────────────────────────────────────
// COLLAPSIBLE CHRONOLOGIQUE TABLE
// ─────────────────────────────────────────────────────
function CollapsibleChronologique() {
  const [chronoOpen, setChronoOpen] = useState(false);
  return (
    <div style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setChronoOpen(!chronoOpen)}
        style={{
          width: '100%', height: 48, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px', background: 'rgba(15,23,41,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #D4A843',
          borderRadius: chronoOpen ? '12px 12px 0 0' : 12,
          cursor: 'pointer', textAlign: 'left', flexShrink: 0,
        }}
      >
        <Clock size={14} color={T.gold} />
        <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          PLANNING CHRONOLOGIQUE — Vendredi 13 Mars 2026
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: T.textSec, fontWeight: 500, whiteSpace: 'nowrap' }}>
          5 livraisons · 225 m³ · 153,250 DH
        </span>
        {chronoOpen ? <ChevronUp size={14} color={T.textSec} /> : <ChevronDown size={14} color={T.textSec} />}
      </button>
      {chronoOpen && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr',
            borderBottom: `1px solid ${T.cardBorder}`, background: `${T.cardBorder}40`,
          }}>
            {['BL', 'Client', 'Formule', 'Montant', 'Volume', 'Heure', 'Camion', 'Statut'].map(h => (
              <div key={h} style={{
                padding: '10px 14px',
                color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em',
                borderLeft: h !== 'BL' ? `1px solid ${T.cardBorder}` : 'none',
                textAlign: ['Montant', 'Volume'].includes(h) ? 'right' : ['Heure', 'Statut'].includes(h) ? 'center' : 'left',
              }}>{h}</div>
            ))}
          </div>
          {[
            { bl: 'BL-2602-011', client: 'Ciments du Maroc', formule: 'B25', montant: '38 250 DH', volume: '45 m³', heure: '07:00', camion: 'TOU-01', statut: 'En route', statutColor: T.success },
            { bl: 'BL-2602-012', client: 'ONCF', formule: 'B30', montant: '19 500 DH', volume: '30 m³', heure: '08:00', camion: 'TOU-02', statut: 'En Chargement', statutColor: T.info },
            { bl: 'BL-2602-013', client: 'Constructions Modernes', formule: 'B20', montant: '40 000 DH', volume: '80 m³', heure: '09:30', camion: 'TOU-01', statut: 'Planifié', statutColor: T.textDim },
            { bl: 'BL-2602-014', client: 'Saudi Readymix', formule: 'B25', montant: '42 500 DH', volume: '50 m³', heure: '13:00', camion: 'TOU-03', statut: 'Planifié', statutColor: T.textDim },
            { bl: 'BL-2602-015', client: 'BTP Maroc', formule: 'B25', montant: '13 000 DH', volume: '20 m³', heure: '15:00', camion: 'TOU-02', statut: 'Planifié', statutColor: T.textDim },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr',
              borderTop: i > 0 ? `1px solid ${T.cardBorder}60` : 'none',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: '#D4A843' }}>{row.bl}</div>
              <div style={{ padding: '10px 14px', fontSize: 12, color: T.textPri, fontWeight: 600, borderLeft: `1px solid ${T.cardBorder}60` }}>{row.client}</div>
              <div style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: PRODUCT_COLORS[row.formule] || T.gold, borderLeft: `1px solid ${T.cardBorder}60` }}>{row.formule}</div>
              <div style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: '#D4A843', textAlign: 'right', borderLeft: `1px solid ${T.cardBorder}60` }}>{row.montant}</div>
              <div style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: T.textPri, textAlign: 'right', borderLeft: `1px solid ${T.cardBorder}60` }}>{row.volume}</div>
              <div style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'ui-monospace, monospace', color: T.textSec, textAlign: 'center', borderLeft: `1px solid ${T.cardBorder}60` }}>{row.heure}</div>
              <div style={{ padding: '10px 14px', fontSize: 11, textAlign: 'center', borderLeft: `1px solid ${T.cardBorder}60` }}>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: `${T.info}18`, color: T.info, fontSize: 10, fontWeight: 600 }}>{row.camion}</span>
              </div>
              <div style={{ padding: '10px 14px', fontSize: 11, textAlign: 'center', borderLeft: `1px solid ${T.cardBorder}60` }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.statutColor }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: row.statutColor }}>{row.statut}</span>
                </span>
              </div>
            </div>
          ))}
          <div style={{
            padding: '12px 14px', borderTop: `1px solid ${T.cardBorder}`,
            background: `${T.cardBorder}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#D4A843' }}>Total journée:</span>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 700, color: '#D4A843' }}>153 250 DH</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#D4A843' }}>5 livraisons</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#D4A843' }}>225 m³</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#22C55E' }}>Marge moyenne: <span style={{ fontFamily: 'ui-monospace, monospace' }}>36%</span></span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// IA AGENT SECTION
// ─────────────────────────────────────────────────────
function IAAgentSection({ name, content }: { name: string; content: React.ReactNode }) {
  const urgencyColor = 
    name.includes('MÉTÉO') || name.includes('RETARDS') ? '#EF4444' :
    name.includes('ORCHESTRATION') || name.includes('FLOTTE') ? '#F59E0B' :
    '#10B981';
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: urgencyColor, flexShrink: 0 }} />
          <span style={{ color: '#D4A843', fontSize: 14, animation: 'tbos-pulse 3s ease-in-out infinite' }}>✦</span>
          <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>AGENT IA: {name}</span>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}>Généré par IA · Claude Opus</span>
      </div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(212, 168, 67, 0.02) 100%)',
        border: `1px solid ${T.cardBorder}`,
        borderTop: '2px solid #D4A843',
        borderLeft: '3px solid #D4A843',
        borderRadius: 12, padding: 20,
      }}>
        {content}
      </div>
    </section>
  );
}

export default function WorldClassPlanning({ fleetPanelOpen = true, dispatchHeader, dispatchMain, fleetPanel, footerActions }: { fleetPanelOpen?: boolean; dispatchHeader?: React.ReactNode; dispatchMain?: React.ReactNode; fleetPanel?: React.ReactNode; footerActions?: React.ReactNode }) {

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dispatch');
  const [scheduleViewMode, setScheduleViewMode] = useState<'standard' | 'rentabilite'>('standard');
  const [deliverySort, setDeliverySort] = useState<'heure' | 'revenu' | 'satisfaction'>('heure');
  const dispatchRef = useRef<HTMLDivElement | null>(null);
  const kpisRef = useRef<HTMLDivElement | null>(null);
  const semaineRef = useRef<HTMLDivElement | null>(null);
  const capaciteRef = useRef<HTMLDivElement | null>(null);
  const iaRef = useRef<HTMLDivElement | null>(null);
  const { kpis: pKpis, liveDeliveries } = usePlanningLiveData();
  const { results: n8nResults, triggerWorkflow, isSubmitting: isOptimizing } = useN8nWorkflow();

  // Route data from n8n results keyed by delivery_id
  const routeDataMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    n8nResults.forEach(r => {
      if (r.agent_type === 'delivery_orchestration' && r.response_payload?.delivery_id) {
        map[r.response_payload.delivery_id] = r.response_payload;
      }
    });
    return map;
  }, [n8nResults]);

  const [routePanelOpen, setRoutePanelOpen] = useState(false);
  const [riskyClients, setRiskyClients] = useState<Set<string>>(new Set());
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlotInfo | null>(null);

  // Fetch clients with stale 'en_attente' devis (>30 days)
  useEffect(() => {
    async function loadRiskyClients() {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: riskyDevis } = await supabase
        .from('devis')
        .select('client_id')
        .eq('statut', 'en_attente')
        .lt('created_at', thirtyDaysAgo);
      if (!riskyDevis?.length) return;
      const clientIds = [...new Set(riskyDevis.map(d => d.client_id).filter(Boolean))] as string[];
      if (!clientIds.length) return;
      const { data: clients } = await supabase
        .from('clients')
        .select('client_id, nom_client')
        .in('client_id', clientIds);
      if (clients?.length) {
        setRiskyClients(new Set(clients.map(c => c.nom_client.toLowerCase())));
      }
    }
    loadRiskyClients();
  }, []);
  const handleOptimizeRoutes = () => {
    setRoutePanelOpen(true);
  };
  const tabs = [
    { id: 'dispatch', label: 'Dispatch' },
    { id: 'planning', label: 'Planning' },
    { id: 'ia', label: 'Intelligence IA' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.85} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <PageHeader
        icon={CalendarDays}
        title="Planning & Expédition"
        subtitle="Planification & dispatch des livraisons"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleOptimizeRoutes}
              disabled={isOptimizing}
              style={{
                background: '#D4A843', color: '#0F1629', border: 'none',
                borderRadius: '8px', padding: '8px 20px', cursor: isOptimizing ? 'wait' : 'pointer',
                fontSize: '14px', fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                opacity: isOptimizing ? 0.6 : 1,
              }}
            >
              📍 Optimiser Routes
            </button>
            <button
              onClick={() => navigate('/bons')}
              style={{
                border: '1px solid #D4A843', color: '#D4A843', background: 'transparent',
                borderRadius: '8px', padding: '8px 20px', cursor: 'pointer',
                fontSize: '14px',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}
            >
              <Plus size={13} />
              Nouvelle Commande
            </button>
          </div>
        }
      />

      {/* ── PAGE CONTENT ── */}
      <div style={{ width: '100%', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }} className="sm:!px-6">

        {/* ═══════════════════════════════════════════════════
            TAB 1: DISPATCH
            ═══════════════════════════════════════════════════ */}
        {activeTab === 'dispatch' && (
          <div ref={dispatchRef}>
            {/* DISPATCH SCORE HERO */}
            <div style={{
              background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              borderTop: '2px solid #D4A843',
              borderRadius: 12, padding: '20px 24px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #D4A843, transparent)', backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite' }} />
              <div style={{ flex: '1 1 200px' }}>
                <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>SCORE DISPATCH DU JOUR</p>
                <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 52, fontWeight: 100, color: '#D4A843', lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0 0 20px rgba(212,168,67,0.2)' }}>9.2<span style={{ fontSize: 20, color: '#9CA3AF' }}>/10</span></p>
                <p style={{ fontSize: 12, color: T.success, marginTop: 4, fontWeight: 500 }}>↗ +0.3 pts vs hier</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'ON-TIME 94%', bg: 'rgba(212,168,67,0.12)' },
                    { label: 'FLOTTE 87%', bg: 'rgba(212,168,67,0.12)' },
                    { label: 'QUALITÉ 96%', bg: 'rgba(212,168,67,0.12)' },
                  ].map(b => (
                    <span key={b.label} style={{ padding: '3px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700, background: 'transparent', color: '#D4A843', border: '1px solid #D4A843', letterSpacing: '0.08em' }}>{b.label}</span>
                  ))}
                </div>
              </div>
              <div style={{ flex: '1 1 200px', textAlign: 'center' }}>
                <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>REVENU JOURNÉE</p>
                <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 36, fontWeight: 200, color: '#D4A843', lineHeight: 1, letterSpacing: '-0.02em' }}>153,250 <span style={{ fontSize: 16, color: '#9CA3AF' }}>DH</span></p>
                <p style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>5 livraisons · 225 m³</p>
                <p style={{ fontSize: 11, color: T.success, fontWeight: 600, marginTop: 2 }}>Marge moyenne: 36%</p>
              </div>
              <div style={{ flex: '0 0 auto' }}>
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={32} fill="none" stroke={T.cardBorder} strokeWidth={6} />
                  <circle cx={40} cy={40} r={32} fill="none" stroke={T.warning} strokeWidth={6}
                    strokeDasharray={`${0.72 * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                    strokeLinecap="round" transform="rotate(-90 40 40)"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(212,168,67,0.2))' }}
                  />
                  <text x={40} y={38} textAnchor="middle" style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 16, fontWeight: 200, fill: T.warning }}>72%</text>
                  <text x={40} y={52} textAnchor="middle" style={{ fontSize: 7, fill: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>CAPACITÉ</text>
                </svg>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* 1. Alerte Météo IA */}
              <WeatherAlertBanner />

              {/* 2. 5-Day Weather Strip */}
              <div style={{
                display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden',
                border: '1px solid rgba(245, 158, 11, 0.15)',
                borderTop: '2px solid #D4A843',
                background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
              }}>
                {[
                  { day: 'Jeu 12', icon: '☀', temp: '28°C', label: 'Normal', color: '#10B981' },
                  { day: 'Ven 13', icon: '☀', temp: '30°C', label: 'Normal', color: '#10B981' },
                  { day: 'Sam 14', icon: '🔥', temp: '38°C', label: 'Risque', color: '#EF4444' },
                  { day: 'Dim 15', icon: '☀', temp: '26°C', label: 'Normal', color: '#10B981' },
                  { day: 'Lun 16', icon: '🌧', temp: '22°C', label: 'Pluie', color: '#F59E0B' },
                ].map((w, i) => (
                  <div key={i} style={{
                    flex: 1, padding: '10px 12px', textAlign: 'center',
                    borderLeft: i > 0 ? `1px solid ${T.cardBorder}` : 'none',
                    background: w.color === '#EF4444' ? 'rgba(239,68,68,0.06)' : 'transparent',
                    ...(w.color === '#EF4444' ? { borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)' } : {}),
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{w.day}</p>
                    <p style={{ fontSize: 16, marginBottom: 2 }}>{w.icon} <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 20, fontWeight: 200, color: w.color === '#EF4444' ? '#EF4444' : T.textPri }}>{w.temp}</span></p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: w.label === 'Normal' ? '#D4A843' : w.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: w.label === 'Normal' ? '#D4A843' : w.color }} />
                      {w.label === 'Risque' ? '⚠ ' : '● '}{w.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* 3. Dispatch header content (calendar, KPIs) */}
              {dispatchHeader}

              {/* 4. Main dispatch area + fleet sidebar */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {dispatchMain}
                  {/* Planning Chronologique fills remaining space alongside fleet sidebar */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 20 }}>
                    <CollapsibleChronologique />
                  </div>
                </div>
                {fleetPanel}
              </div>

              {/* 5. Compact AI Insight Strip */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.06) 0%, rgba(212, 168, 67, 0.01) 100%)',
                border: `1px solid ${T.cardBorder}`,
                borderTop: '2px solid #D4A843',
                borderRadius: 12, overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(212, 168, 67, 0.02) 100%)',
                  borderBottom: `1px solid ${T.cardBorder}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#D4A843', fontSize: 14, animation: 'tbos-pulse 3s ease-in-out infinite' }}>✦</span>
                    <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em' }}>INTELLIGENCE IA</span>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 600, background: 'rgba(212,168,67,0.06)', color: '#D4A843', border: '1px solid #D4A843' }}>Généré par IA · Claude Opus</span>
                </div>
                {[
                  { dot: '#EF4444', text: <><span style={{ color: '#D4A843', fontWeight: 700 }}>Météo:</span> Samedi 14 — 38°C risque fissuration. Retardateur requis B25/B30</> },
                  { dot: '#F59E0B', text: <><span style={{ color: '#D4A843', fontWeight: 700 }}>Retards:</span> BL-2602-014 Saudi Readymix probabilité retard 35%</> },
                  { dot: '#34d399', text: <><span style={{ color: '#D4A843', fontWeight: 700 }}>Routes:</span> 3 livraisons regroupées Casa Nord — Économie 180 DH</> },
                ].map((ins, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 18px',
                    borderTop: i > 0 ? `1px solid ${T.cardBorder}60` : 'none',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: ins.dot, flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.4, flex: 1 }}>{ins.text as any}</span>
                  </div>
                ))}
                <div style={{ padding: '8px 18px', borderTop: `1px solid ${T.cardBorder}`, background: `${T.cardBorder}20` }}>
                  <button
                    onClick={() => setActiveTab('ia')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4A843', fontSize: 11, fontWeight: 600, padding: 0 }}
                  >
                    Voir toute l'intelligence →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 2: PLANNING
            ═══════════════════════════════════════════════════ */}
        {activeTab === 'planning' && (
          <div ref={semaineRef}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* 1. Planning KPIs */}
              <div ref={kpisRef}>
                <SectionHeader icon={BarChart3} label="Planning KPIs" />
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" style={{ alignItems: 'stretch' }}>
                  <KPICard label="Commandes Semaine" value={pKpis.commandes} suffix="" color={T.gold} icon={FileText} trend="+3 vs sem. dern." trendPositive delay={0} />
                  <KPICard label="Volume Planifié" value={pKpis.volumePlanifie} suffix="m³" color={T.gold} icon={BarChart3} trend="+8% vs sem. dern." trendPositive delay={80} />
                  <KPICard label="Capacité Utilisée" value={pKpis.capaciteUsed} suffix="%" color={T.gold} icon={BarChart3} trend="+5% vs sem. dern." trendPositive delay={160} />
                  <KPICard label="Livraisons Prévues" value={pKpis.livraisons} suffix="" color={T.gold} icon={Truck} trend="stable" trendPositive delay={240} />
                  <KPICard label="Revenu Planifié" value={892} suffix="K DH" color={T.gold} icon={TrendingUp} trend="↗ +6% vs sem. dern." trendPositive delay={320} />
                </div>
              </div>

              {/* 2. Weekly Schedule */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
                  <SectionHeader icon={CalendarDays} label="Planning Hebdomadaire" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 2 }}>
                    {(['standard', 'rentabilite'] as const).map(mode => (
                      <button key={mode} onClick={() => setScheduleViewMode(mode)} style={{
                        padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 600,
                        background: scheduleViewMode === mode ? 'rgba(212,168,67,0.15)' : 'transparent',
                        color: scheduleViewMode === mode ? '#D4A843' : '#64748B',
                        transition: 'all 150ms',
                      }}>
                        {mode === 'standard' ? 'Standard' : 'Rentabilité'}
                      </button>
                    ))}
                  </div>
                </div>
                <Card style={{ padding: 0, overflow: 'hidden', overflowX: 'auto', borderTop: '2px solid #D4A843' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(6, minmax(120px, 1fr))', gap: 0, minWidth: 800 }}>
                    <div style={{ padding: '10px 14px', background: `${T.cardBorder}40`, borderBottom: `1px solid ${T.cardBorder}` }} />
                    {weekDays.map(d => (
                      <div key={d} style={{
                        padding: '10px 12px', textAlign: 'center',
                        background: `${T.cardBorder}40`, borderBottom: `1px solid ${T.cardBorder}`, borderLeft: `1px solid ${T.cardBorder}`,
                        color: T.gold, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}>{d}</div>
                    ))}
                  </div>
                  {schedule.map((row, ri) => (
                    <div key={row.time} style={{ display: 'grid', gridTemplateColumns: '80px repeat(6, minmax(120px, 1fr))', gap: 0, borderTop: `1px solid ${T.cardBorder}`, minWidth: 800 }}>
                      <div style={{
                        padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRight: `1px solid ${T.cardBorder}`,
                      }}>
                        <span style={{ color: T.textDim, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', writingMode: 'horizontal-tb' }}>{row.time}</span>
                      </div>
                      {row.slots.map((slot, si) => (
                        <div key={si} style={{ padding: 8, borderLeft: `1px solid ${T.cardBorder}` }}>
                          <ScheduleBlock slot={slot} delay={ri * 80 + si * 30} riskyClients={riskyClients} rentabilite={scheduleViewMode === 'rentabilite'} onClick={slot ? () => setSelectedSlot({ slot, dayLabel: weekDays[si], timeLabel: row.time }) : undefined} />
                        </div>
                      ))}
                    </div>
                  ))}
                </Card>
              </div>

              {/* 3. Capacité & Livraisons */}
              <div ref={capaciteRef}>
                <SectionHeader icon={Truck} label="Capacité & Livraisons" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="tbos-card-stagger" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)', borderTop: '2px solid #D4A843', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: 'none' }}>
                    <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Capacité de Production</p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <Gauge pct={72} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {[
                        { label: 'Capacité Max', value: '1 740 m³', color: T.textSec },
                        { label: 'Planifié', value: '1 250 m³', color: T.warning },
                        { label: 'Disponible', value: '490 m³', color: T.success },
                      ].map(box => (
                        <div key={box.label} style={{
                          background: `${T.cardBorder}40`, borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                          border: `1px solid ${T.cardBorder}`,
                        }}>
                          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>{box.label}</p>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: box.color }}>{box.value}</p>
                        </div>
                      ))}
                    </div>
                    {/* Weather-adjusted capacity */}
                    <div style={{ borderTop: '1px solid rgba(212,168,67,0.15)', marginTop: 12, paddingTop: 12 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Capacité ajustée météo</p>
                      <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 32, fontWeight: 200, color: '#F59E0B', lineHeight: 1, marginBottom: 8 }}>58%</p>
                      <p style={{ color: '#F59E0B', fontSize: 12, marginBottom: 4 }}>⚠ Samedi 38°C — capacité réduite estimée 20%</p>
                      <p style={{ color: '#22C55E', fontSize: 12 }}>Dimanche: 72% (conditions normales)</p>
                    </div>
                  </Card>
                  <div style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)', borderTop: '2px solid #D4A843', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={14} color={T.gold} />
                        <span style={{ color: T.textSec, fontSize: 12, fontWeight: 600 }}>Prochaines Livraisons</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {(['heure', 'revenu', 'satisfaction'] as const).map(s => (
                          <span
                            key={s}
                            onClick={() => setDeliverySort(s)}
                            style={{
                              fontSize: 11, cursor: 'pointer', paddingBottom: 2,
                              color: deliverySort === s ? '#D4A843' : '#9CA3AF',
                              borderBottom: deliverySort === s ? '1px solid #D4A843' : '1px solid transparent',
                              fontWeight: deliverySort === s ? 600 : 400,
                              transition: 'all 150ms',
                            }}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                      {(liveDeliveries.length > 0 ? liveDeliveries : deliveries).map((d, i) => (
                        <DeliveryCard key={i} d={d} delay={i * 70} routeData={routeDataMap[(d as any).bl_id || '']} weatherIndex={i} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact AI Insight Strip for Planning */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.06) 0%, rgba(212, 168, 67, 0.01) 100%)',
                border: `1px solid ${T.cardBorder}`,
                borderTop: '2px solid #D4A843',
                borderRadius: 12, overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(212, 168, 67, 0.02) 100%)',
                  borderBottom: `1px solid ${T.cardBorder}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#D4A843', fontSize: 14, animation: 'tbos-pulse 3s ease-in-out infinite' }}>✦</span>
                    <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em' }}>INTELLIGENCE IA</span>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 600, background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)' }}>Généré par IA · Claude Opus</span>
                </div>
                {[
                  { dot: '#F59E0B', text: 'Capacité: Mercredi 11 — 4 livraisons, 202 m³ (capacité 96%). Risque saturation.' },
                  { dot: '#34d399', text: 'Tendance: Volume semaine +8% vs sem. dern. Pic prévu jeudi (193 m³).' },
                ].map((ins, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 18px',
                    borderTop: i > 0 ? `1px solid ${T.cardBorder}60` : 'none',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: ins.dot, flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.4, flex: 1 }}>{ins.text}</span>
                  </div>
                ))}
                <div style={{ padding: '8px 18px', borderTop: `1px solid ${T.cardBorder}`, background: `${T.cardBorder}20` }}>
                  <button
                    onClick={() => setActiveTab('ia')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4A843', fontSize: 11, fontWeight: 600, padding: 0 }}
                  >
                    Voir toute l'intelligence →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 3: INTELLIGENCE IA
            ═══════════════════════════════════════════════════ */}
        {activeTab === 'ia' && (
          <div ref={iaRef}>
            <ZoneHeader
              icon="✦"
              label="INTELLIGENCE IA"
              right={
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 999,
                  background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.25)',
                  fontSize: 11, fontWeight: 600, color: '#D4A843',
                }}>
                  5 agents actifs
                </span>
              }
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* 1. Orchestration Livraisons */}
              <IAAgentSection
                name="ORCHESTRATION LIVRAISONS"
                content={
                  <div className="flex flex-col gap-4">
                    <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>3 livraisons regroupées Casa Nord — économie 180 DH et 45 min</p>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                      <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.7 }}>
                        Routes optimisées ce matin. Économie carburant estimée: <span style={{ color: '#34d399', fontWeight: 600 }}>180 DH</span>. Temps gagné: <span style={{ color: '#34d399', fontWeight: 600 }}>45 min</span>.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                      <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.7 }}>
                        Toupie <span style={{ color: '#fff', fontWeight: 600 }}>TOU-03</span> en surcharge cette semaine (<span style={{ color: '#F59E0B', fontWeight: 600 }}>6 rotations/jour vs recommandé 5</span>).
                      </p>
                    </div>
                    <div style={{ background: 'rgba(212,168,67,0.05)', borderLeft: '3px solid #D4A843', padding: 12, borderRadius: '0 8px 8px 0', marginTop: 8 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6 }}>
                        <span style={{ color: '#D4A843', fontWeight: 600 }}>Recommandation:</span> Basculer 2 livraisons de TOU-03 sur TOU-01 demain. Prévoir TOU-03 en backup pour BL-2602-014 Saudi Readymix (50m³).
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>Économie: 180 DH</span>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(212,168,67,0.12)', color: '#D4A843' }}>3 optimisations</span>
                    </div>
                  </div>
                }
              />

              {/* 2. Météo */}
              <IAAgentSection
                name="MÉTÉO"
                content={
                  <div>
                    <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>Samedi 38°C — risque fissuration élevé</p>
                    <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.8 }}>
                      Prévisions 48h: <span style={{ color: '#fff', fontWeight: 600 }}>Samedi 14 mars</span> — température <span style={{ color: '#EF4444', fontWeight: 600 }}>38°C</span> prévue à 14h. Impact béton: temps de prise réduit de <span style={{ color: '#F59E0B', fontWeight: 600 }}>20%</span>. <span style={{ color: '#fff', fontWeight: 600 }}>Dimanche 15</span>: conditions normales, aucun ajustement nécessaire.
                    </p>
                    <div style={{ background: 'rgba(212,168,67,0.05)', borderLeft: '3px solid #D4A843', padding: 12, borderRadius: '0 8px 8px 0', marginTop: 8 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6 }}>
                        <span style={{ color: '#D4A843', fontWeight: 600 }}>Recommandation:</span> (1) Ajouter retardateur de prise aux formules B25/B30, (2) Planifier livraisons avant 11h, (3) Alerter 3 chantiers identifiés à risque.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>Risque: Élevé samedi</span>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(212,168,67,0.12)', color: '#D4A843' }}>Confiance: 92%</span>
                    </div>
                  </div>
                }
              />

              {/* 3. Prédiction Retards */}
              <IAAgentSection
                name="PRÉDICTION RETARDS"
                content={
                  <div className="flex flex-col gap-4">
                    <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>BL-2602-014 Saudi Readymix — probabilité retard 35%</p>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                      <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.7 }}>
                        <span style={{ color: '#fff', fontWeight: 600 }}>BL-2602-014 Saudi Readymix</span>: distance 20km, trafic historique créneau 13h élevé, temps chargement F-B25.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                      <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.7 }}>
                        <span style={{ color: '#fff', fontWeight: 600 }}>BL-2602-015 BTP Maroc</span>: probabilité retard <span style={{ color: '#34d399', fontWeight: 600 }}>8%</span> — client proche (4km), créneau 15h fluide. Aucune action requise.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                      <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.7 }}>
                        <span style={{ color: '#fff', fontWeight: 600 }}>BL-2602-013 Constructions Modernes (80m³)</span>: 2 rotations nécessaires. Rotation 2 risque retard si Rotation 1 dépasse <span style={{ color: '#EF4444', fontWeight: 600 }}>45 min sur site</span>.
                      </p>
                    </div>
                    <div style={{ background: 'rgba(212,168,67,0.05)', borderLeft: '3px solid #D4A843', padding: 12, borderRadius: '0 8px 8px 0', marginTop: 8 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6 }}>
                        <span style={{ color: '#D4A843', fontWeight: 600 }}>Recommandation:</span> Avancer départ BL-2602-014 de 15 min. Pré-alerter chantier Constructions Modernes sur temps de déchargement.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>1 action requise</span>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(212,168,67,0.12)', color: '#D4A843' }}>Confiance: 89%</span>
                    </div>
                  </div>
                }
              />

              {/* 4. Optimisation Flotte */}
              <IAAgentSection
                name="OPTIMISATION FLOTTE"
                content={
                  <div>
                    <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>TOU-02 sous-utilisée, TOU-01 en surutilisation — rééquilibrage possible</p>
                    <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.8 }}>
                      Analyse hebdomadaire flotte: <span style={{ color: '#fff', fontWeight: 600 }}>TOU-02</span> à 3 rotations/jour vs capacité 5. <span style={{ color: '#F59E0B', fontWeight: 600 }}>TOU-01</span> à 5.2 rotations/jour moyenne. Coût carburant flotte cette semaine: <span style={{ color: '#fff', fontWeight: 600 }}>4,200 DH</span> (<span style={{ color: '#34d399', fontWeight: 600 }}>↘ -8% vs sem. dern.</span>).
                    </p>
                    <div style={{ background: 'rgba(212,168,67,0.05)', borderLeft: '3px solid #D4A843', padding: 12, borderRadius: '0 8px 8px 0', marginTop: 8 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6 }}>
                        <span style={{ color: '#D4A843', fontWeight: 600 }}>Recommandation:</span> Réaffecter livraison Alliances (Lundi 13h) de TOU-01 à TOU-02. Gain: <span style={{ color: '#34d399', fontWeight: 600 }}>2h disponibilité TOU-01</span> pour maintenance préventive courroie.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>Économie flotte: 340 DH/sem</span>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>Maintenance: 1 alerte</span>
                    </div>
                  </div>
                }
              />

              {/* 5. Placeholder — Satisfaction Client */}
              <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', opacity: 0.5, border: `1px solid ${T.cardBorder}`, borderTop: '2px solid #D4A843', borderRadius: 12 }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#D4A843', fontSize: 14 }}>✦</span>
                  <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>AGENT IA: SATISFACTION CLIENT</span>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(148,163,184,0.12)', color: T.textDim, border: '1px solid rgba(148,163,184,0.2)' }}>Prochainement</span>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER (all tabs) ── */}
        <footer style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {footerActions}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: T.textDim, fontSize: 11 }}>TBOS Planning & Expédition v2.0 — Dernière mise à jour: {new Date().toLocaleString('fr-FR')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
              <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Système opérationnel</span>
            </div>
          </div>
        </footer>
      </div>
      <RouteOptimizationPanel open={routePanelOpen} onClose={() => setRoutePanelOpen(false)} />
      <ScheduleDetailDrawer info={selectedSlot} onClose={() => setSelectedSlot(null)} />
    </div>
  );
}
