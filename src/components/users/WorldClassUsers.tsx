import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import {
  Users, CheckCircle, Shield, Clock, Award, Eye, Settings,
  Download, UserPlus, Pencil, XCircle, Search, Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

// ─── Tokens ────────────────────────────────────────────────────────────────
const BG      = '#0B1120';
const CARD    = 'rgba(17,27,46,0.92)';
const BORDER  = 'rgba(255,215,0,0.10)';
const BORDER2 = 'rgba(255,255,255,0.06)';
const GOLD    = '#FFD700';
const GOLD_D  = 'rgba(255,215,0,0.12)';
const GREEN   = '#10B981';
const GREEN_D = 'rgba(16,185,129,0.12)';
const RED     = '#EF4444';
const RED_D   = 'rgba(239,68,68,0.12)';
const YELLOW  = '#FBBF24';
const YELLOW_D= 'rgba(251,191,36,0.12)';
const BLUE    = '#3B82F6';
const BLUE_D  = 'rgba(59,130,246,0.12)';
const GRAY    = '#94A3B8';
const GRAY_D  = 'rgba(148,163,184,0.12)';
const PURPLE  = '#A855F7';
const PURPLE_D= 'rgba(168,85,247,0.12)';
const CYAN    = '#06B6D4';
const CYAN_D  = 'rgba(6,182,212,0.12)';
const PINK    = '#EC4899';
const TEXT1   = '#F1F5F9';
const TEXT2   = '#94A3B8';
const TEXT3   = '#64748B';
const MONO    = "'JetBrains Mono', monospace";
const SANS    = "'DM Sans', sans-serif";

// ─── Role / dept helpers ─────────────────────────────────────────────────────
const ROLE_CLR: Record<string, string> = {
  Administrateur: RED, Directeur: GOLD, Manager: BLUE, Opérateur: GREEN, Consultation: GRAY,
};
const ROLE_DIM: Record<string, string> = {
  Administrateur: RED_D, Directeur: GOLD_D, Manager: BLUE_D, Opérateur: GREEN_D, Consultation: GRAY_D,
};
const DEPT_CLR: Record<string, { c: string; bg: string }> = {
  Direction:   { c: GOLD,            bg: GOLD_D   },
  Commercial:  { c: BLUE,            bg: BLUE_D   },
  Maintenance: { c: YELLOW,          bg: YELLOW_D },
  Qualité:     { c: CYAN,            bg: CYAN_D   },
  Finance:     { c: GREEN,           bg: GREEN_D  },
  Stock:       { c: PURPLE,          bg: PURPLE_D },
  Production:  { c: RED,             bg: RED_D    },
  Logistique:  { c: '#F97316',       bg: 'rgba(249,115,22,0.12)' },
};
const MOD_CLR: Record<string, { c: string; bg: string }> = {
  Ventes:      { c: BLUE,   bg: BLUE_D   },
  Production:  { c: GREEN,  bg: GREEN_D  },
  Finance:     { c: GOLD,   bg: GOLD_D   },
  Maintenance: { c: YELLOW, bg: YELLOW_D },
  Stocks:      { c: PURPLE, bg: PURPLE_D },
  Qualité:     { c: CYAN,   bg: CYAN_D   },
  Système:     { c: GRAY,   bg: GRAY_D   },
};
const LOG_CLR: Record<string, string> = {
  Création: BLUE, Production: GREEN, Approbation: GOLD,
  Maintenance: YELLOW, Stock: PURPLE, Qualité: CYAN, Rapport: PINK, Connexion: GRAY,
};

// ─── Hooks ──────────────────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return v;
}

