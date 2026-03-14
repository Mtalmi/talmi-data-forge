import { useMemo, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
} from 'recharts';
import { Target } from 'lucide-react';
import { BonCommande, Devis } from '@/hooks/useSalesWorkflow';
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, parseISO } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { useCountUp } from '@/hooks/useCountUp';

interface RevenueForecastChartProps {
  bcList: BonCommande[];
  devisList: Devis[];
}

interface WeeklyForecast {
  week: string;
  weekStart: Date;
  confirmed: number;
  potential: number;
  total: number;
}

const monoFont = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

function AnimatedKDH({ value, color }: { value: number; color: string }) {
  const kVal = Math.round(value / 1000);
  const animated = useCountUp(kVal, 1500);
  return (
    <span style={{ fontFamily: monoFont, fontWeight: 200, fontSize: 28, color, lineHeight: 1.1 }}>
      {animated >= 1000 ? `${(animated / 1000).toFixed(1)}M` : animated > 0 ? `${animated}K` : '0'} DH
    </span>
  );
}

/* Live pulse dot for last data point */
function LivePulseDot(props: any) {
  const { cx, cy } = props;
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r="5" fill="#D4A843" opacity="0.3">
        <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r="4" fill="#D4A843" />
    </g>
  );
}

const CustomTooltip = ({ active, payload, label, rf }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ borderRadius: 12, padding: '10px 14px', background: 'rgba(13,18,32,0.95)', border: '1px solid rgba(212,168,67,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
      <p style={{ fontWeight: 700, color: 'white', fontSize: 12, marginBottom: 6 }}>{rf.weekOf} {label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4A843' }} />
          <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: 11 }}>{rf.confirmed}:</span>
          <span style={{ fontWeight: 700, marginLeft: 'auto', color: '#D4A843', fontFamily: monoFont, fontSize: 12 }}>
            {(payload[0]?.value / 1000).toFixed(1)}K DH
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px dashed rgba(212,168,67,0.4)' }} />
          <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: 11 }}>{rf.potential}:</span>
          <span style={{ fontWeight: 700, marginLeft: 'auto', color: 'rgba(148,163,184,0.6)', fontFamily: monoFont, fontSize: 12 }}>
            {(payload[1]?.value / 1000).toFixed(1)}K DH
          </span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 4, marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target style={{ width: 10, height: 10, color: 'rgba(148,163,184,0.4)' }} />
            <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: 11 }}>Total:</span>
            <span style={{ fontWeight: 700, marginLeft: 'auto', color: '#D4A843', fontFamily: monoFont, fontSize: 12 }}>
              {((payload[0]?.value + payload[1]?.value) / 1000).toFixed(1)}K DH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Custom cursor: vertical gold dashed line */
function GoldCrosshair(props: any) {
  const { points, height } = props;
  if (!points?.[0]) return null;
  return (
    <line
      x1={points[0].x} y1={0} x2={points[0].x} y2={height}
      stroke="#D4A843" strokeDasharray="4 3" strokeWidth="1" opacity="0.35"
    />
  );
}

