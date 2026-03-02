import { useState } from 'react';
import { Wrench, Copy } from 'lucide-react';
import { AUDIT_PAGES, MOCK_FIX_PROMPTS } from './audit-data';
import { toast } from 'sonner';

export default function FixPromptGenerator() {
  const [selectedPage, setSelectedPage] = useState('/stocks');
  const [selectedSev, setSelectedSev] = useState('tous');
  const [output, setOutput] = useState('');

  const generate = () => {
    const prompt = MOCK_FIX_PROMPTS[selectedPage] || `No specific fix prompts available for this page yet. Run a full audit to generate recommendations.`;
    setOutput(prompt);
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Prompt copié !');
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedPage}
          onChange={e => setSelectedPage(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none"
        >
          {AUDIT_PAGES.map(p => (
            <option key={p.route} value={p.route}>{p.page}</option>
          ))}
        </select>
        <select
          value={selectedSev}
          onChange={e => setSelectedSev(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none"
        >
          <option value="tous">Tous</option>
          <option value="critique">Critique</option>
          <option value="majeur">Majeur</option>
          <option value="mineur">Mineur</option>
        </select>
        <button
          onClick={generate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-black"
          style={{ background: 'linear-gradient(135deg, #FFD700, #B8860B)' }}
        >
          <Wrench className="w-4 h-4" /> Générer Prompts Lovable
        </button>
      </div>

      {output && (
        <div className="relative">
          <pre className="bg-slate-900 border border-slate-600 rounded-lg p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-64">
            {output}
          </pre>
          <button
            onClick={copy}
            className="absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
          >
            <Copy className="w-3 h-3" /> Copier
          </button>
        </div>
      )}
    </div>
  );
}
