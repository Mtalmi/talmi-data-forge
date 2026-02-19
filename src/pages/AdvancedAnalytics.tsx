import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  Legend, ScatterChart, Scatter,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  Calendar, Download, ChevronDown, Factory, TrendingUp, TrendingDown,
  Zap, Truck, CheckCircle, DollarSign, Clock, Gauge, AlertTriangle,
  Beaker, BarChart3, Activity,
} from 'lucide-react';

// ─── COLORS ─────────────────────────────────────────────────────────
const C = {
  bgBase: '#0F1419',
  bgCard: '#161D26',
  bgElevated: '#1C2533',
  gold: '#FFD700',
  goldDim: '#B8960C',
  goldGlow: 'rgba(255,215,0,0.09)',
  text1: '#FFFFFF',
  text2: '#B0B8C1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#2A3545',
};

// ─── ANIMATED COUNTER ───────────────────────────────────────────────
function useCounter(target: number, duration = 1000, decimals = 0) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * target);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
}

function KpiCounter({ value, suffix = '', prefix = '', decimals = 0 }: { value: number; suffix?: string; prefix?: string; decimals?: number }) {
  const display = useCounter(value, 1000, decimals);
  return <span>{prefix}{display}{suffix}</span>;
}

// ─── CIRCULAR PROGRESS RING ─────────────────────────────────────────
function ProgressRing({ percent, color, size = 60, stroke = 4, label }: { percent: number; color: string; size?: number; stroke?: number; label: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <span style={{ color: C.text1, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>{percent}%</span>
      <span style={{ color: C.text2, fontSize: 11 }}>{label}</span>
    </div>
  );
}

// ─── CUSTOM TOOLTIP ─────────────────────────────────────────────────
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

// ─── MOCK DATA ──────────────────────────────────────────────────────
const PRODUCTION_12M = {
  thisYear: [3200,3800,4100,3900,4400,4800,5100,4900,4200,4600,4800,4870],
  lastYear: [2900,3200,3600,3400,3900,4200,4400,4100,3800,4000,4200,4100],
  months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
};
const productionAreaData = PRODUCTION_12M.months.map((m, i) => ({ month: m, thisYear: PRODUCTION_12M.thisYear[i], lastYear: PRODUCTION_12M.lastYear[i] }));

const revenueDonut = [
  { name: 'Ready Mix', value: 58, color: C.gold },
  { name: 'Precast', value: 22, color: C.success },
  { name: 'Specialty Mix', value: 12, color: C.warning },
  { name: 'Other', value: 8, color: C.text2 },
];

const plants = [
  { name: 'Casablanca North', efficiency: 97.2, color: C.gold },
  { name: 'Rabat Central', efficiency: 94.8, color: C.success },
  { name: 'Marrakech', efficiency: 91.3, color: C.success },
  { name: 'Tangier', efficiency: 88.1, color: C.warning },
];

const aiInsights = [
  { color: C.success, text: 'Production efficiency up 14% — driven by reduced batch cycle time in Casablanca' },
  { color: C.warning, text: 'Fleet idle time increased 8% in Tangier — recommend route optimization review' },
  { color: C.danger, text: 'Raw material costs trending +6% — consider forward purchasing limestone' },
];

const goals = [
  { label: 'Production', pct: 87, color: C.gold },
  { label: 'Revenue', pct: 92, color: C.gold },
  { label: 'Quality', pct: 99, color: C.success },
  { label: 'Deliveries', pct: 78, color: C.warning },
];

// Production tab
const hourlyProduction = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  volume: [12,8,5,3,2,4,18,32,41,38,36,40,38,35,37,39,41,38,32,28,22,18,14,10][i],
}));
const batchQuality = [
  { type: 'Concrete C25', pct: 38 },
  { type: 'Concrete C30', pct: 29 },
  { type: 'Concrete C35', pct: 18 },
  { type: 'Concrete C40', pct: 11 },
  { type: 'Specialty', pct: 4 },
];
const productionBatches = [
  { id: 'BCH-2840', mix: 'C30', volume: '8 m³', plant: 'Casablanca', time: '14:32', quality: 96, status: 'Delivered' },
  { id: 'BCH-2839', mix: 'C25', volume: '6 m³', plant: 'Rabat', time: '14:18', quality: 98, status: 'In Transit' },
  { id: 'BCH-2838', mix: 'C35', volume: '7 m³', plant: 'Casablanca', time: '14:05', quality: 94, status: 'Delivered' },
  { id: 'BCH-2837', mix: 'C40', volume: '5 m³', plant: 'Marrakech', time: '13:48', quality: 97, status: 'Mixing' },
  { id: 'BCH-2836', mix: 'C30', volume: '8 m³', plant: 'Tangier', time: '13:30', quality: 95, status: 'Delivered' },
  { id: 'BCH-2835', mix: 'C25', volume: '6 m³', plant: 'Casablanca', time: '13:15', quality: 99, status: 'Delivered' },
  { id: 'BCH-2834', mix: 'C35', volume: '7 m³', plant: 'Rabat', time: '13:02', quality: 93, status: 'In Transit' },
  { id: 'BCH-2833', mix: 'C30', volume: '8 m³', plant: 'Casablanca', time: '12:45', quality: 96, status: 'Delivered' },
  { id: 'BCH-2832', mix: 'C25', volume: '6 m³', plant: 'Marrakech', time: '12:30', quality: 98, status: 'Delivered' },
  { id: 'BCH-2831', mix: 'C40', volume: '5 m³', plant: 'Tangier', time: '12:12', quality: 91, status: 'Delivered' },
];

