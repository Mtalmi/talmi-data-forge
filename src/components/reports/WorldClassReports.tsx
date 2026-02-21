import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  FileText, Clock, Download, Calendar, Factory,
  TrendingUp, Banknote, Shield, Truck, Users,
  Eye, Bell,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#FFD700',
  goldGlow:   'rgba(255,215,0,0.25)',
  goldBorder: 'rgba(255,215,0,0.3)',
  navy:       '#0B1120',
  cardBg:     'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#3B82F6',
  purple:     '#8B5CF6',
  pink:       '#EC4899',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

// ─────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

// ─────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────
function Card({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        background: T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        transform: press
          ? 'translateY(-1px) scale(0.997)'
          : hov
          ? 'translateY(-4px) scale(1.006)'
          : 'none',
        boxShadow: hov
          ? `0 12px 32px rgba(0,0,0,0.3), 0 0 24px ${T.goldGlow}`
          : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
        ...style,
      }}
    >
      {/* Gold shimmer top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
        opacity: hov ? 1 : 0,
        transition: 'opacity 220ms',
      }} />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────
function Badge({
  label, color, bg, pulse = false,
}: { label: string; color: string; bg: string; pulse?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      animation: pulse ? 'tbos-pulse 2s infinite' : 'none',
      flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, right }: {
  icon: any; label: string; right?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <span style={{
        color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
        fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '2px',
      }}>
        {label}
      </span>
      <div style={{
        flex: 1, height: 1,
        background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)`,
      }} />
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// DARK TOOLTIP
// ─────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#162036', border: `1px solid ${T.cardBorder}`,
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }}>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 6, fontSize: 12 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.stroke || p.fill || T.gold, fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{Number(p.value).toLocaleString('fr-FR')}</strong>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────
const TEMPLATES = [
  {
    title: 'Production Journalière',
    desc: 'Volume, qualité, batches du jour',
    freq: 'Quotidien', freqColor: T.gold,
    icon: Factory, iconColor: T.gold,
    delay: 0,
  },
  {
    title: 'Rapport Commercial',
    desc: 'Pipeline, conversions, CA',
    freq: 'Hebdomadaire', freqColor: T.info,
    icon: TrendingUp, iconColor: T.info,
    delay: 80,
  },
  {
    title: 'État Financier',
    desc: 'P&L, trésorerie, conformité',
    freq: 'Mensuel', freqColor: T.success,
    icon: Banknote, iconColor: T.success,
    delay: 160,
  },
  {
    title: 'Analyse Qualité',
    desc: 'Conformité, variances, tendances',
    freq: 'Hebdomadaire', freqColor: T.info,
    icon: Shield, iconColor: T.purple,
    delay: 240,
  },
  {
    title: 'Suivi Livraisons',
    desc: 'Ponctualité, volumes, flotte',
    freq: 'Quotidien', freqColor: T.gold,
    icon: Truck, iconColor: T.warning,
    delay: 320,
  },
  {
    title: 'Rapport RH',
    desc: 'Présence, heures, productivité',
    freq: 'Mensuel', freqColor: T.success,
    icon: Users, iconColor: T.pink,
    delay: 400,
  },
];

const TYPE_COLORS: Record<string, string> = {
  Production: T.gold,
  Commercial: T.info,
  Financier: T.success,
  Qualité: T.purple,
  Livraisons: T.warning,
};

const PIE_DATA = [
  { name: 'Production', value: 5, color: T.gold },
  { name: 'Commercial', value: 3, color: T.info },
  { name: 'Financier',  value: 2, color: T.success },
  { name: 'Qualité',    value: 1, color: T.purple },
  { name: 'Livraisons', value: 1, color: T.warning },
];

const TREND_DATA = [
  { month: 'Sep', rapports: 8 },
  { month: 'Oct', rapports: 10 },
  { month: 'Nov', rapports: 9 },
  { month: 'Déc', rapports: 14 },
  { month: 'Jan', rapports: 11 },
  { month: 'Fév', rapports: 12 },
];

const RECENT_REPORTS = [
  { name: 'Production_20Fev2024.pdf', type: 'Production', date: "Aujourd'hui", by: 'Système',  size: '2.4 MB' },
  { name: 'Commercial_S07.pdf',       type: 'Commercial', date: '17 Fév',      by: 'Karim B.', size: '1.8 MB' },
  { name: 'Financier_Jan2024.pdf',    type: 'Financier',  date: '01 Fév',      by: 'Système',  size: '3.2 MB' },
  { name: 'Qualite_S06.pdf',          type: 'Qualité',    date: '10 Fév',      by: 'Fatima Z.',size: '1.1 MB' },
  { name: 'Livraisons_19Fev.pdf',     type: 'Livraisons', date: 'Hier',        by: 'Système',  size: '0.8 MB' },
];

const SCHEDULED = [
  {
    title: 'Production Journalière',
    freq: 'Chaque jour à 18h',
    next: "Aujourd'hui 18:00",
    recipient: 'Direction',
    delay: 0,
  },
  {
    title: 'Rapport Commercial',
    freq: 'Chaque lundi à 09h',
    next: '24 Fév 09:00',
    recipient: 'Équipe Ventes',
    delay: 100,
  },
  {
    title: 'État Financier',
    freq: '1er de chaque mois',
    next: '01 Mars 08:00',
    recipient: 'Direction + Finance',
    delay: 200,
  },
];

// ─────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────

function KPICard({
  label, value, isText = false, suffix, color, icon: Icon, trend, delay = 0,
}: {
  label: string; value: number | string; isText?: boolean;
  suffix?: string; color: string; icon: any; trend?: string; delay?: number;
}) {
  const animated = useAnimatedCounter(isText ? 0 : Number(value), 1200);
  const visible = useFadeIn(delay);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 600ms ease-out',
    }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{
              color: T.textDim, fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            }}>{label}</p>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 28,
              fontWeight: 800, color, lineHeight: 1.1,
            }}>
              {isText ? value : animated}
              {suffix && (
                <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginLeft: 5 }}>
                  {suffix}
                </span>
              )}
            </p>
            {trend && (
              <p style={{ fontSize: 10, color: T.success, marginTop: 6, fontWeight: 600 }}>
                ↑ {trend}
              </p>
            )}
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${color}18`, border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={18} color={color} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function TemplateCard({ tpl }: { tpl: typeof TEMPLATES[0] }) {
  const visible = useFadeIn(tpl.delay);
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  const Icon = tpl.icon;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? press ? 'translateY(-1px) scale(0.997)' : hov ? 'translateY(-4px) scale(1.006)' : 'translateY(0)'
          : 'translateY(24px)',
        transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
        background: T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: hov
          ? `0 12px 32px rgba(0,0,0,0.3), 0 0 24px ${T.goldGlow}`
          : '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {/* Shimmer top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${tpl.iconColor}, transparent)`,
        opacity: hov ? 1 : 0, transition: 'opacity 220ms',
      }} />

      {/* Icon + freq badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `${tpl.iconColor}18`, border: `1px solid ${tpl.iconColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={tpl.iconColor} />
        </div>
        <Badge
          label={tpl.freq}
          color={tpl.freqColor}
          bg={`${tpl.freqColor}18`}
        />
      </div>

      {/* Title + desc */}
      <div>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
          fontSize: 15, color: T.textPri, marginBottom: 5,
        }}>{tpl.title}</p>
        <p style={{
          color: T.textDim, fontSize: 12, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        } as React.CSSProperties}>{tpl.desc}</p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <SmallBtn label="Générer" variant="gold" />
        <SmallBtn label="Planifier" variant="outline" />
      </div>
    </div>
  );
}

