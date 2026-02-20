import { useEffect, useRef, useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  Zap, Factory, Banknote, Settings, ChevronRight, Bell,
  TrendingUp, TrendingDown, Camera, BarChart3, Truck, Shield,
  FlaskConical, Users, Package, Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS (exact hex values per spec)
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
      background: '#1A2540', border: `1px solid ${T.gold}`, borderRadius: 10,
      padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
// PREMIUM CARD wrapper
// ─────────────────────────────────────────────────────
function Card({ children, className = '', style = {}, onClick }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className={className}
      style={{
        background: T.cardBg,
        border: `1px solid ${hovered ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transform: pressed ? 'translateY(-1px) scale(0.995)' : hovered ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: hovered
          ? `0 8px 24px rgba(0,0,0,0.25), 0 0 20px ${T.goldGlow}`
          : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        ...style,
      }}
    >
      {/* Gold top line on hover */}
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
// STATUS BADGE with pulse
// ─────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
      letterSpacing: '0.05em', animation: 'tbos-pulse 2.5s infinite',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: color,
        display: 'inline-block',
      }} />
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
    <span style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: T.textSec,
    }}>
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const cashFlowData = Array.from({ length: 30 }, (_, i) => {
  const base = 551000;
  const trend = (i / 29) * 78000;
  const wave = Math.sin((i / 29) * Math.PI * 4) * 8000;
  return {
    day: i % 5 === 4 ? `J${i + 1}` : '',
    fullDay: `J${i + 1}`,
    actuel: Math.round(base + trend * 0.6 + wave),
    projete: Math.round(base + trend + wave * 0.5),
  };
});

const arAgingData = [
  { label: '0-30j', value: 5200, fill: T.success },
  { label: '31-60j', value: 1800, fill: T.warning },
  { label: '61-90j', value: 700, fill: '#F97316' },
  { label: '>90j', value: 300, fill: T.danger },
];

const stockData = [
  { name: 'Ciment', current: 5500, max: 10000, unit: 'kg' },
  { name: 'Adjuvant', current: 150, max: 500, unit: 'L' },
  { name: 'Gravette', current: 95000, max: 120000, unit: 'kg' },
  { name: 'Eau', current: 15000, max: 20000, unit: 'L' },
];

const hourlyProductionData = [
  { hour: '06h', volume: 12 }, { hour: '07h', volume: 35 },
  { hour: '08h', volume: 68 }, { hour: '09h', volume: 95 },
  { hour: '10h', volume: 110 }, { hour: '11h', volume: 88 },
  { hour: '12h', volume: 42 }, { hour: '13h', volume: 78 },
  { hour: '14h', volume: 125 }, { hour: '15h', volume: 102 },
  { hour: '16h', volume: 72 }, { hour: '17h', volume: 24 },
];

const qualityData = [
  { day: 'Lun', ok: 45, var: 3, crit: 0 },
  { day: 'Mar', ok: 52, var: 1, crit: 1 },
  { day: 'Mer', ok: 38, var: 5, crit: 0 },
  { day: 'Jeu', ok: 60, var: 2, crit: 0 },
  { day: 'Ven', ok: 48, var: 4, crit: 1 },
  { day: 'Sam', ok: 30, var: 1, crit: 0 },
  { day: 'Dim', ok: 0, var: 0, crit: 0 },
];

const batches = [
  { id: 'BN-2024-0142', status: 'complete', volume: 12.5, quality: 'OK', time: '14:32' },
  { id: 'BN-2024-0141', status: 'complete', volume: 8.0, quality: 'OK', time: '13:15' },
  { id: 'BN-2024-0140', status: 'variance', volume: 10.2, quality: 'VAR', time: '11:48' },
  { id: 'BN-2024-0139', status: 'complete', volume: 15.0, quality: 'OK', time: '10:22' },
  { id: 'BN-2024-0138', status: 'complete', volume: 9.8, quality: 'OK', time: '09:05' },
];

const complianceData = [
  { name: 'TVA Déclaration', amount: 12450, due: '15 Fév', status: 'overdue' },
  { name: 'CNSS Cotisation', amount: 8200, due: '10 Fév', status: 'overdue' },
  { name: 'IR Mensuel', amount: 3100, due: '28 Fév', status: 'upcoming' },
  { name: 'Taxe Professionnelle', amount: 5600, due: '15 Mars', status: 'ok' },
];

const modules = [
  { icon: Factory, title: 'Production', desc: 'Batches, recettes, planning', color: T.gold, count: '3 actifs' },
  { icon: Truck, title: 'Logistique', desc: 'Livraisons, stock, transport', color: T.info, count: '2 en cours' },
  { icon: Banknote, title: 'Finances', desc: 'Factures, paiements, trésorerie', color: T.success, count: '5 en attente' },
  { icon: FlaskConical, title: 'Laboratoire', desc: 'Tests qualité, conformité', color: '#8B5CF6', count: '1 test' },
  { icon: Shield, title: 'Sécurité', desc: 'Incidents, EPI, formations', color: T.warning, count: '0 incident' },
  { icon: Users, title: 'Équipe', desc: 'Présence, planning, tâches', color: '#EC4899', count: '12 présents' },
];

// ─────────────────────────────────────────────────────
// KPI ANIMATED CARD
// ─────────────────────────────────────────────────────
function KpiBox({ label, value, unit = '', color = T.gold, icon, delay = 0 }: any) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 600ms ease-out',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {icon && <div style={{ marginBottom: 2 }}>{icon}</div>}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 800, fontSize: 24, color,
        lineHeight: 1,
      }}>{value}<span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginLeft: 4 }}>{unit}</span></span>
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: T.textSec }}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export function WorldClassDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'production' | 'finance'>('overview');

  // Animated counters
  const solde = useAnimatedCounter(551);
  const finMois = useAnimatedCounter(629);
  const entrees = useAnimatedCounter(426);
  const sorties = useAnimatedCounter(348);
  const totalAR = useAnimatedCounter(8);
  const budgetGaugePct = useAnimatedCounter(0);
  const prodTotal = useAnimatedCounter(851);

  const getStockColor = (current: number, max: number) => {
    const pct = current / max;
    if (pct > 0.7) return T.success;
    if (pct > 0.4) return T.warning;
    return T.danger;
  };

  return (
    <div style={{
      fontFamily: 'DM Sans, sans-serif',
      color: T.textPri,
      minHeight: '100vh',
    }}>

      {/* ── CSS ANIMATIONS ───────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');
        @keyframes tbos-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes tbos-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tbos-bar-grow {
          from { width: 0%; }
        }
        .tbos-card-enter { animation: tbos-fade-up 600ms ease-out forwards; }
        .tbos-bar-animate { animation: tbos-bar-grow 1200ms cubic-bezier(0.4,0,0.2,1) forwards; }
      `}</style>

      {/* ══════════════════════════════════════════
          STICKY HEADER
      ══════════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`,
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {/* Logo */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${T.gold}, #F59E0B)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BarChart3 size={18} color="#0B1120" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
            TBOS <span style={{ color: T.gold }}>Dashboard</span>
          </div>
          <div style={{ fontSize: 10, color: T.textDim, marginTop: 1 }}>Tableau de Bord Opérationnel</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {(['overview', 'production', 'finance'] as const).map((tab) => {
            const labels = { overview: 'Vue d\'ensemble', production: 'Production', finance: 'Finances' };
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                  border: active ? `1px solid ${T.goldBorder}` : '1px solid transparent',
                  background: active ? T.goldDim : 'transparent',
                  color: active ? T.gold : T.textSec,
                  transition: 'all 200ms',
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Right: Clock + Bell */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LiveClock />
          <div style={{ position: 'relative' }}>
            <Bell size={18} color={T.textSec} />
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 12, height: 12, borderRadius: '50%',
              background: T.danger, border: `2px solid ${T.navy}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 700, color: '#fff',
            }}>3</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 24px 40px', maxWidth: 1600, margin: '0 auto' }}>

        {/* ══════════════════════════════════════════
            SECTION 1 — PERFORMANCE & KPIs
        ══════════════════════════════════════════ */}
        <SectionHeader icon={Zap} label="Performance & KPIs" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* 1.1 Cash-Flow Time Machine */}
          <Card style={{ gridColumn: '1', animationDelay: '0ms' }} className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textPri, marginBottom: 2 }}>Cash-Flow Time Machine</div>
                <div style={{ fontSize: 11, color: T.textDim }}>30 jours · Actuel vs Projeté</div>
              </div>
              <Badge label="Healthy" color={T.success} bg={`${T.success}20`} />
            </div>

            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.gold} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={T.gold} stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="grayFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.textSec} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={T.textSec} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: T.textDim, fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `${Math.round(v / 1000)}K`} tick={{ fill: T.textDim, fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={38} domain={[540000, 640000]} />
                  <Tooltip content={(p) => <GoldTooltip {...p} unit=" DH" />} />
                  <Area type="monotone" dataKey="projete" stroke={T.textSec} strokeWidth={1.5} strokeDasharray="4 3" fill="url(#grayFill)" dot={false} animationDuration={1200} name="Projeté" />
                  <Area type="monotone" dataKey="actuel" stroke={T.gold} strokeWidth={2.5} fill="url(#goldFill)" dot={false} animationDuration={1000} name="Actuel" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
              {[
                { label: 'Solde Actuel', value: `${solde}K DH`, color: T.gold },
                { label: 'Fin de Mois', value: `${finMois}K DH`, color: T.textPri },
                { label: 'Entrées Prévues', value: `+${entrees}K DH`, color: T.success },
                { label: 'Sorties Prévues', value: `-${sorties}K DH`, color: T.danger },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* 1.2 AR Aging */}
          <Card style={{ animationDelay: '80ms' }} className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textPri, marginBottom: 2 }}>Accounts Receivable</div>
                <div style={{ fontSize: 11, color: T.textDim }}>Vieillissement des créances</div>
              </div>
              <Badge label="Bon état" color={T.success} bg={`${T.success}20`} />
            </div>

            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arAgingData} layout="vertical" barSize={18} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} />
                  <YAxis type="category" dataKey="label" tick={{ fill: T.textSec, fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={(p) => <GoldTooltip {...p} unit=" DH" />} cursor={{ fill: 'rgba(255,215,0,0.04)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={1000} animationEasing="ease-out">
                    {arAgingData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.cardBorder}` }}>
              <div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 22, color: T.gold }}>{totalAR}K</span>
                <span style={{ fontSize: 11, color: T.textDim, marginLeft: 4 }}>DH total</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {arAgingData.map((d, i) => (
                  <span key={i} style={{ padding: '2px 8px', borderRadius: 999, background: `${d.fill}20`, color: d.fill, fontSize: 9, fontWeight: 700, border: `1px solid ${d.fill}30` }}>
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Row 2: Stock + Pipeline + Trends */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* 1.3 Stock Levels */}
          <Card style={{ animationDelay: '160ms' }} className="tbos-card-enter">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Niveaux de Stock</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stockData.map((s, i) => {
                const pct = (s.current / s.max) * 100;
                const color = getStockColor(s.current, s.max);
                return (
                  <div key={i} style={{ opacity: 0, animation: `tbos-fade-up 600ms ease-out ${200 + i * 80}ms forwards` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: T.textSec }}>{s.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textPri }}>
                        {s.current.toLocaleString('fr-FR')} / {s.max.toLocaleString('fr-FR')} {s.unit}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div
                        className="tbos-bar-animate"
                        style={{
                          height: '100%', width: `${pct}%`, borderRadius: 999,
                          background: color, boxShadow: `0 0 8px ${color}60`,
                          animationDelay: `${300 + i * 80}ms`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 1.4 Sales Pipeline Funnel */}
          <Card style={{ animationDelay: '240ms' }} className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Pipeline Commercial</div>
              <Badge label="0% conv." color={T.danger} bg={`${T.danger}15`} />
            </div>

            {/* Funnel bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Devis', value: 0, color: T.warning, width: '100%', delay: 400 },
                { label: 'BCs Actifs', value: 0, color: T.info, width: '65%', delay: 550 },
                { label: 'En attente', value: '0K DH', color: T.success, width: '35%', delay: 700 },
              ].map((item, i) => (
                <div key={i} style={{ opacity: 0, animation: `tbos-fade-up 600ms ease-out ${item.delay}ms forwards` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: T.textSec }}>{item.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: item.color }}>{item.value}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div
                      className="tbos-bar-animate"
                      style={{
                        height: '100%', width: item.width, borderRadius: 999,
                        background: item.color, boxShadow: `0 0 8px ${item.color}60`,
                        animationDelay: `${item.delay}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Big conversion rate */}
            <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.cardBorder}` }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 36, fontWeight: 800, color: T.danger, lineHeight: 1 }}>0%</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>Taux de conversion</div>
            </div>
          </Card>

          {/* 1.5 Trends */}
          <Card style={{ animationDelay: '320ms' }} className="tbos-card-enter">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tendances</div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 42, fontWeight: 800, color: T.textDim, lineHeight: 1 }}>+0.0%</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>vs Janvier</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'CA', value: '0K', color: T.textDim },
                { label: 'Marge', value: '0%', color: T.textDim },
                { label: 'Volume', value: `${prodTotal} m³`, color: T.success, icon: <TrendingUp size={12} color={T.success} /> },
              ].map((m, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.cardBorder}`,
                  borderRadius: 8, padding: '8px', textAlign: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    {m.icon}
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: m.color }}>{m.value}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 2 — PRODUCTION & QUALITÉ
        ══════════════════════════════════════════ */}
        <SectionHeader icon={Factory} label="Production & Qualité" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* 2.1 Daily Production */}
          <Card style={{ animationDelay: '0ms' }} className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Production Journalière</div>
                  <Badge label="Peak 14h" color={T.warning} bg={`${T.warning}20`} />
                </div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>Volumes par heure</div>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 20, color: T.gold }}>851 m³</span>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyProductionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="prodGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.gold} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={T.gold} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="hour" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={(p) => <GoldTooltip {...p} unit=" m³" />} />
                  <ReferenceLine x="14h" stroke={`${T.gold}50`} strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="volume" stroke={T.gold} strokeWidth={2.5} fill="url(#prodGold)"
                    dot={{ r: 3, fill: T.gold, stroke: '#111B2E', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: T.gold, stroke: '#111B2E', strokeWidth: 2 }}
                    animationDuration={1200} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 2.2 Quality Feed */}
          <Card style={{ animationDelay: '80ms' }} className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Qualité Hebdomadaire</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge label="0 OK" color={T.success} bg={`${T.success}20`} />
                <Badge label="0 Var" color={T.warning} bg={`${T.warning}20`} />
                <Badge label="0 Crit" color={T.danger} bg={`${T.danger}20`} />
              </div>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={(p) => <GoldTooltip {...p} />} />
                  <Bar dataKey="ok" stackId="a" fill={T.success} radius={[0, 0, 0, 0]} animationDuration={1000} name="OK" />
                  <Bar dataKey="var" stackId="a" fill={T.warning} animationDuration={1000} name="Variances" />
                  <Bar dataKey="crit" stackId="a" fill={T.danger} radius={[4, 4, 0, 0]} animationDuration={1000} name="Critique" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 2.3 Live Batches */}
        <Card style={{ marginBottom: 24 }} className="tbos-card-enter">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <div style={{ fontSize: 13, fontWeight: 700 }}>Derniers Batches</div>
            <Badge label="Live" color={T.success} bg={`${T.success}15`} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {batches.map((b, i) => (
              <div
                key={i}
                style={{
                  opacity: 0,
                  animation: `tbos-fade-up 600ms ease-out ${i * 80}ms forwards`,
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${T.cardBorder}`,
                  borderLeft: `3px solid ${b.status === 'complete' ? T.success : T.warning}`,
                  borderRadius: 10, padding: 12,
                }}
              >
                <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>{b.id}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: T.gold, marginBottom: 6 }}>
                  {b.volume} m³
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    padding: '2px 7px', borderRadius: 999, fontSize: 9, fontWeight: 700,
                    background: b.quality === 'OK' ? `${T.success}20` : `${T.warning}20`,
                    color: b.quality === 'OK' ? T.success : T.warning,
                    border: `1px solid ${b.quality === 'OK' ? T.success : T.warning}30`,
                  }}>{b.quality}</span>
                  <span style={{ fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono, monospace' }}>{b.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ══════════════════════════════════════════
            SECTION 3 — FINANCE & TRÉSORERIE
        ══════════════════════════════════════════ */}
        <SectionHeader icon={Banknote} label="Finance & Trésorerie" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 24 }}>

          {/* 3.1 Treasury Gauge */}
          <Card className="tbos-card-enter">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Budget Mensuel</div>
            {/* SVG Semi-circle gauge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <svg width={180} height={100} viewBox="0 0 180 100">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={T.success} />
                    <stop offset="60%" stopColor={T.warning} />
                    <stop offset="100%" stopColor={T.danger} />
                  </linearGradient>
                </defs>
                {/* Track */}
                <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} strokeLinecap="round" />
                {/* Fill (0%) */}
                <path d="M 10 90 A 80 80 0 0 1 10 90" fill="none" stroke="url(#gaugeGrad)" strokeWidth={14} strokeLinecap="round" />
                {/* Center text */}
                <text x="90" y="78" textAnchor="middle" fill={T.success} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800 }}>0%</text>
                <text x="90" y="94" textAnchor="middle" fill={T.textDim} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10 }}>Utilisé</text>
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Plafond', value: '15,000', color: T.textPri },
                { label: 'Utilisé', value: '0', color: T.success },
                { label: 'Restant', value: '15,000', color: T.gold },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 9, color: T.textDim, marginTop: 2 }}>{item.label} MAD</div>
                </div>
              ))}
            </div>
          </Card>

          {/* 3.2 Tax & Social Compliance */}
          <Card className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Conformité Fiscale & Sociale</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge label="2 en retard" color={T.danger} bg={`${T.danger}20`} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: T.danger }}>0%</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {complianceData.map((item, i) => {
                const statusConfig = {
                  overdue: { color: T.danger, label: 'En retard', bg: `${T.danger}10`, border: T.danger },
                  upcoming: { color: T.warning, label: 'À venir', bg: `${T.warning}10`, border: T.warning },
                  ok: { color: T.success, label: 'OK', bg: `${T.success}10`, border: T.success },
                }[item.status] || { color: T.textSec, label: item.status, bg: 'transparent', border: T.cardBorder };

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 8,
                      background: statusConfig.bg,
                      border: `1px solid ${statusConfig.border}30`,
                      borderLeft: `3px solid ${statusConfig.color}`,
                      opacity: 0,
                      animation: `tbos-fade-up 600ms ease-out ${i * 80}ms forwards`,
                      transition: 'all 200ms',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
                      (e.currentTarget as HTMLElement).style.background = `${statusConfig.color}15`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                      (e.currentTarget as HTMLElement).style.background = statusConfig.bg;
                    }}
                  >
                    <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.textPri }}>{item.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.textPri }}>
                      {item.amount.toLocaleString('fr-FR')} MAD
                    </div>
                    <div style={{ fontSize: 11, color: T.textDim, width: 60, textAlign: 'right' }}>{item.due}</div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                      background: `${statusConfig.color}20`, color: statusConfig.color,
                      border: `1px solid ${statusConfig.color}30`, minWidth: 70, textAlign: 'center',
                      animation: 'tbos-pulse 2.5s infinite',
                    }}>{statusConfig.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 4 — PHOTOS (Empty State)
        ══════════════════════════════════════════ */}
        <Card style={{ marginBottom: 24, textAlign: 'center', padding: 40 }} className="tbos-card-enter">
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.cardBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={24} color={T.textDim} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Aucune photo aujourd'hui</div>
          <div style={{ fontSize: 12, color: T.textDim, maxWidth: 280, margin: '0 auto', lineHeight: 1.6 }}>
            Les photos apparaîtront ici lorsque des batches seront saisis dans le système
          </div>
        </Card>

        {/* ══════════════════════════════════════════
            SECTION 5 — MODULES
        ══════════════════════════════════════════ */}
        <SectionHeader icon={Settings} label="Modules" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
          {modules.map((m, i) => (
            <ModuleCard key={i} module={m} delay={i * 80} />
          ))}
        </div>

        {/* ══════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════ */}
        <Footer />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MODULE CARD
// ─────────────────────────────────────────────────────
function ModuleCard({ module: m, delay }: { module: typeof modules[0]; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: T.cardBg,
        border: `1px solid ${hovered ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14, padding: 18,
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transform: pressed ? 'translateY(-1px) scale(0.995)' : hovered ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.25), 0 0 20px ${T.goldGlow}` : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 0,
        animation: `tbos-fade-up 600ms ease-out ${delay}ms forwards`,
      }}
    >
      {/* Left gold bar on hover */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: T.gold, opacity: hovered ? 1 : 0, transition: 'opacity 200ms',
        borderRadius: '14px 0 0 14px',
      }} />
      {/* Top gold line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 200ms',
      }} />

      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${m.color}15`, border: `1px solid ${m.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <m.icon size={20} color={m.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.textPri, marginBottom: 2 }}>{m.title}</div>
        <div style={{ fontSize: 11, color: T.textDim }}>{m.desc}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: m.color, marginTop: 4 }}>{m.count}</div>
      </div>

      <ChevronRight
        size={16}
        color={T.textDim}
        style={{ transform: hovered ? 'translateX(4px)' : 'none', transition: 'transform 200ms', flexShrink: 0 }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────
function Footer() {
  const [dt, setDt] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setDt(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.04)',
      paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ fontSize: 11, color: T.textDim }}>
        TBOS Dashboard v2.0 — Dernière mise à jour: {dt.toLocaleString('fr-FR')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'tbos-pulse 2.5s infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>Système opérationnel</span>
      </div>
    </div>
  );
}