// Financial
const revCostData = PRODUCTION_12M.months.map((m, i) => ({
  month: m,
  revenue: [210,230,245,235,260,280,290,275,255,270,280,284][i],
  cost: [132,142,150,146,159,170,177,168,158,166,171,175][i],
}));
const costBreakdown = ['Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => ({
  month: m,
  Labor: [42,44,46,43,45,47][i],
  Materials: [68,70,72,69,71,74][i],
  Fleet: [32,30,33,31,29,32][i],
  Overhead: [25,24,26,25,26,22][i],
}));
const topCustomers = [
  { rank: 1, name: 'Moroccan Railways', revenue: '$420K', pct: '14.8%', trend: '▲' },
  { rank: 2, name: 'Al Omrane Group', revenue: '$380K', pct: '13.4%', trend: '▲' },
  { rank: 3, name: 'Addoha Corp', revenue: '$290K', pct: '10.2%', trend: '→' },
  { rank: 4, name: 'Maroc Telecom', revenue: '$210K', pct: '7.4%', trend: '▼' },
  { rank: 5, name: 'CIH Bank HQ', revenue: '$180K', pct: '6.3%', trend: '▲' },
];
const arAging = [
  { bucket: 'Current (0-30d)', amount: 180, color: C.success },
  { bucket: '30-60d', amount: 95, color: C.warning },
  { bucket: '60-90d', amount: 42, color: '#F97316' },
  { bucket: '90d+', amount: 23, color: C.danger },
];

// Fleet
const fleetUtilization = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  util: [5,3,2,2,3,8,22,58,82,88,91,89,85,87,90,88,82,68,45,30,18,12,8,6][i],
}));
const deliveryPerf = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => ({
  day: d,
  onTime: [42,38,45,40,44,30,15][i],
  late: [3,5,2,4,3,2,1][i],
  early: [5,7,3,6,3,8,4][i],
}));
const fleetTable = [
  { id: 'TRK-001', driver: 'Ahmed K.', status: 'delivering', location: 'Casablanca Anfa', load: 'C30 / 8m³', eta: '12 min' },
  { id: 'TRK-002', driver: 'Said M.', status: 'loading', location: 'Plant Nord', load: 'C25 / 6m³', eta: '—' },
  { id: 'TRK-003', driver: 'Youssef A.', status: 'delivering', location: 'Rabat Agdal', load: 'C35 / 7m³', eta: '28 min' },
  { id: 'TRK-004', driver: 'Hassan B.', status: 'maintenance', location: 'Depot', load: '—', eta: '—' },
  { id: 'TRK-005', driver: 'Karima L.', status: 'returning', location: 'Route N1', load: 'Empty', eta: '8 min' },
];

