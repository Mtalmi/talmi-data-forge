import { useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  Package, AlertTriangle, ArrowUpDown, RefreshCw,
  Droplets, Bell, ArrowUp, ArrowDown, TrendingUp,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#FFD700',
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
  cyan:       '#06B6D4',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

// ─────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const raw = eased * target;
      setValue(parseFloat(raw.toFixed(decimals)));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);
  return value;
}

// ─────────────────────────────────────────────────────
// ANIMATED WIDTH (for progress bars)
// ─────────────────────────────────────────────────────
function useAnimatedWidth(target: number, delay = 0, duration = 900) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setWidth(eased * target);
        if (p < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay, duration]);
  return width;
}

// ─────────────────────────────────────────────────────
// CARD
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
        borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden',
        transform: press ? 'translateY(-1px) scale(0.995)' : hov ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.25), 0 0 20px ${T.goldGlow}` : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
        opacity: hov ? 1 : 0, transition: 'opacity 200ms',
      }} />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────
function Badge({ label, color, bg, pulse = false }: { label: string; color: string; bg: string; pulse?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      animation: pulse ? 'tbos-pulse 2s infinite' : 'none',
      flexShrink: 0,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const STOCKS = [
  { name: 'Ciment CPA 55',          current: 5500,  max: 10000, unit: 'kg', pct: 55, liquid: false },
  { name: 'Ciment CPJ 45',          current: 3200,  max: 8000,  unit: 'kg', pct: 40, liquid: false },
  { name: 'Adjuvant Plastifiant',   current: 150,   max: 500,   unit: 'L',  pct: 30, liquid: true  },
  { name: 'Adjuvant Retardateur',   current: 80,    max: 300,   unit: 'L',  pct: 27, liquid: true  },
  { name: 'Gravette 8/15',          current: 95000, max: 120000,unit: 'kg', pct: 79, liquid: false },
  { name: 'Gravette 15/25',         current: 62000, max: 100000,unit: 'kg', pct: 62, liquid: false },
  { name: 'Sable 0/4',              current: 78000, max: 150000,unit: 'kg', pct: 52, liquid: false },
  { name: 'Eau',                    current: 15000, max: 20000, unit: 'L',  pct: 75, liquid: true  },
];

const MOVEMENT_DATA = [
  { day: 'Lun', entrees: 12000, sorties: 8500 },
  { day: 'Mar', entrees: 8000,  sorties: 9200 },
  { day: 'Mer', entrees: 15000, sorties: 7800 },
  { day: 'Jeu', entrees: 6000,  sorties: 11000 },
  { day: 'Ven', entrees: 10000, sorties: 9500 },
  { day: 'Sam', entrees: 4000,  sorties: 3200 },
  { day: 'Dim', entrees: 0,     sorties: 0 },
];

const ALERTS = [
  { name: 'Adjuvant Plastifiant', current: '150 L',  min: '200 L',  deficit: '-50 L',   urgency: 'Critique', color: T.danger },
  { name: 'Adjuvant Retardateur', current: '80 L',   min: '100 L',  deficit: '-20 L',   urgency: 'Critique', color: T.danger },
  { name: 'Ciment CPJ 45',        current: '3 200 kg', min: '4 000 kg', deficit: '-800 kg', urgency: 'Attention', color: T.warning },
];

const MOVEMENTS = [
  { date: "Aujourd'hui 14:30", type: 'Sortie', material: 'Ciment CPA 55',    qty: '-1 200 kg', ref: 'BN-0142', resp: 'Karim B.' },
  { date: "Aujourd'hui 11:00", type: 'Sortie', material: 'Gravette 8/15',    qty: '-3 500 kg', ref: 'BN-0140', resp: 'Youssef M.' },
  { date: "Aujourd'hui 09:00", type: 'Entrée', material: 'Ciment CPA 55',    qty: '+5 000 kg', ref: 'REC-045', resp: 'Fournisseur A' },
  { date: 'Hier 16:00',         type: 'Sortie', material: 'Adjuvant',         qty: '-25 L',     ref: 'BN-0138', resp: 'Karim B.' },
  { date: 'Hier 10:00',         type: 'Entrée', material: 'Sable 0/4',        qty: '+15 000 kg', ref: 'REC-044', resp: 'Fournisseur B' },
  { date: 'Hier 08:00',         type: 'Entrée', material: 'Gravette 15/25',   qty: '+12 000 kg', ref: 'REC-043', resp: 'Fournisseur C' },
];

const VALUE_BREAKDOWN = [
  { cat: 'Ciment',    value: 1050, color: T.gold },
  { cat: 'Granulats', value: 780,  color: T.info },
  { cat: 'Adjuvants', value: 320,  color: T.success },
  { cat: 'Sable',     value: 185,  color: T.purple },
  { cat: 'Eau',       value: 65,   color: T.cyan },
];

// ─────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive, delay = 0, decimals = 0 }: {
  label: string; value: number; suffix: string; color: string;
  icon: any; trend: string; trendPositive: boolean; delay?: number; decimals?: number;
}) {
  const animated = useAnimatedCounter(value, 1200, decimals);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
              {decimals > 0 ? animated.toFixed(decimals) : animated.toLocaleString('fr-FR')}
              <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginLeft: 5 }}>{suffix}</span>
            </p>
            {trend && (
              <p style={{ fontSize: 11, color: trendPositive ? T.success : T.danger, marginTop: 6, fontWeight: 600 }}>
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
// STOCK LEVEL ROW
// ─────────────────────────────────────────────────────
function StockRow({ stock, index }: { stock: typeof STOCKS[0]; index: number }) {
  const [visible, setVisible] = useState(false);
  const barColor = stock.pct >= 60 ? T.success : stock.pct >= 30 ? T.warning : T.danger;
  const isAlert = stock.pct < 30;
  const animatedWidth = useAnimatedWidth(stock.pct, index * 100);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 80); return () => clearTimeout(t); }, [index]);
  const Icon = stock.liquid ? Droplets : Package;

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 500ms ease-out',
        padding: '14px 16px',
        background: isAlert ? `${T.warning}08` : 'transparent',
        border: `1px solid ${isAlert ? `${T.warning}40` : T.cardBorder}`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      {/* Icon */}
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${barColor}18`, border: `1px solid ${barColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={barColor} />
      </div>

      {/* Name */}
      <div style={{ minWidth: 190, flexShrink: 0 }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri }}>{stock.name}</p>
      </div>

      {/* Progress bar */}
      <div style={{ flex: 1 }}>
        <div style={{ height: 8, borderRadius: 4, background: `${T.cardBorder}`, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${animatedWidth}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}BB)`,
            borderRadius: 4,
            boxShadow: `0 0 8px ${barColor}60`,
          }} />
        </div>
      </div>

      {/* Values */}
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 140 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: T.textPri }}>
          {stock.current.toLocaleString('fr-FR')}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim }}>
          {' '}/ {stock.max.toLocaleString('fr-FR')} {stock.unit}
        </span>
      </div>

      {/* Pct badge */}
      <div style={{ flexShrink: 0 }}>
        {isAlert
          ? <Badge label="Alerte ⚠" color={T.warning} bg={`${T.warning}18`} pulse />
          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: barColor }}>{stock.pct}%</span>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// ALERT CARD
