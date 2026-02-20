import { useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Sector,
} from 'recharts';
import {
  FileText, Banknote, AlertTriangle, RefreshCw,
  CheckCircle, Star, Phone, Plus, Calendar,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#FFD700',
  goldGlow:   'rgba(255,215,0,0.22)',
  goldBorder: 'rgba(255,215,0,0.28)',
  navy:       '#0B1120',
  cardBg:     'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#3B82F6',
  purple:     '#8B5CF6',
  pink:       '#EC4899',
  cyan:       '#06B6D4',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

// ─────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = eased * target;
      setValue(decimals > 0 ? Math.round(v * 10) / 10 : Math.round(v));
      if (p < 1) rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);
  return value;
}

function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

function useBarWidth(target: number, delay = 0) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(target), delay + 300);
    return () => clearTimeout(t);
  }, [target, delay]);
  return w;
}

// ─────────────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────────────
function Card({ children, style = {}, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        background: T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden',
        transform: press ? 'translateY(-1px) scale(0.997)' : hov ? 'translateY(-4px) scale(1.005)' : 'none',
        boxShadow: hov ? `0 14px 36px rgba(0,0,0,0.32), 0 0 28px ${T.goldGlow}` : '0 4px 14px rgba(0,0,0,0.15)',
        transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
        opacity: hov ? 1 : 0, transition: 'opacity 220ms',
      }} />
      {children}
    </div>
  );
}

