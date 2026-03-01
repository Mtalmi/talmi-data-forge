import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
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
  goldDim:    'rgba(255, 215, 0, 0.15)',
  goldGlow:   'rgba(255, 215, 0, 0.25)',
  goldBorder: 'rgba(255, 215, 0, 0.3)',
  navy:       '#0D1220',
  success:    '#10B981',
  warning:    '#FB923C',
  danger:     '#FF6B6B',
  info:       '#3B82F6',
  cyan:       '#00D9FF',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

/* ─── GLASS CARD CONSTANTS ─── */
const GLASS = {
  bg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  border: '#1E2D4A',
  hoverBg: 'linear-gradient(145deg, #131D30 0%, #182238 100%)',
  hoverBorder: '#1E2D4A',
  radius: 12,
};

/* ─── LIVE CLOCK ─── */
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6B7280' }}>{time.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>;
}

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

/* ─── TOOLTIP ─── */
function GoldTooltip({ active, payload, label, unit = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(13,18,32,0.95)', border: `1px solid rgba(255,215,0,0.2)`, borderRadius: 10, padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || T.gold, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13 }}>
          {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{unit}
        </p>
      ))}
    </div>
  );
}

/* ─── GLASS CARD ─── */
function GCard({ children, className = '', style = {}, delay = 0, interactive = false }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number; interactive?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        background: hovered && interactive ? GLASS.hoverBg : GLASS.bg,
        border: `1px solid ${hovered && interactive ? GLASS.hoverBorder : GLASS.border}`,
        borderRadius: GLASS.radius,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'all 300ms ease',
        transform: hovered && interactive ? 'translateY(-1px)' : 'translateY(0)',
        opacity: visible ? 1 : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── SECTION HEADER — Clean gold-gradient lines ─── */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">{title}</span>
      <div className="flex-1 border-t border-amber-500/30" />
    </div>
  );
}

