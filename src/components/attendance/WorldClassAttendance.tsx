import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Cell,
} from 'recharts';
import {
  Users, CheckCircle, AlertTriangle, Clock, Calendar,
  Heart, Phone, Flag, TrendingUp,
} from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

// ─── Design tokens ───────────────────────────────────────────────
const T = {
  bg: '#0B1120',
  card: 'rgba(17,27,46,0.85)',
  cardBorder: 'rgba(255,215,0,0.10)',
  gold: '#FFD700',
  goldDim: 'rgba(255,215,0,0.12)',
  green: '#22C55E',
  greenDim: 'rgba(34,197,94,0.12)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.12)',
  yellow: '#FBBF24',
  yellowDim: 'rgba(251,191,36,0.12)',
  blue: '#3B82F6',
  blueDim: 'rgba(59,130,246,0.12)',
  purple: '#A855F7',
  purpleDim: 'rgba(168,85,247,0.12)',
  cyan: '#06B6D4',
  cyanDim: 'rgba(6,182,212,0.12)',
  pink: '#EC4899',
  pinkDim: 'rgba(236,72,153,0.12)',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textDim: '#64748B',
  border: 'rgba(255,255,255,0.06)',
};

const MONO = "'JetBrains Mono', monospace";
const SANS = "'DM Sans', sans-serif";

// ─── Hooks ──────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return vis;
}

function useProgressBar(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * target);
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return val;
}

function useLiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  useEffect(() => {
    const id = setInterval(() =>
      setTime(new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    , 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── Sub-components ──────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, badges }: {
  icon?: React.ElementType;
  title: string;
  badges?: { label: string; color: string; bg: string; pulse?: boolean }[];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 4, height: 28, background: T.gold, borderRadius: 2, flexShrink: 0 }} />
      {Icon && <Icon size={20} color={T.gold} />}
      <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 18, color: T.textPri, margin: 0 }}>{title}</h2>
      {badges?.map((b, i) => (
        <span key={i} style={{
          fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: '3px 10px',
          borderRadius: 100, background: b.bg, color: b.color,
          animation: b.pulse ? 'pulse 2s infinite' : undefined,
        }}>{b.label}</span>
      ))}
    </div>
  );
}

function DeptBadge({ dept }: { dept: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    'Production':   { color: T.gold,    bg: T.goldDim },
    'Logistique':   { color: T.blue,    bg: T.blueDim },
    'Commercial':   { color: T.green,   bg: T.greenDim },
    'Direction':    { color: T.purple,  bg: T.purpleDim },
    'Qualité':      { color: T.yellow,  bg: T.yellowDim },
    'Finance':      { color: T.cyan,    bg: T.cyanDim },
    'Maintenance':  { color: T.pink,    bg: T.pinkDim },
    'Stock':        { color: T.textSec, bg: 'rgba(148,163,184,0.12)' },
  };
  const s = map[dept] ?? { color: T.textSec, bg: T.border };
  return (
    <span style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 100, background: s.bg, color: s.color,
    }}>{dept}</span>
  );
}

function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1E293B', border: `1px solid ${T.cardBorder}`,
      borderRadius: 10, padding: '10px 14px', fontFamily: SANS,
    }}>
      <div style={{ color: T.textSec, fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 12, fontWeight: 700 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────
function KPICard({ label, value, decimals = 0, suffix, color, iconBg, Icon, trend, delay }: {
  label: string; value: number; decimals?: number; suffix?: string; color: string;
  iconBg: string; Icon: React.ElementType;
  trend?: { label: string; color: string };
  delay: number;
}) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  const count = useAnimatedCounter(value, 1200, decimals);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.card,
        border: `1px solid ${hov ? 'rgba(255,215,0,0.25)' : T.cardBorder}`,
        borderRadius: 16, padding: '20px 22px',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(16px)',
        opacity: vis ? 1 : 0,
        boxShadow: hov ? '0 12px 40px rgba(255,215,0,0.10)' : '0 2px 12px rgba(0,0,0,0.3)',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ background: iconBg, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        {trend && <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: trend.color }}>{trend.label}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color }}>{count}</span>
        {suffix && <span style={{ fontFamily: MONO, fontSize: 14, color: T.textDim }}>{suffix}</span>}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── SVG Gauge ───────────────────────────────────────────────────
