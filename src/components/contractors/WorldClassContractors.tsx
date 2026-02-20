import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  Users, Banknote, Heart, FileText, CheckCircle, Clock,
  MapPin, Calendar, ChevronRight, Briefcase, Eye,
  RefreshCw, UserPlus, Award, Plus,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#FFD700',
  goldGlow:   'rgba(255,215,0,0.16)',
  goldBorder: 'rgba(255,215,0,0.28)',
  navy:       '#0B1120',
  cardBg:     'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#3B82F6',
  purple:     '#8B5CF6',
  cyan:       '#06B6D4',
  orange:     '#F97316',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
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

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const CONTRACTORS = [
  { id: 1, initials: 'AP', avatarBg: T.gold,    avatarText: T.navy,    name: 'Atlas Pompage SARL',   specialty: 'Pompage béton',          specialtyColor: T.gold,    tarif: '3,500 DH/j', mission: 'Chantier ONCF Rabat',      jours: 8,  coutMTD: '28,000 DH', rating: 5, status: 'mission' },
  { id: 2, initials: 'TE', avatarBg: T.info,    avatarText: '#fff',    name: 'Transport Express',    specialty: 'Transport spécial',      specialtyColor: T.info,    tarif: '2,800 DH/j', mission: 'Livraison Tanger',          jours: 5,  coutMTD: '14,000 DH', rating: 4, status: 'mission' },
  { id: 3, initials: 'GM', avatarBg: T.success, avatarText: '#fff',    name: 'Grue Maroc',           specialty: 'Levage / Grue',          specialtyColor: T.success, tarif: '5,000 DH/j', mission: 'Chantier Addoha Casa',      jours: 4,  coutMTD: '20,000 DH', rating: 5, status: 'mission' },
  { id: 4, initials: 'NP', avatarBg: T.purple,  avatarText: '#fff',    name: 'Nettoyage Pro',        specialty: 'Nettoyage chantier',     specialtyColor: T.purple,  tarif: '1,200 DH/j', mission: null,                       jours: 6,  coutMTD: '7,200 DH',  rating: 4, status: 'disponible' },
  { id: 5, initials: 'SP', avatarBg: T.warning, avatarText: T.navy,    name: 'Sécurité Plus',        specialty: 'Gardiennage',            specialtyColor: T.warning, tarif: '800 DH/j',   mission: null,                       jours: 10, coutMTD: '8,000 DH',  rating: 3, status: 'disponible' },
  { id: 6, initials: 'EM', avatarBg: T.cyan,    avatarText: T.navy,    name: 'Électricité MB',       specialty: 'Électricité industrielle', specialtyColor: T.cyan,  tarif: '2,500 DH/j', mission: null,                       jours: 1,  coutMTD: '2,500 DH',  rating: 4, status: 'disponible' },
];

const MISSIONS = [
  { id: 'MST-2024-012', contractor: 'Atlas Pompage', client: 'ONCF — Rabat Gare',        debut: '12 Fév', fin: '28 Fév', joursActuel: 8, joursTotal: 12, coutEstime: '42,000 DH', tarif: '3,500', total: 12, progress: 67, initials: 'AP', avatarBg: T.gold,    avatarText: T.navy },
  { id: 'MST-2024-011', contractor: 'Transport Express', client: 'Jet Contractors — Tanger', debut: '15 Fév', fin: '22 Fév', joursActuel: 5, joursTotal: 6,  coutEstime: '16,800 DH', tarif: '2,800', total: 6,  progress: 83, initials: 'TE', avatarBg: T.info,    avatarText: '#fff' },
  { id: 'MST-2024-010', contractor: 'Grue Maroc', client: 'Addoha — Casa Sidi Moumen', debut: '17 Fév', fin: '25 Fév', joursActuel: 4, joursTotal: 7,  coutEstime: '35,000 DH', tarif: '5,000', total: 7,  progress: 57, initials: 'GM', avatarBg: T.success, avatarText: '#fff' },
];

const COST_DONUT = [
  { name: 'Atlas Pompage',    value: 28,  color: T.gold    },
  { name: 'Grue Maroc',       value: 20,  color: T.success },
  { name: 'Transport Express',value: 14,  color: T.info    },
  { name: 'Sécurité Plus',    value: 8,   color: T.warning },
  { name: 'Nettoyage Pro',    value: 7.2, color: T.purple  },
  { name: 'Électricité MB',   value: 2.5, color: T.cyan    },
];

