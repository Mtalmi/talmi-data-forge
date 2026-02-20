import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import {
  Users, CheckCircle, Shield, Clock, Award, Eye, Settings,
  Download, UserPlus, Pencil, XCircle, Search, AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

// ─── Design tokens ─────────────────────────────────────────────────────
const T = {
  bg: '#0B1120',
  card: 'rgba(17,27,46,0.88)',
  cardBorder: 'rgba(255,215,0,0.10)',
  gold: '#FFD700',
  goldDim: 'rgba(255,215,0,0.12)',
  green: '#10B981',
  greenDim: 'rgba(16,185,129,0.12)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.12)',
  yellow: '#FBBF24',
  yellowDim: 'rgba(251,191,36,0.12)',
  blue: '#3B82F6',
  blueDim: 'rgba(59,130,246,0.12)',
  gray: '#94A3B8',
  grayDim: 'rgba(148,163,184,0.12)',
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

// Role color map
const ROLE_COLOR: Record<string, string> = {
  Administrateur: T.red,
  Directeur: T.gold,
  Manager: T.blue,
  Opérateur: T.green,
  Consultation: T.gray,
};
const ROLE_DIM: Record<string, string> = {
  Administrateur: T.redDim,
  Directeur: T.goldDim,
  Manager: T.blueDim,
  Opérateur: T.greenDim,
  Consultation: T.grayDim,
};

// ─── Helpers ────────────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return vis;
}

function useBarAnim(target: number, delay = 0) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const dur = 1200;
      const step = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setW(e * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return w;
}

function SectionHeader({ icon: Icon, title, subtitle, badges }: {
  icon?: React.ElementType; title: string; subtitle?: string;
  badges?: { label: string; color: string; bg: string }[];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
      <div style={{ width: 4, height: 28, background: T.gold, borderRadius: 2, flexShrink: 0 }} />
      {Icon && <Icon size={18} color={T.gold} />}
      <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: T.textPri, margin: 0 }}>{title}</h2>
      {subtitle && <span style={{ fontFamily: SANS, fontSize: 12, color: T.textDim }}>{subtitle}</span>}
      {badges?.map((b, i) => (
        <span key={i} style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: b.bg, color: b.color }}>{b.label}</span>
      ))}
    </div>
  );
}

