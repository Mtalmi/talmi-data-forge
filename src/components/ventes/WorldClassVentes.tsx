import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, BarChart3, Briefcase, Activity, Clock,
  Phone, Mail, Users, FileText, Banknote, ChevronRight, Bell, Plus,
  CheckCircle, AlertCircle, CircleDot,
} from 'lucide-react';

/* ─── DESIGN TOKENS ─── */
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
  orange:     '#F97316',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

/* ─── HOOKS ─── */
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

function useLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ─── TOOLTIP ─── */
function GoldTooltip({ active, payload, label, unit = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.gold}33`, borderRadius: 10, padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || T.gold, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13 }}>
          {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{unit}
        </p>
      ))}
    </div>
  );
}

/* ─── PREMIUM CARD ─── */
function PCard({ children, className = '', style = {}, delay = 0 }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className={className}
      style={{
        background: T.cardBg,
        border: `1px solid ${hovered ? T.goldBorder : T.cardBorder}`,
        borderRadius: 16,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
        transform: pressed ? 'translateY(-1px) scale(0.995)' : hovered ? 'translateY(-3px) scale(1.005)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.3), 0 0 20px ${T.goldGlow}` : '0 4px 12px rgba(0,0,0,0.15)',
        opacity: visible ? 1 : 0,
        ...style,
      }}
    >
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
          transition: 'opacity 200ms',
        }} />
      )}
      {children}
    </div>
  );
}