const TREND_DATA = [
  { month: 'Sep', cout: 52 },
  { month: 'Oct', cout: 65 },
  { month: 'Nov', cout: 58 },
  { month: 'Déc', cout: 72 },
  { month: 'Jan', cout: 68 },
  { month: 'Fév', cout: 78 },
];

const RELIABILITY = [
  { name: 'LafargeHolcim', pct: 96 },
  { name: 'Carrière Atlas', pct: 92 },
  { name: 'Sika Maroc',     pct: 98 },
  { name: 'CIMAT',          pct: 88 },
  { name: 'Sablière Nord',  pct: 85 },
  { name: 'ONEE',           pct: 100 },
];

const HISTORY = [
  { id: 'MST-2024-009', contractor: 'Atlas Pompage',    client: 'Ciments du Maroc', duree: '10 j', cout: '35,000 DH', rating: 5, initials: 'AP', avatarBg: T.gold    },
  { id: 'MST-2024-008', contractor: 'Grue Maroc',       client: 'Tgcc',             duree: '5 j',  cout: '25,000 DH', rating: 5, initials: 'GM', avatarBg: T.success },
  { id: 'MST-2024-007', contractor: 'Transport Express',client: 'Alliances',        duree: '3 j',  cout: '8,400 DH',  rating: 4, initials: 'TE', avatarBg: T.info    },
  { id: 'MST-2024-006', contractor: 'Nettoyage Pro',    client: 'ONCF',             duree: '4 j',  cout: '4,800 DH',  rating: 4, initials: 'NP', avatarBg: T.purple  },
  { id: 'MST-2024-005', contractor: 'Sécurité Plus',    client: 'Addoha',           duree: '15 j', cout: '12,000 DH', rating: 3, initials: 'SP', avatarBg: T.warning },
  { id: 'MST-2024-004', contractor: 'Électricité MB',   client: 'Ciments du Maroc', duree: '2 j',  cout: '5,000 DH',  rating: 4, initials: 'EM', avatarBg: T.cyan    },
];

const UPCOMING = [
  { besoin: 'Pompage gros volume',    specialty: 'Pompage béton',    specialtyColor: T.gold,  chantier: 'ONCF — Kénitra',       date: '01 Mars', duree: '5 jours', budget: '17,500 DH', priority: 'Haute'   },
  { besoin: 'Installation électrique',specialty: 'Électricité',      specialtyColor: T.cyan,  chantier: 'Tgcc — Mohammedia',    date: '10 Mars', duree: '3 jours', budget: '7,500 DH',  priority: 'Normale' },
];

// ─────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────
function Stars({ rating, total = 5 }: { rating: number; total?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ color: i < rating ? T.gold : T.textDim, fontSize: 13 }}>★</span>
      ))}
    </span>
  );
}

function AvatarCircle({ initials, bg, textColor, size = 44 }: { initials: string; bg: string; textColor: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
      fontSize: size > 40 ? 13 : 11, color: textColor, flexShrink: 0,
    }}>{initials}</div>
  );
}

