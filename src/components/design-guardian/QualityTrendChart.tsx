import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { TREND_DATA } from './audit-data';

export default function QualityTrendChart() {
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
          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
          {/* Target zone */}
          <ReferenceArea y1={8.5} y2={10} fill="rgba(16,185,129,0.05)" />
          <ReferenceLine y={8.5} stroke="rgba(16,185,129,0.4)" strokeDasharray="6 4" label={{ value: '8.5', fill: '#10b981', fontSize: 10, position: 'right' }} />
          {/* Event markers */}
          <ReferenceLine x="J-19" stroke="rgba(255,215,0,0.3)" strokeDasharray="4 3" label={{ value: 'Wave 1 AI', fill: '#FFD700', fontSize: 9, position: 'top' }} />
          <ReferenceLine x="J-11" stroke="rgba(59,130,246,0.3)" strokeDasharray="4 3" label={{ value: 'Design Elev.', fill: '#3b82f6', fontSize: 9, position: 'top' }} />
          <ReferenceLine x="J-1" stroke="rgba(168,85,247,0.3)" strokeDasharray="4 3" label={{ value: 'Wave 2 AI', fill: '#a855f7', fontSize: 9, position: 'top' }} />
          <Line type="monotone" dataKey="score" stroke="#FFD700" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#FFD700' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
