import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import {
  Shield, CheckCircle, BookOpen, AlertTriangle, Phone, Star, Settings,
  ArrowUp, Truck, Package, Droplets, FileText, Calendar,
} from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

// ─── Design tokens ────────────────────────────────────────────────
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
  orange: '#F97316',
  purple: '#A855F7',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textDim: '#64748B',
  border: 'rgba(255,255,255,0.06)',
};

const MONO = "'JetBrains Mono', monospace";
const SANS = "'DM Sans', sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return vis;
}

function SectionHeader({ icon: Icon, title, badges, subtitle }: {
  icon?: React.ElementType; title: string; subtitle?: string;
  badges?: { label: string; color: string; bg: string; pulse?: boolean }[];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
      <div style={{ width: 4, height: 28, background: T.gold, borderRadius: 2, flexShrink: 0 }} />
      {Icon && <Icon size={18} color={T.gold} />}
      <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: T.textPri, margin: 0 }}>{title}</h2>
      {subtitle && <span style={{ fontFamily: SANS, fontSize: 12, color: T.textDim }}>{subtitle}</span>}
      {badges?.map((b, i) => (
        <span key={i} style={{
          fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: '3px 10px',
          borderRadius: 100, background: b.bg, color: b.color,
          animation: b.pulse ? 'tbPulse 2s infinite' : undefined,
        }}>{b.label}</span>
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
        <div key={i} style={{ color: p.color, fontSize: 12, fontWeight: 700 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────
const INCIDENT_HISTORY = [
  { month: 'Sep', incidents: 1, presqu: 3 },
  { month: 'Oct', incidents: 0, presqu: 2 },
  { month: 'Nov', incidents: 2, presqu: 4 },
  { month: 'Déc', incidents: 0, presqu: 1 },
  { month: 'Jan', incidents: 1, presqu: 2 },
  { month: 'Fév', incidents: 0, presqu: 1 },
];

const INCIDENT_TYPES = [
  { name: 'Chute / Glissade', value: 2,  color: T.red },
  { name: 'Brûlure',          value: 1,  color: T.orange },
  { name: 'Projection',       value: 1,  color: T.yellow },
  { name: 'Presqu\'Accident', value: 13, color: T.blue },
];

const EPI_ITEMS = [
  { name: 'Casques de chantier',     verif: '15 Fév', next: '15 Mars', qty: 20 },
  { name: 'Chaussures de sécurité',  verif: '15 Fév', next: '15 Mars', qty: 18 },
  { name: 'Gants de protection',     verif: '15 Fév', next: '15 Mars', qty: 35 },
  { name: 'Lunettes de protection',  verif: '15 Fév', next: '15 Mars', qty: 25 },
  { name: 'Gilets haute visibilité', verif: '15 Fév', next: '15 Mars', qty: 22 },
  { name: 'Protection auditive',     verif: '15 Fév', next: '15 Mars', qty: 30 },
  { name: 'Masques anti-poussière',  verif: '10 Fév', next: '10 Mars', qty: 50 },
  { name: 'Harnais de sécurité',     verif: '01 Fév', next: '01 Mars', qty: 8  },
];

const TRAINING_OK = [
  { name: 'Ahmed Benali',     formation: 'HSE Général + Secourisme',   date: '10 Jan', valid: '10 Jan 2025' },
  { name: 'Khalid Mansouri',  formation: 'HSE Général + Transport',    date: '12 Jan', valid: '12 Jan 2025' },
  { name: 'Youssef Rami',     formation: 'HSE Général + Transport',    date: '12 Jan', valid: '12 Jan 2025' },
  { name: 'Hassan Lazrak',    formation: 'HSE Général + Transport',    date: '12 Jan', valid: '12 Jan 2025' },
  { name: 'Mohammed Alami',   formation: 'HSE Général + Maintenance',  date: '08 Jan', valid: '08 Jan 2025' },
  { name: 'Fatima Zahra',     formation: 'HSE Général',               date: '15 Jan', valid: '15 Jan 2025' },
  { name: 'Karim Benani',     formation: 'HSE Général',               date: '15 Jan', valid: '15 Jan 2025' },
  { name: 'Amina Lakhdar',    formation: 'HSE Général',               date: '15 Jan', valid: '15 Jan 2025' },
  { name: 'Rachid Moussaoui', formation: 'HSE Général + Opérateur',   date: '10 Jan', valid: '10 Jan 2025' },
  { name: 'Mustapha Ezzahi',  formation: 'HSE Général + Labo',        date: '08 Jan', valid: '08 Jan 2025' },
  { name: 'Abdellah Karimi',  formation: 'HSE Général',               date: '15 Jan', valid: '15 Jan 2025' },
  { name: 'Brahim Tahiri',    formation: 'HSE Général',               date: '15 Jan', valid: '15 Jan 2025' },
  { name: 'Nadia Filali',     formation: 'HSE Général',               date: '15 Jan', valid: '15 Jan 2025' },
  { name: 'Samir Ouazzani',   formation: 'HSE Général + Stockage',    date: '10 Jan', valid: '10 Jan 2025' },
];

const PROCEDURES = [
  { name: "Procédure d'Urgence",  desc: 'Évacuation, premiers secours, contacts urgence', rev: '01 Jan 2024', Icon: AlertTriangle, color: T.red,    bg: T.redDim },
  { name: 'Manipulation Ciment',  desc: 'Port EPI obligatoire, ventilation, nettoyage',   rev: '15 Jan 2024', Icon: Package,       color: T.gold,   bg: T.goldDim },
  { name: 'Travail en Hauteur',   desc: 'Harnais, points d\'ancrage, périmètre sécurisé', rev: '10 Jan 2024', Icon: ArrowUp,       color: T.blue,   bg: T.blueDim },
  { name: 'Conduite Camions',     desc: 'Inspection, signalisation, vitesse réglementée', rev: '20 Jan 2024', Icon: Truck,         color: T.green,  bg: T.greenDim },
  { name: 'Produits Chimiques',   desc: 'Stockage sécurisé, manipulation, fiches SDS',    rev: '05 Fév 2024', Icon: Droplets,      color: T.purple, bg: 'rgba(168,85,247,0.12)' },
  { name: 'Maintenance Machines', desc: 'Consignation, verrouillage, test redémarrage',   rev: '12 Fév 2024', Icon: Settings,      color: T.yellow, bg: T.yellowDim },
];

const CONTACTS = [
  { name: 'SAMU',            num: '15',            type: 'Urgence Médicale',            dispo: '24h/24', critical: true },
  { name: 'Pompiers',        num: '15',            type: 'Incendie',                    dispo: '24h/24', critical: true },
  { name: 'Police',          num: '19',            type: 'Sécurité',                    dispo: '24h/24', critical: true },
  { name: 'Mohammed Alami',  num: '06 XX XX XX XX', type: 'Responsable Sécurité Interne', dispo: '06h-18h', critical: false },
];

// ─── Sub-components ───────────────────────────────────────────────
function KPICard({ label, value, suffix, color, iconBg, Icon, trend, delay, extraContent }: {
  label: string; value: string | number; suffix?: string; color: string;
  iconBg: string; Icon: React.ElementType;
  trend?: { label: string; color: string };
  delay: number; extraContent?: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, border: `1px solid ${hov ? 'rgba(255,215,0,0.25)' : T.cardBorder}`,
        borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(16px)',
        opacity: vis ? 1 : 0,
        boxShadow: hov ? '0 12px 40px rgba(255,215,0,0.10)' : '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ background: iconBg, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        {trend && <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: trend.color }}>{trend.label}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color }}>{value}</span>
        {suffix && <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}>{suffix}</span>}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>{label}</div>
      {extraContent}
    </div>
  );
}

function EPICard({ item, idx }: { item: typeof EPI_ITEMS[0]; idx: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(idx * 60 + 100);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card,
        border: `1px solid ${hov ? 'rgba(34,197,94,0.35)' : 'rgba(34,197,94,0.15)'}`,
        borderLeft: `4px solid ${T.green}`,
        borderRadius: 14, padding: '16px 18px', backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        transform: vis ? (hov ? 'translateY(-3px)' : 'translateY(0)') : 'translateY(12px)',
        opacity: vis ? 1 : 0,
        boxShadow: hov ? '0 8px 30px rgba(34,197,94,0.10)' : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: T.greenDim, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color={T.green} />
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: T.textPri }}>{item.name}</span>
        </div>
        <CheckCircle size={16} color={T.green} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>Vérifié: {item.verif}</div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>Prochain: {item.next}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: T.green }}>{item.qty}</div>
          <div style={{ fontFamily: SANS, fontSize: 9, color: T.textDim }}>en stock</div>
        </div>
      </div>
      <span style={{
        display: 'inline-block', marginTop: 8,
        fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '2px 8px',
        borderRadius: 100, background: T.greenDim, color: T.green,
      }}>Conforme ✓</span>
    </div>
  );
}

