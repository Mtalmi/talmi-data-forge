import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip, ReferenceLine,
} from 'recharts';
import {
  Settings, Calendar, CheckCircle, Banknote, Clock,
  Droplets, Package, Zap, ArrowRightLeft, Factory,
  MapPin, RefreshCw, AlertTriangle, Shield, TrendingDown,
  Eye, Plus, ChevronRight, Wrench,
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
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return v;
}

function useProgressBar(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [target, duration]);
  return value;
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const EQUIPMENT = [
  { id: 1, name: 'Centrale 1',   type: 'Production',  typeColor: T.gold,    Icon: Factory,       iconColor: T.gold,    status: 'ok',   uptime: 98.5, heures: '2,450 h', derniere: '15 Fév', prochaine: '15 Mars', health: 'Excellent', healthColor: T.success, daysUntil: 23 },
  { id: 2, name: 'Malaxeur A',   type: 'Production',  typeColor: T.gold,    Icon: Settings,      iconColor: T.info,    status: 'ok',   uptime: 97.2, heures: '1,890 h', derniere: '12 Fév', prochaine: '12 Mars', health: 'Bon',       healthColor: T.info,    daysUntil: 20 },
  { id: 3, name: 'Pompe BP-01',  type: 'Pompage',     typeColor: T.info,    Icon: Droplets,      iconColor: T.warning, status: 'maint',uptime: 89.1, heures: '3,200 h', derniere: "Auj.", prochaine: '20 Mars', health: 'Attention', healthColor: T.warning, daysUntil: 28 },
  { id: 4, name: 'Convoyeur C',  type: 'Transport',   typeColor: T.success, Icon: ArrowRightLeft, iconColor: T.success, status: 'ok',   uptime: 99.0, heures: '980 h',   derniere: '18 Fév', prochaine: '18 Mars', health: 'Excellent', healthColor: T.success, daysUntil: 26 },
  { id: 5, name: 'Compresseur',  type: 'Utilitaire',  typeColor: T.purple,  Icon: Zap,           iconColor: T.purple,  status: 'ok',   uptime: 95.8, heures: '1,560 h', derniere: '10 Fév', prochaine: '10 Mars', health: 'Bon',       healthColor: T.info,    daysUntil: 18 },
  { id: 6, name: 'Silo Ciment',  type: 'Stockage',    typeColor: T.cyan,    Icon: Package,       iconColor: T.cyan,    status: 'ok',   uptime: 99.5, heures: '—',       derniere: '01 Fév', prochaine: '01 Mars', health: 'Excellent', healthColor: T.success, daysUntil: 9  },
];

const TIMELINE_DATA = [
  { name: 'Centrale 1',  elapsed: 70, remaining: 30, daysUntil: 23 },
  { name: 'Malaxeur A',  elapsed: 66, remaining: 34, daysUntil: 20 },
  { name: 'Pompe BP-01', elapsed: 60, remaining: 40, daysUntil: 28 },
  { name: 'Convoyeur C', elapsed: 69, remaining: 31, daysUntil: 26 },
  { name: 'Compresseur', elapsed: 60, remaining: 40, daysUntil: 18 },
  { name: 'Silo Ciment', elapsed: 91, remaining: 9,  daysUntil: 9  },
];

const UPTIME_DATA = [
  { name: 'Silo Ciment', uptime: 99.5, color: T.success },
  { name: 'Convoyeur C', uptime: 99.0, color: T.success },
  { name: 'Centrale 1',  uptime: 98.5, color: T.success },
  { name: 'Malaxeur A',  uptime: 97.2, color: T.success },
  { name: 'Compresseur', uptime: 95.8, color: T.warning },
  { name: 'Pompe BP-01', uptime: 89.1, color: T.danger  },
];

const COST_TREND = [
  { month: 'Sep', preventif: 12, correctif: 8  },
  { month: 'Oct', preventif: 14, correctif: 3  },
  { month: 'Nov', preventif: 11, correctif: 15 },
  { month: 'Déc', preventif: 15, correctif: 5  },
  { month: 'Jan', preventif: 13, correctif: 2  },
  { month: 'Fév', preventif: 16, correctif: 2  },
];

