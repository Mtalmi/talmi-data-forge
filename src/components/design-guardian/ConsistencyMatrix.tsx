import { CONSISTENCY_MATRIX } from './audit-data';

function statusIcon(st: 'ok' | 'warn' | 'fail') {
  if (st === 'ok') return <span className="text-green-400 font-bold">✅</span>;
  if (st === 'warn') return <span className="text-yellow-400 font-bold">⚠️</span>;
  return <span className="text-red-400 font-bold">🔴</span>;
}

function statusLabel(st: 'ok' | 'warn' | 'fail') {
  if (st === 'ok') return <span className="text-green-400 text-xs">Cohérent</span>;
  if (st === 'warn') return <span className="text-yellow-400 text-xs">2 variants</span>;
  return <span className="text-red-400 text-xs">Incohérent</span>;
}

export default function ConsistencyMatrix() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Élément</th>
            <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Statut</th>
            <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Pages Affectées</th>
            <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Détail</th>
          </tr>
        </thead>
        <tbody>
          {CONSISTENCY_MATRIX.map((row) => (
            <tr key={row.element} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
              <td className="px-4 py-2.5 text-white font-medium">{row.element}</td>
              <td className="px-4 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  {statusIcon(row.status)}
                  {statusLabel(row.status)}
                </div>
              </td>
              <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{row.pages}</td>
              <td className="px-4 py-2.5 text-slate-400 text-xs">{row.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