function useBarWidth(target: number, delay = 0) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const s = performance.now();
      const dur = 1200;
      const step = (now: number) => {
        const p = Math.min((now - s) / dur, 1);
        setW((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return w;
}

// ─── Shared card style ───────────────────────────────────────────────────────
function cardStyle(hov: boolean, accent = GOLD): React.CSSProperties {
  return {
    background: CARD,
    border: `1px solid ${hov ? accent + '55' : BORDER}`,
    borderRadius: 16,
    backdropFilter: 'blur(12px)',
    transition: 'all 0.28s ease',
    transform: hov ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: hov ? `0 14px 40px ${accent}22` : '0 2px 14px rgba(0,0,0,0.35)',
  };
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
function SectionHeader({ Icon, title, subtitle, badges }: {
  Icon?: React.ElementType; title: string; subtitle?: string;
  badges?: { label: string; color: string; bg: string }[];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
      <div style={{ width: 4, height: 26, background: GOLD, borderRadius: 2, flexShrink: 0 }} />
      {Icon && <Icon size={17} color={GOLD} />}
      <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: TEXT1, margin: 0 }}>{title}</h2>
      {subtitle && <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT3 }}>{subtitle}</span>}
      {badges?.map((b, i) => (
        <span key={i} style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: b.bg, color: b.color }}>{b.label}</span>
      ))}
    </div>
  );
}

