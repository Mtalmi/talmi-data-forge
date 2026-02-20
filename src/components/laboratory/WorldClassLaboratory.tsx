import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, Sector, ReferenceLine,
} from 'recharts';
import {
  FlaskConical, CheckCircle, AlertTriangle, Clock, Plus,
  FileText, Bell, Zap, Droplets, Activity, CloudRain,
  TrendingUp, BookOpen, ChevronDown, ChevronUp, User,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#FFD700',
  goldGlow:   'rgba(255,215,0,0.16)',
  goldBorder: 'rgba(255,215,0,0.28)',
  navy:       '#0B1120',
  cardBg:     'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#3B82F6',
  purple:     '#8B5CF6',
  cyan:       '#06B6D4',
  orange:     '#F97316',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

// ─────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return value;
}

function useFadeIn(delay = 0) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return v;
}

function useBarWidth(target: number, delay = 0) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(target), delay + 400); return () => clearTimeout(t); }, [target, delay]);
  return w;
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
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        background: T.cardBg, border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden',
        transform: press ? 'translateY(-1px) scale(0.998)' : hov ? 'translateY(-4px) scale(1.005)' : 'none',
        boxShadow: hov ? `0 14px 36px rgba(0,0,0,0.3), 0 0 28px ${T.goldGlow}` : '0 4px 14px rgba(0,0,0,0.1)',
        transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)', ...style,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 220ms' }} />
      {children}
    </div>
  );
}

function Bdg({ label, color, bg, pulse, icon: Icon }: { label: string; color: string; bg: string; pulse?: boolean; icon?: React.ElementType }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: bg, border: `1px solid ${color}40`, color, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0 }}>
      {Icon ? <Icon size={9} /> : <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, animation: pulse ? 'tbos-pulse 1.5s ease-in-out infinite' : 'none' }} />}
      {label}
    </span>
  );
}