function SectionHeader({ title, badge, badgeColor = T.gold }: { title: string; badge?: string; badgeColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 4, height: 24, background: T.gold, borderRadius: 2, flexShrink: 0 }} />
      <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.textPri, margin: 0 }}>{title}</h2>
      {badge && (
        <span style={{
          background: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}44`,
          borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 600,
        }}>{badge}</span>
      )}
    </div>
  );
}

const cardStyle = (hovered: boolean): React.CSSProperties => ({
  background: T.cardBg,
  border: `1px solid ${hovered ? T.goldBorder : T.cardBorder}`,
  borderRadius: 12,
  padding: 20,
  transition: 'all 0.25s ease',
  transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
  boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${T.goldBorder}` : '0 2px 8px rgba(0,0,0,0.2)',
  cursor: 'pointer',
});

const DarkTooltip = ({ active, payload, label, suffix = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0D1829', border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: '8px 14px' }}>
      <div style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || T.gold, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 }}>
          {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// SECTION: KPI CARDS
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, delay }: {
  label: string; value: number; suffix?: string; color: string;
  icon: React.ElementType; trend: string; delay?: number;
}) {
  const [hov, setHov] = useState(false);
  const count = useAnimatedCounter(value, 1200);
  const vis = useFadeIn(delay ?? 0);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...cardStyle(hov),
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.5s ease, transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        borderLeft: `4px solid ${color}`,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ color: T.textDim, fontSize: 11, background: '#1E2D4A', padding: '3px 8px', borderRadius: 100 }}>{trend}</span>
      </div>
      <div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 800, color }}>
          {count}{suffix}
        </div>
        <div style={{ color: T.textSec, fontSize: 13, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION: CONTRACTOR ROW
// ─────────────────────────────────────────────────────
function ContractorRow({ c, delay }: { c: typeof CONTRACTORS[0]; delay: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  const isMission = c.status === 'mission';
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 10, padding: '14px 18px',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateX(4px)' : 'translateX(0)',
        boxShadow: hov ? `0 4px 20px rgba(0,0,0,0.3)` : 'none',
        opacity: vis ? 1 : 0,
        cursor: 'pointer',
      }}
    >
      <AvatarCircle initials={c.initials} bg={c.avatarBg} textColor={c.avatarText} />
      {/* Name + Specialty */}
      <div style={{ minWidth: 180 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>{c.name}</div>
        <span style={{
          background: `${c.specialtyColor}22`, color: c.specialtyColor,
          border: `1px solid ${c.specialtyColor}44`, borderRadius: 100,
          padding: '2px 8px', fontSize: 11, fontWeight: 600, marginTop: 4, display: 'inline-block',
        }}>{c.specialty}</span>
      </div>
      {/* Tarif */}
      <div style={{ minWidth: 110 }}>
        <div style={{ color: T.textDim, fontSize: 11 }}>Tarif/jour</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.gold, fontWeight: 700 }}>{c.tarif}</div>
      </div>
      {/* Mission */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ color: T.textDim, fontSize: 11 }}>Mission actuelle</div>
        {c.mission ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.info, fontSize: 13, fontWeight: 600 }}>
            <MapPin size={12} /> {c.mission}
          </div>
        ) : (
          <span style={{ color: T.textDim, fontSize: 13 }}>—</span>
        )}
      </div>
      {/* Jours */}
      <div style={{ minWidth: 70, textAlign: 'center' }}>
        <div style={{ color: T.textDim, fontSize: 11 }}>Jours</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: T.textPri, fontWeight: 700 }}>{c.jours} j</div>
      </div>
      {/* Coût MTD */}
      <div style={{ minWidth: 100, textAlign: 'right' }}>
        <div style={{ color: T.textDim, fontSize: 11 }}>Coût MTD</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: T.gold, fontWeight: 700 }}>{c.coutMTD}</div>
      </div>
      {/* Rating */}
      <div style={{ minWidth: 80, textAlign: 'center' }}>
        <Stars rating={c.rating} />
      </div>
      {/* Status */}
      <div style={{ minWidth: 110, textAlign: 'center' }}>
        {isMission ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: `${T.info}22`, color: T.info, border: `1px solid ${T.info}44`,
            borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 700,
            animation: 'tbos-pulse 2s infinite',
          }}>
            <Briefcase size={11} /> En mission
          </span>
        ) : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: `${T.success}22`, color: T.success, border: `1px solid ${T.success}44`,
            borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 700,
          }}>
            <CheckCircle size={11} /> Disponible
          </span>
        )}
      </div>
      {/* Arrow */}
      <ChevronRight size={16} color={T.textDim} style={{ transition: 'transform 0.2s', transform: hov ? 'translateX(4px)' : 'none' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION: MISSION CARD
// ─────────────────────────────────────────────────────
function MissionCard({ m, delay }: { m: typeof MISSIONS[0]; delay: number }) {
  const [hov, setHov] = useState(false);
  const [progW, setProgW] = useState(0);
  const vis = useFadeIn(delay);
  useEffect(() => {
    const t = setTimeout(() => setProgW(m.progress), delay + 400);
    return () => clearTimeout(t);
  }, [m.progress, delay]);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...cardStyle(hov),
        opacity: vis ? 1 : 0,
        background: `linear-gradient(145deg, #111B2E 0%, #162036 100%)`,
        borderLeft: `4px solid ${T.info}`,
        borderTop: `1px solid ${hov ? T.goldBorder : `${T.info}33`}`,
        borderRight: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderBottom: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        transition: 'all 0.25s ease',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Blue tint overlay */}
      <div style={{ position: 'absolute', inset: 0, background: `${T.info}08`, pointerEvents: 'none' }} />
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.textDim }}>{m.id}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: `${T.info}22`, color: T.info, border: `1px solid ${T.info}44`,
          borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700,
          animation: 'tbos-pulse 2s infinite',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.info, display: 'inline-block' }} />
          En cours
        </span>
      </div>
      {/* Contractor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <AvatarCircle initials={m.initials} bg={m.avatarBg} textColor={m.avatarText} size={36} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>{m.contractor}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textSec, fontSize: 13 }}>
            <MapPin size={11} /> {m.client}
          </div>
        </div>
      </div>
      {/* Dates */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textDim, fontSize: 12, marginBottom: 14 }}>
        <Calendar size={12} /> {m.debut} → {m.fin}
      </div>
      {/* Progress */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.textSec }}>
            Jour {m.joursActuel} sur {m.joursTotal}
          </span>
          <span style={{
            background: `${T.info}22`, color: T.info, borderRadius: 100,
            padding: '2px 8px', fontSize: 11, fontWeight: 700,
          }}>{m.progress}%</span>
        </div>
        <div style={{ height: 6, background: '#1E2D4A', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: `linear-gradient(90deg, ${T.info}, #60A5FA)`,
            borderRadius: 3, width: `${progW}%`, transition: 'width 1s cubic-bezier(0.25,0.8,0.25,1)',
          }} />
        </div>
      </div>
      {/* Cost */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: 16 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: T.gold, fontWeight: 800 }}>
          {m.coutEstime}
        </span>
        <span style={{ color: T.textDim, fontSize: 12 }}>
          Tarif: {m.tarif} DH/jour × {m.total} jours
        </span>
      </div>
      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: `1px solid ${T.gold}`, color: T.gold,
          borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <Eye size={14} /> Voir Détails
        </button>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: `1px solid ${T.info}`, color: T.info,
          borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <Clock size={14} /> Prolonger
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// CUSTOM DONUT CENTER
// ─────────────────────────────────────────────────────
function DonutCenter({ cx, cy }: { cx: number; cy: number }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-8" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 800, fill: T.gold }}>78K</tspan>
      <tspan x={cx} dy="22" style={{ fontSize: 12, fill: T.textSec }}>DH</tspan>
    </text>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassContractors() {
  const [activeTab, setActiveTab] = useState('Tous');
  const tabs = ['Tous', 'En Mission', 'Disponibles', 'Évaluation'];

  // KPI counters
  const actifs = useAnimatedCounter(6, 1000);
  const enMission = useAnimatedCounter(3, 1000);
  const coutMTD = useAnimatedCounter(78, 1200);
  const satisfaction = useAnimatedCounter(92, 1200);

  // Donut total
  const totalCost = COST_DONUT.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: T.textPri, paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ══════════════════════════ PAGE HEADER ══════════════════════════ */}
      <div style={{
        borderBottom: `1px solid ${T.cardBorder}`,
        padding: '20px 32px 0',
        marginBottom: 4,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 28, color: T.textPri, margin: 0, lineHeight: 1.2 }}>
              Sous-Traitants
            </h1>
            <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
              Gestion des sous-traitants et missions
            </p>
          </div>
          <button
            style={{
              background: T.gold, color: T.navy, border: 'none', borderRadius: 10,
              padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s ease',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Plus size={16} /> Nouveau Sous-Traitant
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 20px', fontSize: 14, fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? T.gold : T.textSec,
                borderBottom: `2px solid ${activeTab === tab ? T.gold : 'transparent'}`,
                transition: 'all 0.2s ease',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ══════════════════════════ SECTION 1: KPIs ══════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KPICard label="Sous-Traitants Actifs" value={6}  suffix=""  color={T.gold}    icon={Users}    trend="stable"           delay={0}   />
          <KPICard label="Missions en Cours"      value={3}  suffix=""  color={T.info}    icon={FileText} trend="+1 cette semaine"  delay={80}  />
          <KPICard label="Coût MTD"               value={78} suffix="K DH" color={T.warning} icon={Banknote} trend="+5% ↑"         delay={160} />
          <KPICard label="Taux de Satisfaction"   value={92} suffix="%"  color={T.success} icon={Heart}    trend="+2% ↑ vert"      delay={240} />
        </div>

        {/* ══════════════════════════ SECTION 2: CONTRACTOR LIST ══════════════════════════ */}
        <div>
          <SectionHeader title="Sous-Traitants" badge="6 actifs" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CONTRACTORS.map((c, i) => (
              <ContractorRow key={c.id} c={c} delay={i * 80} />
            ))}
          </div>
        </div>

        {/* ══════════════════════════ SECTION 3: ACTIVE MISSIONS ══════════════════════════ */}
        <div>
          <SectionHeader
            title="Missions en Cours"
            badge="3 actives"
            badgeColor={T.info}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {MISSIONS.map((m, i) => (
              <MissionCard key={m.id} m={m} delay={i * 100} />
            ))}
          </div>
        </div>

        {/* ══════════════════════════ SECTION 4: COST ANALYSIS ══════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: Donut */}
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 4, height: 20, background: T.gold, borderRadius: 2 }} />
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: T.textPri, margin: 0 }}>Répartition des Coûts</h3>
                </div>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: T.gold, fontWeight: 800 }}>78K DH</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={COST_DONUT}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  label={false}
                >
                  {COST_DONUT.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<DarkTooltip suffix="K DH" />} />
                {/* Center label via foreignObject workaround as text */}
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {COST_DONUT.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: 12, color: T.textSec }}>{d.name}</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.gold }}>{d.value}K DH</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Trend */}
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 4, height: 20, background: T.gold, borderRadius: 2 }} />
                <h3 style={{ fontWeight: 700, fontSize: 16, color: T.textPri, margin: 0 }}>Tendance Mensuelle</h3>
              </div>
              <span style={{
                background: `${T.warning}22`, color: T.warning, border: `1px solid ${T.warning}44`,
                borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700,
              }}>+50% depuis Sep</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={TREND_DATA} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.gold} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={T.cardBorder} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}K`} domain={[40, 90]} />
                <RechartsTooltip content={<DarkTooltip suffix="K DH" />} />
                <ReferenceLine y={65.5} stroke={T.textDim} strokeDasharray="4 4" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="cout" stroke={T.gold} strokeWidth={2.5} fill="url(#trendGrad)" dot={{ fill: T.gold, r: 4, strokeWidth: 0 }} animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ══════════════════════════ SECTION 5: PERFORMANCE ══════════════════════════ */}
        <div>
          <SectionHeader title="Performance des Sous-Traitants" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {/* Note Moyenne */}
            <PerformanceCard
              icon={Heart}
              iconColor={T.gold}
              value={4.2}
              suffix="/5"
              label="Note Moyenne"
              desc="Tous sous-traitants"
              showStars={4}
              delay={0}
            />
            {/* Respect Délais */}
            <PerformanceCard
              icon={Clock}
              iconColor={T.success}
              value={89}
              suffix="%"
              label="Respect des Délais"
              desc="Missions terminées à temps"
              delay={80}
            />
            {/* Renouvellement */}
            <PerformanceCard
              icon={RefreshCw}
              iconColor={T.success}
              value={83}
              suffix="%"
              label="Taux de Renouvellement"
              desc="Missions renouvelées"
              delay={160}
            />
          </div>
        </div>

        {/* ══════════════════════════ SECTION 6: MISSION HISTORY ══════════════════════════ */}
        <div>
          <SectionHeader title="Historique des Missions" badge="6 terminées" badgeColor={T.success} />
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
            {HISTORY.map((h, i) => (
              <HistoryRow key={h.id} h={h} delay={i * 60} last={i === HISTORY.length - 1} />
            ))}
          </div>
        </div>

        {/* ══════════════════════════ SECTION 7: UPCOMING NEEDS ══════════════════════════ */}
        <div>
          <SectionHeader title="Besoins à Venir" badge="2 demandes" badgeColor={T.info} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {UPCOMING.map((u, i) => (
              <UpcomingCard key={i} u={u} delay={i * 100} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PERFORMANCE CARD
// ─────────────────────────────────────────────────────
function PerformanceCard({ icon: Icon, iconColor, value, suffix, label, desc, showStars, delay }: {
  icon: React.ElementType; iconColor: string; value: number; suffix: string;
  label: string; desc: string; showStars?: number; delay: number;
}) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  const isDecimal = suffix === '/5';
  const count = useAnimatedCounter(isDecimal ? Math.round(value * 10) : Math.round(value), 1200);
  const displayVal = isDecimal ? (count / 10).toFixed(1) : count;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...cardStyle(hov),
        opacity: vis ? 1 : 0,
        transition: 'all 0.25s ease',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={iconColor} />
      </div>
      <div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 800, color: iconColor }}>{displayVal}{suffix}</div>
        {showStars !== undefined && (
          <div style={{ marginTop: 4 }}>
            <Stars rating={showStars} />
            <span style={{ color: T.textDim, fontSize: 11, marginLeft: 4 }}>+1 partielle</span>
          </div>
        )}
        <div style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginTop: 4 }}>{label}</div>
        <div style={{ fontSize: 12, color: T.textDim }}>{desc}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// HISTORY ROW
// ─────────────────────────────────────────────────────
function HistoryRow({ h, delay, last }: { h: typeof HISTORY[0]; delay: number; last: boolean }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 18px',
        borderBottom: last ? 'none' : `1px solid ${T.cardBorder}`,
        borderLeft: `4px solid ${T.success}`,
        background: hov ? 'rgba(16,185,129,0.04)' : 'transparent',
        opacity: vis ? 1 : 0,
        transform: hov ? 'translateX(4px)' : 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <AvatarCircle initials={h.initials} bg={h.avatarBg} textColor={h.avatarBg === T.gold || h.avatarBg === T.warning ? T.navy : '#fff'} size={34} />
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.textDim, minWidth: 120 }}>{h.id}</span>
      <span style={{ fontWeight: 600, fontSize: 13, color: T.textPri, minWidth: 150 }}>{h.contractor}</span>
      <span style={{ fontSize: 13, color: T.textSec, flex: 1 }}>{h.client}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.textSec, minWidth: 50 }}>{h.duree}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: T.gold, fontWeight: 700, minWidth: 110, textAlign: 'right' }}>{h.cout}</span>
      <Stars rating={h.rating} />
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: `${T.success}22`, color: T.success, border: `1px solid ${T.success}44`,
        borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700,
      }}>
        <CheckCircle size={11} /> Terminé
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// UPCOMING CARD
// ─────────────────────────────────────────────────────
function UpcomingCard({ u, delay }: { u: typeof UPCOMING[0]; delay: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  const isHaute = u.priority === 'Haute';
  const barColor = isHaute ? T.danger : T.info;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...cardStyle(hov),
        opacity: vis ? 1 : 0,
        borderLeft: `4px solid ${barColor}`,
        transition: 'all 0.25s ease',
      }}
    >
      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.textPri }}>{u.besoin}</div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: `${barColor}22`, color: barColor, border: `1px solid ${barColor}44`,
          borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700,
          animation: isHaute ? 'tbos-pulse 2s infinite' : 'none',
        }}>
          {u.priority}
        </span>
      </div>
      {/* Specialty badge */}
      <span style={{
        background: `${u.specialtyColor}22`, color: u.specialtyColor,
        border: `1px solid ${u.specialtyColor}44`, borderRadius: 100,
        padding: '2px 10px', fontSize: 11, fontWeight: 600, display: 'inline-block', marginBottom: 12,
      }}>{u.specialty}</span>
      {/* Details */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
        <div>
          <div style={{ color: T.textDim, fontSize: 11 }}>Chantier</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textSec, fontSize: 13 }}>
            <MapPin size={11} /> {u.chantier}
          </div>
        </div>
        <div>
          <div style={{ color: T.textDim, fontSize: 11 }}>Date requise</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: isHaute ? T.danger : T.info, fontWeight: 700 }}>{u.date}</div>
        </div>
        <div>
          <div style={{ color: T.textDim, fontSize: 11 }}>Durée / Budget</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.gold }}>{u.duree} — {u.budget}</div>
        </div>
      </div>
      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: T.gold, color: T.navy, border: 'none',
          borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <UserPlus size={14} /> Assigner
        </button>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: `1px solid ${T.gold}`, color: T.gold,
          borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <FileText size={14} /> Créer Appel d'Offres
        </button>
      </div>
    </div>
  );
}