function SmallBtn({ label, variant }: { label: string; variant: 'gold' | 'outline' }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1,
        padding: '6px 10px',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'DM Sans, sans-serif',
        cursor: 'pointer',
        transition: 'all 180ms',
        border: variant === 'gold'
          ? 'none'
          : `1px solid ${T.goldBorder}`,
        background: variant === 'gold'
          ? hov ? '#FFE44D' : T.gold
          : hov ? `${T.gold}18` : 'transparent',
        color: variant === 'gold' ? T.navy : T.gold,
      }}
    >
      {label}
    </button>
  );
}

function ReportRow({ report, delay = 0 }: { report: typeof RECENT_REPORTS[0]; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const typeColor = TYPE_COLORS[report.type] || T.gold;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px', borderRadius: 10,
        background: hov ? `${T.cardBorder}50` : 'transparent',
        border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
        transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(16px)',
        opacity: visible ? 1 : 0,
        transition: 'all 380ms ease-out',
        cursor: 'pointer',
      }}
    >
      {/* File icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: `${typeColor}15`, border: `1px solid ${typeColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <FileText size={16} color={typeColor} />
      </div>

      {/* Name */}
      <div style={{ minWidth: 200, flex: 1 }}>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
          fontSize: 13, color: T.textPri, marginBottom: 3,
        }}>{report.name}</p>
        <Badge label={report.type} color={typeColor} bg={`${typeColor}15`} />
      </div>

      {/* Date */}
      <div style={{ minWidth: 90, flexShrink: 0 }}>
        <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Date</p>
        <p style={{ color: T.textSec, fontSize: 12 }}>{report.date}</p>
      </div>

      {/* Generated by */}
      <div style={{ minWidth: 100, flexShrink: 0 }}>
        <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Généré par</p>
        <p style={{ color: T.textSec, fontSize: 12 }}>{report.by}</p>
      </div>

      {/* Size */}
      <div style={{ minWidth: 70, flexShrink: 0 }}>
        <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Taille</p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textDim }}>
          {report.size}
        </p>
      </div>

      {/* Status */}
      <div style={{ minWidth: 60, flexShrink: 0 }}>
        <Badge label="Prêt" color={T.success} bg={`${T.success}15`} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <ActionBtn icon={Download} label="Télécharger" variant="gold" />
        <ActionBtn icon={Eye} label="Voir" variant="outline" />
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, variant }: {
  icon: any; label: string; variant: 'gold' | 'outline';
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 10px', borderRadius: 7,
        fontSize: 10, fontWeight: 700,
        fontFamily: 'DM Sans, sans-serif',
        cursor: 'pointer', transition: 'all 180ms',
        border: variant === 'gold' ? 'none' : `1px solid ${T.goldBorder}`,
        background: variant === 'gold'
          ? hov ? '#FFE44D' : T.gold
          : hov ? `${T.gold}18` : 'transparent',
        color: variant === 'gold' ? T.navy : T.gold,
      }}
    >
      <Icon size={11} />
      {label}
    </button>
  );
}