/* ─── SECTION HEADER ─── */
function SectionHeader({ icon: Icon, title, color = T.gold }: { icon: any; title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} style={{ color }} />
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}40, transparent)` }} />
    </div>
  );
}

/* ─── PULSE BADGE ─── */
function PulseBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
      borderRadius: 100, background: bg, border: `1px solid ${color}40`,
      fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 11, color,
      animation: 'tbos-pulse 2.5s ease-in-out infinite',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

/* ─── ANIMATED METRIC ─── */
function Metric({ value, suffix = '', prefix = '', size = 28, color = T.gold }: {
  value: number; suffix?: string; prefix?: string; size?: number; color?: string;
}) {
  const animated = useAnimatedCounter(value);
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: size, color, lineHeight: 1 }}>
      {prefix}{animated.toLocaleString('fr-FR')}{suffix}
    </span>
  );
}

/* ─── KPI CARD ─── */
function KpiCard({ label, value, suffix = '', color = T.gold, icon: Icon, trend, trendColor, delay = 0 }: any) {
  return (
    <PCard delay={delay} style={{ minHeight: 110 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend && (
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: trendColor }}>
            {trend}
          </span>
        )}
      </div>
      <Metric value={value} suffix={suffix} color={color} size={26} />
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: T.textSec, marginTop: 6, fontWeight: 500 }}>{label}</p>
    </PCard>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 1: PIPELINE
══════════════════════════════════════════════════════ */
const funnelData = [
  { stage: 'Leads', count: 48, value: 1200, rate: 100, color: T.warning, width: '100%' },
  { stage: 'Devis Envoyés', count: 24, value: 847, rate: 50, color: T.info, width: '72%' },
  { stage: 'BCs Actifs', count: 12, value: 504, rate: 25, color: T.purple, width: '45%' },
  { stage: 'Deals Fermés', count: 8, value: 338, rate: 17, color: T.gold, width: '28%' },
];

const donutData = [
  { name: 'Leads', value: 1200, color: T.warning },
  { name: 'Devis', value: 847, color: T.info },
  { name: 'BCs Actifs', value: 504, color: T.purple },
  { name: 'Fermés', value: 338, color: T.gold },
];

function PipelineSection() {
  const [barWidths, setBarWidths] = useState([0, 0, 0, 0]);
  useEffect(() => {
    funnelData.forEach((_, i) => {
      setTimeout(() => {
        setBarWidths(prev => {
          const next = [...prev];
          next[i] = 1;
          return next;
        });
      }, i * 150);
    });
  }, []);

  return (
    <section>
      <SectionHeader icon={TrendingUp} title="Pipeline Commercial" />
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Pipeline Total" value={847} suffix="K DH" icon={Banknote} trend="+12.5% ↑" trendColor={T.success} delay={0} />
        <KpiCard label="Taux de Conversion" value={34} suffix="%" color={T.success} icon={TrendingUp} trend="+5.2% ↑" trendColor={T.success} delay={80} />
        <KpiCard label="Taille Moyenne" value={42} suffix="K DH" color={T.textPri} icon={BarChart3} trend="-2.1% ↓" trendColor={T.danger} delay={160} />
        <KpiCard label="Cycle de Vente" value={28} suffix=" jours" color={T.warning} icon={Clock} trend="+3 jours" trendColor={T.danger} delay={240} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Funnel */}
        <PCard delay={100}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 16 }}>Entonnoir de Vente</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnelData.map((f, i) => (
              <div key={f.stage}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: T.textSec, width: 100, flexShrink: 0 }}>{f.stage}</span>
                  <div style={{ flex: 1, position: 'relative', height: 32, background: `${f.color}15`, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: barWidths[i] ? f.width : '0%',
                      background: f.color,
                      borderRadius: 6,
                      transition: `width 600ms cubic-bezier(0.4,0,0.2,1) ${i * 150}ms`,
                      display: 'flex', alignItems: 'center', paddingLeft: 10, gap: 8,
                    }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#0B1120', whiteSpace: 'nowrap' }}>
                        {f.count} • {f.value}K DH
                      </span>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: f.color, fontWeight: 700, width: 32, textAlign: 'right' }}>
                    {f.rate}%
                  </span>
                </div>
                {i < funnelData.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
                    <span style={{ color: T.textDim, fontSize: 10 }}>▼ {i === 0 ? '50%' : i === 1 ? '50%' : '67%'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </PCard>

        {/* Donut */}
        <PCard delay={200}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Pipeline par Étape</p>
          <div style={{ position: 'relative', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<GoldTooltip unit="K DH" />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: T.gold }}>2,889K</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: T.textDim }}>DH Total</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {donutData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: T.textSec, flex: 1 }}>{d.name}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: d.color, fontWeight: 700 }}>{d.value}K</span>
              </div>
            ))}
          </div>
        </PCard>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 2: PERFORMANCE
══════════════════════════════════════════════════════ */
const repData = [
  { name: 'Karim B.', sales: 156, quota: 150, att: 104 },
  { name: 'Fatima Z.', sales: 132, quota: 150, att: 88 },
  { name: 'Youssef M.', sales: 98, quota: 120, att: 82 },
  { name: 'Amina L.', sales: 87, quota: 100, att: 87 },
  { name: 'Hassan R.', sales: 64, quota: 100, att: 64 },
];

const productData = [
  { name: 'Béton Prêt', value: 320, color: T.gold, trend: '+8%', up: true },
  { name: 'Béton Spécial', value: 185, color: T.info, trend: '+15%', up: true },
  { name: 'Pompage', value: 142, color: T.success, trend: '-3%', up: false },
  { name: 'Transport', value: 98, color: T.purple, trend: '+2%', up: true },
  { name: 'Autres', value: 42, color: T.pink, trend: '0%', up: null },
];

const segmentData = [
  { name: 'Enterprise', value: 425, clients: 6, avg: 71, color: T.gold },
  { name: 'Mid-Market', value: 218, clients: 14, avg: 16, color: T.info },
  { name: 'PME', value: 112, clients: 28, avg: 4, color: T.success },
  { name: 'Startup', value: 32, clients: 12, avg: 3, color: T.purple },
];

function PerformanceSection() {
  return (
    <section>
      <SectionHeader icon={BarChart3} title="Performance Commerciale" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Rep Chart */}
        <PCard delay={0}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 12 }}>Ventes par Commercial</p>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1E2D4A" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}K`} tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
                <Tooltip content={<GoldTooltip unit="K DH" />} />
                <Bar dataKey="sales" name="Ventes" radius={[4, 4, 0, 0]} animationDuration={1000}>
                  {repData.map((d, i) => (
                    <Cell key={i} fill={d.att >= 100 ? T.success : d.att >= 80 ? T.warning : T.danger} />
                  ))}
                </Bar>
                <ReferenceLine y={150} stroke={T.gold} strokeDasharray="4 4" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {repData.map(r => (
              <div key={r.name} style={{
                padding: '4px 8px', borderRadius: 6,
                background: r.att >= 100 ? `${T.success}15` : r.att >= 80 ? `${T.warning}15` : `${T.danger}15`,
                border: `1px solid ${r.att >= 100 ? T.success : r.att >= 80 ? T.warning : T.danger}30`,
              }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: T.textSec }}>{r.name} </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: r.att >= 100 ? T.success : r.att >= 80 ? T.warning : T.danger }}>
                  {r.att}%
                </span>
              </div>
            ))}
          </div>
        </PCard>

        {/* Product Donut */}
        <PCard delay={80}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 8 }}>CA par Produit</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={productData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                    {productData.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<GoldTooltip unit="K DH" />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 800, color: T.gold }}>787K</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: T.textDim }}>DH</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {productData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: T.textSec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: d.color, fontWeight: 700 }}>{d.value}K</div>
                  </div>
                  <span style={{ fontSize: 10, color: d.up === true ? T.success : d.up === false ? T.danger : T.textDim, fontWeight: 600 }}>
                    {d.up === true ? '↑' : d.up === false ? '↓' : '→'} {d.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PCard>
      </div>

      {/* Segment Bar */}
      <PCard delay={160}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 12 }}>CA par Segment Client</p>
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentData} layout="vertical" margin={{ top: 0, right: 60, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1E2D4A" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${v}K`} tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<GoldTooltip unit="K DH" />} />
              <Bar dataKey="value" name="CA" radius={[0, 4, 4, 0]} animationDuration={1000}>
                {segmentData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 12 }}>
          {segmentData.map(d => (
            <div key={d.name} style={{ padding: '8px 10px', borderRadius: 8, background: `${d.color}10`, border: `1px solid ${d.color}20` }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, color: d.color }}>{d.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.textSec, marginTop: 2 }}>{d.clients} clients</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.textDim }}>moy. {d.avg}K</div>
            </div>
          ))}
        </div>
      </PCard>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 3: DEAL PIPELINE
