import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Factory, CheckCircle, Shield, Clock, Bell, Zap,
  TrendingUp, Activity, Wrench, Settings,
} from 'lucide-react';

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
  info:       '#3B82F6',
  purple:     '#8B5CF6',
  pink:       '#EC4899',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

// ─────────────────────────────────────────────────────
// ANIMATED COUNTER HOOK
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 800) {
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
// SHARED TOOLTIP
// ─────────────────────────────────────────────────────
function GoldTooltip({ active, payload, label, unit = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1A2540', border: `1px solid ${T.goldBorder}`,
      borderRadius: 10, padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || T.gold, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13 }}>
          {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{unit}
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PREMIUM CARD
// ─────────────────────────────────────────────────────
function Card({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: T.cardBg,
        border: `1px solid ${hovered ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        transform: pressed ? 'translateY(-1px) scale(0.995)' : hovered ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.25), 0 0 20px ${T.goldGlow}` : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${T.gold} 50%, transparent 100%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 200ms',
      }} />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      animation: 'tbos-pulse 2.5s infinite',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
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
      <span style={{
        color: T.gold, fontFamily: 'DM Sans, sans-serif',
        fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40 0%, transparent 80%)` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// LIVE CLOCK
// ─────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: T.textSec }}>
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const hourlyData = [
  { hour: '6h', volume: 12 }, { hour: '7h', volume: 35 },
  { hour: '8h', volume: 68 }, { hour: '9h', volume: 95 },
  { hour: '10h', volume: 110 }, { hour: '11h', volume: 88 },
  { hour: '12h', volume: 42 }, { hour: '13h', volume: 78 },
  { hour: '14h', volume: 125 }, { hour: '15h', volume: 102 },
  { hour: '16h', volume: 72 }, { hour: '17h', volume: 24 },
];

const productData = [
  { name: 'B25', volume: 320, color: T.gold },
  { name: 'B30', volume: 245, color: T.info },
  { name: 'B35', volume: 165, color: T.success },
  { name: 'B40', volume: 85, color: T.purple },
  { name: 'Spécial', volume: 36, color: T.pink },
];

const qualityData = [
  { day: 'Lun', ok: 45, variances: 3, critical: 0 },
  { day: 'Mar', ok: 52, variances: 1, critical: 1 },
  { day: 'Mer', ok: 38, variances: 5, critical: 0 },
  { day: 'Jeu', ok: 60, variances: 2, critical: 0 },
  { day: 'Ven', ok: 48, variances: 4, critical: 1 },
  { day: 'Sam', ok: 30, variances: 1, critical: 0 },
];

const batches = [
  { id: 'BN-2024-0142', product: 'B25', volume: 12.5, status: 'Complete', quality: 'OK', time: '14:32', duration: '45 min', color: T.success },
  { id: 'BN-2024-0141', product: 'B30', volume: 8.0, status: 'Complete', quality: 'OK', time: '13:15', duration: '38 min', color: T.success },
  { id: 'BN-2024-0140', product: 'B35', volume: 10.2, status: 'Complete', quality: 'VAR', time: '11:48', duration: '52 min', color: T.warning },
  { id: 'BN-2024-0139', product: 'B25', volume: 15.0, status: 'Complete', quality: 'OK', time: '10:22', duration: '41 min', color: T.success },
  { id: 'BN-2024-0138', product: 'B40', volume: 9.8, status: 'Complete', quality: 'OK', time: '09:05', duration: '48 min', color: T.success },
  { id: 'BN-2024-0137', product: 'B25', volume: 11.3, status: 'Complete', quality: 'OK', time: '08:10', duration: '43 min', color: T.success },
  { id: 'BN-2024-0136', product: 'B30', volume: 7.5, status: 'Complete', quality: 'OK', time: '07:20', duration: '36 min', color: T.success },
  { id: 'BN-2024-0135', product: 'Spécial', volume: 6.2, status: 'En cours', quality: '—', time: '15:45', duration: '—', color: T.info },
];

const equipment = [
  { name: 'Centrale 1', status: 'Actif', uptime: 98.5, lastMaint: '15 Fév', statusColor: T.success },
  { name: 'Malaxeur A', status: 'Actif', uptime: 97.2, lastMaint: '12 Fév', statusColor: T.success },
  { name: 'Pompe BP-01', status: 'Maintenance', uptime: 89.1, lastMaint: "Aujourd'hui", statusColor: T.warning },
  { name: 'Convoyeur C', status: 'Actif', uptime: 99.0, lastMaint: '18 Fév', statusColor: T.success },
];

const qualityVariances = [
  { label: 'Slump hors tolérance', count: 3 },
  { label: 'Température élevée', count: 2 },
  { label: 'Dosage adjuvant', count: 1 },
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
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: T.textDim, fontSize: 11, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
              {animated.toLocaleString('fr-FR')}
              <span style={{ fontSize: 14, fontWeight: 600, color: T.textSec, marginLeft: 4 }}>{suffix}</span>
            </p>
            <p style={{ fontSize: 11, color: trendPositive ? T.success : T.danger, marginTop: 6, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
              {trendPositive ? '↑' : '↓'} {trend}
            </p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={color} />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// BATCH CARD
// ─────────────────────────────────────────────────────
function BatchCard({ batch, delay = 0 }: { batch: typeof batches[0]; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const [hovered, setHovered] = useState(false);

  const qualityColor = batch.quality === 'OK' ? T.success : batch.quality === 'VAR' ? T.warning : T.info;

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 600ms ease-out',
      }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: T.cardBg,
          border: `1px solid ${hovered ? T.goldBorder : T.cardBorder}`,
          borderLeft: `4px solid ${batch.color}`,
          borderRadius: 12,
          padding: '14px 16px',
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.25), 0 0 16px ${T.goldGlow}` : '0 2px 8px rgba(0,0,0,0.12)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <p style={{ color: T.textDim, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{batch.id}</p>
          <span style={{
            padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
            background: `${batch.color}18`, color: batch.color, border: `1px solid ${batch.color}40`,
          }}>{batch.product}</span>
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: T.gold, marginBottom: 8 }}>
          {batch.volume} m³
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
            background: `${qualityColor}18`, color: qualityColor, border: `1px solid ${qualityColor}40`,
            animation: batch.status === 'En cours' ? 'tbos-pulse 2.5s infinite' : 'none',
          }}>
            {batch.quality === 'OK' ? '✓ OK' : batch.quality === 'VAR' ? '⚠ VAR' : '⟳ En cours'}
          </span>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: T.textSec, fontSize: 11 }}>{batch.time}</p>
            <p style={{ color: T.textDim, fontSize: 10 }}>{batch.duration}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// EQUIPMENT CARD
