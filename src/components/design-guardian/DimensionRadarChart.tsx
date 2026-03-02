import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { DIMENSION_SCORES } from './audit-data';

const data = DIMENSION_SCORES.map(d => ({
  subject: d.dimension,
  score: d.score,
  fullMark: 10,
}));

export default function DimensionRadarChart() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tick={{ fontSize: 9, fill: '#475569' }}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#FFD700"
            fill="#FFD700"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="grid grid-cols-5 gap-2 mt-4">
        {DIMENSION_SCORES.map(d => {
          const color = d.score >= 8.5 ? 'text-green-400' : d.score >= 7.0 ? 'text-yellow-400' : 'text-red-400';
          return (
            <div key={d.dimension} className="text-center">
              <div className={`text-sm font-bold font-mono ${color}`}>{d.score}</div>
              <div className="text-[9px] text-slate-500 leading-tight">{d.dimension}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
