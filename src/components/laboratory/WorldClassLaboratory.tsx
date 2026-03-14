import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import {
  FlaskConical, CheckCircle, AlertTriangle, Clock, Plus,
  FileText, Bell, Zap, Droplets, Activity, CloudRain,
  TrendingUp, BookOpen, ChevronDown, ChevronUp, User,
  OctagonX, Eye, CheckCheck, Brain, Search, LineChart,
  Filter, BarChart3,
} from 'lucide-react';
import { ReferenceLine } from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#D4A843',
  goldGlow:   'rgba(212,168,67,0.16)',
  goldBorder: 'rgba(212,168,67,0.28)',
  navy:       '#0B1120',
  cardBg:     'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success:    '#22C55E',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#3B82F6',
  purple:     '#8B5CF6',
  cyan:       '#06B6D4',
  orange:     '#F97316',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#9CA3AF',
};

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

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
// LIVE DATA HOOK
// ─────────────────────────────────────────────────────
function useLaboratoryLiveData() {
  const [kpis, setKpis] = useState({ testsToday: 8, conformes: 7, nonConformes: 1, enAttente: 2 });
  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: batches } = await supabase.from('production_batches')
        .select('id, bl_id, batch_number, quality_status, variance_ciment_pct, variance_eau_pct, created_at')
        .gte('created_at', today)
        .order('created_at', { ascending: false });
      if (batches?.length) {
        const conformes = batches.filter(b => b.quality_status === 'conforme').length;
        const nonConformes = batches.filter(b => b.quality_status === 'non_conforme').length;
        const enAttente = batches.filter(b => !b.quality_status || b.quality_status === 'pending').length;
        setKpis({ testsToday: batches.length, conformes, nonConformes, enAttente });
      }
    } catch (err) { console.error('Laboratory live data error:', err); }
  }, []);
  useEffect(() => {
    fetchData();
    const channel = supabase.channel('wc-laboratory-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);
  return { kpis };
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
        boxShadow: hov ? `0 14px 36px rgba(0,0,0,0.3), 0 0 28px ${T.goldGlow}` : '0 4px 14px rgba(0,0,0,0.1)',
        transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)', ...style,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 220ms' }} />
      {children}
    </div>
  );
}

