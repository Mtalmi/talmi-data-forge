import { useMemo, useRef, useEffect, useState } from 'react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart,
} from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const SAMPLE_HOURLY_DATA = [
  { hour: '06h', volume: 12 },
  { hour: '07h', volume: 28 },
  { hour: '08h', volume: 45 },
  { hour: '09h', volume: 67 },
  { hour: '10h', volume: 82 },
  { hour: '11h', volume: 91 },
  { hour: '12h', volume: 78 },
  { hour: '13h', volume: 88 },
  { hour: '14h', volume: 95 },
  { hour: '15h', volume: 84 },
  { hour: '16h', volume: 71 },
  { hour: '17h', volume: 58 },
  { hour: '18h', volume: 34 },
  { hour: '19h', volume: 18 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(51 100% 50% / 0.3)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px hsl(51 100% 50% / 0.1)',
      }}>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px', marginBottom: '4px' }}>{label}</p>
        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700,
          fontSize: '18px',
          color: 'hsl(51 100% 50%)',
        }}>
          {payload[0].value} m³
        </p>
      </div>
    );
  }
  return null;
};

export function HourlyProductionChart() {
  const { t } = useI18n();
  const data = useMemo(() => SAMPLE_HOURLY_DATA, []);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const currentHour = new Date().getHours();
  const totalToday = data.reduce((sum, d) => sum + d.volume, 0);
  const peakHour = data.reduce((max, d) => (d.volume > max.volume ? d : max), data[0]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'hsl(51 100% 50% / 0.1)' }}>
              <Clock className="h-4 w-4" style={{ color: 'hsl(51 100% 50%)' }} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              {t.widgets.hourlyChart.title}
            </h3>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: 'hsl(145 65% 45% / 0.15)',
                color: 'hsl(145 65% 45%)',
                border: '1px solid hsl(145 65% 45% / 0.3)',
              }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'hsl(145 65% 45%)' }} />
              LIVE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-8">{t.widgets.hourlyChart.subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Peak badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: 'hsl(51 100% 50% / 0.08)',
              border: '1px solid hsl(51 100% 50% / 0.2)',
            }}>
            <TrendingUp className="h-3 w-3" style={{ color: 'hsl(51 100% 50%)' }} />
            <span className="text-xs text-muted-foreground">{t.widgets.hourlyChart.peak}:</span>
            <span className="text-xs font-bold" style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: 'hsl(51 100% 50%)',
            }}>{peakHour.hour}</span>
          </div>
          {/* Total */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t.widgets.hourlyChart.total}</p>
            <p className="text-lg font-bold" style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: 'hsl(51 100% 50%)',
            }}>{totalToday} m³</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full" style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(51, 100%, 50%)" stopOpacity={0.4} />
                <stop offset="60%" stopColor="hsl(51, 100%, 50%)" stopOpacity={0.05} />
                <stop offset="100%" stopColor="hsl(51, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              x={peakHour.hour}
              stroke="hsl(51 100% 50% / 0.4)"
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="hsl(51, 100%, 50%)"
              strokeWidth={2.5}
              fill="url(#goldGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: 'hsl(51, 100%, 50%)',
                stroke: 'hsl(var(--background))',
                strokeWidth: 2,
              }}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
