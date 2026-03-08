import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  Users, Banknote, Heart, FileText, CheckCircle, Clock,
  MapPin, Calendar, ChevronRight, Briefcase, Eye,
  RefreshCw, UserPlus, Award, Plus, Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

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
// LIVE DATA HOOK
// ─────────────────────────────────────────────────────
function useContractorsLiveData() {
  const [kpis, setKpis] = useState({ actifs: 0, enMission: 0, coutMTD: 0, satisfaction: 0 });
  const [contractors, setContractors] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const { data: presta } = await supabase
        .from('prestataires_transport')
        .select('id, code_prestataire, nom, specialite, tarif_journalier, statut, note_service, mission_actuelle, jours_travailles, cout_mtd, actif');

      const rows = presta ?? [];
      setContractors(rows);
      if (rows.length) {
        const enMission = rows.filter((p: any) => p.statut === 'mission').length;
        const totalCout = rows.reduce((s: number, p: any) => s + (p.cout_mtd || 0), 0);
        const avgRating = rows.reduce((s: number, p: any) => s + (p.note_service || 0), 0) / rows.length;
        setKpis({
          actifs: rows.length,
          enMission,
          coutMTD: Math.round(totalCout / 1000),
          satisfaction: Math.round((avgRating / 5) * 100),
        });
      } else {
        setKpis({ actifs: 0, enMission: 0, coutMTD: 0, satisfaction: 0 });
      }
    } catch (err) { console.error('Contractors live data error:', err); }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('wc-contractors-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prestataires_transport' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  return { kpis, contractors };
}

// (Mock CONTRACTORS array removed — live data only)

const MISSIONS = [
  { id: 'MST-2024-012', contractor: 'Atlas Pompage', client: 'ONCF — Rabat Gare',        debut: '12 Fév', fin: '28 Fév', joursActuel: 8, joursTotal: 12, coutEstime: '42,000 DH', tarif: '3,500', total: 12, progress: 67, initials: 'AP', avatarBg: T.gold,    avatarText: T.navy },
  { id: 'MST-2024-011', contractor: 'Transport Express', client: 'Jet Contractors — Tanger', debut: '15 Fév', fin: '22 Fév', joursActuel: 5, joursTotal: 6,  coutEstime: '16,800 DH', tarif: '2,800', total: 6,  progress: 83, initials: 'TE', avatarBg: T.info,    avatarText: '#fff' },
  { id: 'MST-2024-010', contractor: 'Grue Maroc', client: 'Addoha — Casa Sidi Moumen', debut: '17 Fév', fin: '25 Fév', joursActuel: 4, joursTotal: 7,  coutEstime: '35,000 DH', tarif: '5,000', total: 7,  progress: 57, initials: 'GM', avatarBg: T.success, avatarText: '#fff' },
];

const COST_DONUT = [
  { name: 'Atlas Pompage',    value: 28,  color: '#D4A843' },
  { name: 'Grue Maroc',       value: 20,  color: '#B8860B' },
  { name: 'Transport Express',value: 14,  color: '#F5C842' },
  { name: 'Sécurité Plus',    value: 8,   color: '#A0732A' },
  { name: 'Nettoyage Pro',    value: 7.2, color: '#E8B84B' },
  { name: 'Électricité MB',   value: 2.5, color: '#8B6914' },
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
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color="#F59E0B" />
        </div>
        <span style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 500 }}>{trend}</span>
      </div>
      <div>
         <div>
           <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontWeight: 200, fontSize: '48px', letterSpacing: '-0.02em' }}>{count}</span>{suffix && <span style={{ fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>{suffix}</span>}
         </div>
         <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 6 }}>{label}</div>
       </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION: CONTRACTOR ROW
// ─────────────────────────────────────────────────────
const AVATAR_COLORS = [T.gold, T.info, T.success, T.warning, T.purple, T.cyan, T.orange, T.danger];

