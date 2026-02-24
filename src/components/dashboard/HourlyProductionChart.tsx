import { useMemo, useEffect, useState } from 'react';
import {
  XAxis, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { useI18n } from '@/i18n/I18nContext';

const SAMPLE_HOURLY_DATA = [
  { hour: '06h', volume: 12 }, { hour: '07h', volume: 28 },
  { hour: '08h', volume: 45 }, { hour: '09h', volume: 67 },
  { hour: '10h', volume: 82 }, { hour: '11h', volume: 91 },
  { hour: '12h', volume: 78 }, { hour: '13h', volume: 88 },
  { hour: '14h', volume: 95 }, { hour: '15h', volume: 84 },
  { hour: '16h', volume: 71 }, { hour: '17h', volume: 58 },
  { hour: '18h', volume: 34 }, { hour: '19h', volume: 18 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
        padding: '6px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <p style={{ color: '#475569', fontSize: 10, marginBottom: 2 }}>{label}</p>
        <p style={{ fontFamily: 'Inter, system-ui', fontWeight: 300, fontSize: 14, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
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

  const totalToday = data.reduce((sum, d) => sum + d.volume, 0);
  const peakHour = data.reduce((max, d) => (d.volume > max.volume ? d : max), data[0]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-medium text-white/90">
            {t.widgets.hourlyChart.title}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{t.widgets.hourlyChart.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-slate-500">Peak: {peakHour.hour}</span>
          <div className="text-right">
            <p className="text-xl font-extralight text-white tabular-nums" style={{ fontFamily: 'Inter, system-ui' }}>
              {totalToday} <span className="text-sm text-slate-400">m³</span>
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full" style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(234, 179, 8)" stopOpacity={0.4} />
                <stop offset="40%" stopColor="rgb(234, 179, 8)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="rgb(234, 179, 8)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9, fill: '#334155', fontFamily: 'Inter, system-ui' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="rgb(234, 179, 8)"
              strokeWidth={2}
              fill="url(#goldGradient)"
              dot={false}
              activeDot={{ r: 3, fill: 'rgb(234, 179, 8)', stroke: 'none' }}
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