// ─── DarkTooltip ─────────────────────────────────────────────────────────────
function DarkTip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1E293B', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontFamily: SANS }}>
      <div style={{ color: TEXT2, fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || GOLD, fontSize: 12, fontWeight: 700 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────
const ROLES_DATA = [
  { role: 'Administrateur', users: 2, color: RED,   dim: RED_D,   Icon: Shield,   perms: 'Accès total — lecture, écriture, suppression, configuration', pct: 12.5 },
  { role: 'Directeur',      users: 2, color: GOLD,  dim: GOLD_D,  Icon: Award,    perms: 'Lecture totale, rapports, approbations, tableaux de bord',     pct: 12.5 },
  { role: 'Manager',        users: 4, color: BLUE,  dim: BLUE_D,  Icon: Users,    perms: 'Lecture/écriture département, rapports, validation',             pct: 25   },
  { role: 'Opérateur',      users: 6, color: GREEN, dim: GREEN_D, Icon: Settings, perms: 'Saisie production, batches, pointage, consultation',             pct: 37.5 },
  { role: 'Consultation',   users: 2, color: GRAY,  dim: GRAY_D,  Icon: Eye,      perms: 'Lecture seule — tableaux de bord et rapports',                  pct: 12.5 },
];

const USERS_DATA = [
  { id: 1,  name: 'Directeur Général',  role: 'Administrateur', email: 'dg@tbos.ma',        dept: 'Direction',   access: "Aujourd'hui 08:15", sessions: 342, active: true  },
  { id: 2,  name: 'Amina Lakhdar',      role: 'Administrateur', email: 'amina@tbos.ma',      dept: 'Direction',   access: "Aujourd'hui 08:00", sessions: 285, active: true  },
  { id: 3,  name: 'Karim Benani',       role: 'Directeur',      email: 'karim@tbos.ma',      dept: 'Commercial',  access: "Aujourd'hui 08:20", sessions: 412, active: true  },
  { id: 4,  name: 'Fatima Zahra',       role: 'Directeur',      email: 'fatima@tbos.ma',     dept: 'Commercial',  access: "Aujourd'hui 08:05", sessions: 356, active: true  },
  { id: 5,  name: 'Mohammed Alami',     role: 'Manager',        email: 'mohammed@tbos.ma',   dept: 'Maintenance', access: "Aujourd'hui 07:10", sessions: 198, active: true  },
  { id: 6,  name: 'Mustapha Ezzahi',    role: 'Manager',        email: 'mustapha@tbos.ma',   dept: 'Qualité',     access: "Aujourd'hui 07:35", sessions: 175, active: true  },
  { id: 7,  name: 'Nadia Filali',       role: 'Manager',        email: 'nadia@tbos.ma',      dept: 'Finance',     access: "Aujourd'hui 08:30", sessions: 220, active: true  },
  { id: 8,  name: 'Samir Ouazzani',     role: 'Manager',        email: 'samir@tbos.ma',      dept: 'Stock',       access: "Aujourd'hui 07:05", sessions: 165, active: true  },
  { id: 9,  name: 'Ahmed Benali',       role: 'Opérateur',      email: 'ahmed@tbos.ma',      dept: 'Production',  access: "Aujourd'hui 06:00", sessions: 480, active: true  },
  { id: 10, name: 'Khalid Mansouri',    role: 'Opérateur',      email: 'khalid@tbos.ma',     dept: 'Logistique',  access: "Aujourd'hui 06:30", sessions: 395, active: true  },
  { id: 11, name: 'Youssef Rami',       role: 'Opérateur',      email: 'youssef@tbos.ma',    dept: 'Logistique',  access: "Aujourd'hui 07:00", sessions: 310, active: true  },
  { id: 12, name: 'Hassan Lazrak',      role: 'Opérateur',      email: 'hassan@tbos.ma',     dept: 'Logistique',  access: "Aujourd'hui 06:45", sessions: 288, active: true  },
  { id: 13, name: 'Rachid Moussaoui',   role: 'Opérateur',      email: 'rachid@tbos.ma',     dept: 'Production',  access: "Aujourd'hui 06:00", sessions: 465, active: true  },
  { id: 14, name: 'Abdellah Karimi',    role: 'Opérateur',      email: 'abdellah@tbos.ma',   dept: 'Production',  access: "Aujourd'hui 06:00", sessions: 425, active: true  },
  { id: 15, name: 'Omar Idrissi',       role: 'Consultation',   email: 'omar@tbos.ma',       dept: 'Qualité',     access: 'Hier 16:30',        sessions: 85,  active: false },
  { id: 16, name: 'Brahim Tahiri',      role: 'Consultation',   email: 'brahim@tbos.ma',     dept: 'Production',  access: 'Hier 17:00',        sessions: 92,  active: false },
];

const WEEK_DATA = [
  { day: 'Lun', v: 14 }, { day: 'Mar', v: 16 }, { day: 'Mer', v: 13 },
  { day: 'Jeu', v: 15 }, { day: 'Ven', v: 14 }, { day: 'Sam', v: 8 }, { day: 'Dim', v: 2 },
];

const PIE_DATA = [
  { name: 'Administrateur', value: 2, color: RED   },
  { name: 'Directeur',      value: 2, color: GOLD  },
  { name: 'Manager',        value: 4, color: BLUE  },
  { name: 'Opérateur',      value: 6, color: GREEN },
  { name: 'Consultation',   value: 2, color: GRAY  },
];

type PermLevel = 'full' | 'write' | 'read' | 'none';
const PERM_CFG: Record<PermLevel, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  full:  { label: 'Full',  Icon: CheckCircle, color: GREEN, bg: GREEN_D },
  write: { label: 'Write', Icon: Pencil,      color: BLUE,  bg: BLUE_D  },
  read:  { label: 'Read',  Icon: Eye,         color: GOLD,  bg: GOLD_D  },
  none:  { label: 'None',  Icon: XCircle,     color: RED,   bg: RED_D   },
};

const MATRIX: { module: string; admin: PermLevel; directeur: PermLevel; manager: PermLevel; operateur: PermLevel; consultation: PermLevel }[] = [
  { module: 'Dashboard',     admin: 'full', directeur: 'full', manager: 'read',  operateur: 'read',  consultation: 'read'  },
  { module: 'Production',    admin: 'full', directeur: 'read', manager: 'write', operateur: 'write', consultation: 'read'  },
  { module: 'Ventes',        admin: 'full', directeur: 'full', manager: 'write', operateur: 'none',  consultation: 'read'  },
  { module: 'Finance',       admin: 'full', directeur: 'read', manager: 'read',  operateur: 'none',  consultation: 'none'  },
  { module: 'Stocks',        admin: 'full', directeur: 'read', manager: 'write', operateur: 'read',  consultation: 'read'  },
  { module: 'Qualité',       admin: 'full', directeur: 'read', manager: 'write', operateur: 'read',  consultation: 'read'  },
  { module: 'RH / Présence', admin: 'full', directeur: 'full', manager: 'read',  operateur: 'none',  consultation: 'none'  },
  { module: 'Configuration', admin: 'full', directeur: 'none', manager: 'none',  operateur: 'none',  consultation: 'none'  },
];

const LOG_DATA = [
  { time: '15:32', user: 'Karim Benani',    role: 'Directeur',     action: 'Création devis',       module: 'Ventes',      detail: 'Devis VNT-2024-019 — ONCF 85K DH',    type: 'Création'    },
  { time: '14:45', user: 'Ahmed Benali',    role: 'Opérateur',     action: 'Batch complété',       module: 'Production',  detail: 'BN-2024-0142 — B25 12.5m³',           type: 'Production'  },
  { time: '13:20', user: 'Fatima Zahra',    role: 'Directeur',     action: 'Approbation paiement', module: 'Finance',     detail: 'FAC-2024-089 — 85,000 DH',            type: 'Approbation' },
  { time: '11:30', user: 'Mohammed Alami',  role: 'Manager',       action: 'Début maintenance',    module: 'Maintenance', detail: 'Pompe BP-01 — Révision complète',      type: 'Maintenance' },
  { time: '10:15', user: 'Samir Ouazzani',  role: 'Manager',       action: 'Mouvement stock',      module: 'Stocks',      detail: 'Sortie Ciment CPA 55 — 1,200 kg',     type: 'Stock'       },
  { time: '09:00', user: 'Mustapha Ezzahi', role: 'Manager',       action: 'Résultat test',        module: 'Qualité',     detail: 'LAB-142 — Slump 18cm Conforme',        type: 'Qualité'     },
  { time: '08:30', user: 'Nadia Filali',    role: 'Manager',       action: 'Rapport généré',       module: 'Finance',     detail: 'Financier_Jan2024.pdf',                type: 'Rapport'     },
  { time: '08:00', user: 'DG',              role: 'Administrateur',action: 'Connexion',            module: 'Système',     detail: 'Connexion depuis 192.168.1.xx',         type: 'Connexion'   },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function KPICard({ label, value, color, iconBg, Icon, trend, trendColor, delay }: {
  label: string; value: string | number; color: string; iconBg: string;
  Icon: React.ElementType; trend?: string; trendColor?: string; delay: number;
}) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        ...cardStyle(hov, color), padding: '20px 22px',
        opacity: vis ? 1 : 0,
        transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(16px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ background: iconBg, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        {trend && <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: trendColor || TEXT3 }}>{trend}</span>}
      </div>
      <div style={{ fontFamily: MONO, fontSize: typeof value === 'string' ? 22 : 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT3, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function LastLoginKPI({ delay }: { delay: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        ...cardStyle(hov, GREEN), padding: '20px 22px',
        opacity: vis ? 1 : 0,
        transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(16px)',
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ background: GREEN_D, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={18} color={GREEN} />
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, color: GREEN, lineHeight: 1 }}>Maintenant</div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT3, marginTop: 6 }}>Dernière Connexion</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT3, marginTop: 3 }}>Karim B.</div>
    </div>
  );
}