function AttendanceGauge({ value }: { value: number }) {
  const anim = useProgressBar(value, 1400);
  const R = 70; const cx = 90; const cy = 88;
  const startAngle = -210; const endAngle = 30;
  const totalDeg = endAngle - startAngle;
  const deg = (anim / 100) * totalDeg;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcPath = (from: number, to: number, r: number) => {
    const sx = cx + r * Math.cos(toRad(from));
    const sy = cy + r * Math.sin(toRad(from));
    const ex = cx + r * Math.cos(toRad(to));
    const ey = cy + r * Math.sin(toRad(to));
    const large = (to - from) > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };
  const color = value >= 85 ? T.green : value >= 70 ? T.yellow : T.red;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={180} height={130} viewBox="0 0 180 130">
        <path d={arcPath(startAngle, endAngle, R)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} strokeLinecap="round" />
        <path
          d={arcPath(startAngle, startAngle + deg, R)}
          fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'all 0.05s linear' }}
        />
        <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, fill: color }}>{value}%</text>
        <text x={cx} y={cy + 26} textAnchor="middle" style={{ fontFamily: SANS, fontSize: 9, fill: T.textDim }}>Taux Présence</text>
      </svg>
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────
const EMPLOYEES = [
  { id: 1,  nom: 'Ahmed Benali',      poste: 'Opérateur Centrale',   dept: 'Production',  arrivee: '06:00', depart: '—', heures: 9.5,  pause: '0h30', status: 'present' },
  { id: 2,  nom: 'Khalid Mansouri',   poste: 'Chauffeur TK-01',      dept: 'Logistique',  arrivee: '06:30', depart: '—', heures: 9.0,  pause: '0h30', status: 'present' },
  { id: 3,  nom: 'Youssef Rami',      poste: 'Chauffeur TK-02',      dept: 'Logistique',  arrivee: '07:00', depart: '—', heures: 8.5,  pause: '0h30', status: 'present' },
  { id: 4,  nom: 'Hassan Lazrak',     poste: 'Chauffeur TK-04',      dept: 'Logistique',  arrivee: '06:45', depart: '—', heures: 8.75, pause: '0h30', status: 'present' },
  { id: 5,  nom: 'Mohammed Alami',    poste: 'Technicien Senior',    dept: 'Maintenance', arrivee: '07:00', depart: '—', heures: 8.5,  pause: '0h30', status: 'present' },
  { id: 6,  nom: 'Fatima Zahra',      poste: 'Admin Commercial',     dept: 'Commercial',  arrivee: '08:00', depart: '—', heures: 7.5,  pause: '1h00', status: 'present' },
  { id: 7,  nom: 'Karim Benani',      poste: 'Responsable Ventes',   dept: 'Commercial',  arrivee: '08:15', depart: '—', heures: 7.25, pause: '1h00', status: 'present' },
  { id: 8,  nom: 'Amina Lakhdar',     poste: 'Assistante Direction', dept: 'Direction',   arrivee: '08:00', depart: '—', heures: 7.5,  pause: '1h00', status: 'present' },
  { id: 9,  nom: 'Rachid Moussaoui',  poste: 'Opérateur Malaxeur',  dept: 'Production',  arrivee: '06:00', depart: '—', heures: 9.5,  pause: '0h30', status: 'present' },
  { id: 10, nom: 'Mustapha Ezzahi',   poste: 'Laborantin',           dept: 'Qualité',     arrivee: '07:30', depart: '—', heures: 8.0,  pause: '0h30', status: 'present' },
  { id: 11, nom: 'Abdellah Karimi',   poste: 'Manoeuvre',            dept: 'Production',  arrivee: '06:00', depart: '—', heures: 9.5,  pause: '0h30', status: 'present' },
  { id: 12, nom: 'Brahim Tahiri',     poste: 'Manoeuvre',            dept: 'Production',  arrivee: '06:00', depart: '—', heures: 9.5,  pause: '0h30', status: 'present' },
  { id: 13, nom: 'Nadia Filali',      poste: 'Comptable',            dept: 'Finance',     arrivee: '08:30', depart: '—', heures: 7.0,  pause: '1h00', status: 'present' },
  { id: 14, nom: 'Samir Ouazzani',    poste: 'Magasinier',           dept: 'Stock',       arrivee: '07:00', depart: '—', heures: 8.5,  pause: '0h30', status: 'present' },
  { id: 15, nom: 'Omar Idrissi',      poste: 'Laborantin',           dept: 'Qualité',     arrivee: '—',     depart: '—', heures: 0,    pause: '—',    status: 'absent-sick' },
  { id: 16, nom: 'Said Bouazza',      poste: 'Manoeuvre',            dept: 'Production',  arrivee: '—',     depart: '—', heures: 0,    pause: '—',    status: 'absent-unjust' },
];