══════════════════════════════════════════════════════ */
const deals = [
  { id: 'VNT-2024-018', client: 'Ciments du Maroc', amount: 125, stage: 'BC Actif', stageColor: T.success, close: '15 Mars', prob: 90, status: 'On track', statusColor: T.success },
  { id: 'VNT-2024-017', client: 'ONCF', amount: 98, stage: 'Devis', stageColor: T.info, close: '22 Mars', prob: 60, status: 'On track', statusColor: T.success },
  { id: 'VNT-2024-016', client: 'Addoha Group', amount: 78, stage: 'BC Actif', stageColor: T.success, close: '10 Mars', prob: 85, status: 'On track', statusColor: T.success },
  { id: 'VNT-2024-015', client: 'Alliances Darna', amount: 65, stage: 'Devis', stageColor: T.info, close: '28 Fév', prob: 45, status: 'At risk', statusColor: T.warning },
  { id: 'VNT-2024-014', client: 'Tgcc', amount: 52, stage: 'Lead', stageColor: T.warning, close: '15 Avr', prob: 30, status: 'On track', statusColor: T.success },
  { id: 'VNT-2024-013', client: 'Jet Contractors', amount: 42, stage: 'Devis', stageColor: T.info, close: '05 Mars', prob: 55, status: 'At risk', statusColor: T.warning },
  { id: 'VNT-2024-012', client: 'Palmeraie Dev', amount: 28, stage: 'Lead', stageColor: T.warning, close: '20 Avr', prob: 25, status: 'Stalled', statusColor: T.danger },
  { id: 'VNT-2024-011', client: 'Résidences Dar', amount: 16, stage: 'Lead', stageColor: T.warning, close: '30 Avr', prob: 20, status: 'Stalled', statusColor: T.danger },
];

const winLossData = [
  { name: 'Gagnés', value: 8, color: T.success },
  { name: 'Perdus', value: 4, color: T.danger },
];

const agingData = [
  { label: '0–30j', count: 10, value: 320, color: T.success },
  { label: '31–60j', count: 5, value: 134, color: T.warning },
  { label: '61–90j', count: 2, value: 38, color: T.orange },
  { label: '>90j', count: 1, value: 12, color: T.danger },
];