function Bdg({ label, color, bg, pulse = false, icon }: {
  label: string; color: string; bg: string; pulse?: boolean; icon?: React.ReactNode;
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      animation: pulse ? 'tbos-pulse 2s infinite' : 'none', flexShrink: 0,
    }}>
      {icon || <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function SectionHeader({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
      {right}
    </div>
  );
}

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 6, fontSize: 12 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill || T.gold, fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{Number(p.value).toLocaleString('fr-MA')} K DH</strong>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const VALUE_DATA = [
  { client: 'Ciments du Maroc', value: 850, color: T.gold },
  { client: 'ONCF',             value: 620, color: T.info },
  { client: 'Addoha',           value: 480, color: T.success },
  { client: 'Alliances',        value: 350, color: T.purple },
  { client: 'Tgcc',             value: 280, color: T.warning },
  { client: 'Jet Contractors',  value: 200, color: T.pink },
  { client: 'Palmeraie',        value: 150, color: T.cyan },
  { client: 'Résidences',       value: 120, color: T.textSec },
];

const DONUT_DATA = [
  { status: 'Actif',         count: 8, color: T.success },
  { status: 'Nouveau',       count: 1, color: T.info },
  { status: 'Expire Bientôt', count: 3, color: T.warning },
  { status: 'Consommé >80%', count: 2, color: T.danger },
];

const CONTRACTS = [
  { client: 'Ciments du Maroc', ref: 'CTR-2024-001', valeur: 850, debut: '01 Jan', fin: '31 Déc',  pct: 35, consomme: 298, status: 'Actif',   color: T.success },
  { client: 'ONCF',             ref: 'CTR-2024-002', valeur: 620, debut: '01 Jan', fin: '30 Jun',  pct: 52, consomme: 322, status: 'Actif',   color: T.success },
  { client: 'Addoha',           ref: 'CTR-2024-003', valeur: 480, debut: '15 Jan', fin: '31 Déc',  pct: 28, consomme: 134, status: 'Actif',   color: T.success },
  { client: 'Alliances',        ref: 'CTR-2024-004', valeur: 350, debut: '01 Fév', fin: '31 Jul',  pct: 15, consomme: 53,  status: 'Actif',   color: T.success },
  { client: 'Tgcc',             ref: 'CTR-2024-005', valeur: 280, debut: '01 Mar', fin: '31 Août', pct: 0,  consomme: 0,   status: 'Nouveau', color: T.info },
  { client: 'Jet Contractors',  ref: 'CTR-2023-012', valeur: 200, debut: '01 Jul', fin: '28 Fév',  pct: 95, consomme: 190, status: 'Expire',  color: T.warning },
  { client: 'Palmeraie',        ref: 'CTR-2023-010', valeur: 150, debut: '01 Sep', fin: '15 Mars', pct: 88, consomme: 132, status: 'Expire',  color: T.warning },
  { client: 'Résidences',       ref: 'CTR-2023-008', valeur: 120, debut: '01 Oct', fin: '31 Mars', pct: 72, consomme: 86,  status: 'Expire',  color: T.warning },
];

const TIMELINE_DATA = [
  { client: 'Ciments du Maroc', elapsed: 4, remaining: 8 },
  { client: 'ONCF',             elapsed: 4, remaining: 2 },
  { client: 'Addoha',           elapsed: 3, remaining: 9 },
  { client: 'Alliances',        elapsed: 1, remaining: 5 },
  { client: 'Tgcc',             elapsed: 0, remaining: 6 },
  { client: 'Jet Contractors',  elapsed: 7, remaining: 0 },
  { client: 'Palmeraie',        elapsed: 5, remaining: 1 },
  { client: 'Résidences',       elapsed: 4, remaining: 1 },
];

const RENEWALS = [
  { client: 'Jet Contractors', ref: 'CTR-2023-012', expire: '28 Fév',  restant: 10,  pct: 95, urgency: 'Critique',   urgColor: T.danger  },
  { client: 'Palmeraie',       ref: 'CTR-2023-010', expire: '15 Mars', restant: 18,  pct: 88, urgency: 'Urgent',     urgColor: T.warning },
  { client: 'Résidences',      ref: 'CTR-2023-008', expire: '31 Mars', restant: 34,  pct: 72, urgency: 'À planifier', urgColor: T.info  },
];

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
function pctColor(pct: number) {
  if (pct >= 80) return T.danger;
  if (pct >= 50) return T.warning;
  return T.success;
}

// ─────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive = true, delay = 0, decimals = 0 }: {
  label: string; value: number; suffix?: string; color: string;
  icon: any; trend?: string; trendPositive?: boolean; delay?: number; decimals?: number;
}) {
  const animated = useAnimatedCounter(value, 1200, decimals);
  const visible = useFadeIn(delay);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
              {decimals > 0 ? animated.toFixed(1) : animated.toLocaleString('fr-MA')}
              {suffix && <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginLeft: 4 }}>{suffix}</span>}
            </p>
            {trend && (
              <p style={{ fontSize: 10, fontWeight: 600, marginTop: 6, color: trendPositive ? T.success : T.warning }}>
                {trendPositive ? '↑' : '→'} {trend}
              </p>
            )}
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
// CONTRACT CARD (consumption progress)
// ─────────────────────────────────────────────────────
function ContractCard({ c, delay = 0 }: { c: typeof CONTRACTS[0]; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const [pressRen, setPressRen] = useState(false);
  const barW = useBarWidth(c.pct, delay);
  const barColor = pctColor(c.pct);

  const StatusIcon = c.status === 'Actif' ? CheckCircle : c.status === 'Nouveau' ? Star : AlertTriangle;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressRen(false); }}
      style={{
        background: T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderLeft: `4px solid ${c.color}`,
        borderRadius: 14, padding: 18,
        position: 'relative', overflow: 'hidden',
        transform: visible ? (hov ? 'translateY(-3px)' : 'translateY(0)') : 'translateY(20px)',
        opacity: visible ? 1 : 0,
        boxShadow: hov ? `0 12px 32px rgba(0,0,0,0.28), 0 0 24px ${T.goldGlow}` : '0 4px 12px rgba(0,0,0,0.12)',
        transition: 'all 280ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 220ms' }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri }}>{c.client}</p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim }}>{c.ref}</p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ height: 8, borderRadius: 99, background: T.cardBorder, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barW}%`, borderRadius: 99, background: barColor, transition: 'width 1000ms cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${barColor}60` }} />
        </div>
      </div>

      {/* Below bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textSec }}>
          Consommé: <span style={{ color: barColor, fontWeight: 700 }}>{c.consomme}K</span> / {c.valeur}K DH
        </p>
        <Bdg label={`${c.pct}%`} color={barColor} bg={`${barColor}15`} />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 11, color: T.textDim }}>
          <Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />{c.debut} — {c.fin} 2024
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 999,
            background: `${c.color}15`, border: `1px solid ${c.color}40`, color: c.color,
            fontSize: 10, fontWeight: 700, animation: c.status === 'Expire' ? 'tbos-pulse 2s infinite' : 'none',
          }}>
            <StatusIcon size={10} /> {c.status}
          </span>
          {c.status === 'Expire' && (
            <button
              onMouseDown={() => setPressRen(true)}
              onMouseUp={() => setPressRen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 7,
                background: pressRen ? '#FFE033' : T.gold, color: T.navy,
                border: 'none', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                transition: 'all 150ms', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              <RefreshCw size={9} /> Renouveler
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// RENEWAL CARD
// ─────────────────────────────────────────────────────
function RenewalCard({ r, delay = 0 }: { r: typeof RENEWALS[0]; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hovRen, setHovRen] = useState(false);
  const [hovContact, setHovContact] = useState(false);
  const barW = useBarWidth(r.pct, delay);
  const barColor = pctColor(r.pct);

  return (
    <div style={{
      background: `${r.urgColor}06`,
      border: `1px solid ${r.urgColor}40`,
      borderLeft: `4px solid ${r.urgColor}`,
      borderRadius: 14, padding: 20,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 480ms ease-out',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: T.textPri, marginBottom: 2 }}>{r.client}</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim }}>{r.ref}</p>
        </div>
        <Bdg label={r.urgency} color={r.urgColor} bg={`${r.urgColor}15`} pulse={r.urgency !== 'À planifier'} />
      </div>

      {/* Expire + valeur */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: r.urgColor }}>Expire: {r.expire}</p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 800, color: T.gold }}>{r.restant}K DH restant</p>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ height: 7, borderRadius: 99, background: T.cardBorder, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barW}%`, borderRadius: 99, background: barColor, transition: 'width 1000ms cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${barColor}60` }} />
        </div>
        <p style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>Consommé: {r.pct}%</p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onMouseEnter={() => setHovRen(true)} onMouseLeave={() => setHovRen(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
            background: hovRen ? '#FFE033' : T.gold, color: T.navy,
            border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            transition: 'all 180ms', transform: hovRen ? 'scale(1.03)' : 'scale(1)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <RefreshCw size={12} /> Renouveler
        </button>
        <button
          onMouseEnter={() => setHovContact(true)} onMouseLeave={() => setHovContact(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
            background: hovContact ? `${T.gold}20` : 'transparent',
            border: `1px solid ${T.goldBorder}`, color: T.gold,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 180ms',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <Phone size={12} /> Contacter Client
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// CUSTOM BAR WITH INDIVIDUAL COLOR (value chart)
// ─────────────────────────────────────────────────────
function ValueTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const total = VALUE_DATA.reduce((s, v) => s + v.value, 0);
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: T.gold, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{d.client}</p>
      <p style={{ color: T.textPri, fontSize: 12 }}>{d.value}K DH</p>
      <p style={{ color: T.textSec, fontSize: 11 }}>{((d.value / total) * 100).toFixed(1)}% du total</p>
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const total = DONUT_DATA.reduce((s, v) => s + v.count, 0);
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: d.color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{d.status}</p>
      <p style={{ color: T.textPri, fontSize: 12 }}>{d.count} contrats</p>
      <p style={{ color: T.textSec, fontSize: 11 }}>{((d.count / total) * 100).toFixed(0)}%</p>
    </div>
  );
}

function TimelineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: T.gold, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill, fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{p.value} mois</strong>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassContracts() {
  const [activeTab, setActiveTab] = useState('Tous');
  const [activeDonut, setActiveDonut] = useState<number | null>(null);
  const [hoverNew, setHoverNew] = useState(false);

  const tabs = ['Tous', 'Actifs', 'Expirent Bientôt', 'Expirés'];

  const chartCardStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
    border: `1px solid ${T.cardBorder}`,
    borderRadius: 14, padding: 24,
    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 6}
          startAngle={startAngle} endAngle={endAngle} fill={fill} />
      </g>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: T.navy, fontFamily: 'DM Sans, sans-serif', color: T.textPri, padding: '0 0 60px 0' }}>
      <style>{`
        @keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* ══════════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: `linear-gradient(180deg, ${T.navy} 80%, transparent)`,
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`,
        padding: '20px 32px 0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <FileText size={22} color={T.gold} />
              <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 26, color: T.textPri, margin: 0 }}>Contrats</h1>
            </div>
            <p style={{ color: T.textDim, fontSize: 13, margin: 0 }}>Gestion des contrats clients</p>
          </div>
          <button
            onMouseEnter={() => setHoverNew(true)}
            onMouseLeave={() => setHoverNew(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
              background: hoverNew ? '#FFE033' : T.gold, color: T.navy,
              border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13,
              cursor: 'pointer', transition: 'all 180ms', fontFamily: 'DM Sans, sans-serif',
              transform: hoverNew ? 'scale(1.03)' : 'scale(1)',
              boxShadow: hoverNew ? `0 6px 20px ${T.goldGlow}` : 'none',
            }}
          >
            <Plus size={15} /> Nouveau Contrat
          </button>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(tab => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 20px', background: 'transparent', border: 'none',
                borderBottom: active ? `2px solid ${T.gold}` : '2px solid transparent',
                color: active ? T.gold : T.textDim,
                fontWeight: active ? 700 : 400, fontSize: 13, cursor: 'pointer',
                transition: 'all 200ms', fontFamily: 'DM Sans, sans-serif',
              }}>
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* PAGE BODY */}
      <div style={{ padding: '32px 32px 0', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ══════════════════════════════════════════════
            SECTION 1 — KPIs
        ══════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon={FileText} label="Indicateurs Clés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            <KPICard label="Contrats Actifs"       value={14}  color={T.gold}    icon={FileText}     trend="+2 ce trimestre"  trendPositive delay={0}   />
            <KPICard label="Valeur Totale"         value={3.2} suffix="M DH"     color={T.gold}    icon={Banknote}     trend="+18% vs an dernier" trendPositive delay={80}  decimals={1} />
            <KPICard label="Expirent Bientôt"      value={3}   color={T.warning} icon={AlertTriangle} trend="dans 30 jours"  trendPositive={false} delay={160} />
            <KPICard label="Renouvellements"       value={2}   color={T.info}    icon={RefreshCw}   trend="ce mois"       trendPositive={false} delay={240} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 2+3 — VALUE CHART + DONUT
        ══════════════════════════════════════════════ */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 20 }}>

            {/* Value BarChart */}
            <div style={chartCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>Valeur par Contrat</p>
                  <p style={{ color: T.textDim, fontSize: 11 }}>Classé par valeur</p>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 800, color: T.gold }}>3.05M DH</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={VALUE_DATA} layout="vertical" margin={{ top: 2, right: 60, left: 10, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false}
                    tick={{ fill: T.textDim, fontSize: 10 }}
                    tickFormatter={(v: number) => `${v}K`} domain={[0, 950]} />
                  <YAxis type="category" dataKey="client" axisLine={false} tickLine={false}
                    tick={{ fill: T.textSec, fontSize: 11 }} width={110} />
                  <RechartsTooltip content={<ValueTooltip />} cursor={{ fill: `${T.gold}08` }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1000}
                    label={{ position: 'right', formatter: (v: number) => `${v}K`, style: { fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: T.textSec } }}>
                    {VALUE_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Donut */}
            <div style={chartCardStyle}>
              <SectionHeader icon={FileText} label="Statut des Contrats" />

              {/* Donut */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width={200} height={180}>
                  <PieChart>
                    <Pie
                      data={DONUT_DATA} cx={95} cy={85}
                      innerRadius={55} outerRadius={82}
                      dataKey="count" nameKey="status"
                      startAngle={90} endAngle={-270}
                      isAnimationActive animationDuration={800}
                      activeIndex={activeDonut ?? undefined}
                      activeShape={renderActiveShape}
                      onMouseEnter={(_, i) => setActiveDonut(i)}
                      onMouseLeave={() => setActiveDonut(null)}
                    >
                      {DONUT_DATA.map((d, i) => (
                        <Cell key={i} fill={d.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -55%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 800, color: T.gold, lineHeight: 1 }}>14</p>
                  <p style={{ fontSize: 10, color: T.textDim }}>contrats</p>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {DONUT_DATA.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: T.textSec }}>{d.status}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: d.color }}>{d.count}</span>
                  </div>
                ))}
              </div>

              {/* Alert callouts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                <div style={{ padding: '8px 12px', borderRadius: 8, background: `${T.warning}10`, border: `1px solid ${T.warning}30`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={12} color={T.warning} />
                  <span style={{ fontSize: 11, color: T.warning, fontWeight: 600, flex: 1 }}>3 contrats expirent dans les 30 prochains jours</span>
                  <Bdg label="Urgent" color={T.warning} bg={`${T.warning}15`} pulse />
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 8, background: `${T.danger}10`, border: `1px solid ${T.danger}30`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={12} color={T.danger} />
                  <span style={{ fontSize: 11, color: T.danger, fontWeight: 600 }}>2 contrats consommés à plus de 80%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 4 — CONTRACT CONSUMPTION BARS
        ══════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon={FileText} label="Consommation des Contrats" right={
            <span style={{ color: T.textDim, fontSize: 11 }}>Progression vs valeur totale</span>
          } />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {CONTRACTS.map((c, i) => (
              <ContractCard key={i} c={c} delay={i * 80} />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 5 — TIMELINE
        ══════════════════════════════════════════════ */}
        <section>
          <div style={chartCardStyle}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Calendar size={16} color={T.gold} />
                <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px' }}>Timeline des Contrats</span>
              </div>
              <p style={{ color: T.textDim, fontSize: 11, marginLeft: 26 }}>2023–2024 · Durée en mois</p>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 12, marginLeft: 26 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 8, borderRadius: 4, background: T.gold }} />
                <span style={{ fontSize: 11, color: T.textSec }}>Période écoulée</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 8, borderRadius: 4, background: `${T.textSec}50` }} />
                <span style={{ fontSize: 11, color: T.textSec }}>Période restante</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={TIMELINE_DATA} layout="vertical" margin={{ top: 2, right: 10, left: 10, bottom: 2 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false}
                  tick={{ fill: T.textDim, fontSize: 10 }}
                  tickFormatter={(v: number) => `${v}m`} domain={[0, 13]} />
                <YAxis type="category" dataKey="client" axisLine={false} tickLine={false}
                  tick={{ fill: T.textSec, fontSize: 11 }} width={120} />
                <RechartsTooltip content={<TimelineTooltip />} cursor={{ fill: `${T.gold}08` }} />
                <Bar dataKey="elapsed" name="Écoulé" stackId="a" fill={T.gold} radius={[0, 0, 0, 0]} isAnimationActive animationDuration={1000} />
                <Bar dataKey="remaining" name="Restant" stackId="a" fill={`${T.textSec}40`} radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 6 — RENEWAL QUEUE
        ══════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon={RefreshCw} label="Renouvellements à Traiter" right={
            <div style={{ display: 'flex', gap: 8 }}>
              <Bdg label="1 critique" color={T.danger}  bg={`${T.danger}15`}  pulse />
              <Bdg label="1 urgent"   color={T.warning} bg={`${T.warning}15`} pulse />
            </div>
          } />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {RENEWALS.map((r, i) => (
              <RenewalCard key={i} r={r} delay={i * 100} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