function RoleCard({ r, idx }: { r: typeof ROLES_DATA[0]; idx: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(idx * 80 + 50);
  const bar = useBarWidth(r.pct, idx * 80 + 500);
  const cnt = useAnimatedCounter(r.users, 1000);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        ...cardStyle(hov, r.color), padding: '22px 20px',
        opacity: vis ? 1 : 0,
        transform: vis ? (hov ? 'translateY(-5px)' : 'translateY(0)') : 'translateY(18px)',
        cursor: 'default',
      }}
    >
      <div style={{ background: r.dim, borderRadius: 14, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <r.Icon size={22} color={r.color} />
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: TEXT1, marginBottom: 10 }}>{r.role}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: r.color, lineHeight: 1 }}>{cnt}</span>
        <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT3 }}>utilisateurs</span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT3, marginBottom: 16, lineHeight: 1.6, minHeight: 34 }}>{r.perms}</div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: SANS, fontSize: 10, color: TEXT3 }}>Part de l'équipe</span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: r.color }}>{r.pct}%</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${bar}%`, background: r.color, borderRadius: 100, boxShadow: `0 0 8px ${r.color}66` }} />
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, idx }: { u: typeof USERS_DATA[0]; idx: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(idx * 40 + 80);
  const init = u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rc   = ROLE_CLR[u.role] || GRAY;
  const rd   = ROLE_DIM[u.role] || GRAY_D;
  const dc   = DEPT_CLR[u.dept] || { c: GRAY, bg: GRAY_D };
  const today = u.access.startsWith("Aujourd'hui");

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 48px 1fr 148px 168px 116px 136px 68px 88px 108px',
        alignItems: 'center',
        borderBottom: `1px solid ${BORDER2}`,
        background: hov ? 'rgba(255,215,0,0.025)' : 'transparent',
        transform: vis ? (hov ? 'translateX(4px)' : 'translateX(0)') : 'translateX(-10px)',
        opacity: vis ? 1 : 0,
        transition: 'all 0.22s ease',
        padding: '0 8px',
        minHeight: 54,
      }}
    >
      {/* # */}
      <div style={{ fontFamily: MONO, fontSize: 10, color: TEXT3, textAlign: 'center' }}>{u.id}</div>

      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: rd,
          border: `2px solid ${u.active ? rc + '88' : 'transparent'}`,
          boxShadow: u.active ? `0 0 0 3px ${rc}22` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: MONO, fontSize: 11, fontWeight: 800, color: rc, flexShrink: 0,
        }}>{init}</div>
      </div>

      {/* Name */}
      <div style={{ padding: '0 10px', fontFamily: SANS, fontWeight: 700, fontSize: 13, color: TEXT1 }}>{u.name}</div>

      {/* Role badge */}
      <div style={{ padding: '0 6px' }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: rd, color: rc }}>{u.role}</span>
      </div>

      {/* Email */}
      <div style={{ padding: '0 6px', fontFamily: MONO, fontSize: 10, color: TEXT3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>

      {/* Dept */}
      <div style={{ padding: '0 6px' }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: dc.bg, color: dc.c }}>{u.dept}</span>
      </div>

      {/* Last access */}
      <div style={{ padding: '0 6px', fontFamily: SANS, fontSize: 11, color: today ? GREEN : YELLOW, whiteSpace: 'nowrap' }}>{u.access}</div>

      {/* Sessions */}
      <div style={{ padding: '0 6px', fontFamily: MONO, fontSize: 11, color: TEXT3, textAlign: 'right' }}>{u.sessions}</div>

      {/* Status */}
      <div style={{ padding: '0 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: u.active ? GREEN : YELLOW,
          boxShadow: u.active ? `0 0 6px ${GREEN}` : 'none',
          animation: u.active ? 'wcu-pulse 2s infinite' : 'none',
        }} />
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: u.active ? GREEN : YELLOW }}>
          {u.active ? 'Actif' : 'Inactif'}
        </span>
      </div>

      {/* Actions (hover only) */}
      <div style={{ padding: '0 4px', display: 'flex', gap: 4, opacity: hov ? 1 : 0, transition: 'opacity 0.2s' }}>
        {([
          { Icon: Pencil,  color: GOLD, title: 'Modifier'    },
          { Icon: Shield,  color: BLUE, title: 'Permissions' },
          { Icon: XCircle, color: RED,  title: 'Désactiver'  },
        ] as { Icon: React.ElementType; color: string; title: string }[]).map(({ Icon, color, title }) => (
          <button key={title} title={title} style={{
            background: 'transparent', border: `1px solid ${color}44`, borderRadius: 7,
            width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color, flexShrink: 0,
          }}>
            <Icon size={11} />
          </button>
        ))}
      </div>
    </div>
  );
}

