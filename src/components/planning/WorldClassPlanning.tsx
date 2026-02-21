import { useEffect, useRef, useState } from 'react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
} from 'recharts';
import {
  FileText, BarChart3, Truck, Bell, CalendarDays, Clock,
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
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
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
      <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>{label}</span>
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
  B25: T.gold, B30: T.info, B35: T.success, B40: T.purple, 'Spécial': T.pink,
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

const deliveries = [
  { date: "Aujourd'hui 14:00", client: 'Ciments du Maroc', product: 'B25', volume: 12.5, truck: 'TK-03', status: 'En route', statusColor: T.success },
  { date: "Aujourd'hui 16:30", client: 'ONCF', product: 'B30', volume: 8.0, truck: 'TK-01', status: 'Planifié', statusColor: T.info },
  { date: 'Demain 07:00', client: 'Addoha Group', product: 'B25', volume: 15.0, truck: 'TK-02', status: 'Planifié', statusColor: T.info },
  { date: 'Demain 09:30', client: 'Tgcc', product: 'B35', volume: 10.0, truck: 'TK-03', status: 'Planifié', statusColor: T.info },
  { date: 'Demain 13:00', client: 'Alliances', product: 'B30', volume: 8.5, truck: 'TK-01', status: 'Planifié', statusColor: T.info },
  { date: '23 Fév 08:00', client: 'Jet Contractors', product: 'B40', volume: 6.0, truck: 'TK-02', status: 'Planifié', statusColor: T.info },
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
            <p style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
              {animated.toLocaleString('fr-FR')}
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
        border: `1px dashed ${T.cardBorder}`, borderRadius: 8, padding: '10px 12px',
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
        background: `${color}12`,
        border: `1px solid ${hov ? color : `${color}30`}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8, padding: '8px 10px',
        boxShadow: hov ? `0 4px 16px ${color}30` : 'none',
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
function DeliveryCard({ d, delay = 0 }: { d: typeof deliveries[0]; delay?: number }) {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: T.textDim, fontSize: 11 }}>{d.date}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.gold }}>{d.volume} m³</span>
            <span style={{ padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: `${T.info}18`, color: T.info, border: `1px solid ${T.info}30` }}>{d.truck}</span>
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
export default function WorldClassPlanning() {
  const [activeTab, setActiveTab] = useState('semaine');
  const tabs = [
    { id: 'semaine', label: 'Semaine' },
    { id: 'mois', label: 'Mois' },
    { id: 'capacite', label: 'Capacité' },
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
        background: 'rgba(11,17,32,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`, padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, #B8860B)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={18} color={T.navy} />
            </div>
            <div>
              <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>Planning</span>
              <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1 }}>Planification de la production</p>
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
              + Nouvelle Commande
            </button>
          </div>
        </div>
      </div>

      {/* ── PAGE CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── SECTION 1: KPIs ── */}
        <section>
          <SectionHeader icon={BarChart3} label="Planning KPIs" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard label="Commandes cette semaine" value={24} suffix="" color={T.gold} icon={FileText} trend="+3 vs semaine dernière" trendPositive delay={0} />
            <KPICard label="Volume Planifié" value={1250} suffix="m³" color={T.gold} icon={BarChart3} trend="+8% vs semaine dernière" trendPositive delay={80} />
            <KPICard label="Capacité Utilisée" value={72} suffix="%" color={T.warning} icon={BarChart3} trend="+5% vs semaine dernière" trendPositive delay={160} />
            <KPICard label="Livraisons Prévues" value={18} suffix="" color={T.info} icon={Truck} trend="stable" trendPositive delay={240} />
          </div>
        </section>

        {/* ── SECTION 2: WEEKLY SCHEDULE ── */}
        <section>
          <SectionHeader icon={CalendarDays} label="Planning Hebdomadaire" />
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', gap: 0 }}>
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
              <div key={row.time} style={{ display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', gap: 0, borderTop: `1px solid ${T.cardBorder}` }}>
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
        <section>
          <SectionHeader icon={Truck} label="Capacité & Livraisons" />
          <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: 24 }}>

            {/* Capacity Gauge */}
            <Card className="tbos-card-stagger">
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
                {deliveries.map((d, i) => (
                  <DeliveryCard key={i} d={d} delay={i * 70} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>TBOS Planning v2.0 — Dernière mise à jour: {new Date().toLocaleString('fr-FR')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Système opérationnel</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