function TrainingRow({ emp, idx, show }: { emp: typeof TRAINING_OK[0]; idx: number; show: boolean }) {
  if (!show) return null;
  const init = emp.name.split(' ').map(w => w[0]).join('').slice(0, 2);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '2px 28px 1fr auto auto auto',
      alignItems: 'center', gap: 0,
      borderBottom: `1px solid ${T.border}`,
      animation: `tbFadeUp 0.3s ease both`,
      animationDelay: `${idx * 30}ms`,
      padding: '0',
    }}>
      <div style={{ width: 2, height: 40, background: T.green, borderRadius: 1 }} />
      <div style={{ marginLeft: 10, width: 28, height: 28, borderRadius: '50%', background: T.greenDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 9, fontWeight: 800, color: T.green }}>{init}</div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: T.textPri }}>{emp.name}</div>
        <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>{emp.formation}</div>
      </div>
      <div style={{ padding: '0 12px', fontFamily: SANS, fontSize: 10, color: T.textDim }}>{emp.date}</div>
      <div style={{ padding: '0 12px', fontFamily: SANS, fontSize: 10, color: T.textDim }}>{emp.valid}</div>
      <div style={{ padding: '0 12px' }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: T.greenDim, color: T.green, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <CheckCircle size={9} /> À jour
        </span>
      </div>
    </div>
  );
}