function DealPipelineSection() {
  const [agingWidths, setAgingWidths] = useState([0, 0, 0, 0]);
  useEffect(() => {
    agingData.forEach((_, i) => {
      setTimeout(() => setAgingWidths(prev => { const n = [...prev]; n[i] = 1; return n; }), i * 120 + 300);
    });
  }, []);

  const maxAging = Math.max(...agingData.map(d => d.value));

  return (
    <section>
      <SectionHeader icon={Briefcase} title="Deals Actifs" />
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Deals Actifs" value={18} icon={FileText} delay={0} />
        <KpiCard label="Valeur Totale" value={504} suffix="K DH" icon={Banknote} delay={80} />
        <KpiCard label="Âge Moyen" value={22} suffix=" jours" color={T.textPri} icon={Clock} delay={160} />
        <KpiCard label="Taux de Gain" value={67} suffix="%" color={T.success} icon={TrendingUp} delay={240} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Deal List */}
        <PCard delay={100} style={{ padding: 16 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 12 }}>Liste des Deals</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {deals.map((d, i) => (
              <DealRow key={d.id} deal={d} delay={i * 60} />
            ))}
          </div>
        </PCard>

        {/* Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PCard delay={200}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 4 }}>Win / Loss</p>
            <div style={{ position: 'relative', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={winLossData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value" animationBegin={0} animationDuration={800}>
                    {winLossData.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<GoldTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.gold }}>67%</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: T.textDim }}>taux de gain</div>
              </div>
            </div>
          </PCard>

          <PCard delay={280} style={{ padding: 16 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, color: T.textPri, marginBottom: 10 }}>Ancienneté des Deals</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {agingData.map((a, i) => (
                <div key={a.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: T.textSec }}>{a.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: a.color, fontWeight: 700 }}>{a.count} • {a.value}K</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: `${a.color}20`, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: a.color, transition: 'width 600ms ease', width: agingWidths[i] ? `${(a.value / maxAging) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: T.textDim }}>18 deals total</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.gold }}>22j moy.</span>
            </div>
          </PCard>
        </div>
      </div>
    </section>
  );
}

function DealRow({ deal, delay }: { deal: typeof deals[0]; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay + 200); return () => clearTimeout(t); }, [delay]);
  const probColor = deal.prob >= 80 ? T.success : deal.prob >= 40 ? T.warning : T.danger;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        borderRadius: 8, cursor: 'default',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: `3px solid ${deal.stageColor}`,
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        transition: 'all 150ms',
        opacity: visible ? 1 : 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.client}</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: T.textDim, flexShrink: 0 }}>{deal.id}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ padding: '1px 6px', borderRadius: 4, background: `${deal.stageColor}20`, color: deal.stageColor, fontSize: 9, fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>{deal.stage}</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: T.textDim }}>{deal.close}</span>
        </div>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 800, color: T.gold, flexShrink: 0 }}>{deal.amount}K</span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: probColor, flexShrink: 0 }}>{deal.prob}%</span>
      <span style={{
        padding: '2px 7px', borderRadius: 100, fontSize: 9, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
        background: `${deal.statusColor}18`, color: deal.statusColor, border: `1px solid ${deal.statusColor}30`,
        flexShrink: 0, animation: 'tbos-pulse 2.5s ease-in-out infinite',
      }}>{deal.status}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 4: FORECAST
══════════════════════════════════════════════════════ */
const forecastData = [
  { month: 'Jan', realise: 280, prevision: 280, objectif: 300 },
  { month: 'Fév', realise: 310, prevision: 310, objectif: 300 },
  { month: 'Mar', realise: 338, prevision: 338, objectif: 350 },
  { month: 'Avr', realise: null, prevision: 365, objectif: 350 },
  { month: 'Mai', realise: null, prevision: 395, objectif: 400 },
  { month: 'Jun', realise: null, prevision: 420, objectif: 400 },
];

const accuracyData = [
  { month: 'Sep', acc: 82 },
  { month: 'Oct', acc: 78 },
  { month: 'Nov', acc: 85 },
  { month: 'Déc', acc: 88 },
  { month: 'Jan', acc: 91 },
  { month: 'Fév', acc: 87 },
];

function GaugeSvg({ pct }: { pct: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(pct), 400); return () => clearTimeout(t); }, [pct]);
  const r = 70, cx = 100, cy = 100;
  const startAngle = -180, endAngle = 0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) };
    const e = { x: cx + r * Math.cos(toRad(end)), y: cy + r * Math.sin(toRad(end)) };
    const la = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 1 ${e.x} ${e.y}`;
  };
  const fillEnd = startAngle + (animated / 100) * 180;
  const fillColor = animated < 50 ? T.success : animated < 80 ? T.warning : T.danger;
  const needleAngle = startAngle + (animated / 100) * 180;
  const nx = cx + (r - 10) * Math.cos(toRad(needleAngle));
  const ny = cy + (r - 10) * Math.sin(toRad(needleAngle));
  return (
    <svg viewBox="0 0 200 120" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={T.success} />
          <stop offset="50%" stopColor={T.warning} />
          <stop offset="100%" stopColor={T.danger} />
        </linearGradient>
      </defs>
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke="#1E2D4A" strokeWidth={14} strokeLinecap="round" />
      {animated > 0 && (
        <path d={arcPath(startAngle, fillEnd)} fill="none" stroke={fillColor} strokeWidth={14} strokeLinecap="round" style={{ transition: 'all 1s ease' }} />
      )}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={T.gold} strokeWidth={2} strokeLinecap="round" style={{ transition: 'all 1s ease' }} />
      <circle cx={cx} cy={cy} r={4} fill={T.gold} />
      <text x={cx} y={cy - 8} textAnchor="middle" fill={fillColor} style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 20 }}>{animated}%</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill={T.textDim} style={{ fontSize: 8, fontFamily: 'DM Sans, sans-serif' }}>Atteinte Quota</text>
    </svg>
  );
}

function ForecastSection() {
  return (
    <section>
      <SectionHeader icon={Activity} title="Prévisions de Ventes" />
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Area Chart */}
        <PCard delay={0}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 12 }}>Prévision de Revenus</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="vGradReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.gold} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="vGradPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.textSec} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={T.textSec} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1E2D4A" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}K`} tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
                <Tooltip content={<GoldTooltip unit="K DH" />} />
                <Area type="monotone" dataKey="realise" name="Réalisé" stroke={T.gold} strokeWidth={2} fill="url(#vGradReal)" connectNulls={false} animationDuration={1200} />
                <Area type="monotone" dataKey="prevision" name="Prévision" stroke={T.textSec} strokeWidth={1.5} strokeDasharray="4 3" fill="url(#vGradPrev)" animationDuration={1200} />
                <Area type="monotone" dataKey="objectif" name="Objectif" stroke={T.gold} strokeWidth={1} strokeDasharray="2 4" fill="none" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
            {[
              { label: 'Ce mois', value: '338K DH', color: T.gold },
              { label: 'Mois prochain', value: '365K DH', color: T.textPri },
              { label: 'Objectif Q1', value: '1,050K DH', color: T.success },
            ].map(k => (
              <div key={k.label} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid #1E2D4A' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: k.color }}>{k.value}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: T.textDim, marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </PCard>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PCard delay={100}>
            <GaugeSvg pct={78} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 8 }}>
              {[
                { label: 'Objectif', value: '450K', color: T.textPri },
                { label: 'Réalisé', value: '351K', color: T.success },
                { label: 'Restant', value: '99K', color: T.warning },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: m.color }}>{m.value}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: T.textDim }}>{m.label}</div>
                </div>
              ))}
            </div>
          </PCard>

          <PCard delay={200}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, color: T.textPri }}>Précision Prévisions</p>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.gold }}>87% actuelle</span>
            </div>
            <div style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vAccGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.gold} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1E2D4A" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textDim }} axisLine={false} tickLine={false} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 9, fill: T.textDim }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GoldTooltip unit="%" />} />
                  <Area type="monotone" dataKey="acc" name="Précision" stroke={T.gold} strokeWidth={2} fill="url(#vAccGrad)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: T.textDim }}>↑ +5% vs Q3</span>
              <span style={{ color: T.success, fontSize: 10 }}>▲</span>
            </div>
          </PCard>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 5: ACTIVITIES
