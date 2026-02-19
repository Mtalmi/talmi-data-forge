import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Download, ChevronDown, CheckCircle, Sparkles, Trophy, Target, TrendingUp, Shield } from 'lucide-react';

// ─── COLORS ─────────────────────────────────────────
const C = {
  bgBase: '#0F1419', bgCard: '#161D26', bgElevated: '#1C2533',
  gold: '#FFD700', goldDim: '#B8960C', goldGlow: 'rgba(255,215,0,0.07)',
  text1: '#FFFFFF', text2: '#B0B8C1',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  border: '#2A3545',
  you: '#FFD700', industry: '#3B82F6', top10: '#10B981',
};

// ─── STAGGER ────────────────────────────────────────
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.3, ease: 'easeOut' },
});

// ─── CARD ───────────────────────────────────────────
function Card({ children, className, style, delay = 0 }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number }) {
  return (
    <motion.div {...stagger(delay)}
      className={cn('rounded-xl border', className)}
      style={{ background: C.bgCard, borderColor: C.border, boxShadow: '0 4px 24px rgba(0,0,0,0.5)', ...style }}
      whileHover={{ y: -2, borderColor: C.gold, transition: { duration: 0.2 } }}
    >{children}</motion.div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, color: C.text1, marginBottom: 12 }}>{children}</h3>;
}

function GoldTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.gold}`, borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: C.text2, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || C.gold, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── ANIMATED COUNTER ───────────────────────────────
function AnimNum({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [v, setV] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const s = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - s) / 1200, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);
  return <span>{v}{suffix}</span>;
}

// ─── DATA ───────────────────────────────────────────
const METRICS = [
  { key: 'production', label: 'Production Efficiency', icon: '⚡', you: 88, avg: 74, top: 96, unit: '%' },
  { key: 'quality', label: 'Quality Score', icon: '✅', you: 94, avg: 79, top: 98, unit: '%' },
  { key: 'cost', label: 'Cost per m³', icon: '💰', you: 76, avg: 68, top: 91, unit: '' },
  { key: 'fleet', label: 'Fleet Utilization', icon: '🚛', you: 87, avg: 72, top: 95, unit: '%' },
  { key: 'delivery', label: 'Delivery Rate', icon: '📦', you: 91, avg: 78, top: 97, unit: '%' },
  { key: 'safety', label: 'Safety Score', icon: '🛡️', you: 96, avg: 81, top: 99, unit: '' },
];

const radarData = METRICS.map(m => ({ metric: m.label.replace(' per m³', ''), you: m.you, industry: m.avg, top10: m.top }));

function getStatus(you: number, avg: number, top: number) {
  if (you >= top * 0.96) return { label: 'Top Performer', color: C.gold };
  if (you > avg) return { label: 'Above Average', color: C.success };
  return { label: 'Below Average', color: C.danger };
}

const METRIC_TABS = ['Production', 'Quality', 'Cost', 'Fleet', 'Delivery', 'Safety'] as const;
type MetricTab = typeof METRIC_TABS[number];

// Distribution data per tab
const distributions: Record<string, number[]> = {
  Production: [1, 2, 3, 5, 7, 9, 8, 6, 5, 3, 2, 2, 1],
  Quality: [1, 1, 2, 3, 5, 6, 8, 9, 7, 5, 4, 2, 1],
  Cost: [1, 2, 3, 4, 6, 9, 8, 7, 5, 4, 3, 1, 1],
  Fleet: [1, 2, 4, 5, 7, 8, 9, 6, 5, 3, 2, 1, 1],
  Delivery: [1, 1, 3, 4, 6, 8, 9, 7, 6, 4, 3, 1, 1],
  Safety: [1, 1, 2, 3, 4, 6, 8, 9, 8, 5, 4, 2, 1],
};

const trendData: Record<string, { you: number[]; avg: number[] }> = {
  Production: { you: [82,83,84,83,85,86,87,86,87,88,88,88], avg: [71,72,71,73,72,73,74,73,74,74,75,74] },
  Quality: { you: [89,90,90,91,91,92,92,93,93,93,94,94], avg: [76,77,77,78,78,78,79,78,79,79,79,79] },
  Cost: { you: [70,71,72,72,73,74,74,75,75,76,76,76], avg: [65,65,66,66,67,67,67,68,68,68,68,68] },
  Fleet: { you: [80,81,82,82,83,84,84,85,86,86,87,87], avg: [69,69,70,70,71,71,72,72,72,72,72,72] },
  Delivery: { you: [85,86,86,87,87,88,89,89,90,90,91,91], avg: [74,75,75,76,76,77,77,78,78,78,78,78] },
  Safety: { you: [91,92,92,93,93,94,94,95,95,95,96,96], avg: [78,78,79,79,80,80,80,81,81,81,81,81] },
};

const leaderboards: Record<string, { rank: number; name: string; score: string; trend: string }[]> = {
  Production: [
    { rank: 1, name: 'Producer A', score: '97.2%', trend: '▲' },
    { rank: 2, name: 'Producer B', score: '96.8%', trend: '→' },
    { rank: 3, name: 'Producer C', score: '95.1%', trend: '▲' },
    { rank: 4, name: 'Producer D', score: '94.4%', trend: '▼' },
    { rank: 5, name: 'Producer E', score: '93.0%', trend: '▲' },
    { rank: 6, name: 'Producer F', score: '91.7%', trend: '→' },
    { rank: 7, name: 'Producer G', score: '90.2%', trend: '▲' },
    { rank: 8, name: 'Producer H', score: '89.5%', trend: '→' },
    { rank: 9, name: 'Atlas Concrete', score: '88.0%', trend: '▲' },
    { rank: 10, name: 'Producer I', score: '86.3%', trend: '▼' },
  ],
  Quality: [
    { rank: 1, name: 'Producer X', score: '98.1%', trend: '▲' },
    { rank: 2, name: 'Producer Y', score: '97.4%', trend: '→' },
    { rank: 3, name: 'Producer Z', score: '95.8%', trend: '▲' },
    { rank: 4, name: 'Atlas Concrete', score: '94.0%', trend: '▲' },
    { rank: 5, name: 'Producer W', score: '93.1%', trend: '→' },
    { rank: 6, name: 'Producer V', score: '91.5%', trend: '▲' },
    { rank: 7, name: 'Producer U', score: '90.2%', trend: '▼' },
    { rank: 8, name: 'Producer T', score: '89.0%', trend: '→' },
    { rank: 9, name: 'Producer S', score: '87.4%', trend: '▲' },
    { rank: 10, name: 'Producer R', score: '86.1%', trend: '▼' },
  ],
  Cost: [
    { rank: 1, name: 'Producer A', score: '$38.10', trend: '▲' },
    { rank: 2, name: 'Producer B', score: '$39.40', trend: '→' },
    { rank: 3, name: 'Producer C', score: '$40.20', trend: '▲' },
    { rank: 4, name: 'Producer D', score: '$41.10', trend: '▼' },
    { rank: 5, name: 'Atlas Concrete', score: '$42.80', trend: '▲' },
    { rank: 6, name: 'Producer E', score: '$43.50', trend: '→' },
    { rank: 7, name: 'Producer F', score: '$44.90', trend: '▲' },
    { rank: 8, name: 'Producer G', score: '$46.20', trend: '→' },
    { rank: 9, name: 'Producer H', score: '$47.80', trend: '▼' },
    { rank: 10, name: 'Producer I', score: '$49.10', trend: '▼' },
  ],
  Fleet: [
    { rank: 1, name: 'Producer A', score: '95.1%', trend: '▲' },
    { rank: 2, name: 'Producer B', score: '94.2%', trend: '→' },
    { rank: 3, name: 'Atlas Concrete', score: '87.6%', trend: '▲' },
    { rank: 4, name: 'Producer C', score: '86.8%', trend: '▼' },
    { rank: 5, name: 'Producer D', score: '85.1%', trend: '▲' },
    { rank: 6, name: 'Producer E', score: '83.4%', trend: '→' },
    { rank: 7, name: 'Producer F', score: '81.0%', trend: '▲' },
    { rank: 8, name: 'Producer G', score: '79.5%', trend: '→' },
    { rank: 9, name: 'Producer H', score: '77.2%', trend: '▼' },
    { rank: 10, name: 'Producer I', score: '75.8%', trend: '▼' },
  ],
  Delivery: [
    { rank: 1, name: 'Producer A', score: '97.4%', trend: '▲' },
    { rank: 2, name: 'Producer B', score: '96.1%', trend: '→' },
    { rank: 3, name: 'Atlas Concrete', score: '91.2%', trend: '▲' },
    { rank: 4, name: 'Producer C', score: '90.0%', trend: '▼' },
    { rank: 5, name: 'Producer D', score: '88.7%', trend: '▲' },
    { rank: 6, name: 'Producer E', score: '86.3%', trend: '→' },
    { rank: 7, name: 'Producer F', score: '84.9%', trend: '▲' },
    { rank: 8, name: 'Producer G', score: '83.1%', trend: '→' },
    { rank: 9, name: 'Producer H', score: '81.4%', trend: '▼' },
    { rank: 10, name: 'Producer I', score: '79.8%', trend: '▼' },
  ],
  Safety: [
    { rank: 1, name: 'Producer A', score: '99', trend: '→' },
    { rank: 2, name: 'Producer B', score: '98', trend: '▲' },
    { rank: 3, name: 'Atlas Concrete', score: '96', trend: '▲' },
    { rank: 4, name: 'Producer C', score: '95', trend: '→' },
    { rank: 5, name: 'Producer D', score: '93', trend: '▲' },
    { rank: 6, name: 'Producer E', score: '91', trend: '▼' },
    { rank: 7, name: 'Producer F', score: '89', trend: '→' },
    { rank: 8, name: 'Producer G', score: '87', trend: '▲' },
    { rank: 9, name: 'Producer H', score: '85', trend: '→' },
    { rank: 10, name: 'Producer I', score: '82', trend: '▼' },
  ],
};

const outperformPct: Record<string, number> = { Production: 73, Quality: 87, Cost: 68, Fleet: 79, Delivery: 82, Safety: 89 };

const tabExtras: Record<string, React.ReactNode> = {
  Cost: (
    <Card delay={0} style={{ borderColor: C.gold, borderWidth: 1 }} className="mt-4">
      <div className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: C.goldGlow }}>💰</div>
        <div>
          <p className="text-sm" style={{ color: C.text2 }}>Vs industry average, you save <span style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>$5.40/m³</span></p>
          <p className="text-lg font-bold mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: C.gold }}>
            = ~$261,000/year at your production volume
          </p>
        </div>
      </div>
    </Card>
  ),
  Fleet: (
    <Card delay={0} style={{ borderColor: C.gold, borderWidth: 1 }} className="mt-4">
      <div className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: C.goldGlow }}>🚛</div>
        <div>
          <p className="text-sm" style={{ color: C.text2 }}>
            If you reached Top 10% fleet utilization (<span style={{ color: C.top10, fontWeight: 600 }}>95%</span>), estimated additional revenue:
          </p>
          <p className="text-lg font-bold mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: C.gold }}>+$180,000/year</p>
        </div>
      </div>
    </Card>
  ),
};

// Industry trends
const industryTrends = ['Q1\'23','Q2\'23','Q3\'23','Q4\'23','Q1\'24','Q2\'24','Q3\'24','Q4\'24','Q1\'25'].map((q, i) => ({
  quarter: q,
  efficiency: [70,71,72,71,73,73,74,74,75][i],
  quality: [75,76,76,77,78,78,79,79,80][i],
  delivery: [73,74,74,75,76,76,77,78,78][i],
  cost: [52,51,50,49,49,48,48,48,47][i],
}));

const intelligenceFeed = [
  { color: C.industry, text: 'MENA industry average efficiency improved 4.2% in Q1 2025, fastest growth since 2022', time: '2d ago' },
  { color: C.success, text: 'Producers using AI mix optimization now represent 34% of top quartile', time: '5d ago' },
  { color: C.warning, text: 'Fuel costs up 9% across Gulf region — fleet optimization becoming critical differentiator', time: '1w ago' },
  { color: C.industry, text: 'Quality pass rates hit industry record 96.2% average in February', time: '1w ago' },
  { color: C.success, text: 'Early adopters of predictive maintenance showing 40% lower downtime vs peers', time: '2w ago' },
];

// Peer comparison
const peerComparison = [
  { metric: 'Production Efficiency', you: '88%', peerAvg: '81%', peerBest: '94%', rank: '2nd of 12', isFirst: false, aboveAvg: true },
  { metric: 'Quality Pass Rate', you: '94.2%', peerAvg: '87.4%', peerBest: '97.1%', rank: '1st of 12 🥇', isFirst: true, aboveAvg: true },
  { metric: 'Cost per m³', you: '$42.80', peerAvg: '$46.20', peerBest: '$39.40', rank: '3rd of 12', isFirst: false, aboveAvg: true },
  { metric: 'Fleet Utilization', you: '87.6%', peerAvg: '79.3%', peerBest: '93.2%', rank: '2nd of 12', isFirst: false, aboveAvg: true },
  { metric: 'On-Time Delivery', you: '91.2%', peerAvg: '84.6%', peerBest: '96.8%', rank: '2nd of 12', isFirst: false, aboveAvg: true },
  { metric: 'Safety Score', you: '96', peerAvg: '84', peerBest: '99', rank: '1st of 12 🥇', isFirst: true, aboveAvg: true },
];

// Recommendations
const recommendations = [
  {
    border: C.success, icon: '💰', label: 'Cost Optimization', difficulty: 'Quick Win',
    gap: '$4.70/m³ above top 10%',
    insight: 'Route optimization and bulk material purchasing could close 60% of this gap within 90 days based on patterns from similar-sized producers.',
    impact: '+$227K/year',
  },
  {
    border: C.gold, icon: '🚛', label: 'Fleet Utilization', difficulty: 'Medium Effort',
    gap: '8% below top 10% fleet utilization',
    insight: 'Top performers in your cohort use predictive scheduling to reduce idle time between batches. Your peak hour utilization suggests 3 trucks are consistently underdeployed.',
    impact: '+$180K/year',
  },
  {
    border: C.danger, icon: '⚡', label: 'Production Efficiency', difficulty: 'Strategic',
    gap: '8% below top 10% efficiency',
    insight: 'Producers who implemented automated mix adjustment (available in TBOS AI module) achieved 6-8% efficiency gains within 6 months.',
    impact: '+$340K/year',
  },
];

const REGIONS = ['MENA Concrete Industry', 'North Africa', 'Morocco', 'Gulf', 'Levant'];
const PERIODS = ['Q1 2025', 'Q4 2024', 'Q3 2024', 'Last 12 Months'];

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
export default function IndustryBenchmarking() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [regionOpen, setRegionOpen] = useState(false);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [metricTab, setMetricTab] = useState<MetricTab>('Production');

  const handleExport = () => {
    setExportState('loading');
    setTimeout(() => { setExportState('done'); setTimeout(() => setExportState('idle'), 1500); }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.bgBase, color: C.text1,
      backgroundImage: `radial-gradient(rgba(255,215,0,0.025) 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    }}>
      {/* Gold shimmer */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${C.gold}, transparent 40%, transparent 60%, ${C.gold})` }} />

      {/* TOP BAR */}
      <nav className="flex items-center justify-between px-4 md:px-6 py-3 border-b" style={{ borderColor: C.border, background: C.bgCard }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, color: C.bgBase }}>T</div>
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: C.gold, fontFamily: "'Poppins', sans-serif" }}>BENCHMARKING</span>
        </div>
        <div className="flex items-center gap-2">
          <Dropdown label={region} options={REGIONS} value={region} onChange={setRegion} open={regionOpen} setOpen={v => { setRegionOpen(v); setPeriodOpen(false); }} />
          <Dropdown label={period} options={PERIODS} value={period} onChange={setPeriod} open={periodOpen} setOpen={v => { setPeriodOpen(v); setRegionOpen(false); }} />
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
            style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, color: C.bgBase }}>
            {exportState === 'loading' ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generating...</>
             : exportState === 'done' ? <><CheckCircle className="w-3.5 h-3.5" /> Downloaded!</>
             : <><Download className="w-3.5 h-3.5" /> Download Report</>}
          </button>
        </div>
      </nav>

      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">

        {/* ─── HERO BANNER ───────────────────── */}
        <motion.div {...stagger(0)}>
          <div className="rounded-xl border-l-4 p-6 md:p-8 grid md:grid-cols-2 gap-8 items-center"
            style={{ background: C.bgCard, borderColor: C.gold, borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderStyle: 'solid', borderTopColor: C.border, borderRightColor: C.border, borderBottomColor: C.border, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
            <div>
              <p className="text-sm uppercase tracking-widest mb-2" style={{ color: C.text2 }}>You are in the</p>
              <div className="relative inline-block">
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 700,
                  color: C.gold, lineHeight: 1,
                  textShadow: `0 0 40px rgba(255,215,0,0.3), 0 0 80px rgba(255,215,0,0.15)`,
                }}>
                  TOP <AnimNum value={18} suffix="%" />
                </span>
              </div>
              <p className="text-base mt-3" style={{ color: C.text2 }}>of MENA concrete producers</p>
              <p className="text-xs mt-2" style={{ color: C.text2 }}>Based on 54 anonymized producers · Updated March 2025</p>
              <p className="text-[10px] mt-1 italic" style={{ color: '#6B7280' }}>All competitor data is anonymized and aggregated</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Overall Rank', value: '#9', sub: 'of 54' },
                { label: 'Efficiency Percentile', value: '82', sub: 'nd' },
                { label: 'Quality Percentile', value: '94', sub: 'th' },
                { label: 'Cost Percentile', value: '71', sub: 'st' },
              ].map((s, i) => (
                <div key={s.label} className="text-center p-3 rounded-lg" style={{ background: C.bgElevated }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: C.gold }}>
                    {s.value}<span className="text-sm" style={{ color: C.text2 }}>{s.sub}</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: C.text2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─── SECTION 1: RADAR ────────────────── */}
        <Card delay={1}>
          <div className="p-5 md:p-6">
            <Title>Your Performance vs Industry</Title>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={360}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke={C.border} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: C.text2, fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: C.text2, fontSize: 9 }} domain={[0, 100]} axisLine={false} />
                  <Radar name="Top 10%" dataKey="top10" stroke={C.top10} fill={C.top10} fillOpacity={0.05} strokeWidth={1} strokeDasharray="4 4" />
                  <Radar name="Industry Average" dataKey="industry" stroke={C.industry} fill={C.industry} fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="6 3" />
                  <Radar name="YOU (Atlas Concrete)" dataKey="you" stroke={C.you} fill={C.you} fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip content={<GoldTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {[{ label: 'YOU (Atlas Concrete)', color: C.you }, { label: 'Industry Average', color: C.industry }, { label: 'Top 10%', color: C.top10 }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                  <span className="text-xs" style={{ color: C.text2 }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Metric bars */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {METRICS.map((m, i) => {
                const status = getStatus(m.you, m.avg, m.top);
                return (
                  <motion.div key={m.key} {...stagger(i + 2)} className="p-4 rounded-lg" style={{ background: C.bgElevated }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: C.text2 }}>{m.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${status.color}20`, color: status.color }}>{status.label}</span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: C.gold }}>{m.you}</span>
                    <div className="relative h-3 rounded-full mt-3 overflow-hidden" style={{ background: C.bgBase }}>
                      <div className="absolute h-full rounded-full" style={{ width: `${m.you}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.goldDim})` }} />
                      <div className="absolute top-0 bottom-0 w-0.5" style={{ left: `${m.avg}%`, background: C.industry }} />
                      <div className="absolute top-0 bottom-0 w-0.5" style={{ left: `${m.top}%`, background: C.top10 }} />
                    </div>
                    <p className="text-[10px] mt-1.5" style={{ color: C.text2 }}>
                      Industry Avg: <span style={{ color: C.industry }}>{m.avg}</span> · Top 10%: <span style={{ color: C.top10 }}>{m.top}</span>
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* ─── SECTION 2: DEEP DIVES ─────────── */}
        <Card delay={2}>
          <div className="p-5 md:p-6">
            <Title>Metric Deep Dives</Title>
            <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
              {METRIC_TABS.map(tab => (
                <button key={tab} onClick={() => setMetricTab(tab)}
                  className="px-4 py-2 text-sm font-medium relative whitespace-nowrap transition-colors duration-200"
                  style={{ color: metricTab === tab ? C.gold : C.text2, fontFamily: "'Poppins', sans-serif" }}
                  onMouseEnter={e => { if (metricTab !== tab) (e.target as HTMLElement).style.color = C.text1; }}
                  onMouseLeave={e => { if (metricTab !== tab) (e.target as HTMLElement).style.color = C.text2; }}
                >
                  {tab}
                  {metricTab === tab && <motion.div layoutId="metric-tab-line" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: C.gold }} />}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={metricTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <MetricDeepDive tab={metricTab} />
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>

        {/* ─── SECTION 3: AI RECOMMENDATIONS ── */}
        <Card delay={3}>
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-3 mb-6">
              <Title>AI-Powered Improvement Recommendations</Title>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: C.gold, color: C.bgBase }}>
                <Sparkles className="w-3 h-3" /> AI
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {recommendations.map((r, i) => (
                <motion.div key={r.label} {...stagger(i)}
                  className="rounded-xl border-l-4 p-5"
                  style={{ background: C.bgElevated, borderLeftColor: r.border, borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{r.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{r.label}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${r.border}20`, color: r.border }}>{r.difficulty}</span>
                    </div>
                  </div>
                  <p className="text-xs mb-2" style={{ color: C.text2 }}>Gap: <span style={{ color: C.text1 }}>{r.gap}</span></p>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: C.text2 }}>{r.insight}</p>
                  <p className="text-sm font-bold mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: C.gold }}>{r.impact}</p>
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200"
                    style={{ borderColor: C.gold, color: C.gold }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = C.bgBase; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.gold; }}
                  >View Action Plan →</button>
                </motion.div>
              ))}
            </div>
            {/* Total value footer */}
            <div className="mt-6 p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ borderColor: C.gold, background: C.goldGlow }}>
              <div>
                <p className="text-sm" style={{ color: C.text2 }}>Total identified improvement opportunity:</p>
                <p className="text-2xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: C.gold }}>$747,000/year</p>
              </div>
              <button className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, color: C.bgBase }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                Book Strategy Call →
              </button>
            </div>
          </div>
        </Card>

        {/* ─── SECTION 4: INDUSTRY TRENDS ──── */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card delay={4}>
            <div className="p-5">
              <Title>MENA Concrete Industry Trends</Title>
              <p className="text-[10px] mb-4" style={{ color: C.text2 }}>Industry averages across 54 producers, Q1 2023 – Q1 2025</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={industryTrends}>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                  <YAxis tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                  <Tooltip content={<GoldTooltip />} />
                  <Legend iconType="line" wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="efficiency" stroke={C.gold} strokeWidth={2} dot={false} name="Avg Efficiency" />
                  <Line type="monotone" dataKey="quality" stroke={C.success} strokeWidth={1.5} dot={false} name="Avg Quality" />
                  <Line type="monotone" dataKey="delivery" stroke={C.industry} strokeWidth={1.5} dot={false} name="Avg Delivery" />
                  <Line type="monotone" dataKey="cost" stroke={C.warning} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Avg Cost (lower=better)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card delay={5}>
            <div className="p-5">
              <Title>Industry Intelligence</Title>
              <div className="space-y-4 mt-2">
                {intelligenceFeed.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: item.color }} />
                    <div>
                      <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>{item.text}</p>
                      <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* ─── SECTION 5: PEER COMPARISON ──── */}
        <Card delay={6}>
          <div className="p-5 md:p-6">
            <Title>Anonymous Peer Comparison — Similar-Sized Producers</Title>
            <p className="text-xs mb-4" style={{ color: C.text2 }}>Compared to 12 producers with 40-60 trucks, 3-6 plants, MENA region</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: C.text2 }}>
                    {['Metric', 'You', 'Peer Avg', 'Peer Best', 'Your Rank'].map(h => (
                      <th key={h} className="text-left py-2 px-3 font-semibold uppercase tracking-wider" style={{ fontSize: 11, letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {peerComparison.map(p => (
                    <tr key={p.metric} style={{ borderBottom: `1px solid ${C.border}` }}
                      className="transition-colors duration-150"
                      onMouseEnter={e => (e.currentTarget.style.background = C.bgElevated)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-3 font-medium">{p.metric}</td>
                      <td className="py-3 px-3 font-mono font-bold" style={{ color: p.isFirst ? C.gold : p.aboveAvg ? C.success : C.text1 }}>{p.you}</td>
                      <td className="py-3 px-3 font-mono" style={{ color: C.text2 }}>{p.peerAvg}</td>
                      <td className="py-3 px-3 font-mono" style={{ color: C.text2 }}>{p.peerBest}</td>
                      <td className="py-3 px-3 font-mono font-semibold" style={{ color: p.isFirst ? C.gold : C.text1 }}>{p.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 rounded-lg flex items-center gap-3" style={{ background: C.bgElevated }}>
              <Trophy className="w-5 h-5" style={{ color: C.gold }} />
              <p className="text-sm">You are <span className="font-bold" style={{ color: C.gold }}>#2 overall</span> in your peer group. Quality and Safety are <span className="font-bold" style={{ color: C.gold }}>best-in-class</span>. 🏆</p>
            </div>
          </div>
        </Card>

        {/* Footer privacy */}
        <p className="text-center text-[10px] py-4" style={{ color: '#6B7280' }}>
          All benchmarking data is anonymized. Your data is never individually identifiable to other users.
        </p>
      </div>
    </div>
  );
}

// ─── DROPDOWN ───────────────────────────────────────
function Dropdown({ label, options, value, onChange, open, setOpen }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; open: boolean; setOpen: (v: boolean) => void;
}) {
  return (
    <div className="relative hidden md:block">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200"
        style={{ background: C.bgElevated, borderColor: 'transparent', color: C.text2 }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = C.gold)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
        {label} <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 rounded-lg border py-1 min-w-[180px]" style={{ background: C.bgCard, borderColor: C.border }}>
          {options.map(o => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }}
              className="block w-full text-left px-3 py-1.5 text-xs transition-colors duration-150"
              style={{ color: value === o ? C.gold : C.text2 }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bgElevated)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── METRIC DEEP DIVE TAB CONTENT ───────────────────
function MetricDeepDive({ tab }: { tab: MetricTab }) {
  const metric = METRICS.find(m => m.key === tab.toLowerCase()) || METRICS[0];
  const dist = distributions[tab] || distributions.Production;
  const trend = trendData[tab] || trendData.Production;
  const board = leaderboards[tab] || leaderboards.Production;
  const outperform = outperformPct[tab] || 73;

  const isCost = tab === 'Cost';
  const bucketLabels = Array.from({ length: 13 }, (_, i) => `${50 + i * 4}-${54 + i * 4}%`);
  const distChartData = dist.map((count, i) => ({ range: bucketLabels[i], count }));

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const trendChartData = months.map((m, i) => ({ month: m, you: trend.you[i], avg: trend.avg[i] }));

  const title = isCost ? 'Cost per m³ — Industry Distribution' : `${metric.label} — Industry Distribution`;
  const outperformText = isCost
    ? `You have LOWER costs than ${outperform}% of the industry`
    : `You outperform ${outperform}% of the industry`;

  return (
    <div className="space-y-5">
      {/* Distribution */}
      <div>
        <p className="text-sm font-semibold mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={distChartData}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
            <XAxis dataKey="range" tick={{ fill: C.text2, fontSize: 9 }} interval={1} axisLine={{ stroke: C.border }} />
            <YAxis tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
            <Tooltip content={<GoldTooltip />} />
            <Bar dataKey="count" fill={C.industry} radius={[3, 3, 0, 0]} name="Companies" />
            <ReferenceLine x={bucketLabels[Math.floor((metric.you - 50) / 4)]} stroke={C.gold} strokeWidth={2}
              label={{ value: 'YOU', position: 'top', fill: C.gold, fontSize: 12, fontWeight: 700 }} />
            <ReferenceLine x={bucketLabels[Math.floor((metric.top - 50) / 4)]} stroke={C.top10} strokeDasharray="4 4"
              label={{ value: 'Top 10%', position: 'top', fill: C.top10, fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-center text-sm mt-2" style={{ color: C.text2 }}>
          {outperformText.split(`${outperform}%`)[0]}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: C.gold, fontSize: 16 }}>{outperform}%</span>
          {outperformText.split(`${outperform}%`)[1]}
        </p>
      </div>

      {isCost && (
        <div className="p-4 rounded-lg" style={{ background: C.bgElevated }}>
          <p className="text-xs" style={{ color: C.text2 }}>
            Avg industry cost: <span className="font-mono font-semibold" style={{ color: C.text1 }}>$48.20/m³</span> ·
            Your cost: <span className="font-mono font-semibold" style={{ color: C.gold }}>$42.80/m³</span> ·
            Top 10%: <span className="font-mono font-semibold" style={{ color: C.top10 }}>$38.10/m³</span>
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Trend */}
        <div className="p-4 rounded-lg" style={{ background: C.bgElevated }}>
          <p className="text-sm font-semibold mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Trend vs Industry — 12 Months</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendChartData}>
              <defs>
                <linearGradient id={`trendGrad-${tab}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.gold} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
              <YAxis tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
              <Tooltip content={<GoldTooltip />} />
              <Area type="monotone" dataKey="you" stroke={C.gold} strokeWidth={2.5} fill={`url(#trendGrad-${tab})`} name="YOU" />
              <Line type="monotone" dataKey="avg" stroke={C.industry} strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Industry Avg" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Leaderboard */}
        <div className="p-4 rounded-lg" style={{ background: C.bgElevated }}>
          <p className="text-sm font-semibold mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Leaderboard — {metric.label}</p>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: C.text2 }}>
                <th className="text-left py-1.5 px-2 uppercase tracking-wider" style={{ fontSize: 10, letterSpacing: '0.06em' }}>Rank</th>
                <th className="text-left py-1.5 px-2 uppercase tracking-wider" style={{ fontSize: 10, letterSpacing: '0.06em' }}>Producer</th>
                <th className="text-right py-1.5 px-2 uppercase tracking-wider" style={{ fontSize: 10, letterSpacing: '0.06em' }}>Score</th>
                <th className="text-right py-1.5 px-2 uppercase tracking-wider" style={{ fontSize: 10, letterSpacing: '0.06em' }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {board.map(row => {
                const isYou = row.name === 'Atlas Concrete';
                const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : '';
                return (
                  <tr key={row.rank}
                    className="transition-colors duration-150"
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: isYou ? 'rgba(255,215,0,0.08)' : 'transparent',
                    }}>
                    <td className="py-2 px-2 font-mono font-bold" style={{ color: isYou ? C.gold : C.text2 }}>{medal} {row.rank}</td>
                    <td className="py-2 px-2 font-medium" style={{ color: isYou ? C.gold : C.text1 }}>
                      {row.name}{isYou && <span className="ml-1 text-[10px]" style={{ color: C.gold }}>← YOU</span>}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: isYou ? C.gold : C.text1 }}>{row.score}</td>
                    <td className="py-2 px-2 text-right" style={{ color: row.trend === '▲' ? C.success : row.trend === '▼' ? C.danger : C.text2 }}>{row.trend}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {tabExtras[tab] || null}
    </div>
  );
}
