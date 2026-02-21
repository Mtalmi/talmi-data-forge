import { useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Sector,
} from 'recharts';
import {
  CreditCard, Banknote, Clock, TrendingDown,
  CheckCircle, XCircle, AlertTriangle, Zap,
  Truck, Wrench, Users, Package, Box,
  TrendingUp, Plus, LayoutGrid,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS (match WorldClassPayments)
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
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

// ─────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
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
    const t = setTimeout(() => setW(target), delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return w;
}

// ─────────────────────────────────────────────────────
// SHARED UI
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
        background: T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
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
      animation: pulse ? 'tbos-pulse 2s infinite' : 'none',
      flexShrink: 0,
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
      {payload.length === 2 && (
        <p style={{ color: T.textSec, fontSize: 11, marginTop: 6, borderTop: `1px solid ${T.cardBorder}`, paddingTop: 6 }}>
          Écart: <strong style={{ color: T.warning }}>{Math.abs(payload[1].value - payload[0].value)}K DH</strong>
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Matières Premières', amount: 98,  color: T.gold,    pct: 53, icon: Package  },
  { name: "Main d'Oeuvre",      amount: 45,  color: T.info,    pct: 24, icon: Users    },
  { name: 'Transport',          amount: 22,  color: T.success, pct: 12, icon: Truck    },
  { name: 'Maintenance',        amount: 12,  color: T.purple,  pct: 6,  icon: Wrench   },
  { name: 'Énergie',            amount: 6,   color: T.warning, pct: 3,  icon: Zap      },
  { name: 'Autres',             amount: 3,   color: T.textSec, pct: 2,  icon: Box      },
];

const BUDGET_DATA = [
  { month: 'Sep', depenses: 165, budget: 200 },
  { month: 'Oct', depenses: 178, budget: 200 },
  { month: 'Nov', depenses: 195, budget: 220 },
  { month: 'Déc', depenses: 210, budget: 220 },
  { month: 'Jan', depenses: 188, budget: 250 },
  { month: 'Fév', depenses: 186, budget: 250 },
];

const CAT_BUDGET = [
  { name: 'Matières Premières', spent: 98,  budget: 120, pct: 82, color: T.gold,    icon: Package },
  { name: "Main d'Oeuvre",      spent: 45,  budget: 55,  pct: 82, color: T.info,    icon: Users   },
  { name: 'Transport',          spent: 22,  budget: 30,  pct: 73, color: T.success, icon: Truck   },
  { name: 'Maintenance',        spent: 12,  budget: 20,  pct: 60, color: T.purple,  icon: Wrench  },
  { name: 'Énergie',            spent: 6,   budget: 15,  pct: 40, color: T.warning, icon: Zap     },
  { name: 'Autres',             spent: 3,   budget: 10,  pct: 30, color: T.textSec, icon: Box     },
];

const RECENT_EXPENSES = [
  { date: '20 Fév', desc: 'Ciment CPA 55 - 10T',   cat: 'Matières Premières', amount: 45000, approver: 'Auto',      catColor: T.gold,    status: 'Approuvé' },
  { date: '19 Fév', desc: 'Salaires Février',        cat: "Main d'Oeuvre",     amount: 38000, approver: 'Directeur', catColor: T.info,    status: 'Approuvé' },
  { date: '18 Fév', desc: 'Gasoil flotte',           cat: 'Transport',          amount: 8500,  approver: 'Auto',      catColor: T.success, status: 'Approuvé' },
  { date: '18 Fév', desc: 'Pièces malaxeur',         cat: 'Maintenance',        amount: 6200,  approver: '—',         catColor: T.purple,  status: 'En attente' },
  { date: '17 Fév', desc: 'Électricité',             cat: 'Énergie',            amount: 4800,  approver: 'Auto',      catColor: T.warning, status: 'Approuvé' },
  { date: '15 Fév', desc: 'Adjuvant 200L',           cat: 'Matières Premières', amount: 12000, approver: '—',         catColor: T.gold,    status: 'En attente' },
];

const PENDING = [
  { desc: 'Pièces malaxeur',  cat: 'Maintenance',        catColor: T.purple, amount: 6200,  by: 'Youssef M.', date: '18 Fév', urgency: 'Normal' },
  { desc: 'Adjuvant 200L',    cat: 'Matières Premières', catColor: T.gold,   amount: 12000, by: 'Karim B.',   date: '15 Fév', urgency: 'Urgent' },
];

// ─────────────────────────────────────────────────────
// GAUGE
// ─────────────────────────────────────────────────────
function BudgetGauge({ value = 74 }: { value?: number }) {
  const r = 72; const cx = 110; const cy = 100;
  const startAngle = 210; const sweep = 120;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const bgStart = toRad(startAngle); const bgEnd = toRad(startAngle + sweep);
  const bgPath = `M ${cx + r * Math.cos(bgStart)},${cy + r * Math.sin(bgStart)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(bgEnd)},${cy + r * Math.sin(bgEnd)}`;
  const filled = (value / 100) * sweep;
  const fEnd = toRad(startAngle + filled);
  const fPath = `M ${cx + r * Math.cos(bgStart)},${cy + r * Math.sin(bgStart)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(fEnd)},${cy + r * Math.sin(fEnd)}`;
  const needleAngle = toRad(startAngle + filled);
  const nx = cx + r * Math.cos(needleAngle);
  const ny = cy + r * Math.sin(needleAngle);
  return (
    <svg width={220} height={140} viewBox="0 0 220 140">
      <defs>
        <linearGradient id="expGaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={T.warning} />
          <stop offset="100%" stopColor={T.gold} />
        </linearGradient>
      </defs>
      <path d={bgPath} fill="none" stroke="#1E2D4A" strokeWidth={14} strokeLinecap="round" />
      <path d={fPath} fill="none" stroke="url(#expGaugeGrad)" strokeWidth={14} strokeLinecap="round" />
      <circle cx={nx} cy={ny} r={7} fill={T.gold} />
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, fill: T.gold }}>{value}%</text>
      <text x={cx} y={cy + 18} textAnchor="middle"
        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, fill: T.textDim }}>Utilisation Budget</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive = true, delay = 0 }: {
  label: string; value: number; suffix?: string; color: string;
  icon: any; trend?: string; trendPositive?: boolean; delay?: number;
}) {
  const animated = useAnimatedCounter(Math.abs(value), 1200);
  const visible = useFadeIn(delay);
  const isNegative = value < 0;
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
              {isNegative ? '-' : ''}{animated.toLocaleString('fr-MA')}
              {suffix && <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginLeft: 4 }}>{suffix}</span>}
            </p>
            {trend && (
              <p style={{ fontSize: 10, fontWeight: 600, marginTop: 6, color: trendPositive ? T.success : T.danger }}>
                {trendPositive ? '↑' : '↓'} {trend}
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
// DONUT LEGEND ITEM
// ─────────────────────────────────────────────────────
function DonutLegendItem({ cat, active, onHover }: { cat: typeof CATEGORIES[0]; active: boolean; onHover: () => void; }) {
  return (
    <div
      onMouseEnter={onHover}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
        borderRadius: 8, cursor: 'pointer',
        background: active ? `${cat.color}12` : 'transparent',
        border: `1px solid ${active ? cat.color + '30' : 'transparent'}`,
        transition: 'all 180ms',
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 11, color: active ? T.textPri : T.textSec, fontWeight: active ? 700 : 400 }}>{cat.name}</span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: cat.color }}>{cat.amount}K</span>
      <span style={{ fontSize: 10, color: T.textDim }}>{cat.pct}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// CATEGORY PROGRESS BAR ROW