function ProcedureCard({ proc, idx }: { proc: typeof PROCEDURES[0]; idx: number }) {
  const [hov, setHov] = useState(false);
  const [btnHov, setBtnHov] = useState(false);
  const vis = useFadeIn(idx * 80);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, border: `1px solid ${hov ? 'rgba(255,215,0,0.25)' : T.cardBorder}`,
        borderRadius: 14, padding: '18px 20px', backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        transform: vis ? (hov ? 'translateY(-3px)' : 'translateY(0)') : 'translateY(12px)',
        opacity: vis ? 1 : 0,
        boxShadow: hov ? '0 10px 30px rgba(255,215,0,0.08)' : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: proc.bg, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <proc.Icon size={18} color={proc.color} />
          </div>
          <div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.textPri }}>{proc.name}</div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginTop: 2, lineHeight: 1.4 }}>{proc.desc}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar size={10} color={T.textDim} />
          <span style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>{proc.rev}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: T.greenDim, color: T.green, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <CheckCircle size={9} /> À jour
          </span>
          <button
            onMouseEnter={() => setBtnHov(true)} onMouseLeave={() => setBtnHov(false)}
            style={{
              background: btnHov ? T.goldDim : 'transparent', color: T.gold,
              border: `1px solid ${T.gold}`, borderRadius: 8,
              padding: '4px 10px', fontFamily: SANS, fontWeight: 700, fontSize: 10,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.15s ease',
            }}
          ><FileText size={10} /> Voir PDF</button>
        </div>
      </div>
    </div>
  );
}