function SectionHeader({ icon: Icon, label, right, sub }: { icon: React.ElementType; label: string; right?: React.ReactNode; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <div>
        <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>{label}</span>
        {sub && <span style={{ color: T.textDim, fontSize: 10, marginLeft: 8 }}>{sub}</span>}
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const WEEKLY = [
  { day: 'Lun', conformes: 10, non: 1, taux: 91 },
  { day: 'Mar', conformes: 8,  non: 2, taux: 80 },
  { day: 'Mer', conformes: 12, non: 0, taux: 100 },
  { day: 'Jeu', conformes: 9,  non: 1, taux: 90 },
  { day: 'Ven', conformes: 11, non: 2, taux: 85 },
  { day: 'Sam', conformes: 7,  non: 0, taux: 100 },
  { day: 'Dim', conformes: 0,  non: 0, taux: 0 },
];

const TEST_TYPE_ICON: Record<string, React.ElementType> = {
  'Slump': Droplets,
  'Résistance 7j': Zap,
  'Résistance 28j': Zap,
  'Température': Activity,
  'Air occlus': CloudRain,
};
const TEST_TYPE_COLOR: Record<string, string> = {
  'Slump': T.info,
  'Résistance 7j': T.gold,
  'Résistance 28j': T.purple,
  'Température': T.orange,
  'Air occlus': T.cyan,
};

const RESULTS = [
  { id: 'LAB-142', batch: 'BN-0142', type: 'Slump',          result: '18 cm',    norme: '15-20 cm', ecart: 'OK',              ecartType: 'ok',    status: 'Conforme'    },
  { id: 'LAB-141', batch: 'BN-0141', type: 'Résistance 7j',  result: '28.5 MPa', norme: '>25 MPa',  ecart: '+14%',            ecartType: 'plus',  status: 'Conforme'    },
  { id: 'LAB-140', batch: 'BN-0140', type: 'Slump',          result: '22 cm',    norme: '15-20 cm', ecart: '+10% hors norme', ecartType: 'bad',   status: 'Non-conforme'},
  { id: 'LAB-139', batch: 'BN-0139', type: 'Température',    result: '28°C',     norme: '<32°C',    ecart: 'OK',              ecartType: 'ok',    status: 'Conforme'    },
  { id: 'LAB-138', batch: 'BN-0138', type: 'Résistance 7j',  result: '32.1 MPa', norme: '>30 MPa',  ecart: '+7%',             ecartType: 'plus',  status: 'Conforme'    },
  { id: 'LAB-137', batch: 'BN-0137', type: 'Air occlus',     result: '4.2%',     norme: '3-6%',     ecart: 'OK',              ecartType: 'ok',    status: 'Conforme'    },
  { id: 'LAB-136', batch: 'BN-0136', type: 'Slump',          result: '17 cm',    norme: '15-20 cm', ecart: 'OK',              ecartType: 'ok',    status: 'Conforme'    },
  { id: 'LAB-135', batch: 'BN-0135', type: 'Résistance 28j', result: '—',        norme: '>25 MPa',  ecart: '—',               ecartType: 'none',  status: 'En attente'  },
];

const TYPE_DIST = [
  { name: 'Slump',          count: 3, color: T.info   },
  { name: 'Résistance 7j',  count: 2, color: T.gold   },
  { name: 'Résistance 28j', count: 1, color: T.purple  },
  { name: 'Température',    count: 1, color: T.orange  },
  { name: 'Air occlus',     count: 1, color: T.cyan    },
];

const BATCH_DIST = [
  { batch: 'BN-0142', conf: 1, nonConf: 0 },
  { batch: 'BN-0141', conf: 1, nonConf: 0 },
  { batch: 'BN-0140', conf: 0, nonConf: 1 },
  { batch: 'BN-0139', conf: 1, nonConf: 0 },
  { batch: 'BN-0138', conf: 1, nonConf: 0 },
  { batch: 'BN-0137', conf: 1, nonConf: 0 },
  { batch: 'BN-0136', conf: 1, nonConf: 0 },
  { batch: 'BN-0135', conf: 0, nonConf: 0 },
];

const PENDING = [
  { id: 'LAB-135', batch: 'BN-0135', type: 'Résistance 28j', started: '25 Jan', expected: '22 Fév', jour: 26, total: 28, progress: 93 },
  { id: 'LAB-134', batch: 'BN-0134', type: 'Résistance 28j', started: '01 Fév', expected: '01 Mars', jour: 19, total: 28, progress: 68 },
];

const NORMS = [
  { test: 'Slump B25',          norme: '15-20', unite: 'cm',  tolerance: '±2 cm' },
  { test: 'Slump B30',          norme: '12-18', unite: 'cm',  tolerance: '±2 cm' },
  { test: 'Slump B35',          norme: '10-15', unite: 'cm',  tolerance: '±2 cm' },
  { test: 'Résistance 7j B25',  norme: '>18',   unite: 'MPa', tolerance: '—'     },
  { test: 'Résistance 7j B30',  norme: '>25',   unite: 'MPa', tolerance: '—'     },
  { test: 'Résistance 28j B25', norme: '>25',   unite: 'MPa', tolerance: '—'     },
  { test: 'Résistance 28j B30', norme: '>30',   unite: 'MPa', tolerance: '—'     },
  { test: 'Température',        norme: '<32',   unite: '°C',  tolerance: '—'     },
  { test: 'Air occlus',         norme: '3-6',   unite: '%',   tolerance: '±1%'   },
];

// ─────────────────────────────────────────────────────
// CONFORMITY GAUGE (SVG)
// ─────────────────────────────────────────────────────
function ConformityGauge({ value }: { value: number }) {
  const r = 80, cx = 110, cy = 110;
  const startAngle = -210, endAngle = 30;
  const totalArc = endAngle - startAngle;
  const filledArc = (value / 100) * totalArc;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number, radius: number) => {
    const s = toRad(start), e = toRad(end);
    const x1 = cx + radius * Math.cos(s), y1 = cy + radius * Math.sin(s);
    const x2 = cx + radius * Math.cos(e), y2 = cy + radius * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };
  const color = value >= 80 ? T.success : value >= 60 ? T.warning : T.danger;

  return (
    <svg width={220} height={160} viewBox="0 0 220 175">
      {/* Track */}
      <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke={`${color}20`} strokeWidth={14} strokeLinecap="round" />
      {/* Fill */}
      <path d={arcPath(startAngle, startAngle + filledArc, r)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color}80)` }} />
      {/* Center text */}
      <text x={cx} y={cy + 8} textAnchor="middle" fill={color} fontFamily="JetBrains Mono, monospace" fontSize={26} fontWeight={800}>{value}%</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill={T.textDim} fontFamily="DM Sans, sans-serif" fontSize={10}>conformité</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────
// TOOLTIPS
// ─────────────────────────────────────────────────────
function WeeklyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: T.gold, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{label}</p>
      <p style={{ color: T.success, fontSize: 12 }}>Conformes: <strong>{payload[0]?.value}</strong></p>
      <p style={{ color: T.danger, fontSize: 12 }}>Non-conformes: <strong>{payload[1]?.value}</strong></p>
      {payload[2] && <p style={{ color: T.gold, fontSize: 12 }}>Taux: <strong>{payload[2]?.value}%</strong></p>}
    </div>
  );
}

function TypeTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: d.color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: T.textPri, fontSize: 12 }}>{d.count} test{d.count > 1 ? 's' : ''}</p>
    </div>
  );
}

function BatchTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: T.gold, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{label}</p>
      <p style={{ color: T.success, fontSize: 12 }}>Conformes: <strong>{payload[0]?.value}</strong></p>
      <p style={{ color: T.danger, fontSize: 12 }}>Non-conf.: <strong>{payload[1]?.value}</strong></p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TEST RESULT ROW
// ─────────────────────────────────────────────────────
function TestRow({ r, delay = 0 }: { r: typeof RESULTS[0]; delay?: number }) {
  const vis = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const sColor = r.status === 'Conforme' ? T.success : r.status === 'Non-conforme' ? T.danger : T.warning;
  const TypeIcon = TEST_TYPE_ICON[r.type] ?? FlaskConical;
  const typeColor = TEST_TYPE_COLOR[r.type] ?? T.textSec;
  const resultColor = r.status === 'Conforme' ? T.success : r.status === 'Non-conforme' ? T.danger : T.textDim;

  const ecartEl = (() => {
    if (r.ecartType === 'ok') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: T.success, fontWeight: 700, fontSize: 12 }}><CheckCircle size={11} /> OK</span>;
    if (r.ecartType === 'plus') return <span style={{ color: T.success, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 12 }}>{r.ecart}</span>;
    if (r.ecartType === 'bad') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: T.danger, fontWeight: 700, fontSize: 11 }}><AlertTriangle size={11} /> {r.ecart}</span>;
    return <span style={{ color: T.textDim, fontSize: 12 }}>—</span>;
  })();

  const statusEl = (() => {
    if (r.status === 'Conforme')     return <Bdg label="Conforme"     color={T.success} bg={`${T.success}15`} icon={CheckCircle} />;
    if (r.status === 'Non-conforme') return <Bdg label="Non-conforme" color={T.danger}  bg={`${T.danger}15`}  pulse icon={AlertTriangle} />;
    return <Bdg label="En attente" color={T.warning} bg={`${T.warning}15`} pulse icon={Clock} />;
  })();

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid', gridTemplateColumns: '0.6fr 0.7fr 1.1fr 0.8fr 0.8fr 1.1fr 0.9fr',
        alignItems: 'center', gap: 8,
        borderLeft: `4px solid ${sColor}`,
        borderRadius: 10, padding: '12px 14px',
        background: hov ? '#1A2B45' : 'transparent',
        borderBottom: `1px solid ${T.cardBorder}`,
        opacity: vis ? 1 : 0,
        transform: vis ? (hov ? 'translateX(4px)' : 'translateX(0)') : 'translateY(14px)',
        transition: 'all 300ms ease-out', cursor: 'default',
      }}
    >
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim, margin: 0 }}>{r.id}</p>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.gold, fontWeight: 700, margin: 0 }}>{r.batch}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <TypeIcon size={13} color={typeColor} />
        <span style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{r.type}</span>
      </div>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 800, color: resultColor, margin: 0 }}>{r.result}</p>
      <p style={{ fontSize: 12, color: T.textDim, margin: 0 }}>{r.norme}</p>
      <div>{ecartEl}</div>
      <div>{statusEl}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, color, icon: Icon, trend, delay = 0 }: {
  label: string; value: number; color: string; icon: React.ElementType; trend?: string; delay?: number;
}) {
  const animated = useAnimatedCounter(value);
  const vis = useFadeIn(delay);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(20px)', transition: 'all 550ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: 0, marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1, margin: 0 }}>{animated}</p>
            {trend && <p style={{ fontSize: 10, fontWeight: 600, marginTop: 6, color: T.success, margin: '6px 0 0' }}>↑ {trend}</p>}
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
// PENDING CARD
// ─────────────────────────────────────────────────────
function PendingCard({ p, delay = 0 }: { p: typeof PENDING[0]; delay?: number }) {
  const vis = useFadeIn(delay);
  const barW = useBarWidth(p.progress, delay);
  const isNear = p.progress >= 90;
  const barColor = isNear ? T.success : T.warning;
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(20px)', transition: 'all 500ms ease-out' }}>
      <Card style={{ borderLeft: `4px solid ${T.warning}`, background: 'linear-gradient(145deg, #141E2F 0%, #1A2640 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: T.gold }}>{p.id}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textSec }}>{p.batch}</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, margin: 0 }}>{p.type}</p>
          </div>
          {isNear
            ? <Bdg label="Résultat imminent" color={T.success} bg={`${T.success}15`} icon={CheckCircle} />
            : <Bdg label="En cours" color={T.warning} bg={`${T.warning}15`} pulse />
          }
        </div>
        <p style={{ fontSize: 11, color: T.textDim, marginBottom: 12 }}>{p.started} → {p.expected}</p>
        <div style={{ height: 7, borderRadius: 99, background: `${barColor}18`, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${barW}%`, background: `linear-gradient(90deg, ${barColor}99, ${barColor})`, borderRadius: 99, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${barColor}60` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 10, color: T.textDim, margin: 0 }}>Jour {p.jour} sur {p.total} jours</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: barColor, margin: 0 }}>{p.progress}%</p>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// DONUT ACTIVE SHAPE
// ─────────────────────────────────────────────────────
function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return <g><Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} /></g>;
}

// ─────────────────────────────────────────────────────
// STAT BOX
// ─────────────────────────────────────────────────────
function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const animated = useAnimatedCounter(value);
  return (
    <div style={{ flex: 1, background: '#0D1627', borderRadius: 10, padding: '10px 14px', border: `1px solid ${color}25` }}>
      <p style={{ fontSize: 9, color: T.textDim, margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 700 }}>{label}</p>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 800, color, margin: 0 }}>{animated}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassLaboratory() {
  const [activeTab, setActiveTab] = useState("Aujourd'hui");
  const [hoverNew, setHoverNew] = useState(false);
  const [activePie, setActivePie] = useState<number | null>(null);
  const [normsExpanded, setNormsExpanded] = useState(false);

  const tabs = ["Aujourd'hui", 'Cette semaine', 'Résultats', 'Normes'];
  const chartStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
    border: `1px solid ${T.cardBorder}`,
    borderRadius: 14, padding: 24,
  };
  const visibleNorms = normsExpanded ? NORMS : NORMS.slice(0, 4);

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: T.textPri, paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ══════════════════════════ PAGE HEADER ══════════════════════════ */}
      <div style={{
        borderBottom: `1px solid ${T.cardBorder}`,
        padding: '20px 32px 0',
        marginBottom: 4,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <FlaskConical size={22} color={T.gold} />
              <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 26, color: T.textPri, margin: 0 }}>Laboratoire</h1>
            </div>
            <p style={{ color: T.textDim, fontSize: 13, margin: 0 }}>Contrôle qualité et essais</p>
          </div>
          <button
            onMouseEnter={() => setHoverNew(true)} onMouseLeave={() => setHoverNew(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
              background: hoverNew ? '#FFE033' : T.gold, color: T.navy,
              border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13,
              cursor: 'pointer', transition: 'all 180ms', fontFamily: 'DM Sans, sans-serif',
              transform: hoverNew ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            <Plus size={15} /> Nouveau Test
          </button>
        </div>
        <div style={{ display: 'flex' }}>
          {tabs.map(tab => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 20px', background: 'transparent', border: 'none',
                borderBottom: active ? `2px solid ${T.gold}` : '2px solid transparent',
                color: active ? T.gold : T.textDim,
                fontWeight: active ? 700 : 400, fontSize: 13, cursor: 'pointer',
                transition: 'all 200ms', fontFamily: 'DM Sans, sans-serif',
              }}>{tab}</button>
            );
          })}
        </div>
      </div>

      {/* PAGE BODY */}
      <div style={{ padding: '32px 32px 0', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ══════ SECTION 1 — KPIs ══════ */}
        <section>
          <SectionHeader icon={TrendingUp} label="Indicateurs du Jour" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            <KPICard label="Tests Aujourd'hui"      value={8} color={T.gold}    icon={FlaskConical}   trend="+3 vs hier"       delay={0}   />
            <KPICard label="Conformes"               value={7} color={T.success} icon={CheckCircle}    trend="87.5% taux"       delay={80}  />
            <KPICard label="Non-Conformes"           value={1} color={T.danger}  icon={AlertTriangle}  trend="-1 vs hier"       delay={160} />
            <KPICard label="En Attente Résultat"     value={2} color={T.warning} icon={Clock}                                   delay={240} />
          </div>
        </section>

        {/* ══════ SECTION 2 — GAUGE + WEEKLY TREND ══════ */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 20 }}>

            {/* Gauge left */}
            <Card>
              <SectionHeader icon={CheckCircle} label="Conformité" sub="aujourd'hui" />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ConformityGauge value={87.5} />
              </div>
              <p style={{ textAlign: 'center' as const, color: T.textDim, fontSize: 11, marginBottom: 16, marginTop: 0 }}>Taux de Conformité Aujourd'hui</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <StatBox label="Total" value={8} color={T.textPri} />
                <StatBox label="Conformes" value={7} color={T.success} />
                <StatBox label="Non-conf." value={1} color={T.danger} />
              </div>
            </Card>

            {/* Weekly trend right */}
            <div style={chartStyle}>
              <SectionHeader icon={TrendingUp} label="Tendance Conformité" sub="cette semaine" />
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                {[[T.success, 'Conformes'], [T.danger, 'Non-conf.'], [T.gold, 'Taux %']].map(([c, l], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: i === 2 ? 14 : 10, height: i === 2 ? 2 : 10, borderRadius: i === 2 ? 0 : 3, background: c, borderTop: i === 2 ? `2px dashed ${c}` : undefined }} />
                    <span style={{ fontSize: 11, color: T.textSec }}>{l}</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={WEEKLY} margin={{ top: 4, right: 50, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradConf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.success} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={T.success} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradNon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.danger} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={T.danger} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 11 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[0, 15]} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[0, 110]} tickFormatter={(v: number) => `${v}%`} />
                  <RechartsTooltip content={<WeeklyTooltip />} />
                  <Area yAxisId="left" type="monotone" dataKey="conformes" name="Conformes" stroke={T.success} fill="url(#gradConf)" strokeWidth={2} isAnimationActive animationDuration={1200} />
                  <Area yAxisId="left" type="monotone" dataKey="non" name="Non-conf." stroke={T.danger} fill="url(#gradNon)" strokeWidth={2} isAnimationActive animationDuration={1200} />
                  <Area yAxisId="right" type="monotone" dataKey="taux" name="Taux %" stroke={T.gold} fill="none" strokeWidth={1.5} strokeDasharray="4 3" dot={{ fill: T.gold, r: 3 }} isAnimationActive animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ══════ SECTION 3 — TEST RESULTS TABLE ══════ */}
        <section>
          <div style={chartStyle}>
            <SectionHeader
              icon={FlaskConical}
              label="Résultats du Jour"
              right={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Bdg label="7 conformes"    color={T.success} bg={`${T.success}15`} icon={CheckCircle} />
                  <Bdg label="1 non-conforme" color={T.danger}  bg={`${T.danger}15`}  pulse icon={AlertTriangle} />
                </div>
              }
            />
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 0.7fr 1.1fr 0.8fr 0.8fr 1.1fr 0.9fr', padding: '0 14px 10px', gap: 8, borderBottom: `1px solid ${T.cardBorder}` }}>
              {['Test ID', 'Batch', 'Type', 'Résultat', 'Norme', 'Écart', 'Statut'].map((h, i) => (
                <p key={i} style={{ fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: 0 }}>{h}</p>
              ))}
            </div>
            <div style={{ marginTop: 4 }}>
              {RESULTS.map((r, i) => <TestRow key={r.id} r={r} delay={i * 60} />)}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 4 — NON-CONFORMITY DETAIL ══════ */}
        <section>
          <Card style={{ borderLeft: `4px solid ${T.danger}`, background: 'linear-gradient(145deg, #1C0F0F 0%, #201520 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color={T.danger} />
                <span style={{ fontWeight: 800, fontSize: 16, color: T.textPri }}>Non-Conformité Détectée</span>
              </div>
              <Bdg label="Action Requise" color={T.danger} bg={`${T.danger}20`} pulse icon={AlertTriangle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 20 }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: T.textDim, width: 70 }}>Test</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.gold, fontSize: 13 }}>LAB-140</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: T.textDim, width: 70 }}>Batch</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: T.textSec }}>BN-0140</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: T.textDim, width: 70 }}>Type</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>Slump</span>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: T.textDim, margin: '0 0 4px' }}>Résultat mesuré</p>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color: T.danger, margin: 0 }}>22 cm</p>
                  <p style={{ fontSize: 11, color: T.textDim, margin: '4px 0 0' }}>Norme: 15-20 cm</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.danger, marginTop: 4 }}>+10% hors tolérance</p>
                </div>
              </div>
              {/* Right */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: T.textDim, width: 110 }}>Cause probable</span>
                  <span style={{ fontSize: 13, color: T.textSec }}>Excès d'eau dans le mélange</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: T.textDim, width: 110 }}>Formule</span>
                  <Bdg label="B35-HP" color={T.purple} bg={`${T.purple}15`} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: T.textDim, width: 110 }}>Opérateur</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.textSec }}><User size={11} /> Youssef M.</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: T.textDim, width: 110 }}>Heure</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: T.textSec }}>11:48</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: `1px solid ${T.danger}30` }}>
              <ActionBtn label="Créer Rapport NC"     icon={FileText}     bg={T.danger}   textCol="#fff"    fill />
              <ActionBtn label="Ajuster Formule"      icon={FlaskConical} outline={T.gold}                        />
              <ActionBtn label="Notifier Responsable" icon={Bell}         outline={T.info}                        />
            </div>
          </Card>
        </section>

        {/* ══════ SECTION 5 — DISTRIBUTION ══════ */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Donut by type */}
            <div style={chartStyle}>
              <SectionHeader icon={FlaskConical} label="Par Type de Test" />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width={220} height={190}>
                  <PieChart>
                    <Pie data={TYPE_DIST} cx={105} cy={88} innerRadius={55} outerRadius={82}
                      dataKey="count" startAngle={90} endAngle={-270}
                      isAnimationActive animationDuration={800}
                      activeIndex={activePie ?? undefined} activeShape={renderActiveShape}
                      onMouseEnter={(_: any, i: number) => setActivePie(i)} onMouseLeave={() => setActivePie(null)}
                    >
                      {TYPE_DIST.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                    </Pie>
                    <RechartsTooltip content={<TypeTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -56%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 800, color: T.gold, lineHeight: 1, margin: 0 }}>8</p>
                  <p style={{ fontSize: 9, color: T.textDim, margin: 0 }}>tests</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {TYPE_DIST.map((d, i) => {
                  const Icon = TEST_TYPE_ICON[d.name] ?? FlaskConical;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={12} color={d.color} />
                      <span style={{ flex: 1, fontSize: 12, color: T.textSec }}>{d.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: d.color, fontWeight: 700 }}>{d.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stacked bar by batch */}
            <div style={chartStyle}>
              <SectionHeader icon={TrendingUp} label="Par Batch" />
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={BATCH_DIST} layout="vertical" margin={{ top: 2, right: 30, left: 10, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[0, 1]} />
                  <YAxis type="category" dataKey="batch" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} width={80} />
                  <RechartsTooltip content={<BatchTooltip />} cursor={{ fill: `${T.gold}08` }} />
                  <Bar dataKey="conf"    name="Conformes"   fill={T.success} radius={[0,4,4,0]} stackId="a" isAnimationActive animationDuration={1000} />
                  <Bar dataKey="nonConf" name="Non-conf."   fill={T.danger}  radius={[0,4,4,0]} stackId="a" isAnimationActive animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ══════ SECTION 6 — PENDING RESULTS ══════ */}
        <section>
          <SectionHeader
            icon={Clock}
            label="Résultats en Attente"
            right={<Bdg label="2 tests" color={T.warning} bg={`${T.warning}15`} pulse />}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {PENDING.map((p, i) => <PendingCard key={p.id} p={p} delay={i * 120} />)}
          </div>
        </section>

        {/* ══════ SECTION 7 — NORMS REFERENCE ══════ */}
        <section>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookOpen size={16} color={T.gold} />
                <span style={{ color: T.gold, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>Référentiel Normes</span>
                <span style={{ fontSize: 10, color: T.textDim, padding: '2px 6px', background: '#0D1627', borderRadius: 6, border: `1px solid ${T.cardBorder}` }}>NM 10.1.008</span>
              </div>
            </div>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.6fr 0.8fr', padding: '8px 12px', borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 4 }}>
              {['Test', 'Norme', 'Unité', 'Tolérance'].map((h, i) => (
                <p key={i} style={{ fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: 0 }}>{h}</p>
              ))}
            </div>
            {visibleNorms.map((n, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.6fr 0.8fr', padding: '9px 12px', borderRadius: 8,
                background: i % 2 === 0 ? '#0D162708' : 'transparent',
                borderBottom: i < visibleNorms.length - 1 ? `1px solid ${T.cardBorder}40` : 'none',
              }}>
                <span style={{ fontSize: 12, color: T.textSec }}>{n.test}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textPri, fontWeight: 700 }}>{n.norme}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim }}>{n.unite}</span>
                <span style={{ fontSize: 11, color: T.textDim }}>{n.tolerance}</span>
              </div>
            ))}
            <button
              onClick={() => setNormsExpanded(e => !e)}
              style={{
                marginTop: 12, display: 'flex', alignItems: 'center', gap: 5,
                background: 'transparent', border: 'none', color: T.gold,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 0',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {normsExpanded ? <><ChevronUp size={14} /> Réduire</> : <><ChevronDown size={14} /> Voir tout ({NORMS.length - 4} de plus)</>}
            </button>
          </Card>
        </section>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// ACTION BUTTON HELPER
// ─────────────────────────────────────────────────────
function ActionBtn({ label, icon: Icon, bg, textCol, fill, outline }: { label: string; icon: React.ElementType; bg?: string; textCol?: string; fill?: boolean; outline?: string }) {
  const [hov, setHov] = useState(false);
  const color = fill ? (textCol ?? '#fff') : (outline ?? T.gold);
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
        background: fill ? (hov ? `${bg}CC` : bg) : (hov ? `${outline}18` : 'transparent'),
        border: fill ? 'none' : `1px solid ${outline}50`,
        borderRadius: 9, color, fontWeight: 700, fontSize: 12, cursor: 'pointer',
        transition: 'all 160ms', fontFamily: 'DM Sans, sans-serif',
        transform: hov ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      <Icon size={13} /> {label}
    </button>
  );
}