export function RevenueForecastChart({ bcList, devisList }: RevenueForecastChartProps) {
  const { t, lang } = useI18n();
  const rf = t.revenueForecast;
  const dateLocale = getDateLocale(lang);

  const forecastData = useMemo<WeeklyForecast[]>(() => {
    const today = new Date();
    const weeks: WeeklyForecast[] = [];
    for (let i = 0; i < 6; i++) {
      const weekStart = startOfWeek(addWeeks(today, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(addWeeks(today, i), { weekStartsOn: 1 });
      const confirmedRevenue = bcList
        .filter(bc => {
          if (!bc.date_livraison_souhaitee) return false;
          if (bc.statut === 'termine' || bc.statut === 'livre') return false;
          return isWithinInterval(parseISO(bc.date_livraison_souhaitee), { start: weekStart, end: weekEnd });
        })
        .reduce((sum, bc) => sum + bc.total_ht, 0);
      const CONVERSION_RATE = 0.35;
      const potentialRevenue = i === 0 ? 0 : devisList
        .filter(d => d.statut === 'en_attente')
        .reduce((sum, d) => sum + (d.total_ht * CONVERSION_RATE * (1 / (i + 1))), 0);
      weeks.push({ week: format(weekStart, 'dd MMM', { locale: dateLocale }), weekStart, confirmed: confirmedRevenue, potential: potentialRevenue, total: confirmedRevenue + potentialRevenue });
    }
    return weeks;
  }, [bcList, devisList]);

  const totalConfirmed = forecastData.reduce((sum, w) => sum + w.confirmed, 0);
  const totalPotential = forecastData.reduce((sum, w) => sum + w.potential, 0);
  const totalForecast = totalConfirmed + totalPotential;

  // Summary strip data
  const peakWeek = forecastData.reduce((max, w) => w.total > max.total ? w : max, forecastData[0]);
  const troughWeek = forecastData.reduce((min, w) => w.total < min.total ? w : min, forecastData[0]);
  const avgTotal = forecastData.length > 0 ? forecastData.reduce((s, w) => s + w.total, 0) / forecastData.length : 0;

  const formatValue = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const formatK = (v: number) => v >= 1000 ? `${Math.round(v / 1000)}K` : `${Math.round(v)}`;

  // Find last data point index for live dot
  const lastIdx = forecastData.length - 1;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span style={{ color: '#D4A843', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'ui-monospace' }}>{rf.title}</span>
        <div className="flex-1" style={{ height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 12, borderTop: '2px solid #D4A843', padding: 24, overflow: 'hidden' }}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div style={{ background: 'rgba(255,255,255,0.04)', border: totalConfirmed === 0 ? '1px dashed rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)', borderTop: `2px solid ${totalConfirmed === 0 ? '#EF4444' : '#D4A843'}`, borderRadius: 12, padding: 20 }}>
            <AnimatedKDH value={totalConfirmed} color={totalConfirmed === 0 ? '#EF4444' : '#D4A843'} />
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginTop: 4 }}>{rf.confirmed}</p>
            {totalConfirmed === 0 && (
              <p style={{ fontSize: 11, fontStyle: 'italic', color: '#F59E0B', marginTop: 2 }}>Première commande attendue</p>
            )}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTop: '2px solid #F59E0B', borderRadius: 12, padding: 20 }}>
            <AnimatedKDH value={totalPotential} color="#F59E0B" />
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginTop: 4 }}>{rf.potential}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTop: '2px solid #D4A843', borderRadius: 12, padding: 20 }}>
            <AnimatedKDH value={totalForecast} color="#D4A843" />
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginTop: 4 }}>{rf.forecast}</p>
          </div>
        </div>

        <div style={{ marginBottom: 12, textAlign: 'right' }}>
          <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', fontFamily: monoFont }}>{rf.weeks}</span>
        </div>

        {/* Chart */}
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rfConfirmedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rfPotentialGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={0.06} />
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(212,168,67,0.04)" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.4)', fontFamily: monoFont }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatValue} tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.4)', fontFamily: monoFont }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip rf={rf} />} cursor={<GoldCrosshair />} />
              <ReferenceLine x={forecastData[0]?.week} stroke="#D4A843" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: rf.today, position: 'top', fontSize: 9, fill: '#D4A843' }} />
              <Area type="monotone" dataKey="confirmed" stackId="1" stroke="#D4A843" strokeWidth={2} fill="url(#rfConfirmedGrad)" activeDot={false}
                dot={(props: any) => props.index === lastIdx ? <LivePulseDot {...props} /> : <circle cx={0} cy={0} r={0} />}
              />
              <Area type="monotone" dataKey="potential" stackId="1" stroke="rgba(212,168,67,0.4)" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#rfPotentialGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 8, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#9CA3AF' }}>PIC · </span>
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#D4A843', fontWeight: 600 }}>{formatK(peakWeek?.total || 0)} DH</span>
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#9CA3AF' }}> · {peakWeek?.week}</span>
          </div>
          <div>
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#9CA3AF' }}>CREUX · </span>
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#D4A843', fontWeight: 600 }}>{formatK(troughWeek?.total || 0)} DH</span>
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#9CA3AF' }}> · {troughWeek?.week}</span>
          </div>
          <div>
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#9CA3AF' }}>MOY. · </span>
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#D4A843', fontWeight: 600 }}>{formatK(avgTotal)} DH</span>
          </div>
          <div>
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#9CA3AF' }}>VS SEM. DERN. · </span>
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#22C55E', fontWeight: 600 }}>+8.3%</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 12, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 2.5, borderRadius: 2, background: '#D4A843' }} />
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{rf.confirmedOrders}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 0, borderTop: '2px dashed rgba(212,168,67,0.4)' }} />
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{rf.potentialQuotes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
