import { useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, UserCheck, Banknote, Heart, Bell,
  AlertTriangle, UserX, ChevronRight, Search,
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
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

const SEGMENT_COLORS: Record<string, string> = {
  Enterprise: T.gold,
  'Mid-Market': T.info,
  PME: T.success,
  Startup: T.purple,
};

// ─────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (p < 1) rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);
  return value;
}

function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return visible;
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
        transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
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
function Badge({ label, color, bg, pulse = false, small = false }: {
  label: string; color: string; bg: string; pulse?: boolean; small?: boolean;
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '2px 8px' : '3px 10px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`,
      color, fontSize: small ? 10 : 10, fontWeight: 700, letterSpacing: '0.05em',
      animation: pulse ? 'tbos-pulse 2s infinite' : 'none', flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
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
// DARK TOOLTIP
// ─────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#162036', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill, fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{Number(p.value).toLocaleString('fr-FR')}{suffix}</strong>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const TOP_CLIENTS = [
  { client: 'Ciments du Maroc', ca: 425 },
  { client: 'ONCF',             ca: 312 },
  { client: 'Addoha Group',     ca: 278 },
  { client: 'Alliances Darna',  ca: 198 },
  { client: 'Tgcc',             ca: 156 },
];

const SEGMENTS = [
  { name: 'Enterprise',  value: 8,  color: T.gold },
  { name: 'Mid-Market',  value: 14, color: T.info },
  { name: 'PME',         value: 18, color: T.success },
  { name: 'Startup',     value: 8,  color: T.purple },
];

const TREND_DATA = [
  { month: 'Sep', ca: 580, nouveaux: 3 },
  { month: 'Oct', ca: 620, nouveaux: 5 },
  { month: 'Nov', ca: 645, nouveaux: 2 },
  { month: 'Déc', ca: 710, nouveaux: 4 },
  { month: 'Jan', ca: 685, nouveaux: 3 },
  { month: 'Fév', ca: 748, nouveaux: 4 },
];

const CLIENT_LIST = [
  { name: 'Ciments du Maroc', segment: 'Enterprise',  ca: '425K DH', lastOrder: '18 Fév', status: 'Actif',   solde: 0 },
  { name: 'ONCF',             segment: 'Enterprise',  ca: '312K DH', lastOrder: '15 Fév', status: 'Actif',   solde: 12000 },
  { name: 'Addoha Group',     segment: 'Enterprise',  ca: '278K DH', lastOrder: '20 Fév', status: 'Actif',   solde: 0 },
  { name: 'Alliances Darna',  segment: 'Mid-Market',  ca: '198K DH', lastOrder: '10 Fév', status: 'Actif',   solde: 8000 },
  { name: 'Tgcc',             segment: 'Mid-Market',  ca: '156K DH', lastOrder: '12 Fév', status: 'Actif',   solde: 0 },
  { name: 'Jet Contractors',  segment: 'Mid-Market',  ca: '98K DH',  lastOrder: '05 Fév', status: 'Actif',   solde: 5000 },
  { name: 'Palmeraie Dev',    segment: 'PME',         ca: '65K DH',  lastOrder: '28 Jan', status: 'Inactif', solde: 15000 },
  { name: 'Résidences Dar',   segment: 'PME',         ca: '42K DH',  lastOrder: '15 Jan', status: 'Inactif', solde: 3000 },
];

// ─────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive, delay = 0 }: {
  label: string; value: number; suffix: string; color: string;
  icon: any; trend: string; trendPositive: boolean; delay?: number;
}) {
  const animated = useAnimatedCounter(value, 1200);
  const visible = useFadeIn(delay);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
              {animated}
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
// CLIENT ROW
// ─────────────────────────────────────────────────────
function ClientRow({ client, delay = 0 }: { client: typeof CLIENT_LIST[0]; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const segColor = SEGMENT_COLORS[client.segment] || T.gold;
  const initial = client.name.charAt(0).toUpperCase();
  const isInactif = client.status === 'Inactif';

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(20px)',
        transition: 'all 380ms ease-out',
        background: hov ? `${T.cardBorder}50` : 'transparent',
        border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
        borderRadius: 10, padding: '12px 16px',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${segColor}, ${segColor}99)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 16, color: T.navy,
        boxShadow: `0 0 10px ${segColor}40`,
      }}>{initial}</div>

      {/* Name + segment */}
      <div style={{ minWidth: 170, flexShrink: 0 }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 3 }}>{client.name}</p>
        <Badge label={client.segment} color={segColor} bg={`${segColor}18`} />
      </div>

      {/* CA */}
      <div style={{ minWidth: 90, flexShrink: 0 }}>
        <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>CA YTD</p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: T.gold }}>{client.ca}</p>
      </div>

      {/* Last order */}
      <div style={{ minWidth: 100, flexShrink: 0 }}>
        <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Dernière cmd</p>
        <p style={{ color: T.textSec, fontSize: 12 }}>{client.lastOrder}</p>
      </div>

      {/* Status */}
      <div style={{ minWidth: 80, flexShrink: 0 }}>
        <Badge
          label={client.status}
          color={isInactif ? T.warning : T.success}
          bg={isInactif ? `${T.warning}18` : `${T.success}18`}
          pulse={isInactif}
        />
      </div>

      {/* Solde */}
      <div style={{ minWidth: 90, flexShrink: 0 }}>
        <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Solde</p>
        <p style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700,
          color: client.solde === 0 ? T.success : T.danger,
        }}>
          {client.solde === 0 ? '0 DH' : `${(client.solde / 1000).toFixed(0)}K DH`}
        </p>
      </div>

      {/* Spacer + arrow */}
      <div style={{ flex: 1 }} />
      <ChevronRight
        size={18}
        color={T.textDim}
        style={{ transition: 'transform 200ms', transform: hov ? 'translateX(4px)' : 'none', flexShrink: 0 }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// HEALTH CARD
// ─────────────────────────────────────────────────────
function HealthCard({ label, value, color, desc, icon: Icon, delay = 0 }: {
  label: string; value: number; color: string; desc: string; icon: any; delay?: number;
}) {
  const animated = useAnimatedCounter(value, 1200);
  const visible = useFadeIn(delay);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} color={color} />
          </div>
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>{animated}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginTop: 4 }}>{label}</p>
            <p style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>{desc}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PIE LABEL