function Bdg({ label, color, bg, pulse, icon: Icon, border: borderOverride }: { label: string; color: string; bg: string; pulse?: boolean; icon?: React.ElementType; border?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: bg, border: borderOverride || `1px solid ${color}40`, color, fontSize: 11, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0 }}>
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
        <span style={{ color: T.gold, fontFamily: MONO, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>{label}</span>
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
  'Slump': Droplets, 'Résistance 7j': Zap, 'Résistance 28j': Zap,
  'Température': Activity, 'Air occlus': CloudRain,
};
const TEST_TYPE_COLOR: Record<string, string> = {
  'Slump': '#D4A843', 'Résistance 7j': '#C49A3C', 'Résistance 28j': '#E8C96A',
  'Température': '#A07C2E', 'Air occlus': '#8B6914',
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
  { name: 'Slump',          count: 3, color: '#D4A843' },
  { name: 'Résistance 7j',  count: 2, color: '#C49A3C' },
  { name: 'Résistance 28j', count: 1, color: '#E8C96A' },
  { name: 'Température',    count: 1, color: '#A07C2E' },
  { name: 'Air occlus',     count: 1, color: '#8B6914' },
];

const BATCH_DIST = [
  { batch: 'BN-0142', conf: 1, nonConf: 0, enAttente: 0 },
  { batch: 'BN-0141', conf: 1, nonConf: 0, enAttente: 0 },
  { batch: 'BN-0140', conf: 0, nonConf: 1, enAttente: 0 },
  { batch: 'BN-0139', conf: 1, nonConf: 0, enAttente: 0 },
  { batch: 'BN-0138', conf: 1, nonConf: 0, enAttente: 0 },
  { batch: 'BN-0137', conf: 1, nonConf: 0, enAttente: 0 },
  { batch: 'BN-0136', conf: 1, nonConf: 0, enAttente: 0 },
  { batch: 'BN-0135', conf: 0, nonConf: 0, enAttente: 1 },
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

const ALERT_TIMELINE = [
  { time: '11:48', text: 'Non-conformité détectée' },
  { time: '11:52', text: 'Lab notifié' },
  { time: '11:55', text: 'Doseur eau recalibré' },
  { time: '12:10', text: 'Test de validation en cours' },
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

  return (
    <svg width={220} height={160} viewBox="0 0 220 175">
      <defs>
        <linearGradient id="gaugeGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C49A3C" />
          <stop offset="100%" stopColor="#D4A843" />
        </linearGradient>
      </defs>
      <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="rgba(212,168,67,0.12)" strokeWidth={14} strokeLinecap="round" />
      <path d={arcPath(startAngle, startAngle + filledArc, r)} fill="none" stroke="url(#gaugeGoldGrad)" strokeWidth={14} strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 8px rgba(212,168,67,0.5))' }} />
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#D4A843" fontFamily={MONO} fontSize={36} fontWeight={200}>{value}%</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="#9CA3AF" fontFamily={MONO} fontSize={10}>conformité</text>
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
// CUSTOM DOT FOR TAUX LINE
// ─────────────────────────────────────────────────────
function TauxDot(props: any) {
  const { cx, cy, index, payload } = props;
  if (payload.taux === 0) return null;
  const isLast = index === WEEKLY.filter(w => w.taux > 0).length - 1;
  if (isLast) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="rgba(212,168,67,0.2)">
          <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={4} fill="#D4A843" stroke="#D4A843" strokeWidth={2} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={3} fill="#D4A843" stroke="#D4A843" strokeWidth={1.5} />;
}

// ─────────────────────────────────────────────────────
// TEST RESULT ROW
// ─────────────────────────────────────────────────────
function TestRow({ r, delay = 0, index = 0 }: { r: typeof RESULTS[0]; delay?: number; index?: number }) {
  const vis = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const sColor = r.status === 'Conforme' ? T.success : r.status === 'Non-conforme' ? T.danger : T.warning;
  const TypeIcon = TEST_TYPE_ICON[r.type] ?? FlaskConical;
  const typeColor = TEST_TYPE_COLOR[r.type] ?? T.textSec;

  const ecartEl = (() => {
    if (r.ecartType === 'ok') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: T.success, fontWeight: 700, fontSize: 12 }}><CheckCircle size={11} /> OK</span>;
    if (r.ecartType === 'plus') return <span style={{ color: T.success, fontFamily: MONO, fontWeight: 700, fontSize: 12 }}>{r.ecart}</span>;
    if (r.ecartType === 'bad') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: T.danger, fontWeight: 700, fontSize: 11 }}><AlertTriangle size={11} /> {r.ecart}</span>;
    return <span style={{ color: T.textDim, fontSize: 12 }}>—</span>;
  })();

  const statusBadge = (() => {
    if (r.status === 'Conforme') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)', fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>
        <CheckCircle size={9} /> Conforme
      </span>
    );
    if (r.status === 'Non-conforme') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>
        <AlertTriangle size={9} /> Non-conforme
      </span>
    );
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>
        <Clock size={9} /> En attente
      </span>
    );
  })();

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid', gridTemplateColumns: '0.6fr 0.7fr 1.1fr 0.8fr 0.8fr 1.1fr 0.9fr',
        alignItems: 'center', gap: 8,
        borderLeft: `4px solid ${sColor}`,
        borderRadius: 10, padding: '12px 14px',
        background: hov ? 'rgba(212,168,67,0.06)' : (index % 2 === 0 ? 'rgba(212,168,67,0.03)' : 'transparent'),
        borderBottom: `1px solid ${T.cardBorder}`,
        opacity: vis ? 1 : 0,
        transform: vis ? (hov ? 'translateX(4px)' : 'translateX(0)') : 'translateY(14px)',
        transition: 'all 300ms ease-out', cursor: 'default',
      }}
    >
      <p style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', margin: 0 }}>{r.id}</p>
      <p style={{ fontFamily: MONO, fontSize: 12, color: '#D4A843', fontWeight: 700, margin: 0 }}>{r.batch}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <TypeIcon size={13} color={typeColor} />
        <span style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{r.type}</span>
      </div>
      <p style={{ fontFamily: MONO, fontSize: 15, fontWeight: 200, color: '#D4A843', margin: 0 }}>{r.result}</p>
      <p style={{ fontSize: 12, color: T.textDim, margin: 0 }}>{r.norme}</p>
      <div>{ecartEl}</div>
      <div>{statusBadge}</div>
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
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(20px)', transition: 'all 550ms ease-out', height: '100%' }}>
      <Card style={{ height: '100%', borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#9CA3AF', fontFamily: MONO, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '1.5px', margin: 0, marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color, lineHeight: 1, letterSpacing: '-0.02em', margin: 0 }}>{animated}</p>
            {trend && <p style={{ fontSize: 12, fontWeight: 500, marginTop: 6, color: T.success, margin: '6px 0 0' }}>↑ {trend}</p>}
          </div>
          <Icon size={18} color="#D4A843" style={{ opacity: 0.5 }} />
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
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(20px)', transition: 'all 500ms ease-out' }}>
      <Card style={{ borderLeft: `4px solid ${T.warning}`, borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#F59E0B', background: 'linear-gradient(145deg, #141E2F 0%, #1A2640 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 14, color: T.gold }}>{p.id}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: T.textSec }}>{p.batch}</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, margin: 0 }}>{p.type}</p>
          </div>
          {isNear
            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'transparent', color: '#D4A843', border: '1px solid rgba(212,168,67,0.3)', fontSize: 11, fontFamily: MONO, fontWeight: 700 }}><CheckCircle size={9} /> Résultat imminent</span>
            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'transparent', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', fontSize: 11, fontFamily: MONO, fontWeight: 700 }}><Clock size={9} /> En cours</span>
          }
        </div>
        <p style={{ fontSize: 11, color: T.textDim, marginBottom: 12 }}>{p.started} → {p.expected}</p>
        <div style={{ height: 7, borderRadius: 99, background: 'rgba(212,168,67,0.12)', overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${barW}%`, background: 'linear-gradient(90deg, #C49A3C, #D4A843)', borderRadius: 99, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 0 8px rgba(212,168,67,0.4)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 10, color: T.textDim, margin: 0 }}>Jour {p.jour} sur {p.total} jours</p>
          <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 200, color: '#D4A843', margin: 0 }}>{p.progress}%</p>
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
function StatBox({ label, value, color, borderColor }: { label: string; value: number; color: string; borderColor: string }) {
  const animated = useAnimatedCounter(value);
  return (
    <div style={{ flex: 1, background: '#0D1627', borderRadius: 10, padding: '10px 14px', border: `1px solid ${color}25`, borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: borderColor }}>
      <p style={{ fontSize: 9, color: T.textDim, margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 700 }}>{label}</p>
      <p style={{ fontFamily: MONO, fontSize: 20, fontWeight: 200, color, margin: 0 }}>{animated}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// QUALITY ALERT BAR
// ─────────────────────────────────────────────────────
function QualityAlertBar() {
  const [hov1, setHov1] = useState(false);
  const [hov2, setHov2] = useState(false);
  const [hov3, setHov3] = useState(false);
  return (
    <section>
      <div style={{
        borderLeft: '4px solid #EF4444',
        background: 'rgba(239,68,68,0.05)',
        borderRadius: '0 12px 12px 0',
        padding: '20px 24px',
        border: '1px solid rgba(239,68,68,0.15)',
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={18} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.textPri, margin: '0 0 6px' }}>
              <span style={{ color: '#EF4444' }}>⚠ Alerte Qualité</span> — Batch BN-0140: Slump 22 cm hors norme (+10%). Formule B25-HP. Cause probable: excès d'eau. Impact: 2 batches potentiellement affectés.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, paddingLeft: 30 }}>
          {ALERT_TIMELINE.map((entry, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: '#D4A843' }}>{entry.time}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF' }}>— {entry.text}</span>
              {i < ALERT_TIMELINE.length - 1 && <span style={{ color: 'rgba(212,168,67,0.3)', margin: '0 4px' }}>·</span>}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, paddingLeft: 30 }}>
          <button
            onMouseEnter={() => setHov1(true)} onMouseLeave={() => setHov1(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
              background: hov1 ? '#DC2626' : '#EF4444', color: '#fff',
              border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              transition: 'all 160ms', fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <OctagonX size={13} /> Arrêter Production
          </button>
          <button
            onMouseEnter={() => setHov2(true)} onMouseLeave={() => setHov2(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
              background: hov2 ? 'rgba(212,168,67,0.1)' : 'transparent', color: '#D4A843',
              border: '1px solid #D4A843', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              transition: 'all 160ms', fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <Eye size={13} /> Voir Détails
          </button>
          <button
            onMouseEnter={() => setHov3(true)} onMouseLeave={() => setHov3(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
              background: hov3 ? 'rgba(212,168,67,0.1)' : 'transparent', color: '#D4A843',
              border: '1px solid #D4A843', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              transition: 'all 160ms', fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <CheckCheck size={13} /> Valider Correction
          </button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// TAB CONTENT: ESSAIS DU JOUR
// ─────────────────────────────────────────────────────
function EssaisDuJourTab({ labKpis }: { labKpis: { testsToday: number; conformes: number; nonConformes: number; enAttente: number } }) {
  const [activePie, setActivePie] = useState<number | null>(null);

  const chartStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
    border: `1px solid ${T.cardBorder}`,
    borderRadius: 14, padding: 24,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* KPIs */}
      <section>
        <SectionHeader icon={TrendingUp} label="Indicateurs du Jour" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, alignItems: 'stretch' }}>
          <KPICard label="Tests Aujourd'hui"      value={labKpis.testsToday}    color="#FFFFFF"  icon={FlaskConical}   trend="+3 vs hier"       delay={0}   />
          <KPICard label="Conformes"               value={labKpis.conformes}    color="#22C55E"  icon={CheckCircle}    trend={`${labKpis.testsToday > 0 ? Math.round((labKpis.conformes / labKpis.testsToday) * 100) : 0}% taux`}       delay={80}  />
          <KPICard label="Non-Conformes"           value={labKpis.nonConformes} color="#EF4444"  icon={AlertTriangle}  trend="-1 vs hier"       delay={160} />
          <KPICard label="En Attente Résultat"     value={labKpis.enAttente}    color="#F59E0B"  icon={Clock}                                   delay={240} />
        </div>
      </section>

      {/* QUALITY ALERT BAR */}
      <QualityAlertBar />

      {/* GAUGE + WEEKLY TREND */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 20 }}>
          <Card className="tbos-card-stagger" style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
            <SectionHeader icon={CheckCircle} label="Conformité" sub="aujourd'hui" />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ConformityGauge value={87.5} />
            </div>
            <p style={{ textAlign: 'center' as const, color: '#9CA3AF', fontSize: 11, marginBottom: 16, marginTop: 0 }}>Taux de Conformité Aujourd'hui</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <StatBox label="Total" value={8} color={T.textPri} borderColor="#D4A843" />
              <StatBox label="Conformes" value={7} color={T.success} borderColor="#22C55E" />
              <StatBox label="Non-conf." value={1} color={T.danger} borderColor="#EF4444" />
            </div>
          </Card>

          <div style={{ ...chartStyle, borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
            <SectionHeader icon={TrendingUp} label="Tendance Conformité" sub="cette semaine" />
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              {[['#D4A843', 'Conformes', false], ['#EF4444', 'Non-conf.', false], ['#D4A843', 'Taux %', true]].map(([c, l, isLine], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: isLine ? 14 : 10, height: isLine ? 2 : 10, borderRadius: isLine ? 0 : 3, background: c as string, borderTop: isLine ? `2px solid ${c}` : undefined }} />
                  <span style={{ fontSize: 11, color: T.textSec }}>{l as string}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={WEEKLY} margin={{ top: 4, right: 50, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradConfGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C49A3C" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#D4A843" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradNon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.danger} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={T.danger} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradTaux" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A843" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 11 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[0, 15]} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[0, 110]} tickFormatter={(v: number) => `${v}%`} />
                <RechartsTooltip content={<WeeklyTooltip />} />
                <Bar yAxisId="left" dataKey="conformes" name="Conformes" radius={[4,4,0,0]} isAnimationActive animationDuration={1200}>
                  {WEEKLY.map((_, i) => <Cell key={i} fill="url(#gradConfGold)" stroke="#D4A843" strokeWidth={0.5} />)}
                </Bar>
                <Bar yAxisId="left" dataKey="non" name="Non-conf." radius={[4,4,0,0]} isAnimationActive animationDuration={1200}>
                  {WEEKLY.map((_, i) => <Cell key={i} fill="#EF4444" />)}
                </Bar>
                <Area yAxisId="right" type="monotone" dataKey="taux" name="Taux %" stroke="#D4A843" fill="url(#gradTaux)" strokeWidth={3} dot={<TauxDot />} isAnimationActive animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* RESULTS TABLE */}
      <section>
        <div style={{ ...chartStyle, borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
          <SectionHeader
            icon={FlaskConical}
            label="Résultats du Jour"
            right={
              <div style={{ display: 'flex', gap: 8 }}>
                <Bdg label="7 conformes"    color={T.success} bg="rgba(34,197,94,0.15)" border="1px solid rgba(34,197,94,0.3)" icon={CheckCircle} />
                <Bdg label="1 non-conforme" color={T.danger}  bg="rgba(239,68,68,0.15)" border="1px solid rgba(239,68,68,0.3)" pulse icon={AlertTriangle} />
              </div>
            }
          />
          <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 0.7fr 1.1fr 0.8fr 0.8fr 1.1fr 0.9fr', padding: '0 14px 10px', gap: 8, borderBottom: `1px solid ${T.cardBorder}` }}>
            {['Test ID', 'Batch', 'Type', 'Résultat', 'Norme', 'Écart', 'Statut'].map((h, i) => (
              <p key={i} style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', margin: 0 }}>{h}</p>
            ))}
          </div>
          <div style={{ marginTop: 4 }}>
            {RESULTS.map((r, i) => <TestRow key={r.id} r={r} delay={i * 60} index={i} />)}
          </div>
        </div>
      </section>

      {/* AI RISK PREDICTION */}
      <section>
        <Card style={{ borderLeft: `4px solid ${T.gold}`, background: 'rgba(255,255,255,0.04)', borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={14} color={T.gold} />
              <span style={{ color: T.gold, fontFamily: MONO, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
                Agent IA: Risque Prochain Batch
              </span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#D4A843', padding: '4px 8px', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 4 }}>
              Généré par IA · Claude Opus
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Score Risque</div>
              <span style={{ fontFamily: MONO, fontSize: 48, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.02em', color: '#F59E0B' }}>34</span>
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>/100</div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 20 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: T.gold }}>Formule B35</strong> — variance élevée détectée sur les 5 derniers tests. Probabilité de non-conformité : <strong style={{ fontFamily: MONO, color: '#F59E0B' }}>34%</strong>. Recommandation : <span style={{ color: T.success }}>réduire E/C de 0.02</span>.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {['Variance: ±4.2 MPa', '5 tests analysés', 'E/C actuel: 0.48'].map((lbl, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', fontSize: 10, fontFamily: MONO, fontWeight: 600 }}>{lbl}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* NON-CONFORMITY */}
      <section>
        <Card style={{ borderLeft: `4px solid ${T.danger}`, background: 'linear-gradient(145deg, #1C0F0F 0%, #201520 100%)', borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#EF4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color={T.danger} />
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: T.textPri, textTransform: 'uppercase', letterSpacing: '2px' }}>Non-Conformité Détectée</span>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>
              <AlertTriangle size={9} /> Action Requise
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Test', 'LAB-140', true], ['Batch', 'BN-0140', false], ['Type', 'Slump', false]].map(([lbl, val, isGold]) => (
                <div key={lbl as string} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: T.textDim, width: 70 }}>{lbl as string}</span>
                  <span style={{ fontFamily: MONO, fontWeight: isGold ? 700 : 400, color: isGold ? T.gold : T.textSec, fontSize: 13 }}>{val as string}</span>
                </div>
              ))}
              <div>
                <p style={{ fontSize: 10, color: T.textDim, margin: '0 0 4px' }}>Résultat mesuré</p>
                <p style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color: T.danger, margin: 0 }}>22 cm</p>
                <p style={{ fontSize: 11, color: T.textDim, margin: '4px 0 0' }}>Norme: 15-20 cm</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.danger, marginTop: 4 }}>+10% hors tolérance</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ fontSize: 10, color: T.textDim, width: 110 }}>Cause probable</span><span style={{ fontSize: 13, color: T.textSec }}>Excès d'eau dans le mélange</span></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ fontSize: 10, color: T.textDim, width: 110 }}>Formule</span><Bdg label="B35-HP" color={T.purple} bg={`${T.purple}15`} /></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ fontSize: 10, color: T.textDim, width: 110 }}>Opérateur</span><span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.textSec }}><User size={11} /> Youssef M.</span></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ fontSize: 10, color: T.textDim, width: 110 }}>Heure</span><span style={{ fontFamily: MONO, fontSize: 13, color: T.textSec }}>11:48</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: `1px solid ${T.danger}30` }}>
            <ActionBtn label="Créer Rapport NC" icon={FileText} bg={T.danger} textCol="#fff" fill />
            <ActionBtn label="Ajuster Formule" icon={FlaskConical} outline="#D4A843" />
            <ActionBtn label="Notifier Responsable" icon={Bell} outline="#D4A843" />
          </div>
        </Card>
      </section>

      {/* DISTRIBUTION */}
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
                <p style={{ fontFamily: MONO, fontSize: 26, fontWeight: 200, color: T.gold, lineHeight: 1, margin: 0 }}>8</p>
                <p style={{ fontFamily: MONO, fontSize: 9, color: T.textDim, margin: 0 }}>tests</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {TYPE_DIST.map((d, i) => {
                const Icon = TEST_TYPE_ICON[d.name] ?? FlaskConical;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={12} color={d.color} />
                    <span style={{ flex: 1, fontSize: 12, color: T.textSec }}>{d.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: d.color, fontWeight: 700 }}>{d.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Batch bars */}
          <div style={chartStyle}>
            <SectionHeader icon={TrendingUp} label="Par Batch" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={BATCH_DIST} layout="vertical" margin={{ top: 2, right: 30, left: 10, bottom: 2 }}>
                <defs>
                  <linearGradient id="batchGoldGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C49A3C" />
                    <stop offset="100%" stopColor="#D4A843" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[0, 1]} />
                <YAxis type="category" dataKey="batch" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 11, fontFamily: MONO }} width={80} />
                <RechartsTooltip content={<BatchTooltip />} cursor={{ fill: `${T.gold}08` }} />
                <Bar dataKey="conf" name="Conformes" radius={[0,4,4,0]} stackId="a" fill="url(#batchGoldGrad)" isAnimationActive animationDuration={1000} />
                <Bar dataKey="nonConf" name="Non-conf." radius={[0,4,4,0]} stackId="a" isAnimationActive animationDuration={1000}>
                  {BATCH_DIST.map((_, i) => <Cell key={i} fill="#EF4444" />)}
                </Bar>
                <Bar dataKey="enAttente" name="En attente" radius={[0,4,4,0]} stackId="a" isAnimationActive animationDuration={1000}>
                  {BATCH_DIST.map((_, i) => <Cell key={i} fill="rgba(212,168,67,0.4)" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* PENDING */}
      <section>
        <SectionHeader icon={Clock} label="Résultats en Attente" right={<Bdg label="2 tests" color={T.warning} bg={`${T.warning}15`} pulse />} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {PENDING.map((p, i) => <PendingCard key={p.id} p={p} delay={i * 120} />)}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// HISTORIQUE MOCK DATA
// ─────────────────────────────────────────────────────
const RESISTANCE_28J_DATA = [
  { date: '12 Fév', fb20: 22.1, fb25: 27.3, fb30: 33.5 },
  { date: '14 Fév', fb20: 21.8, fb25: 26.9, fb30: 32.1 },
  { date: '16 Fév', fb20: 23.0, fb25: 28.1, fb30: 34.2 },
  { date: '18 Fév', fb20: 22.4, fb25: 27.8, fb30: 31.8 },
  { date: '20 Fév', fb20: 21.5, fb25: 26.2, fb30: 33.0 },
  { date: '22 Fév', fb20: 22.8, fb25: 27.5, fb30: 34.8 },
  { date: '24 Fév', fb20: 23.2, fb25: 28.4, fb30: 32.6 },
  { date: '26 Fév', fb20: 21.9, fb25: 27.0, fb30: 33.9 },
  { date: '28 Fév', fb20: 22.6, fb25: 28.0, fb30: 34.1 },
  { date: '02 Mar', fb20: 23.5, fb25: 27.9, fb30: 33.7 },
  { date: '04 Mar', fb20: 22.3, fb25: 26.8, fb30: 32.4 },
  { date: '06 Mar', fb20: 22.9, fb25: 28.2, fb30: 34.5 },
  { date: '08 Mar', fb20: 23.1, fb25: 27.6, fb30: 33.2 },
  { date: '10 Mar', fb20: 22.7, fb25: 28.5, fb30: 34.0 },
  { date: '12 Mar', fb20: 23.4, fb25: 27.8, fb30: 33.8 },
];

const HISTORY_ROWS = [
  { date: '14 Mar', batch: 'BN-0158', formule: 'F-B25', type: 'Slump',          result: '17 cm',    norme: '15-20 cm', ecart: '+0%',   ecartLevel: 'ok',     operateur: 'Youssef M.', conforme: true  },
  { date: '14 Mar', batch: 'BN-0158', formule: 'F-B25', type: 'Résistance 7j',  result: '26.3 MPa', norme: '>18 MPa',  ecart: '+46%',  ecartLevel: 'ok',     operateur: 'Youssef M.', conforme: true  },
  { date: '13 Mar', batch: 'BN-0157', formule: 'F-B30', type: 'Slump',          result: '14 cm',    norme: '12-18 cm', ecart: '+0%',   ecartLevel: 'ok',     operateur: 'Karim L.',   conforme: true  },
  { date: '13 Mar', batch: 'BN-0156', formule: 'F-B20', type: 'Température',    result: '29°C',     norme: '<32°C',    ecart: 'OK',    ecartLevel: 'ok',     operateur: 'Ahmed B.',   conforme: true  },
  { date: '12 Mar', batch: 'BN-0155', formule: 'F-B25', type: 'Résistance 28j', result: '27.8 MPa', norme: '>25 MPa',  ecart: '+11%',  ecartLevel: 'ok',     operateur: 'Youssef M.', conforme: true  },
  { date: '12 Mar', batch: 'BN-0154', formule: 'F-B30', type: 'Slump',          result: '11 cm',    norme: '12-18 cm', ecart: '-8%',   ecartLevel: 'amber',  operateur: 'Karim L.',   conforme: true  },
  { date: '11 Mar', batch: 'BN-0153', formule: 'F-B35', type: 'Slump',          result: '22 cm',    norme: '10-15 cm', ecart: '+47%',  ecartLevel: 'bad',    operateur: 'Youssef M.', conforme: false },
  { date: '11 Mar', batch: 'BN-0152', formule: 'F-B25', type: 'Air occlus',     result: '4.8%',     norme: '3-6%',     ecart: 'OK',    ecartLevel: 'ok',     operateur: 'Ahmed B.',   conforme: true  },
  { date: '10 Mar', batch: 'BN-0151', formule: 'F-B20', type: 'Résistance 7j',  result: '19.2 MPa', norme: '>14 MPa',  ecart: '+37%',  ecartLevel: 'ok',     operateur: 'Karim L.',   conforme: true  },
  { date: '09 Mar', batch: 'BN-0150', formule: 'F-B30', type: 'Résistance 28j', result: '33.8 MPa', norme: '>30 MPa',  ecart: '+13%',  ecartLevel: 'ok',     operateur: 'Ahmed B.',   conforme: true  },
  { date: '08 Mar', batch: 'BN-0149', formule: 'F-B25', type: 'Slump',          result: '19 cm',    norme: '15-20 cm', ecart: '-5%',   ecartLevel: 'amber',  operateur: 'Youssef M.', conforme: true  },
  { date: '07 Mar', batch: 'BN-0148', formule: 'F-B20', type: 'Température',    result: '31°C',     norme: '<32°C',    ecart: '-3%',   ecartLevel: 'amber',  operateur: 'Karim L.',   conforme: true  },
  { date: '06 Mar', batch: 'BN-0147', formule: 'F-B30', type: 'Résistance 7j',  result: '28.1 MPa', norme: '>21 MPa',  ecart: '+34%',  ecartLevel: 'ok',     operateur: 'Ahmed B.',   conforme: true  },
  { date: '05 Mar', batch: 'BN-0146', formule: 'F-B25', type: 'Slump',          result: '16 cm',    norme: '15-20 cm', ecart: 'OK',    ecartLevel: 'ok',     operateur: 'Youssef M.', conforme: true  },
  { date: '04 Mar', batch: 'BN-0145', formule: 'F-B35', type: 'Résistance 28j', result: '32.1 MPa', norme: '>35 MPa',  ecart: '-8%',   ecartLevel: 'bad',    operateur: 'Karim L.',   conforme: false },
];

const MONTHLY_TREND = [
  { month: 'Oct', pct: 94 },
  { month: 'Nov', pct: 91 },
  { month: 'Déc', pct: 96 },
  { month: 'Jan', pct: 93 },
  { month: 'Fév', pct: 95 },
  { month: 'Mar', pct: 97 },
];

// ─────────────────────────────────────────────────────
// RESISTANCE 28J TOOLTIP
// ─────────────────────────────────────────────────────
function Resistance28jTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px', minWidth: 160 }}>
      <p style={{ color: T.gold, fontWeight: 700, fontSize: 12, marginBottom: 6, fontFamily: MONO }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 12, margin: '2px 0' }}>
          {p.name}: <strong style={{ fontFamily: MONO }}>{p.value} MPa</strong>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PULSE DOT FOR LINE CHARTS
// ─────────────────────────────────────────────────────
function LinePulseDot(color: string, dataLength: number) {
  return (props: any) => {
    const { cx, cy, index } = props;
    if (index === dataLength - 1) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={6} fill={`${color}30`}>
            <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={2} />
        </g>
      );
    }
    return <circle cx={cx} cy={cy} r={3} fill={color} stroke={color} strokeWidth={1.5} />;
  };
}

// ─────────────────────────────────────────────────────
// TAB CONTENT: HISTORIQUE & NORMES
// ─────────────────────────────────────────────────────
function HistoriqueNormesTab() {
  const [normsExpanded, setNormsExpanded] = useState(false);
  const [periode, setPeriode] = useState('30J');
  const [formule, setFormule] = useState('Toutes');
  const [statut, setStatut] = useState('Tous');
  const [search, setSearch] = useState('');
  const visibleNorms = normsExpanded ? NORMS : NORMS.slice(0, 4);

  const chartStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
    border: `1px solid ${T.cardBorder}`,
    borderRadius: 14, padding: 24,
  };

  const selectStyle: React.CSSProperties = {
    background: 'transparent', border: '1px solid rgba(212,168,67,0.3)',
    borderRadius: 8, padding: '7px 12px', color: '#9CA3AF',
    fontFamily: MONO, fontSize: 12, cursor: 'pointer', outline: 'none',
    minWidth: 120, appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239CA3AF' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
    paddingRight: 30,
  };

  const FORMULE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    'F-B20': { bg: 'rgba(232,201,106,0.15)', color: '#E8C96A', border: '1px solid rgba(232,201,106,0.3)' },
    'F-B25': { bg: 'rgba(212,168,67,0.15)',  color: '#D4A843', border: '1px solid rgba(212,168,67,0.3)' },
    'F-B30': { bg: 'rgba(196,154,60,0.15)',  color: '#C49A3C', border: '1px solid rgba(196,154,60,0.3)' },
    'F-B35': { bg: 'rgba(160,124,46,0.15)',  color: '#A07C2E', border: '1px solid rgba(160,124,46,0.3)' },
  };

  // Filter rows
  const filtered = HISTORY_ROWS.filter(r => {
    if (formule !== 'Toutes' && r.formule !== formule) return false;
    if (statut === 'Conforme' && !r.conforme) return false;
    if (statut === 'Non-conforme' && r.conforme) return false;
    if (search && !r.batch.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const conformBar = useBarWidth(97, 0);
  const conformBar2 = useBarWidth(95, 100);
  const conformBar3 = useBarWidth(98, 200);
  const causeBar1 = useBarWidth(45, 300);
  const causeBar2 = useBarWidth(30, 400);
  const causeBar3 = useBarWidth(25, 500);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── SECTION 1: FILTER BAR ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '16px 20px', background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: `1px solid ${T.cardBorder}`, borderRadius: 12 }}>
          {/* Période pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={13} color={T.textDim} style={{ marginRight: 6 }} />
            {['7J', '30J', '90J', 'PERSONNALISÉ'].map(p => {
              const isActive = periode === p;
              return (
                <button key={p} onClick={() => setPeriode(p)} style={{
                  fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  padding: '6px 14px', borderRadius: 6, cursor: 'pointer', transition: 'all 160ms',
                  background: isActive ? '#D4A843' : 'transparent',
                  color: isActive ? '#0F1629' : '#9CA3AF',
                  border: isActive ? '1px solid #D4A843' : '1px solid rgba(212,168,67,0.3)',
                }}>
                  {p}
                </button>
              );
            })}
          </div>

          {/* Formule dropdown */}
          <select value={formule} onChange={e => setFormule(e.target.value)} style={selectStyle}>
            {['Toutes', 'F-B20', 'F-B25', 'F-B30', 'F-B35'].map(f => <option key={f} value={f} style={{ background: '#0B1120' }}>{f === 'Toutes' ? 'Toutes formules' : f}</option>)}
          </select>

          {/* Statut dropdown */}
          <select value={statut} onChange={e => setStatut(e.target.value)} style={selectStyle}>
            {['Tous', 'Conforme', 'Non-conforme', 'En attente'].map(s => <option key={s} value={s} style={{ background: '#0B1120' }}>{s === 'Tous' ? 'Tous statuts' : s}</option>)}
          </select>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={14} color={T.textDim} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher batch..."
              style={{
                width: '100%', fontFamily: MONO, fontSize: 12, padding: '7px 12px 7px 32px',
                background: 'transparent', border: '1px solid rgba(212,168,67,0.2)',
                borderRadius: 8, color: T.textPri, outline: 'none',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: RÉSISTANCE À 28 JOURS TRACKING ── */}
      <section>
        <div style={{ ...chartStyle, borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
          <SectionHeader icon={LineChart} label="✦ Résistance à 28 Jours — Suivi Historique" />
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            {[['#E8C96A', 'F-B20'], ['#D4A843', 'F-B25'], ['#C49A3C', 'F-B30']].map(([c, l], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 14, height: 2, background: c }} />
                <span style={{ fontSize: 11, color: T.textSec }}>{l}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={RESISTANCE_28J_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaFb20" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E8C96A" stopOpacity={0.08} /><stop offset="95%" stopColor="#E8C96A" stopOpacity={0} /></linearGradient>
                <linearGradient id="areaFb25" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4A843" stopOpacity={0.08} /><stop offset="95%" stopColor="#D4A843" stopOpacity={0} /></linearGradient>
                <linearGradient id="areaFb30" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C49A3C" stopOpacity={0.08} /><stop offset="95%" stopColor="#C49A3C" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[15, 40]} tickFormatter={(v: number) => `${v}`} />
              <RechartsTooltip content={<Resistance28jTooltip />} />
              <ReferenceLine y={20} stroke="#E8C96A" strokeDasharray="6 4" strokeOpacity={0.3} label={{ value: '20 MPa', fill: '#E8C96A', fontSize: 9, position: 'right' }} />
              <ReferenceLine y={25} stroke="#D4A843" strokeDasharray="6 4" strokeOpacity={0.3} label={{ value: '25 MPa', fill: '#D4A843', fontSize: 9, position: 'right' }} />
              <ReferenceLine y={30} stroke="#C49A3C" strokeDasharray="6 4" strokeOpacity={0.3} label={{ value: '30 MPa', fill: '#C49A3C', fontSize: 9, position: 'right' }} />
              <Area type="monotone" dataKey="fb20" name="F-B20" stroke="#E8C96A" fill="url(#areaFb20)" strokeWidth={2} dot={LinePulseDot('#E8C96A', RESISTANCE_28J_DATA.length)} />
              <Area type="monotone" dataKey="fb25" name="F-B25" stroke="#D4A843" fill="url(#areaFb25)" strokeWidth={2} dot={LinePulseDot('#D4A843', RESISTANCE_28J_DATA.length)} />
              <Area type="monotone" dataKey="fb30" name="F-B30" stroke="#C49A3C" fill="url(#areaFb30)" strokeWidth={2} dot={LinePulseDot('#C49A3C', RESISTANCE_28J_DATA.length)} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Summary strip */}
          <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.cardBorder}` }}>
            {[
              { label: 'MOY. F-B20', value: '22.5 MPa', color: '#E8C96A' },
              { label: 'MOY. F-B25', value: '27.6 MPa', color: '#D4A843' },
              { label: 'MOY. F-B30', value: '33.4 MPa', color: '#C49A3C' },
              { label: 'CONFORMITÉ 28J', value: '96.2%', color: T.success },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', letterSpacing: '0.05em' }}>{s.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: HISTORIQUE COMPLET ── */}
      <section>
        <div style={{ ...chartStyle, borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FlaskConical size={16} color={T.gold} />
              <span style={{ color: T.gold, fontFamily: MONO, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>✦ Historique des Essais</span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF' }}>dernière mise à jour : à l'instant</span>
          </div>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 0.7fr 0.7fr 0.9fr 0.7fr 0.6fr 0.6fr 0.8fr 0.9fr', padding: '0 14px 10px', gap: 6, borderBottom: `1px solid ${T.cardBorder}` }}>
            {['Date', 'Batch', 'Formule', 'Type', 'Résultat', 'Norme', 'Écart', 'Opérateur', 'NM'].map((h, i) => (
              <p key={i} style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', margin: 0 }}>{h}</p>
            ))}
          </div>
          {/* Table rows */}
          <div style={{ marginTop: 4 }}>
            {filtered.map((r, i) => {
              const fc = FORMULE_COLORS[r.formule] || FORMULE_COLORS['F-B25'];
              const ecartColor = r.ecartLevel === 'ok' ? T.success : r.ecartLevel === 'amber' ? T.warning : T.danger;
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '0.7fr 0.7fr 0.7fr 0.9fr 0.7fr 0.6fr 0.6fr 0.8fr 0.9fr',
                  alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8,
                  background: i % 2 === 0 ? 'rgba(212,168,67,0.03)' : 'transparent',
                  borderBottom: `1px solid ${T.cardBorder}40`,
                  transition: 'background 150ms', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'rgba(212,168,67,0.03)' : 'transparent'; }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF' }}>{r.date}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: '#D4A843', fontWeight: 700 }}>{r.batch}</span>
                  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, background: fc.bg, color: fc.color, border: fc.border, fontSize: 11, fontFamily: MONO, fontWeight: 700, width: 'fit-content' }}>{r.formule}</span>
                  <span style={{ fontSize: 12, color: T.textSec }}>{r.type}</span>
                  <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 13, color: '#FFFFFF' }}>{r.result}</span>
                  <span style={{ fontSize: 11, color: T.textDim }}>{r.norme}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: ecartColor }}>{r.ecart}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{r.operateur}</span>
                  <span>{r.conforme
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)', fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>✓ CONFORME</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>✗ ÉCHOUÉ</span>
                  }</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: STATISTIQUES DE CONFORMITÉ ── */}
      <section>
        <SectionHeader icon={BarChart3} label="Statistiques de Conformité" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {/* Card 1: Conformité par formule */}
          <Card style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 20 }}>Conformité par Formule</p>
            {[
              { label: 'F-B20', pct: 97, color: T.success, barW: conformBar },
              { label: 'F-B25', pct: 95, color: '#D4A843', barW: conformBar2 },
              { label: 'F-B30', pct: 98, color: T.success, barW: conformBar3 },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: T.textSec }}>{f.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 200, color: f.color }}>{f.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${f.barW}%`, background: f.color, borderRadius: 99, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
              </div>
            ))}
          </Card>

          {/* Card 2: Tendance mensuelle */}
          <Card style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 16 }}>Tendance Mensuelle</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={MONTHLY_TREND} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="monthlyGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A843" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 9 }} />
                <YAxis hide domain={[85, 100]} />
                <Area type="monotone" dataKey="pct" stroke="#D4A843" fill="url(#monthlyGold)" strokeWidth={2} dot={LinePulseDot('#D4A843', MONTHLY_TREND.length)} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 200, color: T.gold }}>97%</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim, marginLeft: 6, alignSelf: 'flex-end', marginBottom: 4 }}>ce mois</span>
            </div>
          </Card>

          {/* Card 3: Top causes non-conformité */}
          <Card style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 20 }}>Top Causes Non-Conformité</p>
            {[
              { rank: 1, label: 'Affaissement hors tolérance', pct: 45, color: T.danger, barW: causeBar1 },
              { rank: 2, label: 'Ratio E/C élevé', pct: 30, color: T.warning, barW: causeBar2 },
              { rank: 3, label: 'Température', pct: 25, color: '#D4A843', barW: causeBar3 },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 3, borderRadius: 99, background: c.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: T.textSec }}>{c.rank}. {c.label}</span>
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 200, color: c.color }}>{c.pct}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.barW}%`, background: c.color, borderRadius: 99, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* ── SECTION 5: RÉFÉRENTIEL NORMES ── */}
      <section>
        <Card style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={16} color={T.gold} />
              <span style={{ color: T.gold, fontFamily: MONO, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>✦ Référentiel Normes</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: '#D4A843', padding: '2px 8px', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 4 }}>NM 10.1.008</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.6fr 0.8fr', padding: '8px 12px', borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 4 }}>
            {['Test', 'Norme', 'Unité', 'Tolérance'].map((h, i) => (
              <p key={i} style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', margin: 0 }}>{h}</p>
            ))}
          </div>
          {visibleNorms.map((n, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.6fr 0.8fr', padding: '9px 12px', borderRadius: 8,
              background: i % 2 === 0 ? 'rgba(212,168,67,0.03)' : 'transparent',
              borderBottom: i < visibleNorms.length - 1 ? `1px solid ${T.cardBorder}40` : 'none',
              transition: 'background 150ms',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'rgba(212,168,67,0.03)' : 'transparent'; }}
            >
              <span style={{ fontSize: 12, color: T.textSec }}>{n.test}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: '#D4A843', fontWeight: 200 }}>{n.norme}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>{n.unite}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>{n.tolerance}</span>
            </div>
          ))}
          <button
            onClick={() => setNormsExpanded(e => !e)}
            style={{
              marginTop: 12, display: 'flex', alignItems: 'center', gap: 5,
              background: 'transparent', border: 'none', color: '#D4A843',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 0',
              fontFamily: MONO,
            }}
          >
            {normsExpanded ? <><ChevronUp size={14} /> Réduire</> : <><ChevronDown size={14} /> Voir tout ({NORMS.length - 4} de plus)</>}
          </button>
        </Card>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// ANALYTIQUE DATA
