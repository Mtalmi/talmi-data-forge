import { memo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Chart data constants ───
const arChartData = [
  { name: '0-30j', value: 8000, fill: 'rgba(253,185,19,0.8)' },
  { name: '31-60j', value: 0, fill: 'rgba(253,185,19,0.55)' },
  { name: '61-90j', value: 0, fill: 'rgba(253,185,19,0.35)' },
  { name: '>90j', value: 0, fill: 'rgba(253,185,19,0.2)' },
];

const stockChartData = [
  { name: 'Ciment', value: 5500, max: 10000 },
  { name: 'Adjuvant', value: 150, max: 1000 },
  { name: 'Gravette', value: 95000, max: 100000 },
  { name: 'Eau', value: 15000, max: 20000 },
];

const pipelineChartData = [
  { name: 'Devis', value: 1, color: 'rgba(253,185,19,1)' },
  { name: 'BC Validés', value: 1, color: 'rgba(253,185,19,0.65)' },
  { name: 'En Prod', value: 1, color: 'rgba(253,185,19,0.4)' },
  { name: 'Terminés', value: 1, color: 'rgba(253,185,19,0.2)' },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 10, padding: '8px 14px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
      <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: 10 }}>{label}</p>
      <p style={{ color: '#fff', fontFamily: 'Inter, system-ui', fontWeight: 300, fontSize: 13 }}>
        {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString('fr-FR') : payload[0].value}
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
        <div className="text-sm font-medium text-white/90 mb-3">Créances par Ancienneté</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={arChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 9, fontFamily: 'Inter, system-ui' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,215,0,0.04)' }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} animationDuration={1000}>
                {arChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Stock Levels Horizontal Bars */}
      <div className="tbos-card tbos-card-stagger p-4 rounded-xl">
        <div className="text-sm font-medium text-white/90 mb-3">Niveaux de Stock</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockChartData} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 10, fontFamily: 'Inter, system-ui' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,215,0,0.04)' }} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} animationDuration={1000} barSize={14}>
                {stockChartData.map((_, i) => <Cell key={i} fill="rgba(253,185,19,0.7)" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Sales Pipeline Donut */}
      <div className="tbos-card tbos-card-stagger p-4 rounded-xl">
        <div className="text-sm font-medium text-white/90 mb-3">Pipeline Commercial</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pipelineChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3} animationDuration={1000}>
                {pipelineChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 10, padding: '8px 14px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
                    <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: 10 }}>{payload[0].name}</p>
                    <p style={{ color: '#fff', fontFamily: 'Inter, system-ui', fontWeight: 300, fontSize: 13 }}>
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
