import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import {
  Package, Calendar, TrendingUp, Zap, ArrowUp, ArrowRight, ArrowDown,
  AlertTriangle, Download, Truck, Settings, CheckCircle, Minus,
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
  gray: '#64748B',
  grayDim: 'rgba(100,116,139,0.12)',
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
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return vis;
}

// ─── Sub-components ──────────────────────────────────────────────
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
          animation: b.pulse ? 'pulse 2s infinite' : undefined,
        }}>{b.label}</span>
      ))}
    </div>
  );
}

function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number | string; color: string }[]; label?: string }) {
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

function KPICard({ label, value, suffix, color, iconBg, Icon, trend, delay, isText }:{
  label: string; value: number | string; suffix?: string; color: string;
  iconBg: string; Icon: React.ElementType;
  trend?: { label: string; color: string };
  delay: number; isText?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  const numVal = typeof value === 'number' ? value : 0;
  const count = useAnimatedCounter(isText ? 0 : numVal, 1200, numVal % 1 !== 0 ? 1 : 0);

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
        <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color }}>
          {isText ? value : (typeof value === 'number' && value % 1 !== 0 ? (Number(count) / 10).toFixed(1) : count)}
        </span>
        {suffix && <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}>{suffix}</span>}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────
const PRICE_ROWS = [
  { article: 'Ciment CPA 55',       fournisseur: 'LafargeHolcim', cat: 'Ciment',    prix: '1 200 DH/T', prev: '1 150 DH/T', variation: +4.3, maj: '01 Fév' },
  { article: 'Ciment CPJ 45',       fournisseur: 'CIMAT',         cat: 'Ciment',    prix: '1 050 DH/T', prev: '1 020 DH/T', variation: +2.9, maj: '01 Fév' },
  { article: 'Adjuvant Plastifiant',fournisseur: 'Sika Maroc',    cat: 'Adjuvant',  prix: '35 DH/L',    prev: '34 DH/L',    variation: +2.9, maj: '15 Jan' },
  { article: 'Adjuvant Retardateur',fournisseur: 'Sika Maroc',    cat: 'Adjuvant',  prix: '42 DH/L',    prev: '42 DH/L',    variation:  0,   maj: '15 Jan' },
  { article: 'Gravette 8/15',       fournisseur: 'Carrière Atlas',cat: 'Granulat',  prix: '120 DH/T',   prev: '115 DH/T',   variation: +4.3, maj: '01 Fév' },
  { article: 'Gravette 15/25',      fournisseur: 'Carrière Atlas',cat: 'Granulat',  prix: '110 DH/T',   prev: '108 DH/T',   variation: +1.9, maj: '01 Fév' },
  { article: 'Sable 0/4',           fournisseur: 'Sablière Nord', cat: 'Granulat',  prix: '85 DH/T',    prev: '80 DH/T',    variation: +6.3, maj: '01 Fév' },
  { article: 'Eau industrielle',    fournisseur: 'ONEE',          cat: 'Autre',     prix: '12 DH/m³',   prev: '12 DH/m³',   variation:  0,   maj: '01 Jan' },
];

const CAT_COLORS: Record<string, { color: string; bg: string }> = {
  Ciment:   { color: T.gold,   bg: T.goldDim },
  Adjuvant: { color: T.purple, bg: T.purpleDim },
  Granulat: { color: T.blue,   bg: T.blueDim },
  Autre:    { color: T.gray,   bg: T.grayDim },
};

const CEMENT_TREND = [
  { month: 'Sep', cpa: 1100, cpj: 980 },
  { month: 'Oct', cpa: 1120, cpj: 990 },
  { month: 'Nov', cpa: 1130, cpj: 1000 },
  { month: 'Déc', cpa: 1140, cpj: 1010 },
  { month: 'Jan', cpa: 1150, cpj: 1020 },
  { month: 'Fév', cpa: 1200, cpj: 1050 },
];