// ─────────────────────────────────────────────────────
const PERF_90J = (() => {
  const data = [];
  const base = new Date('2025-12-15');
  for (let i = 0; i < 30; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i * 3);
    const conformite = 93 + Math.sin(i * 0.4) * 3 + (i > 20 ? 1.5 : 0);
    const volume = 180 + Math.sin(i * 0.7) * 40 + Math.random() * 20;
    data.push({
      date: `${d.getDate()} ${['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'][d.getMonth()]}`,
      conformite: Math.round(conformite * 10) / 10,
      volume: Math.round(volume),
    });
  }
  return data;
})();

const CONF_PAR_FORMULE = [
  { formule: 'F-B20', affaissement: 97, resistance7j: 95, resistance28j: 98 },
  { formule: 'F-B25', affaissement: 93, resistance7j: 96, resistance28j: 95 },
  { formule: 'F-B30', affaissement: 96, resistance7j: 94, resistance28j: 99 },
];

const OPERATORS_A = [
  { name: 'Youssef M.', pct: 96, score: 94 },
  { name: 'Sarah L.',   pct: 91, score: 87 },
  { name: 'Karim B.',   pct: 84, score: 72 },
  { name: 'Ahmed R.',   pct: 88, score: 81 },
];

const ECART_DIST = [
  { range: '-8%', count: 2, inTol: false },
  { range: '-6%', count: 3, inTol: false },
  { range: '-4%', count: 5, inTol: true },
  { range: '-2%', count: 12, inTol: true },
  { range: '0%',  count: 28, inTol: true },
  { range: '+2%', count: 15, inTol: true },
  { range: '+4%', count: 8, inTol: true },
  { range: '+6%', count: 4, inTol: false },
  { range: '+8%', count: 1, inTol: false },
];

