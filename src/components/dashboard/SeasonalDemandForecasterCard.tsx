import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  ReferenceLine, Tooltip as RechartsTooltip,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  danger: '#EF4444', warning: '#F59E0B', success: '#10B981', info: '#3B82F6',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
};

const forecastTable = [
  { periode: '30j (Mars)', volume: '1,240 m³', vs: '↑ +18%', vsColor: T.success, confiance: 87, facteur: 'Reprise chantiers post-hiver' },
  { periode: '60j (Avril)', volume: '1,480 m³', vs: '↑ +24%', vsColor: T.success, confiance: 74, facteur: 'Pic saisonnier construction' },
  { periode: '90j (Mai)', volume: '1,120 m³', vs: '↓ -8%', vsColor: T.danger, confiance: 61, facteur: 'Début Ramadan — ralentissement' },
];

function getConfColor(c: number) {
  if (c >= 80) return T.success;
  if (c >= 60) return T.warning;
  return T.textDim;
}

// Mock 90-day chart data (weekly points)
const chartData = [
  { week: 'S1 Mar', forecast: 290, lastYear: 245 },
  { week: 'S2 Mar', forecast: 320, lastYear: 260 },
  { week: 'S3 Mar', forecast: 310, lastYear: 255 },
  { week: 'S4 Mar', forecast: 320, lastYear: 250 },
  { week: 'S1 Avr', forecast: 360, lastYear: 290 },
  { week: 'S2 Avr', forecast: 380, lastYear: 300 },
  { week: 'S3 Avr', forecast: 370, lastYear: 295 },
  { week: 'S4 Avr', forecast: 370, lastYear: 310 },
  { week: 'S1 Mai', forecast: 340, lastYear: 320 },
  { week: 'S2 Mai', forecast: 300, lastYear: 310 },
  { week: 'S3 Mai', forecast: 260, lastYear: 280 },
  { week: 'S4 Mai', forecast: 220, lastYear: 270 },
];

const insights = [
  { color: T.success, text: '📈 Mars-Avril: Pic de demande prévu. Volume cumulé attendu: 2,720 m³. Capacité suffisante mais recommandation: pré-commander 15% de ciment supplémentaire avant le 10 mars pour éviter rupture.' },
  { color: T.warning, text: '🌙 Ramadan (estimé ~28 Mai): Historiquement -30% de volume pendant les 2 premières semaines. Ajuster les équipes en conséquence. Prévoir horaires adaptés pour livraisons matinales.' },
  { color: T.info, text: '📊 Tendance Client: 3 nouveaux projets identifiés (permis déposés Q1 2026) dans un rayon de 20km. Potentiel additionnel: +180 m³/mois à partir d\'Avril.' },
];

function useStockAlertKpi() {
  const [label, setLabel] = useState('Chargement...');
  const [color, setColor] = useState(T.textDim);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await supabase
          .from('stock_autonomy_cache')
          .select('materiau, days_remaining')
          .order('days_remaining', { ascending: true });

        if (!data || data.length === 0) {
          setLabel('Aucune rupture prévue');
          setColor(T.success);
          return;
        }

        // Find the material with the lowest days_remaining that is within 30 days
        const critical = data.find(d => d.days_remaining != null && d.days_remaining <= 30);

        if (!critical) {
          setLabel('Aucune rupture prévue');
          setColor(T.success);
          return;
        }

        const stockoutDate = addDays(new Date(), Math.floor(critical.days_remaining));
        const formatted = format(stockoutDate, 'd MMM', { locale: fr });
        const matName = critical.materiau.charAt(0).toUpperCase() + critical.materiau.slice(1);

        setLabel(`${matName} avant ${formatted}`);
        setColor(critical.days_remaining <= 5 ? T.danger : T.warning);
      } catch {
        setLabel('Aucune rupture prévue');
        setColor(T.success);
      }
    }
    fetch();
  }, []);

  return { label, color };
}

const headers = ['Période', 'Volume Prévu', 'vs 2025', 'Confiance', 'Facteur Principal'];