// ─────────────────────────────────────────────────────
function EquipmentCard({ eq, delay = 0 }: { eq: typeof equipment[0]; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const uptimePct = eq.uptime;
  const barColor = uptimePct >= 95 ? T.success : uptimePct >= 90 ? T.warning : T.danger;

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card style={{ height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: T.textPri }}>{eq.name}</p>
          <Badge label={eq.status} color={eq.statusColor} bg={`${eq.statusColor}18`} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: T.textDim, fontSize: 11 }}>Uptime</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: barColor }}>{eq.uptime}%</span>
          </div>
          <div style={{ height: 6, background: T.cardBorder, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999, background: barColor,
              width: `${uptimePct}%`,
              transition: 'width 1s ease-out',
              boxShadow: `0 0 8px ${barColor}60`,
            }} />
          </div>
        </div>
        <p style={{ color: T.textDim, fontSize: 11 }}>
          Maint: <span style={{ color: T.textSec }}>{eq.lastMaint}</span>
        </p>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// CUSTOM DONUT LABEL
// ─────────────────────────────────────────────────────
function DonutCenter({ viewBox, total }: any) {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 800, fill: T.gold }}>{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fill: T.textSec }}>m³ total</text>
    </g>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassProduction() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'batches', label: 'Batches' },
    { id: 'recettes', label: 'Recettes' },
    { id: 'planning', label: 'Planning' },
  ];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.navy, minHeight: '100vh', color: T.textPri }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.85} }
        @keyframes tbos-fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tbos-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes tbos-live { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`,
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.gold} 0%, #B8860B 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Factory size={18} color={T.navy} />
            </div>
            <div>
              <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>Production</span>
              <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1 }}>Gestion de la production béton</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                  background: activeTab === tab.id ? `${T.gold}18` : 'transparent',
                  border: activeTab === tab.id ? `1px solid ${T.goldBorder}` : '1px solid transparent',
                  color: activeTab === tab.id ? T.gold : T.textSec,
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13,
                  transition: 'all 200ms',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <LiveClock />
            <div style={{ position: 'relative' }}>
              <Bell size={18} color={T.textSec} />
              <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: T.danger }} />
            </div>
            <button style={{
              padding: '7px 16px', borderRadius: 8,
              background: T.gold, color: T.navy,
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12,
              border: 'none', cursor: 'pointer',
              transition: 'all 150ms',
            }}>
              + Nouveau Batch
            </button>
          </div>
        </div>
      </div>

      {/* ── PAGE CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── SECTION 1: KPI CARDS ── */}
        <section>
          <SectionHeader icon={Zap} label="Production KPIs" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard label="Production Aujourd'hui" value={851} suffix="m³" color={T.gold} icon={Factory} trend="+12% vs hier" trendPositive delay={0} />
            <KPICard label="Batches Complétés" value={38} suffix="" color={T.success} icon={CheckCircle} trend="+5 vs hier" trendPositive delay={80} />
            <KPICard label="Taux de Conformité" value={96} suffix="%" color={T.success} icon={Shield} trend="+1.2% ↑" trendPositive delay={160} />
            <KPICard label="Temps d'Arrêt" value={42} suffix="min" color={T.warning} icon={Clock} trend="-15% ↓ amélioré" trendPositive delay={240} />
          </div>
        </section>

        {/* ── SECTION 2: CHARTS ROW ── */}
        <section>
          <SectionHeader icon={Activity} label="Production du Jour" />
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 20 }}>

            {/* Daily Production Area Chart */}
            <Card className="tbos-card-stagger">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ color: T.textSec, fontSize: 12, fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>Production Horaire</p>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.gold }}>851 m³</p>
                </div>
                <Badge label="Peak 14h" color={T.warning} bg={`${T.warning}18`} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="prodGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.gold} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={T.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fill: T.textDim, fontSize: 10, fontFamily: 'DM Sans, sans-serif' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<GoldTooltip unit=" m³" />} />
                  <Area
                    type="monotone" dataKey="volume" stroke={T.gold} strokeWidth={2.5}
                    fill="url(#prodGold)" dot={{ fill: T.gold, r: 3 }} activeDot={{ r: 6, fill: T.gold }}
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Donut by Product */}
            <Card className="tbos-card-stagger">
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 4 }}>Production par Produit</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={productData} dataKey="volume" nameKey="name"
                    innerRadius={60} outerRadius={90}
                    animationBegin={200} animationDuration={800}
                    label={false}
                  >
                    {productData.map((p, i) => <Cell key={i} fill={p.color} />)}
                    <text />
                  </Pie>
                  <text
                    x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, fill: T.gold }}
                  >851</text>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '8px 12px' }}>
                          <p style={{ color: T.textSec, fontSize: 11 }}>{d.name}</p>
                          <p style={{ color: d.payload.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{(d.value as number).toLocaleString('fr-FR')} m³</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {productData.map(p => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                      <span style={{ color: T.textSec, fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>{p.name}</span>
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.textPri }}>{p.volume} m³</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* ── SECTION 3: LIVE BATCHES ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Factory size={16} color={T.gold} />
            <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>
              Batches en Cours
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-live 1.5s infinite' }} />
              <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Live</span>
            </div>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40 0%, transparent 80%)` }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {batches.map((batch, i) => (
              <BatchCard key={batch.id} batch={batch} delay={i * 60} />
            ))}
          </div>
        </section>

        {/* ── SECTION 4: QUALITY OVERVIEW ── */}
        <section>
          <SectionHeader icon={Shield} label="Qualité & Conformité" />
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 20 }}>

            {/* Stacked Bar Chart */}
            <Card className="tbos-card-stagger">
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Qualité Hebdomadaire</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={qualityData} barSize={24}>
                  <XAxis dataKey="day" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip content={<GoldTooltip />} />
                  <Bar dataKey="ok" stackId="q" fill={T.success} name="OK" radius={[0, 0, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="variances" stackId="q" fill={T.warning} name="Variances" animationDuration={1000} />
                  <Bar dataKey="critical" stackId="q" fill={T.danger} name="Critique" radius={[4, 4, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                {[['OK', T.success], ['Variances', T.warning], ['Critique', T.danger]].map(([label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                    <span style={{ color: T.textSec, fontSize: 11 }}>{label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quality KPIs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conformité</p>
                  <Badge label="Excellent" color={T.success} bg={`${T.success}18`} />
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 32, fontWeight: 800, color: T.gold }}>96.2%</p>
              </Card>

              <Card>
                <p style={{ color: T.success, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>✓ 0 Critiques cette semaine</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge label="6 Variances" color={T.warning} bg={`${T.warning}18`} />
                </div>
              </Card>

              <Card>
                <p style={{ color: T.textSec, fontSize: 12, marginBottom: 12 }}>Détail des variances</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {qualityVariances.map(v => (
                    <div key={v.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: T.textSec, fontSize: 12 }}>{v.label}</span>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
                        color: T.warning, background: `${T.warning}18`, padding: '2px 8px', borderRadius: 999,
                      }}>{v.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: EQUIPMENT STATUS ── */}
        <section>
          <SectionHeader icon={Settings} label="État des Équipements" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {equipment.map((eq, i) => (
              <EquipmentCard key={eq.name} eq={eq} delay={i * 80} />
            ))}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          borderTop: `1px solid ${T.cardBorder}`,
          paddingTop: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>
            TBOS Production v2.0 — Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Système opérationnel</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