function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1E293B', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '10px 14px', fontFamily: SANS }}>
      <div style={{ color: T.textSec, fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.gold, fontSize: 12, fontWeight: 700 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────
const ROLES_DATA = [
  { role: 'Administrateur', users: 2,  color: T.red,  dim: T.redDim,   Icon: Shield,   perms: 'Accès total — lecture, écriture, suppression, configuration', pct: 12.5 },
  { role: 'Directeur',      users: 2,  color: T.gold, dim: T.goldDim,  Icon: Award,    perms: 'Lecture totale, rapports, approbations, tableaux de bord',     pct: 12.5 },
  { role: 'Manager',        users: 4,  color: T.blue, dim: T.blueDim,  Icon: Users,    perms: 'Lecture/écriture département, rapports, validation',             pct: 25   },
  { role: 'Opérateur',      users: 6,  color: T.green,dim: T.greenDim, Icon: Settings, perms: 'Saisie production, batches, pointage, consultation',             pct: 37.5 },
  { role: 'Consultation',   users: 2,  color: T.gray, dim: T.grayDim,  Icon: Eye,      perms: 'Lecture seule — tableaux de bord et rapports',                  pct: 12.5 },
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

const DEPT_COLOR: Record<string, { color: string; bg: string }> = {
  Direction:   { color: T.gold,   bg: T.goldDim },
  Commercial:  { color: T.blue,   bg: T.blueDim },
  Maintenance: { color: T.yellow, bg: T.yellowDim },
  Qualité:     { color: T.cyan,   bg: T.cyanDim },
  Finance:     { color: T.green,  bg: T.greenDim },
  Stock:       { color: T.purple, bg: T.purpleDim },
  Production:  { color: T.red,    bg: T.redDim },
  Logistique:  { color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
};

const ACTIVITY_DATA = [
  { day: 'Lun', connections: 14 },
  { day: 'Mar', connections: 16 },
  { day: 'Mer', connections: 13 },
  { day: 'Jeu', connections: 15 },
  { day: 'Ven', connections: 14 },
  { day: 'Sam', connections: 8  },
  { day: 'Dim', connections: 2  },
];

const ACTIVE_BY_ROLE = [
  { name: 'Administrateur', value: 2, color: T.red  },
  { name: 'Directeur',      value: 2, color: T.gold },
  { name: 'Manager',        value: 4, color: T.blue },
  { name: 'Opérateur',      value: 6, color: T.green},
  { name: 'Consultation',   value: 2, color: T.gray },
];

const PERM_LEVELS: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  full:  { label: 'Full',  icon: CheckCircle, color: T.green, bg: T.greenDim },
  write: { label: 'Write', icon: Pencil,      color: T.blue,  bg: T.blueDim  },
  read:  { label: 'Read',  icon: Eye,         color: T.gold,  bg: T.goldDim  },
  none:  { label: 'None',  icon: XCircle,     color: T.gray,  bg: 'rgba(148,163,184,0.06)' },
};

const PERMISSION_MATRIX = [
  { module: 'Dashboard',      admin: 'full', directeur: 'full', manager: 'read',  operateur: 'read', consultation: 'read' },
  { module: 'Production',     admin: 'full', directeur: 'read', manager: 'write', operateur: 'write',consultation: 'read' },
  { module: 'Ventes',         admin: 'full', directeur: 'full', manager: 'write', operateur: 'none', consultation: 'read' },
  { module: 'Finance',        admin: 'full', directeur: 'read', manager: 'read',  operateur: 'none', consultation: 'none' },
  { module: 'Stocks',         admin: 'full', directeur: 'read', manager: 'write', operateur: 'read', consultation: 'read' },
  { module: 'Qualité',        admin: 'full', directeur: 'read', manager: 'write', operateur: 'read', consultation: 'read' },
  { module: 'RH / Présence',  admin: 'full', directeur: 'full', manager: 'read',  operateur: 'none', consultation: 'none' },
  { module: 'Configuration',  admin: 'full', directeur: 'none', manager: 'none',  operateur: 'none', consultation: 'none' },
];

const LOG_DOT_COLOR: Record<string, string> = {
  Création: T.blue, Production: T.green, Approbation: T.gold,
  Maintenance: T.yellow, Stock: T.purple, Qualité: T.cyan,
  Rapport: T.pink, Connexion: T.gray,
};

const ACTIVITY_LOG = [
  { time: '15:32', user: 'Karim Benani',    role: 'Directeur',    action: 'Création devis',      module: 'Ventes',      detail: 'Devis VNT-2024-019 — ONCF 85K DH',     type: 'Création'   },
  { time: '14:45', user: 'Ahmed Benali',    role: 'Opérateur',    action: 'Batch complété',      module: 'Production',  detail: 'BN-2024-0142 — B25 12.5m³',            type: 'Production' },
  { time: '13:20', user: 'Fatima Zahra',    role: 'Directeur',    action: 'Approbation paiement',module: 'Finance',     detail: 'FAC-2024-089 — 85,000 DH',             type: 'Approbation'},
  { time: '11:30', user: 'Mohammed Alami',  role: 'Manager',      action: 'Début maintenance',   module: 'Maintenance', detail: 'Pompe BP-01 — Révision complète',       type: 'Maintenance'},
  { time: '10:15', user: 'Samir Ouazzani',  role: 'Manager',      action: 'Mouvement stock',     module: 'Stocks',      detail: 'Sortie Ciment CPA 55 — 1,200 kg',      type: 'Stock'      },
  { time: '09:00', user: 'Mustapha Ezzahi', role: 'Manager',      action: 'Résultat test',       module: 'Qualité',     detail: 'LAB-142 — Slump 18cm Conforme',         type: 'Qualité'    },
  { time: '08:30', user: 'Nadia Filali',    role: 'Manager',      action: 'Rapport généré',      module: 'Finance',     detail: 'Financier_Jan2024.pdf',                 type: 'Rapport'    },
  { time: '08:00', user: 'DG',             role: 'Administrateur',action: 'Connexion',           module: 'Système',     detail: 'Connexion depuis 192.168.1.xx',         type: 'Connexion'  },
];

const MODULE_COLOR: Record<string, { color: string; bg: string }> = {
  Ventes:      { color: T.blue,   bg: T.blueDim   },
  Production:  { color: T.green,  bg: T.greenDim  },
  Finance:     { color: T.gold,   bg: T.goldDim   },
  Maintenance: { color: T.yellow, bg: T.yellowDim },
  Stocks:      { color: T.purple, bg: T.purpleDim },
  Qualité:     { color: T.cyan,   bg: T.cyanDim   },
  Système:     { color: T.gray,   bg: T.grayDim   },
};

// ─── Sub-components ───────────────────────────────────────────────────────

function RoleCard({ r, idx }: { r: typeof ROLES_DATA[0]; idx: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(idx * 80);
  const bar = useBarAnim(r.pct, idx * 80 + 400);
  const cnt = useAnimatedCounter(r.users, 1000, 0);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, border: `1px solid ${hov ? r.color + '44' : T.cardBorder}`,
        borderRadius: 16, padding: '22px', backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        transform: vis ? (hov ? 'translateY(-5px) scale(1.01)' : 'translateY(0)') : 'translateY(18px)',
        opacity: vis ? 1 : 0,
        boxShadow: hov ? `0 14px 40px ${r.color}22` : '0 2px 12px rgba(0,0,0,0.3)',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ background: r.dim, borderRadius: 14, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <r.Icon size={22} color={r.color} />
        </div>
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri, marginBottom: 8 }}>{r.role}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: r.color }}>{cnt}</span>
        <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>utilisateurs</span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginBottom: 14, lineHeight: 1.5 }}>{r.perms}</div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>Part de l'équipe</span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: r.color }}>{r.pct}%</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${bar}%`, background: r.color, borderRadius: 100, transition: 'none', boxShadow: `0 0 8px ${r.color}66` }} />
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, idx }: { u: typeof USERS_DATA[0]; idx: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(idx * 40 + 100);
  const init = u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rc = ROLE_COLOR[u.role] || T.gray;
  const rd = ROLE_DIM[u.role] || T.grayDim;
  const dc = DEPT_COLOR[u.dept] || { color: T.gray, bg: T.grayDim };
  const isToday = u.access.startsWith("Aujourd'hui");

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid', gridTemplateColumns: '32px 44px 1fr 130px 160px 110px 110px 60px 80px auto',
        alignItems: 'center', gap: 0,
        borderBottom: `1px solid ${T.border}`,
        transition: 'all 0.2s ease',
        background: hov ? 'rgba(255,215,0,0.03)' : 'transparent',
        transform: vis ? (hov ? 'translateX(4px)' : 'translateX(0)') : 'translateX(-8px)',
        opacity: vis ? 1 : 0,
        padding: '0 6px',
      }}
    >
      {/* # */}
      <div style={{ fontFamily: MONO, fontSize: 10, color: T.textDim, textAlign: 'center' }}>{u.id}</div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 4px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: rd, border: `2px solid ${u.active ? rc + '88' : 'transparent'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: MONO, fontSize: 11, fontWeight: 800, color: rc,
          boxShadow: u.active ? `0 0 0 2px ${rc}33` : 'none',
          flexShrink: 0,
        }}>{init}</div>
      </div>

      {/* Name */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.textPri }}>{u.name}</div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '0 8px' }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: rd, color: rc }}>{u.role}</span>
      </div>

      {/* Email */}
      <div style={{ padding: '0 8px' }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>{u.email}</span>
      </div>

      {/* Dept badge */}
      <div style={{ padding: '0 8px' }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: dc.bg, color: dc.color }}>{u.dept}</span>
      </div>

      {/* Last access */}
      <div style={{ padding: '0 8px', fontFamily: SANS, fontSize: 11, color: isToday ? T.green : T.yellow }}>{u.access}</div>

      {/* Sessions */}
      <div style={{ padding: '0 8px', fontFamily: MONO, fontSize: 11, color: T.textDim, textAlign: 'right' }}>{u.sessions}</div>

      {/* Status */}
      <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: u.active ? T.green : T.yellow,
          boxShadow: u.active ? `0 0 6px ${T.green}` : 'none',
          animation: u.active ? 'tbPulse 2s infinite' : 'none',
        }} />
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: u.active ? T.green : T.yellow }}>{u.active ? 'Actif' : 'Inactif'}</span>
      </div>

      {/* Actions (hover only) */}
      <div style={{ padding: '0 6px', display: 'flex', alignItems: 'center', gap: 4, opacity: hov ? 1 : 0, transition: 'opacity 0.2s ease' }}>
        {[
          { Icon: Pencil,  color: T.gold, title: 'Modifier' },
          { Icon: Shield,  color: T.blue, title: 'Permissions' },
          { Icon: XCircle, color: T.red,  title: 'Désactiver' },
        ].map(({ Icon, color, title }) => (
          <button key={title} title={title} style={{
            background: 'transparent', border: `1px solid ${color}44`, borderRadius: 7,
            width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color,
          }}>
            <Icon size={12} />
          </button>
        ))}
      </div>
    </div>
  );
}

function PermCell({ level }: { level: string }) {
  const cfg = PERM_LEVELS[level];
  const [hov, setHov] = useState(false);
  if (!cfg) return null;
  return (
    <td style={{ padding: '8px 4px', textAlign: 'center' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 8,
          background: hov ? cfg.bg.replace('0.12', '0.22').replace('0.06', '0.14') : cfg.bg,
          transition: 'all 0.15s ease',
          opacity: level === 'none' ? 0.55 : 1,
        }}
      >
        <cfg.icon size={11} color={cfg.color} />
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
      </div>
    </td>
  );
}

function LogEntry({ entry, idx }: { entry: typeof ACTIVITY_LOG[0]; idx: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(idx * 50);
  const dotColor = LOG_DOT_COLOR[entry.type] || T.gray;
  const init = entry.user.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rc = ROLE_COLOR[entry.role] || T.gray;
  const rd = ROLE_DIM[entry.role] || T.grayDim;
  const mc = MODULE_COLOR[entry.module] || { color: T.gray, bg: T.grayDim };
  const typeColor = LOG_DOT_COLOR[entry.type] || T.gray;

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid', gridTemplateColumns: '16px 60px 44px 1fr auto auto',
        alignItems: 'center', gap: 0,
        transition: 'all 0.2s ease',
        background: hov ? 'rgba(255,215,0,0.025)' : 'transparent',
        transform: vis ? (hov ? 'translateX(4px)' : 'translateX(0)') : 'translateY(10px)',
        opacity: vis ? 1 : 0,
        padding: '10px 8px',
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {/* Timeline dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', paddingTop: 4 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, boxShadow: `0 0 6px ${dotColor}88`, flexShrink: 0 }} />
        <div style={{ width: 1, flex: 1, background: `${T.gold}33`, marginTop: 3 }} />
      </div>

      {/* Time */}
      <div style={{ padding: '0 12px', fontFamily: MONO, fontSize: 11, color: T.textDim }}>{entry.time}</div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: rd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 9, fontWeight: 800, color: rc, flexShrink: 0 }}>{init}</div>
      </div>

      {/* Details */}
      <div style={{ padding: '0 12px' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: T.textPri }}>{entry.user} — {entry.action}</div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginTop: 2 }}>{entry.detail}</div>
      </div>

      {/* Module badge */}
      <div style={{ padding: '0 8px' }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: mc.bg, color: mc.color }}>{entry.module}</span>
      </div>

      {/* Type badge */}
      <div style={{ padding: '0 8px' }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: `${typeColor}18`, color: typeColor }}>{entry.type}</span>
      </div>
    </div>
  );
}

// ─── KPI helper cards ─────────────────────────────────────────────────────
function SimpleKPICard({ label, cnt, color, iconBg, Icon, trend, trendC, delay }: {
  label: string; cnt: string; color: string; iconBg: string; Icon: React.ElementType;
  trend?: string; trendC?: string; delay: number;
}) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, border: `1px solid ${hov ? color + '44' : T.cardBorder}`,
        borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(16px)',
        opacity: vis ? 1 : 0,
        boxShadow: hov ? `0 12px 40px ${color}18` : '0 2px 12px rgba(0,0,0,0.3)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ background: iconBg, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        {trend && <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: trendC }}>{trend}</span>}
      </div>
      <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color }}>{cnt}</span>
      <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function LastLoginCard({ delay }: { delay: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, border: `1px solid ${hov ? T.green + '44' : T.cardBorder}`,
        borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(16px)',
        opacity: vis ? 1 : 0,
        boxShadow: hov ? `0 12px 40px ${T.green}18` : '0 2px 12px rgba(0,0,0,0.3)',
      }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ background: T.greenDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={18} color={T.green} />
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: T.green }}>Maintenant</div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>Dernière Connexion</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginTop: 2 }}>Karim B.</div>
    </div>
  );
}

function TwoFACard({ cnt2fa }: { cnt2fa: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.card, border: `1px solid ${hov ? T.green + '44' : T.cardBorder}`, borderRadius: 16, padding: '22px', backdropFilter: 'blur(12px)', transition: 'all 0.3s ease', boxShadow: hov ? `0 12px 40px ${T.green}18` : '0 2px 12px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ background: T.greenDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={18} color={T.green} /></div>
        <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>100% des utilisateurs</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.green }}>{cnt2fa}</span>
        <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}>/16</span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: T.textSec, marginBottom: 10 }}>2FA Activé</div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${T.green}, #34D399)`, borderRadius: 100 }} />
      </div>
    </div>
  );
}