/* ─── ANIMATED METRIC ─── */
function Metric({ value, suffix = '', prefix = '', size = 30, color = T.gold }: {
  value: number; suffix?: string; prefix?: string; size?: number; color?: string;
}) {
  const animated = useAnimatedCounter(value);
  return (
    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontWeight: 200, fontSize: size, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
      {prefix}{animated.toLocaleString('fr-FR')}{suffix && <span style={{ fontWeight: 400, fontSize: size * 0.65, color: '#9CA3AF' }}>{suffix}</span>}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 1: PIPELINE
══════════════════════════════════════════════════════ */
const funnelStages = ['leads', 'quotesSent', 'activePOs', 'closedDeals'] as const;
const funnelBase = [
  { stageKey: 'leads' as const, count: 48, value: 1200, rate: 100, width: '100%' },
  { stageKey: 'quotesSent' as const, count: 24, value: 847, rate: 50, width: '72%' },
  { stageKey: 'activePOs' as const, count: 12, value: 504, rate: 25, width: '45%' },
  { stageKey: 'closedDeals' as const, count: 8, value: 338, rate: 17, width: '28%' },
];

const donutBase = [
  { nameKey: 'leads' as const, value: 1200 },
  { nameKey: 'quotesLabel' as const, value: 847 },
  { nameKey: 'activePOs' as const, value: 504 },
  { nameKey: 'closedDeals' as const, value: 338 },
];
const DONUT_COLORS = ['#FFD700', '#E8C860', '#B8860B', '#6B7280'];

function PipelineSection() {
  const { t } = useI18n();
  const vt = t.pages.ventes;
  const [barWidths, setBarWidths] = useState([0, 0, 0, 0]);
  const goldOpacities = [1, 0.75, 0.55, 0.40];

  const stageLabels: Record<string, string> = {
    leads: 'Leads',
    quotesSent: vt.quotesSent,
    activePOs: vt.activePOs,
    closedDeals: vt.closedDeals,
    quotesLabel: vt.quotesLabel,
  };

  const funnelData = funnelBase.map(f => ({ ...f, stage: stageLabels[f.stageKey] || f.stageKey }));
  const donutData = donutBase.map(d => ({ ...d, name: stageLabels[d.nameKey] || d.nameKey }));

  useEffect(() => {
    funnelData.forEach((_, i) => {
      setTimeout(() => {
        setBarWidths(prev => { const next = [...prev]; next[i] = 1; return next; });
      }, i * 150);
    });
  }, []);

  const kpiLabels = [
    { label: vt.pipelineTotal, value: 847, suffix: 'K DH', trend: '↑ 12%', trendLabel: vt.vsLastMonth, trendColor: '#10B981' },
    { label: vt.conversionRateLabel, value: 34, suffix: '%', trend: '→', trendLabel: 'stable', trendColor: 'rgba(255,255,255,0.4)' },
    { label: vt.averageDealSize, value: 42, suffix: 'K DH', trend: '↑ 5%', trendLabel: '', trendColor: '#10B981' },
    { label: vt.salesCycle, value: 28, suffix: ` ${vt.days}`, trend: `↓ 3 ${vt.trendDays}`, trendLabel: '', trendColor: '#10B981' },
  ];

  return (
    <section>
      <SectionHeader title={vt.salesPipeline} />
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 items-stretch">
        {kpiLabels.map((k, i) => (
          <GCard key={k.label} delay={i * 80} style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Metric value={k.value} suffix={k.suffix} color="white" />
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i === 0 && <TrendingUp size={20} color="#F59E0B" />}
                {i === 1 && <Activity size={20} color="#F59E0B" />}
                {i === 2 && <BarChart3 size={20} color="#F59E0B" />}
                {i === 3 && <Clock size={20} color="#F59E0B" />}
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', marginTop: 8, display: 'block' }}>{k.label}</span>
            <span style={{ fontSize: 11, color: k.trendColor, marginTop: 6, display: 'block', fontFamily: 'JetBrains Mono, monospace' }}>
              {k.trend}{k.trendLabel ? ` ${k.trendLabel}` : ''}
            </span>
          </GCard>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
        {/* Funnel */}
        <GCard delay={100}>
          <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 16, letterSpacing: '0.05em' }}>{vt.salesFunnelLabel}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {funnelData.map((f, i) => (
              <div key={f.stage}>
                {i > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, marginLeft: 45 }}>
                    <div style={{ width: 1, height: 12, background: 'rgba(253,185,19,0.2)' }} />
                    <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.3)', marginLeft: 6, fontFamily: 'JetBrains Mono, monospace' }}>▼</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: T.textSec, width: 100, flexShrink: 0 }}>{f.stage}</span>
                  <div style={{ flex: 1, position: 'relative', height: 28, background: `rgba(253,185,19,0.06)`, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: barWidths[i] ? f.width : '0%',
                      background: `rgba(253,185,19,${goldOpacities[i]})`,
                      borderRadius: 6,
                      transition: `width 600ms cubic-bezier(0.4,0,0.2,1) ${i * 150}ms`,
                      display: 'flex', alignItems: 'center', paddingLeft: 10, gap: 8,
                    }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: '#0D1220', whiteSpace: 'nowrap' }}>
                        {f.count} • {f.value}K DH
                      </span>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, width: 32, textAlign: 'right' }}>
                    {f.rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GCard>

        {/* Donut */}
        <GCard delay={200}>
          <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 8, letterSpacing: '0.05em' }}>{vt.pipelineByStage}</p>
          <div style={{ position: 'relative', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                  {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<GoldTooltip unit="K DH" />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 200, color: 'white' }}>2,889K</div>
              <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)' }}>DH Total</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {donutData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: DONUT_COLORS[i], display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: T.textSec, flex: 1 }}>{d.name}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: DONUT_COLORS[i], fontWeight: 600 }}>{d.value}K</span>
              </div>
            ))}
          </div>
        </GCard>
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
  { name: 'Béton Prêt', value: 320, trend: '+8%', up: true },
  { name: 'Béton Spécial', value: 185, trend: '+15%', up: true },
  { name: 'Pompage', value: 142, trend: '-3%', up: false },
  { name: 'Transport', value: 98, trend: '+2%', up: true },
  { name: 'Autres', value: 42, trend: '0%', up: null },
];
const PRODUCT_COLORS = [T.gold, 'rgba(253,185,19,0.65)', 'rgba(253,185,19,0.40)', 'rgba(253,185,19,0.25)', 'rgba(148,163,184,0.15)'];

