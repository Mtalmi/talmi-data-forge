import { useEffect, useState } from 'react';
import {
  XAxis, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';

interface HourlyPoint {
  hour: string;
  volume: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 8,
        padding: '6px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
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
  const [data, setData] = useState<HourlyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    async function fetch() {
      // Get most recent date
      const { data: latest } = await supabase
        .from('bons_livraison_reels')
        .select('date_livraison')
        .order('date_livraison', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest) { setLoading(false); return; }

      const targetDate = latest.date_livraison;

      // Get all BLs for that date
      const { data: bls } = await supabase
        .from('bons_livraison_reels')
        .select('volume_m3, heure_prevue, heure_depart_centrale')
        .eq('date_livraison', targetDate);

      if (!bls || bls.length === 0) { setLoading(false); return; }

      // Aggregate by hour
      const hourMap = new Map<number, number>();
      bls.forEach(bl => {
        const timeStr = bl.heure_depart_centrale || bl.heure_prevue;
        let hour = 8; // default
        if (timeStr) {
          const parsed = parseInt(timeStr.split(':')[0], 10);
          if (!isNaN(parsed)) hour = parsed;
        }
        hourMap.set(hour, (hourMap.get(hour) || 0) + bl.volume_m3);
      });

      // Build sorted array
      const points: HourlyPoint[] = [];
      const hours = Array.from(hourMap.keys()).sort((a, b) => a - b);
      hours.forEach(h => {
        points.push({ hour: `${String(h).padStart(2, '0')}h`, volume: Math.round(hourMap.get(h)! * 10) / 10 });
      });

      setData(points);
      setLoading(false);
    }
    fetch();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setAnimated(true), 200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const totalToday = data.reduce((sum, d) => sum + d.volume, 0);
  const peakHour = data.length > 0 ? data.reduce((max, d) => (d.volume > max.volume ? d : max), data[0]) : null;

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
          {peakHour && <span className="text-[11px] text-slate-500">Peak: {peakHour.hour}</span>}
          <div className="text-right">
            <p className="text-xl font-extralight text-white tabular-nums" style={{ fontFamily: 'Inter, system-ui' }}>
              {Math.round(totalToday)} <span className="text-sm text-slate-400">m³</span>
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
              tick={{ fontSize: 9, fill: 'rgba(148,163,184,0.25)', fontFamily: 'Inter, system-ui' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
            {data.length > 0 && (
              <Area
                type="monotone"
                dataKey="volume"
                stroke="rgb(234, 179, 8)"
                strokeWidth={2}
                fill="url(#goldGradient)"
                dot={false}
                activeDot={false}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