const GRANULAT_TREND = [
  { month: 'Sep', g815: 108, g1525: 100, sable: 72 },
  { month: 'Oct', g815: 110, g1525: 102, sable: 74 },
  { month: 'Nov', g815: 112, g1525: 104, sable: 76 },
  { month: 'Déc', g815: 113, g1525: 105, sable: 78 },
  { month: 'Jan', g815: 115, g1525: 108, sable: 80 },
  { month: 'Fév', g815: 120, g1525: 110, sable: 85 },
];

const COST_IMPACT = [
  { product: 'B25',    prev: 2735, curr: 2850, impact: '+4.2%' },
  { product: 'B30',    prev: 3120, curr: 3258, impact: '+4.4%' },
  { product: 'B35',    prev: 3480, curr: 3632, impact: '+4.4%' },
  { product: 'B40',    prev: 3850, curr: 4025, impact: '+4.5%' },
  { product: 'B25-PMP',prev: 2890, curr: 3015, impact: '+4.3%' },
  { product: 'B30-SP', prev: 3250, curr: 3405, impact: '+4.8%' },
];

const CIMENT_SUPPLIERS = [
  { nom: 'LafargeHolcim',     prix: '1 200 DH/T', prixNum: 1200, variation: +4.3, livraison: '48h', stars: 5, isCurrent: true, isLowest: false },
  { nom: 'CIMAT',             prix: '1 180 DH/T', prixNum: 1180, variation: +3.5, livraison: '72h', stars: 4, isCurrent: false, isLowest: true  },
  { nom: 'Ciments du Maroc',  prix: '1 220 DH/T', prixNum: 1220, variation: +5.1, livraison: '48h', stars: 4, isCurrent: false, isLowest: false },
];

const GRAVETTE_SUPPLIERS = [
  { nom: 'Carrière Atlas', prix: '120 DH/T', prixNum: 120, variation: +4.3, livraison: '24h', stars: 4, isCurrent: true,  isLowest: false },
  { nom: 'Carrière Sud',   prix: '118 DH/T', prixNum: 118, variation: +3.5, livraison: '48h', stars: 3, isCurrent: false, isLowest: true  },
  { nom: 'Carrière Rif',   prix: '125 DH/T', prixNum: 125, variation: +6.0, livraison: '72h', stars: 4, isCurrent: false, isLowest: false },
];

const ALERTS = [
  { article: 'Sable 0/4',      type: 'Hausse importante',  detail: '+6.3% en 1 mois',  seuil: 'Seuil dépassé: 5%',  since: 'Hausse depuis Oct 2023', action: 'Renégocier' },
  { article: 'Gravette 8/15',  type: 'Hausse continue',    detail: '+11.1% sur 6 mois',seuil: 'Seuil dépassé: 10%', since: 'Hausse depuis Sep 2023', action: 'Chercher alternative' },
  { article: 'Ciment CPA 55',  type: 'Hausse importante',  detail: '+9.1% sur 6 mois', seuil: 'Seuil dépassé: 8%',  since: 'Hausse depuis Sep 2023', action: 'Renégocier' },
];

const BATCH_ITEMS = [
  { name: 'Ciment CPA 55',       qty: '350 kg',   pu: '1.20 DH/kg',  cost: 420,    pct: 14.7, barColor: T.gold   },
  { name: 'Gravette 8/15',       qty: '525 kg',   pu: '0.12 DH/kg',  cost: 63,     pct: 2.2,  barColor: T.gold   },
  { name: 'Gravette 15/25',      qty: '525 kg',   pu: '0.11 DH/kg',  cost: 57.75,  pct: 2.0,  barColor: T.gold   },
  { name: 'Sable 0/4',           qty: '800 kg',   pu: '0.085 DH/kg', cost: 68,     pct: 2.4,  barColor: T.gold   },
  { name: 'Eau',                 qty: '175 L',    pu: '0.012 DH/L',  cost: 2.10,   pct: 0.1,  barColor: T.gold   },
  { name: 'Adjuvant Plastifiant',qty: '2.5 L',    pu: '35 DH/L',     cost: 87.50,  pct: 3.1,  barColor: T.gold   },
  { name: "Main d'Oeuvre",       qty: '—',        pu: '—',           cost: 850,    pct: 29.8, barColor: T.blue   },
  { name: 'Transport',           qty: '—',        pu: '—',           cost: 450,    pct: 15.8, barColor: T.green  },
  { name: 'Frais Généraux',      qty: '—',        pu: '—',           cost: 851.65, pct: 29.9, barColor: T.purple },
];

