import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { TREND_DATA } from './audit-data';
import { crosshairCursor, EnhancedActiveDot, TbosChartTooltip } from '@/lib/chart-config';

const QualityTrendChart = React.memo(function QualityTrendChart() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-400">Score moyen — 30 derniers jours</span>
        <span className="text-xs text-green-400/70">Zone cible: ≥ 8.5</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={TREND_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} interval={4} />
          <YAxis domain={[6, 10]} tick={{ fontSize: 10, fill: '#64748b' }} />
          <Tooltip content={<TbosChartTooltip unit="/ 10" />} cursor={crosshairCursor} />
          {/* Target zone */}
          <ReferenceArea y1={8.5} y2={10} fill="rgba(16,185,129,0.05)" />
          <ReferenceLine y={8.5} stroke="rgba(34,197,94,0.4)" strokeDasharray="6 4" label={{ value: '8.5', fill: '#22C55E', fontSize: 10, position: 'right' }} />
          {/* Event markers */}
          <ReferenceLine x="J-19" stroke="rgba(212,168,67,0.3)" strokeDasharray="4 3" label={{ value: 'Wave 1 AI', fill: '#D4A843', fontSize: 9, position: 'top' }} />
          <ReferenceLine x="J-11" stroke="rgba(212,168,67,0.3)" strokeDasharray="4 3" label={{ value: 'Design Elev.', fill: '#D4A843', fontSize: 9, position: 'top' }} />
          <ReferenceLine x="J-1" stroke="rgba(212,168,67,0.3)" strokeDasharray="4 3" label={{ value: 'Wave 2 AI', fill: '#D4A843', fontSize: 9, position: 'top' }} />
          <Line type="monotone" dataKey="score" stroke="#D4A843" strokeWidth={2} dot={false} activeDot={<EnhancedActiveDot />} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default QualityTrendChart;