function PermCell({ level }: { level: PermLevel }) {
  const [hov, setHov] = useState(false);
  const cfg = PERM_CFG[level];
  return (
    <td style={{ padding: '7px 4px', textAlign: 'center' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 8,
          background: hov ? cfg.bg.replace(/[\d.]+\)$/, '0.26)') : cfg.bg,
          opacity: level === 'none' ? 0.5 : 1,
          transition: 'all 0.15s', cursor: 'default',
        }}
      >
        <cfg.Icon size={10} color={cfg.color} />
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
      </div>
    </td>
  );
}

function LogEntry({ entry, idx }: { entry: typeof LOG_DATA[0]; idx: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(idx * 50 + 80);
  const dot = LOG_CLR[entry.type] || GRAY;
  const init = entry.user.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rc = ROLE_CLR[entry.role] || GRAY;
  const rd = ROLE_DIM[entry.role] || GRAY_D;
  const mc = MOD_CLR[entry.module] || { c: GRAY, bg: GRAY_D };

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid', gridTemplateColumns: '20px 64px 40px 1fr auto auto',
        alignItems: 'center',
        background: hov ? 'rgba(255,215,0,0.025)' : 'transparent',
        transform: vis ? (hov ? 'translateX(4px)' : 'translateX(0)') : 'translateY(10px)',
        opacity: vis ? 1 : 0,
        transition: 'all 0.22s ease',
        padding: '10px 12px',
        borderBottom: `1px solid ${BORDER2}`,
      }}
    >
      {/* Timeline dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', paddingTop: 4 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dot, boxShadow: `0 0 6px ${dot}99`, flexShrink: 0 }} />
        <div style={{ width: 1, flex: 1, background: `${GOLD}30`, marginTop: 3 }} />
      </div>

      {/* Time */}
      <div style={{ padding: '0 12px', fontFamily: MONO, fontSize: 11, color: TEXT3 }}>{entry.time}</div>

      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: rd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 9, fontWeight: 800, color: rc, flexShrink: 0 }}>{init}</div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 12px' }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: TEXT1 }}>{entry.user}</span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT3 }}> — {entry.action}</span>
        <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT3, marginTop: 2 }}>{entry.detail}</div>
      </div>

      {/* Module */}
      <div style={{ padding: '0 6px' }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: mc.bg, color: mc.c }}>{entry.module}</span>
      </div>

      {/* Type */}
      <div style={{ padding: '0 8px' }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: `${dot}18`, color: dot }}>{entry.type}</span>
      </div>
    </div>
  );
}

