import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Cell,
} from 'recharts';
import {
  Banknote, Clock, AlertTriangle, TrendingUp,
  CheckCircle, ArrowRightLeft, FileText,
  Plus, Bell,
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
  dangerDark: '#DC2626',
  orange:     '#F97316',
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

// ─────────────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <div
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
        transform: press
          ? 'translateY(-1px) scale(0.997)'
          : hov ? 'translateY(-4px) scale(1.005)' : 'none',
        boxShadow: hov
          ? `0 14px 36px rgba(0,0,0,0.32), 0 0 28px ${T.goldGlow}`
          : '0 4px 14px rgba(0,0,0,0.15)',
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

function Badge({ label, color, bg, pulse = false }: {
  label: string; color: string; bg: string; pulse?: boolean;
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
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function SectionHeader({ icon: Icon, label, right }: {
  icon: any; label: string; right?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <span style={{
        color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
        fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '2px',
      }}>{label}</span>
      <div style={{
        flex: 1, height: 1,
        background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)`,
      }} />
      {right}
    </div>
  );
}

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1A2540', border: `1px solid ${T.goldBorder}`,
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
    }}>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 6, fontSize: 12 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.stroke || p.fill || T.gold, fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{Number(p.value).toLocaleString('fr-MA')} K DH</strong>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const TREND_DATA = [
  { month: 'Sep', encaisse: 245, facture: 280 },
  { month: 'Oct', encaisse: 268, facture: 310 },
  { month: 'Nov', encaisse: 290, facture: 295 },
  { month: 'Déc', encaisse: 310, facture: 340 },
  { month: 'Jan', encaisse: 285, facture: 320 },
  { month: 'Fév', encaisse: 312, facture: 350 },
];

const AGING_DATA = [
  { bracket: 'Courant',    amount: 312, color: T.success },
  { bracket: '1-30 jours', amount: 95,  color: T.warning },
  { bracket: '31-60 j',    amount: 32,  color: T.orange },
  { bracket: '61-90 j',    amount: 12,  color: T.danger },
  { bracket: '>90 jours',  amount: 6,   color: T.dangerDark },
];

const PAYMENTS = [
  { date: '20 Fév', client: 'Ciments du Maroc', amount: 85000, method: 'Virement', ref: 'FAC-2024-089', status: 'Reçu' },
  { date: '19 Fév', client: 'ONCF',             amount: 42000, method: 'Chèque',   ref: 'FAC-2024-085', status: 'Reçu' },
  { date: '18 Fév', client: 'Addoha',           amount: 65000, method: 'Virement', ref: 'FAC-2024-082', status: 'Reçu' },
  { date: '17 Fév', client: 'Tgcc',             amount: 38000, method: 'Virement', ref: 'FAC-2024-078', status: 'En attente' },
  { date: '15 Fév', client: 'Alliances',        amount: 28000, method: 'Chèque',   ref: 'FAC-2024-075', status: 'En attente' },
  { date: '12 Fév', client: 'Jet Contractors',  amount: 15000, method: 'Espèces',  ref: 'FAC-2024-070', status: 'Reçu' },
  { date: '10 Fév', client: 'Palmeraie',        amount: 22000, method: 'Virement', ref: 'FAC-2024-065', status: 'En retard' },
  { date: '05 Fév', client: 'Résidences Dar',   amount: 8500,  method: 'Chèque',   ref: 'FAC-2024-060', status: 'En retard' },
];

const METHODS = [
  { name: 'Virement',  amount: 210, count: 12, pct: 67, color: T.info,    icon: ArrowRightLeft },
  { name: 'Chèque',    amount: 78,  count: 8,  pct: 25, color: T.purple,  icon: FileText },
  { name: 'Espèces',   amount: 24,  count: 4,  pct: 8,  color: T.success, icon: Banknote },
];

// ─────────────────────────────────────────────────────
// STATUS HELPERS
// ─────────────────────────────────────────────────────
function statusColor(s: string) {
  if (s === 'Reçu') return T.success;
  if (s === 'En attente') return T.warning;
  return T.danger;
}
function methodColor(m: string) {
  if (m === 'Virement') return T.info;
  if (m === 'Chèque') return T.purple;
  return T.success;
}
function amountColor(s: string) {
  if (s === 'Reçu') return T.gold;
  if (s === 'En attente') return T.warning;
  return T.danger;
}

// ─────────────────────────────────────────────────────
// SVG GAUGE
// ─────────────────────────────────────────────────────
function CollectionGauge({ value = 68 }: { value?: number }) {
  const r = 72;
  const cx = 110, cy = 100;
  const startAngle = 210;
  const sweep = 120;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (angle: number) => {
    const a = toRad(angle);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  };
  const bgStart = toRad(startAngle);
  const bgEnd   = toRad(startAngle + sweep);
  const bgPath  = `M ${cx + r * Math.cos(bgStart)},${cy + r * Math.sin(bgStart)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(bgEnd)},${cy + r * Math.sin(bgEnd)}`;
  const filled  = (value / 100) * sweep;
  const fEnd    = toRad(startAngle + filled);
  const fPath   = `M ${cx + r * Math.cos(bgStart)},${cy + r * Math.sin(bgStart)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(fEnd)},${cy + r * Math.sin(fEnd)}`;
  const needleAngle = toRad(startAngle + filled);
  const nx = cx + r * Math.cos(needleAngle);
  const ny = cy + r * Math.sin(needleAngle);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={220} height={140} viewBox="0 0 220 140">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={T.warning} />
            <stop offset="100%" stopColor={T.gold} />
          </linearGradient>
        </defs>
        {/* bg arc */}
        <path d={bgPath} fill="none" stroke="#1E2D4A" strokeWidth={14} strokeLinecap="round" />
        {/* filled arc */}
        <path d={fPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth={14} strokeLinecap="round" />
        {/* needle dot */}
        <circle cx={nx} cy={ny} r={7} fill={T.gold} />
        {/* center value */}
        <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, fill: T.gold }}>
          {value}%
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fill: T.textDim }}>
          Taux d'Encaissement
        </text>
        {/* side labels */}
        <text x={14} y={cy + 16}
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fill: T.textDim }}>
          Obj: 85%
        </text>
        <text x={cx + r + 14} y={cy + 16}
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fill: T.gold }}>
          Reste: 38K
        </text>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({
  label, value, suffix, color, icon: Icon, trend, trendPositive = true, delay = 0,
}: {
  label: string; value: number; suffix?: string; color: string;
  icon: any; trend?: string; trendPositive?: boolean; delay?: number;
}) {
  const animated = useAnimatedCounter(value, 1200);
  const visible = useFadeIn(delay);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 600ms ease-out',
    }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{
              color: T.textDim, fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            }}>{label}</p>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 28,
              fontWeight: 800, color, lineHeight: 1.1,
            }}>
              {animated.toLocaleString('fr-MA')}
              {suffix && (
                <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginLeft: 4 }}>
                  {suffix}
                </span>
              )}
            </p>
            {trend && (
              <p style={{
                fontSize: 10, fontWeight: 600, marginTop: 6,
                color: trendPositive ? T.success : T.danger,
              }}>
                {trendPositive ? '↑' : '↓'} {trend}
              </p>
            )}
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${color}18`, border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={18} color={color} />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PAYMENT ROW
// ─────────────────────────────────────────────────────
function PaymentRow({ p, delay = 0 }: { p: typeof PAYMENTS[0]; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const sc = statusColor(p.status);
  const mc = methodColor(p.method);
  const ac = amountColor(p.status);

  const StatusIcon = p.status === 'Reçu' ? CheckCircle : p.status === 'En attente' ? Clock : AlertTriangle;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px', borderRadius: 10,
        background: hov ? `${T.cardBorder}50` : 'transparent',
        border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
        transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(16px)',
        opacity: visible ? 1 : 0,
        transition: 'all 380ms ease-out',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* Status left bar */}
      <div style={{
        position: 'absolute', left: 0, top: 8, bottom: 8,
        width: 4, borderRadius: 4, background: sc,
      }} />

      {/* Date */}
      <div style={{ minWidth: 55, flexShrink: 0 }}>
        <p style={{ color: T.textDim, fontSize: 11 }}>{p.date}</p>
      </div>

      {/* Client */}
      <div style={{ flex: 1, minWidth: 140 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri }}>{p.client}</p>
      </div>

      {/* Amount */}
      <div style={{ minWidth: 110, flexShrink: 0 }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: ac }}>
          {p.amount.toLocaleString('fr-MA')} DH
        </p>
      </div>

      {/* Method */}
      <div style={{ minWidth: 85, flexShrink: 0 }}>
        <Badge label={p.method} color={mc} bg={`${mc}15`} />
      </div>

      {/* Ref */}
      <div style={{ minWidth: 130, flexShrink: 0 }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim }}>
          {p.ref}
        </p>
      </div>

      {/* Status badge */}
      <div style={{ minWidth: 100, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 999,
          background: `${sc}15`, border: `1px solid ${sc}40`,
          color: sc, fontSize: 10, fontWeight: 700,
          animation: p.status !== 'Reçu' ? 'tbos-pulse 2.2s infinite' : 'none',
        }}>
          <StatusIcon size={10} />
          {p.status}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// METHOD CARD
// ─────────────────────────────────────────────────────
function MethodCard({ m, delay = 0 }: { m: typeof METHODS[0]; delay?: number }) {
  const animated = useAnimatedCounter(m.amount, 1200);
  const visible = useFadeIn(delay);
  const Icon = m.icon;
  // SVG circle progress
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (m.pct / 100) * circ;

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 600ms ease-out',
    }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${m.color}18`, border: `1px solid ${m.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={m.color} />
          </div>
          {/* Circle progress */}
          <svg width={54} height={54} viewBox="0 0 54 54">
            <circle cx={27} cy={27} r={r} fill="none" stroke={`${m.color}20`} strokeWidth={4} />
            <circle
              cx={27} cy={27} r={r} fill="none"
              stroke={m.color} strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              transform="rotate(-90 27 27)"
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
            <text x={27} y={27} textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 800, fill: m.color }}>
              {m.pct}%
            </text>
          </svg>
        </div>

        <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 4 }}>{m.name}</p>
        <p style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 22,
          fontWeight: 800, color: T.gold, marginBottom: 4,
        }}>
          {animated}K DH
        </p>
        <p style={{ color: T.textDim, fontSize: 11 }}>{m.count} transactions</p>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// AGING TOOLTIP