function ContractorRow({ c, delay, colorIndex, onClick }: { c: { id: string; code_prestataire: string; nom: string; specialite: string; tarif_journalier: number; statut: string; note_service: number; mission_actuelle: string | null; jours_travailles: number; cout_mtd: number; }; delay: number; colorIndex: number; onClick?: () => void }) {
   const [hov, setHov] = useState(false);
   const vis = useFadeIn(delay);
   const isMission = c.statut === 'mission';
   const tarifFormatted = c.tarif_journalier ? `${Number(c.tarif_journalier).toLocaleString('fr-FR')} DH/j` : '—';
   const coutMtdFormatted = c.cout_mtd != null ? `${Number(c.cout_mtd).toLocaleString('fr-FR')} DH` : '—';
   const avatarBg = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
   const avatarText = avatarBg === T.gold ? '#000' : '#fff';
   return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 10, padding: '16px 20px',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateX(4px)' : 'translateX(0)',
        boxShadow: hov ? `0 4px 20px rgba(0,0,0,0.3)` : 'none',
        opacity: vis ? 1 : 0,
        cursor: 'pointer',
      }}
    >
       <AvatarCircle initials={(c.code_prestataire || '??').slice(0, 2).toUpperCase()} bg={avatarBg} textColor={avatarText} />
       {/* Name + Specialty */}
       <div style={{ minWidth: 180 }}>
         <div style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>{c.nom || '—'}</div>
         <span style={{
           background: `${T.info}22`, color: T.info,
           border: `1px solid ${T.info}44`, borderRadius: 100,
           padding: '2px 8px', fontSize: 11, fontWeight: 600, marginTop: 4, display: 'inline-block',
         }}>{c.specialite || '—'}</span>
      </div>
      {/* Tarif */}
      <div style={{ minWidth: 110 }}>
        <div style={{ color: T.textDim, fontSize: 11 }}>Tarif/jour</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.gold, fontWeight: 700 }}>{tarifFormatted}</div>
      </div>
      {/* Mission */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ color: T.textDim, fontSize: 11 }}>Mission actuelle</div>
        {c.mission_actuelle ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.info, fontSize: 13, fontWeight: 600 }}>
            <MapPin size={12} /> {c.mission_actuelle}
          </div>
        ) : (
          <span style={{ color: T.textDim, fontSize: 13 }}>—</span>
        )}
      </div>
      {/* Jours */}
      <div style={{ minWidth: 70, textAlign: 'center' }}>
        <div style={{ color: T.textDim, fontSize: 11 }}>Jours</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: T.textPri, fontWeight: 700 }}>{c.jours_travailles ?? 0} j</div>
      </div>
      {/* Coût MTD */}
      <div style={{ minWidth: 100, textAlign: 'right' }}>
        <div style={{ color: T.textDim, fontSize: 11 }}>Coût MTD</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: T.gold, fontWeight: 700 }}>{coutMtdFormatted}</div>
      </div>
      {/* Rating */}
      <div style={{ minWidth: 80, textAlign: 'center' }}>
        <Stars rating={c.note_service ?? 0} />
      </div>
       {/* Risk Indicator */}
        <div style={{ minWidth: 40, textAlign: 'center' }}>
          {(() => {
            const getRiskDot = (contractor: any) => {
              if (contractor.statut === 'mission' && contractor.jours_travailles >= 7) {
                return { color: '#EF4444', label: 'Risque élevé' };
              }
              if (contractor.statut === 'mission' && contractor.jours_travailles >= 4) {
                return { color: '#F59E0B', label: 'À surveiller' };
              }
              return { color: '#10B981', label: 'Nominal' };
            };
            const dot = getRiskDot(c);
            return (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: dot.color,
                  margin: '0 auto',
                }}
                title={dot.label}
              />
            );
          })()}
        </div>
      {/* Status */}
      <div style={{ minWidth: 110, textAlign: 'center' }}>
         {isMission ? (
           <span style={{
             display: 'inline-flex', alignItems: 'center', gap: 5,
             background: `${T.gold}22`, color: T.gold, border: `1px solid ${T.gold}44`,
             borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 700,
             animation: 'tbos-pulse 2s infinite',
           }}>
             <Briefcase size={11} /> En Mission
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
function MissionCard({ m, delay, onViewDetails, onProlonger }: { m: typeof MISSIONS[0]; delay: number; onViewDetails?: () => void; onProlonger?: () => void }) {
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
      <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
        <button
          onClick={onViewDetails}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: `1px solid ${T.gold}`, color: T.gold,
            borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Eye size={14} /> Voir Détails
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onProlonger?.(); }}
          style={{
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
  const [activeTab, setActiveTab] = useState('tous');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [missionDrawer, setMissionDrawer] = useState<(typeof MISSIONS[0]) | null>(null);
  const [formData, setFormData] = useState({ nom: '', specialite: '', tarif_journalier: '', note_service: '', statut: 'disponible' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [terminatingMission, setTerminatingMission] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [editingContractorId, setEditingContractorId] = useState<string | null>(null);
  const [prolongerMission, setProlongerMission] = useState<any>(null);
  const [nouvelleFinDate, setNouvelleFinDate] = useState('');
  const [raisonProlongation, setRaisonProlongation] = useState('');
  const [prolongerLoading, setProlongerLoading] = useState(false);
  const [prolongerError, setProlongerError] = useState('');
  const [assignTarget, setAssignTarget] = useState<typeof UPCOMING[0] | null>(null);
  const [assignSelectedId, setAssignSelectedId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [appelOffresTarget, setAppelOffresTarget] = useState<typeof UPCOMING[0] | null>(null);
  const [appelOffresNotes, setAppelOffresNotes] = useState('');
  const [appelOffresSelectedIds, setAppelOffresSelectedIds] = useState<string[]>([]);
  const [appelOffresSubmitting, setAppelOffresSubmitting] = useState(false);

  const handleTermineMission = async (contractorName: string) => {
    setTerminatingMission(true);
    try {
      // Find the contractor by name in the live data
      const contractor = contractors.find((c: any) => 
        c.nom === contractorName || 
        c.nom?.toLowerCase().includes(contractorName.toLowerCase()) ||
        contractorName.toLowerCase().includes(c.nom?.toLowerCase())
      );
      if (!contractor) throw new Error('Sous-traitant introuvable');
      const { error } = await supabase.from('prestataires_transport').update({
        statut: 'disponible',
        mission_actuelle: null,
      }).eq('id', contractor.id);
      if (error) throw error;
      setMissionDrawer(null);
      toast({ title: 'Mission terminée' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setTerminatingMission(false);
    }
  };
  const tabConfig = [
    { id: 'tous', label: 'Tous' },
    { id: 'en_mission', label: 'En Mission' },
    { id: 'disponibles', label: 'Disponibles' },
    { id: 'evaluation', label: 'Évaluation' },
  ];
  const { kpis: cKpis, contractors } = useContractorsLiveData();

  // Filter contractors based on active tab
  const getFilteredContractors = () => {
    switch (activeTab) {
      case 'en_mission':
        return contractors.filter((c: any) => c.statut === 'mission');
      case 'disponibles':
        return contractors.filter((c: any) => c.statut === 'disponible');
      case 'evaluation':
        return contractors.filter((c: any) => c.note_service < 4);
      case 'tous':
      default:
        return contractors;
    }
  };
  const filteredContractors = getFilteredContractors();

  const handleCreateContractor = async () => {
    setFormError('');
    if (!formData.nom.trim()) { setFormError('Le nom est requis'); return; }
    setSubmitting(true);
    try {
      if (editingContractorId) {
        const { error } = await supabase.from('prestataires_transport').update({
          nom: formData.nom.trim(),
          specialite: formData.specialite.trim() || null,
          tarif_journalier: formData.tarif_journalier ? Number(formData.tarif_journalier) : null,
          note_service: formData.note_service ? Number(formData.note_service) : null,
          statut: formData.statut,
        }).eq('id', editingContractorId);
        if (error) throw error;
        toast({ title: 'Sous-traitant modifié avec succès' });
      } else {
        const code = 'ST-' + Date.now().toString(36).toUpperCase().slice(-6);
        const { error } = await supabase.from('prestataires_transport').insert({
          nom: formData.nom.trim(),
          code_prestataire: code,
          specialite: formData.specialite.trim() || null,
          tarif_journalier: formData.tarif_journalier ? Number(formData.tarif_journalier) : null,
          note_service: formData.note_service ? Number(formData.note_service) : null,
          statut: formData.statut,
          actif: true,
          tarif_base_m3: 0,
        });
        if (error) throw error;
        toast({ title: 'Sous-traitant créé avec succès' });
      }
      setDrawerOpen(false);
      setEditingContractorId(null);
      setFormData({ nom: '', specialite: '', tarif_journalier: '', note_service: '', statut: 'disponible' });
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic KPI calculations — derived from live Supabase data only
  const actifCount = contractors.filter((c: any) => c.actif === true).length;
  const missionsEnCours = contractors.filter((c: any) => c.statut === 'mission').length;
  const coutMTDTotal = contractors.reduce((s: number, c: any) => s + (c.cout_mtd || 0), 0);
  const coutMTDK = Math.round(coutMTDTotal / 1000);

  // Debug logs
  useEffect(() => {
    console.log('[WC-KPI] contractors.length =', actifCount, '| missionsEnCours =', missionsEnCours, '| coutMTDTotal =', coutMTDTotal, '| coutMTDK =', coutMTDK);
  }, [actifCount, missionsEnCours, coutMTDTotal, coutMTDK]);

  // Donut total
  const totalCost = COST_DONUT.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: T.textPri, paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <PageHeader
        icon={Briefcase}
        title="Sous-Traitants"
        subtitle="Gestion des sous-traitants et missions"
        tabs={tabConfig.map(t => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            onClick={() => { setEditingContractorId(null); setFormData({ nom: '', specialite: '', tarif_journalier: '', note_service: '', statut: 'disponible' }); setDrawerOpen(true); }}
            style={{
              background: T.gold, color: T.navy, border: 'none', borderRadius: 8,
              padding: '7px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'DM Sans, sans-serif',
            }}
          ><Plus size={14} /> Nouveau Sous-Traitant</button>
        }
      />



      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ══════════════════════════ AI INTELLIGENCE BANNER ══════════════════════════ */}
        <div style={{
          background: 'rgba(212, 168, 67, 0.08)',
          border: '1px solid rgba(212, 168, 67, 0.3)',
          borderLeft: '4px solid #D4A843',
          borderRadius: 8,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Zap size={16} color="#D4A843" strokeWidth={2.5} />
          <span style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 400 }}>
            3 missions actives · Atlas Pompage termine dans 4 jours · 2 sous-traitants disponibles correspondent aux besoins en attente
          </span>
        </div>

        {/* ══════════════════════════ SECTION 1: KPIs ══════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'stretch' }}>
          <KPICard label="Sous-Traitants Actifs" value={actifCount}       suffix=""     color={T.gold}    icon={Users}    trend="stable"           delay={0}   />
          <KPICard label="Missions en Cours"      value={missionsEnCours} suffix=""     color={T.info}    icon={FileText} trend="+1 cette semaine"  delay={80}  />
          <KPICard label="Coût MTD"               value={coutMTDK}       suffix="K DH" color={T.warning} icon={Banknote} trend="+5% ↑"            delay={160} />
          <KPICard label="Taux de Satisfaction"   value={cKpis.satisfaction} suffix="%"  color={T.success} icon={Heart}    trend="+2% ↑ vert"      delay={240} />
        </div>

        {/* ══════════════════════════ SECTION 2: CONTRACTOR LIST ══════════════════════════ */}
        <div>
          <SectionHeader title="Sous-Traitants" badge={`${filteredContractors.length} résultat${filteredContractors.length !== 1 ? 's' : ''}`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredContractors.map((c, i) => (
              <ContractorRow key={c.id} c={c} delay={i * 80} colorIndex={i} onClick={() => setSelectedContractor({ ...c, colorIndex: i })} />
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
             {MISSIONS.map((m, i) => {
               const liveContractor = contractors.find((c: any) => c.nom === m.contractor || m.contractor.toLowerCase().includes((c.nom || '').toLowerCase()));
               return (
                 <MissionCard key={m.id} m={m} delay={i * 100} onViewDetails={() => setMissionDrawer(m)} onProlonger={() => {
                   setProlongerMission({ ...m, id: liveContractor?.id, tarif_journalier: liveContractor?.tarif_journalier || Number((m.tarif || '0').replace(/[^0-9]/g, '')), date_fin: '2025-02-28', nom: m.contractor, mission_actuelle: m.client });
                   setNouvelleFinDate('');
                   setRaisonProlongation('');
                   setProlongerError('');
                 }} />
               );
             })}
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
              <UpcomingCard key={i} u={u} delay={i * 100} onAssigner={() => setAssignTarget(u)} onAppelOffres={() => setAppelOffresTarget(u)} />
            ))}
          </div>
        </div>

      </div>

      {/* ══════════════════════════ SLIDE-OVER DRAWER ══════════════════════════ */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => { setDrawerOpen(false); setEditingContractorId(null); }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998,
            }}
          />
          {/* Drawer */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, background: '#0F1629',
            zIndex: 9999, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 24, background: '#D4A843', borderRadius: 2 }} />
                <span style={{ color: '#fff', fontSize: 20, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{editingContractorId ? 'Modifier Sous-Traitant' : 'Nouveau Sous-Traitant'}</span>
              </div>
              <button
                onClick={() => { setDrawerOpen(false); setEditingContractorId(null); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}
              >×</button>
            </div>
            {/* Form */}
            <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
              {[
                { label: 'Nom du sous-traitant', key: 'nom', type: 'text' },
                { label: 'Spécialité', key: 'specialite', type: 'text' },
                { label: 'Tarif/jour (DH)', key: 'tarif_journalier', type: 'number' },
                { label: 'Note moyenne', key: 'note_service', type: 'number', min: 1, max: 5, step: 0.1 },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    min={(field as any).min}
                    max={(field as any).max}
                    step={(field as any).step}
                    value={(formData as any)[field.key]}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
                      fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A843'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                </div>
              ))}
              {/* Statut select */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A843'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  <option value="disponible" style={{ background: '#0F1629' }}>Disponible</option>
                  <option value="mission" style={{ background: '#0F1629' }}>En Mission</option>
                </select>
              </div>
              {/* Submit */}
              <button
                onClick={handleCreateContractor}
                disabled={submitting}
                style={{
                  width: '100%', background: '#D4A843', color: '#0F1629', border: 'none',
                  borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif", marginTop: 8, opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Sauvegarde…' : editingContractorId ? 'Enregistrer les Modifications' : 'Créer le Sous-Traitant'}
              </button>
              {formError && (
                <div style={{ color: '#EF4444', fontSize: 13, marginTop: 4 }}>{formError}</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════ CONTRACTOR DETAIL DRAWER ══════════════════════════ */}
      {selectedContractor && (() => {
        const sc = selectedContractor;
        const isMission = sc.statut === 'mission';
        const avatarBg = AVATAR_COLORS[sc.colorIndex % AVATAR_COLORS.length];
        const avatarText = avatarBg === T.gold ? '#000' : '#fff';
        const initials = (sc.code_prestataire || '??').slice(0, 2).toUpperCase();
        const tarifFormatted = sc.tarif_journalier ? `${Number(sc.tarif_journalier).toLocaleString('fr-FR')} DH/j` : '—';
        const coutMtdFormatted = sc.cout_mtd != null ? `${Number(sc.cout_mtd).toLocaleString('fr-FR')} DH` : '—';
        const getRiskDot = () => {
          if (sc.statut === 'mission' && sc.jours_travailles >= 7) return { color: '#EF4444', label: 'Risque élevé' };
          if (sc.statut === 'mission' && sc.jours_travailles >= 4) return { color: '#F59E0B', label: 'À surveiller' };
          return { color: '#10B981', label: 'Nominal' };
        };
        const risk = getRiskDot();
        const sLabel: React.CSSProperties = { color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 14 };
        const rowS: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' };
        const valS: React.CSSProperties = { color: '#fff', fontSize: 14 };
        const dimL: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', fontSize: 14 };
        return (
          <>
            <div onClick={() => setSelectedContractor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998 }} />
            <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 520, background: '#0F1629', zIndex: 9999, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 4, height: 48, background: '#D4A843', borderRadius: 2, flexShrink: 0 }} />
                  <AvatarCircle initials={initials} bg={avatarBg} textColor={avatarText} size={44} />
                  <div>
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{sc.nom}</div>
                    <span style={{ background: `${T.info}22`, color: T.info, border: `1px solid ${T.info}44`, borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 600, display: 'inline-block', marginTop: 4 }}>{sc.specialite || '—'}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedContractor(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              {/* Body */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {isMission && (
                  <>
                    <div style={{ padding: '20px 24px' }}>
                      <div style={sLabel}>Mission Actuelle</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={rowS}><span style={dimL}>Localisation</span><span style={{ ...valS, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} color={T.info} /> {sc.mission_actuelle || '—'}</span></div>
                        <div style={rowS}><span style={dimL}>Jours travaillés</span><span style={{ ...valS, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{sc.jours_travailles ?? 0} j</span></div>
                        <div style={rowS}><span style={dimL}>Coût MTD</span><span style={{ ...valS, color: '#D4A843', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{coutMtdFormatted}</span></div>
                      </div>
                    </div>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  </>
                )}
                <div style={{ padding: '20px 24px' }}>
                  <div style={sLabel}>Tarification</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={rowS}><span style={dimL}>Tarif/jour</span><span style={{ ...valS, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: T.gold }}>{tarifFormatted}</span></div>
                    <div style={rowS}><span style={dimL}>Note moyenne</span><Stars rating={sc.note_service ?? 0} /></div>
                  </div>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ padding: '20px 24px' }}>
                  <div style={sLabel}>Statut & Risque</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={rowS}>
                      <span style={dimL}>Statut</span>
                      {isMission ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}><Briefcase size={11} /> En Mission</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(6,182,212,0.15)', color: '#06B6D4', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}><CheckCircle size={11} /> Disponible</span>
                      )}
                    </div>
                    <div style={rowS}>
                      <span style={dimL}>Indicateur risque</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: risk.color }} />
                        <span style={{ color: risk.color, fontSize: 13, fontWeight: 600 }}>{risk.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div style={{ position: 'sticky', bottom: 0, background: '#0F1629', padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => {
                    setFormData({
                      nom: sc.nom || '',
                      specialite: sc.specialite || '',
                      tarif_journalier: sc.tarif_journalier != null ? String(sc.tarif_journalier) : '',
                      note_service: sc.note_service != null ? String(sc.note_service) : '',
                      statut: sc.statut || 'disponible',
                    });
                    setEditingContractorId(sc.id);
                    setSelectedContractor(null);
                    setDrawerOpen(true);
                  }}
                  style={{ width: '100%', background: 'transparent', border: '1px solid #D4A843', color: '#D4A843', borderRadius: 8, padding: 12, fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >Modifier le Sous-Traitant</button>
                <button
                  onClick={async () => {
                    if (!confirm('Voulez-vous vraiment désactiver ce sous-traitant ?')) return;
                    try {
                      const { error } = await supabase.from('prestataires_transport').update({ actif: false, statut: 'disponible', mission_actuelle: null }).eq('id', sc.id);
                      if (error) throw error;
                      setSelectedContractor(null);
                      toast({ title: 'Sous-traitant désactivé' });
                    } catch (err: any) {
                      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
                    }
                  }}
                  style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 8, padding: 12, fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >Désactiver</button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ══════════════════════════ MISSION DETAIL DRAWER ══════════════════════════ */}
      {missionDrawer && createPortal((() => {
        const matchedContractor = contractors.find((c: any) => 
          c.nom === missionDrawer.contractor || 
          c.nom?.toLowerCase().includes(missionDrawer.contractor.toLowerCase()) ||
          missionDrawer.contractor.toLowerCase().includes(c.nom?.toLowerCase())
        );
        const getRiskInfo = () => {
          const jours = matchedContractor?.jours_travailles ?? missionDrawer.joursActuel;
          if (jours >= 7) return { color: '#EF4444', label: 'Risque élevé' };
          if (jours >= 4) return { color: '#F59E0B', label: 'À surveiller' };
          return { color: '#10B981', label: 'Nominal' };
        };
        const risk = getRiskInfo();
        const tarifNum = matchedContractor?.tarif_journalier ?? Number(missionDrawer.tarif.replace(/[\s,]/g, ''));
        const totalJours = missionDrawer.joursTotal;
        const coutTotal = tarifNum * totalJours;
        const coutMtd = matchedContractor?.cout_mtd ?? coutTotal;
        const rating = matchedContractor?.note_service ?? 5;
        const joursTravailles = matchedContractor?.jours_travailles ?? missionDrawer.joursActuel;
        const specialite = matchedContractor?.specialite || 'Sous-traitant';

        const sectionLabel: React.CSSProperties = {
          color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase',
          letterSpacing: '0.08em', fontWeight: 600,
        };
        const rowStyle: React.CSSProperties = {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        };
        const valStyle: React.CSSProperties = {
          color: '#fff', fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
        };
        const dimLabel: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', fontSize: 14 };
        const divider: React.CSSProperties = {
          height: 1, background: 'rgba(255,255,255,0.06)', margin: '0',
        };

        return (
          <>
            <div
              onClick={() => setMissionDrawer(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998 }}
            />
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, background: '#0F1629',
              zIndex: 9999, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 4, height: 48, background: '#D4A843', borderRadius: 2, flexShrink: 0 }} />
                  <AvatarCircle initials={missionDrawer.initials} bg={missionDrawer.avatarBg} textColor={missionDrawer.avatarText} size={44} />
                  <div>
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{missionDrawer.contractor}</div>
                    <span style={{
                      background: `${T.info}22`, color: T.info, border: `1px solid ${T.info}44`,
                      borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 600, display: 'inline-block', marginTop: 4,
                    }}>{specialite}</span>
                  </div>
                </div>
                <button
                  onClick={() => setMissionDrawer(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}
                >×</button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* Section 1 — Mission Info */}
                <div style={{ padding: '24px 24px 20px' }}>
                  <div style={{ ...sectionLabel, marginBottom: 16 }}>Mission Info</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Mission ID</span>
                      <span style={valStyle}>{missionDrawer.id}</span>
                    </div>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Statut</span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        En cours
                      </span>
                    </div>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Client</span>
                      <span style={{ ...valStyle, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{missionDrawer.client}</span>
                    </div>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Période</span>
                      <span style={valStyle}>{missionDrawer.debut} → {missionDrawer.fin}</span>
                    </div>
                    {/* Progress */}
                    <div style={{ marginTop: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                          Jour {missionDrawer.joursActuel} sur {missionDrawer.joursTotal} — {missionDrawer.progress}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: '#1E2D4A', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', background: 'linear-gradient(90deg, #D4A843, #F5D77A)',
                          borderRadius: 3, width: `${missionDrawer.progress}%`, transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={divider} />

                {/* Section 2 — Financier */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ ...sectionLabel, marginBottom: 16 }}>Financier</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Tarif/jour</span>
                      <span style={valStyle}>{tarifNum.toLocaleString('fr-FR')} DH/j</span>
                    </div>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Durée</span>
                      <span style={valStyle}>{totalJours} jours</span>
                    </div>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Coût total</span>
                      <span style={{ ...valStyle, color: '#D4A843', fontWeight: 700 }}>{coutTotal.toLocaleString('fr-FR')} DH</span>
                    </div>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Coût MTD</span>
                      <span style={valStyle}>{Number(coutMtd).toLocaleString('fr-FR')} DH</span>
                    </div>
                  </div>
                </div>

                <div style={divider} />

                {/* Section 3 — Performance */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ ...sectionLabel, marginBottom: 16 }}>Performance</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Note moyenne</span>
                      <Stars rating={rating} />
                    </div>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Jours travaillés</span>
                      <span style={valStyle}>{joursTravailles} j</span>
                    </div>
                    <div style={rowStyle}>
                      <span style={dimLabel}>Indicateur risque</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: risk.color }} />
                        <span style={{ color: risk.color, fontSize: 13, fontWeight: 600 }}>{risk.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer — sticky */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', gap: 12,
              }}>
                <button
                  onClick={() => {
                    const lc = contractors.find((c: any) => c.nom === missionDrawer.contractor || missionDrawer.contractor.toLowerCase().includes((c.nom || '').toLowerCase()));
                    setProlongerMission({ ...missionDrawer, id: lc?.id, tarif_journalier: lc?.tarif_journalier || Number((missionDrawer.tarif || '0').replace(/[^0-9]/g, '')), date_fin: '2025-02-28', nom: missionDrawer.contractor, mission_actuelle: missionDrawer.client });
                    setNouvelleFinDate(''); setRaisonProlongation(''); setProlongerError('');
                  }}
                  style={{
                    flex: 1, background: 'transparent', border: '1px solid #D4A843', color: '#D4A843',
                    borderRadius: 8, padding: 12, fontWeight: 500, fontSize: 14, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Prolonger la Mission</button>
                <button
                  onClick={() => handleTermineMission(missionDrawer.contractor)}
                  disabled={terminatingMission}
                  style={{
                    flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444',
                    borderRadius: 8, padding: 12, fontWeight: 500, fontSize: 14, cursor: terminatingMission ? 'wait' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif", opacity: terminatingMission ? 0.7 : 1,
                  }}>{terminatingMission ? 'En cours…' : 'Terminer la Mission'}</button>
              </div>
            </div>
          </>
        );
      })(), document.body)}
      {/* ══════════════════════════ PROLONGER MODAL ══════════════════════════ */}
      {prolongerTarget && createPortal(
        <>
          <div onClick={() => setProlongerTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, zIndex: 10001, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 4, height: 24, background: '#D4A843', borderRadius: 2 }} />
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>Prolonger la Mission</span>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                Prolonger la mission de <strong style={{ color: '#fff' }}>{prolongerTarget.contractor}</strong> (fin actuelle : {prolongerTarget.currentFin})
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Jours supplémentaires
                </label>
                <input
                  type="number" min="1" max="90" value={prolongerJours}
                  onChange={(e) => setProlongerJours(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace", outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A843'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setProlongerTarget(null)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: 12, fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >Annuler</button>
                <button
                  onClick={() => {
                    toast({ title: 'Mission prolongée', description: `${prolongerTarget.contractor} prolongé de ${prolongerJours} jours supplémentaires.` });
                    setProlongerTarget(null);
                    setProlongerJours('3');
                  }}
                  style={{ flex: 1, background: '#D4A843', color: '#0F1629', border: 'none', borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >Confirmer</button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
      {/* ══════════════════════════ ASSIGNER MODAL ══════════════════════════ */}
      {assignTarget && createPortal(
        <>
          <div onClick={() => { setAssignTarget(null); setAssignSelectedId(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 440, background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, zIndex: 10001, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 4, height: 24, background: '#D4A843', borderRadius: 2 }} />
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>Assigner un Sous-Traitant</span>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                Besoin : <strong style={{ color: '#fff' }}>{assignTarget.besoin}</strong>
                <br /><span style={{ fontSize: 12, color: T.textDim }}>Chantier : {assignTarget.chantier} · {assignTarget.duree} · {assignTarget.budget}</span>
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Sous-traitant disponible
                </label>
                <select
                  value={assignSelectedId}
                  onChange={(e) => setAssignSelectedId(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif", outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A843'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  <option value="" style={{ background: '#0F1629' }}>— Sélectionner —</option>
                  {contractors.filter((c: any) => c.statut === 'disponible').map((c: any) => (
                    <option key={c.id} value={c.id} style={{ background: '#0F1629' }}>
                      {c.nom} — {c.specialite || 'Général'} — {Number(c.tarif_journalier || 0).toLocaleString('fr-FR')} DH/j
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => { setAssignTarget(null); setAssignSelectedId(''); }}
                  style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: 12, fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >Annuler</button>
                <button
                  disabled={!assignSelectedId || assignSubmitting}
                  onClick={async () => {
                    setAssignSubmitting(true);
                    try {
                      const { error } = await supabase.from('prestataires_transport').update({
                        statut: 'mission',
                        mission_actuelle: assignTarget.chantier,
                      }).eq('id', assignSelectedId);
                      if (error) throw error;
                      const chosen = contractors.find((c: any) => c.id === assignSelectedId);
                      toast({ title: 'Sous-traitant assigné', description: `${chosen?.nom || 'ST'} assigné à "${assignTarget.besoin}" — ${assignTarget.chantier}` });
                      setAssignTarget(null);
                      setAssignSelectedId('');
                    } catch (err: any) {
                      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
                    } finally {
                      setAssignSubmitting(false);
                    }
                  }}
                  style={{
                    flex: 1, background: !assignSelectedId ? 'rgba(212,168,67,0.3)' : '#D4A843',
                    color: '#0F1629', border: 'none', borderRadius: 8, padding: 12,
                    fontWeight: 600, fontSize: 14, cursor: !assignSelectedId ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif", opacity: assignSubmitting ? 0.6 : 1,
                  }}
                >{assignSubmitting ? 'Assignation...' : 'Assigner'}</button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
      {/* ══════════════════════════ APPEL D'OFFRES MODAL ══════════════════════════ */}
      {appelOffresTarget && createPortal(
        <>
          <div onClick={() => { setAppelOffresTarget(null); setAppelOffresNotes(''); setAppelOffresSelectedIds([]); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 520, maxHeight: '85vh', background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, zIndex: 10001, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ width: 4, height: 24, background: '#D4A843', borderRadius: 2 }} />
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>Créer Appel d'Offres</span>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
              {/* Summary */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><div style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Besoin</div><div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginTop: 2 }}>{appelOffresTarget.besoin}</div></div>
                  <div><div style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Spécialité</div><div style={{ color: appelOffresTarget.specialtyColor, fontSize: 14, fontWeight: 600, marginTop: 2 }}>{appelOffresTarget.specialty}</div></div>
                  <div><div style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chantier</div><div style={{ color: T.textSec, fontSize: 14, marginTop: 2 }}>{appelOffresTarget.chantier}</div></div>
                  <div><div style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Budget</div><div style={{ color: T.gold, fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{appelOffresTarget.budget}</div></div>
                  <div><div style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date requise</div><div style={{ color: T.textSec, fontSize: 14, marginTop: 2 }}>{appelOffresTarget.date}</div></div>
                  <div><div style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Durée</div><div style={{ color: T.textSec, fontSize: 14, marginTop: 2 }}>{appelOffresTarget.duree}</div></div>
                </div>
              </div>
              {/* Contractor selection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Destinataires
                  </label>
                  <button
                    onClick={() => {
                      const allIds = contractors.filter((c: any) => c.actif !== false).map((c: any) => c.id);
                      setAppelOffresSelectedIds(prev => prev.length === allIds.length ? [] : allIds);
                    }}
                    style={{ background: 'none', border: 'none', color: T.gold, fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {appelOffresSelectedIds.length === contractors.filter((c: any) => c.actif !== false).length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, maxHeight: 200, overflowY: 'auto',
                }}>
                  {contractors.filter((c: any) => c.actif !== false).map((c: any) => {
                    const isSelected = appelOffresSelectedIds.includes(c.id);
                    const isMission = c.statut === 'mission';
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setAppelOffresSelectedIds(prev =>
                            prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(212,168,67,0.08)' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: isSelected ? '2px solid #D4A843' : '2px solid rgba(255,255,255,0.15)',
                          background: isSelected ? '#D4A843' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}>
                          {isSelected && <span style={{ color: '#0F1629', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: T.textPri }}>{c.nom}</span>
                            {isMission && (
                              <span style={{
                                background: `${T.info}22`, color: T.info, border: `1px solid ${T.info}44`,
                                borderRadius: 100, padding: '1px 6px', fontSize: 9, fontWeight: 700,
                              }}>En mission</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: T.textDim }}>{c.specialite || 'Général'} · {Number(c.tarif_journalier || 0).toLocaleString('fr-FR')} DH/j</div>
                        </div>
                        {/* Rating */}
                        <div style={{ fontSize: 11, color: T.gold, fontFamily: "'JetBrains Mono', monospace" }}>
                          {'★'.repeat(Math.round(c.note_service || 0))}{'☆'.repeat(5 - Math.round(c.note_service || 0))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ color: T.textDim, fontSize: 11, marginTop: 6 }}>
                  {appelOffresSelectedIds.length} sur {contractors.filter((c: any) => c.actif !== false).length} sélectionné{appelOffresSelectedIds.length > 1 ? 's' : ''}
                </div>
              </div>
              {/* Notes */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Notes / Critères supplémentaires
                </label>
                <textarea
                  value={appelOffresNotes}
                  onChange={(e) => setAppelOffresNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Exiger certification, expérience minimum 3 ans..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'vertical',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A843'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => { setAppelOffresTarget(null); setAppelOffresNotes(''); setAppelOffresSelectedIds([]); }}
                  style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: 12, fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >Annuler</button>
                <button
                  disabled={appelOffresSubmitting || appelOffresSelectedIds.length === 0}
                  onClick={async () => {
                    setAppelOffresSubmitting(true);
                    try {
                      await new Promise(r => setTimeout(r, 800));
                      const selectedNames = appelOffresSelectedIds.map(id => contractors.find((c: any) => c.id === id)?.nom).filter(Boolean);
                      toast({ title: 'Appel d\'offres créé', description: `AO pour "${appelOffresTarget.besoin}" envoyé à ${selectedNames.length} prestataire${selectedNames.length > 1 ? 's' : ''}: ${selectedNames.slice(0, 3).join(', ')}${selectedNames.length > 3 ? '...' : ''}` });
                      setAppelOffresTarget(null);
                      setAppelOffresNotes('');
                      setAppelOffresSelectedIds([]);
                    } catch (err: any) {
                      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
                    } finally {
                      setAppelOffresSubmitting(false);
                    }
                  }}
                  style={{
                    flex: 1, background: appelOffresSelectedIds.length === 0 ? 'rgba(212,168,67,0.3)' : '#D4A843',
                    color: '#0F1629', border: 'none', borderRadius: 8, padding: 12,
                    fontWeight: 600, fontSize: 14,
                    cursor: appelOffresSelectedIds.length === 0 || appelOffresSubmitting ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif", opacity: appelOffresSubmitting ? 0.6 : 1,
                  }}
                >{appelOffresSubmitting ? 'Création...' : `Envoyer (${appelOffresSelectedIds.length})`}</button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
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
function UpcomingCard({ u, delay, onAssigner, onAppelOffres }: { u: typeof UPCOMING[0]; delay: number; onAssigner?: () => void; onAppelOffres?: () => void }) {
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
      <span style={{
        background: `${u.specialtyColor}22`, color: u.specialtyColor,
        border: `1px solid ${u.specialtyColor}44`, borderRadius: 100,
        padding: '2px 10px', fontSize: 11, fontWeight: 600, display: 'inline-block', marginBottom: 12,
      }}>{u.specialty}</span>
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
       <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${T.cardBorder}` }}>
         <Zap size={14} color="#D4A843" />
         <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
           IA recommande · {u.besoin === 'Pompage gros volume' ? 'Atlas Pompage SARL' : 'Électricité MB'} — score{' '}
           <span style={{ color: '#D4A843' }}>{u.besoin === 'Pompage gros volume' ? '94' : '91'}</span>/100
         </span>
       </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onAssigner}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: T.gold, color: T.navy, border: 'none',
            borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>
          <UserPlus size={14} /> Assigner
        </button>
        <button
          onClick={onAppelOffres}
          style={{
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