// ─────────────────────────────────────────────────────
function AlertCard({ alert, delay = 0 }: { alert: typeof ALERTS[0]; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const isCritique = alert.urgency === 'Critique';

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 400ms ease-out',
        background: T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : alert.color + '30'}`,
        borderLeft: `4px solid ${alert.color}`,
        borderRadius: 10, padding: '14px 16px',
        boxShadow: hov ? `0 4px 20px rgba(0,0,0,0.2)` : '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: T.textPri }}>{alert.name}</p>
        <Badge label={alert.urgency} color={alert.color} bg={`${alert.color}18`} pulse={isCritique} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div>
          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Actuel</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.danger }}>{alert.current}</p>
        </div>
        <div style={{ color: T.textDim }}>→</div>
        <div>
          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Minimum</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: T.textSec }}>{alert.min}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Déficit</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.danger }}>
            ↓ {alert.deficit}
          </p>
        </div>
      </div>
      <button style={{
        width: '100%', padding: '7px 0', borderRadius: 8,
        background: T.gold, color: T.navy,
        fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12,
        border: 'none', cursor: 'pointer',
        transition: 'filter 150ms',
      }}
        onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
        onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        Commander
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MOVEMENT ROW
// ─────────────────────────────────────────────────────
function MovementRow({ m, delay = 0 }: { m: typeof MOVEMENTS[0]; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const isEntree = m.type === 'Entrée';
  const typeColor = isEntree ? T.success : T.danger;
  const TypeIcon = isEntree ? ArrowUp : ArrowDown;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(16px)',
        transition: 'all 350ms ease-out',
        background: hov ? `${T.cardBorder}60` : 'transparent',
        border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
        borderRadius: 8, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}
    >
      {/* Type badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 999,
        background: `${typeColor}18`, border: `1px solid ${typeColor}30`,
        color: typeColor, fontSize: 10, fontWeight: 700, flexShrink: 0,
      }}>
        <TypeIcon size={10} />
        {m.type}
      </span>

      {/* Date */}
      <span style={{ color: T.textDim, fontSize: 11, flexShrink: 0, minWidth: 130 }}>{m.date}</span>

      {/* Material */}
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, flex: 1 }}>{m.material}</span>

      {/* Qty */}
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: isEntree ? T.success : T.danger, flexShrink: 0 }}>
        {m.qty}
      </span>

      {/* Ref */}
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gold + 'AA', flexShrink: 0 }}>{m.ref}</span>

      {/* Responsable */}
      <span style={{ color: T.textSec, fontSize: 11, flexShrink: 0, minWidth: 110 }}>{m.resp}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#162036', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill, fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{Number(p.value).toLocaleString('fr-FR')}{suffix}</strong>
        </p>
      ))}
    </div>
  );
}

function ValueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#162036', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ color: payload[0]?.fill, fontSize: 12 }}>{payload[0]?.value} K DH</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────
export default function WorldClassStocks() {
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'mouvements', label: 'Mouvements' },
    { id: 'alertes', label: 'Alertes' },
  ];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.navy, minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.8} }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`, padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, #B8860B)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} color={T.navy} />
            </div>
            <div>
              <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>Stocks</span>
              <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1, marginTop: 1 }}>Gestion des stocks et inventaire</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '6px 18px', borderRadius: 8, cursor: 'pointer',
                background: activeTab === tab.id ? `${T.gold}18` : 'transparent',
                border: activeTab === tab.id ? `1px solid ${T.goldBorder}` : '1px solid transparent',
                color: activeTab === tab.id ? T.gold : T.textSec,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13,
                transition: 'all 200ms',
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Bell size={18} color={T.textSec} />
              <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: T.danger }} />
            </div>
            <button style={{
              padding: '7px 16px', borderRadius: 8, background: T.gold, color: T.navy,
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12,
              border: 'none', cursor: 'pointer',
            }}>
              + Nouveau Mouvement
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── SECTION 1: KPIs ── */}
        <section>
          <SectionHeader icon={TrendingUp} label="Indicateurs Clés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard label="Valeur Totale Stock"      value={2.4}  suffix="M DH" color={T.gold}    icon={Package}      trend="+5% vs mois dernier" trendPositive decimals={1} delay={0} />
            <KPICard label="Articles en Alerte"       value={3}    suffix=""     color={T.danger}  icon={AlertTriangle} trend=""                    trendPositive={false} delay={80} />
            <KPICard label="Mouvements Aujourd'hui"   value={12}   suffix=""     color={T.info}    icon={ArrowUpDown}  trend="+4 vs hier"          trendPositive delay={160} />
            <KPICard label="Rotation Moyenne"         value={4.2}  suffix="x"   color={T.success} icon={RefreshCw}    trend="+0.3 vs semaine"     trendPositive decimals={1} delay={240} />
          </div>
        </section>

        {/* ── SECTION 2: STOCK LEVELS ── */}
        <section>
          <SectionHeader icon={Package} label="Niveaux de Stock" />
          <Card style={{ padding: '20px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STOCKS.map((s, i) => <StockRow key={s.name} stock={s} index={i} />)}
            </div>
          </Card>
        </section>

        {/* ── SECTION 3 + 4: CHART + ALERTS ── */}
        <section>
          <SectionHeader icon={ArrowUpDown} label="Mouvements & Alertes" />
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 24 }}>

            {/* Movement chart */}
            <Card className="tbos-card-stagger">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <p style={{ color: T.textPri, fontWeight: 700, fontSize: 14 }}>Mouvements de Stock</p>
                  <p style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>7 derniers jours</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textSec, fontSize: 11 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: T.success, display: 'inline-block' }} />Entrées
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textSec, fontSize: 11 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: T.gold, display: 'inline-block' }} />Sorties
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={MOVEMENT_DATA} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }}
                    tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
                  <RechartsTooltip content={<DarkTooltip suffix=" kg" />} cursor={{ fill: `${T.gold}08` }} />
                  <Bar dataKey="entrees" name="Entrées"  fill={T.success} radius={[3, 3, 0, 0]} isAnimationActive animationDuration={1000} />
                  <Bar dataKey="sorties" name="Sorties"  fill={T.gold}    radius={[3, 3, 0, 0]} isAnimationActive animationDuration={1000} animationBegin={150} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Alerts */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={14} color={T.danger} />
                <span style={{ color: T.danger, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Alertes Stock</span>
                <Badge label="3 actives" color={T.danger} bg={`${T.danger}18`} pulse />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ALERTS.map((a, i) => <AlertCard key={a.name} alert={a} delay={i * 100} />)}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: RECENT MOVEMENTS ── */}
        <section>
          <SectionHeader icon={ArrowUpDown} label="Derniers Mouvements" />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Header row */}
              <div style={{ display: 'flex', gap: 14, padding: '0 14px 10px', borderBottom: `1px solid ${T.cardBorder}` }}>
                {['Type', 'Date', 'Matériau', 'Quantité', 'Référence', 'Responsable'].map(h => (
                  <span key={h} style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                ))}
              </div>
              {MOVEMENTS.map((m, i) => <MovementRow key={i} m={m} delay={i * 60} />)}
            </div>
          </Card>
        </section>

        {/* ── SECTION 6: VALUE BREAKDOWN ── */}
        <section>
          <SectionHeader
            icon={TrendingUp}
            label="Valeur par Catégorie"
            right={<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.gold }}>Total: 2.4 M DH</span>}
          />
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[...VALUE_BREAKDOWN].sort((a, b) => b.value - a.value)}
                layout="vertical"
                margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }}
                  tickFormatter={(v) => `${v}K`} />
                <YAxis dataKey="cat" type="category" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 12 }} width={70} />
                <RechartsTooltip content={<ValueTooltip />} cursor={{ fill: `${T.gold}08` }} />
                <Bar dataKey="value" name="Valeur" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1000}>
                  {VALUE_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>TBOS Stocks v2.0 — {new Date().toLocaleString('fr-FR')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Stocks synchronisés</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