const DONUT_DATA = [
  { name: 'Matières',       value: 698.35, color: T.gold   },
  { name: "Main d'oeuvre",  value: 850,    color: T.blue   },
  { name: 'Transport',      value: 450,    color: T.green  },
  { name: 'Frais généraux', value: 851.65, color: T.purple },
];

// ─── Row Component ────────────────────────────────────────────────
function PriceRow({ row, idx }: { row: typeof PRICE_ROWS[0]; idx: number }) {
  const [hov, setHov] = useState(false);
  const cat = CAT_COLORS[row.cat] ?? { color: T.gray, bg: T.grayDim };
  const barColor = row.variation > 0 ? T.red : row.variation < 0 ? T.green : T.gray;
  const varColor = row.variation > 0 ? T.red : row.variation < 0 ? T.green : T.gray;
  const varBg    = row.variation > 0 ? T.redDim : row.variation < 0 ? T.greenDim : T.grayDim;
  const VarIcon  = row.variation > 0 ? ArrowUp : row.variation < 0 ? ArrowDown : ArrowRight;
  const trendLabel = row.variation > 0 ? 'Hausse' : row.variation < 0 ? 'Baisse' : 'Stable';
  const TrendIcon  = row.variation > 0 ? TrendingUp : row.variation < 0 ? ArrowDown : Minus;
  const trendColor = row.variation > 0 ? T.red : row.variation < 0 ? T.green : T.gray;
  const initials = row.fournisseur.split(' ').map(w => w[0]).slice(0, 2).join('');

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid', gridTemplateColumns: '4px 1fr 140px 100px 140px 120px 100px 120px',
        alignItems: 'center', gap: 0,
        background: hov ? 'rgba(255,215,0,0.04)' : 'transparent',
        transform: hov ? 'translateX(4px)' : 'translateX(0)',
        transition: 'all 0.2s ease',
        borderBottom: `1px solid ${T.border}`,
        animation: `fadeUp 0.35s ease both`,
        animationDelay: `${idx * 60}ms`,
        cursor: 'default',
      }}
    >
      {/* Color bar */}
      <div style={{ width: 4, height: '100%', minHeight: 56, background: barColor, borderRadius: '2px 0 0 2px' }} />

      {/* Article */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: T.textPri }}>{row.article}</div>
      </div>

      {/* Fournisseur */}
      <div style={{ padding: '14px 8px', display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', background: T.goldDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: MONO, fontSize: 9, fontWeight: 800, color: T.gold, flexShrink: 0,
        }}>{initials}</div>
        <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, lineHeight: 1.3 }}>{row.fournisseur}</span>
      </div>

      {/* Catégorie */}
      <div style={{ padding: '14px 8px' }}>
        <span style={{
          fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: '3px 8px',
          borderRadius: 100, background: cat.bg, color: cat.color,
        }}>{row.cat}</span>
      </div>

      {/* Prix actuel */}
      <div style={{ padding: '14px 8px' }}>
        <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800, color: T.gold }}>{row.prix}</span>
      </div>

      {/* Prix précédent */}
      <div style={{ padding: '14px 8px' }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: T.textDim, textDecoration: 'line-through' }}>{row.prev}</span>
      </div>

      {/* Variation */}
      <div style={{ padding: '14px 8px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: varBg, color: varColor, padding: '4px 10px', borderRadius: 8,
          fontFamily: MONO, fontSize: 13, fontWeight: 800,
        }}>
          <VarIcon size={12} />
          {row.variation > 0 ? '+' : ''}{row.variation}%
        </span>
      </div>

      {/* MAJ */}
      <div style={{ padding: '14px 8px' }}>
        <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>{row.maj}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <TrendIcon size={11} color={trendColor} />
          <span style={{ fontFamily: SANS, fontSize: 10, color: trendColor, fontWeight: 600 }}>{trendLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Supplier Comparison Card ────────────────────────────────────
function SupplierCard({ title, rows }: { title: string; rows: typeof CIMENT_SUPPLIERS }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, border: `1px solid ${hov ? 'rgba(255,215,0,0.25)' : T.cardBorder}`,
        borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 12px 40px rgba(255,215,0,0.08)' : '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>{title}</div>
      </div>
      {rows.map((r, i) => {
        const borderColor = r.isCurrent ? T.gold : r.isLowest ? T.green : 'transparent';
        const priceColor  = r.isCurrent ? T.gold : r.isLowest ? T.green : T.textSec;
        return (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr auto auto auto auto',
            alignItems: 'center', gap: 12, padding: '12px 16px',
            borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none',
            borderLeft: `4px solid ${borderColor}`,
            background: r.isCurrent ? 'rgba(255,215,0,0.03)' : r.isLowest ? 'rgba(34,197,94,0.03)' : 'transparent',
          }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: T.textPri }}>{r.nom}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                {r.isCurrent && <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: T.gold, background: T.goldDim, padding: '1px 6px', borderRadius: 100 }}>Fournisseur actuel</span>}
                {r.isLowest  && <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: T.green, background: T.greenDim, padding: '1px 6px', borderRadius: 100 }}>Meilleur prix</span>}
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: priceColor }}>{r.prix}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              background: T.redDim, color: T.red, padding: '3px 8px', borderRadius: 6,
              fontFamily: MONO, fontSize: 11, fontWeight: 700,
            }}>
              <ArrowUp size={10} />+{r.variation}%
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Truck size={10} color={T.textDim} />
              <span style={{ fontFamily: SANS, fontSize: 11, color: T.textDim }}>{r.livraison}</span>
            </div>
            <div style={{ color: T.gold, fontSize: 13 }}>
              {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────
function AlertCard({ alert, delay }: { alert: typeof ALERTS[0]; delay: number }) {
  const [hov, setHov] = useState(false);
  const vis = useFadeIn(delay);
  const [btnHov1, setBtnHov1] = useState(false);
  const [btnHov2, setBtnHov2] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: `linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(17,27,46,0.9) 60%)`,
        border: `1px solid rgba(239,68,68,0.28)`, borderLeft: `4px solid ${T.red}`,
        borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        transform: vis ? (hov ? 'translateY(-3px)' : 'translateY(0)') : 'translateY(16px)',
        opacity: vis ? 1 : 0,
        boxShadow: hov ? '0 12px 40px rgba(239,68,68,0.10)' : '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>{alert.article}</div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: T.redDim, color: T.red, padding: '3px 10px', borderRadius: 100,
          fontFamily: SANS, fontSize: 10, fontWeight: 700,
        }}><AlertTriangle size={10} /> {alert.type}</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: T.red, marginBottom: 8 }}>{alert.detail}</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginBottom: 4 }}>{alert.seuil}</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginBottom: 16 }}>{alert.since}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onMouseEnter={() => setBtnHov1(true)} onMouseLeave={() => setBtnHov1(false)}
          style={{
            background: btnHov1 ? '#FFE44D' : T.gold, color: T.bg, border: 'none', borderRadius: 10,
            padding: '8px 16px', fontFamily: SANS, fontWeight: 700, fontSize: 12, cursor: 'pointer',
            transform: btnHov1 ? 'scale(0.97)' : 'scale(1)', transition: 'all 0.15s ease',
          }}
        >{alert.action}</button>
        <button
          onMouseEnter={() => setBtnHov2(true)} onMouseLeave={() => setBtnHov2(false)}
          style={{
            background: btnHov2 ? T.goldDim : 'transparent', color: T.gold,
            border: `1px solid ${T.gold}`, borderRadius: 10,
            padding: '8px 16px', fontFamily: SANS, fontWeight: 700, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >Voir Historique</button>
      </div>
    </div>
  );
}