const HISTORY_ENTRIES = [
  { date: '18 Fév', equip: 'Convoyeur C',  Icon: ArrowRightLeft, type: 'Préventif', desc: 'Graissage roulements + tension courroie',           tech: 'Mohammed A.',      isExt: false, duree: '2h',    cout: '850 DH'   },
  { date: '15 Fév', equip: 'Centrale 1',   Icon: Factory,        type: 'Préventif', desc: 'Calibration capteurs + nettoyage',                 tech: 'Mohammed A.',      isExt: false, duree: '3h',    cout: '1,200 DH' },
  { date: '12 Fév', equip: 'Malaxeur A',   Icon: Settings,       type: 'Préventif', desc: 'Changement pales usées',                           tech: 'Ext. — TechServ',  isExt: true,  duree: '4h',    cout: '3,500 DH' },
  { date: '10 Fév', equip: 'Compresseur',  Icon: Zap,            type: 'Préventif', desc: 'Vidange + filtre air',                             tech: 'Mohammed A.',      isExt: false, duree: '1.5h',  cout: '680 DH'   },
  { date: '05 Fév', equip: 'Pompe BP-01',  Icon: Droplets,       type: 'Correctif', desc: 'Fuite joint — réparation urgente',                 tech: 'Mohammed A.',      isExt: false, duree: '5h',    cout: '4,200 DH' },
  { date: '01 Fév', equip: 'Silo Ciment',  Icon: Package,        type: 'Préventif', desc: 'Inspection + nettoyage',                           tech: 'Ext. — SiloTech',  isExt: true,  duree: '6h',    cout: '2,800 DH' },
  { date: '28 Jan', equip: 'Centrale 1',   Icon: Factory,        type: 'Correctif', desc: 'Capteur température HS — remplacement',            tech: 'Mohammed A.',      isExt: false, duree: '2h',    cout: '1,500 DH' },
  { date: '25 Jan', equip: 'Malaxeur A',   Icon: Settings,       type: 'Préventif', desc: 'Graissage + contrôle vibration',                   tech: 'Mohammed A.',      isExt: false, duree: '1.5h',  cout: '450 DH'   },
];

const SPARE_PARTS = [
  { name: 'Kit joints pompe',      ref: 'PMP-J-001', stock: 3, min: 2, prix: '2,800 DH', status: 'OK'      },
  { name: 'Filtre huile',          ref: 'FLT-H-010', stock: 8, min: 5, prix: '225 DH',   status: 'OK'      },
  { name: 'Huile hydraulique 20L', ref: 'HYD-020',   stock: 4, min: 3, prix: '1,200 DH', status: 'OK'      },
  { name: 'Pales malaxeur',        ref: 'MLX-P-005', stock: 1, min: 2, prix: '4,500 DH', status: 'Alerte'  },
  { name: 'Courroie convoyeur',    ref: 'CNV-C-003', stock: 2, min: 2, prix: '1,800 DH', status: 'Minimum' },
  { name: 'Capteur température',   ref: 'CPT-T-008', stock: 0, min: 1, prix: '1,500 DH', status: 'Rupture' },
];

const CHECKLIST = [
  { label: 'Diagnostic initial',   done: true  },
  { label: 'Démontage pompe',      done: true  },
  { label: 'Remplacement joints',  done: true  },
  { label: 'Remontage',           done: false },
  { label: 'Test fonctionnel',    done: false },
];