const segmentData = [
  { name: 'Enterprise', value: 425, clients: 6, avg: 71 },
  { name: 'Mid-Market', value: 218, clients: 14, avg: 16 },
  { name: 'PME', value: 112, clients: 28, avg: 4 },
  { name: 'Startup', value: 32, clients: 12, avg: 3 },
];
const SEGMENT_COLORS = [T.gold, 'rgba(253,185,19,0.65)', 'rgba(253,185,19,0.40)', 'rgba(253,185,19,0.22)'];

function PerformanceSection() {
  return (
    <section>
      <SectionHeader title="Performance Commerciale" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Rep Chart */}
        <GCard delay={0}>
          <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 12, letterSpacing: '0.05em' }}>Ventes par Commercial</p>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}K`} tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
                <Tooltip content={<GoldTooltip unit="K DH" />} />
                <Bar dataKey="sales" name="Ventes" radius={[4, 4, 0, 0]} animationDuration={1000}>
                  {repData.map((_, i) => {
                    const opacities = [1, 0.75, 0.55, 0.40, 0.25];
                    return <Cell key={i} fill={`rgba(253,185,19,${opacities[i] || 0.25})`} />;
                  })}
                </Bar>
                <ReferenceLine y={150} stroke="rgba(16,185,129,0.4)" strokeDasharray="6 4" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {repData.map(r => {
              const badgeColor = r.att >= 100 ? '#10B981' : r.att >= 80 ? '#FDB913' : '#FB923C';
              const badgeBg = r.att >= 100 ? 'rgba(16,185,129,0.08)' : r.att >= 80 ? 'rgba(253,185,19,0.08)' : 'rgba(251,146,60,0.08)';
              return (
                <div key={r.name} style={{ padding: '4px 10px', borderRadius: 6, background: badgeBg, fontSize: 11, fontWeight: 500 }}>
                  <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>{r.name} </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 500, color: badgeColor }}>{r.att}%</span>
                </div>
              );
            })}
          </div>
        </GCard>

        {/* Product Donut */}
        <GCard delay={80}>
          <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 8, letterSpacing: '0.05em' }}>CA par Produit</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
            <div style={{ position: 'relative', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={productData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                    {productData.map((_, i) => <Cell key={i} fill={PRODUCT_COLORS[i]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<GoldTooltip unit="K DH" />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 200, color: 'white' }}>787K</div>
                <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)' }}>DH</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {productData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRODUCT_COLORS[i], flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: T.textSec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: PRODUCT_COLORS[i], fontWeight: 600 }}>{d.value}K</div>
                  </div>
                  <span style={{ fontSize: 10, color: d.up === true ? T.success : d.up === false ? T.danger : T.textDim, fontWeight: 600 }}>
                    {d.up === true ? '↑' : d.up === false ? '↓' : '→'} {d.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GCard>
      </div>

      {/* Segment Bar */}
      <GCard delay={160}>
        <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 12, letterSpacing: '0.05em' }}>CA par Segment Client</p>
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentData} layout="vertical" margin={{ top: 0, right: 60, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${v}K`} tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<GoldTooltip unit="K DH" />} />
              <Bar dataKey="value" name="CA" radius={[0, 4, 4, 0]} animationDuration={1000}>
                {segmentData.map((_, i) => <Cell key={i} fill={SEGMENT_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          {segmentData.map((d, i) => (
            <div key={d.name} style={{ padding: '8px 10px', borderRadius: 8, background: GLASS.bg, border: `1px solid ${GLASS.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(226,232,240,0.8)' }}>{d.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>{d.clients} clients</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(148,163,184,0.4)' }}>moy. {d.avg}K</div>
            </div>
          ))}
        </div>
      </GCard>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 3: DEAL PIPELINE
══════════════════════════════════════════════════════ */
const deals = [
  { id: 'VNT-2024-018', client: 'Ciments du Maroc', amount: 125, stage: 'BC Actif', stageColor: T.success, close: '15 Mars', prob: 90, status: 'On track', statusColor: T.success },
  { id: 'VNT-2024-017', client: 'ONCF', amount: 98, stage: 'Devis', stageColor: T.gold, close: '22 Mars', prob: 60, status: 'On track', statusColor: T.success },
  { id: 'VNT-2024-016', client: 'Addoha Group', amount: 78, stage: 'BC Actif', stageColor: T.success, close: '10 Mars', prob: 85, status: 'On track', statusColor: T.success },
  { id: 'VNT-2024-015', client: 'Alliances Darna', amount: 65, stage: 'Devis', stageColor: T.gold, close: '28 Fév', prob: 45, status: 'At risk', statusColor: T.warning },
  { id: 'VNT-2024-014', client: 'Tgcc', amount: 52, stage: 'Lead', stageColor: 'rgba(253,185,19,0.5)', close: '15 Avr', prob: 30, status: 'On track', statusColor: T.success },
  { id: 'VNT-2024-013', client: 'Jet Contractors', amount: 42, stage: 'Devis', stageColor: T.gold, close: '05 Mars', prob: 55, status: 'At risk', statusColor: T.warning },
  { id: 'VNT-2024-012', client: 'Palmeraie Dev', amount: 28, stage: 'Lead', stageColor: 'rgba(253,185,19,0.5)', close: '20 Avr', prob: 25, status: 'Stalled', statusColor: T.danger },
  { id: 'VNT-2024-011', client: 'Résidences Dar', amount: 16, stage: 'Lead', stageColor: 'rgba(253,185,19,0.5)', close: '30 Avr', prob: 20, status: 'Stalled', statusColor: T.danger },
];

const winLossData = [
  { name: 'Gagnés', value: 8, color: T.success },
  { name: 'Perdus', value: 4, color: T.danger },
];

const agingData = [
  { label: '0–30j', count: 10, value: 320, color: T.success },
  { label: '31–60j', count: 5, value: 134, color: T.gold },
  { label: '61–90j', count: 2, value: 38, color: T.warning },
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
      <SectionHeader title="Deals Actifs" />
      {/* Summary Cards — no icons, just numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 items-stretch">
        {[
          { label: 'Deals Actifs', value: 18, suffix: '', color: 'white', icon: Briefcase },
          { label: 'Valeur Totale', value: 504, suffix: 'K DH', color: 'white', icon: Banknote },
          { label: 'Âge Moyen', value: 22, suffix: ' jours', color: 'white', icon: Clock },
          { label: 'Taux de Gain', value: 67, suffix: '%', color: T.gold, icon: CheckCircle },
        ].map((k, i) => (
          <GCard key={k.label} delay={i * 80}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Metric value={k.value} suffix={k.suffix} color={k.color} />
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <k.icon size={18} color="#FFD700" />
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', marginTop: 8, display: 'block' }}>{k.label}</span>
          </GCard>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
        {/* Deal List */}
        <GCard delay={100} style={{ padding: 16 }}>
          <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 12, letterSpacing: '0.05em' }}>Liste des Deals</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {deals.map((d, i) => (
              <DealRow key={d.id} deal={d} delay={i * 60} />
            ))}
          </div>
        </GCard>

        {/* Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GCard delay={200}>
            <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 4, letterSpacing: '0.05em' }}>Win / Loss</p>
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
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 200, color: 'white' }}>67%</div>
                <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)' }}>taux de gain</div>
              </div>
            </div>
          </GCard>

          <GCard delay={280} style={{ padding: 16 }}>
            <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 10, letterSpacing: '0.05em' }}>Ancienneté des Deals</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {agingData.map((a, i) => (
                <div key={a.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: T.textSec }}>{a.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: a.color, fontWeight: 600 }}>{a.count} • {a.value}K</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: `${a.color}15`, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: a.color, transition: 'width 600ms ease', width: agingWidths[i] ? `${(a.value / maxAging) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 10, color: T.textDim }}>18 deals total</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.gold }}>22j moy.</span>
            </div>
          </GCard>
        </div>
      </div>
    </section>
  );
}

function DealRow({ deal, delay }: { deal: typeof deals[0]; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay + 200); return () => clearTimeout(t); }, [delay]);
  const probColor = deal.prob >= 80 ? T.success : deal.prob >= 40 ? T.gold : T.danger;
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
          <span style={{ fontSize: 12, fontWeight: 700, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.client}</span>
          <span style={{ fontSize: 9, color: T.textDim, flexShrink: 0 }}>{deal.id}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ padding: '1px 6px', borderRadius: 4, background: `${deal.stageColor}15`, color: deal.stageColor, fontSize: 9, fontWeight: 600 }}>{deal.stage}</span>
          <span style={{ fontSize: 9, color: T.textDim }}>{deal.close}</span>
        </div>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600, color: T.gold, flexShrink: 0 }}>{deal.amount}K</span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: probColor, flexShrink: 0 }}>{deal.prob}%</span>
      <span style={{
        padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500,
        background: deal.status === 'On track' ? 'rgba(16,185,129,0.08)' : deal.status === 'At risk' ? 'rgba(251,146,60,0.08)' : 'rgba(255,107,107,0.08)',
        color: deal.status === 'On track' ? '#10B981' : deal.status === 'At risk' ? '#FB923C' : '#FF6B6B',
        border: `1px solid ${deal.status === 'On track' ? 'rgba(16,185,129,0.12)' : deal.status === 'At risk' ? 'rgba(251,146,60,0.12)' : 'rgba(255,107,107,0.12)'}`,
        flexShrink: 0,
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
  const fillColor = animated < 50 ? T.success : animated < 80 ? T.gold : T.danger;
  const needleAngle = startAngle + (animated / 100) * 180;
  const nx = cx + (r - 10) * Math.cos(toRad(needleAngle));
  const ny = cy + (r - 10) * Math.sin(toRad(needleAngle));
  return (
    <svg viewBox="0 0 200 120" style={{ width: '100%', height: 'auto' }}>
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} strokeLinecap="round" />
      {animated > 0 && (
        <path d={arcPath(startAngle, fillEnd)} fill="none" stroke={fillColor} strokeWidth={14} strokeLinecap="round" style={{ transition: 'all 1s ease' }} />
      )}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={T.gold} strokeWidth={2} strokeLinecap="round" style={{ transition: 'all 1s ease' }} />
      <circle cx={cx} cy={cy} r={4} fill={T.gold} />
      <text x={cx} y={cy - 8} textAnchor="middle" fill={fillColor} style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 200, fontSize: 20 }}>{animated}%</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="rgba(148,163,184,0.4)" style={{ fontSize: 8 }}>Atteinte Quota</text>
    </svg>
  );
}

