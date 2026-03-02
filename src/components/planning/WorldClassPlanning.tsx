import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
} from 'recharts';
import {
  FileText, BarChart3, Truck, Bell, CalendarDays, Clock, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useN8nWorkflow } from '@/hooks/useN8nWorkflow';
import { toast } from 'sonner';
import { WeatherAlertBanner } from './WeatherAlertBanner';
import { WeatherForecastCard } from './WeatherForecastCard';
import { DeliveryOrchestrationPanel } from './DeliveryOrchestrationPanel';

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
            <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 30, fontWeight: 200, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {animated.toLocaleString('fr-FR')}
              {suffix && <span style={{ fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>{suffix}</span>}
            </p>
            <p style={{ fontSize: 12, color: trendPositive ? '#10B981' : '#EF4444', marginTop: 5, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {trendPositive ? '↑' : '↓'} {trend}
            </p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color="#F59E0B" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SCHEDULE BLOCK
// ─────────────────────────────────────────────────────
function ScheduleBlock({ slot, delay = 0 }: { slot: { product: string; volume: number; client: string } | null; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  if (!slot) {
    return (
      <div style={{
        opacity: visible ? 1 : 0, transition: 'opacity 500ms ease-out',
        border: '1px dashed rgba(245, 158, 11, 0.1)', borderRadius: 8, padding: '10px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 58,
      }}>
        <span style={{ color: T.textDim, fontSize: 10 }}>Disponible</span>
      </div>
    );
  }

  const color = PRODUCT_COLORS[slot.product] || T.gold;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 500ms ease-out, transform 500ms ease-out, box-shadow 200ms, border-color 200ms',
        background: 'rgba(245, 158, 11, 0.08)',
        border: `1px solid ${hov ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.15)'}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8, padding: '8px 10px',
        cursor: 'default', minHeight: 58,
      }}
    >
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 800, color, marginBottom: 2 }}>{slot.product}</p>
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
        borderLeft: `4px solid ${d.statusColor}`,
        borderRadius: 10, padding: '12px 16px',
        boxShadow: hov ? `0 4px 16px rgba(0,0,0,0.2)` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri }}>{d.client}</p>
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
        </div>
        <Badge label={d.status} color={d.statusColor} bg={`${d.statusColor}18`} pulse={isEnRoute} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassPlanning({ fleetPanelOpen = true }: { fleetPanelOpen?: boolean }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('semaine');
  const kpisRef = useRef<HTMLElement | null>(null);
  const semaineRef = useRef<HTMLElement | null>(null);
  const capaciteRef = useRef<HTMLElement | null>(null);
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

  const handleOptimizeRoutes = async () => {
    try {
      await triggerWorkflow('delivery_orchestration', { date: new Date().toISOString() });
      toast.success('Optimisation des routes lancée...');
    } catch (e: any) {
      toast.error(e.message || 'Erreur d\'optimisation');
    }
  };
  const tabs = [
    { id: 'semaine', label: 'Semaine' },
    { id: 'mois', label: 'Mois' },
    { id: 'capacite', label: 'Capacité' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const refMap: Record<string, React.RefObject<HTMLElement | null>> = {
      semaine: semaineRef,
      mois: kpisRef,
      capacite: capaciteRef,
    };
    const target = refMap[tabId]?.current;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.85} }
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
                padding: '6px 16px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: T.gold,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                cursor: isOptimizing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 200ms',
                opacity: isOptimizing ? 0.6 : 1,
              }}
            >
              📍 Optimiser Routes
            </button>
            <button
              onClick={() => navigate('/bons')}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #C4933B, #FDB913)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#0F172A',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 200ms',
              }}
            >
              <Plus size={13} />
              Nouvelle Commande
            </button>
          </div>
        }
      />

      {/* ── PAGE CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 40, transition: 'padding-right 300ms ease-in-out' }} className="sm:!px-6 lg:!pr-[calc(24px+272px)]">

        {/* ── WEATHER ALERT BANNER ── */}
        <WeatherAlertBanner />

        {/* ── SECTION 1: KPIs ── */}
        <section ref={kpisRef}>
          <SectionHeader icon={BarChart3} label="Planning KPIs" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ alignItems: 'stretch' }}>
            <KPICard label="Commandes Semaine" value={pKpis.commandes} suffix="" color={T.gold} icon={FileText} trend="+3 vs sem. dern." trendPositive delay={0} />
            <KPICard label="Volume Planifié" value={pKpis.volumePlanifie} suffix="m³" color={T.gold} icon={BarChart3} trend="+8% vs sem. dern." trendPositive delay={80} />
            <KPICard label="Capacité Utilisée" value={pKpis.capaciteUsed} suffix="%" color={T.gold} icon={BarChart3} trend="+5% vs sem. dern." trendPositive delay={160} />
            <KPICard label="Livraisons Prévues" value={pKpis.livraisons} suffix="" color={T.gold} icon={Truck} trend="stable" trendPositive delay={240} />
          </div>
        </section>

        {/* ── SECTION 2: WEEKLY SCHEDULE ── */}
        <section ref={semaineRef}>
          <SectionHeader icon={CalendarDays} label="Planning Hebdomadaire" />
          <Card style={{ padding: 0, overflow: 'hidden', overflowX: 'auto' }}>
            {/* Header row */}
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

            {/* Time rows */}
            {schedule.map((row, ri) => (
              <div key={row.time} style={{ display: 'grid', gridTemplateColumns: '80px repeat(6, minmax(120px, 1fr))', gap: 0, borderTop: `1px solid ${T.cardBorder}`, minWidth: 800 }}>
                {/* Time label */}
                <div style={{
                  padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRight: `1px solid ${T.cardBorder}`,
                }}>
                  <span style={{ color: T.textDim, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', writingMode: 'horizontal-tb' }}>{row.time}</span>
                </div>
                {/* Slots */}
                {row.slots.map((slot, si) => (
                  <div key={si} style={{ padding: 8, borderLeft: `1px solid ${T.cardBorder}` }}>
                    <ScheduleBlock slot={slot} delay={ri * 80 + si * 30} />
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </section>

        {/* ── SECTION 3+4: GAUGE + DELIVERIES ── */}
        <section ref={capaciteRef}>
          <SectionHeader icon={Truck} label="Capacité & Livraisons" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Capacity Gauge */}
            <Card className="tbos-card-stagger" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: 'none' }}>
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
            </Card>

            {/* Deliveries */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Clock size={14} color={T.gold} />
                <span style={{ color: T.textSec, fontSize: 12, fontWeight: 600 }}>Prochaines Livraisons</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(liveDeliveries.length > 0 ? liveDeliveries : deliveries).map((d, i) => (
                  <DeliveryCard key={i} d={d} delay={i * 70} routeData={routeDataMap[(d as any).bl_id || '']} weatherIndex={i} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: DELIVERY ORCHESTRATION AI ── */}
        <section>
          <DeliveryOrchestrationPanel />
        </section>

        {/* ── SECTION: WEATHER FORECAST ── */}
        <section>
          <WeatherForecastCard />
        </section>


        <footer style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>TBOS Planning & Expédition v2.0 — Dernière mise à jour: {new Date().toLocaleString('fr-FR')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Système opérationnel</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
