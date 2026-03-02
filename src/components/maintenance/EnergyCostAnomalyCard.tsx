import React, { useState } from 'react';
import { Zap, Sparkles, Droplets, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend, Line, ComposedChart,
} from 'recharts';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  danger: '#EF4444', warning: '#F59E0B', success: '#10B981',
  info: '#3B82F6',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
};

const chartData = [
  { day: 'Lun', production: 55, energie: 820 },
  { day: 'Mar', production: 62, energie: 890 },
  { day: 'Mer', production: 58, energie: 870 },
  { day: 'Jeu', production: 66, energie: 950 },
  { day: 'Ven', production: 60, energie: 940 },
  { day: 'Sam', production: 48, energie: 980 },
  { day: 'Dim', production: 52, energie: 1020 },
];

const anomalies = [
  {
    severity: 'high',
    icon: '⚡',
    title: 'Surconsommation Électrique',
    lines: [
      { label: 'Consommation', value: '980 kWh/jour', normal: 'moyenne: 820 kWh/jour', delta: '+19.5%', deltaColor: T.danger },
      { label: 'Production', value: '52 m³/jour', normal: 'moyenne: 58 m³/jour', delta: '-10.3%', deltaColor: T.danger },
      { label: 'Ratio kWh/m³', value: '18.8', normal: 'normale: 14.1', delta: '+33.3%', deltaColor: T.danger },
    ],
    cause: 'Dégradation roulements malaxeur principal',
    impact: '~3,100 MAD/semaine',
    reco: 'Inspection malaxeur sous 48h',
  },
  {
    severity: 'medium',
    icon: '💧',
    title: 'Surconsommation Eau',
    lines: [
      { label: 'Consommation', value: '2.8 m³ eau/m³ béton', normal: 'normale: 2.4', delta: '+16.7%', deltaColor: T.warning },
    ],
    cause: 'Fuite circuit de refroidissement ou doseur déréglé',
    impact: '~1,100 MAD/semaine',
    reco: 'Vérifier circuit hydraulique et calibration doseur',
    extra: 'Augmentation progressive depuis 3 jours',
  },
];

export function EnergyCostAnomalyCard() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.cardBorder}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: T.goldDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Zap size={14} color={T.gold} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Détection Anomalies Coûts
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        </div>
        {open ? <ChevronUp size={14} color={T.textDim} /> : <ChevronDown size={14} color={T.textDim} />}
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* KPI Summary Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <KpiBox label="Coût Énergie Semaine" value="18,400 MAD" trend="↑12%" trendColor={T.danger} />
            <KpiBox label="Anomalies Actives" value="2" badge badgeColor={T.danger} />
            <KpiBox label="Surcoût Estimé" value="4,200 MAD/sem" valueColor={T.danger} />
          </div>

          {/* Chart */}
          <div style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 10,
            border: `1px solid ${T.cardBorder}`, padding: '16px 12px 8px', marginBottom: 20,
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingLeft: 8 }}>
              Production vs Consommation — 7 jours
            </p>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${T.cardBorder}80`} />
                  <XAxis dataKey="day" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: T.info, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: T.danger, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ background: '#141824', border: `1px solid ${T.cardBorder}`, borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: T.textPri, fontWeight: 600 }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="production" name="Production (m³)" stroke={T.info} fill={`${T.info}20`} strokeWidth={2} dot={false} />
                  <Area yAxisId="right" type="monotone" dataKey="energie" name="Énergie (kWh)" stroke={T.danger} fill={`${T.danger}15`} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: T.textSec }}>
                <span style={{ width: 10, height: 3, borderRadius: 2, background: T.info, display: 'inline-block' }} /> Production (m³)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: T.textSec }}>
                <span style={{ width: 10, height: 3, borderRadius: 2, background: T.danger, display: 'inline-block' }} /> Consommation (kWh)
              </span>
            </div>
          </div>

          {/* Anomaly Detail Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {anomalies.map((a, i) => {
              const borderColor = a.severity === 'high' ? T.danger : T.warning;
              return (
                <div key={i} style={{
                  borderLeft: `4px solid ${borderColor}`,
                  background: `${borderColor}06`,
                  border: `1px solid ${borderColor}20`,
                  borderLeftWidth: 4,
                  borderLeftColor: borderColor,
                  borderRadius: '0 10px 10px 0',
                  padding: '14px 18px',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.textPri, marginBottom: 10 }}>
                    {a.icon} {a.title}
                  </p>

                  {a.extra && (
                    <p style={{ fontSize: 11, color: T.textSec, marginBottom: 8, fontStyle: 'italic' }}>{a.extra}</p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                    {a.lines.map((l, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <span style={{ color: T.textSec, minWidth: 100 }}>{l.label}:</span>
                        <span style={{ color: T.textPri, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{l.value}</span>
                        <span style={{ color: T.textDim, fontSize: 10 }}>({l.normal})</span>
                        <span style={{ color: l.deltaColor, fontWeight: 700, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>→ {l.delta}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, paddingTop: 8, borderTop: `1px solid ${borderColor}15` }}>
                    <p style={{ color: T.textSec }}>
                      <strong style={{ color: T.warning }}>Cause probable:</strong> {a.cause}
                    </p>
                    <p style={{ color: T.textSec }}>
                      <strong style={{ color: T.danger }}>Impact financier:</strong>{' '}
                      <span style={{ color: T.danger, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{a.impact}</span>
                    </p>
                    <p style={{ color: T.textSec }}>
                      <strong style={{ color: T.success }}>Recommandation:</strong> {a.reco}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiBox({ label, value, trend, trendColor, badge, badgeColor, valueColor }: {
  label: string; value: string;
  trend?: string; trendColor?: string;
  badge?: boolean; badgeColor?: string;
  valueColor?: string;
}) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)', borderRadius: 8,
      border: `1px solid ${T.cardBorder}`, padding: '12px 14px',
    }}>
      <p style={{ fontSize: 9, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {badge ? (
          <span style={{
            padding: '2px 8px', borderRadius: 999, fontSize: 14, fontWeight: 800,
            background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}30`,
            fontFamily: 'JetBrains Mono, monospace',
          }}>{value}</span>
        ) : (
          <span style={{ fontSize: 16, fontWeight: 800, color: valueColor || T.textPri, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
        )}
        {trend && (
          <span style={{ fontSize: 10, fontWeight: 700, color: trendColor, fontFamily: 'JetBrains Mono, monospace' }}>{trend}</span>
        )}
      </div>
    </div>
  );
}