══════════════════════════════════════════════════════ */
const timeline = [
  { time: "Auj. 16:30", type: 'Appel', icon: Phone, iconColor: T.info, client: 'ONCF', rep: 'Karim B.', note: 'Suivi devis en cours', done: true },
  { time: "Auj. 14:00", type: 'Réunion', icon: Users, iconColor: T.purple, client: 'Ciments du Maroc', rep: 'Fatima Z.', note: 'Négociation finale', done: true },
  { time: "Auj. 10:00", type: 'Email', icon: Mail, iconColor: T.success, client: 'Addoha Group', rep: 'Youssef M.', note: 'Envoi proposition révisée', done: true },
  { time: "Hier 17:00", type: 'Appel', icon: Phone, iconColor: T.info, client: 'Alliances Darna', rep: 'Amina L.', note: 'Relance devis', done: true },
  { time: "Hier 11:00", type: 'Réunion', icon: Users, iconColor: T.purple, client: 'Tgcc', rep: 'Hassan R.', note: 'Présentation produits', done: true },
  { time: "18 Fév 15:00", type: 'Email', icon: Mail, iconColor: T.success, client: 'Jet Contractors', rep: 'Karim B.', note: 'Envoi devis initial', done: true },
  { time: "Demain 09:00", type: 'Réunion', icon: Users, iconColor: T.purple, client: 'ONCF', rep: 'Karim B.', note: 'Closing meeting', done: false },
  { time: "Demain 14:00", type: 'Appel', icon: Phone, iconColor: T.info, client: 'Palmeraie Dev', rep: 'Fatima Z.', note: 'Premier contact', done: false },
];