// Quality
const qualityTrend = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  score: 95 + Math.random() * 5,
}));
const failureReasons = [
  { name: 'Slump OOSpec', value: 42, color: C.danger },
  { name: 'Strength Low', value: 31, color: '#F97316' },
  { name: 'Air Content', value: 18, color: C.warning },
  { name: 'Other', value: 9, color: C.text2 },
];
const testResults = [
  { id: 'QT-1247', mix: 'C30', plant: 'Casablanca', slump: '145mm', strength: '32.4 MPa', air: '4.2%', result: 'PASS', time: '14:30' },
  { id: 'QT-1246', mix: 'C25', plant: 'Rabat', slump: '138mm', strength: '27.1 MPa', air: '3.8%', result: 'PASS', time: '14:15' },
  { id: 'QT-1245', mix: 'C35', plant: 'Casablanca', slump: '152mm', strength: '36.8 MPa', air: '4.5%', result: 'PASS', time: '13:58' },
  { id: 'QT-1244', mix: 'C40', plant: 'Marrakech', slump: '128mm', strength: '38.2 MPa', air: '3.2%', result: 'FAIL', time: '13:40' },
  { id: 'QT-1243', mix: 'C30', plant: 'Tangier', slump: '142mm', strength: '31.9 MPa', air: '4.0%', result: 'PASS', time: '13:22' },
  { id: 'QT-1242', mix: 'C25', plant: 'Casablanca', slump: '148mm', strength: '26.5 MPa', air: '4.1%', result: 'PASS', time: '13:05' },
  { id: 'QT-1241', mix: 'C35', plant: 'Rabat', slump: '155mm', strength: '34.2 MPa', air: '4.8%', result: 'PENDING', time: '12:48' },
  { id: 'QT-1240', mix: 'C30', plant: 'Casablanca', slump: '140mm', strength: '33.0 MPa', air: '3.9%', result: 'PASS', time: '12:30' },
];

// ─── TAB DEFINITIONS ────────────────────────────────────────────────
const TABS = ['Executive', 'Production', 'Financial', 'Fleet', 'Quality'] as const;
type Tab = typeof TABS[number];

const DATE_RANGES = ['Today', 'Last 7 Days', 'Last 30 Days', 'Last Quarter', 'Last Year', 'Custom Range'];
const PLANTS_LIST = ['All Plants', 'Casablanca North', 'Rabat Central', 'Marrakech', 'Tangier'];

// ─── STAGGER ANIMATION ─────────────────────────────────────────────
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.3, ease: 'easeOut' },
});

// ─── STATUS BADGE ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot?: boolean }> = {
    'Delivered': { bg: 'rgba(16,185,129,0.15)', text: C.success },
    'In Transit': { bg: 'rgba(255,215,0,0.12)', text: C.gold },
    'Mixing': { bg: 'rgba(245,158,11,0.15)', text: C.warning },
    'PASS': { bg: 'rgba(16,185,129,0.15)', text: C.success },
    'FAIL': { bg: 'rgba(239,68,68,0.15)', text: C.danger },
    'PENDING': { bg: 'rgba(255,215,0,0.12)', text: C.gold },
    'delivering': { bg: 'rgba(16,185,129,0.15)', text: C.success, dot: true },
    'loading': { bg: 'rgba(255,215,0,0.12)', text: C.gold, dot: true },
    'maintenance': { bg: 'rgba(239,68,68,0.15)', text: C.danger },
    'returning': { bg: 'rgba(16,185,129,0.15)', text: C.success, dot: true },
  };
  const s = map[status] || { bg: 'rgba(176,184,193,0.1)', text: C.text2 };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.text }}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.text }} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── CARD WRAPPER ───────────────────────────────────────────────────
