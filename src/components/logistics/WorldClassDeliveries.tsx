import { useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Truck, Package, Clock, MapPin, CheckCircle, ClipboardCheck,
  Bell, TrendingUp,
} from 'lucide-react';
import WorldClassDeliveryArchive from '@/components/archive/WorldClassDeliveryArchive';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
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
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target * 10) / 10);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
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
      animation: pulse ? 'tbos-pulse 2.5s infinite' : 'none',
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
// MOCK DATA
// ─────────────────────────────────────────────────────
const DELIVERIES = [
  { bl: 'BL-2024-098', client: 'Ciments du Maroc', dest: 'Casablanca Ain Sebaa', product: 'B25', vol: 12.5, truck: 'TK-03', driver: 'Ahmed B.', depart: '13:45', status: 'Livré', statusColor: T.success },
  { bl: 'BL-2024-097', client: 'ONCF',             dest: 'Rabat Agdal',          product: 'B30', vol: 8.0,  truck: 'TK-01', driver: 'Khalid M.', depart: '12:30', status: 'Livré', statusColor: T.success },
  { bl: 'BL-2024-096', client: 'Addoha',           dest: 'Casa Sidi Moumen',     product: 'B25', vol: 15.0, truck: 'TK-02', driver: 'Youssef R.', depart: '11:00', status: 'En route', statusColor: T.info },
  { bl: 'BL-2024-095', client: 'Tgcc',             dest: 'Mohammedia',           product: 'B35', vol: 10.2, truck: 'TK-03', driver: 'Ahmed B.', depart: '09:15', status: 'En route', statusColor: T.info },
  { bl: 'BL-2024-094', client: 'Alliances',        dest: 'Marrakech',            product: 'B30', vol: 8.5,  truck: 'TK-01', driver: 'Khalid M.', depart: '08:00', status: 'Chargement', statusColor: T.warning },
  { bl: 'BL-2024-093', client: 'Jet Contractors',  dest: 'Tanger',               product: 'Spécial', vol: 6.0, truck: 'TK-04', driver: 'Hassan L.', depart: '07:30', status: 'Confirmé', statusColor: T.gold },
];

const FLEET = [
  { name: 'TK-01', status: 'Disponible', statusColor: T.success, driver: 'Khalid M.', location: 'Base', trips: 2, maxTrips: 4 },
  { name: 'TK-02', status: 'En route',   statusColor: T.info,    driver: 'Youssef R.', location: 'Sidi Moumen', trips: 1, maxTrips: 4 },
  { name: 'TK-03', status: 'En route',   statusColor: T.info,    driver: 'Ahmed B.', location: 'Mohammedia', trips: 2, maxTrips: 4 },
  { name: 'TK-04', status: 'Disponible', statusColor: T.success, driver: 'Hassan L.', location: 'Base', trips: 1, maxTrips: 4 },
];

const PERF_DATA = [
  { day: 'Lun', livraisons: 8, volume: 92 },
  { day: 'Mar', livraisons: 6, volume: 74 },
  { day: 'Mer', livraisons: 7, volume: 85 },
  { day: 'Jeu', livraisons: 9, volume: 108 },
  { day: 'Ven', livraisons: 5, volume: 62 },
  { day: 'Sam', livraisons: 3, volume: 38 },
];

const PIPELINE_STAGES = [
  { label: 'Chargement', count: 1, color: T.warning, icon: Package },
  { label: 'En Route',   count: 2, color: T.info,    icon: Truck },
  { label: 'Livré',      count: 2, color: T.success,  icon: CheckCircle },
  { label: 'Confirmé',   count: 1, color: T.gold,     icon: ClipboardCheck },
];