const WEEKLY_DATA = [
  { day: 'Lun', presents: 15, absents: 1 },
  { day: 'Mar', presents: 16, absents: 0 },
  { day: 'Mer', presents: 14, absents: 2 },
  { day: 'Jeu', presents: 15, absents: 1 },
  { day: 'Ven', presents: 14, absents: 2 },
  { day: 'Sam', presents: 8,  absents: 0 },
  { day: 'Dim', presents: 0,  absents: 0 },
];

const DEPT_HOURS = [
  { dept: 'Production',  heures: 38.0, color: T.gold },
  { dept: 'Logistique',  heures: 26.3, color: T.blue },
  { dept: 'Commercial',  heures: 14.8, color: T.green },
  { dept: 'Maintenance', heures: 8.5,  color: T.pink },
  { dept: 'Stock',       heures: 8.5,  color: T.textSec },
  { dept: 'Qualité',     heures: 8.0,  color: T.yellow },
  { dept: 'Direction',   heures: 7.5,  color: T.purple },
  { dept: 'Finance',     heures: 7.0,  color: T.cyan },
];

const TREND_DATA = [
  { week: 'S03', taux: 94 },
  { week: 'S04', taux: 91 },
  { week: 'S05', taux: 96 },
  { week: 'S06', taux: 88 },
  { week: 'S07', taux: 93 },
  { week: 'S08', taux: 87.5 },
];

const OVERTIME = [
  { nom: 'Ahmed Benali',     poste: 'Opérateur Centrale', heures: 12, jours: 8,  compensation: '1 800 DH', status: 'approved' },
  { nom: 'Rachid Moussaoui', poste: 'Opérateur Malaxeur', heures: 10, jours: 7,  compensation: '1 500 DH', status: 'approved' },
  { nom: 'Khalid Mansouri',  poste: 'Chauffeur TK-01',    heures: 8,  jours: 5,  compensation: '1 200 DH', status: 'approved' },
  { nom: 'Mohammed Alami',   poste: 'Technicien',         heures: 6,  jours: 4,  compensation: '900 DH',   status: 'pending' },
  { nom: 'Abdellah Karimi',  poste: 'Manoeuvre',          heures: 12, jours: 10, compensation: '1 200 DH', status: 'approved' },
];

const LEAVES = [
  { nom: 'Fatima Zahra',    type: 'Congé annuel',    du: '01 Mars', au: '05 Mars', jours: 5, status: 'approved', typeColor: T.blue,   typeBg: T.blueDim },
  { nom: 'Youssef Rami',    type: 'Congé personnel', du: '10 Mars', au: '11 Mars', jours: 2, status: 'pending',  typeColor: T.purple, typeBg: T.purpleDim },
  { nom: 'Samir Ouazzani',  type: 'Formation',       du: '15 Mars', au: '16 Mars', jours: 2, status: 'approved', typeColor: T.gold,   typeBg: T.goldDim },
];

