import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Clock } from 'lucide-react';

const DEMO_HOURLY_DATA = [
  { hour: '06h', volume: 12 },
  { hour: '07h', volume: 28 },
  { hour: '08h', volume: 45 },
  { hour: '09h', volume: 52 },
  { hour: '10h', volume: 38 },
  { hour: '11h', volume: 41 },
  { hour: '12h', volume: 15 },
  { hour: '13h', volume: 8 },
  { hour: '14h', volume: 35 },
  { hour: '15h', volume: 47 },
  { hour: '16h', volume: 42 },
  { hour: '17h', volume: 22 },
  { hour: '18h', volume: 6 },
];

export function HourlyProductionChart() {
  const { isDemoMode } = useDemoMode();

  const data = useMemo(() => {
    if (isDemoMode) return DEMO_HOURLY_DATA;
    // In production, this would come from a real query
    return DEMO_HOURLY_DATA;
  }, [isDemoMode]);

  const currentHour = new Date().getHours();
  const totalToday = data.reduce((sum, d) => sum + d.volume, 0);
  const peakHour = data.reduce((max, d) => (d.volume > max.volume ? d : max), data[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Production Journalière</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Volume produit par heure (m³)</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Total: <strong className="text-foreground font-mono">{totalToday} m³</strong></span>
          <span>Pic: <strong className="text-primary font-mono">{peakHour.hour}</strong></span>
        </div>
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} m³`, 'Volume']}
            />
            <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => {
                const hourNum = parseInt(entry.hour);
                const isCurrentHour = hourNum === currentHour;
                const isPeak = entry === peakHour;
                return (
                  <Cell
                    key={index}
                    fill={
                      isCurrentHour
                        ? 'hsl(var(--primary))'
                        : isPeak
                        ? 'hsl(var(--primary) / 0.7)'
                        : 'hsl(var(--primary) / 0.3)'
                    }
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