const NC_COST_MONTHLY = [
  { month: 'Oct', cost: 18500 },
  { month: 'Nov', cost: 15200 },
  { month: 'Déc', cost: 12800 },
  { month: 'Jan', cost: 14100 },
  { month: 'Fév', cost: 10500 },
  { month: 'Mar', cost: 8900 },
];

const REJECT_DONUT = [
  { name: 'Affaissement', value: 45, color: '#EF4444' },
  { name: 'E/C ratio',    value: 30, color: '#F59E0B' },
  { name: 'Température',  value: 15, color: '#D4A843' },
  { name: 'Autre',        value: 10, color: '#4B5563' },
];

function Perf90jTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: T.gold, fontWeight: 700, fontSize: 12, marginBottom: 6, fontFamily: MONO }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 12, margin: '2px 0' }}>
          {p.name}: <strong style={{ fontFamily: MONO }}>{p.value}{p.name === 'Conformité' ? '%' : ' m³'}</strong>
        </p>
      ))}
    </div>
  );
}

function RejectDonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: d.color, fontWeight: 700, fontSize: 12 }}>{d.name}</p>
      <p style={{ color: T.textPri, fontSize: 12 }}>{d.value}%</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TAB CONTENT: ANALYTIQUE
// ─────────────────────────────────────────────────────
function AnalytiqueTab() {
  const [activePieIdx, setActivePieIdx] = useState<number | null>(null);

  const chartStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
    border: `1px solid ${T.cardBorder}`,
    borderRadius: 14, padding: 24,
  };

  const opBarWidths = [useBarWidth(96, 0), useBarWidth(91, 80), useBarWidth(84, 160), useBarWidth(88, 240)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ROW 1: HEADLINE */}
      <section>
        <div style={{ ...chartStyle, borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
          <SectionHeader icon={TrendingUp} label="✦ Performance Qualité — 90 Jours" />
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            {[['#D4A843', 'Conformité %'], ['#9CA3AF', 'Volume m³ (dashed)']].map(([c, l], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 14, height: 2, background: c, borderTop: i === 1 ? '2px dashed #9CA3AF' : undefined }} />
                <span style={{ fontSize: 11, color: T.textSec }}>{l}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={PERF_90J} margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaConf90" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 9 }} interval={4} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[80, 100]} tickFormatter={(v: number) => `${v}%`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[100, 280]} tickFormatter={(v: number) => `${v}`} />
              <RechartsTooltip content={<Perf90jTooltip />} />
              <ReferenceLine yAxisId="left" y={95} stroke="#D4A843" strokeDasharray="8 4" strokeOpacity={0.4} label={{ value: 'OBJECTIF NM 95%', fill: '#D4A843', fontSize: 9, position: 'insideTopRight' }} />
              <Area yAxisId="left" type="monotone" dataKey="conformite" name="Conformité" stroke="#D4A843" fill="url(#areaConf90)" strokeWidth={2.5} dot={LinePulseDot('#D4A843', PERF_90J.length)} />
              <Area yAxisId="right" type="monotone" dataKey="volume" name="Volume" stroke="#9CA3AF" fill="transparent" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.cardBorder}`, flexWrap: 'wrap' }}>
            {[
              { label: 'CONFORMITÉ MOY.', value: '96.2%', color: T.gold },
              { label: 'PIC', value: '98.7%', color: T.success },
              { label: 'CREUX', value: '91.3%', color: T.warning },
              { label: 'TENDANCE', value: '↑ +1.4%', color: T.success },
              { label: 'VS TRIM. DERNIER', value: '+2.1%', color: T.success },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', letterSpacing: '0.05em' }}>{s.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROW 2: BREAKDOWN */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {/* Card 1: Conformité par formule */}
          <Card style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 20 }}>Conformité par Formule</p>
            {CONF_PAR_FORMULE.map((f, fi) => (
              <div key={fi} style={{ marginBottom: 18 }}>
                <p style={{ fontFamily: MONO, fontSize: 12, color: T.gold, fontWeight: 700, marginBottom: 8 }}>{f.formule}</p>
                {[
                  { label: 'Aff.', val: f.affaissement, color: '#D4A843' },
                  { label: 'R.7j', val: f.resistance7j, color: '#E8C96A' },
                  { label: 'R.28j', val: f.resistance28j, color: '#C49A3C' },
                ].map((b, bi) => (
                  <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim, width: 36 }}>{b.label}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${b.val}%`, background: b.color, borderRadius: 99, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)', boxShadow: b.val >= 98 ? `0 0 8px ${T.success}40` : 'none' }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 200, color: b.val >= 98 ? T.success : T.textPri, width: 32, textAlign: 'right' as const }}>{b.val}%</span>
                  </div>
                ))}
              </div>
            ))}
          </Card>

          {/* Card 2: Conformité par opérateur */}
          <Card style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 20 }}>Conformité par Opérateur</p>
            {OPERATORS_A.map((op, i) => {
              const isLow = op.pct < 85;
              const scoreColor = op.score >= 85 ? T.success : op.score >= 70 ? T.warning : T.danger;
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: T.textSec }}>{op.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 200, color: isLow ? T.warning : T.textPri }}>{op.pct}%</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 200, color: scoreColor, padding: '1px 6px', border: `1px solid ${scoreColor}40`, borderRadius: 4 }}>IA {op.score}</span>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${opBarWidths[i]}%`, background: isLow ? T.warning : 'linear-gradient(90deg, #C49A3C, #D4A843)', borderRadius: 99, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Card 3: Distribution des écarts */}
          <Card style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#D4A843' }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 16 }}>Distribution des Écarts</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ECART_DIST} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 9 }} />
                <YAxis hide />
                <ReferenceLine x="0%" stroke="#D4A843" strokeDasharray="4 3" strokeOpacity={0.5} />
                <Bar dataKey="count" radius={[3,3,0,0]} isAnimationActive animationDuration={800}>
                  {ECART_DIST.map((d, i) => <Cell key={i} fill={d.inTol ? '#D4A843' : '#EF4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 4px' }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>← sous-dosé</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>sur-dosé →</span>
            </div>
            <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(212,168,67,0.05)', borderRadius: 8, border: `1px solid ${T.goldBorder}` }}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: T.textSec, margin: 0 }}>
                <span style={{ color: T.gold, fontWeight: 700 }}>68%</span> des tests dans la tolérance ±3%
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ROW 3: EFFICIENCY */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
          {/* Card 1: Coût de non-conformité */}
          <Card style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#EF4444' }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 16 }}>Coût de Non-Conformité</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color: T.danger }}>127,500</span>
              <span style={{ fontFamily: MONO, fontSize: 14, color: T.danger }}>MAD</span>
            </div>
            <p style={{ fontSize: 12, color: T.textDim, marginBottom: 20 }}>estimé sur 12 mois</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Batches rejetés', value: '85,000 MAD', color: T.danger },
                { label: 'Sur-dosage ciment', value: '374,400 MAD gain potentiel', color: T.success },
                { label: "Temps d'arrêt", value: '42,500 MAD', color: T.warning },
              ].map((b, i) => (
                <div key={i} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${T.cardBorder}` }}>
                  <p style={{ fontSize: 10, color: T.textDim, margin: '0 0 4px' }}>{b.label}</p>
                  <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: b.color, margin: 0 }}>{b.value}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={NC_COST_MONTHLY} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ncCostArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 9 }} />
                <YAxis hide />
                <Area type="monotone" dataKey="cost" stroke="#EF4444" fill="url(#ncCostArea)" strokeWidth={2} dot={LinePulseDot('#EF4444', NC_COST_MONTHLY.length)} />
              </AreaChart>
            </ResponsiveContainer>
            <p style={{ fontFamily: MONO, fontSize: 10, color: T.success, marginTop: 6 }}>↓ Tendance à la baisse — amélioration qualité</p>
          </Card>

          {/* Card 2: Taux de rejet */}
          <Card style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#F59E0B' }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 16 }}>Taux de Rejet</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color: T.warning }}>3.2%</span>
            </div>
            <p style={{ fontSize: 12, color: T.success, marginBottom: 20 }}>−0.8% vs trim. dernier ↓</p>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width={200} height={180}>
                <PieChart>
                  <Pie data={REJECT_DONUT} cx={95} cy={85} innerRadius={50} outerRadius={75}
                    dataKey="value" startAngle={90} endAngle={-270}
                    isAnimationActive animationDuration={800}
                    activeIndex={activePieIdx ?? undefined} activeShape={renderActiveShape}
                    onMouseEnter={(_: any, i: number) => setActivePieIdx(i)} onMouseLeave={() => setActivePieIdx(null)}
                  >
                    {REJECT_DONUT.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                  </Pie>
                  <RechartsTooltip content={<RejectDonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
              {REJECT_DONUT.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, color: T.textSec }}>{d.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: d.color }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ROW 4: ACTION — INSIGHT IA */}
      <section>
        <div style={{
          borderTopWidth: 2, borderTopStyle: 'solid' as const, borderTopColor: '#D4A843',
          background: 'rgba(212,168,67,0.03)',
          borderRadius: 14, padding: 24,
          border: '1px solid rgba(212,168,67,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Brain size={16} color={T.gold} />
              <span style={{ color: T.gold, fontFamily: MONO, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>✦ Insight IA — Analyse Qualité</span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#D4A843', padding: '4px 8px', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 4 }}>
              Généré par IA · Claude Opus
            </span>
          </div>
          <p style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF', lineHeight: 1.8, margin: 0 }}>
            Analyse 90 jours : Le taux de conformité global est de 96.2%, au-dessus de l'objectif NM de 95%. Cependant, 3 tendances nécessitent attention : (1) Les non-conformités affaissement se concentrent sur le shift de nuit (67% des cas) — formation opérateurs recommandée. (2) La formule B25 montre un sur-dosage ciment systématique de <strong style={{ color: '#D4A843' }}>+24.8%</strong> vs requis — réduction de 350→330 kg/m³ économiserait <strong style={{ color: '#D4A843' }}>374,400 MAD/an</strong> sans risque qualité. (3) L'opérateur Karim B. a un taux de conformité de <strong style={{ color: '#D4A843' }}>84%</strong> vs moyenne équipe 92% — accompagnement technique recommandé cette semaine.
          </p>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MINI CONFIDENCE GAUGE (SVG circle)
// ─────────────────────────────────────────────────────
function MiniGauge({ value, size = 28 }: { value: number; size?: number }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const color = value >= 85 ? T.success : value >= 70 ? T.warning : T.danger;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={2.5}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 800ms ease-out' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={8} fontFamily={MONO} fontWeight={700}>{value}%</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────
// AGENT KPI CARD
// ─────────────────────────────────────────────────────
function AgentKPI({ label, value, color, subtitle, borderColor }: { label: string; value: string; color: string; subtitle?: string; borderColor?: string }) {
  return (
    <div style={{
      flex: 1, padding: '16px 18px',
      background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
      border: `1px solid ${T.cardBorder}`, borderRadius: 10,
      borderTop: `2px solid ${borderColor || color}`,
    }}>
      <p style={{ fontFamily: MONO, fontSize: 10, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color, margin: 0 }}>{value}</p>
      {subtitle && <p style={{ fontSize: 10, color: T.textDim, marginTop: 4, margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// IA BADGE HELPER
// ─────────────────────────────────────────────────────
function IABadge() {
  return (
    <span style={{ fontFamily: MONO, fontSize: 11, color: '#D4A843', padding: '4px 8px', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 4, background: 'rgba(212,168,67,0.06)' }}>
      Généré par IA · Claude Opus
    </span>
  );
}

// ─────────────────────────────────────────────────────
// TAB CONTENT: INTELLIGENCE IA
// ─────────────────────────────────────────────────────
function IntelligenceIATab() {
  const tblHdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.15em', padding: '10px 14px', borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'left' };
  const tblCell: React.CSSProperties = { padding: '10px 14px', fontSize: 12, borderBottom: `1px solid rgba(30,45,74,0.5)` };
  const monoCell: React.CSSProperties = { ...tblCell, fontFamily: MONO, fontWeight: 200 };
  const altRow = (i: number): React.CSSProperties => ({ background: i % 2 === 0 ? 'transparent' : 'rgba(212,168,67,0.03)' });

  const recoBox = (text: string, borderColor: string = T.gold): React.ReactNode => (
    <div style={{ borderLeft: `4px solid ${borderColor}`, background: borderColor === T.danger ? 'rgba(239,68,68,0.05)' : 'rgba(212,168,67,0.03)', padding: '14px 18px', borderRadius: '0 8px 8px 0', marginTop: 16 }}>
      <p style={{ fontFamily: MONO, fontSize: 12, color: T.textSec, lineHeight: 1.7, margin: 0 }}>{text}</p>
    </div>
  );

  const agentHeader = (title: string, borderColor: string, badges: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Brain size={16} color={borderColor} />
        <span style={{ color: T.gold, fontFamily: MONO, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{badges}</div>
    </div>
  );

  // NM Check data
  const nmRows = [
    { batch: 'BN-0142', formule: 'F-B25',    aff: '18 cm', ec: '0.500', r7j: '28.5 MPa', check: 'validé' },
    { batch: 'BN-0141', formule: 'F-B25',    aff: '18 cm', ec: '0.495', r7j: '28.5 MPa', check: 'validé' },
    { batch: 'BN-0140', formule: 'F-B25-HP', aff: '22 cm', ec: '0.520', r7j: '—',        check: 'bloqué' },
    { batch: 'BN-0139', formule: 'F-B30',    aff: '16 cm', ec: '0.450', r7j: '32.1 MPa', check: 'validé' },
    { batch: 'BN-0138', formule: 'F-B30',    aff: '15 cm', ec: '0.448', r7j: '32.1 MPa', check: 'validé' },
    { batch: 'BN-0137', formule: 'F-B20',    aff: '19 cm', ec: '0.565', r7j: '—',        check: 'validé' },
  ];

  // Prediction data
  const predRows = [
    { batch: 'BN-0142', formule: 'F-B25',    r7j: '28.5 MPa', pred: '26.8 MPa', conf: 92, risk: 'FAIBLE' },
    { batch: 'BN-0141', formule: 'F-B25',    r7j: '28.5 MPa', pred: '27.1 MPa', conf: 94, risk: 'FAIBLE' },
    { batch: 'BN-0140', formule: 'F-B25-HP', r7j: '—',        pred: '23.4 MPa', conf: 67, risk: 'ÉLEVÉ' },
    { batch: 'BN-0139', formule: 'F-B30',    r7j: '32.1 MPa', pred: '33.8 MPa', conf: 91, risk: 'FAIBLE' },
    { batch: 'BN-0138', formule: 'F-B30',    r7j: '32.1 MPa', pred: '34.2 MPa', conf: 93, risk: 'FAIBLE' },
    { batch: 'BN-0137', formule: 'F-B20',    r7j: '—',        pred: '22.1 MPa', conf: 88, risk: 'FAIBLE' },
  ];

  // Formule optimization data
  const formulaRows = [
    { formule: 'F-B25', cimentActuel: 350, cimentOpti: 330, ecart: '+24.8%', econAn: '374,400 MAD', risque: 'Aucun' },
    { formule: 'F-B30', cimentActuel: 400, cimentOpti: 385, ecart: '+3.9%', econAn: '48,000 MAD', risque: 'Faible' },
    { formule: 'F-B20', cimentActuel: 280, cimentOpti: 275, ecart: '+1.8%', econAn: '16,000 MAD', risque: 'Aucun' },
  ];

  // Certification data
  const certRows = [
    { norme: 'NM 10.1.008', desc: 'Béton — Spécification, performances, production', statut: 'Conforme', expire: '2026-06-15' },
    { norme: 'NM 10.1.271', desc: 'Essais pour béton frais — Affaissement', statut: 'À renouveler', expire: '2025-04-01' },
    { norme: 'NM 10.1.012', desc: 'Essais pour béton durci — Résistance compression', statut: 'Conforme', expire: '2026-09-30' },
  ];

  // Operators
  const operators = [
    { name: 'Youssef M.', tests: 42, conf: 96, scoreIA: 94 },
    { name: 'Sarah L.',   tests: 38, conf: 91, scoreIA: 87 },
    { name: 'Ahmed R.',   tests: 35, conf: 88, scoreIA: 81 },
    { name: 'Karim B.',   tests: 28, conf: 84, scoreIA: 72 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── HEADER ── */}
      <div>
        <p style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: T.gold, letterSpacing: '2px', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>
          ✦ Centre d'Intelligence Laboratoire
        </p>
        <p style={{ fontFamily: MONO, fontSize: 12, color: T.gold, margin: 0 }}>
          5 agents actifs · Surveillance continue · Claude Opus
        </p>
      </div>

      {/* ── TOP SUMMARY STRIP ── */}
      <div style={{ display: 'flex', gap: 16 }}>
        <AgentKPI label="Alertes Qualité" value="2" color={T.warning} borderColor={T.warning} />
        <AgentKPI label="Économies Détectées" value="+374,400 MAD/an" color={T.success} borderColor={T.success} />
        <AgentKPI label="Score Conformité" value="96.2%" color={T.gold} borderColor={T.gold} />
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* AGENT 1 — CONFORMITÉ NM AUTO-CHECK                */}
      {/* ══════════════════════════════════════════════════ */}
      <Card style={{ borderTop: `2px solid ${T.success}` }}>
        {agentHeader('✦ Agent IA: Conformité NM Auto-Check', T.success, <>
          <Bdg label="● LIVE" color={T.success} bg="rgba(34,197,94,0.12)" pulse />
          <IABadge />
        </>)}

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <AgentKPI label="Batches Vérifiés" value="14/14" color={T.success} borderColor={T.success} />
          <AgentKPI label="Conformité Auto" value="87.5%" color={T.gold} borderColor={T.gold} />
          <AgentKPI label="Bloqués Aujourd'hui" value="1" color={T.danger} borderColor={T.danger} />
        </div>

        <p style={{ fontFamily: MONO, fontSize: 12, color: T.textDim, marginBottom: 16 }}>
          Chaque batch vérifié automatiquement contre NM 10.1.008 avant autorisation de chargement camion.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['BATCH','FORMULE','AFFAISSEMENT','E/C','RÉSISTANCE 7J','NM CHECK'].map(h => <th key={h} style={tblHdr}>{h}</th>)}
            </tr></thead>
            <tbody>
              {nmRows.map((r, i) => (
                <tr key={i} style={{ ...altRow(i), borderLeft: r.check === 'bloqué' ? '3px solid #EF4444' : 'none' }}>
                  <td style={{ ...monoCell, color: T.gold }}>{r.batch}</td>
                  <td style={tblCell}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: MONO, fontWeight: 700, background: r.formule.includes('B25') ? 'rgba(212,168,67,0.15)' : r.formule.includes('B30') ? 'rgba(196,154,60,0.15)' : 'rgba(232,201,106,0.15)', color: r.formule.includes('B25') ? '#D4A843' : r.formule.includes('B30') ? '#C49A3C' : '#E8C96A' }}>{r.formule}</span></td>
                  <td style={monoCell}>{r.aff}</td>
                  <td style={monoCell}>{r.ec}</td>
                  <td style={monoCell}>{r.r7j}</td>
                  <td style={tblCell}>
                    {r.check === 'validé'
                      ? <span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.12)', color: T.success, border: `1px solid ${T.success}40` }}>✓ VALIDÉ</span>
                      : <span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: T.danger, border: `1px solid ${T.danger}40` }}>✗ BLOQUÉ</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recoBox("Tous les batches conformes sauf BN-0140 (bloqué à 11:48 — excès d'eau détecté). Correction doseur appliquée à 11:55. Prochain contrôle automatique dans 45 min. Aucun camion n'a quitté l'usine avec du béton non-conforme aujourd'hui.")}
      </Card>

      {/* ══════════════════════════════════════════════════ */}
      {/* AGENT 2 — PRÉDICTEUR DE RÉSISTANCE 28 JOURS       */}
      {/* ══════════════════════════════════════════════════ */}
      <Card style={{ borderTop: `2px solid ${T.gold}` }}>
        {agentHeader('✦ Agent IA: Prédicteur de Résistance 28 Jours', T.gold, <IABadge />)}

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <AgentKPI label="Précision Modèle" value="94.2%" color={T.gold} borderColor={T.gold} />
          <AgentKPI label="Batches Prédits" value="14" color={T.textPri} subtitle="aujourd'hui" borderColor={T.gold} />
          <AgentKPI label="Alertes Précoces" value="1" color={T.warning} borderColor={T.warning} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['BATCH','FORMULE','RÉSISTANCE 7J','PRÉDICTION 28J','CONFIANCE','RISQUE'].map(h => <th key={h} style={tblHdr}>{h}</th>)}
            </tr></thead>
            <tbody>
              {predRows.map((r, i) => {
                const isHigh = r.risk === 'ÉLEVÉ';
                return (
                  <tr key={i} style={{ ...altRow(i), borderLeft: isHigh ? '3px solid #EF4444' : 'none' }}>
                    <td style={{ ...monoCell, color: T.gold }}>{r.batch}</td>
                    <td style={tblCell}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: MONO, fontWeight: 700, background: r.formule.includes('B25') ? 'rgba(212,168,67,0.15)' : r.formule.includes('B30') ? 'rgba(196,154,60,0.15)' : 'rgba(232,201,106,0.15)', color: r.formule.includes('B25') ? '#D4A843' : r.formule.includes('B30') ? '#C49A3C' : '#E8C96A' }}>{r.formule}</span></td>
                    <td style={monoCell}>{r.r7j}</td>
                    <td style={{ ...monoCell, color: isHigh ? T.danger : T.gold }}>{r.pred}</td>
                    <td style={tblCell}><MiniGauge value={r.conf} /></td>
                    <td style={tblCell}>
                      <span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4,
                        background: isHigh ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                        color: isHigh ? T.danger : T.success,
                        border: `1px solid ${isHigh ? T.danger : T.success}40`,
                      }}>{r.risk}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {recoBox("Batch BN-0140 (F-B25-HP) présente un ratio E/C de 0.520 avant correction. Prédiction résistance 28j : 23.4 MPa (requis : 25 MPa). Confiance : 67%. Risque de non-conformité à 28 jours : 34%. Recommandation : surveiller étroitement ce batch au jour 7. Si résistance 7j < 18 MPa, déclencher alerte client et préparer batch de remplacement.", T.warning)}
      </Card>

      {/* ══════════════════════════════════════════════════ */}
      {/* AGENT 3 — DÉTECTEUR DE FRAUDE QUALITÉ             */}
      {/* ══════════════════════════════════════════════════ */}
      <Card style={{ borderTop: `2px solid ${T.danger}` }}>
        {agentHeader('✦ Agent IA: Détecteur de Fraude Qualité', T.danger, <>
          <span style={{ fontFamily: MONO, fontSize: 11, color: T.danger, padding: '4px 8px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, background: 'rgba(239,68,68,0.15)' }}>FORENSIQUE</span>
          <IABadge />
        </>)}

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <AgentKPI label="Anomalies E/C" value="3" color={T.danger} subtitle="sur 14 jours" borderColor={T.danger} />
          <AgentKPI label="Shift Suspect" value="Nuit (22h-6h)" color={T.warning} subtitle="67% des écarts" borderColor={T.warning} />
          <AgentKPI label="Perte Estimée" value="45,000 MAD/an" color={T.danger} subtitle="béton sous-performant" borderColor={T.danger} />
        </div>

        {/* Triangle de vérification */}
        <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 16 }}>
          Triangle de Vérification
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
          {/* Card: Recette */}
          <div style={{ flex: 1, padding: '16px 18px', background: 'linear-gradient(145deg, #111B2E, #162036)', border: `1px solid ${T.cardBorder}`, borderRadius: 10, borderTop: `2px solid ${T.gold}` }}>
            <p style={{ fontSize: 12, margin: '0 0 2px' }}>📋 RECETTE</p>
            <p style={{ fontSize: 10, color: T.textDim, margin: '0 0 8px' }}>F-B25 Théorique</p>
            <p style={{ fontFamily: MONO, fontSize: 24, fontWeight: 200, color: T.gold, margin: 0 }}>E/C: 0.500</p>
          </div>
          {/* Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 6px' }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: T.warning }}>+4%</span>
            <span style={{ color: T.textDim, fontSize: 16 }}>→</span>
          </div>
          {/* Card: Production */}
          <div style={{ flex: 1, padding: '16px 18px', background: 'linear-gradient(145deg, #111B2E, #162036)', border: `1px solid ${T.cardBorder}`, borderRadius: 10, borderTop: `2px solid ${T.warning}` }}>
            <p style={{ fontSize: 12, margin: '0 0 2px' }}>⚙️ PRODUCTION</p>
            <p style={{ fontSize: 10, color: T.textDim, margin: '0 0 8px' }}>Doseur Réel</p>
            <p style={{ fontFamily: MONO, fontSize: 24, fontWeight: 200, color: T.warning, margin: 0 }}>E/C: 0.520</p>
            <span style={{ fontFamily: MONO, fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(245,158,11,0.12)', color: T.warning, border: `1px solid ${T.warning}40` }}>+4.0%</span>
          </div>
          {/* Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 6px' }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: T.danger }}>+4%</span>
            <span style={{ color: T.textDim, fontSize: 16 }}>→</span>
          </div>
          {/* Card: Laboratoire */}
          <div style={{ flex: 1, padding: '16px 18px', background: 'linear-gradient(145deg, #111B2E, #162036)', border: `1px solid ${T.cardBorder}`, borderRadius: 10, borderTop: `2px solid ${T.danger}` }}>
            <p style={{ fontSize: 12, margin: '0 0 2px' }}>🔬 LABORATOIRE</p>
            <p style={{ fontSize: 10, color: T.textDim, margin: '0 0 8px' }}>Mesuré</p>
            <p style={{ fontFamily: MONO, fontSize: 24, fontWeight: 200, color: T.danger, margin: 0 }}>E/C: 0.540</p>
            <span style={{ fontFamily: MONO, fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(239,68,68,0.12)', color: T.danger, border: `1px solid ${T.danger}40` }}>+8.0%</span>
          </div>
        </div>

        {/* Incident timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ padding: '16px 18px', background: 'linear-gradient(145deg, #111B2E, #162036)', border: `1px solid ${T.cardBorder}`, borderRadius: 10, borderTop: `3px solid ${T.danger}` }}>
            <p style={{ fontFamily: MONO, fontSize: 12, color: T.danger, fontWeight: 700, marginBottom: 8 }}>8 mars · Shift Nuit</p>
            <p style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Batch BN-0098 — E/C mesuré 0.552 vs recette 0.500</p>
            <p style={{ fontSize: 12, color: T.textDim, marginBottom: 4 }}>Opérateur: #03 · Aucune correction doseur signalée</p>
            <p style={{ fontSize: 12, color: T.danger, margin: 0 }}>Résistance 28j résultat : 23.1 MPa (requis 25) — <strong>NON-CONFORME</strong></p>
          </div>
          <div style={{ padding: '16px 18px', background: 'linear-gradient(145deg, #111B2E, #162036)', border: `1px solid ${T.cardBorder}`, borderRadius: 10, borderTop: `3px solid ${T.warning}` }}>
            <p style={{ fontFamily: MONO, fontSize: 12, color: T.warning, fontWeight: 700, marginBottom: 8 }}>5 mars · Shift Nuit</p>
            <p style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Batch BN-0087 — E/C mesuré 0.535 vs recette 0.500</p>
            <p style={{ fontSize: 12, color: T.textDim, marginBottom: 4 }}>Opérateur: #03 · Ajustement eau +7L non-documenté</p>
            <p style={{ fontSize: 12, color: T.warning, margin: 0 }}>Résistance 28j résultat : 24.2 MPa — <strong>LIMITE</strong></p>
          </div>
        </div>

        {/* Red alert box */}
        <div style={{ borderLeft: `4px solid ${T.danger}`, background: 'rgba(239,68,68,0.05)', padding: '14px 18px', borderRadius: '0 8px 8px 0', marginBottom: 12 }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: T.textSec, lineHeight: 1.7, margin: 0 }}>
            Pattern identifié : 3 écarts E/C &gt;5% sur 14 jours, tous concentrés sur shift nuit (22h-6h), opérateur #03 impliqué dans 100% des cas. L'écart progressif Recette→Production→Lab (+8%) dépasse largement la tolérance de 3%. Impact qualité : résistance 28j réduite de ~8% sur batches affectés. Coût estimé : 45,000 MAD/an en béton sous-performant livré aux clients.
          </p>
        </div>

        {recoBox("Actions recommandées : (1) Convoquer opérateur #03 — entretien sur procédures dosage eau. (2) Installer capteur de débit eau automatique sur ligne de production — supprime le facteur humain. (3) Mettre en place double validation pour ajustements eau >2L pendant shifts nuit. (4) Audit croisé recette-production-lab sur les 30 derniers batches nuit. Investissement capteur : ~15,000 MAD. ROI : 3 mois.", T.danger)}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}><IABadge /></div>
      </Card>

      {/* ══════════════════════════════════════════════════ */}
      {/* AGENT 4 — OPTIMISATION FORMULES                   */}
      {/* ══════════════════════════════════════════════════ */}
      <Card style={{ borderTop: `2px solid ${T.gold}` }}>
        {agentHeader('✦ Agent IA: Optimisation Formules', T.gold, <IABadge />)}

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <AgentKPI label="Coût Moyen / m³" value="36 MAD" color={T.gold} borderColor={T.gold} />
          <AgentKPI label="Économie Potentielle" value="374,400 MAD" color={T.success} subtitle="par an" borderColor={T.success} />
          <AgentKPI label="Formules Optimisables" value="3" color={T.warning} borderColor={T.warning} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['FORMULE','CIMENT ACTUEL (kg/m³)','CIMENT OPTIMISÉ','ÉCART','ÉCONOMIE/AN','RISQUE'].map(h => <th key={h} style={tblHdr}>{h}</th>)}
            </tr></thead>
            <tbody>
              {formulaRows.map((r, i) => (
                <tr key={i} style={altRow(i)}>
                  <td style={{ ...monoCell, color: T.gold }}>{r.formule}</td>
                  <td style={monoCell}>{r.cimentActuel}</td>
                  <td style={{ ...monoCell, color: T.success }}>{r.cimentOpti}</td>
                  <td style={{ ...monoCell, color: parseFloat(r.ecart) > 5 ? T.danger : T.warning }}>{r.ecart}</td>
                  <td style={{ ...monoCell, color: T.success, fontWeight: 700 }}>{r.econAn}</td>
                  <td style={tblCell}>
                    <span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4,
                      background: r.risque === 'Aucun' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                      color: r.risque === 'Aucun' ? T.success : T.warning,
                      border: `1px solid ${r.risque === 'Aucun' ? T.success : T.warning}40`,
                    }}>{r.risque}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recoBox("Recommandation prioritaire : Réduire le dosage ciment de la formule F-B25 de 350 à 330 kg/m³. Les tests de résistance sur 90 jours montrent une marge de +24.8% au-dessus du seuil requis. Économie annuelle estimée : 374,400 MAD sans aucun risque sur la conformité NM.")}
      </Card>

      {/* ══════════════════════════════════════════════════ */}
      {/* AGENT 5 — CONFORMITÉ RÉGLEMENTAIRE                */}
      {/* ══════════════════════════════════════════════════ */}
      <Card style={{ borderTop: `2px solid ${T.success}` }}>
        {agentHeader('✦ Agent IA: Conformité Réglementaire', T.success, <IABadge />)}

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <AgentKPI label="Score Conformité" value="78" color={T.gold} borderColor={T.gold} />
          <AgentKPI label="Certifications Actives" value="3" color={T.success} borderColor={T.success} />
          <AgentKPI label="Alertes Réglementaires" value="1" color={T.warning} subtitle="renouvellement" borderColor={T.warning} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['NORME','DESCRIPTION','STATUT','EXPIRATION'].map(h => <th key={h} style={tblHdr}>{h}</th>)}
            </tr></thead>
            <tbody>
              {certRows.map((r, i) => {
                const isWarning = r.statut === 'À renouveler';
                return (
                  <tr key={i} style={{ ...altRow(i), borderLeft: isWarning ? '3px solid #F59E0B' : 'none' }}>
                    <td style={{ ...monoCell, color: T.gold }}>{r.norme}</td>
                    <td style={{ ...tblCell, color: T.textSec }}>{r.desc}</td>
                    <td style={tblCell}>
                      <span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4,
                        background: isWarning ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
                        color: isWarning ? T.warning : T.success,
                        border: `1px solid ${isWarning ? T.warning : T.success}40`,
                      }}>{r.statut}</span>
                    </td>
                    <td style={{ ...monoCell, color: isWarning ? T.warning : T.textDim }}>{r.expire}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ borderLeft: `4px solid ${T.warning}`, background: 'rgba(245,158,11,0.05)', padding: '14px 18px', borderRadius: '0 8px 8px 0', marginTop: 16 }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: T.textSec, lineHeight: 1.7, margin: 0 }}>
            ⚠ Alerte prioritaire : La certification NM 10.1.271 (Essais affaissement) expire le 1er avril 2025. Planifier le renouvellement immédiatement pour éviter un blocage réglementaire.
          </p>
        </div>

        <div style={{ marginTop: 12 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'transparent', border: `1px solid ${T.gold}`, borderRadius: 9, color: T.gold, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            <FileText size={13} /> Planifier Test
          </button>
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════ */}
      {/* PERFORMANCE OPÉRATEURS                            */}
      {/* ══════════════════════════════════════════════════ */}
      <Card style={{ borderTop: `2px solid ${T.gold}` }}>
        <SectionHeader icon={User} label="✦ Performance Opérateurs" right={<IABadge />} />

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['OPÉRATEUR','TESTS RÉALISÉS','CONFORMITÉ','SCORE IA'].map(h => <th key={h} style={tblHdr}>{h}</th>)}
            </tr></thead>
            <tbody>
              {operators.map((op, i) => {
                const confColor = op.conf >= 90 ? T.success : op.conf >= 85 ? T.warning : T.danger;
                const scoreColor = op.scoreIA >= 85 ? T.success : op.scoreIA >= 70 ? T.warning : T.danger;
                return (
                  <tr key={i} style={{ ...altRow(i), borderLeft: op.conf < 85 ? `3px solid ${T.danger}` : 'none' }}>
                    <td style={{ ...tblCell, color: T.textPri, fontWeight: 600 }}>{op.name}</td>
                    <td style={monoCell}>{op.tests}</td>
                    <td style={tblCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', maxWidth: 120 }}>
                          <div style={{ height: '100%', width: `${op.conf}%`, background: confColor, borderRadius: 99, transition: 'width 800ms ease-out' }} />
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 200, color: confColor }}>{op.conf}%</span>
                      </div>
                    </td>
                    <td style={tblCell}>
                      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 200, color: scoreColor, padding: '2px 8px', border: `1px solid ${scoreColor}40`, borderRadius: 4 }}>{op.scoreIA}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassLaboratory() {
  const [activeTab, setActiveTab] = useState('essais');
  const [hoverNew, setHoverNew] = useState(false);
  const { kpis: labKpis } = useLaboratoryLiveData();

  const TABS = [
    { id: 'essais', label: 'ESSAIS DU JOUR' },
    { id: 'historique', label: 'HISTORIQUE & NORMES' },
    { id: 'analytique', label: 'ANALYTIQUE' },
    { id: 'ia', label: 'INTELLIGENCE IA', badge: '5' },
  ];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: T.textPri, paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes lab-tab-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* PAGE HEADER */}
      <PageHeader
        icon={FlaskConical}
        title="Laboratoire"
        subtitle="Contrôle qualité et essais"
        tabs={TABS.map(t => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            onMouseEnter={() => setHoverNew(true)} onMouseLeave={() => setHoverNew(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px',
              background: '#D4A843', color: '#0F1629',
              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12,
              cursor: 'pointer', transition: 'all 150ms', fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <Plus size={14} /> Nouveau Test
          </button>
        }
      />

      {/* CUSTOM TAB BAR (override PageHeader tabs for exact styling) */}
      <div style={{ padding: '0 32px', borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: '1.5px',
                  fontWeight: 600,
                  color: isActive ? '#D4A843' : '#9CA3AF',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #D4A843' : '2px solid transparent',
                  padding: '14px 24px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textTransform: 'uppercase',
                }}
              >
                {tab.label}
                {tab.badge && (
                  <span style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#0F1629',
                    background: '#D4A843',
                    borderRadius: 999,
                    padding: '1px 7px',
                    lineHeight: '16px',
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: '32px 32px 0', animation: 'lab-tab-fade 0.35s ease-out' }} key={activeTab}>
        {activeTab === 'essais' && <EssaisDuJourTab labKpis={labKpis} />}
        {activeTab === 'historique' && <HistoriqueNormesTab />}
        {activeTab === 'analytique' && <AnalytiqueTab />}
        {activeTab === 'ia' && <IntelligenceIATab />}
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
        background: fill ? (hov ? `${bg}CC` : bg) : (hov ? 'rgba(212,168,67,0.1)' : 'transparent'),
        border: fill ? 'none' : `1px solid ${outline}`,
        borderRadius: 9, color, fontWeight: 700, fontSize: 12, cursor: 'pointer',
        transition: 'all 160ms', fontFamily: 'DM Sans, sans-serif',
        transform: hov ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      <Icon size={13} /> {label}
    </button>
  );
}