// ─── Monthly summary sub-component (hooks outside loop) ──────────
function MonthlySummary() {
  const c0 = useAnimatedCounter(18, 1200);
  const c1 = useAnimatedCounter(91, 1200);
  const c2 = useAnimatedCounter(2128, 1200);
  const c3 = useAnimatedCounter(12, 1200);
  const vis = useFadeIn(0);
  const [h0, sh0] = useState(false);
  const [h1, sh1] = useState(false);
  const [h2, sh2] = useState(false);
  const [h3, sh3] = useState(false);

  const cards = [
    { label: 'Jours Travaillés',    count: c0, suffix: '/20', color: T.gold,   Icon: Calendar,    iconBg: T.goldDim,  hov: h0, setHov: sh0 },
    { label: 'Taux Moyen Mensuel',  count: c1, suffix: '.2%', color: T.green,  Icon: TrendingUp,  iconBg: T.greenDim, hov: h1, setHov: sh1 },
    { label: 'Total Heures',        count: c2, suffix: ' h',  color: T.gold,   Icon: Clock,       iconBg: T.goldDim,  hov: h2, setHov: sh2 },
    { label: 'Absences Totales',    count: c3, suffix: ' j',  color: T.yellow, Icon: AlertTriangle, iconBg: T.yellowDim, hov: h3, setHov: sh3 },
  ];

  return (
    <div>
      <SectionHeader icon={Calendar} title="Résumé du Mois — Février 2024" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {cards.map((c, i) => (
          <div
            key={i}
            onMouseEnter={() => c.setHov(true)}
            onMouseLeave={() => c.setHov(false)}
            style={{
              background: T.card,
              border: `1px solid ${c.hov ? 'rgba(255,215,0,0.25)' : T.cardBorder}`,
              borderRadius: 16, padding: '22px',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.3s ease',
              transform: vis ? (c.hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(16px)',
              opacity: vis ? 1 : 0,
              boxShadow: c.hov ? '0 12px 40px rgba(255,215,0,0.10)' : '0 2px 12px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ background: c.iconBg, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <c.Icon size={18} color={c.color} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: c.color }}>{c.count}</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}>{c.suffix}</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function WorldClassAttendance() {
  const [activeTab, setActiveTab] = useState("Aujourd'hui");
  const [hoverBtn, setHoverBtn] = useState(false);
  const clock = useLiveClock();

  const TABS = ["Aujourd'hui", 'Cette semaine', 'Ce mois', 'Congés'];

  return (
    <div style={{ fontFamily: SANS, minHeight: '100vh', background: T.bg, color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .att-row:hover { background: rgba(255,215,0,0.04) !important; transform: translateX(4px); }
        .att-row { transition: all 0.2s ease; cursor:default; }
        .ot-row:hover { background: rgba(255,215,0,0.05) !important; transform: translateX(4px); }
        .ot-row { transition: all 0.2s ease; cursor:default; }
        .leave-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(255,215,0,0.08) !important; }
        .leave-card { transition: all 0.3s ease; }
        .abs-card:hover { transform: translateY(-2px); }
        .abs-card { transition: all 0.3s ease; }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '0 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div>
            <h1 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: T.textPri, margin: 0 }}>Présence</h1>
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginTop: 1 }}>Suivi de la présence et pointage</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Live Clock */}
            <div style={{
              background: T.goldDim, border: `1px solid rgba(255,215,0,0.2)`,
              borderRadius: 10, padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Clock size={13} color={T.gold} />
              <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: T.gold }}>{clock}</span>
            </div>
            {/* Pointer Arrivée */}
            <button
              onMouseEnter={() => setHoverBtn(true)}
              onMouseLeave={() => setHoverBtn(false)}
              style={{
                background: hoverBtn ? '#FFE44D' : T.gold,
                color: T.bg, border: 'none', borderRadius: 12,
                padding: '10px 20px',
                fontFamily: SANS, fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transform: hoverBtn ? 'scale(0.97)' : 'scale(1)',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 20px rgba(255,215,0,0.3)',
              }}
            >
              <CheckCircle size={14} /> Pointer Arrivée
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', borderTop: `1px solid ${T.border}` }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent', border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${T.gold}` : '2px solid transparent',
                color: activeTab === tab ? T.gold : T.textDim,
                padding: '12px 20px',
                fontFamily: SANS, fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >{tab}</button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '28px 32px', maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── SECTION 1: KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <KPICard label="Présents Aujourd'hui" value={14} suffix="/16"
            color={T.gold} iconBg={T.goldDim} Icon={Users}
            trend={{ label: '87.5% taux', color: T.green }} delay={80} />
          <KPICard label="Taux de Présence" value={87} suffix=".5%"
            color={T.green} iconBg={T.greenDim} Icon={CheckCircle}
            trend={{ label: '▼ -2.5% vs hier', color: T.yellow }} delay={160} />
          <KPICard label="Absents" value={2}
            color={T.red} iconBg={T.redDim} Icon={AlertTriangle}
            trend={{ label: '▲ +1 vs hier', color: T.red }} delay={240} />
          <KPICard label="Heures Supp. ce mois" value={48} suffix=" h"
            color={T.yellow} iconBg={T.yellowDim} Icon={Clock}
            trend={{ label: '+8h vs mois dernier', color: T.green }} delay={320} />
        </div>

        {/* ── SECTION 2: Gauge + Weekly Chart ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: 20 }}>
          {/* Gauge card */}
          <div style={{
            background: T.card, border: `1px solid ${T.cardBorder}`,
            borderRadius: 16, padding: '24px 20px',
            backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri, alignSelf: 'flex-start' }}>
              Taux de Présence
            </div>
            <AttendanceGauge value={87.5} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
              {/* Présents box */}
              <div style={{
                background: T.greenDim, border: `1px solid rgba(34,197,94,0.2)`,
                borderLeft: `4px solid ${T.green}`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Users size={12} color={T.green} />
                  <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>Présents</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: T.green }}>14</div>
              </div>
              {/* Absents box */}
              <div style={{
                background: T.redDim, border: `1px solid rgba(239,68,68,0.2)`,
                borderLeft: `4px solid ${T.red}`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <AlertTriangle size={12} color={T.red} />
                  <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>Absents</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: T.red }}>2</div>
              </div>
            </div>
          </div>

          {/* Weekly stacked bar chart */}
          <div style={{
            background: T.card, border: `1px solid ${T.cardBorder}`,
            borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Présence Hebdomadaire</div>
              <span style={{
                fontFamily: MONO, fontSize: 12, fontWeight: 700,
                color: T.green, background: T.greenDim, padding: '3px 10px', borderRadius: 100,
              }}>Moy. 92%</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEKLY_DATA} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="day" tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 18]} tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <ReferenceLine y={16} stroke={T.green} strokeDasharray="4 4"
                  label={{ value: 'Effectif complet', fill: T.textDim, fontSize: 10, position: 'insideTopRight' }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="presents" name="Présents" stackId="a" fill={T.green} radius={[0,0,0,0]} isAnimationActive animationDuration={1000} />
                <Bar dataKey="absents"  name="Absents"  stackId="a" fill={T.red}   radius={[4,4,0,0]} isAnimationActive animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── SECTION 3: Today's Attendance List ── */}
        <div style={{
          background: T.card, border: `1px solid ${T.cardBorder}`,
          borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
            <SectionHeader
              title="Pointage du Jour — 20 Février 2024"
              badges={[
                { label: '14 présents', color: T.green,  bg: T.greenDim },
                { label: '2 absents',   color: T.red,    bg: T.redDim, pulse: true },
              ]}
            />
          </div>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 130px 110px 72px 72px 72px 60px 150px',
            gap: 8, padding: '10px 24px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: `1px solid ${T.border}`,
          }}>
            {['#', 'Employé', 'Poste', 'Département', 'Arrivée', 'Départ', 'Heures', 'Pause', 'Statut'].map(h => (
              <div key={h} style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {/* Employee rows */}
          {EMPLOYEES.map((emp, idx) => {
            const isAbsent = emp.status.startsWith('absent');
            const hoursColor = emp.heures === 0 ? T.red : emp.heures > 8 ? T.gold : emp.heures >= 6 ? T.textPri : T.yellow;
            const initials = emp.nom.split(' ').map(n => n[0]).slice(0, 2).join('');
            return (
              <div
                key={emp.id}
                className="att-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 130px 110px 72px 72px 72px 60px 150px',
                  gap: 8, padding: '11px 24px',
                  borderBottom: `1px solid ${T.border}`,
                  background: isAbsent ? 'rgba(239,68,68,0.07)' : 'transparent',
                  borderLeft: isAbsent ? `3px solid ${T.red}` : '3px solid transparent',
                  animation: `fadeUp 0.35s ease both`,
                  animationDelay: `${idx * 40}ms`,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>{emp.id}</div>
                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: isAbsent ? T.red : T.green,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: MONO, fontSize: 10, fontWeight: 800, color: '#fff',
                  }}>{initials}</div>
                  <div>
                    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: T.textPri }}>{emp.nom}</div>
                  </div>
                </div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: T.textSec }}>{emp.poste}</div>
                <div><DeptBadge dept={emp.dept} /></div>
                {/* Arrivée */}
                <div style={{ fontFamily: MONO, fontSize: 12, color: isAbsent ? T.red : T.green, fontWeight: 700 }}>{emp.arrivee}</div>
                {/* Départ */}
                <div style={{ fontFamily: MONO, fontSize: 12, color: T.textDim }}>{emp.depart}</div>
                {/* Heures */}
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: hoursColor }}>
                  {emp.heures === 0 ? '0h' : `${emp.heures}h`}
                </div>
                {/* Pause */}
                <div style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>{emp.pause}</div>
                {/* Status */}
                <div>
                  {emp.status === 'present' && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: T.greenDim, color: T.green,
                      padding: '3px 10px', borderRadius: 100,
                      fontFamily: SANS, fontSize: 10, fontWeight: 700,
                    }}><CheckCircle size={9} /> Présent</span>
                  )}
                  {emp.status === 'absent-sick' && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: T.redDim, color: T.red,
                      padding: '3px 10px', borderRadius: 100,
                      fontFamily: SANS, fontSize: 10, fontWeight: 700,
                      animation: 'pulse 2s infinite',
                    }}><Heart size={9} /> Absent — Maladie</span>
                  )}
                  {emp.status === 'absent-unjust' && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: T.redDim, color: T.red,
                      padding: '3px 10px', borderRadius: 100,
                      fontFamily: SANS, fontSize: 10, fontWeight: 700,
                      animation: 'pulse 2s infinite',
                    }}><AlertTriangle size={9} /> Non justifié</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── SECTION 4: Absence Details ── */}
        <div>
          <SectionHeader
            icon={AlertTriangle}
            title="Absences du Jour"
            badges={[{ label: '2 absences', color: T.red, bg: T.redDim, pulse: true }]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Card 1 — Omar Idrissi (Justified) */}
            <div className="abs-card" style={{
              background: `linear-gradient(135deg, rgba(251,191,36,0.07) 0%, rgba(17,27,46,0.9) 60%)`,
              border: `1px solid rgba(251,191,36,0.25)`,
              borderLeft: `4px solid ${T.yellow}`,
              borderRadius: 16, padding: '22px',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: T.yellowDim, border: `2px solid ${T.yellow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: MONO, fontWeight: 800, fontSize: 13, color: T.yellow,
                  }}>OI</div>
                  <div>
                    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Omar Idrissi</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Laborantin — Qualité</div>
                  </div>
                </div>
                <span style={{ background: T.yellowDim, color: T.yellow, padding: '3px 10px', borderRadius: 100, fontFamily: SANS, fontSize: 10, fontWeight: 700 }}>Justifié</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, background: T.yellowDim, padding: '4px 12px', borderRadius: 100 }}>
                <Heart size={11} color={T.yellow} />
                <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: T.yellow }}>Maladie</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Calendar size={11} color={T.textDim} />
                <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Depuis: 19 Fév → Retour prévu: 22 Fév</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: T.yellow, marginBottom: 10 }}>Durée: 3 jours</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <CheckCircle size={12} color={T.green} />
                <span style={{ fontFamily: SANS, fontSize: 12, color: T.green, fontWeight: 600 }}>Certificat médical ✓</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>
                Remplacement: Mustapha Ezzahi couvre les tests labo
              </div>
            </div>

            {/* Card 2 — Said Bouazza (Unjustified) */}
            <div className="abs-card" style={{
              background: `linear-gradient(135deg, rgba(239,68,68,0.09) 0%, rgba(17,27,46,0.9) 60%)`,
              border: `1px solid rgba(239,68,68,0.30)`,
              borderLeft: `4px solid ${T.red}`,
              borderRadius: 16, padding: '22px',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: T.redDim, border: `2px solid ${T.red}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: MONO, fontWeight: 800, fontSize: 13, color: T.red,
                  }}>SB</div>
                  <div>
                    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Said Bouazza</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Manoeuvre — Production</div>
                  </div>
                </div>
                <span style={{
                  background: T.redDim, color: T.red, padding: '3px 10px', borderRadius: 100,
                  fontFamily: SANS, fontSize: 10, fontWeight: 700, animation: 'pulse 2s infinite',
                }}>Non justifié</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, background: T.redDim, padding: '4px 12px', borderRadius: 100, animation: 'pulse 2s infinite' }}>
                <AlertTriangle size={11} color={T.red} />
                <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: T.red }}>Non justifié</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Calendar size={11} color={T.textDim} />
                <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Depuis: 20 Fév (aujourd'hui) → Retour prévu: —</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: T.red, marginBottom: 10 }}>Durée: 1 jour</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <AlertTriangle size={12} color={T.red} />
                <span style={{ fontFamily: SANS, fontSize: 12, color: T.red, fontWeight: 600 }}>Aucun justificatif ✗</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{
                  background: T.gold, color: T.bg, border: 'none', borderRadius: 10,
                  padding: '8px 16px', fontFamily: SANS, fontWeight: 700, fontSize: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}><Phone size={12} /> Contacter</button>
                <button style={{
                  background: 'transparent', color: T.red, border: `1px solid ${T.red}`,
                  borderRadius: 10, padding: '8px 16px', fontFamily: SANS, fontWeight: 700, fontSize: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}><Flag size={12} /> Signaler RH</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 5: Hours Analysis ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Hours by Dept */}
          <div style={{
            background: T.card, border: `1px solid ${T.cardBorder}`,
            borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Heures par Département</div>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: T.gold }}>118.6 h</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={DEPT_HOURS} layout="vertical" barSize={16} margin={{ left: 10, right: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="dept" type="category" tick={{ fill: T.textSec, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="heures" name="Heures" radius={[0,4,4,0]} isAnimationActive animationDuration={1000}>
                  {DEPT_HOURS.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Rate Trend */}
          <div style={{
            background: T.card, border: `1px solid ${T.cardBorder}`,
            borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Tendance Taux de Présence</div>
              <span style={{ background: T.yellowDim, color: T.yellow, padding: '3px 10px', borderRadius: 100, fontFamily: SANS, fontSize: 10, fontWeight: 700 }}>Objectif: 95%</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginBottom: 16 }}>6 dernières semaines</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="week" tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <ReferenceLine y={95} stroke={T.green} strokeDasharray="4 4"
                  label={{ value: 'Objectif 95%', fill: T.green, fontSize: 10, position: 'insideTopRight' }} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="taux" name="Taux (%)" stroke={T.gold} strokeWidth={2.5}
                  dot={{ fill: T.gold, r: 4, strokeWidth: 0 }} isAnimationActive animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── SECTION 6: Overtime Tracking ── */}
        <div style={{
          background: T.card, border: `1px solid ${T.cardBorder}`,
          borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
            <SectionHeader
              icon={Clock}
              title="Heures Supplémentaires — Février 2024"
              badges={[{ label: '48h total', color: T.yellow, bg: T.yellowDim }]}
            />
          </div>
          {OVERTIME.map((ot, idx) => {
            const initials = ot.nom.split(' ').map(n => n[0]).slice(0, 2).join('');
            return (
              <div
                key={idx}
                className="ot-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 24px',
                  borderBottom: idx < OVERTIME.length - 1 ? `1px solid ${T.border}` : 'none',
                  animation: `fadeUp 0.4s ease both`,
                  animationDelay: `${idx * 60}ms`,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: T.goldDim, border: `2px solid ${T.gold}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: MONO, fontWeight: 800, fontSize: 11, color: T.gold,
                }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.textPri }}>{ot.nom}</div>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>{ot.poste}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 64 }}>
                  <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: T.gold }}>{ot.heures}h</div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>Heures supp.</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 72 }}>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: T.textSec }}>{ot.jours} jours</div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>Jours</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 88 }}>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: T.gold }}>{ot.compensation}</div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>Compensation</div>
                </div>
                <div>
                  {ot.status === 'approved' ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: T.greenDim, color: T.green,
                      padding: '4px 12px', borderRadius: 100,
                      fontFamily: SANS, fontSize: 10, fontWeight: 700,
                    }}><CheckCircle size={10} /> Approuvé</span>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: T.yellowDim, color: T.yellow,
                      padding: '4px 12px', borderRadius: 100,
                      fontFamily: SANS, fontSize: 10, fontWeight: 700,
                      animation: 'pulse 2s infinite',
                    }}><Clock size={10} /> En attente</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── SECTION 7: Monthly Summary ── */}
        <MonthlySummary />

        {/* ── SECTION 8: Leave Calendar ── */}
        <div>
          <SectionHeader
            icon={Calendar}
            title="Congés & Absences Planifiés"
            badges={[{ label: '3 à venir', color: T.blue, bg: T.blueDim }]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {LEAVES.map((lv, idx) => {
              const initials = lv.nom.split(' ').map(n => n[0]).slice(0, 2).join('');
              const borderColor = lv.status === 'approved' ? T.green : T.yellow;
              return (
                <div
                  key={idx}
                  className="leave-card"
                  style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderLeft: `4px solid ${borderColor}`,
                    borderRadius: 16, padding: '20px',
                    backdropFilter: 'blur(12px)',
                    animation: `fadeUp 0.4s ease both`,
                    animationDelay: `${idx * 80}ms`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: lv.status === 'approved' ? T.greenDim : T.yellowDim,
                      border: `2px solid ${borderColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: MONO, fontWeight: 800, fontSize: 12, color: borderColor, flexShrink: 0,
                    }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textPri }}>{lv.nom}</div>
                      <span style={{
                        display: 'inline-block', marginTop: 3,
                        background: lv.typeBg, color: lv.typeColor,
                        padding: '2px 8px', borderRadius: 100,
                        fontFamily: SANS, fontSize: 10, fontWeight: 700,
                      }}>{lv.type}</span>
                    </div>
                    {lv.status === 'approved' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: T.greenDim, color: T.green,
                        padding: '3px 10px', borderRadius: 100,
                        fontFamily: SANS, fontSize: 10, fontWeight: 700,
                      }}><CheckCircle size={9} /> Approuvé</span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: T.yellowDim, color: T.yellow,
                        padding: '3px 10px', borderRadius: 100,
                        fontFamily: SANS, fontSize: 10, fontWeight: 700,
                        animation: 'pulse 2s infinite',
                      }}><Clock size={9} /> En attente</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Calendar size={12} color={T.textDim} />
                    <span style={{ fontFamily: MONO, fontSize: 12, color: T.textSec }}>{lv.du} → {lv.au}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: lv.status === 'pending' ? 14 : 0 }}>
                    <Clock size={12} color={T.textDim} />
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: borderColor }}>{lv.jours} jours</span>
                  </div>
                  {lv.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{
                        flex: 1, background: T.green, color: '#fff', border: 'none',
                        borderRadius: 8, padding: '8px 10px',
                        fontFamily: SANS, fontWeight: 700, fontSize: 11,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      }}><CheckCircle size={11} /> Approuver</button>
                      <button style={{
                        flex: 1, background: 'transparent', color: T.red, border: `1px solid ${T.red}`,
                        borderRadius: 8, padding: '8px 10px',
                        fontFamily: SANS, fontWeight: 700, fontSize: 11,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      }}><AlertTriangle size={11} /> Refuser</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