export function SeasonalDemandForecasterCard() {
  const [open, setOpen] = useState(true);
  const stockAlert = useStockAlertKpi();

  const kpis = [
    { label: 'Prévision 30j', value: '1,240 m³' },
    { label: 'Capacité Disponible', value: '89%', valueColor: T.success },
    { label: 'Alerte Stock', value: stockAlert.label, valueColor: stockAlert.color },
  ];

  return (
    <div style={{ background: 'linear-gradient(to right, rgba(212,168,67,0.04), transparent)', border: '1px solid rgba(212,168,67,0.10)', borderRadius: 8, overflow: 'hidden', backdropFilter: 'blur(4px)' }}>
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
          <TrendingUp size={14} color={T.gold} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Prévision Demande
          </span>
          <span style={{ color: '#D4A843', fontSize: 13, animation: 'agentSparkle 2s ease-in-out infinite' }}>✦</span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: 'rgba(148,163,184,0.5)', whiteSpace: 'nowrap', marginRight: 8 }}>Dernière analyse: il y a 3h</span>
        </div>
        {open ? <ChevronUp size={14} color={T.textDim} /> : <ChevronDown size={14} color={T.textDim} />}
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* KPI Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {kpis.map((k, i) => (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                border: `1px solid ${T.cardBorder}`, padding: '10px 12px',
              }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{k.label}</p>
                <span style={{ fontSize: 14, fontWeight: 800, color: k.valueColor || T.textPri, fontFamily: 'JetBrains Mono, monospace' }}>{k.value}</span>
              </div>
            ))}
          </div>

          {/* Forecast Table */}
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: i >= 2 ? 'center' : 'left',
                      color: T.textDim, fontSize: 10, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      borderBottom: `1px solid ${T.cardBorder}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecastTable.map((r, i) => {
                  const cc = getConfColor(r.confiance);
                  return (
                    <tr key={i}
                      style={{ borderBottom: i < forecastTable.length - 1 ? `1px solid ${T.cardBorder}60` : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: T.textPri }}>{r.periode}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: T.gold, fontFamily: 'JetBrains Mono, monospace' }}>{r.volume}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: r.vsColor, fontFamily: 'JetBrains Mono, monospace' }}>{r.vs}</span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                          fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                          background: `${cc}15`, color: cc, border: `1px solid ${cc}30`,
                        }}>{r.confiance}%</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: T.textSec }}>{r.facteur}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Demand Curve Chart */}
          <div style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '20px 12px 8px',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingLeft: 8 }}>
              Courbe de Demande — 90 jours
            </p>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4A843" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#D4A843" stopOpacity={0} />
                    </linearGradient>
                    <filter id="forecastGlow">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(212,168,67,0.3)" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${T.cardBorder}80`} />
                  <XAxis dataKey="week" tick={{ fill: T.textDim, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[95, 'auto']} tick={{ fill: T.textDim, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 8, fontSize: 11, backdropFilter: 'blur(12px)', color: '#fff' }}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                  <ReferenceLine y={350} stroke={T.success} strokeDasharray="6 4" strokeOpacity={0.4} />
                  <ReferenceLine x="S2 Mai" stroke={T.danger} strokeDasharray="4 3" strokeOpacity={0.6} label={{ value: 'Ramadan', fill: T.danger, fontSize: 9, position: 'top' }} />
                  <Area type="monotone" dataKey="lastYear" name="2025" stroke={T.textDim} strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} />
                  <Area type="monotone" dataKey="forecast" name="Prévision 2026" stroke="#D4A843" strokeWidth={2} fill="url(#forecastGrad)" dot={false} filter="url(#forecastGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: T.textSec }}>
                <span style={{ width: 12, height: 3, borderRadius: 2, background: '#D4A843', display: 'inline-block' }} /> Prévision 2026
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: T.textSec }}>
                <span style={{ width: 12, height: 1, borderTop: `2px dashed ${T.textDim}`, display: 'inline-block' }} /> 2025
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: T.textSec }}>
                <span style={{ width: 12, height: 1, borderTop: `2px dashed ${T.success}`, display: 'inline-block' }} /> Capacité
              </span>
            </div>
            {/* Bottom fade */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to top, rgba(10,15,26,0.6), transparent)', pointerEvents: 'none' }} />
          </div>

          {/* Actionable Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {insights.map((ins, i) => (
              <div key={i} className="cursor-pointer" style={{
                borderLeft: `4px solid ${ins.color}`,
                background: `${ins.color}06`,
                border: `1px solid ${ins.color}20`,
                borderLeftWidth: 4,
                borderLeftColor: ins.color,
                borderRadius: '0 10px 10px 0',
                padding: '12px 16px',
                transition: 'all 200ms ease-out',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div className="rounded-sm flex-shrink-0 mt-[3px]" style={{ width: 10, height: 10, background: ins.color }} />
                  <p style={{ fontSize: 11, lineHeight: 1.7, color: T.textSec }}>
                    {(() => {
                      // Strip leading emoji
                      const cleaned = ins.text.replace(/^[\p{Emoji}\uFE0F\u200D]+\s*/u, '');
                      const dotIdx = cleaned.indexOf('.');
                      if (dotIdx === -1) return <span className="font-semibold">{cleaned}</span>;
                      const first = cleaned.slice(0, dotIdx + 1);
                      const rest = cleaned.slice(dotIdx + 1);
                      return <><span className="font-semibold">{first}</span>{rest}</>;
                    })()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