// ─── Cost Impact Tooltip ─────────────────────────────────────────
function CostTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const curr = payload.find(p => p.name === 'Coût Actuel')?.value;
  const prev = payload.find(p => p.name === 'Coût Précédent')?.value;
  const impact = curr && prev ? (((curr - prev) / prev) * 100).toFixed(1) : null;
  return (
    <div style={{ background: '#1E293B', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '10px 14px', fontFamily: SANS }}>
      <div style={{ color: T.textSec, fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 12, fontWeight: 700 }}>{p.name}: {p.value.toLocaleString('fr-MA')} DH/m³</div>
      ))}
      {impact && <div style={{ color: T.red, fontSize: 11, marginTop: 4, fontWeight: 700 }}>Impact: +{impact}%</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function WorldClassPurchasePrices() {
  const [activeTab, setActiveTab] = useState('Tous les Articles');
  const [hoverUpdate, setHoverUpdate] = useState(false);
  const [hoverExport, setHoverExport] = useState(false);
  const TABS = ['Tous les Articles', 'Ciment', 'Granulats', 'Adjuvants', 'Autres'];

  // KPI animated counters
  const kpiArticles   = useAnimatedCounter(24, 1200);
  const kpiVariation  = useAnimatedCounter(32, 1200);  // 3.2 × 10
  const kpiCout       = useAnimatedCounter(2850, 1200);

  return (
    <div style={{ fontFamily: SANS, minHeight: '100vh', background: T.bg, color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
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
            <h1 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: T.textPri, margin: 0 }}>Prix d'Achat</h1>
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.textDim, marginTop: 1 }}>Suivi des prix fournisseurs et tendances</div>
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
              onMouseEnter={() => setHoverUpdate(true)} onMouseLeave={() => setHoverUpdate(false)}
              style={{
                background: hoverUpdate ? '#FFE44D' : T.gold,
                color: T.bg, border: 'none', borderRadius: 12,
                padding: '10px 20px', fontFamily: SANS, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                transform: hoverUpdate ? 'scale(0.97)' : 'scale(1)',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 20px rgba(255,215,0,0.3)',
              }}
            ><Zap size={13} /> Mettre à Jour Prix</button>
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
          {/* Articles Référencés */}
          <div style={{
            background: T.card, border: `1px solid ${T.cardBorder}`,
            borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
            transition: 'all 0.3s ease', animation: 'fadeUp 0.4s ease both', animationDelay: '80ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ background: T.goldDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} color={T.gold} />
              </div>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: T.green }}>tous à jour</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.gold }}>{kpiArticles}</div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>Articles Référencés</div>
          </div>
          {/* Dernière MAJ */}
          <div style={{
            background: T.card, border: `1px solid ${T.cardBorder}`,
            borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
            transition: 'all 0.3s ease', animation: 'fadeUp 0.4s ease both', animationDelay: '160ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ background: T.blueDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} color={T.blue} />
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.blue }}>15 Fév</div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>Dernière MAJ Prix</div>
          </div>
          {/* Variation Moyenne */}
          <div style={{
            background: T.card, border: `1px solid ${T.cardBorder}`,
            borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
            transition: 'all 0.3s ease', animation: 'fadeUp 0.4s ease both', animationDelay: '240ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ background: T.redDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} color={T.red} />
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: SANS, fontSize: 11, fontWeight: 700, color: T.red }}>
                <ArrowUp size={10} /> hausse ↑
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.red }}>
                +{(Number(kpiVariation) / 10).toFixed(1)}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}>%</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>Variation Moyenne</div>
          </div>
          {/* Coût Moyen Batch B25 */}
          <div style={{
            background: T.card, border: `1px solid ${T.cardBorder}`,
            borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
            transition: 'all 0.3s ease', animation: 'fadeUp 0.4s ease both', animationDelay: '320ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ background: T.goldDim, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color={T.gold} />
              </div>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: T.red }}>+4.1% ↑</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: T.gold }}>
                {Number(kpiCout).toLocaleString('fr-MA')}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: T.textDim }}> DH</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: T.textDim, marginTop: 4 }}>Coût Moyen Batch B25</div>
          </div>
        </div>

        {/* ── SECTION 2: Price Table ── */}
        <div style={{
          background: T.card, border: `1px solid ${T.cardBorder}`,
          borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
            <SectionHeader
              title="Tarifs Fournisseurs"
              badges={[
                { label: '24 articles', color: T.gold, bg: T.goldDim },
                { label: '+3.2% variation moyenne', color: T.red, bg: T.redDim },
              ]}
            />
          </div>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '4px 1fr 140px 100px 140px 120px 100px 120px',
            gap: 0, padding: '10px 0', background: 'rgba(255,255,255,0.02)',
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div />
            {['Article', 'Fournisseur', 'Catégorie', 'Prix Actuel', 'Prix Précédent', 'Variation', 'Tendance'].map(h => (
              <div key={h} style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px' }}>{h}</div>
            ))}
          </div>
          {PRICE_ROWS.map((row, idx) => <PriceRow key={idx} row={row} idx={idx} />)}
        </div>

        {/* ── SECTION 3: Price Trend Charts ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Cement trend */}
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Tendance Prix Ciment</div>
              <span style={{ background: T.redDim, color: T.red, padding: '3px 8px', borderRadius: 100, fontFamily: SANS, fontSize: 10, fontWeight: 700 }}>+4.3% CPA</span>
              <span style={{ background: T.redDim, color: T.red, padding: '3px 8px', borderRadius: 100, fontFamily: SANS, fontSize: 10, fontWeight: 700 }}>+2.9% CPJ</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={CEMENT_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[950, 1250]} tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="cpa" name="CPA 55 (DH/T)" stroke={T.gold} strokeWidth={2.5} dot={{ fill: T.gold, r: 4, strokeWidth: 0 }} isAnimationActive animationDuration={1000} />
                <Line type="monotone" dataKey="cpj" name="CPJ 45 (DH/T)" stroke={T.blue} strokeWidth={2.5} dot={{ fill: T.blue, r: 4, strokeWidth: 0 }} isAnimationActive animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Granulats trend */}
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: T.textPri }}>Tendance Prix Granulats</div>
              <span style={{ background: T.redDim, color: T.red, padding: '3px 8px', borderRadius: 100, fontFamily: SANS, fontSize: 10, fontWeight: 700 }}>+6.3% sable</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={GRANULAT_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="g815"  name="Gravette 8/15 (DH/T)"  stroke={T.blue}   strokeWidth={2.5} dot={{ fill: T.blue,   r: 4, strokeWidth: 0 }} isAnimationActive animationDuration={1000} />
                <Line type="monotone" dataKey="g1525" name="Gravette 15/25 (DH/T)" stroke={T.green}  strokeWidth={2.5} dot={{ fill: T.green,  r: 4, strokeWidth: 0 }} isAnimationActive animationDuration={1000} />
                <Line type="monotone" dataKey="sable" name="Sable 0/4 (DH/T)"      stroke={T.purple} strokeWidth={2.5} dot={{ fill: T.purple, r: 4, strokeWidth: 0 }} isAnimationActive animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── SECTION 4: Cost Impact Analysis ── */}
        <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)' }}>
          <SectionHeader
            icon={AlertTriangle}
            title="Impact sur les Coûts de Production"
            badges={[{ label: 'attention', color: T.red, bg: T.redDim }]}
          />
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textSec, marginBottom: 16 }}>Coût de Production par m³</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={COST_IMPACT} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="product" tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[2400, 4200]} tick={{ fill: T.textDim, fontFamily: SANS, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CostTooltip />} />
              <Bar dataKey="prev" name="Coût Précédent" fill="rgba(100,116,139,0.6)" radius={[4,4,0,0]} isAnimationActive animationDuration={1000} />
              <Bar dataKey="curr" name="Coût Actuel"    fill={T.gold}               radius={[4,4,0,0]} isAnimationActive animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
          {/* Impact summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 20 }}>
            {[
              { label: 'Impact Moyen',             value: '+4.4%' },
              { label: 'Surcoût Mensuel Estimé',   value: '+38K DH' },
              { label: 'Marge Impactée',           value: '-1.2 pts' },
            ].map((box, i) => (
              <div key={i} style={{
                background: T.redDim, border: `1px solid rgba(239,68,68,0.2)`,
                borderRadius: 12, padding: '16px 20px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color: T.red, marginBottom: 4 }}>{box.value}</div>
                <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: T.textDim }}>{box.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 5: Supplier Comparison ── */}
        <div>
          <SectionHeader
            title="Comparaison Fournisseurs"
            subtitle="— mêmes articles"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <SupplierCard title="Ciment CPA 55" rows={CIMENT_SUPPLIERS} />
            <SupplierCard title="Gravette 8/15" rows={GRAVETTE_SUPPLIERS} />
          </div>
        </div>

        {/* ── SECTION 6: Price Alerts ── */}
        <div>
          <SectionHeader
            icon={AlertTriangle}
            title="Alertes Prix"
            badges={[{ label: '3 alertes', color: T.red, bg: T.redDim, pulse: true }]}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ALERTS.map((a, i) => <AlertCard key={i} alert={a} delay={i * 80} />)}
          </div>
        </div>

        {/* ── SECTION 7: Batch Cost Calculator ── */}
        <div>
          <SectionHeader icon={Settings} title="Simulateur de Coût" />
          <div style={{
            background: T.card, border: `1px solid ${T.cardBorder}`,
            borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)',
          }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: T.textSec, marginBottom: 16 }}>
              Béton B25 — Coût par m³
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 32, alignItems: 'start' }}>
              {/* Table */}
              <div>
                {/* Header row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px 55px 120px',
                  padding: '8px 0', borderBottom: `1px solid ${T.border}`,
                }}>
                  {['Ingrédient', 'Quantité', 'Prix Unit.', 'Coût', '%', 'Répartition'].map(h => (
                    <div key={h} style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                  ))}
                </div>
                {/* Rows */}
                {BATCH_ITEMS.map((item, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px 55px 120px',
                    padding: '10px 0', borderBottom: `1px solid ${T.border}`,
                    alignItems: 'center',
                  }}>
                    <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: T.textPri }}>{item.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>{item.qty}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>{item.pu}</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: T.gold }}>
                      {item.cost.toFixed(2)} DH
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>{item.pct}%</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${item.pct * 2.5}%`, height: '100%', background: item.barColor, borderRadius: 2, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  </div>
                ))}
                {/* Total row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 0', borderTop: `2px solid ${T.gold}`, marginTop: 4,
                }}>
                  <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 14, color: T.textPri }}>TOTAL</div>
                  <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color: T.gold }}>2 850 DH / m³</div>
                </div>
                {/* Subtotals */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
                  {[
                    { label: 'Matières',      value: '698.35 DH', pct: '24.5%', color: T.gold   },
                    { label: "Main d'oeuvre", value: '850 DH',    pct: '29.8%', color: T.blue   },
                    { label: 'Transport',     value: '450 DH',    pct: '15.8%', color: T.green  },
                    { label: 'Frais gén.',    value: '851.65 DH', pct: '29.9%', color: T.purple },
                  ].map((s, i) => (
                    <div key={i} style={{
                      background: `${s.color}15`, border: `1px solid ${s.color}30`,
                      borderRadius: 8, padding: '8px 10px',
                    }}>
                      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>{s.pct}</div>
                      <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Donut chart */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative', width: 220, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={70} outerRadius={100}
                        dataKey="value" paddingAngle={2} isAnimationActive animationDuration={1000}>
                        {DONUT_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v.toFixed(2)} DH`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)', textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color: T.gold }}>2 850</div>
                    <div style={{ fontFamily: SANS, fontSize: 10, color: T.textDim }}>DH/m³</div>
                  </div>
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  {DONUT_DATA.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: SANS, fontSize: 12, color: T.textSec, flex: 1 }}>{d.name}</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: d.color }}>{d.value.toFixed(2)} DH</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
