import { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuditConfiguration() {
  const [open, setOpen] = useState(false);
  const [freq, setFreq] = useState('6h');
  const [threshold, setThreshold] = useState(7.0);
  const [emailOn, setEmailOn] = useState(true);
  const [dashOn, setDashOn] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span className="text-[10px] uppercase tracking-widest font-bold">Configuration de l'Audit</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-3 bg-slate-800/50 border border-slate-700 rounded-xl p-6 grid grid-cols-2 gap-6">
          {/* Frequency */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Fréquence de scan</label>
            <div className="flex gap-2">
              {['1h', '3h', '6h', '12h'].map(f => (
                <button
                  key={f}
                  onClick={() => setFreq(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors',
                    freq === f
                      ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Threshold */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Seuil d'alerte: Score &lt; {threshold}</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={5} max={9} step={0.5} value={threshold}
                onChange={e => setThreshold(+e.target.value)}
                className="flex-1 accent-yellow-500"
              />
              <span className="text-sm font-bold text-yellow-400 w-8 font-mono">{threshold}</span>
            </div>
          </div>

          {/* Notifications */}
          <Toggle label="Notifications Email" value={emailOn} onChange={setEmailOn} />
          <Toggle label="Notifications Dashboard" value={dashOn} onChange={setDashOn} />

          {/* Excluded pages */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Pages exclues du scan</label>
            <span className="text-xs text-slate-500">Aucune</span>
          </div>

          {/* Timestamps */}
          <div className="space-y-1">
            <div className="text-xs text-slate-400">
              Dernier scan complet: <span className="text-white font-mono">2 mars 2026, 00:15</span>
            </div>
            <div className="text-xs text-slate-400">
              Prochain scan: <span className="text-white font-mono">2 mars 2026, 06:15</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <div
        onClick={() => onChange(!value)}
        className={cn(
          'w-10 h-5 rounded-full border relative cursor-pointer transition-colors',
          value ? 'bg-green-600/30 border-green-500/40' : 'bg-slate-700 border-slate-600'
        )}
      >
        <div className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full transition-all',
          value ? 'right-0.5 bg-green-400' : 'left-0.5 bg-slate-500'
        )} />
      </div>
    </div>
  );
}