function ScheduledCard({ item }: { item: typeof SCHEDULED[0] }) {
  const visible = useFadeIn(item.delay);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 600ms ease-out',
    }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
            fontSize: 14, color: T.textPri,
          }}>{item.title}</p>
          <Badge label="Actif" color={T.success} bg={`${T.success}15`} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Calendar size={12} color={T.textDim} />
          <span style={{ color: T.textDim, fontSize: 12 }}>{item.freq}</span>
        </div>

        <div style={{ marginBottom: 6 }}>
          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Prochain envoi</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.gold }}>
            {item.next}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Users size={12} color={T.textDim} />
          <span style={{ color: T.textSec, fontSize: 12 }}>{item.recipient}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <OutlineBtn label="Modifier" />
          <OutlineBtn label="Désactiver" danger />
        </div>
      </Card>
    </div>
  );
}

function OutlineBtn({ label, danger = false }: { label: string; danger?: boolean }) {
  const [hov, setHov] = useState(false);
  const borderColor = danger ? T.danger : T.goldBorder;
  const textColor = danger ? T.danger : T.gold;
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, padding: '6px 10px', borderRadius: 8,
        fontSize: 11, fontWeight: 700,
        fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
        border: `1px solid ${borderColor}`,
        background: hov ? `${textColor}18` : 'transparent',
        color: textColor, transition: 'all 180ms',
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassReports() {
  const [activeTab, setActiveTab] = useState('production');
  const TABS = [
    { id: 'production', label: 'Production' },
    { id: 'commercial', label: 'Commercial' },
    { id: 'financier',  label: 'Financier' },
    { id: 'custom',     label: 'Custom' },
  ];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.navy, minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.8} }
      `}</style>

      {/* ══════════════════════════════════════════════
          STICKY HEADER
      ══════════════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.93)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`, padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.gold}, #B8860B)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={18} color={T.navy} />
            </div>
            <div>
              <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>Rapports</span>
              <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1, marginTop: 1 }}>
                Centre de reporting et analyse
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 18px', borderRadius: 8, cursor: 'pointer',
                  background: activeTab === tab.id ? `${T.gold}18` : 'transparent',
                  border: activeTab === tab.id ? `1px solid ${T.goldBorder}` : '1px solid transparent',
                  color: activeTab === tab.id ? T.gold : T.textSec,
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13,
                  transition: 'all 200ms',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Bell size={18} color={T.textSec} />
              <div style={{
                position: 'absolute', top: -4, right: -4,
                width: 8, height: 8, borderRadius: '50%', background: T.danger,
              }} />
            </div>
            <GenerateBtn />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 44 }}>

        {/* ── SECTION 1: KPIs ── */}
        <section>
          <SectionHeader icon={FileText} label="Indicateurs Rapports" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard label="Rapports ce mois"   value={12} color={T.gold}    icon={FileText}  trend="+3 vs mois dernier" delay={0} />
            <KPICard label="Dernier Rapport"     value="Aujourd'hui" isText color={T.success} icon={Clock} delay={80} />
            <KPICard label="Exports"             value={34} color={T.info}    icon={Download}  trend="+12 ce mois" delay={160} />
            <KPICard label="Rapports Planifiés"  value={3}  color={T.warning} icon={Calendar}  delay={240} />
          </div>
        </section>

        {/* ── SECTION 2: TEMPLATES ── */}
        <section>
          <SectionHeader icon={FileText} label="Modèles de Rapports" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {TEMPLATES.map((tpl, i) => <TemplateCard key={i} tpl={tpl} />)}
          </div>
        </section>

        {/* ── SECTION 3: STATS ── */}
        <section>
          <SectionHeader icon={TrendingUp} label="Statistiques de Génération" />
          <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: 20 }}>

            {/* Donut */}
            <Card className="tbos-card-stagger">
              <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 16 }}>Par Type</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  {PIE_DATA.map((seg, i) => (
                    <Pie
                      key={seg.name}
                      data={[seg]}
                      cx="50%" cy="50%"
                      innerRadius={54} outerRadius={76}
                      paddingAngle={0}
                      dataKey="value"
                      startAngle={90 - PIE_DATA.slice(0, i).reduce((a, s) => a + (s.value / 12) * 360, 0)}
                      endAngle={90 - PIE_DATA.slice(0, i + 1).reduce((a, s) => a + (s.value / 12) * 360, 0)}
                      isAnimationActive
                      animationBegin={i * 140}
                      animationDuration={550}
                      label={false}
                      labelLine={false}
                    >
                      <Cell fill={seg.color} />
                    </Pie>
                  ))}
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      const pct = Math.round((Number(d.value) / 12) * 100);
                      return (
                        <div style={{ background: '#162036', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '8px 12px' }}>
                          <p style={{ color: d.payload.color, fontWeight: 700, fontSize: 12 }}>{d.name}</p>
                          <p style={{ color: T.textSec, fontSize: 11 }}>{d.value} rapports ({pct}%)</p>
                        </div>
                      );
                    }}
                  />
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, fill: T.gold }}>
                    12
                  </text>
                  <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fill: T.textSec }}>
                    rapports
                  </text>
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
                {PIE_DATA.map(seg => (
                  <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                    <span style={{ color: T.textSec, fontSize: 11 }}>{seg.name}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: seg.color, marginLeft: 'auto' }}>
                      {seg.value} <span style={{ color: T.textDim }}>({Math.round((seg.value / 12) * 100)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Area chart */}
            <Card className="tbos-card-stagger">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri }}>Tendance</p>
                <Badge label="64 total" color={T.gold} bg={`${T.gold}18`} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rapportsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.gold} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false}
                    tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fill: T.textDim, fontSize: 10 }} />
                  <RechartsTooltip content={<DarkTooltip />} cursor={{ stroke: `${T.gold}40` }} />
                  <Area
                    dataKey="rapports" name="Rapports"
                    type="monotone" stroke={T.gold} strokeWidth={2.5}
                    fill="url(#rapportsGrad)"
                    isAnimationActive animationDuration={1000}
                    dot={{ fill: T.gold, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </section>

        {/* ── SECTION 4: RECENT REPORTS ── */}
        <section>
          <SectionHeader
            icon={FileText}
            label="Rapports Récents"
            right={<span style={{ color: T.textDim, fontSize: 11 }}>5 rapports</span>}
          />
          <Card>
            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 110px 100px 90px 70px 200px',
              gap: 14, padding: '4px 16px 12px',
              borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 6,
            }}>
              {['', 'Rapport', 'Date', 'Généré par', 'Taille', 'Statut', 'Actions'].map((h, i) => (
                <span key={i} style={{
                  color: T.textDim, fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {h}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {RECENT_REPORTS.map((r, i) => (
                <ReportRow key={r.name} report={r} delay={i * 60} />
              ))}
            </div>
          </Card>
        </section>

        {/* ── SECTION 5: SCHEDULED REPORTS ── */}
        <section>
          <SectionHeader icon={Calendar} label="Rapports Planifiés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {SCHEDULED.map((item, i) => <ScheduledCard key={i} item={item} />)}
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>
            TBOS Rapports v2.0 — {new Date().toLocaleString('fr-FR')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: T.success, animation: 'tbos-pulse 2.5s infinite',
            }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Système opérationnel</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// GENERATE BUTTON (extracted to avoid hook-in-callback)
// ─────────────────────────────────────────────────────
function GenerateBtn() {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        padding: '7px 18px', borderRadius: 8,
        background: hov ? '#FFE44D' : T.gold,
        color: T.navy, fontFamily: 'DM Sans, sans-serif',
        fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer',
        transform: press ? 'scale(0.96)' : 'scale(1)',
        transition: 'all 160ms',
      }}
    >
      + Générer Rapport
    </button>
  );
}