function DashCard({ children, className, style, delay = 0 }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number }) {
  return (
    <motion.div {...stagger(delay)}
      className={cn('rounded-xl border', className)}
      style={{
        background: C.bgCard, borderColor: C.border,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        ...style,
      }}
      whileHover={{ y: -3, borderColor: C.gold, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}

// ─── SECTION TITLE ──────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, color: C.text1, marginBottom: 12 }}>
      {children}
    </h3>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function AdvancedAnalytics() {
  const [activeTab, setActiveTab] = useState<Tab>('Executive');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [dateOpen, setDateOpen] = useState(false);
  const [plantSel, setPlantSel] = useState('All Plants');
  const [plantOpen, setPlantOpen] = useState(false);
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleExport = () => {
    setExportState('loading');
    setTimeout(() => { setExportState('done'); setTimeout(() => setExportState('idle'), 1500); }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.bgBase, color: C.text1,
      backgroundImage: `radial-gradient(${C.gold}05 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    }}>
      {/* Gold shimmer line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${C.gold}, transparent 40%, transparent 60%, ${C.gold})` }} />

      {/* ─── TOP NAV ─────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-4 md:px-6 py-3 border-b" style={{ borderColor: C.border, background: C.bgCard }}>
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, color: C.bgBase }}>
            T
          </div>
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: C.gold, fontFamily: "'Poppins', sans-serif" }}>
            ANALYTICS
          </span>
        </div>

        {/* Center tabs */}
        <div className="hidden md:flex items-center gap-1">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-sm font-medium relative transition-colors duration-200"
              style={{
                color: activeTab === tab ? C.gold : C.text2,
                fontFamily: "'Poppins', sans-serif",
              }}
              onMouseEnter={e => { if (activeTab !== tab) (e.target as HTMLElement).style.color = C.text1; }}
              onMouseLeave={e => { if (activeTab !== tab) (e.target as HTMLElement).style.color = C.text2; }}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: C.gold }} />
              )}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Date range */}
          <div className="relative">
            <button onClick={() => { setDateOpen(!dateOpen); setPlantOpen(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200"
              style={{ background: C.bgElevated, borderColor: 'transparent', color: C.text2 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.gold)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <Calendar className="w-3.5 h-3.5" /> {dateRange} <ChevronDown className="w-3 h-3" />
            </button>
            {dateOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-lg border py-1 min-w-[160px]"
                style={{ background: C.bgCard, borderColor: C.border }}>
                {DATE_RANGES.map(r => (
                  <button key={r} onClick={() => { setDateRange(r); setDateOpen(false); }}
                    className="block w-full text-left px-3 py-1.5 text-xs transition-colors duration-150"
                    style={{ color: dateRange === r ? C.gold : C.text2 }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bgElevated)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >{r}</button>
                ))}
              </div>
            )}
          </div>

          {/* Export */}
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
            style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, color: C.bgBase }}
          >
            {exportState === 'loading' ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generating...</>
             : exportState === 'done' ? <><CheckCircle className="w-3.5 h-3.5" /> Exported!</>
             : <><Download className="w-3.5 h-3.5" /> Export PDF</>}
          </button>

          {/* Plant */}
          <div className="relative hidden lg:block">
            <button onClick={() => { setPlantOpen(!plantOpen); setDateOpen(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200"
              style={{ background: C.bgElevated, borderColor: 'transparent', color: C.text2 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.gold)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <Factory className="w-3.5 h-3.5" /> {plantSel} <ChevronDown className="w-3 h-3" />
            </button>
            {plantOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-lg border py-1 min-w-[180px]"
                style={{ background: C.bgCard, borderColor: C.border }}>
                {PLANTS_LIST.map(p => (
                  <button key={p} onClick={() => { setPlantSel(p); setPlantOpen(false); }}
                    className="block w-full text-left px-3 py-1.5 text-xs transition-colors duration-150"
                    style={{ color: plantSel === p ? C.gold : C.text2 }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bgElevated)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >{p}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile tabs */}
      <div className="md:hidden flex overflow-x-auto border-b px-2 py-1.5 gap-1" style={{ borderColor: C.border, background: C.bgCard }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-all duration-200"
            style={{
              color: activeTab === tab ? C.bgBase : C.text2,
              background: activeTab === tab ? C.gold : 'transparent',
            }}
          >{tab}</button>
        ))}
      </div>

      {/* ─── CONTENT ─────────────────────────────────────── */}
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'Executive' && <ExecutiveTab />}
            {activeTab === 'Production' && <ProductionTab />}
            {activeTab === 'Financial' && <FinancialTab />}
            {activeTab === 'Fleet' && <FleetTab />}
            {activeTab === 'Quality' && <QualityTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: EXECUTIVE
// ═══════════════════════════════════════════════════════════════════
function ExecutiveTab() {
  const kpis = [
    { label: 'Total Production', value: 48420, suffix: ' m³', delta: '+14%', up: true, icon: '🏗️' },
    { label: 'Revenue', value: 2.84, suffix: 'M', prefix: '$', delta: '+9%', up: true, icon: '💰', decimals: 2 },
    { label: 'Avg Batch Efficiency', value: 94.2, suffix: '%', delta: '+2.1pp', up: true, icon: '⚡', decimals: 1 },
    { label: 'Fleet Utilization', value: 87.6, suffix: '%', delta: '+5.3%', up: true, icon: '🚛', decimals: 1 },
    { label: 'Quality Pass Rate', value: 98.8, suffix: '%', delta: '+0.4pp', up: true, icon: '✅', decimals: 1 },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <DashCard key={k.label} delay={i} style={{ borderTop: `3px solid ${C.gold}` }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{k.icon}</span>
                <span className="text-xs font-semibold" style={{ color: k.up ? C.success : C.danger }}>
                  {k.up ? '▲' : '▼'} {k.delta}
                </span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: C.text1 }}>
                <KpiCounter value={k.value} prefix={k.prefix} suffix={k.suffix} decimals={k.decimals || 0} />
              </div>
              <p className="text-xs mt-1" style={{ color: C.text2 }}>{k.label}</p>
            </div>
          </DashCard>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Production Volume */}
        <DashCard delay={5} className="lg:col-span-3">
          <div className="p-5">
            <SectionTitle>Production Volume — Last 12 Months</SectionTitle>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={productionAreaData}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.gold} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: C.text2, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                <YAxis tick={{ fill: C.text2, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                <Tooltip content={<GoldTooltip />} />
                <Area type="monotone" dataKey="lastYear" stroke={C.text2} strokeWidth={1.5} fill="rgba(176,184,193,0.08)" name="Last Year" />
                <Area type="monotone" dataKey="thisYear" stroke={C.gold} strokeWidth={2} fill="url(#goldGrad)" name="This Year" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashCard>

        {/* Revenue Donut */}
        <DashCard delay={6} className="lg:col-span-2">
          <div className="p-5">
            <SectionTitle>Revenue by Product Type</SectionTitle>
            <div className="flex justify-center">
              <ResponsiveContainer width={240} height={240}>
                <PieChart>
                  <Pie data={revenueDonut} dataKey="value" cx="50%" cy="50%" innerRadius={70} outerRadius={110} strokeWidth={0}>
                    {revenueDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<GoldTooltip />} />
                  {/* Center text via foreignObject doesn't work reliably, use label */}
                  <text x="50%" y="46%" textAnchor="middle" style={{ fill: C.gold, fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700 }}>$2.84M</text>
                  <text x="50%" y="56%" textAnchor="middle" style={{ fill: C.text2, fontSize: 11 }}>Total Revenue</text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              {revenueDonut.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs" style={{ color: C.text2 }}>{d.name} ({d.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </DashCard>
      </div>

      {/* Second Row */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Plant Rankings */}
        <DashCard delay={7}>
          <div className="p-5">
            <SectionTitle>Plant Performance Ranking</SectionTitle>
            <div className="space-y-3">
              {plants.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, color: C.bgBase }}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: p.color }}>{p.efficiency}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.bgElevated }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.efficiency}%`, background: p.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashCard>

        {/* AI Insights */}
        <DashCard delay={8}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>AI Insights</SectionTitle>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: C.gold, color: C.bgBase }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.bgBase }} />
                LIVE
              </span>
            </div>
            <div className="space-y-3">
              {aiInsights.map((ins, i) => (
                <div key={i} className="rounded-lg p-3 border-l-[3px]" style={{ background: C.bgElevated, borderLeftColor: ins.color }}>
                  <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>{ins.text}</p>
                  <button className="text-[11px] font-semibold mt-2 transition-opacity hover:opacity-80" style={{ color: C.gold }}>
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </DashCard>

        {/* Goal Progress */}
        <DashCard delay={9}>
          <div className="p-5">
            <SectionTitle>Monthly Targets</SectionTitle>
            <div className="flex justify-around items-center pt-4">
              {goals.map(g => (
                <ProgressRing key={g.label} percent={g.pct} color={g.color} label={g.label} />
              ))}
            </div>
          </div>
        </DashCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2: PRODUCTION
// ═══════════════════════════════════════════════════════════════════
function ProductionTab() {
  const kpis = [
    { label: 'Batches Today', value: '284', sub: 'Target: 300' },
    { label: 'Avg Cycle Time', value: '18.4 min', sub: '▼ 1.2 min', good: true },
    { label: 'Plant Utilization', value: '91%', sub: 'On target' },
    { label: 'Waste Rate', value: '1.8%', sub: '▼ 0.3%', good: true },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <DashCard key={k.label} delay={i} style={{ borderTop: `3px solid ${C.gold}` }}>
            <div className="p-4">
              <p className="text-xs mb-1" style={{ color: C.text2 }}>{k.label}</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700 }}>{k.value}</p>
              <p className="text-xs mt-1" style={{ color: k.good ? C.success : C.text2 }}>{k.sub}</p>
            </div>
          </DashCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <DashCard delay={4}>
          <div className="p-5">
            <SectionTitle>Hourly Production Today</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hourlyProduction}>
                <defs>
                  <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.gold} />
                    <stop offset="100%" stopColor={C.goldDim} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fill: C.text2, fontSize: 9 }} interval={2} axisLine={{ stroke: C.border }} />
                <YAxis tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                <Tooltip content={<GoldTooltip />} />
                <ReferenceLine y={35} stroke={C.text1} strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: 'Target', fill: C.text2, fontSize: 10, position: 'right' }} />
                <Bar dataKey="volume" fill="url(#barGold)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashCard>

        <DashCard delay={5}>
          <div className="p-5">
            <SectionTitle>Batch Quality Distribution</SectionTitle>
            <div className="space-y-3 pt-2">
              {batchQuality.map((b, i) => (
                <div key={b.type} className="flex items-center gap-3">
                  <span className="text-xs w-24 text-right" style={{ color: C.text2 }}>{b.type}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: C.bgElevated }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${b.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldDim})`, opacity: 1 - i * 0.15 }} />
                  </div>
                  <span className="text-xs font-bold w-8 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", color: C.gold }}>{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </DashCard>
      </div>

      {/* Batches Table */}
      <DashCard delay={6}>
        <div className="p-5 overflow-x-auto">
          <SectionTitle>Last 10 Batches</SectionTitle>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: C.text2 }}>
                {['Batch ID', 'Mix Type', 'Volume', 'Plant', 'Time', 'Quality Score', 'Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 font-semibold uppercase tracking-wider" style={{ fontSize: 11, letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productionBatches.map(b => (
                <tr key={b.id} className="transition-colors duration-150" style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bgElevated)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: C.gold }}>{b.id}</td>
                  <td className="py-2.5 px-3">{b.mix}</td>
                  <td className="py-2.5 px-3 font-mono">{b.volume}</td>
                  <td className="py-2.5 px-3">{b.plant}</td>
                  <td className="py-2.5 px-3 font-mono">{b.time}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: b.quality >= 95 ? C.success : C.warning }}>{b.quality}</td>
                  <td className="py-2.5 px-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3: FINANCIAL