// ─────────────────────────────────────────────────────
function CatBar({ row, delay = 0 }: { row: typeof CAT_BUDGET[0]; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const w = useBarWidth(row.pct, delay + 100);
  const barColor = row.pct >= 80 ? T.danger : row.pct >= 60 ? T.warning : T.success;
  const Icon = row.icon;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '12px 16px', borderRadius: 10,
        background: hov ? `${T.cardBorder}50` : 'transparent',
        border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 380ms ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${row.color}18`, border: `1px solid ${row.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} color={row.color} />
        </div>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: T.textPri }}>{row.name}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textSec }}>{row.spent}K / {row.budget}K DH</span>
        <Bdg label={`${row.pct}%`} color={barColor} bg={`${barColor}15`} />
        {row.pct >= 80
          ? <Bdg label="Attention" color={T.warning} bg={`${T.warning}15`} pulse />
          : <Bdg label="OK" color={T.success} bg={`${T.success}15`} />}
      </div>
      <div style={{ height: 6, borderRadius: 99, background: `${T.cardBorder}`, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, borderRadius: 99, background: barColor, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// EXPENSE ROW
// ─────────────────────────────────────────────────────
function ExpenseRow({ e, delay = 0 }: { e: typeof RECENT_EXPENSES[0]; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const sc = e.status === 'Approuvé' ? T.success : T.warning;
  const StatusIcon = e.status === 'Approuvé' ? CheckCircle : Clock;
  const approverColor = e.approver === 'Auto' ? T.success : e.approver === '—' ? T.warning : T.info;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10,
        background: hov ? `${T.cardBorder}50` : 'transparent',
        border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
        transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(16px)',
        opacity: visible ? 1 : 0,
        transition: 'all 380ms ease-out',
        cursor: 'pointer', overflow: 'hidden', position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 4, borderRadius: 4, background: e.catColor }} />
      <div style={{ minWidth: 55, flexShrink: 0 }}>
        <p style={{ color: T.textDim, fontSize: 11 }}>{e.date}</p>
      </div>
      <div style={{ flex: 1, minWidth: 140 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{e.desc}</p>
      </div>
      <div style={{ minWidth: 120, flexShrink: 0 }}>
        <Bdg label={e.cat} color={e.catColor} bg={`${e.catColor}15`} />
      </div>
      <div style={{ minWidth: 110, flexShrink: 0 }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: T.gold }}>
          {e.amount.toLocaleString('fr-MA')} DH
        </p>
      </div>
      <div style={{ minWidth: 90, flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: approverColor, fontWeight: 600 }}>{e.approver}</p>
      </div>
      <div style={{ minWidth: 100, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999,
          background: `${sc}15`, border: `1px solid ${sc}40`, color: sc, fontSize: 10, fontWeight: 700,
          animation: e.status !== 'Approuvé' ? 'tbos-pulse 2.2s infinite' : 'none',
        }}>
          <StatusIcon size={10} />
          {e.status}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PENDING APPROVAL CARD
// ─────────────────────────────────────────────────────
function ApprovalCard({ p, delay = 0 }: { p: typeof PENDING[0]; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hovApp, setHovApp] = useState(false);
  const [hovRej, setHovRej] = useState(false);
  const urgColor = p.urgency === 'Urgent' ? T.danger : T.warning;
  return (
    <div style={{
      background: `rgba(245,158,11,0.04)`,
      border: `1px solid ${T.warning}50`,
      borderLeft: `4px solid ${T.warning}`,
      borderRadius: 14, padding: 20,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'all 480ms ease-out',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 4 }}>{p.desc}</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <Bdg label={p.cat} color={p.catColor} bg={`${p.catColor}15`} />
            <Bdg label={p.urgency} color={urgColor} bg={`${urgColor}15`} pulse={p.urgency === 'Urgent'} />
          </div>
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 800, color: T.gold }}>
          {p.amount.toLocaleString('fr-MA')} DH
        </p>
      </div>
      {/* Meta */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: T.textDim }}>Demandé par: <span style={{ color: T.textSec, fontWeight: 600 }}>{p.by}</span></p>
        <p style={{ fontSize: 11, color: T.textDim }}>{p.date}</p>
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onMouseEnter={() => setHovApp(true)}
          onMouseLeave={() => setHovApp(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
            background: hovApp ? '#059669' : T.success, border: 'none', color: '#fff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 180ms',
            transform: hovApp ? 'scale(1.03)' : 'scale(1)',
          }}
        >
          <CheckCircle size={13} /> Approuver
        </button>
        <button
          onMouseEnter={() => setHovRej(true)}
          onMouseLeave={() => setHovRej(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
            background: hovRej ? `${T.danger}20` : 'transparent',
            border: `1px solid ${T.danger}60`, color: T.danger,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 180ms',
          }}
        >
          <XCircle size={13} /> Rejeter
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassExpenses() {
  const [activeTab, setActiveTab] = useState('Vue d\'ensemble');
  const [activeDonut, setActiveDonut] = useState<number | null>(null);
  const [hoverNew, setHoverNew] = useState(false);

  const tabs = ["Vue d'ensemble", 'Par Catégorie', 'Approbations'];

  const chartCardStyle = {
    background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
    border: `1px solid ${T.cardBorder}`,
    borderRadius: 14, padding: 24,
    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
    transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
  };

  // Custom active donut shape
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
    <div style={{
      minHeight: '100vh', background: T.navy,
      fontFamily: 'DM Sans, sans-serif', color: T.textPri,
      padding: '0 0 60px 0',
    }}>
      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
      `}</style>

      {/* ══════════════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: `linear-gradient(180deg, ${T.navy} 80%, transparent)`,
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`,
        padding: '20px 32px 0',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <CreditCard size={22} color={T.gold} />
              <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 26, color: T.textPri, margin: 0 }}>Dépenses</h1>
            </div>
            <p style={{ color: T.textDim, fontSize: 13, margin: 0 }}>Suivi des dépenses et charges</p>
          </div>
          {/* Gold button */}
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
            <Plus size={15} /> Nouvelle Dépense
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(tab => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 20px', background: 'transparent', border: 'none',
                borderBottom: active ? `2px solid ${T.gold}` : '2px solid transparent',
                color: active ? T.gold : T.textDim, fontWeight: active ? 700 : 400,
                fontSize: 13, cursor: 'pointer', transition: 'all 200ms',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div style={{ padding: '32px 32px 0', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ══════════════════════════════════════════════════
            SECTION 1 — KPIs
        ══════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon={TrendingUp} label="Indicateurs Clés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard label="Dépenses ce mois" value={186}  suffix="K DH" color={T.gold}    icon={CreditCard}    trend="+4% vs mois préc."  trendPositive={false} delay={0}   />
            <KPICard label="Budget Restant"    value={64}   suffix="K DH" color={T.success} icon={Banknote}      delay={80}  />
            <KPICard label="En Attente Approbation" value={12} suffix="K DH" color={T.warning} icon={Clock} trend="2 demandes" trendPositive={false} delay={160} />
            <KPICard label="vs Budget"         value={-8}   suffix="%"    color={T.success} icon={TrendingDown}  trend="Sous budget ✓"    trendPositive={true}  delay={240} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            SECTION 2+3 — DONUT + BAR CHART
        ══════════════════════════════════════════════════ */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: 20 }}>

            {/* SECTION 2 — Donut chart */}
            <div style={chartCardStyle}>
              <SectionHeader icon={LayoutGrid} label="Par Catégorie" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {/* Donut */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={CATEGORIES}
                        cx={95} cy={95}
                        innerRadius={60} outerRadius={90}
                        dataKey="amount"
                        nameKey="name"
                        startAngle={90} endAngle={-270}
                        isAnimationActive animationDuration={800}
                        activeIndex={activeDonut ?? undefined}
                        activeShape={renderActiveShape}
                        onMouseEnter={(_, i) => setActiveDonut(i)}
                        onMouseLeave={() => setActiveDonut(null)}
                      >
                        {CATEGORIES.map((cat, i) => (
                          <Cell key={i} fill={cat.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '8px 12px' }}>
                              <p style={{ color: d.color, fontWeight: 700, fontSize: 12 }}>{d.name}</p>
                              <p style={{ color: T.textPri, fontSize: 12 }}>{d.amount}K DH · {d.pct}%</p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.gold, lineHeight: 1 }}>186K</p>
                    <p style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>DH</p>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {CATEGORIES.map((cat, i) => (
                    <DonutLegendItem key={i} cat={cat} active={activeDonut === i} onHover={() => setActiveDonut(i)} />
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 3 — Budget vs Actual */}
            <div style={chartCardStyle}>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>Budget vs Réel</p>
                <p style={{ color: T.textDim, fontSize: 11 }}>6 derniers mois</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={BUDGET_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }}
                    tickFormatter={(v: number) => `${v}K`} domain={[100, 280]} />
                  <RechartsTooltip content={<DarkTooltip />} cursor={{ fill: `${T.gold}08` }} />
                  <Bar dataKey="depenses" name="Dépenses" fill={T.gold} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000} />
                  <Bar dataKey="budget" name="Budget" fill="#1E2D4A" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000}
                    stroke="#94A3B8" strokeWidth={1} strokeDasharray="4 3" />
                </BarChart>
              </ResponsiveContainer>
              {/* Budget health bar */}
              <div style={{
                marginTop: 14, padding: '8px 14px', borderRadius: 8,
                background: `${T.success}12`, border: `1px solid ${T.success}30`,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle size={13} color={T.success} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.success }}>
                  Sous budget de 64K DH ce mois
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            SECTION 4 — GAUGE
        ══════════════════════════════════════════════════ */}
        <section>
          <div style={{ ...chartCardStyle, display: 'flex', alignItems: 'center', gap: 32, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            {/* Left metric */}
            <div style={{ textAlign: 'center', padding: '16px 28px', borderRadius: 12, background: `${T.cardBorder}60`, border: `1px solid ${T.cardBorder}` }}>
              <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Budget Total</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.textPri }}>250K DH</p>
            </div>

            {/* Gauge center */}
            <div style={{ textAlign: 'center' }}>
              <BudgetGauge value={74} />
              <p style={{ color: T.textDim, fontSize: 11, marginTop: 4 }}>Utilisation Budget Mensuel</p>
            </div>

            {/* Right metrics */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: '16px 28px', borderRadius: 12, background: `${T.gold}0A`, border: `1px solid ${T.goldBorder}` }}>
                <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Dépensé</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.gold }}>186K DH</p>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 28px', borderRadius: 12, background: `${T.success}0A`, border: `1px solid ${T.success}30` }}>
                <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Restant</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.success }}>64K DH</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            SECTION 5 — CATEGORY PROGRESS BARS
        ══════════════════════════════════════════════════ */}
        <section>
          <div style={chartCardStyle}>
            <SectionHeader icon={TrendingDown} label="Dépenses par Catégorie" right={
              <span style={{ color: T.textDim, fontSize: 11 }}>Dépensé vs Budget</span>
            } />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {CAT_BUDGET.map((row, i) => (
                <CatBar key={i} row={row} delay={i * 100} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            SECTION 6 — RECENT EXPENSES
        ══════════════════════════════════════════════════ */}
        <section>
          <div style={chartCardStyle}>
            <SectionHeader icon={CreditCard} label="Dépenses Récentes" right={
              <span style={{ color: T.textDim, fontSize: 11 }}>6 dernières opérations</span>
            } />
            {/* Column headers */}
            <div style={{ display: 'flex', gap: 14, padding: '4px 16px 8px', borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 8 }}>
              {['Date', 'Description', 'Catégorie', 'Montant', 'Approuvé par', 'Statut'].map((h, i) => (
                <p key={i} style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  flex: i === 1 ? 1 : undefined,
                  minWidth: i === 0 ? 55 : i === 2 ? 120 : i === 3 ? 110 : i === 4 ? 90 : i === 5 ? 100 : undefined,
                }}>
                  {h}
                </p>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {RECENT_EXPENSES.map((e, i) => (
                <ExpenseRow key={i} e={e} delay={i * 60} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            SECTION 7 — PENDING APPROVALS
        ══════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon={Clock} label="En Attente d'Approbation" right={
            <Bdg label="2 demandes" color={T.warning} bg={`${T.warning}15`} pulse />
          } />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {PENDING.map((p, i) => (
              <ApprovalCard key={i} p={p} delay={i * 100} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
