import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { TrendingUp, Target, Calendar, Zap } from 'lucide-react';
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
      className="rounded-xl border shadow-xl p-3 space-y-2 text-sm"
      style={{
        background: 'hsl(var(--card))',
        borderColor: 'hsl(var(--primary)/0.3)',
        boxShadow: '0 8px 32px hsl(var(--primary)/0.15)',
      }}
    >
      <p className="font-bold text-foreground">{rf.weekOf} {label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
          <span className="text-muted-foreground text-xs">{rf.confirmed}:</span>
          <span className="font-bold ml-auto" style={{ color: 'hsl(var(--primary))', fontFamily: 'JetBrains Mono, monospace' }}>
            {(payload[0]?.value / 1000).toFixed(1)}K DH
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full border border-dashed" style={{ borderColor: 'hsl(var(--primary)/0.5)' }} />
          <span className="text-muted-foreground text-xs">{rf.potential}:</span>
          <span className="font-bold ml-auto text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {(payload[1]?.value / 1000).toFixed(1)}K DH
          </span>
        </div>
        <div className="border-t pt-1.5" style={{ borderColor: 'hsl(var(--border)/0.5)' }}>
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">Total:</span>
            <span className="font-black ml-auto" style={{ color: 'hsl(var(--primary))', fontFamily: 'JetBrains Mono, monospace' }}>
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
    <Card
      className="overflow-hidden god-tier-card"
      style={{
        background: 'linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--primary)/0.02) 100%)',
        borderColor: 'hsl(var(--primary)/0.15)',
      }}
    >
      <CardHeader className="pb-3 pt-4" style={{
        borderBottom: '1px solid hsl(var(--border)/0.4)',
        background: 'linear-gradient(90deg, hsl(var(--primary)/0.05) 0%, transparent 70%)',
      }}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-[0.08em] flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'hsl(var(--primary)/0.12)' }}>
              <TrendingUp className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            {rf.title}
          </CardTitle>
          <Badge
            className="gap-1 text-xs"
            style={{
              background: 'hsl(var(--primary)/0.08)',
              color: 'hsl(var(--primary))',
              border: '1px solid hsl(var(--primary)/0.2)',
            }}
          >
            <Calendar className="h-3 w-3" />
            {rf.weeks}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          {/* Confirmed */}
          <div className="text-center p-2 rounded-xl" style={{ background: 'hsl(var(--primary)/0.06)', border: '1px solid hsl(var(--primary)/0.15)' }}>
            <p className="text-lg font-black" style={{ color: 'hsl(var(--primary))', fontFamily: 'JetBrains Mono, monospace' }}>
              <AnimatedKDH value={totalConfirmed} />
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{rf.confirmed}</p>
          </div>
          {/* Potential */}
          <div className="text-center p-2 rounded-xl" style={{ background: 'hsl(var(--muted)/0.5)', border: '1px solid hsl(var(--border)/0.4)' }}>
            <p className="text-lg font-black text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <AnimatedKDH value={totalPotential} />
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{rf.potential}</p>
          </div>
          {/* Total */}
          <div className="text-center p-2 rounded-xl" style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--primary)/0.05))',
            border: '1px solid hsl(var(--primary)/0.25)',
            boxShadow: '0 4px 16px hsl(var(--primary)/0.08)',
          }}>
            <p className="text-lg font-black flex items-center justify-center gap-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'JetBrains Mono, monospace' }}>
              <Zap className="h-3.5 w-3.5" />
              <AnimatedKDH value={totalForecast} />
            </p>
            <p className="text-[10px] mt-0.5 font-bold" style={{ color: 'hsl(var(--primary)/0.7)' }}>{rf.forecast}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-44 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rfConfirmedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(51 100% 50%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(51 100% 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rfPotentialGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(51 100% 50%)" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="hsl(51 100% 50%)" stopOpacity={0} />
                </linearGradient>
                <filter id="rfGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border)/0.4)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatValue}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip rf={rf} />} />
              <ReferenceLine
                x={forecastData[0]?.week}
                stroke="hsl(var(--primary))"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{ value: rf.today, position: 'top', fontSize: 9, fill: 'hsl(var(--primary))' }}
              />
              <Area
                type="monotone"
                dataKey="confirmed"
                stackId="1"
                stroke="hsl(51 100% 50%)"
                strokeWidth={2.5}
                fill="url(#rfConfirmedGrad)"
                filter="url(#rfGlow)"
              />
              <Area
                type="monotone"
                dataKey="potential"
                stackId="1"
                stroke="hsl(51 100% 50% / 0.5)"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                fill="url(#rfPotentialGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground pt-1 border-t" style={{ borderColor: 'hsl(var(--border)/0.3)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[2.5px] rounded-full" style={{ background: 'hsl(var(--primary))' }} />
            <span>{rf.confirmedOrders}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[1.5px] rounded-full border-t-2 border-dashed" style={{ borderColor: 'hsl(var(--primary)/0.5)' }} />
            <span>{rf.potentialQuotes}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