const nextActions = [
  { action: 'Finaliser contrat ONCF', due: 'Demain', rep: 'Karim B.', deal: 'VNT-017', priority: 'High', pColor: T.danger },
  { action: 'Relancer Alliances Darna', due: '22 Fév', rep: 'Amina L.', deal: 'VNT-015', priority: 'High', pColor: T.danger },
  { action: 'Préparer devis Tgcc', due: '24 Fév', rep: 'Hassan R.', deal: 'VNT-014', priority: 'Medium', pColor: T.warning },
  { action: 'Appel suivi Jet Contractors', due: '25 Fév', rep: 'Karim B.', deal: 'VNT-013', priority: 'Medium', pColor: T.warning },
  { action: 'Email intro Palmeraie', due: '26 Fév', rep: 'Fatima Z.', deal: 'VNT-012', priority: 'Low', pColor: T.success },
];

function ActivitiesSection() {
  return (
    <section>
      <SectionHeader icon={Clock} title="Activités Commerciales" />
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Appels', value: 34, icon: Phone, color: T.info, trend: '+12% ↑', sub: 'cette semaine' },
          { label: 'Emails', value: 67, icon: Mail, color: T.success, trend: '+8% ↑', sub: 'cette semaine' },
          { label: 'Réunions', value: 12, icon: Users, color: T.purple, trend: '-5% ↓', sub: 'cette semaine' },
          { label: 'Propositions', value: 8, icon: FileText, color: T.gold, trend: '+25% ↑', sub: 'cette semaine' },
        ].map((k, i) => (
          <PCard key={k.label} delay={i * 80} style={{ minHeight: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={16} style={{ color: k.color }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: k.trend.includes('↑') ? T.success : T.danger, fontFamily: 'DM Sans, sans-serif' }}>{k.trend}</span>
            </div>
            <Metric value={k.value} color={k.color} size={24} />
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: T.textSec, marginTop: 4 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: T.textDim }}>{k.sub}</div>
          </PCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Timeline */}
        <PCard delay={100} style={{ padding: 16 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 14 }}>Historique & Planning</p>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: `linear-gradient(180deg, ${T.gold}60, transparent)` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {timeline.map((t, i) => (
                <TimelineRow key={i} item={t} delay={i * 60} />
              ))}
            </div>
          </div>
        </PCard>

        {/* Next Actions */}
        <PCard delay={200} style={{ padding: 16 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 12 }}>Prochaines Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {nextActions.map((a, i) => (
              <NextActionRow key={i} action={a} delay={i * 60 + 200} />
            ))}
          </div>
        </PCard>
      </div>
    </section>
  );
}