const PRODUCT_COLORS: Record<string, string> = {
  B25: T.gold, B30: T.info, B35: T.success, B40: T.purple, 'Spécial': T.pink,
};

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
            <p style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
              {typeof animated === 'number' && suffix === 'm³' ? animated.toFixed(1) : animated}
              <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginLeft: 4 }}>{suffix}</span>
            </p>
            <p style={{ fontSize: 11, color: trendPositive ? T.success : T.danger, marginTop: 6, fontWeight: 600 }}>
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
// PIPELINE STAGE CARD
// ─────────────────────────────────────────────────────
function PipelineCard({ stage, delay = 0 }: { stage: typeof PIPELINE_STAGES[0]; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const animated = useAnimatedCounter(stage.count, 800);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const Icon = stage.icon;

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.9)', transition: 'all 500ms ease-out', flex: 1 }}>
      <Card style={{ textAlign: 'center', padding: '24px 16px' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: `${stage.color}18`, border: `2px solid ${stage.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          animation: stage.count > 0 ? 'tbos-pulse 3s infinite' : 'none',
        }}>
          <Icon size={22} color={stage.color} />
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 36, fontWeight: 800, color: stage.color, lineHeight: 1 }}>{animated}</p>
        <p style={{ color: T.textSec, fontSize: 12, fontWeight: 600, marginTop: 6 }}>{stage.label}</p>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// DELIVERY ROW
// ─────────────────────────────────────────────────────
function DeliveryRow({ d, delay = 0 }: { d: typeof DELIVERIES[0]; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const isPulsing = d.status === 'En route' || d.status === 'Chargement';

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
        borderRadius: 10, padding: '14px 18px',
        boxShadow: hov ? `0 4px 20px rgba(0,0,0,0.2), 0 0 12px ${T.goldGlow}` : '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* BL + Client */}
        <div style={{ minWidth: 160 }}>
          <p style={{ color: T.textDim, fontSize: 11, marginBottom: 2 }}>{d.bl}</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: T.textPri }}>{d.client}</p>
          <p style={{ color: T.textSec, fontSize: 11 }}>{d.dest}</p>
        </div>

        {/* Product */}
        <span style={{
          padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: `${PRODUCT_COLORS[d.product] || T.gold}18`,
          color: PRODUCT_COLORS[d.product] || T.gold,
          border: `1px solid ${PRODUCT_COLORS[d.product] || T.gold}40`,
        }}>{d.product}</span>

        {/* Volume */}
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: T.gold }}>
          {d.vol} m³
        </p>

        {/* Truck + Driver */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ padding: '2px 8px', borderRadius: 6, background: `${T.info}18`, color: T.info, fontSize: 11, fontWeight: 600, border: `1px solid ${T.info}30` }}>{d.truck}</span>
          <span style={{ color: T.textDim, fontSize: 11 }}>{d.driver}</span>
        </div>

        {/* Depart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} color={T.textDim} />
          <span style={{ color: T.textDim, fontSize: 11 }}>{d.depart}</span>
        </div>

        {/* Status */}
        <div style={{ marginLeft: 'auto' }}>
          <Badge label={d.status} color={d.statusColor} bg={`${d.statusColor}18`} pulse={isPulsing} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// FLEET CARD
// ─────────────────────────────────────────────────────
function FleetCard({ truck, delay = 0 }: { truck: typeof FLEET[0]; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const isPulsing = truck.status === 'En route';
  const tripPct = (truck.trips / truck.maxTrips) * 100;

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 500ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${truck.statusColor}18`, border: `1px solid ${truck.statusColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={20} color={truck.statusColor} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15, color: T.textPri, marginBottom: 4 }}>{truck.name}</p>
            <Badge label={truck.status} color={truck.statusColor} bg={`${truck.statusColor}18`} pulse={isPulsing} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: T.textSec, fontSize: 12, marginBottom: 2 }}>{truck.driver}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} color={T.textDim} />
            <p style={{ color: T.textDim, fontSize: 11 }}>{truck.location}</p>
          </div>
        </div>
        {/* Trips bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: T.textDim, fontSize: 10 }}>Trajets aujourd'hui</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.gold }}>{truck.trips}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: `${T.cardBorder}`, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${tripPct}%`, background: `linear-gradient(90deg, ${truck.statusColor}, ${truck.statusColor}99)`, borderRadius: 2, transition: 'width 1s ease-out' }} />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#162036', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassDeliveries() {
  const [activeTab, setActiveTab] = useState('aujourdhui');
  const tabs = [
    { id: 'aujourdhui', label: "Aujourd'hui" },
    { id: 'semaine', label: 'Cette semaine' },
    { id: 'historique', label: 'Historique' },
  ];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.navy, minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.85} }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`, padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, #B8860B)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={18} color={T.navy} />
            </div>
            <div>
              <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>Livraisons</span>
              <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1, marginTop: 1 }}>Suivi des livraisons</p>
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
            <LiveClock />
            <div style={{ position: 'relative' }}>
              <Bell size={18} color={T.textSec} />
              <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: T.danger }} />
            </div>
            <button style={{
              padding: '7px 16px', borderRadius: 8, background: T.gold, color: T.navy,
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12,
              border: 'none', cursor: 'pointer',
            }}>
              + Nouvelle Livraison
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
            <KPICard label="Livraisons Aujourd'hui" value={6}    suffix=""    color={T.gold}    icon={Truck}      trend="+2 vs hier"    trendPositive delay={0} />
            <KPICard label="Volume Livré"            value={68.5} suffix="m³"  color={T.gold}    icon={Package}    trend="+15% vs hier"  trendPositive delay={80} />
            <KPICard label="Taux de Ponctualité"     value={92}   suffix="%"   color={T.success} icon={Clock}      trend="+3% vs hier"   trendPositive delay={160} />
            <KPICard label="En Route"                value={2}    suffix=""    color={T.info}    icon={MapPin}     trend="stable"        trendPositive delay={240} />
          </div>
        </section>

        {/* ── SECTION 2: PIPELINE ── */}
        <section>
          <SectionHeader icon={Truck} label="Pipeline de Livraison" />
          <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 16 }}>
                <PipelineCard stage={stage} delay={i * 100} />
                {i < PIPELINE_STAGES.length - 1 && (
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ color: T.textDim, fontSize: 22, fontWeight: 300, lineHeight: 1 }}>→</div>
                    <div style={{ width: 2, height: 8, background: `linear-gradient(${T.gold}40, transparent)` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3: TODAY'S DELIVERIES ── */}
        <section>
          <SectionHeader
            icon={Package}
            label="Livraisons Aujourd'hui"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2s infinite' }} />
                <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Live</span>
              </div>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DELIVERIES.map((d, i) => <DeliveryRow key={d.bl} d={d} delay={i * 60} />)}
          </div>
        </section>

        {/* ── SECTION 4: FLEET STATUS ── */}
        <section>
          <SectionHeader icon={Truck} label="Statut de la Flotte" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {FLEET.map((truck, i) => <FleetCard key={truck.name} truck={truck} delay={i * 80} />)}
          </div>
        </section>

        {/* ── SECTION 5: PERFORMANCE CHART ── */}
        <section>
          <SectionHeader
            icon={TrendingUp}
            label="Performance Hebdomadaire"
            right={
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.gold }}>
                38 livraisons • 459 m³
              </span>
            }
          />
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={PERF_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${T.cardBorder}`} vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 11 }} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: `${T.gold}08` }} />
                <Bar dataKey="livraisons" name="Livraisons" fill={T.gold} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000} />
                <Bar dataKey="volume" name="Volume (m³)" fill={T.info} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000} animationBegin={200} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>TBOS Livraisons v2.0 — {new Date().toLocaleString('fr-FR')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Système opérationnel</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
