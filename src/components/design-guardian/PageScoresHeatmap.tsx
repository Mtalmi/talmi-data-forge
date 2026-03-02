import { useState, useMemo } from 'react';
import { AUDIT_PAGES, type AuditPage } from './audit-data';

type SortKey = 'score' | 'issues' | 'page' | 'trend';

function scoreColor(s: number) {
  if (s >= 8.5) return { text: 'text-green-400', stroke: '#22c55e', bg: 'bg-green-600' };
  if (s >= 7.0) return { text: 'text-yellow-400', stroke: '#FFD700', bg: 'bg-yellow-600' };
  return { text: 'text-red-400', stroke: '#ef4444', bg: 'bg-red-600' };
}

function trendColor(t: string) {
  if (t === '↑') return 'text-green-400';
  if (t === '↓') return 'text-red-400';
  return 'text-slate-500';
}

export default function PageScoresHeatmap() {
  const [sortBy, setSortBy] = useState<SortKey>('score');

  const sorted = useMemo(() => {
    const arr = [...AUDIT_PAGES];
    switch (sortBy) {
      case 'score': return arr.sort((a, b) => a.score - b.score);
      case 'issues': return arr.sort((a, b) => b.issues - a.issues);
      case 'page': return arr.sort((a, b) => a.page.localeCompare(b.page));
      case 'trend': return arr.sort((a, b) => {
        const order = { '↓': 0, '→': 1, '↑': 2 };
        return (order[a.trend] ?? 1) - (order[b.trend] ?? 1);
      });
    }
  }, [sortBy]);

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Trier par:</span>
        {(['score', 'issues', 'page', 'trend'] as SortKey[]).map(k => (
          <button
            key={k}
            onClick={() => setSortBy(k)}
            className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors ${
              sortBy === k
                ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                : 'border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            {k === 'score' ? 'Score' : k === 'issues' ? 'Issues' : k === 'page' ? 'Nom' : 'Tendance'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-3">
        {sorted.map((p: AuditPage) => {
          const c = scoreColor(p.score);
          const circumference = 2 * Math.PI * 20;
          const progress = (p.score / 10) * circumference;
          return (
            <div key={p.route} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{p.page}</div>
                  <div className="text-[10px] font-mono text-slate-500">{p.route}</div>
                </div>
                {/* Mini circular score */}
                <div className="relative flex-shrink-0">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle
                      cx="24" cy="24" r="20" fill="none"
                      stroke={c.stroke}
                      strokeWidth="3"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - progress}
                      strokeLinecap="round"
                      transform="rotate(-90 24 24)"
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold font-mono ${c.text}`}>
                    {p.score}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {p.issues > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-900/40 text-yellow-400 border border-yellow-500/30">
                      {p.issues} issue{p.issues > 1 ? 's' : ''}
                    </span>
                  )}
                  {p.issues === 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-900/40 text-green-400 border border-green-500/30">
                      ✓ Clean
                    </span>
                  )}
                </div>
                <span className={`text-sm font-bold ${trendColor(p.trend)}`}>{p.trend}</span>
              </div>
              <div className="text-[9px] text-slate-600 mt-2">Scanné il y a 2h</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