// ═══════════════════════════════════════════════════════════════════
function FinancialTab() {
  const kpis = [
    { label: 'Monthly Revenue', value: '$2.84M', delta: '▲ 9%', up: true },
    { label: 'Cost per m³', value: '$42.80', delta: '▼ $2.10', up: true },
    { label: 'Gross Margin', value: '38.4%', delta: '▲ 1.8pp', up: true },
    { label: 'Outstanding AR', value: '$340K', delta: '12 invoices', up: false, neutral: true },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <DashCard key={k.label} delay={i} style={{ borderTop: `3px solid ${C.gold}` }}>
            <div className="p-4">
              <p className="text-xs mb-1" style={{ color: C.text2 }}>{k.label}</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700 }}>{k.value}</p>
              <p className="text-xs mt-1" style={{ color: k.neutral ? C.text2 : k.up ? C.success : C.danger }}>{k.delta}</p>
            </div>
          </DashCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <DashCard delay={4}>
          <div className="p-5">
            <SectionTitle>Revenue vs Cost Trend</SectionTitle>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revCostData}>
                <defs>
                  <linearGradient id="marginFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.success} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={C.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: C.text2, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                <YAxis tickFormatter={v => `$${v*10}K`} tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                <Tooltip content={<GoldTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke={C.gold} strokeWidth={2} fill="url(#marginFill)" name="Revenue ($10K)" />
                <Line type="monotone" dataKey="cost" stroke={C.danger} strokeWidth={2} dot={false} name="Cost ($10K)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashCard>

        <DashCard delay={5}>
          <div className="p-5">
            <SectionTitle>Cost Breakdown</SectionTitle>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={costBreakdown}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: C.text2, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                <YAxis tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                <Tooltip content={<GoldTooltip />} />
                <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: C.text2 }} />
                <Bar dataKey="Labor" stackId="a" fill={C.gold} />
                <Bar dataKey="Materials" stackId="a" fill={C.success} />
                <Bar dataKey="Fleet" stackId="a" fill={C.warning} />
                <Bar dataKey="Overhead" stackId="a" fill={C.text2} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <DashCard delay={6}>
          <div className="p-5 overflow-x-auto">
            <SectionTitle>Top Customers by Revenue</SectionTitle>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: C.text2 }}>
                  {['Rank', 'Customer', 'Revenue', '% of Total', 'Trend'].map(h => (
                    <th key={h} className="text-left py-2 px-3 font-semibold uppercase tracking-wider" style={{ fontSize: 11, letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.map(c => (
                  <tr key={c.rank} className="transition-colors duration-150" style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bgElevated)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold" style={{ color: C.gold }}>{c.rank}</td>
                    <td className="py-2.5 px-3 font-medium">{c.name}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold">{c.revenue}</td>
                    <td className="py-2.5 px-3 font-mono">{c.pct}</td>
                    <td className="py-2.5 px-3" style={{ color: c.trend === '▲' ? C.success : c.trend === '▼' ? C.danger : C.text2 }}>{c.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashCard>

        <DashCard delay={7}>
          <div className="p-5">
            <SectionTitle>AR Aging Buckets</SectionTitle>
            <div className="space-y-3 pt-2">
              {arAging.map((a, i) => (
                <div key={a.bucket} className="flex items-center gap-3">
                  <span className="text-xs w-28 text-right" style={{ color: C.text2 }}>{a.bucket}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: C.bgElevated }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(a.amount / 180) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full" style={{ background: a.color }} />
                  </div>
                  <span className="text-xs font-bold w-12 text-right font-mono">${a.amount}K</span>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t" style={{ borderColor: C.border }}>
                <span className="text-sm font-bold font-mono" style={{ color: C.gold }}>Total: $340K</span>
              </div>
            </div>
          </div>
        </DashCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 4: FLEET
// ═══════════════════════════════════════════════════════════════════
function FleetTab() {
  const kpis = [
    { label: 'Active Trucks', value: '34 / 38', sub: '2 in maintenance' },
    { label: 'On-Time Delivery', value: '94.2%', sub: '▲ 2.1%', good: true },
    { label: 'Avg Delivery Time', value: '47 min', sub: '▼ 4 min', good: true },
    { label: 'Fuel Cost Today', value: '$1,840', sub: '▼ 8%', good: true },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <DashCard key={k.label} delay={i} style={{ borderTop: `3px solid ${C.gold}` }}>
            <div className="p-4">
              <p className="text-xs mb-1" style={{ color: C.text2 }}>{k.label}</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700 }}>{k.value}</p>
              <p className="text-xs mt-1" style={{ color: k.good ? C.success : C.text2 }}>{k.sub}</p>
            </div>
          </DashCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <DashCard delay={4}>
          <div className="p-5">
            <SectionTitle>Fleet Utilization by Hour</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fleetUtilization}>
                <defs>
                  <linearGradient id="fleetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.gold} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fill: C.text2, fontSize: 9 }} interval={2} axisLine={{ stroke: C.border }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                <Tooltip content={<GoldTooltip />} />
                <Area type="monotone" dataKey="util" stroke={C.gold} strokeWidth={2} fill="url(#fleetGrad)" name="Utilization %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashCard>

        <DashCard delay={5}>
          <div className="p-5">
            <SectionTitle>Delivery Performance by Day</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deliveryPerf}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: C.text2, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                <YAxis tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                <Tooltip content={<GoldTooltip />} />
                <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="onTime" fill={C.success} name="On-Time" radius={[3, 3, 0, 0]} />
                <Bar dataKey="late" fill={C.danger} name="Late" radius={[3, 3, 0, 0]} />
                <Bar dataKey="early" fill={C.gold} name="Early" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashCard>
      </div>

      <DashCard delay={6}>
        <div className="p-5 overflow-x-auto">
          <SectionTitle>Live Fleet Status</SectionTitle>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: C.text2 }}>
                {['Truck ID', 'Driver', 'Status', 'Location', 'Load', 'ETA'].map(h => (
                  <th key={h} className="text-left py-2 px-3 font-semibold uppercase tracking-wider" style={{ fontSize: 11, letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fleetTable.map(t => (
                <tr key={t.id} className="transition-colors duration-150" style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bgElevated)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: C.gold }}>{t.id}</td>
                  <td className="py-2.5 px-3 font-medium">{t.driver}</td>
                  <td className="py-2.5 px-3"><StatusBadge status={t.status} /></td>
                  <td className="py-2.5 px-3">{t.location}</td>
                  <td className="py-2.5 px-3 font-mono">{t.load}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold">{t.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 5: QUALITY
// ═══════════════════════════════════════════════════════════════════
function QualityTab() {
  const kpis = [
    { label: 'Pass Rate', value: '98.8%', sub: '▲ 0.4%', good: true },
    { label: 'Tests Today', value: '47', sub: '0 failures' },
    { label: 'Avg Slump', value: '142mm', sub: 'Within spec' },
    { label: 'NC Reports', value: '2', sub: 'This week' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <DashCard key={k.label} delay={i} style={{ borderTop: `3px solid ${C.gold}` }}>
            <div className="p-4">
              <p className="text-xs mb-1" style={{ color: C.text2 }}>{k.label}</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700 }}>{k.value}</p>
              <p className="text-xs mt-1" style={{ color: k.good ? C.success : C.text2 }}>{k.sub}</p>
            </div>
          </DashCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <DashCard delay={4}>
          <div className="p-5">
            <SectionTitle>Quality Score Trend — 30 Days</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={qualityTrend}>
                <defs>
                  <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.gold} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                <YAxis domain={[88, 101]} tick={{ fill: C.text2, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                <Tooltip content={<GoldTooltip />} />
                {/* Acceptable zone */}
                <ReferenceLine y={95} stroke={C.success} strokeOpacity={0.3} />
                <ReferenceLine y={100} stroke={C.success} strokeOpacity={0.3} />
                <ReferenceLine y={90} stroke={C.danger} strokeDasharray="6 3" label={{ value: 'Min', fill: C.danger, fontSize: 10 }} />
                <Area type="monotone" dataKey="score" stroke={C.gold} strokeWidth={2} fill="url(#qualGrad)" name="Quality Score %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashCard>

        <DashCard delay={5}>
          <div className="p-5">
            <SectionTitle>Failure Reasons</SectionTitle>
            <div className="flex justify-center">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie data={failureReasons} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={95} strokeWidth={0}>
                    {failureReasons.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<GoldTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              {failureReasons.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs" style={{ color: C.text2 }}>{d.name} ({d.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </DashCard>
      </div>

      <DashCard delay={6}>
        <div className="p-5 overflow-x-auto">
          <SectionTitle>Recent Test Results</SectionTitle>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: C.text2 }}>
                {['Test ID', 'Mix', 'Plant', 'Slump', 'Strength', 'Air', 'Result', 'Time'].map(h => (
                  <th key={h} className="text-left py-2 px-3 font-semibold uppercase tracking-wider" style={{ fontSize: 11, letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {testResults.map(t => (
                <tr key={t.id} className="transition-colors duration-150" style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bgElevated)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: C.gold }}>{t.id}</td>
                  <td className="py-2.5 px-3">{t.mix}</td>
                  <td className="py-2.5 px-3">{t.plant}</td>
                  <td className="py-2.5 px-3 font-mono">{t.slump}</td>
                  <td className="py-2.5 px-3 font-mono">{t.strength}</td>
                  <td className="py-2.5 px-3 font-mono">{t.air}</td>
                  <td className="py-2.5 px-3"><StatusBadge status={t.result} /></td>
                  <td className="py-2.5 px-3 font-mono">{t.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashCard>
    </div>
  );
}
