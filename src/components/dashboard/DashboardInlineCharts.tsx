import { memo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Chart data constants ───
const arChartData = [
  { name: '0-30j', value: 8000, fill: '#10B981' },
  { name: '31-60j', value: 0, fill: '#F59E0B' },
  { name: '61-90j', value: 0, fill: '#F97316' },
  { name: '>90j', value: 0, fill: '#EF4444' },
];

const stockChartData = [
  { name: 'Ciment', value: 5500, max: 10000 },
  { name: 'Adjuvant', value: 150, max: 1000 },
  { name: 'Gravette', value: 95000, max: 100000 },
  { name: 'Eau', value: 15000, max: 20000 },
];

const getStockChartColor = (value: number, max: number) => {
  const pct = value / max;
  if (pct < 0.2) return '#EF4444';
  if (pct < 0.4) return '#F59E0B';
  return '#10B981';
};

const pipelineChartData = [
  { name: 'Devis', value: 1, color: '#FFD700' },
  { name: 'BC Validés', value: 1, color: '#3B82F6' },
  { name: 'En Prod', value: 1, color: '#F59E0B' },
  { name: 'Terminés', value: 1, color: '#10B981' },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1E293B', border: '1px solid #FFD700', borderRadius: 8, padding: '6px 12px' }}>
      <p style={{ color: '#94A3B8', fontSize: 10 }}>{label}</p>
      <p style={{ color: '#FFD700', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13 }}>
        {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString('fr-MA') : payload[0].value}
        {payload[0].name !== 'value' ? '' : ' DH'}
      </p>
    </div>
  );
};

export const DashboardInlineCharts = memo(function DashboardInlineCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chart 1: AR Aging Bar Chart */}
      <div className="tbos-card tbos-card-stagger p-4 rounded-xl">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Créances par Ancienneté</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={arChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,215,0,0.04)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1000}>
                {arChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Stock Levels Horizontal Bars */}
      <div className="tbos-card tbos-card-stagger p-4 rounded-xl">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Niveaux de Stock</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockChartData} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,215,0,0.04)' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1000} barSize={16}>
                {stockChartData.map((entry, i) => <Cell key={i} fill={getStockChartColor(entry.value, entry.max)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Sales Pipeline Donut */}
      <div className="tbos-card tbos-card-stagger p-4 rounded-xl">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Pipeline Commercial</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pipelineChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3} animationDuration={1000}>
                {pipelineChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background: '#1E293B', border: '1px solid #FFD700', borderRadius: 8, padding: '6px 12px' }}>
                    <p style={{ color: '#94A3B8', fontSize: 10 }}>{payload[0].name}</p>
                    <p style={{ color: '#FFD700', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13 }}>
                      {payload[0].value}
                    </p>
                  </div>
                );
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