function ForecastSection() {
  return (
    <section>
      <SectionHeader title="Prévisions de Ventes" />
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
        {/* Area Chart */}
        <GCard delay={0}>
          <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 12, letterSpacing: '0.05em' }}>Prévision de Revenus</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="vGradReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.gold} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="vGradPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.gold} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}K`} tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
                <Tooltip content={<GoldTooltip unit="K DH" />} />
                <Area type="monotone" dataKey="realise" name="Réalisé" stroke={T.gold} strokeWidth={2} fill="url(#vGradReal)" connectNulls={false} animationDuration={1200} />
                <Area type="monotone" dataKey="prevision" name="Prévision" stroke={`rgba(253,185,19,0.4)`} strokeWidth={1.5} strokeDasharray="6 4" fill="url(#vGradPrev)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Ce mois', value: '338K DH' },
              { label: 'Mois prochain', value: '365K DH' },
              { label: 'Objectif Q1', value: '1,050K DH' },
            ].map(k => (
              <div key={k.label} style={{ padding: '8px 10px', borderRadius: 8, background: GLASS.bg, border: `1px solid ${GLASS.border}` }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 300, color: 'white' }}>{k.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </GCard>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GCard delay={100}>
            <GaugeSvg pct={78} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 mt-2">
              {[
                { label: 'Objectif', value: '450K', color: 'white' },
                { label: 'Réalisé', value: '351K', color: T.success },
                { label: 'Restant', value: '99K', color: T.gold },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 6, background: GLASS.bg }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 300, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </GCard>

          <GCard delay={200}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)' }}>Précision Prévisions</p>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.gold }}>87% actuelle</span>
            </div>
            <div style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vAccGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.success} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={T.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textDim }} axisLine={false} tickLine={false} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 9, fill: T.textDim }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GoldTooltip unit="%" />} />
                  <Area type="monotone" dataKey="acc" name="Précision" stroke={T.success} strokeWidth={2} fill="url(#vAccGrad)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GCard>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 5: ACTIVITIES
══════════════════════════════════════════════════════ */
const timeline = [
  { time: "Auj. 16:30", type: 'Appel', icon: Phone, client: 'ONCF', rep: 'Karim B.', note: 'Suivi devis en cours', done: true },
  { time: "Auj. 14:00", type: 'Réunion', icon: Users, client: 'Ciments du Maroc', rep: 'Fatima Z.', note: 'Négociation finale', done: true },
  { time: "Auj. 10:00", type: 'Email', icon: Mail, client: 'Addoha Group', rep: 'Youssef M.', note: 'Envoi proposition révisée', done: true },
  { time: "Hier 17:00", type: 'Appel', icon: Phone, client: 'Alliances Darna', rep: 'Amina L.', note: 'Relance devis', done: true },
  { time: "Hier 11:00", type: 'Réunion', icon: Users, client: 'Tgcc', rep: 'Hassan R.', note: 'Présentation produits', done: true },
  { time: "18 Fév 15:00", type: 'Email', icon: Mail, client: 'Jet Contractors', rep: 'Karim B.', note: 'Envoi devis initial', done: true },
  { time: "Demain 09:00", type: 'Réunion', icon: Users, client: 'ONCF', rep: 'Karim B.', note: 'Closing meeting', done: false },
  { time: "Demain 14:00", type: 'Appel', icon: Phone, client: 'Palmeraie Dev', rep: 'Fatima Z.', note: 'Premier contact', done: false },
];

const nextActions = [
  { action: 'Finaliser contrat ONCF', due: 'Demain', rep: 'Karim B.', deal: 'VNT-017', priority: 'High', pColor: T.danger },
  { action: 'Relancer Alliances Darna', due: '22 Fév', rep: 'Amina L.', deal: 'VNT-015', priority: 'High', pColor: T.danger },
  { action: 'Préparer devis Tgcc', due: '24 Fév', rep: 'Hassan R.', deal: 'VNT-014', priority: 'Medium', pColor: T.gold },
  { action: 'Appel suivi Jet Contractors', due: '25 Fév', rep: 'Karim B.', deal: 'VNT-013', priority: 'Medium', pColor: T.gold },
  { action: 'Email intro Palmeraie', due: '26 Fév', rep: 'Fatima Z.', deal: 'VNT-012', priority: 'Low', pColor: T.success },
];

function ActivitiesSection() {
  return (
    <section>
      <SectionHeader title="Activités Commerciales" />
      {/* KPI — monochrome icons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 items-stretch">
        {[
          { label: 'Appels', value: 34, icon: Phone, trend: '+12% ↑', sub: 'cette semaine' },
          { label: 'Emails', value: 67, icon: Mail, trend: '+8% ↑', sub: 'cette semaine' },
          { label: 'Réunions', value: 12, icon: Users, trend: '-5% ↓', sub: 'cette semaine' },
          { label: 'Propositions', value: 8, icon: FileText, trend: '+25% ↑', sub: 'cette semaine' },
        ].map((k, i) => (
          <GCard key={k.label} delay={i * 80} style={{ minHeight: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <k.icon size={18} color="#FFD700" />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: k.trend.includes('↑') ? T.success : T.danger }}>{k.trend}</span>
            </div>
            <Metric value={k.value} color="white" />
            <div style={{ fontSize: 13, color: 'rgba(226,232,240,0.6)', marginTop: 4 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.3)' }}>{k.sub}</div>
          </GCard>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
        {/* Timeline */}
        <GCard delay={100} style={{ padding: 16 }}>
          <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 14, letterSpacing: '0.05em' }}>Historique & Planning</p>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: `linear-gradient(180deg, rgba(253,185,19,0.4), transparent)` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {timeline.map((t, i) => (
                <TimelineRow key={i} item={t} delay={i * 60} />
              ))}
            </div>
          </div>
        </GCard>

        {/* Next Actions */}
        <GCard delay={200} style={{ padding: 16 }}>
          <p style={{ fontWeight: 600, fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 12, letterSpacing: '0.05em' }}>Prochaines Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {nextActions.map((a, i) => (
              <NextActionRow key={i} action={a} delay={i * 60 + 200} />
            ))}
          </div>
        </GCard>
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
      <div style={{ position: 'absolute', left: -14, top: 10, width: 8, height: 8, borderRadius: '50%', background: item.done ? T.success : T.gold, border: `2px solid ${T.navy}`, flexShrink: 0 }} />
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <item.icon size={12} style={{ color: 'rgba(148,163,184,0.4)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.client}</span>
          <span style={{ fontSize: 9, color: T.textDim, flexShrink: 0 }}>{item.rep}</span>
        </div>
        <div style={{ fontSize: 10, color: T.textSec, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.note}</div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 9, color: T.textDim }}>{item.time}</div>
        <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: item.done ? 'rgba(16,185,129,0.08)' : 'rgba(253,185,19,0.08)', color: item.done ? T.success : T.gold }}>
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
        background: hovered ? 'rgba(255,255,255,0.04)' : GLASS.bg,
        border: `1px solid ${hovered ? action.pColor + '30' : GLASS.border}`,
        borderLeft: `3px solid ${action.pColor}`,
        transform: hovered ? 'translateX(2px)' : 'translateX(0)',
        transition: 'all 150ms',
        opacity: visible ? 1 : 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.action}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 9, color: T.textDim }}>{action.rep}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: T.gold }}>{action.deal}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: action.pColor, fontWeight: 600 }}>{action.due}</div>
        <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: `${action.pColor}10`, color: action.pColor }}>{action.priority}</span>
      </div>
      <ChevronRight size={12} style={{ color: T.textDim, transform: hovered ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 150ms', flexShrink: 0 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export function WorldClassVentes() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'performance' | 'previsions' | 'activites'>('pipeline');
  const { t } = useI18n();
  const vt = t.pages.ventes;

  const tabs = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'performance', label: 'Performance' },
    { id: 'previsions', label: vt.forecasts },
    { id: 'activites', label: vt.activities },
  ] as const;

  return (
    <div className="overflow-x-hidden max-w-full" style={{ color: T.textPri }}>
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@200;300;400;600;700&display=swap');
        .wc-tab-btn { background:transparent; border:1px solid transparent; border-radius:8px; padding:7px 16px; cursor:pointer; font-weight:600; font-size:12px; transition:all 200ms; color:rgba(148,163,184,0.5); }
        .wc-tab-btn:hover { color:rgba(226,232,240,0.7); border-color:rgba(255,255,255,0.06); }
        .wc-tab-btn.active { color:#FDB913; border-color:rgba(253,185,19,0.3); background:rgba(253,185,19,0.06); }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <div data-seamless-header style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px',
        background: 'transparent',
        border: 'none',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, #B8860B)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={18} color={T.navy} />
            </div>
            <div>
              <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>Ventes</span>
              <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1 }}>Gestion des devis et bons de commande</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
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
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6B7280', letterSpacing: '0.02em' }}>
              <LiveClock />
            </span>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={18} color={T.textSec} />
              <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: T.danger }} />
            </div>
            <button style={{
              background: 'transparent',
              border: `1px solid ${T.goldBorder}`,
              color: T.gold,
              fontSize: 12, padding: '7px 16px', borderRadius: 8,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
              transition: 'all 150ms', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(253,185,19,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Plus size={14} />
              {vt.newDeal}
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {activeTab === 'pipeline' && <PipelineSection />}
        {activeTab === 'performance' && <PerformanceSection />}
        {activeTab === 'previsions' && <ForecastSection />}
        {activeTab === 'activites' && <ActivitiesSection />}
      </div>
    </div>
  );
}