// ─────────────────────────────────────────────────────
function AgingTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const total = 457;
  const pct = Math.round((d.value / total) * 100);
  return (
    <div style={{
      background: '#1A2540', border: `1px solid ${T.goldBorder}`,
      borderRadius: 10, padding: '9px 13px',
    }}>
      <p style={{ color: d.payload.color, fontWeight: 700, fontSize: 12 }}>{d.payload.bracket}</p>
      <p style={{ color: T.textSec, fontSize: 11 }}>{d.value}K DH ({pct}%)</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// HEADER BUTTON
// ─────────────────────────────────────────────────────
function NewPaymentBtn() {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 18px', borderRadius: 8,
        background: hov ? '#FFE44D' : T.gold,
        color: T.navy, fontFamily: 'DM Sans, sans-serif',
        fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer',
        transform: press ? 'scale(0.96)' : 'scale(1)',
        transition: 'all 160ms',
      }}
    >
      <Plus size={14} />
      Nouveau Paiement
    </button>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassPayments() {
  const [activeTab, setActiveTab] = useState('tous');
  const TABS = [
    { id: 'tous',      label: 'Tous' },
    { id: 'recus',     label: 'Reçus' },
    { id: 'attente',   label: 'En attente' },
    { id: 'retard',    label: 'En retard' },
  ];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.navy, minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      {/* ══════════════════════════════════════════════
          SECTION 0: STICKY HEADER
      ══════════════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.94)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`, padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.gold}, #B8860B)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Banknote size={18} color={T.navy} />
            </div>
            <div>
              <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>Paiements</span>
              <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1, marginTop: 1 }}>
                Suivi des paiements et encaissements
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 18px', borderRadius: 8, cursor: 'pointer',
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

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Bell size={18} color={T.textSec} />
              <div style={{
                position: 'absolute', top: -4, right: -4,
                width: 8, height: 8, borderRadius: '50%', background: T.danger,
              }} />
            </div>
            <NewPaymentBtn />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 44 }}>

        {/* ── SECTION 1: KPIs ── */}
        <section>
          <SectionHeader icon={Banknote} label="Indicateurs de Paiement" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard label="Encaissé ce mois"       value={312} suffix="K DH" color={T.gold}    icon={Banknote}       trend="+18% vs mois dernier" trendPositive delay={0} />
            <KPICard label="En Attente"              value={145} suffix="K DH" color={T.warning} icon={Clock}          trend="-12% en cours réduit"  trendPositive delay={80} />
            <KPICard label="En Retard"               value={28}  suffix="K DH" color={T.danger}  icon={AlertTriangle}  trend="+5K DH ce mois"        trendPositive={false} delay={160} />
            <KPICard label="Taux d'Encaissement"     value={68}  suffix="%"    color={T.warning} icon={TrendingUp}     trend="+4% vs mois dernier"   trendPositive delay={240} />
          </div>
        </section>

        {/* ── SECTION 2+3: CHARTS ── */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 20 }}>

            {/* Trend chart — plain div to avoid overflow:hidden clipping Recharts */}
            <div style={{
              background: T.cardBg, border: `1px solid ${T.cardBorder}`,
              borderRadius: 14, padding: 24, position: 'relative',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
            }}>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>Tendance Encaissements</p>
                <p style={{ color: T.textDim, fontSize: 11 }}>6 derniers mois</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pay-encGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.gold} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={T.gold} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="pay-facGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }}
                    tickFormatter={(v: number) => `${v}K`} domain={[200, 380]} />
                  <RechartsTooltip content={<DarkTooltip />} cursor={{ stroke: `${T.gold}30` }} />
                  <Area dataKey="facture" name="Facturé" type="monotone"
                    stroke="#94A3B8" strokeWidth={2} strokeDasharray="6 4"
                    fill="url(#pay-facGrad)" isAnimationActive animationDuration={1200} />
                  <Area dataKey="encaisse" name="Encaissé" type="monotone"
                    stroke={T.gold} strokeWidth={2.5}
                    fill="url(#pay-encGrad)" isAnimationActive animationDuration={1200}
                    dot={{ fill: T.gold, r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
              {/* Gap callout */}
              <div style={{
                marginTop: 14, padding: '8px 14px', borderRadius: 8,
                background: `${T.warning}12`, border: `1px solid ${T.warning}30`,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <AlertTriangle size={13} color={T.warning} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.warning }}>
                  Écart moyen: 32K DH
                </span>
                <span style={{ color: T.textDim, fontSize: 11 }}>entre facturé et encaissé</span>
              </div>
            </div>

            {/* Aging chart — plain div to avoid overflow:hidden */}
            <div style={{
              background: T.cardBg, border: `1px solid ${T.cardBorder}`,
              borderRadius: 14, padding: 24, position: 'relative',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>Analyse d'Âge</p>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 800, color: T.gold }}>
                  457K DH
                </span>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={AGING_DATA} layout="vertical" margin={{ top: 2, right: 50, left: 0, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false}
                    tick={{ fill: T.textDim, fontSize: 10 }} tickFormatter={(v: number) => `${v}K`}
                    domain={[0, 340]} />
                  <YAxis type="category" dataKey="bracket" axisLine={false} tickLine={false}
                    tick={{ fill: T.textSec, fontSize: 11 }} width={74} />
                  <RechartsTooltip content={<AgingTooltip />} cursor={{ fill: `${T.gold}08` }} />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]}
                    isAnimationActive animationDuration={1000}
                    label={{
                      position: 'right',
                      formatter: (v: number) => `${v}K`,
                      style: { fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: T.textSec },
                    }}>
                    {AGING_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Summary badges */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <Badge label="68% courant" color={T.success} bg={`${T.success}15`} />
                <Badge label="21% 1-30j"   color={T.warning} bg={`${T.warning}15`} />
                <Badge label="11% >30j"    color={T.danger}  bg={`${T.danger}15`} />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: GAUGE ── */}
        <section>
          <SectionHeader icon={TrendingUp} label="Taux d'Encaissement" />
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, padding: '8px 0' }}>
              {/* Left metric */}
              <div style={{
                textAlign: 'center', minWidth: 160, padding: '20px 24px',
                background: `${T.cardBorder}50`, borderRadius: 12,
                border: `1px solid ${T.cardBorder}`,
              }}>
                <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Objectif Mensuel
                </p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.textSec }}>
                  460K DH
                </p>
              </div>

              {/* Gauge */}
              <CollectionGauge value={68} />

              {/* Right metric */}
              <div style={{
                textAlign: 'center', minWidth: 160, padding: '20px 24px',
                background: `${T.gold}08`, borderRadius: 12,
                border: `1px solid ${T.goldBorder}`,
              }}>
                <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  À Encaisser
                </p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.gold }}>
                  148K DH
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* ── SECTION 5: RECENT PAYMENTS ── */}
        <section>
          <SectionHeader
            icon={Banknote}
            label="Paiements Récents"
            right={<span style={{ color: T.textDim, fontSize: 11 }}>8 paiements</span>}
          />
          <Card>
            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '55px 1fr 130px 100px 140px 110px',
              gap: 14, padding: '4px 16px 12px',
              borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 6,
            }}>
              {['Date', 'Client', 'Montant', 'Méthode', 'Facture', 'Statut'].map((h, i) => (
                <span key={i} style={{
                  color: T.textDim, fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{h}</span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {PAYMENTS.map((p, i) => (
                <PaymentRow key={p.ref} p={p} delay={i * 60} />
              ))}
            </div>
          </Card>
        </section>

        {/* ── SECTION 6: PAYMENT METHODS ── */}
        <section>
          <SectionHeader icon={ArrowRightLeft} label="Moyens de Paiement" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {METHODS.map((m, i) => <MethodCard key={m.name} m={m} delay={i * 100} />)}
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>
            TBOS Paiements v2.0 — {new Date().toLocaleDateString('fr-FR')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: T.success, animation: 'tbos-pulse 2.5s infinite',
            }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Système opérationnel</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