// ─── Contact Card ────────────────────────────────────────────────
function ContactCard({ contact }: { contact: typeof CONTACTS[0] }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card,
        border: `1px solid ${hov ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.15)'}`,
        borderTop: `3px solid ${T.red}`, borderRadius: 14, padding: '20px',
        backdropFilter: 'blur(12px)', transition: 'all 0.3s ease',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 10px 30px rgba(239,68,68,0.12)' : '0 2px 8px rgba(0,0,0,0.2)',
        opacity: 1,
      }}
    >
      <div style={{ background: T.redDim, borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Phone size={20} color={T.red} />
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri, marginBottom: 4 }}>{contact.name}</div>
      <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, color: T.gold, marginBottom: 6 }}>{contact.num}</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginBottom: 10 }}>{contact.type}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100,
          background: contact.critical ? T.redDim : T.yellowDim,
          color: contact.critical ? T.red : T.yellow,
        }}>{contact.dispo}</span>
        <button style={{
          background: T.red, color: '#fff', border: 'none', borderRadius: 8,
          padding: '6px 12px', fontFamily: SANS, fontWeight: 700, fontSize: 11,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        }}><Phone size={11} /> Appeler</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function WorldClassSecurite() {
  const [activeTab, setActiveTab] = useState('Vue d\'ensemble');
  const [hoverIncident, setHoverIncident] = useState(false);
  const [hoverAudit, setHoverAudit] = useState(false);
  const [showAllTraining, setShowAllTraining] = useState(false);
  const TABS = ['Vue d\'ensemble', 'Incidents', 'EPI', 'Formations'];

  // Animated counters
  const cntJours     = useAnimatedCounter(45, 1400);
  const cntFormation = useAnimatedCounter(14, 1200);
  const cntScore     = useAnimatedCounter(96, 1200);
  const cntAudits    = useAnimatedCounter(4, 1000);
  const cntActions   = useAnimatedCounter(2, 1000);

  return (
    <div style={{ fontFamily: SANS, minHeight: '100vh', background: T.bg, color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700;800&display=swap');
        @keyframes tbPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes tbFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tbGlow { 0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.2)} 50%{box-shadow:0 0 50px rgba(255,215,0,0.5)} }
        @keyframes tbCountPulse { 0%,100%{text-shadow:0 0 10px rgba(255,215,0,0.3)} 50%{text-shadow:0 0 30px rgba(255,215,0,0.8)} }
        @keyframes tbSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
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
              <Shield size={20} color={T.gold} /> Sécurité
            </h1>
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginTop: 1 }}>Sécurité du travail et conformité HSE</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onMouseEnter={() => setHoverAudit(true)} onMouseLeave={() => setHoverAudit(false)}
              style={{
                background: hoverAudit ? T.goldDim : 'transparent',
                color: T.gold, border: `1px solid ${T.gold}`, borderRadius: 12,
                padding: '9px 18px', fontFamily: SANS, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.15s ease',
              }}
            ><Star size={13} /> Audit HSE</button>
            <button
              onMouseEnter={() => setHoverIncident(true)} onMouseLeave={() => setHoverIncident(false)}
              style={{
                background: hoverIncident ? '#DC2626' : T.red,
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '10px 20px', fontFamily: SANS, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                transform: hoverIncident ? 'scale(0.97)' : 'scale(1)',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
              }}
            ><AlertTriangle size={13} /> Déclarer Incident</button>
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
      <div style={{ padding: '28px 32px', maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── SECTION 1: KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {/* Jours sans Incident — CELEBRATION */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(17,27,46,0.9) 0%, rgba(255,215,0,0.06) 100%)',
            border: `1px solid rgba(255,215,0,0.3)`,
            borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
            animation: 'tbGlow 3s ease-in-out infinite, tbFadeUp 0.5s ease both',
            animationDelay: '0ms, 80ms',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ background: T.goldDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={18} color={T.gold} />
              </div>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: T.textDim }}>Record: 52j ★</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{
                fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.gold,
                animation: 'tbCountPulse 2s ease-in-out infinite',
              }}>{cntJours}</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}>j</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>Jours sans Incident</div>
            <span style={{
              display: 'inline-block', marginTop: 8,
              fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '2px 8px',
              borderRadius: 100, background: T.goldDim, color: T.gold,
            }}>★ Objectif: 52j</span>
          </div>

          {/* Incidents ce mois */}
          <KPICard
            label="Incidents ce mois" value="0" color={T.green}
            iconBg={T.greenDim} Icon={CheckCircle}
            trend={{ label: '-1 vs mois dernier ✓', color: T.green }}
            delay={160}
          />

          {/* EPI Conformité */}
          <KPICard
            label="EPI Conformité" value="100" suffix="%" color={T.green}
            iconBg={T.greenDim} Icon={Shield}
            trend={{ label: 'maintenu ✓', color: T.green }}
            delay={240}
          />

          {/* Formations à jour */}
          <div style={{
            background: T.card, border: `1px solid ${T.cardBorder}`,
            borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
            transition: 'all 0.3s ease',
            animation: 'tbFadeUp 0.5s ease both', animationDelay: '320ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ background: T.yellowDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={18} color={T.yellow} />
              </div>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: T.yellow }}>2 à planifier</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.yellow }}>{cntFormation}</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}>/16</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>Formations à jour</div>
          </div>
        </div>

        {/* ── SECTION 2: SAFETY SCORE HERO ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(17,27,46,0.95) 0%, rgba(255,215,0,0.08) 50%, rgba(17,27,46,0.95) 100%)',
          border: `1px solid rgba(255,215,0,0.25)`,
          borderRadius: 20, padding: '48px 32px',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
          animation: 'tbGlow 4s ease-in-out infinite',
          boxShadow: '0 0 60px rgba(255,215,0,0.08), inset 0 0 60px rgba(255,215,0,0.03)',
        }}>
          {/* Background glow orb */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Shield icon container */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,215,0,0.15)', border: `2px solid rgba(255,215,0,0.4)`,
            marginBottom: 20,
            animation: 'tbGlow 2s ease-in-out infinite',
          }}>
            <Shield size={40} color={T.gold} />
          </div>

          {/* Hero number */}
          <div style={{ fontFamily: MONO, fontSize: 64, fontWeight: 800, color: T.gold, lineHeight: 1, animation: 'tbCountPulse 2s ease-in-out infinite' }}>
            45 JOURS
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 20, color: T.textPri, marginTop: 8, letterSpacing: '0.1em' }}>
            SANS INCIDENT
          </div>

          {/* Progress toward record */}
          <div style={{ maxWidth: 480, margin: '28px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: SANS, fontSize: 12, color: T.textDim }}>Progression vers le record</span>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: T.gold }}>86.5%</span>
            </div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: '86.5%',
                background: `linear-gradient(90deg, ${T.gold}, #FFE44D)`,
                borderRadius: 100,
                boxShadow: '0 0 12px rgba(255,215,0,0.5)',
                transition: 'width 1.5s ease',
              }} />
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: T.gold, marginTop: 8, opacity: 0.7 }}>
              Prochain record dans <strong>7 jours</strong>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginTop: 4 }}>
              Record actuel: 52 jours — 15 Décembre 2023
            </div>
          </div>
        </div>

        {/* ── SECTION 3: INCIDENT HISTORY ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 20 }}>
          {/* Bar chart */}
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Historique Incidents</span>
              <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>6 derniers mois</span>
              <span style={{ background: T.redDim, color: T.red, padding: '2px 8px', borderRadius: 100, fontFamily: SANS, fontSize: 10, fontWeight: 700 }}>4 incidents total</span>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={INCIDENT_HISTORY} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <ReferenceLine y={0} stroke={T.green} strokeDasharray="4 4" strokeWidth={2} label={{ value: 'Objectif', fill: T.green, fontSize: 10, position: 'insideTopLeft' }} />
                <Bar dataKey="incidents" name="Incidents"         fill={T.red}    radius={[4,4,0,0]} isAnimationActive animationDuration={1000} />
                <Bar dataKey="presqu"    name="Presqu'Accidents"  fill={T.yellow} radius={[4,4,0,0]} isAnimationActive animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut chart */}
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri, marginBottom: 16 }}>Par Type</div>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={INCIDENT_TYPES} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={2} isAnimationActive animationDuration={800}>
                    {INCIDENT_TYPES.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: T.red, lineHeight: 1 }}>4</div>
                <div style={{ fontFamily: SANS, fontSize: 9, color: T.textDim, lineHeight: 1.2 }}>incidents</div>
                <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: T.blue, lineHeight: 1, marginTop: 3 }}>13</div>
                <div style={{ fontFamily: SANS, fontSize: 9, color: T.textDim, lineHeight: 1.2 }}>presqu'acc.</div>
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {INCIDENT_TYPES.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: SANS, fontSize: 11, color: T.textSec, flex: 1 }}>{d.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION 4: EPI COMPLIANCE ── */}
        <div>
          <SectionHeader
            icon={Shield}
            title="Conformité EPI (Équipements de Protection Individuelle)"
            badges={[{ label: '100% ✓', color: T.green, bg: T.greenDim }]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {EPI_ITEMS.map((item, idx) => <EPICard key={idx} item={item} idx={idx} />)}
          </div>
        </div>

        {/* ── SECTION 5: SAFETY TRAINING ── */}
        <div>
          <SectionHeader
            icon={BookOpen}
            title="Formations Sécurité"
            badges={[
              { label: '14/16 à jour', color: T.yellow, bg: T.yellowDim },
              { label: '2 à planifier', color: T.red, bg: T.redDim },
            ]}
          />

          {/* Completed rows */}
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.green, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> 14 employés à jour
              </span>
              <button
                onClick={() => setShowAllTraining(v => !v)}
                style={{ background: 'transparent', border: 'none', color: T.gold, fontFamily: SANS, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >{showAllTraining ? 'Réduire ▲' : `Voir les 14 ▼`}</button>
            </div>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '2px 28px 1fr auto auto auto', gap: 0, padding: '8px 0', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${T.border}` }}>
              <div /><div />
              {['Employé', 'Date', 'Validité', 'Status'].map(h => (
                <div key={h} style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 12px' }}>{h}</div>
              ))}
            </div>
            {TRAINING_OK.map((emp, idx) => (
              <TrainingRow key={idx} emp={emp} idx={idx} show={showAllTraining || idx < 6} />
            ))}
          </div>

          {/* Needs training */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Omar Idrissi — Urgent */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(17,27,46,0.95) 100%)',
              border: `1px solid rgba(251,191,36,0.25)`, borderLeft: `4px solid ${T.yellow}`,
              borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)',
              animation: 'tbFadeUp 0.4s ease both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.yellowDim, border: `1px solid ${T.yellow}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, fontWeight: 800, color: T.yellow }}>OI</div>
                  <div>
                    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Omar Idrissi</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Laborantin — Qualité</div>
                  </div>
                </div>
                <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: T.yellowDim, color: T.yellow, animation: 'tbPulse 2s infinite' }}>⚠ Urgent</span>
              </div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 4 }}>Formation manquante: Renouvellement HSE Labo</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: T.red, marginBottom: 16 }}>Dernière formation: 20 Fév 2023 — Expirée depuis 5 jours</div>
              <button style={{
                background: T.gold, color: T.bg, border: 'none', borderRadius: 10,
                padding: '9px 18px', fontFamily: SANS, fontWeight: 700, fontSize: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}><BookOpen size={13} /> Planifier Formation</button>
            </div>

            {/* Said Bouazza — Critique */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(17,27,46,0.95) 100%)',
              border: `1px solid rgba(239,68,68,0.3)`, borderLeft: `4px solid ${T.red}`,
              borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)',
              animation: 'tbFadeUp 0.4s ease both', animationDelay: '80ms',
              boxShadow: '0 0 30px rgba(239,68,68,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.redDim, border: `1px solid ${T.red}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, fontWeight: 800, color: T.red }}>SB</div>
                  <div>
                    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Said Bouazza</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Manoeuvre — Production</div>
                  </div>
                </div>
                <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: T.redDim, color: T.red, animation: 'tbPulse 1.5s infinite' }}>🔴 Critique</span>
              </div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.textPri, marginBottom: 4 }}>Formation manquante: HSE Général Initial</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: T.red, fontWeight: 700, marginBottom: 16, animation: 'tbPulse 2s infinite' }}>⚠ Jamais formé — CRITIQUE</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{
                  background: T.gold, color: T.bg, border: 'none', borderRadius: 10,
                  padding: '9px 18px', fontFamily: SANS, fontWeight: 700, fontSize: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}><BookOpen size={13} /> Planifier Formation</button>
                <button style={{
                  background: 'transparent', color: T.red, border: `1px solid ${T.red}`, borderRadius: 10,
                  padding: '9px 18px', fontFamily: SANS, fontWeight: 700, fontSize: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}><AlertTriangle size={13} /> Suspension Travail</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 6: SAFETY PROCEDURES ── */}
        <div>
          <SectionHeader title="Procédures de Sécurité" icon={Shield} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {PROCEDURES.map((proc, idx) => <ProcedureCard key={idx} proc={proc} idx={idx} />)}
          </div>
        </div>

        {/* ── SECTION 7: EMERGENCY CONTACTS ── */}
        <div>
          <SectionHeader
            icon={Phone}
            title="Contacts d'Urgence"
            badges={[{ label: '🚨 URGENCE', color: '#fff', bg: T.red }]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {CONTACTS.map((c, i) => <ContactCard key={i} contact={c} />)}
          </div>
        </div>

        {/* ── SECTION 8: MONTHLY SAFETY REPORT ── */}
        <div>
          <SectionHeader icon={Star} title="Rapport Mensuel Sécurité" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
            {/* Score HSE */}
            <div style={{
              background: T.card, border: `1px solid ${T.cardBorder}`,
              borderRadius: 16, padding: '22px', backdropFilter: 'blur(12px)',
              transition: 'all 0.3s ease',
              animation: 'tbFadeUp 0.5s ease both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ background: T.goldDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={18} color={T.gold} />
                </div>
                <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>Excellent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.gold }}>{cntScore}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}>/100</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: T.textSec, marginBottom: 10 }}>Score HSE Mensuel</div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '96%', background: `linear-gradient(90deg, ${T.gold}, #FFE44D)`, borderRadius: 100 }} />
              </div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginTop: 6 }}>96/100 — Excellent</div>
            </div>

            {/* Audits Réalisés */}
            <div style={{
              background: T.card, border: `1px solid ${T.cardBorder}`,
              borderRadius: 16, padding: '22px', backdropFilter: 'blur(12px)',
              animation: 'tbFadeUp 0.5s ease both', animationDelay: '100ms',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ background: T.greenDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={18} color={T.green} />
                </div>
                <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>100% complétés</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.green }}>{cntAudits}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}>/4</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: T.textSec, marginBottom: 6 }}>Audits Réalisés</div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>100% complétés ce mois</div>
            </div>

            {/* Actions Correctives */}
            <div style={{
              background: T.card, border: `1px solid ${T.cardBorder}`,
              borderRadius: 16, padding: '22px', backdropFilter: 'blur(12px)',
              animation: 'tbFadeUp 0.5s ease both', animationDelay: '200ms',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ background: T.greenDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings size={18} color={T.green} />
                </div>
                <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>100% clôturées</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.green }}>{cntActions}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}>/2</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: T.textSec, marginBottom: 6 }}>Actions Correctives</div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>100% clôturées</div>
            </div>
          </div>

          {/* Compliance banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.08) 100%)',
            border: `1px solid rgba(34,197,94,0.3)`, borderRadius: 14,
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 0 30px rgba(34,197,94,0.08)',
          }}>
            <CheckCircle size={20} color={T.green} />
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.green }}>
              Site conforme aux normes HSE
            </span>
            <span style={{ fontFamily: SANS, fontSize: 12, color: T.textDim }}>
              — Dernier audit: 15 Février 2024 — Prochain: 15 Mars 2024
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