// ─────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy }: any) {
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 30, fontWeight: 800, fill: T.gold }}>48</text>
      <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fill: T.textSec }}>clients</text>
    </>
  );
}

// ─────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────
export default function WorldClassClients() {
  const [activeTab, setActiveTab] = useState('tous');
  const [search, setSearch] = useState('');
  const tabs = [
    { id: 'tous', label: 'Tous' },
    { id: 'actifs', label: 'Actifs' },
    { id: 'prospects', label: 'Prospects' },
    { id: 'inactifs', label: 'Inactifs' },
  ];

  const filteredClients = CLIENT_LIST.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.navy, minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.8} }
        input::placeholder { color: #64748B; }
        input { outline: none; }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`, padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, #B8860B)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color={T.navy} />
            </div>
            <div>
              <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>Clients</span>
              <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1, marginTop: 1 }}>Gestion de la relation client</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                background: activeTab === tab.id ? `${T.gold}18` : 'transparent',
                border: activeTab === tab.id ? `1px solid ${T.goldBorder}` : '1px solid transparent',
                color: activeTab === tab.id ? T.gold : T.textSec,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13,
                transition: 'all 200ms',
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Search + actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color={T.textDim} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un client..."
                style={{
                  padding: '7px 12px 7px 30px', borderRadius: 8,
                  background: `${T.cardBorder}60`, border: `1px solid ${T.cardBorder}`,
                  color: T.textPri, fontFamily: 'DM Sans, sans-serif', fontSize: 12, width: 200,
                }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Bell size={18} color={T.textSec} />
              <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: T.danger }} />
            </div>
            <button style={{
              padding: '7px 16px', borderRadius: 8, background: T.gold, color: T.navy,
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12,
              border: 'none', cursor: 'pointer',
            }}>+ Nouveau Client</button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── SECTION 1: KPIs ── */}
        <section>
          <SectionHeader icon={Users} label="Indicateurs CRM" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard label="Total Clients"        value={48}  suffix=""     color={T.gold}    icon={Users}      trend="+4 ce mois"      trendPositive delay={0} />
            <KPICard label="Clients Actifs"       value={32}  suffix=""     color={T.success} icon={UserCheck}  trend="+2 ce mois"      trendPositive delay={80} />
            <KPICard label="CA Moyen / Client"    value={156} suffix="K DH" color={T.gold}    icon={Banknote}   trend="+8% vs mois préc" trendPositive delay={160} />
            <KPICard label="Taux de Rétention"    value={87}  suffix="%"    color={T.success} icon={Heart}      trend="+3% vs mois préc" trendPositive delay={240} />
          </div>
        </section>

        {/* ── SECTION 2 + 3: TOP CLIENTS + SEGMENTATION ── */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 24 }}>

            {/* Top clients bar */}
            <Card className="tbos-card-stagger">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri }}>Top Clients par CA</p>
                <Badge label="Top 5" color={T.gold} bg={`${T.gold}18`} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={TOP_CLIENTS} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }}
                    tickFormatter={v => `${v}K`} />
                  <YAxis dataKey="client" type="category" axisLine={false} tickLine={false}
                    tick={{ fill: T.textSec, fontSize: 11 }} width={120} />
                  <RechartsTooltip content={<DarkTooltip suffix=" K DH" />} cursor={{ fill: `${T.gold}08` }} />
                  <Bar dataKey="ca" name="CA" fill={T.gold} radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1000}>
                    {TOP_CLIENTS.map((_, i) => (
                      <Cell key={i} fill={`url(#goldGrad${i})`} />
                    ))}
                  </Bar>
                  <defs>
                    {TOP_CLIENTS.map((_, i) => (
                      <linearGradient key={i} id={`goldGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={T.gold} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={T.gold} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Segmentation donut */}
            <Card className="tbos-card-stagger">
              <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 16 }}>Segmentation</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <defs>
                    <filter id="pieShadow">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                    </filter>
                  </defs>
                  {SEGMENTS.map((seg, i) => (
                    <Pie
                      key={seg.name}
                      data={[seg]}
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={72}
                      paddingAngle={0}
                      dataKey="value"
                      startAngle={
                        90 - SEGMENTS.slice(0, i).reduce((acc, s) => acc + (s.value / 48) * 360, 0)
                      }
                      endAngle={
                        90 - SEGMENTS.slice(0, i + 1).reduce((acc, s) => acc + (s.value / 48) * 360, 0)
                      }
                      isAnimationActive
                      animationBegin={i * 150}
                      animationDuration={600}
                      label={false}
                      labelLine={false}
                    >
                      <Cell fill={seg.color} />
                    </Pie>
                  ))}
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      const pct = Math.round((Number(d.value) / 48) * 100);
                      return (
                        <div style={{ background: '#162036', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '8px 12px' }}>
                          <p style={{ color: d.payload.color, fontWeight: 700, fontSize: 12 }}>{d.name}</p>
                          <p style={{ color: T.textSec, fontSize: 11 }}>{d.value} clients ({pct}%)</p>
                        </div>
                      );
                    }}
                  />
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 800, fill: T.gold }}>
                    48
                  </text>
                  <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fill: T.textSec }}>
                    clients
                  </text>
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                {SEGMENTS.map(seg => {
                  const pct = Math.round((seg.value / 48) * 100);
                  return (
                    <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                      <span style={{ color: T.textSec, fontSize: 11 }}>{seg.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: seg.color, marginLeft: 'auto' }}>
                        {seg.value} <span style={{ color: T.textDim }}>({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </section>

        {/* ── SECTION 4: REVENUE TREND ── */}
        <section>
          <SectionHeader
            icon={Banknote}
            label="Évolution CA Clients"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.gold }}>3 988K DH</span>
                <Badge label="+21 nouveaux" color={T.info} bg={`${T.info}18`} />
              </div>
            }
          />
          <Card>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={TREND_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.gold} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }}
                  tickFormatter={v => `${v}K`} />
                <RechartsTooltip content={<DarkTooltip suffix="K DH" />} cursor={{ stroke: `${T.gold}40` }} />
                <Area dataKey="ca" name="CA" type="monotone" stroke={T.gold} strokeWidth={2.5}
                  fill="url(#caGrad)" isAnimationActive animationDuration={1200} dot={{ fill: T.gold, r: 4 }} />
                <Bar dataKey="nouveaux" name="Nouveaux clients" fill={T.info} radius={[3, 3, 0, 0]} isAnimationActive animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* ── SECTION 5: CLIENT LIST ── */}
        <section>
          <SectionHeader icon={Users} label="Liste des Clients" right={
            <span style={{ color: T.textDim, fontSize: 11 }}>{filteredClients.length} résultats</span>
          } />
          <Card>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr 110px 120px 100px 100px 40px', gap: 14, padding: '4px 16px 12px', borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 6 }}>
              {['', 'Client', 'CA YTD', 'Dernière Cmd', 'Statut', 'Solde', ''].map((h, i) => (
                <span key={i} style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredClients.map((c, i) => <ClientRow key={c.name} client={c} delay={i * 60} />)}
            </div>
          </Card>
        </section>

        {/* ── SECTION 6: HEALTH ── */}
        <section>
          <SectionHeader icon={Heart} label="Santé du Portefeuille" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <HealthCard label="Clients Fidèles"  value={24} color={T.gold}    desc=">12 mois d'activité continue" icon={Heart}          delay={0} />
            <HealthCard label="À Risque"         value={5}  color={T.warning} desc="Pas de commande depuis >30j"   icon={AlertTriangle}  delay={100} />
            <HealthCard label="Clients Perdus"   value={3}  color={T.danger}  desc="Pas de commande depuis >90j"   icon={UserX}          delay={200} />
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>TBOS Clients v2.0 — {new Date().toLocaleString('fr-FR')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>CRM synchronisé</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