function SecCard2FA({ cnt }: { cnt: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...cardStyle(hov, GREEN), padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ background: GREEN_D, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={18} color={GREEN} /></div>
        <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT3 }}>100% des utilisateurs</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: GREEN }}>{cnt}</span>
        <span style={{ fontFamily: MONO, fontSize: 13, color: TEXT3 }}>/16</span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 12 }}>2FA Activé</div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${GREEN}, #34D399)`, borderRadius: 100 }} />
      </div>
    </div>
  );
}

function SecCardFailed() {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...cardStyle(hov, GREEN), padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ background: GREEN_D, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={18} color={GREEN} /></div>
        <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT3 }}>Aucune ce mois</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: GREEN, marginBottom: 4 }}>0</div>
      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 4 }}>Tentatives Échouées</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT3 }}>Aucune tentative suspecte ✓</div>
    </div>
  );
}

function SecCardReview() {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...cardStyle(hov, BLUE), padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ background: BLUE_D, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={18} color={BLUE} /></div>
        <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT3 }}>Prochaine: 01 Mars</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: BLUE, marginBottom: 4 }}>01 Fév</div>
      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 4 }}>Dernière Revue Accès</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT3 }}>Prochaine revue: 01 Mars 2024</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WorldClassUsers() {
  const [activeTab, setActiveTab] = useState('Tous');
  const [search, setSearch]       = useState('');
  const [hovNew, setHovNew]       = useState(false);
  const [hovExp, setHovExp]       = useState(false);

  const TABS = ['Tous', 'Actifs', 'Inactifs', 'Rôles'];

  const cnt16  = useAnimatedCounter(16, 1200);
  const cnt14  = useAnimatedCounter(14, 1100);
  const cnt5   = useAnimatedCounter(5,  1000);
  const cnt2fa = useAnimatedCounter(16, 1200);

  const filtered = USERS_DATA.filter(u => {
    const q = search.toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.includes(q) || u.role.toLowerCase().includes(q);
  });

  return (
    <div style={{ fontFamily: SANS, minHeight: '100vh', background: BG, color: TEXT1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700;800&display=swap');
        @keyframes wcu-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.88)} }
        @keyframes wcu-glow-g { 0%,100%{box-shadow:0 0 20px rgba(16,185,129,0.10)} 50%{box-shadow:0 0 48px rgba(16,185,129,0.30)} }
        * { box-sizing: border-box; }
      `}</style>

      {/* ━━━ STICKY HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER2}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 64 }}>
          <div>
            <h1 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 21, color: TEXT1, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={19} color={GOLD} /> Utilisateurs
            </h1>
            <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT3, marginTop: 1 }}>Gestion des accès et permissions</div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onMouseEnter={() => setHovExp(true)} onMouseLeave={() => setHovExp(false)}
              style={{ background: hovExp ? GOLD_D : 'transparent', color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 11, padding: '9px 17px', fontFamily: SANS, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
            ><Download size={13} /> Exporter</button>

            <button
              onMouseEnter={() => setHovNew(true)} onMouseLeave={() => setHovNew(false)}
              style={{ background: hovNew ? '#FFE84D' : GOLD, color: BG, border: 'none', borderRadius: 11, padding: '10px 19px', fontFamily: SANS, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transform: hovNew ? 'scale(0.97)' : 'scale(1)', transition: 'all 0.15s', boxShadow: '0 4px 20px rgba(255,215,0,0.28)' }}
            ><UserPlus size={13} /> Nouvel Utilisateur</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 32px', borderTop: `1px solid ${BORDER2}` }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'transparent', border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${GOLD}` : '2px solid transparent',
              color: activeTab === tab ? GOLD : TEXT3,
              padding: '11px 20px', fontFamily: SANS, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* ━━━ PAGE CONTENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ padding: '28px 32px', maxWidth: 1700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 36 }}>

        {/* ── SECTION 1: KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <KPICard label="Utilisateurs"       value={cnt16} color={GOLD}  iconBg={GOLD_D}  Icon={Users}       trend="+2 ce trimestre" trendColor={TEXT3} delay={0}   />
          <KPICard label="Actifs Aujourd'hui" value={cnt14} color={GREEN} iconBg={GREEN_D} Icon={CheckCircle} trend="87.5% connectés" trendColor={GREEN} delay={80}  />
          <KPICard label="Rôles Définis"      value={cnt5}  color={BLUE}  iconBg={BLUE_D}  Icon={Shield}                                                  delay={160} />
          <LastLoginKPI delay={240} />
        </div>

        {/* ── SECTION 2: ROLE OVERVIEW ── */}
        <div>
          <SectionHeader Icon={Shield} title="Rôles et Permissions" badges={[{ label: '5 rôles', color: BLUE, bg: BLUE_D }]} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
            {ROLES_DATA.map((r, i) => <RoleCard key={r.role} r={r} idx={i} />)}
          </div>
        </div>

        {/* ── SECTION 3: USER LIST ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 26, background: GOLD, borderRadius: 2 }} />
              <Users size={17} color={GOLD} />
              <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: TEXT1, margin: 0 }}>Tous les Utilisateurs</h2>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: GOLD_D, color: GOLD }}>16 utilisateurs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER2}`, borderRadius: 11, padding: '8px 14px', minWidth: 250 }}>
              <Search size={13} color={TEXT3} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: SANS, fontSize: 12, color: TEXT1, width: '100%' }} />
            </div>
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 48px 1fr 148px 168px 116px 136px 68px 88px 108px', padding: '10px 8px', background: 'rgba(255,255,255,0.025)', borderBottom: `1px solid ${BORDER2}` }}>
              {['#','','Nom','Rôle','Email','Département','Dernier Accès','Sessions','Statut',''].map((h, i) => (
                <div key={i} style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 6px', textAlign: i === 0 ? 'center' : 'left' }}>{h}</div>
              ))}
            </div>
            {filtered.map((u, i) => <UserRow key={u.id} u={u} idx={i} />)}
          </div>
        </div>

        {/* ── SECTION 4: USER ACTIVITY ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Donut */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: TEXT1, marginBottom: 18 }}>Utilisateurs Actifs par Rôle</div>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={62} outerRadius={92} dataKey="value" paddingAngle={2} animationDuration={800}>
                    {PIE_DATA.map((d, i) => <Cell key={i} fill={d.color} opacity={d.name === 'Consultation' ? 0.3 : 1} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} utilisateurs`, n]} contentStyle={{ background: '#1E293B', border: `1px solid ${BORDER}`, borderRadius: 10, fontFamily: SANS }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: GREEN, lineHeight: 1 }}>14</div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT3 }}>actifs</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 14 }}>
              {PIE_DATA.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT2, flex: 1 }}>{d.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: TEXT1 }}>Connexions cette Semaine</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color: GOLD }}>11.7</span>
                <span style={{ fontFamily: SANS, fontSize: 10, color: TEXT3 }}>moy/jour</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={WEEK_DATA} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER2} />
                <XAxis dataKey="day" tick={{ fill: TEXT3, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 18]} tick={{ fill: TEXT3, fontFamily: SANS, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTip />} />
                <ReferenceLine y={16} stroke={GOLD} strokeDasharray="4 4" strokeWidth={1.5}
                  label={{ value: 'Max 16', fill: GOLD, fontSize: 9, position: 'insideTopRight' }} />
                <Bar dataKey="v" name="Connexions" fill={GOLD} radius={[4,4,0,0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── SECTION 5: PERMISSION MATRIX ── */}
        <div>
          <SectionHeader Icon={Shield} title="Matrice des Permissions" subtitle="5 rôles × 8 modules" />
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'auto', backdropFilter: 'blur(12px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER2}`, background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: TEXT3, textAlign: 'left', padding: '13px 20px', width: 160 }}>Module</th>
                  {([
                    { label: 'Admin',        color: RED  },
                    { label: 'Directeur',    color: GOLD },
                    { label: 'Manager',      color: BLUE },
                    { label: 'Opérateur',    color: GREEN},
                    { label: 'Consultation', color: GRAY },
                  ]).map(({ label, color }) => (
                    <th key={label} style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color, textAlign: 'center', padding: '13px 8px' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((row, i) => (
                  <tr key={row.module} style={{ borderBottom: `1px solid ${BORDER2}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: TEXT1, padding: '6px 20px' }}>{row.module}</td>
                    <PermCell level={row.admin} />
                    <PermCell level={row.directeur} />
                    <PermCell level={row.manager} />
                    <PermCell level={row.operateur} />
                    <PermCell level={row.consultation} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SECTION 6: ACTIVITY LOG ── */}
        <div>
          <SectionHeader Icon={Clock} title="Journal d'Activité" badges={[{ label: 'dernières 24h', color: TEXT3, bg: 'rgba(255,255,255,0.05)' }]} />
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
            {LOG_DATA.map((e, i) => <LogEntry key={i} entry={e} idx={i} />)}
          </div>
        </div>

        {/* ── SECTION 7: SECURITY OVERVIEW ── */}
        <div>
          <SectionHeader Icon={Shield} title="Vue Sécurité" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
            <SecCard2FA cnt={cnt2fa} />
            <SecCardFailed />
            <SecCardReview />
          </div>

          {/* Green compliance banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(16,185,129,0.07))',
            border: `1px solid rgba(16,185,129,0.30)`,
            borderRadius: 14, padding: '16px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            animation: 'wcu-glow-g 4s ease-in-out infinite',
          }}>
            <CheckCircle size={20} color={GREEN} />
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: GREEN }}>Tous les utilisateurs ont le 2FA activé</span>
            <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT3 }}>— Dernière revue des accès: 01 Février 2024 — Politique de mots de passe: conforme</span>
          </div>
        </div>

      </div>
    </div>
  );
}