// ─────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────
function SectionHeader({ title, badge, badge2, badgeColor = T.gold, badge2Color = T.warning, icon: Icon }:
  { title: string; badge?: string; badge2?: string; badgeColor?: string; badge2Color?: string; icon?: React.ElementType }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 4, height: 24, background: T.gold, borderRadius: 2, flexShrink: 0 }} />
      {Icon && <Icon size={18} color={T.gold} />}
      <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.textPri, margin: 0 }}>{title}</h2>
      {badge && (
        <span style={{ background: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}44`, borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{badge}</span>
      )}
      {badge2 && (
        <span style={{ background: `${badge2Color}22`, color: badge2Color, border: `1px solid ${badge2Color}44`, borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{badge2}</span>
      )}
    </div>
  );
}

const cardStyle = (hov: boolean): React.CSSProperties => ({
  background: T.cardBg,
  border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
  borderRadius: 12,
  padding: 20,
  transition: 'all 0.25s ease',
  transform: hov ? 'translateY(-3px)' : 'translateY(0)',
  boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${T.goldBorder}` : '0 2px 8px rgba(0,0,0,0.2)',
  cursor: 'pointer',
});

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0D1829', border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: '8px 14px' }}>
      <div style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || T.gold, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// SECTION 1: KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix = '', color, icon: Icon, trend, delay = 0, isDecimal = false }: {
  label: string; value: number; suffix?: string; color: string; icon: React.ElementType; trend: string; delay?: number; isDecimal?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const count = useAnimatedCounter(isDecimal ? value : Math.round(value), 1200);
  const vis = useFadeIn(delay);
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
// SECTION 2: EQUIPMENT CARD
// ─────────────────────────────────────────────────────
function EquipmentCard({ eq, delay }: { eq: typeof EQUIPMENT[0]; delay: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  const uptime = useProgressBar(eq.uptime, 1200);
  const isMaint = eq.status === 'maint';
  const uptimeColor = eq.uptime >= 95 ? T.success : eq.uptime >= 90 ? T.warning : T.danger;
  const uptimeCount = useAnimatedCounter(Math.round(eq.uptime * 10), 1200);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...cardStyle(hov),
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.5s ease, transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        borderLeft: `4px solid ${isMaint ? T.warning : T.cardBorder}`,
        background: isMaint ? 'linear-gradient(145deg, #1a1700 0%, #1a1b00 100%)' : T.cardBg,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}
    >
      {/* Top: icon + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${eq.iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <eq.Icon size={22} color={eq.iconColor} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {isMaint ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${T.warning}22`, color: T.warning, border: `1px solid ${T.warning}44`, borderRadius: 100, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: T.warning, animation: 'pulse 1.5s infinite' }} />
              <Settings size={10} /> En maintenance
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${T.success}22`, color: T.success, border: `1px solid ${T.success}44`, borderRadius: 100, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
              <CheckCircle size={10} /> Opérationnel
            </span>
          )}
          {/* Health dot */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: eq.healthColor }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: eq.healthColor, animation: isMaint ? 'pulse 1.5s infinite' : 'none' }} />
            {eq.health}
          </span>
        </div>
      </div>

      {/* Name + type badge */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: T.textPri }}>{eq.name}</div>
        <span style={{ background: `${eq.typeColor}22`, color: eq.typeColor, border: `1px solid ${eq.typeColor}44`, borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginTop: 4, display: 'inline-block' }}>{eq.type}</span>
      </div>

      {/* Uptime bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: T.textDim }}>Disponibilité</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800, color: uptimeColor }}>{(uptimeCount / 10).toFixed(1)}%</span>
        </div>
        <div style={{ height: 6, background: '#1E2D4A', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${uptime}%`, background: uptimeColor, borderRadius: 3, transition: 'width 1.2s ease' }} />
        </div>
      </div>

      {/* Hours + dates */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textDim }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={10} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{eq.heures}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Dern.: {eq.derniere}</div>
          <div style={{ color: eq.daysUntil < 7 ? T.warning : T.textDim }}>Proch.: {eq.prochaine}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION 3: TIMELINE BAR CHART
