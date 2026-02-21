import { useEffect, useRef, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, BarChart, Sector,
} from 'recharts';
import {
  Truck, Package, Clock, Banknote, Download, Search,
  ChevronDown, CheckCircle, AlertTriangle, TrendingUp, FileText,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#FFD700',
  goldGlow:   'rgba(255,215,0,0.18)',
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
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

const PRODUCT_COLORS: Record<string, string> = {
  B25: T.gold, B30: T.info, B35: T.success, B40: T.purple, 'Spécial': T.pink,
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
      const v = Math.round((1 - Math.pow(1 - p, 3)) * target);
      setValue(v);
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
function Card({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        background: T.cardBg, border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden',
        transform: press ? 'translateY(-1px) scale(0.998)' : hov ? 'translateY(-4px) scale(1.005)' : 'none',
        boxShadow: hov ? `0 14px 36px rgba(0,0,0,0.32), 0 0 28px ${T.goldGlow}` : '0 4px 14px rgba(0,0,0,0.12)',
        transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)', ...style,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 220ms' }} />
      {children}
    </div>
  );
}

function Bdg({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`, color, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.04em', flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
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
const TREND = [
  { month: 'Sep', livraisons: 98,  volume: 1180, ca: 590 },
  { month: 'Oct', livraisons: 112, volume: 1340, ca: 670 },
  { month: 'Nov', livraisons: 105, volume: 1260, ca: 630 },
  { month: 'Déc', livraisons: 128, volume: 1540, ca: 770 },
  { month: 'Jan', livraisons: 120, volume: 1440, ca: 720 },
  { month: 'Fév', livraisons: 142, volume: 1685, ca: 847 },
];

const BY_PRODUCT = [
  { name: 'B25',     deliveries: 62, volume: 745, color: T.gold   },
  { name: 'B30',     deliveries: 38, volume: 420, color: T.info   },
  { name: 'B35',     deliveries: 22, volume: 285, color: T.success },
  { name: 'B40',     deliveries: 12, volume: 148, color: T.purple  },
  { name: 'Spécial', deliveries: 8,  volume: 87,  color: T.pink    },
];

const BY_CLIENT = [
  { client: 'Ciments du Maroc', count: 32, color: T.gold    },
  { client: 'ONCF',             count: 28, color: T.info    },
  { client: 'Addoha',           count: 24, color: T.success  },
  { client: 'Alliances',        count: 18, color: T.purple   },
  { client: 'Tgcc',             count: 16, color: T.warning  },
  { client: 'Autres',           count: 24, color: T.textSec  },
];

const ENTRIES = [
  { bl: 'BL-2024-098', date: '20 Fév', client: 'Ciments du Maroc', dest: 'Casa Ain Sebaa',    product: 'B25',     vol: 12.5, truck: 'TK-03', driver: 'Ahmed B.',    duree: '1h15', status: 'Livré' },
  { bl: 'BL-2024-097', date: '20 Fév', client: 'ONCF',             dest: 'Rabat Agdal',       product: 'B30',     vol: 8.0,  truck: 'TK-01', driver: 'Khalid M.',   duree: '2h30', status: 'Livré' },
  { bl: 'BL-2024-096', date: '19 Fév', client: 'Addoha',           dest: 'Casa Sidi Moumen',  product: 'B25',     vol: 15.0, truck: 'TK-02', driver: 'Youssef R.',  duree: '0h45', status: 'Livré' },
  { bl: 'BL-2024-095', date: '19 Fév', client: 'Tgcc',             dest: 'Mohammedia',        product: 'B35',     vol: 10.2, truck: 'TK-03', driver: 'Ahmed B.',    duree: '1h00', status: 'Livré' },
  { bl: 'BL-2024-094', date: '18 Fév', client: 'Alliances',        dest: 'Marrakech',         product: 'B30',     vol: 8.5,  truck: 'TK-01', driver: 'Khalid M.',   duree: '3h45', status: 'Livré' },
  { bl: 'BL-2024-093', date: '18 Fév', client: 'Jet Contractors',  dest: 'Tanger',            product: 'Spécial', vol: 6.0,  truck: 'TK-04', driver: 'Hassan L.',   duree: '4h00', status: 'Livré' },
  { bl: 'BL-2024-092', date: '17 Fév', client: 'Ciments du Maroc', dest: 'Casa Ain Sebaa',    product: 'B25',     vol: 14.0, truck: 'TK-02', driver: 'Youssef R.',  duree: '1h10', status: 'Livré' },
  { bl: 'BL-2024-091', date: '17 Fév', client: 'ONCF',             dest: 'Kénitra',           product: 'B30',     vol: 9.5,  truck: 'TK-03', driver: 'Ahmed B.',    duree: '1h45', status: 'Livré' },
  { bl: 'BL-2024-090', date: '16 Fév', client: 'Addoha',           dest: 'Berrechid',         product: 'B25',     vol: 11.0, truck: 'TK-01', driver: 'Khalid M.',   duree: '1h30', status: 'Livré' },
  { bl: 'BL-2024-089', date: '16 Fév', client: 'Palmeraie',        dest: 'Marrakech',         product: 'B35',     vol: 7.8,  truck: 'TK-04', driver: 'Hassan L.',   duree: '3h30', status: 'Livré' },
  { bl: 'BL-2024-088', date: '15 Fév', client: 'Tgcc',             dest: 'Mohammedia',        product: 'B40',     vol: 6.5,  truck: 'TK-02', driver: 'Youssef R.',  duree: '0h55', status: 'Retour' },
  { bl: 'BL-2024-087', date: '15 Fév', client: 'Résidences Dar',   dest: 'Témara',            product: 'B25',     vol: 13.2, truck: 'TK-03', driver: 'Ahmed B.',    duree: '0h40', status: 'Livré' },
];

const FLEET = [
  { truck: 'TK-01', livraisons: 38, volume: 425, km: 4200, duree: '2h10', dureeH: 2.17 },
  { truck: 'TK-02', livraisons: 42, volume: 498, km: 3800, duree: '1h25', dureeH: 1.42 },
  { truck: 'TK-03', livraisons: 36, volume: 412, km: 3500, duree: '1h15', dureeH: 1.25 },
  { truck: 'TK-04', livraisons: 26, volume: 350, km: 5100, duree: '3h20', dureeH: 3.33 },
];

const MAX_FLEET_DEL = 42;

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
function dureeColor(d: string) {
  const parts = d.replace('h', ':').split(':');
  const h = parseInt(parts[0]) + (parseInt(parts[1] || '0') / 60);
  if (h < 2) return T.success;
  if (h <= 3) return T.warning;
  return T.danger;
}

// ─────────────────────────────────────────────────────
// TOOLTIPS
// ─────────────────────────────────────────────────────
function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: T.gold, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{label}</p>
      <p style={{ color: T.gold, fontSize: 12 }}>Livraisons: <strong>{payload[0]?.value}</strong></p>
      <p style={{ color: T.info, fontSize: 12 }}>Volume: <strong>{payload[1]?.value?.toLocaleString('fr-MA')} m³</strong></p>
      <p style={{ color: T.success, fontSize: 12 }}>CA: <strong>{payload[2]?.value}K DH</strong></p>
    </div>
  );
}

function ProductTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: d.color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: T.textPri, fontSize: 12 }}>{d.deliveries} livraisons</p>
      <p style={{ color: T.textSec, fontSize: 12 }}>{d.volume} m³</p>
    </div>
  );
}

function ClientTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const total = BY_CLIENT.reduce((s, c) => s + c.count, 0);
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: d.color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{d.client}</p>
      <p style={{ color: T.textPri, fontSize: 12 }}>{d.count} livraisons</p>
      <p style={{ color: T.textSec, fontSize: 12 }}>{((d.count / total) * 100).toFixed(1)}%</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, delay = 0 }: {
  label: string; value: number; suffix?: string; color: string; icon: React.ElementType; trend?: string; delay?: number;
}) {
  const animated = useAnimatedCounter(value);
  const vis = useFadeIn(delay);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(20px)', transition: 'all 550ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
              {animated.toLocaleString('fr-MA')}
              {suffix && <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginLeft: 4 }}>{suffix}</span>}
            </p>
            {trend && <p style={{ fontSize: 10, fontWeight: 600, marginTop: 6, color: T.success }}>↑ {trend}</p>}
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
// TABLE ROW
// ─────────────────────────────────────────────────────
function DeliveryRow({ e, delay = 0 }: { e: typeof ENTRIES[0]; delay?: number }) {
  const vis = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const sColor = e.status === 'Livré' ? T.success : T.warning;
  const StatusIcon = e.status === 'Livré' ? CheckCircle : AlertTriangle;
  const pColor = PRODUCT_COLORS[e.product] ?? T.textSec;
  const dColor = dureeColor(e.duree);

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '0.9fr 0.5fr 1fr 1fr 0.5fr 0.45fr 0.4fr 0.65fr 0.4fr 0.6fr',
        alignItems: 'center', gap: 8,
        borderLeft: `4px solid ${sColor}`, borderRadius: 10,
        padding: '12px 14px',
        background: hov ? '#1A2B45' : 'transparent',
        borderBottom: `1px solid ${T.cardBorder}`,
        opacity: vis ? 1 : 0,
        transform: vis ? (hov ? 'translateX(4px)' : 'translateX(0)') : 'translateY(16px)',
        transition: 'all 300ms ease-out',
        cursor: 'default',
      }}
    >
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim }}>{e.bl}</p>
      <p style={{ fontSize: 12, color: T.textDim }}>{e.date}</p>
      <p style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{e.client}</p>
      <p style={{ fontSize: 12, color: T.textSec }}>{e.dest}</p>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999, background: `${pColor}18`, border: `1px solid ${pColor}40`, color: pColor, fontSize: 10, fontWeight: 700 }}>{e.product}</span>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: T.gold, fontWeight: 700 }}>{e.vol}m³</p>
      <span style={{ padding: '2px 6px', borderRadius: 6, background: `${T.textSec}15`, color: T.textSec, fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{e.truck}</span>
      <p style={{ fontSize: 11, color: T.textDim }}>{e.driver}</p>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: dColor }}>{e.duree}</p>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: `${sColor}15`, border: `1px solid ${sColor}40`, color: sColor, fontSize: 10, fontWeight: 700 }}>
        <StatusIcon size={9} /> {e.status}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// FLEET CARD
// ─────────────────────────────────────────────────────
function FleetCard({ f, delay = 0 }: { f: typeof FLEET[0]; delay?: number }) {
  const vis = useFadeIn(delay);
  const livAnim = useAnimatedCounter(f.livraisons, 1000);
  const barW = useBarWidth((f.livraisons / MAX_FLEET_DEL) * 100, delay);
  const dColor = f.dureeH < 2 ? T.success : f.dureeH <= 3 ? T.warning : T.danger;

  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(20px)', transition: 'all 500ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${T.gold}18`, border: `1px solid ${T.gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={20} color={T.gold} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 16, color: T.textPri }}>{f.truck}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ background: '#0D1627', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: 9, color: T.textDim, marginBottom: 2 }}>LIVRAISONS</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: T.gold }}>{livAnim}</p>
          </div>
          <div style={{ background: '#0D1627', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: 9, color: T.textDim, marginBottom: 2 }}>VOLUME</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: T.textPri }}>{f.volume} m³</p>
          </div>
          <div style={{ background: '#0D1627', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: 9, color: T.textDim, marginBottom: 2 }}>KM PARCOURUS</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: T.textPri }}>{f.km.toLocaleString('fr-MA')} km</p>
          </div>
          <div style={{ background: '#0D1627', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: 9, color: T.textDim, marginBottom: 2 }}>DURÉE MOY.</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: dColor }}>{f.duree}</p>
          </div>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: T.cardBorder, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barW}%`, background: `linear-gradient(90deg, ${T.gold}, #FFE033)`, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${T.gold}50` }} />
        </div>
        <p style={{ fontSize: 9, color: T.textDim, marginTop: 4 }}>{((f.livraisons / MAX_FLEET_DEL) * 100).toFixed(0)}% du max</p>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PERFORMANCE CARD
// ─────────────────────────────────────────────────────
function PerfCard({ label, value, unit, target, status, delay = 0 }: {
  label: string; value: number; unit: string; target: string; status: string; delay?: number;
}) {
  const intTarget = parseFloat(target);
  const barW = useBarWidth(Math.min((value / intTarget) * 100, 100), delay);
  const vis = useFadeIn(delay);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(20px)', transition: 'all 550ms ease-out' }}>
      <Card>
        <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color: T.success, lineHeight: 1.1, marginBottom: 4 }}>
          {value}<span style={{ fontSize: 13, color: T.textSec, marginLeft: 4 }}>{unit}</span>
        </p>
        <p style={{ fontSize: 11, color: T.textDim, marginBottom: 12 }}>Objectif: {target}</p>
        <div style={{ height: 5, borderRadius: 99, background: T.cardBorder, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${barW}%`, background: T.success, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${T.success}50` }} />
        </div>
        <Bdg label={status} color={T.success} bg={`${T.success}15`} />
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassDeliveryArchive() {
  const [activeTab, setActiveTab] = useState('Ce mois');
  const [hoverExport, setHoverExport] = useState(false);
  const [search, setSearch] = useState('');
  const [activePie, setActivePie] = useState<number | null>(null);

  const tabs = ['Ce mois', 'Ce trimestre', 'Cette année', 'Tout'];

  const chartStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
    border: `1px solid ${T.cardBorder}`,
    borderRadius: 14, padding: 24,
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

  const filteredEntries = ENTRIES.filter(e =>
    e.bl.toLowerCase().includes(search.toLowerCase()) ||
    e.client.toLowerCase().includes(search.toLowerCase()) ||
    e.dest.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: T.navy, fontFamily: 'DM Sans, sans-serif', color: T.textPri, paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input::placeholder { color: #64748B; }
      `}</style>

      {/* ══════════════════════════ PAGE HEADER ══════════════════════════ */}
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
              <Truck size={22} color={T.gold} />
              <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 26, color: T.textPri, margin: 0 }}>Archive Livraisons</h1>
            </div>
            <p style={{ color: T.textDim, fontSize: 13, margin: 0 }}>Historique complet des livraisons</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '8px 14px', background: '#111B2E', border: `1px solid ${T.cardBorder}`, borderRadius: 8, fontSize: 12, color: T.textSec, fontFamily: 'JetBrains Mono, monospace' }}>
              01 Fév — 20 Fév 2024
            </div>
            <button
              onMouseEnter={() => setHoverExport(true)} onMouseLeave={() => setHoverExport(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
                background: hoverExport ? '#FFE033' : T.gold, color: T.navy,
                border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13,
                cursor: 'pointer', transition: 'all 180ms', fontFamily: 'DM Sans, sans-serif',
                transform: hoverExport ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              <Download size={15} /> Exporter
            </button>
          </div>
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
          <SectionHeader icon={TrendingUp} label="Indicateurs Clés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            <KPICard label="Total Livraisons"       value={142}  color={T.gold}    icon={Truck}    trend="+18% vs mois dernier" delay={0}   />
            <KPICard label="Volume Total"           value={1685} suffix="m³"       color={T.gold}    icon={Package}  trend="+12% ↑"               delay={80}  />
            <KPICard label="Ponctualité Moyenne"   value={91}   suffix="%"        color={T.success} icon={Clock}    trend="+2%"                  delay={160} />
            <KPICard label="CA Livraisons"          value={847}  suffix="K DH"     color={T.gold}    icon={Banknote} trend="+15%"                 delay={240} />
          </div>
        </section>

        {/* ══════ SECTION 2 — TREND CHART ══════ */}
        <section>
          <div style={chartStyle}>
            <SectionHeader icon={TrendingUp} label="Évolution Mensuelle" sub="6 derniers mois" />
            <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
              {[{ label: 'Livraisons', color: T.gold }, { label: 'Volume m³', color: T.info }, { label: 'CA K DH', color: T.success }].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: i === 0 ? 10 : 2, borderRadius: i === 0 ? 3 : 0, background: l.color }} />
                  <span style={{ fontSize: 11, color: T.textSec }}>{l.label}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={TREND} margin={{ top: 4, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 11 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[80, 160]} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}K`} domain={[1000, 1800]} />
                <RechartsTooltip content={<TrendTooltip />} cursor={{ fill: `${T.gold}08` }} />
                <Bar yAxisId="left" dataKey="livraisons" name="Livraisons" fill={T.gold} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000} />
                <Line yAxisId="right" type="monotone" dataKey="volume" name="Volume" stroke={T.info} strokeWidth={2} dot={{ fill: T.info, r: 3 }} isAnimationActive animationDuration={1200} />
                <Line yAxisId="left" type="monotone" dataKey="ca" name="CA" stroke={T.success} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive animationDuration={1200} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ══════ SECTION 3 — BREAKDOWN ══════ */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Donut by Product */}
            <div style={chartStyle}>
              <SectionHeader icon={Package} label="Par Produit" />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width={220} height={190}>
                  <PieChart>
                    <Pie data={BY_PRODUCT} cx={105} cy={90} innerRadius={58} outerRadius={84}
                      dataKey="deliveries" startAngle={90} endAngle={-270}
                      isAnimationActive animationDuration={800}
                      activeIndex={activePie ?? undefined} activeShape={renderActiveShape}
                      onMouseEnter={(_: any, i: number) => setActivePie(i)} onMouseLeave={() => setActivePie(null)}
                    >
                      {BY_PRODUCT.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                    </Pie>
                    <RechartsTooltip content={<ProductTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -58%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 800, color: T.gold, lineHeight: 1 }}>142</p>
                  <p style={{ fontSize: 9, color: T.textDim }}>livraisons</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {BY_PRODUCT.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: T.textSec }}>{d.name}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: d.color, fontWeight: 700 }}>{d.deliveries}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.textDim }}>{d.volume} m³</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal bar by Client */}
            <div style={chartStyle}>
              <SectionHeader icon={Truck} label="Par Client" />
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={BY_CLIENT} layout="vertical" margin={{ top: 2, right: 50, left: 10, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[0, 36]} />
                  <YAxis type="category" dataKey="client" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 11 }} width={120} />
                  <RechartsTooltip content={<ClientTooltip />} cursor={{ fill: `${T.gold}08` }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1000}
                    label={{ position: 'right', formatter: (v: number) => `${v}`, style: { fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fill: T.textSec } }}>
                    {BY_CLIENT.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ══════ SECTION 4 — PERFORMANCE METRICS ══════ */}
        <section>
          <SectionHeader icon={TrendingUp} label="Métriques de Performance" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            <PerfCard label="Ponctualité"              value={91}   unit="%" target="90"  status="Au-dessus" delay={0}   />
            <PerfCard label="Taux de Réclamation"     value={2.8}  unit="%" target="5"   status="OK"        delay={80}  />
            <PerfCard label="Volume Moy. / Livraison" value={11.9} unit="m³" target="10" status="Au-dessus" delay={160} />
          </div>
        </section>

        {/* ══════ SECTION 5 — HISTORY TABLE ══════ */}
        <section>
          <div style={chartStyle}>
            <SectionHeader icon={FileText} label="Historique des Livraisons" right={<span style={{ color: T.textDim, fontSize: 11 }}>{filteredEntries.length} entrées</span>} />
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' as const }}>
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <Search size={14} color={T.textDim} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par BL, client, destination..."
                  style={{
                    width: '100%', padding: '9px 12px 9px 36px', background: '#0D1627',
                    border: `1px solid ${T.cardBorder}`, borderRadius: 8, color: T.textPri,
                    fontSize: 12, outline: 'none', boxSizing: 'border-box' as const,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  onFocus={e => (e.target.style.borderColor = `${T.gold}80`)}
                  onBlur={e => (e.target.style.borderColor = T.cardBorder)}
                />
              </div>
              {['Tous les produits', 'Tous les statuts'].map((lbl, i) => (
                <button key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                  background: '#0D1627', border: `1px solid ${T.cardBorder}`,
                  borderRadius: 8, color: T.textSec, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {lbl} <ChevronDown size={12} />
                </button>
              ))}
            </div>
            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '0.9fr 0.5fr 1fr 1fr 0.5fr 0.45fr 0.4fr 0.65fr 0.4fr 0.6fr',
              padding: '0 14px 10px', gap: 8, borderBottom: `1px solid ${T.cardBorder}`,
            }}>
              {['BL #', 'Date', 'Client', 'Destination', 'Produit', 'Vol.', 'Camion', 'Chauffeur', 'Durée', 'Statut'].map((h, i) => (
                <p key={i} style={{ fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: 0 }}>{h}</p>
              ))}
            </div>
            <div style={{ marginTop: 4 }}>
              {filteredEntries.map((e, i) => <DeliveryRow key={e.bl} e={e} delay={i * 40} />)}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 6 — FLEET PERFORMANCE ══════ */}
        <section>
          <SectionHeader icon={Truck} label="Performance Flotte" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {FLEET.map((f, i) => <FleetCard key={f.truck} f={f} delay={i * 80} />)}
          </div>
        </section>

      </div>
    </div>
  );
}