function FailedAttemptsCard() {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.card, border: `1px solid ${hov ? T.green + '44' : T.cardBorder}`, borderRadius: 16, padding: '22px', backdropFilter: 'blur(12px)', transition: 'all 0.3s ease', boxShadow: hov ? `0 12px 40px ${T.green}18` : '0 2px 12px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ background: T.greenDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={18} color={T.green} /></div>
        <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Aucune ce mois</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.green, marginBottom: 4 }}>0</div>
      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: T.textSec, marginBottom: 4 }}>Tentatives Échouées</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Aucune tentative ce mois ✓</div>
    </div>
  );
}

function AccessReviewCard() {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.card, border: `1px solid ${hov ? T.blue + '44' : T.cardBorder}`, borderRadius: 16, padding: '22px', backdropFilter: 'blur(12px)', transition: 'all 0.3s ease', boxShadow: hov ? `0 12px 40px ${T.blue}18` : '0 2px 12px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ background: T.blueDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={18} color={T.blue} /></div>
        <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Prochaine: 01 Mars</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: T.blue, marginBottom: 4 }}>01 Fév</div>
      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: T.textSec, marginBottom: 4 }}>Dernière Revue Accès</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Prochaine revue: 01 Mars 2024</div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function WorldClassUsers() {
  const [activeTab, setActiveTab] = useState('Tous');
  const [search, setSearch] = useState('');
  const [hoverNew, setHoverNew] = useState(false);
  const [hoverExport, setHoverExport] = useState(false);
  const TABS = ['Tous', 'Actifs', 'Inactifs', 'Rôles'];

  const cnt16  = useAnimatedCounter(16, 1200, 0);
  const cnt14  = useAnimatedCounter(14, 1100, 0);
  const cnt5   = useAnimatedCounter(5,  1000, 0);
  const cnt2fa = useAnimatedCounter(16, 1200, 0);

  const filtered = USERS_DATA.filter(u => {
    const q = search.toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  return (
    <div style={{ fontFamily: SANS, minHeight: '100vh', background: T.bg, color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700;800&display=swap');
        @keyframes tbPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes tbFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tbGlowG { 0%,100%{box-shadow:0 0 20px rgba(16,185,129,0.15)} 50%{box-shadow:0 0 50px rgba(16,185,129,0.35)} }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.96)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '0 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div>
            <h1 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: T.textPri, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={20} color={T.gold} /> Utilisateurs
            </h1>
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginTop: 1 }}>Gestion des accès et permissions</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onMouseEnter={() => setHoverExport(true)} onMouseLeave={() => setHoverExport(false)}
              style={{
                background: hoverExport ? T.goldDim : 'transparent',
                color: T.gold, border: `1px solid ${T.gold}`, borderRadius: 12,
                padding: '9px 18px', fontFamily: SANS, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.15s ease',
              }}
            ><Download size={13} /> Exporter</button>
            <button
              onMouseEnter={() => setHoverNew(true)} onMouseLeave={() => setHoverNew(false)}
              style={{
                background: hoverNew ? '#FFE44D' : T.gold,
                color: T.bg, border: 'none', borderRadius: 12,
                padding: '10px 20px', fontFamily: SANS, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                transform: hoverNew ? 'scale(0.97)' : 'scale(1)',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 20px rgba(255,215,0,0.25)',
              }}
            ><UserPlus size={13} /> Nouvel Utilisateur</button>
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
                padding: '12px 20px', fontFamily: SANS, fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >{tab}</button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '28px 32px', maxWidth: 1700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── SECTION 1: KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <SimpleKPICard label="Utilisateurs"       cnt={cnt16} color={T.gold}  iconBg={T.goldDim}  Icon={Users}        trend="+2 ce trimestre"  trendC={T.textDim} delay={0}   />
          <SimpleKPICard label="Actifs Aujourd'hui" cnt={cnt14} color={T.green} iconBg={T.greenDim} Icon={CheckCircle}  trend="87.5% connectés"  trendC={T.green}   delay={80}  />
          <SimpleKPICard label="Rôles Définis"      cnt={cnt5}  color={T.blue}  iconBg={T.blueDim}  Icon={Shield}                                                   delay={160} />
          <LastLoginCard delay={240} />
        </div>

        {/* ── SECTION 2: ROLE OVERVIEW ── */}
        <div>
          <SectionHeader
            icon={Shield} title="Rôles et Permissions"
            badges={[{ label: '5 rôles', color: T.blue, bg: T.blueDim }]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
            {ROLES_DATA.map((r, idx) => <RoleCard key={r.role} r={r} idx={idx} />)}
          </div>
        </div>

        {/* ── SECTION 3: USER LIST ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 4, height: 28, background: T.gold, borderRadius: 2 }} />
              <Users size={18} color={T.gold} />
              <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: T.textPri, margin: 0 }}>Tous les Utilisateurs</h2>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: T.goldDim, color: T.gold }}>16 utilisateurs</span>
            </div>
            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 12, padding: '8px 14px', minWidth: 260 }}>
              <Search size={14} color={T.textDim} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: SANS, fontSize: 12, color: T.textPri, width: '100%' }}
              />
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '32px 44px 1fr 130px 160px 110px 110px 60px 80px auto',
              padding: '10px 6px', background: 'rgba(255,255,255,0.025)',
              borderBottom: `1px solid ${T.border}`,
            }}>
              {['#', '', 'Nom', 'Rôle', 'Email', 'Département', 'Dernier Accès', 'Sessions', 'Status', ''].map((h, i) => (
                <div key={i} style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 6px', textAlign: i === 0 ? 'center' : 'left' }}>{h}</div>
              ))}
            </div>
            {filtered.map((u, idx) => <UserRow key={u.id} u={u} idx={idx} />)}
          </div>
        </div>

        {/* ── SECTION 4: USER ACTIVITY ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Donut */}
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri, marginBottom: 16 }}>Utilisateurs Actifs par Rôle</div>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={ACTIVE_BY_ROLE} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    dataKey="value" paddingAngle={2} isAnimationActive animationDuration={800}>
                    {ACTIVE_BY_ROLE.map((d, i) => <Cell key={i} fill={d.color} opacity={d.value === 0 ? 0.3 : 1} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: T.green, lineHeight: 1 }}>14</div>
                <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>actifs</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {ACTIVE_BY_ROLE.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: SANS, fontSize: 11, color: T.textSec, flex: 1 }}>{d.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Connexions cette Semaine</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color: T.gold }}>11.7</span>
                <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>moy/jour</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ACTIVITY_DATA} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="day" tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 18]} tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <ReferenceLine y={16} stroke={T.gold} strokeDasharray="4 4" strokeWidth={1.5}
                  label={{ value: 'Max 16', fill: T.gold, fontSize: 9, position: 'insideTopRight' }} />
                <Bar dataKey="connections" name="Connexions" fill={T.gold} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── SECTION 5: PERMISSION MATRIX ── */}
        <div>
          <SectionHeader icon={Shield} title="Matrice des Permissions" subtitle="5 rôles × 8 modules" />
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: T.textDim, textAlign: 'left', padding: '12px 20px', width: 160 }}>Module</th>
                  {[
                    { role: 'Admin', color: T.red },
                    { role: 'Directeur', color: T.gold },
                    { role: 'Manager', color: T.blue },
                    { role: 'Opérateur', color: T.green },
                    { role: 'Consultation', color: T.gray },
                  ].map(({ role, color }) => (
                    <th key={role} style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color, textAlign: 'center', padding: '12px 8px' }}>{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX.map((row, i) => (
                  <tr key={row.module} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: T.textPri, padding: '6px 20px' }}>{row.module}</td>
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
          <SectionHeader
            icon={Clock} title="Journal d'Activité"
            badges={[{ label: 'dernières 24h', color: T.textDim, bg: 'rgba(255,255,255,0.05)' }]}
          />
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
            {ACTIVITY_LOG.map((entry, idx) => <LogEntry key={idx} entry={entry} idx={idx} />)}
          </div>
        </div>

        {/* ── SECTION 7: SECURITY OVERVIEW ── */}
        <div>
          <SectionHeader icon={Shield} title="Vue Sécurité" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
            <TwoFACard cnt2fa={cnt2fa} />
            <FailedAttemptsCard />
            <AccessReviewCard />
          </div>

          {/* Green compliance banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%)',
            border: `1px solid rgba(16,185,129,0.3)`, borderRadius: 14,
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 0 30px rgba(16,185,129,0.08)',
            animation: 'tbGlowG 4s ease-in-out infinite',
          }}>
            <CheckCircle size={20} color={T.green} />
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.green }}>
              Tous les utilisateurs ont le 2FA activé
            </span>
            <span style={{ fontFamily: SANS, fontSize: 12, color: T.textDim }}>
              — Dernière revue des accès: 01 Février 2024 — Politique de mots de passe: conforme
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
