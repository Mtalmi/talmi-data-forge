import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

/* ───── Shared card style ───── */
const cardBase: React.CSSProperties = {
  background: 'rgba(15,23,41,0.6)',
  border: '1px solid rgba(212,168,67,0.12)',
  borderTop: '2px solid #D4A843',
  borderRadius: 12,
  padding: 24,
  overflow: 'hidden',
  transition: 'background 200ms',
};

function hoverHandlers() {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'rgba(212,168,67,0.02)'; },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'rgba(15,23,41,0.6)'; },
  };
}

/* ───── Section Header ───── */
function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <span style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
    </div>
  );
}

/* ───── Tooltip ───── */
const GoldTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      borderRadius: 10, padding: '8px 14px',
      background: 'rgba(13,18,32,0.95)',
      border: '1px solid rgba(212,168,67,0.25)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
    }}>
      {label && <p style={{ fontWeight: 600, color: 'white', fontSize: 11, marginBottom: 4, fontFamily: 'ui-monospace, monospace' }}>{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color || entry.stroke }} />
          <span style={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'ui-monospace, monospace' }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, marginLeft: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#D4A843' }}>
            {typeof entry.value === 'number'
              ? entry.value >= 1000 ? `${(entry.value / 1000).toFixed(0)}K DH` : `${entry.value} DH`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ───── Live pulse dot ───── */
function PulseDot(props: any) {
  const { cx, cy } = props;
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#D4A843" opacity={0.3}>
        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={4} fill="#D4A843" />
    </g>
  );
}

/* ═════ Pipeline Evolution Chart ═════ */
const PIPELINE_DATA = [
  { week: 'S9', pipeline: 95000, conversions: 0 },
  { week: 'S10', pipeline: 110000, conversions: 0 },
  { week: 'S11', pipeline: 125000, conversions: 12000 },
  { week: 'S12', pipeline: 140000, conversions: 15000 },
  { week: 'S13', pipeline: 148000, conversions: 15000 },
  { week: 'S14', pipeline: 155000, conversions: 15000 },
];

function PipelineEvolutionChart() {
  return (
    <div style={cardBase} {...hoverHandlers()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Évolution du Pipeline — 6 Dernières Semaines</span>
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={PIPELINE_DATA} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="pipelineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(212,168,67,0.08)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'ui-monospace, monospace' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'ui-monospace, monospace' }} axisLine={false} tickLine={false} />
            <Tooltip content={<GoldTooltip />} />
            <Area type="monotone" dataKey="pipeline" name="Pipeline Total" stroke="#D4A843" strokeWidth={2} fill="url(#pipelineGrad)"
              dot={(props: any) => props.index === PIPELINE_DATA.length - 1 ? <PulseDot {...props} /> : <circle r={0} />}
            />
            <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#22C55E" strokeWidth={1.5} fill="none"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'CROISSANCE', value: '+63%', color: '#22C55E' },
          { label: 'PIPELINE MOY.', value: '129K DH', color: '#D4A843' },
          { label: 'MEILLEURE SEM.', value: 'S13', color: '#D4A843' },
        ].map(s => (
          <span key={s.label} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#9CA3AF' }}>
            {s.label} · <span style={{ color: s.color, fontWeight: 600 }}>{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═════ Top Clients Bar Chart ═════ */
const TOP_CLIENTS = [
  { name: 'Saudi Readymix Co.', volume: 50 },
  { name: 'BTP Maroc SARL', volume: 23 },
  { name: 'Constructions Modernes', volume: 20 },
  { name: 'Ciments & Béton du Sud', volume: 15 },
  { name: 'TGCC', volume: 10 },
];

function TopClientsChart() {
  return (
    <div style={cardBase} {...hoverHandlers()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Top Clients par Volume</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {TOP_CLIENTS.map((client, i) => {
          const maxVol = TOP_CLIENTS[0].volume;
          const pct = (client.volume / maxVol) * 100;
          return (
            <div key={client.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', width: 180, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</span>
              <div style={{ flex: 1, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.03)', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: i === 0 ? 'linear-gradient(90deg, #C49A3C, #D4A843)' : `rgba(212,168,67,${0.6 - i * 0.1})`,
                  borderRadius: 4,
                  transition: 'width 1s ease',
                }} />
              </div>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#D4A843', fontWeight: 600, width: 50, textAlign: 'right', flexShrink: 0 }}>{client.volume} m³</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═════ Conversion Funnel ═════ */
const FUNNEL_STAGES = [
  { label: 'Devis créés', count: 12, pct: 100, color: '#D4A843' },
  { label: 'En attente', count: 6, pct: 50, color: '#F59E0B' },
  { label: 'BC validés', count: 3, pct: 25, color: '#22C55E' },
  { label: 'Terminé', count: 1, pct: 8, color: '#10B981' },
];

function ConversionFunnel() {
  return (
    <div style={cardBase} {...hoverHandlers()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Conversion Funnel</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {FUNNEL_STAGES.map((stage) => (
          <div key={stage.label} style={{ width: `${Math.max(stage.pct, 15)}%`, minWidth: 120, position: 'relative' }}>
            <div style={{
              height: 40, borderRadius: 8,
              background: stage.color,
              opacity: 0.85,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; }}
            >
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 600, color: '#0F1629' }}>
                {stage.count} {stage.label}
              </span>
            </div>
            <span style={{ position: 'absolute', right: -44, top: '50%', transform: 'translateY(-50%)', fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#9CA3AF' }}>
              {stage.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════ IA Insight Card ═════ */
function IAInsightCard() {
  return (
    <div style={{ ...cardBase, background: 'rgba(212,168,67,0.02)', borderLeft: '3px solid #D4A843' }} {...hoverHandlers()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>✦ INSIGHT IA — ANALYSE COMMERCIALE</span>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 600,
          padding: '4px 12px', borderRadius: 20,
          background: 'rgba(212,168,67,0.1)', color: '#D4A843',
          border: '1px solid rgba(212,168,67,0.2)',
        }}>
          Généré par IA · Claude Opus
        </span>
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
        <p style={{ marginBottom: 12 }}>
          Le pipeline montre une croissance soutenue de{' '}
          <span style={{ color: '#D4A843', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>+63%</span>{' '}
          sur 6 semaines. Saudi Readymix Co. représente{' '}
          <span style={{ color: '#D4A843', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>38%</span>{' '}
          du volume total — risque de concentration client.
        </p>
        <div style={{
          padding: 12, borderRadius: 8, marginTop: 8,
          background: 'rgba(212,168,67,0.05)',
          borderLeft: '3px solid #D4A843',
        }}>
          <span style={{ color: '#D4A843', fontWeight: 600, fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>Recommandation : </span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
            diversifier le portefeuille en ciblant{' '}
            <span style={{ color: '#D4A843', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>2-3</span>{' '}
            nouveaux comptes dans la région Casablanca-Settat.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═════ Main Export ═════ */
export function AnalytiqueExtended() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ROW 2 */}
      <SectionTitle title="✦ TENDANCES & PERFORMANCE" />
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, alignItems: 'start' }}>
        <PipelineEvolutionChart />
        <TopClientsChart />
      </div>

      {/* ROW 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 16, alignItems: 'start' }}>
        <ConversionFunnel />
        <IAInsightCard />
      </div>
    </div>
  );
}
