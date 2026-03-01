import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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

function AnimatedKDH({ value }: { value: number }) {
  const kVal = Math.round(value / 1000);
  const animated = useCountUp(kVal, 1400);
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {animated >= 1000 ? `${(animated / 1000).toFixed(1)}M` : animated > 0 ? `${animated}K` : '0'} DH
    </span>
  );
}

const CustomTooltip = ({ active, payload, label, rf }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '10px 14px',
        background: 'rgba(13,18,32,0.95)',
        border: '1px solid rgba(253,185,19,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <p style={{ fontWeight: 700, color: 'white', fontSize: 12, marginBottom: 6 }}>{rf.weekOf} {label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FDB913' }} />
          <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: 11 }}>{rf.confirmed}:</span>
          <span style={{ fontWeight: 700, marginLeft: 'auto', color: '#FDB913', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            {(payload[0]?.value / 1000).toFixed(1)}K DH
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px dashed rgba(253,185,19,0.4)' }} />
          <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: 11 }}>{rf.potential}:</span>
          <span style={{ fontWeight: 700, marginLeft: 'auto', color: 'rgba(148,163,184,0.6)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            {(payload[1]?.value / 1000).toFixed(1)}K DH
          </span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 4, marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target style={{ width: 10, height: 10, color: 'rgba(148,163,184,0.4)' }} />
            <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: 11 }}>Total:</span>
            <span style={{ fontWeight: 700, marginLeft: 'auto', color: '#FDB913', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
              {((payload[0]?.value + payload[1]?.value) / 1000).toFixed(1)}K DH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function RevenueForecastChart({ bcList, devisList }: RevenueForecastChartProps) {
  const { t, lang } = useI18n();
  const rf = t.revenueForecast;
  const vt = t.pages.ventes;
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
      weeks.push({
        week: format(weekStart, 'dd MMM', { locale: dateLocale }),
        weekStart,
        confirmed: confirmedRevenue,
        potential: potentialRevenue,
        total: confirmedRevenue + potentialRevenue,
      });
    }
    return weeks;
  }, [bcList, devisList]);

  const totalConfirmed = forecastData.reduce((sum, w) => sum + w.confirmed, 0);
  const totalPotential = forecastData.reduce((sum, w) => sum + w.potential, 0);
  const totalForecast = totalConfirmed + totalPotential;

  const formatValue = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">
          {rf.title}
        </span>
        <div className="flex-1 border-t border-amber-500/30" />
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          borderRadius: 12,
          padding: 24,
          overflow: 'hidden',
        }}
      >
        {/* Summary Stats — uniform glass cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Confirmed */}
          <div style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 12, padding: 20 }}>
            <div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.875rem', letterSpacing: '-0.02em', lineHeight: 1.1, color: 'white' }}>
                <AnimatedKDH value={totalConfirmed} />
              </span>
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap mt-1">{rf.confirmed}</p>
            {totalConfirmed === 0 && (
              <p className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5" style={{ fontStyle: 'italic' }}>{vt.noConfirmedOrders}</p>
            )}
          </div>
          {/* Potential */}
          <div style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 12, padding: 20 }}>
            <div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.875rem', letterSpacing: '-0.02em', lineHeight: 1.1, color: 'white' }}>
                <AnimatedKDH value={totalPotential} />
              </span>
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap mt-1">{rf.potential}</p>
          </div>
          {/* Total Forecast */}
          <div style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 12, padding: 20 }}>
            <div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.875rem', letterSpacing: '-0.02em', lineHeight: 1.1, color: 'white' }}>
                <AnimatedKDH value={totalForecast} />
              </span>
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap mt-1">{rf.forecast}</p>
          </div>
        </div>

        {/* 6 weeks inside card */}
        <div style={{ marginBottom: 12, textAlign: 'right' }}>
          <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease' }} className="hover:underline hover:text-amber-400/60">{rf.weeks}</span>
        </div>

        {/* Chart */}
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rfConfirmedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FDB913" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FDB913" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rfPotentialGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FDB913" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#FDB913" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.4)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatValue}
                tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.4)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip rf={rf} />} />
              <ReferenceLine
                x={forecastData[0]?.week}
                stroke="#FDB913"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{ value: rf.today, position: 'top', fontSize: 9, fill: '#FDB913' }}
              />
              <Area
                type="monotone"
                dataKey="confirmed"
                stackId="1"
                stroke="#FDB913"
                strokeWidth={2}
                fill="url(#rfConfirmedGrad)"
              />
              <Area
                type="monotone"
                dataKey="potential"
                stackId="1"
                stroke="rgba(253,185,19,0.4)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                fill="url(#rfPotentialGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 2.5, borderRadius: 2, background: '#FDB913' }} />
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{rf.confirmedOrders}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 0, borderTop: '2px dashed rgba(253,185,19,0.4)' }} />
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{rf.potentialQuotes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