// ─────────────────────────────────────────────────────
function TimelineChart() {
  const [hov, setHov] = useState(false);
  const TimelineTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entry = TIMELINE_DATA.find(d => d.name === label);
    return (
      <div style={{ background: '#0D1829', border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: '8px 14px' }}>
        <div style={{ color: T.textPri, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div style={{ color: T.textDim, fontSize: 11 }}>Prochaine dans: <span style={{ color: entry && entry.daysUntil < 10 ? T.danger : entry && entry.daysUntil < 20 ? T.warning : T.success, fontFamily: "'JetBrains Mono', monospace" }}>{entry?.daysUntil}j</span></div>
      </div>
    );
  };

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ ...cardStyle(hov), marginTop: 0 }}>
      <SectionHeader title="Timeline Maintenance" icon={Calendar} />
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={TIMELINE_DATA} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: T.textDim, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fill: T.textSec, fontSize: 12 }} tickLine={false} axisLine={false} width={90} />
            <RechartsTooltip content={<TimelineTooltip />} cursor={{ fill: 'rgba(255,215,0,0.04)' }} />
            <Bar dataKey="elapsed" stackId="a" fill={T.gold} radius={[0, 0, 0, 0]} name="Écoulé" />
            <Bar dataKey="remaining" stackId="a" radius={[0, 4, 4, 0]} name="Restant"
              fill="transparent"
              label={({ x, y, width, height, index }: any) => {
                const entry = TIMELINE_DATA[index];
                const color = entry.daysUntil < 10 ? T.danger : entry.daysUntil < 20 ? T.warning : T.success;
                return (
                  <text x={x + width + 6} y={y + height / 2 + 4} fill={color} fontSize={11} fontFamily="'JetBrains Mono', monospace" fontWeight={700}>
                    {entry.daysUntil}j
                  </text>
                );
              }}
            >
              {TIMELINE_DATA.map((entry, idx) => {
                const color = entry.daysUntil < 10 ? T.danger : entry.daysUntil < 20 ? T.warning : T.success;
                return <Cell key={idx} fill={`${color}44`} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        {[{ color: T.success, label: '>20 j restants' }, { color: T.warning, label: '10-20 j restants' }, { color: T.danger, label: '<10 j — urgent' }].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSec }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
            {item.label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSec }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: T.gold }} />
          Temps écoulé
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION 4: CURRENT MAINTENANCE CARD
// ─────────────────────────────────────────────────────
function CurrentMaintenanceCard() {
  const [hov, setHov] = useState(false);
  const progress = useProgressBar(65, 1200);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'linear-gradient(145deg, #1a1500 0%, #1a1700 100%)',
        border: `1px solid ${hov ? T.warning : T.warning + '66'}`,
        borderLeft: `4px solid ${T.warning}`,
        borderRadius: 12, padding: 24,
        transition: 'all 0.25s ease',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${T.warning}44` : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 4, height: 24, background: T.warning, borderRadius: 2 }} />
          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: T.textPri, margin: 0 }}>Maintenance en Cours</h3>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${T.warning}22`, color: T.warning, border: `1px solid ${T.warning}44`, borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: T.warning, animation: 'pulse 1.5s infinite' }} />
          En cours
        </span>
      </div>

      {/* Equipment name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: `${T.warning}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Droplets size={20} color={T.warning} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 18, color: T.textPri }}>Pompe BP-01</span>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: T.textDim, marginBottom: 2 }}>Type d'intervention</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>Révision complète + remplacement joints</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.textDim, marginBottom: 2 }}>Technicien</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.textSec }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${T.info}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, color: T.info, fontWeight: 700 }}>MA</span>
              </div>
              Mohammed Alami — Technicien Senior
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: T.textDim }}>Début</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.textPri }}>20 Fév 08:00</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.textDim }}>Durée estimée</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.textPri }}>4 heures</div>
            </div>
          </div>
          {/* Parts */}
          <div>
            <div style={{ fontSize: 10, color: T.textDim, marginBottom: 6 }}>Pièces utilisées</div>
            {[
              'Kit joints pompe × 1 — 2,800 DH',
              'Filtre huile × 2 — 450 DH',
              'Huile hydraulique 20L × 1 — 1,200 DH',
            ].map((part, i) => (
              <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.textDim, marginBottom: 2 }}>• {part}</div>
            ))}
          </div>
        </div>

        {/* Right: Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {/* Circular-ish progress using progress bar */}
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#1E2D4A" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={T.warning} strokeWidth="10"
                strokeDasharray={`${(progress / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1.2s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 800, color: T.gold }}>{Math.round(progress)}%</div>
              <div style={{ fontSize: 9, color: T.textDim }}>complété</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.textDim, textAlign: 'center' }}>Fin estimée</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.success, textAlign: 'center', fontWeight: 700 }}>12:00 aujourd'hui</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.textDim, textAlign: 'center' }}>Coût actuel</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: T.gold, fontWeight: 800, textAlign: 'center' }}>4,450 DH</div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8 }}>Progression</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CHECKLIST.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {item.done ? (
                <CheckCircle size={14} color={T.success} />
              ) : (
                <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${T.textDim}` }} />
              )}
              <span style={{
                fontSize: 13,
                color: item.done ? T.textSec : T.textDim,
                textDecoration: item.done ? 'line-through' : 'none',
              }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Mettre à Jour', Icon: RefreshCw, bg: T.gold, textColor: T.navy },
          { label: 'Terminer',      Icon: CheckCircle, bg: T.success, textColor: '#fff' },
          { label: 'Signaler Problème', Icon: AlertTriangle, bg: 'transparent', textColor: T.danger, border: `1px solid ${T.danger}` },
        ].map(btn => (
          <button key={btn.label} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            background: btn.bg, color: btn.textColor, border: btn.border ?? 'none',
            borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer',
            transition: 'all 0.2s', outline: 'none',
          }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            <btn.Icon size={13} /> {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION 5: UPTIME BAR CHART
// ─────────────────────────────────────────────────────
function UptimeChart() {
  const [hov, setHov] = useState(false);
  const UptimeTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    const color = val >= 97 ? T.success : val >= 93 ? T.warning : T.danger;
    return (
      <div style={{ background: '#0D1829', border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: '8px 14px' }}>
        <div style={{ color: T.textPri, fontSize: 13, fontWeight: 700 }}>{label}</div>
        <div style={{ color, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700 }}>{val}%</div>
      </div>
    );
  };

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ ...cardStyle(hov) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: T.textPri }}>Disponibilité</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: T.gold }}>96.5% moy.</div>
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={UPTIME_DATA} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" horizontal={false} />
            <XAxis type="number" domain={[85, 100]} tick={{ fill: T.textDim, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} tickLine={false} axisLine={false} width={88} />
            <RechartsTooltip content={<UptimeTooltip />} cursor={{ fill: 'rgba(255,215,0,0.04)' }} />
            <Bar dataKey="uptime" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: T.textSec, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", formatter: (v: number) => `${v}%` }}>
              {UPTIME_DATA.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {[{ color: T.success, label: '>97% OK' }, { color: T.warning, label: '93-97% Attention' }, { color: T.danger, label: '<93% Critique' }].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textSec }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION 5: COST TREND CHART
// ─────────────────────────────────────────────────────
function CostTrendChart() {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ ...cardStyle(hov) }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: T.textPri }}>Coûts Maintenance</div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>Préventif vs Correctif</div>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={COST_TREND} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPreventif" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.gold} stopOpacity={0.3} />
                <stop offset="95%" stopColor={T.gold} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradCorrectif" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.danger} stopOpacity={0.3} />
                <stop offset="95%" stopColor={T.danger} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
            <XAxis dataKey="month" tick={{ fill: T.textDim, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: T.textDim, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}K`} />
            <RechartsTooltip content={<DarkTooltip />} cursor={{ stroke: T.goldBorder }} />
            <Area type="monotone" dataKey="preventif" name="Préventif" stroke={T.gold} strokeWidth={2} fill="url(#gradPreventif)" dot={false} animationDuration={1200} />
            <Area type="monotone" dataKey="correctif" name="Correctif" stroke={T.danger} strokeWidth={2} fill="url(#gradCorrectif)" dot={false} animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Insight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 12px', background: `${T.success}11`, border: `1px solid ${T.success}33`, borderRadius: 8 }}>
        <TrendingDown size={14} color={T.success} />
        <span style={{ fontSize: 12, color: T.success, fontWeight: 600 }}>Correctif ↓ 75% depuis Nov grâce à la maintenance préventive</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textSec }}>
          <div style={{ width: 14, height: 2, background: T.gold, borderRadius: 1 }} />Préventif
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textSec }}>
          <div style={{ width: 14, height: 2, background: T.danger, borderRadius: 1 }} />Correctif
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION 6: HISTORY ROW
// ─────────────────────────────────────────────────────
function HistoryRow({ entry, delay }: { entry: typeof HISTORY_ENTRIES[0]; delay: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  const isPrev = entry.type === 'Préventif';
  const barColor = isPrev ? T.success : T.danger;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: hov ? '#162036' : '#111B2E',
        borderLeft: `4px solid ${barColor}`,
        border: `1px solid ${hov ? T.cardBorder : '#1a2540'}`,
        borderRadius: 8, padding: '12px 16px',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateX(4px)' : 'translateX(0)',
        opacity: vis ? 1 : 0,
        cursor: 'pointer',
      }}
    >
      {/* Date */}
      <div style={{ minWidth: 52, fontSize: 11, color: T.textDim }}>{entry.date}</div>
      {/* Equipment */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1E2D4A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <entry.Icon size={12} color={T.textSec} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{entry.equip}</span>
      </div>
      {/* Type badge */}
      <div style={{ minWidth: 90 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${barColor}22`, color: barColor, border: `1px solid ${barColor}44`, borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700, width: 'fit-content' }}>
          {isPrev ? <Shield size={9} /> : <AlertTriangle size={9} />}
          {entry.type}
        </span>
      </div>
      {/* Description */}
      <div style={{ flex: 1, fontSize: 12, color: T.textSec, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={entry.desc}>{entry.desc}</div>
      {/* Technicien */}
      <div style={{ minWidth: 130, fontSize: 11, color: entry.isExt ? T.info : T.textDim }}>{entry.tech}</div>
      {/* Durée */}
      <div style={{ minWidth: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.textSec }}>{entry.duree}</div>
      {/* Coût */}
      <div style={{ minWidth: 80, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.gold, fontWeight: 700, textAlign: 'right' }}>{entry.cout}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION 7: SPARE PARTS ROW
// ─────────────────────────────────────────────────────
function SparePartRow({ part, delay }: { part: typeof SPARE_PARTS[0]; delay: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  const isOk = part.status === 'OK';
  const isAlerte = part.status === 'Alerte' || part.status === 'Minimum';
  const isRupture = part.status === 'Rupture';
  const barColor = isOk ? T.success : isAlerte ? T.warning : T.danger;
  const stockColor = part.stock > part.min ? T.success : part.stock === part.min ? T.warning : T.danger;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: hov ? '#162036' : '#111B2E',
        borderLeft: `4px solid ${barColor}`,
        border: `1px solid ${hov ? T.cardBorder : '#1a2540'}`,
        borderRadius: 8, padding: '12px 16px',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateX(4px)' : 'translateX(0)',
        opacity: vis ? 1 : 0,
        cursor: 'pointer',
      }}
    >
      {/* Name */}
      <div style={{ flex: 1, fontWeight: 700, fontSize: 13, color: T.textPri }}>{part.name}</div>
      {/* Ref */}
      <div style={{ minWidth: 90, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.textDim }}>{part.ref}</div>
      {/* Stock */}
      <div style={{ minWidth: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: T.textDim }}>En stock</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 800, color: stockColor }}>{part.stock}</div>
      </div>
      {/* Min */}
      <div style={{ minWidth: 50, textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: T.textDim }}>Min.</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.textDim }}>{part.min}</div>
      </div>
      {/* Prix */}
      <div style={{ minWidth: 80 }}>
        <div style={{ fontSize: 9, color: T.textDim }}>Prix unit.</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.gold }}>{part.prix}</div>
      </div>
      {/* Status badge */}
      <div style={{ minWidth: 90 }}>
        {isOk && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${T.success}22`, color: T.success, border: `1px solid ${T.success}44`, borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700, width: 'fit-content' }}>
            <CheckCircle size={9} /> OK
          </span>
        )}
        {isAlerte && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${T.warning}22`, color: T.warning, border: `1px solid ${T.warning}44`, borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700, width: 'fit-content' }}>
            <AlertTriangle size={9} /> {part.status}
          </span>
        )}
        {isRupture && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${T.danger}22`, color: T.danger, border: `1px solid ${T.danger}44`, borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700, width: 'fit-content', animation: 'pulse 1.5s infinite' }}>
            <AlertTriangle size={9} /> Rupture
          </span>
        )}
      </div>
      {/* Commander button */}
      {(isAlerte || isRupture) && (
        <button style={{
          background: isRupture ? T.danger : T.gold,
          color: isRupture ? '#fff' : T.navy,
          border: 'none', borderRadius: 6, padding: '5px 10px',
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.96)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          Commander
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION 8: METRICS CARD
// ─────────────────────────────────────────────────────
function MetricsCard({ label, value, valueSuffix = '', color, icon: Icon, desc, progressVal, delay = 0 }: {
  label: string; value: number; valueSuffix?: string; color: string; icon: React.ElementType; desc: string; progressVal?: number; delay?: number;
}) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  const count = useAnimatedCounter(Math.round(value * 10), 1200);
  const progress = useProgressBar(progressVal ?? 0, 1400);

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
      </div>
      <div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 800, color }}>
          {label === 'MTBF' ? count : label === 'MTTR' ? (count / 10).toFixed(1) : '6:2'}{valueSuffix}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginTop: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{desc}</div>
      </div>
      {progressVal !== undefined && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: T.textDim }}>75% préventif</span>
          </div>
          <div style={{ height: 6, background: '#1E2D4A', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: T.success, borderRadius: 3, transition: 'width 1.4s ease' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────
const TABS = ['Équipements', 'Planification', 'Historique', 'Pièces'];

export default function WorldClassMaintenance() {
  const [activeTab, setActiveTab] = useState('Équipements');

  return (
    <div style={{ background: T.navy, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700;800&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0B1120; }
        ::-webkit-scrollbar-thumb { background: #FFD700; border-radius: 3px; }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11,17,32,0.95)', backdropFilter: 'blur(16px)', borderBottom: `1px solid #1E2D4A`, padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.textPri, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wrench size={20} color={T.gold} /> Maintenance
            </h1>
            <p style={{ color: T.textDim, fontSize: 13, margin: '2px 0 0 0' }}>Gestion des équipements et maintenance préventive</p>
          </div>
          {/* Tabs + Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#111B2E', borderRadius: 10, padding: 4, border: `1px solid #1E2D4A` }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: activeTab === tab ? T.gold : 'transparent',
                    color: activeTab === tab ? T.navy : T.textSec,
                    transition: 'all 0.2s',
                  }}>
                  {tab}
                </button>
              ))}
            </div>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: T.gold, color: T.navy, border: 'none', borderRadius: 9, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FFE033'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.gold; }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <Plus size={14} /> Nouvelle Intervention
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '28px 24px', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── SECTION 1: KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KPICard label="Équipements" value={12} color={T.gold}    icon={Settings}     trend="tous référencés"          delay={0}   />
          <KPICard label="Maintenance Planifiée" value={3} color={T.warning} icon={Calendar}     trend="cette semaine"   delay={80}  />
          <KPICard label="En Panne" value={0} color={T.success} icon={CheckCircle}  trend="0 depuis 15 jours ✓"  delay={160} />
          <KPICard label="Coût MTD" value={18} suffix="K DH" color={T.gold} icon={Banknote}  trend="-12% ↓ vs mois dernier" delay={240} />
        </div>

        {/* ── SECTION 2: EQUIPMENT STATUS ── */}
        <div>
          <SectionHeader title="État des Équipements" badge="11 opérationnels" badge2="1 en maintenance" badgeColor={T.success} badge2Color={T.warning} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {EQUIPMENT.map((eq, i) => (
              <EquipmentCard key={eq.id} eq={eq} delay={i * 100} />
            ))}
          </div>
        </div>

        {/* ── SECTION 3: TIMELINE ── */}
        <TimelineChart />

        {/* ── SECTION 4: CURRENT MAINTENANCE ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 4, height: 24, background: T.warning, borderRadius: 2, flexShrink: 0 }} />
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.textPri, margin: 0 }}>Maintenance Actuelle</h2>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${T.warning}22`, color: T.warning, border: `1px solid ${T.warning}44`, borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.warning, display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              1 active
            </span>
          </div>
          <CurrentMaintenanceCard />
        </div>

        {/* ── SECTION 5: HEALTH OVERVIEW (2-col) ── */}
        <div>
          <SectionHeader title="Santé des Équipements" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <UptimeChart />
            <CostTrendChart />
          </div>
        </div>

        {/* ── SECTION 6: HISTORY ── */}
        <div>
          <SectionHeader title="Historique Maintenance" badge="8 interventions" badgeColor={T.textSec} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {HISTORY_ENTRIES.map((entry, i) => (
              <HistoryRow key={i} entry={entry} delay={i * 50} />
            ))}
          </div>
        </div>

        {/* ── SECTION 7: SPARE PARTS ── */}
        <div>
          <SectionHeader title="Stock Pièces de Rechange" icon={Package} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SPARE_PARTS.map((part, i) => (
              <SparePartRow key={i} part={part} delay={i * 60} />
            ))}
          </div>
        </div>

        {/* ── SECTION 8: METRICS ── */}
        <div>
          <SectionHeader title="Métriques Maintenance" badge="KPIs clés" badgeColor={T.gold} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <MetricsCard label="MTBF" value={342} valueSuffix=" h" color={T.gold}    icon={Clock}      desc="Temps moyen entre pannes"     delay={0}   />
            <MetricsCard label="MTTR" value={3.2} valueSuffix=" h" color={T.success} icon={Zap}        desc="Temps moyen de réparation"   delay={80}  />
            <MetricsCard label="Ratio Prév./Corr." value={0} valueSuffix=""   color={T.success} icon={Shield}     desc="75% préventif ✓"              delay={160} progressVal={75} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Cell import for recharts
// ─────────────────────────────────────────────────────
import { Cell } from 'recharts';