function TimelineRow({ item, delay }: { item: typeof timeline[0]; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay + 300); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 10, padding: '6px 8px', borderRadius: 8,
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        transition: 'all 150ms',
        opacity: visible ? 1 : 0,
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', left: -14, top: 10, width: 8, height: 8, borderRadius: '50%', background: item.done ? T.success : T.warning, border: `2px solid ${T.navy}`, flexShrink: 0 }} />
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${item.iconColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <item.icon size={12} style={{ color: item.iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.client}</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: T.textDim, flexShrink: 0 }}>{item.rep}</span>
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: T.textSec, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.note}</div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: T.textDim }}>{item.time}</div>
        <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', background: item.done ? `${T.success}18` : `${T.warning}18`, color: item.done ? T.success : T.warning }}>
          {item.done ? '✓' : '⏳'}
        </span>
      </div>
    </div>
  );
}

function NextActionRow({ action, delay }: { action: typeof nextActions[0]; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        borderRadius: 8, cursor: 'default',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? action.pColor + '30' : '#1E2D4A'}`,
        borderLeft: `3px solid ${action.pColor}`,
        transform: hovered ? 'translateX(2px)' : 'translateX(0)',
        transition: 'all 150ms',
        opacity: visible ? 1 : 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.action}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: T.textDim }}>{action.rep}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: T.gold }}>{action.deal}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: action.pColor, fontWeight: 600 }}>{action.due}</div>
        <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: `${action.pColor}15`, color: action.pColor, fontFamily: 'DM Sans, sans-serif' }}>{action.priority}</span>
      </div>
      <ChevronRight size={12} style={{ color: T.textDim, transform: hovered ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 150ms', flexShrink: 0 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export function WorldClassVentes() {
  const clock = useLiveClock();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'performance' | 'previsions' | 'activites'>('pipeline');

  const tabs = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'performance', label: 'Performance' },
    { id: 'previsions', label: 'Prévisions' },
    { id: 'activites', label: 'Activités' },
  ] as const;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.navy, color: T.textPri }}>
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.06);opacity:0.85} }
        @keyframes tbos-fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .wc-tab-btn { background:transparent; border:1px solid transparent; border-radius:8px; padding:7px 16px; cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:600; font-size:12px; transition:all 200ms; color:#94A3B8; }
        .wc-tab-btn:hover { color:#F1F5F9; border-color:#1E2D4A; }
        .wc-tab-btn.active { color:#FFD700; border-color:rgba(255,215,0,0.4); background:rgba(255,215,0,0.08); }
        .wc-new-deal-btn { background:#FFD700; color:#0B1120; border:none; border-radius:8px; padding:8px 16px; font-family:'DM Sans',sans-serif; font-weight:700; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 150ms; }
        .wc-new-deal-btn:hover { background:#FFE234; transform:translateY(-1px); }
        .wc-new-deal-btn:active { transform:scale(0.97); }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1E2D4A',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 24,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, ${T.warning})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={18} color="#0B1120" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>
              TBOS <span style={{ color: T.gold }}>Ventes</span>
            </div>
            <div style={{ fontSize: 9, color: T.textDim }}>Sales Command Center</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`wc-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textDim }}>
            {clock.toLocaleTimeString('fr-FR')}
          </span>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={18} style={{ color: T.textSec }} />
            <div style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: T.danger, border: '1.5px solid #0B1120' }} />
          </div>
          <button className="wc-new-deal-btn">
            <Plus size={14} />
            Nouveau Deal
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: 40 }}>
        {(activeTab === 'pipeline') && <PipelineSection />}
        {(activeTab === 'performance') && <PerformanceSection />}
        {(activeTab === 'previsions') && <ForecastSection />}
        {(activeTab === 'activites') && <ActivitiesSection />}
        {/* On pipeline tab, show all sections stacked */}
        {activeTab === 'pipeline' && (
          <>
            <PerformanceSection />
            <DealPipelineSection />
            <ForecastSection />
            <ActivitiesSection />
          </>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: T.textDim }}>
            TBOS Ventes v2.0 — Dernière mise à jour: {clock.toLocaleString('fr-FR')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s ease-in-out infinite', display: 'inline-block' }} />
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: T.success, fontWeight: 600 }}>Système opérationnel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
