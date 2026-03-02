import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Clock, AlertTriangle, ChevronDown, ChevronRight, Copy, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// ── MOCK DATA ──
const MOCK_PAGES = [
  { page: 'Immobilisations', route: '/immobilisations', score: 7.5, status: 'warn', issues: 2, issues_list: [{ severity: 'major', text: 'Page layout inconsistent with design system' }, { severity: 'minor', text: 'Missing subtle animations on card hover' }], fix_prompt: 'Refactor Immobilisations page layout to match TBOS design system. Ensure cards use bg-slate-800/50 border-slate-700 with consistent padding and yellow accent section headers.' },
  { page: 'Dettes', route: '/dettes', score: 7.8, status: 'warn', issues: 1, issues_list: [{ severity: 'major', text: 'Section headers missing yellow accent line' }], fix_prompt: 'Add yellow dashed accent lines to all section headers in Dettes page. Use border-b border-dashed border-yellow-500/30 style.' },
  { page: 'Dépenses', route: '/depenses', score: 8.0, status: 'warn', issues: 1, issues_list: [{ severity: 'minor', text: 'Empty state could use placeholder illustration' }], fix_prompt: 'Add a placeholder illustration and descriptive text for the empty state in Dépenses page.' },
  { page: 'Stocks', route: '/stocks', score: 8.1, status: 'warn', issues: 1, issues_list: [{ severity: 'minor', text: 'Autonomie Estimée badges show dashes instead of mock days' }], fix_prompt: 'Ensure stock autonomy badges display mock fallback values when stock_autonomy_cache is empty.' },
  { page: 'Prestataires', route: '/prestataires', score: 8.2, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Créances', route: '/creances', score: 8.3, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Bons de Commande', route: '/bons', score: 8.5, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Paiements', route: '/paiements', score: 8.7, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Logistique', route: '/logistique', score: 8.8, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Laboratoire', route: '/laboratoire', score: 9.1, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Production', route: '/production', score: 9.2, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Clients', route: '/clients', score: 9.3, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Operations Agent', route: '/operations-agent', score: 9.4, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Planning', route: '/planning', score: 9.4, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Ventes', route: '/ventes', score: 9.5, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Dashboard', route: '/', score: 9.6, status: 'pass', issues: 0, issues_list: [] },
  { page: 'Maintenance', route: '/maintenance', score: 9.7, status: 'pass', issues: 0, issues_list: [] },
];

const MOCK_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `J-${29 - i}`,
  score: +(7.9 + (0.9 * i) / 29).toFixed(1),
}));

const MOCK_AVG = +(MOCK_PAGES.reduce((s, p) => s + p.score, 0) / MOCK_PAGES.length).toFixed(1);
const MOCK_ALERTS = MOCK_PAGES.filter(p => p.status === 'warn').length;

function scoreColor(s: number) {
  if (s >= 9) return 'text-green-400';
  if (s >= 7) return 'text-yellow-400';
  return 'text-red-400';
}
function scoreBg(s: number) {
  if (s >= 9) return 'bg-green-600';
  if (s >= 7) return 'bg-yellow-600';
  return 'bg-red-600';
}
function statusBadge(st: string) {
  if (st === 'pass') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-500/30">PASS</span>;
  if (st === 'warn') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-900/40 text-yellow-400 border border-yellow-500/30">WARN</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/40 text-red-400 border border-red-500/30">FAIL</span>;
}
function sevBadge(sev: string) {
  if (sev === 'critical') return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-900/50 text-red-400">CRITICAL</span>;
  if (sev === 'major') return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-900/50 text-yellow-400">MAJOR</span>;
  return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-700 text-slate-400">MINOR</span>;
}

export default function DesignGuardian() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [threshold, setThreshold] = useState(8.0);

  // Try real data, fall back to mock
  const { data: realAudits } = useQuery({
    queryKey: ['design-audits'],
    queryFn: async () => {
      const { data } = await supabase.from('design_audits' as any).select('*').order('score', { ascending: true });
      return data as any[] | null;
    },
  });

  const pages = useMemo(() => {
    if (realAudits && realAudits.length > 0) return realAudits;
    return [...MOCK_PAGES].sort((a, b) => a.score - b.score);
  }, [realAudits]);

  const avg = useMemo(() => {
    if (realAudits && realAudits.length > 0) {
      return +(realAudits.reduce((s: number, p: any) => s + (p.score || 0), 0) / realAudits.length).toFixed(1);
    }
    return MOCK_AVG;
  }, [realAudits]);

  const alerts = useMemo(() => pages.filter((p: any) => p.status === 'warn' || p.status === 'fail').length, [pages]);

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Prompt copié !');
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-7 h-7" style={{ color: '#FFD700' }} /> TBOS Design Guardian
          </h1>
          <p className="text-sm text-slate-400 mt-1">Surveillance visuelle autonome · Scan toutes les 6h</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Agent Actif
          </span>
          <button
            onClick={() => toast.info('Scan lancé — résultats dans ~3 min')}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-black"
            style={{ background: 'linear-gradient(135deg, #FFD700, #B8860B)' }}
          >
            Lancer Scan
          </button>
          <span className="text-xs text-slate-500">Il y a 2h</span>
        </div>
      </div>

      {/* ── DERNIER AUDIT ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(255,215,0,0.3), transparent)' }} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'rgba(255,215,0,0.5)' }}>Dernier Audit</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3))' }} />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Score Moyen', value: avg, sub: '+0.3 vs dernier scan', icon: null, color: scoreColor(avg) },
            { label: 'Pages Analysées', value: pages.length, sub: 'modules TBOS', icon: null, color: 'text-white' },
            { label: 'Alertes', value: alerts, sub: alerts > 0 ? 'à corriger' : 'aucune', icon: <AlertTriangle className="w-4 h-4" />, color: alerts > 0 ? 'text-yellow-400' : 'text-green-400' },
            { label: 'Prochain Scan', value: 'dans 4h', sub: 'auto', icon: <Clock className="w-4 h-4" />, color: 'text-slate-300' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">{kpi.label}</div>
              <div className={cn('text-3xl font-bold', kpi.color)}>{kpi.value}</div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">{kpi.icon}{kpi.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ÉTAT DES PAGES ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(255,215,0,0.3), transparent)' }} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'rgba(255,215,0,0.5)' }}>État des Pages</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3))' }} />
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Page</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Route</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Score</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Statut</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Issues</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Dernière Analyse</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {pages.map((p: any) => {
                const expanded = expandedRow === p.route;
                return (
                  <tr key={p.route} className="group">
                    <td colSpan={7} className="p-0">
                      <div
                        className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_2rem] items-center border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
                        onClick={() => setExpandedRow(expanded ? null : p.route)}
                      >
                        <span className="px-4 py-3 font-medium text-white">{p.page}</span>
                        <span className="px-4 py-3 text-slate-400 font-mono text-xs">{p.route}</span>
                        <span className="px-4 py-3 text-center">
                          <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white', scoreBg(p.score))}>
                            {p.score}
                          </span>
                        </span>
                        <span className="px-4 py-3 text-center">{statusBadge(p.status)}</span>
                        <span className="px-4 py-3 text-center text-slate-400">{p.issues || 0}</span>
                        <span className="px-4 py-3 text-right text-xs text-slate-500">il y a 2h</span>
                        <span className="px-2">
                          {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                        </span>
                      </div>
                      {expanded && p.issues_list && p.issues_list.length > 0 && (
                        <div className="px-4 py-4 bg-slate-900/50 border-b border-slate-700/30 space-y-3">
                          {p.issues_list.map((issue: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              {sevBadge(issue.severity)}
                              <span className="text-sm text-slate-300">{issue.text}</span>
                            </div>
                          ))}
                          {p.fix_prompt && (
                            <div className="mt-3">
                              <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                                {p.fix_prompt}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyPrompt(p.fix_prompt); }}
                                className="mt-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                              >
                                <Copy className="w-3 h-3" /> Copier le Prompt
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TENDANCE QUALITÉ ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(255,215,0,0.3), transparent)' }} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'rgba(255,215,0,0.5)' }}>Tendance Qualité</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3))' }} />
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-400">Score moyen — 30 derniers jours</span>
            <span className="text-xs text-green-400/70">Objectif: 9.0+</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} interval={4} />
              <YAxis domain={[7, 10]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={9} stroke="rgba(16,185,129,0.4)" strokeDasharray="6 4" label={{ value: '9.0', fill: '#10b981', fontSize: 10, position: 'right' }} />
              <Line type="monotone" dataKey="score" stroke="#FFD700" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── CONFIGURATION ── */}
      <div>
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-widest font-bold">Configuration</span>
          <ChevronDown className={cn('w-4 h-4 transition-transform', configOpen && 'rotate-180')} />
        </button>
        {configOpen && (
          <div className="mt-3 bg-slate-800/50 border border-slate-700 rounded-xl p-6 grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Seuil de score minimum</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={5} max={10} step={0.5} value={threshold}
                  onChange={e => setThreshold(+e.target.value)}
                  className="flex-1 accent-yellow-500"
                />
                <span className="text-sm font-bold text-yellow-400 w-8">{threshold}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-2">Fréquence de scan</label>
              <div className="flex gap-2">
                {['1h', '3h', '6h', '12h'].map(f => (
                  <button key={f} className={cn('px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors', f === '6h' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' : 'border-slate-600 text-slate-400 hover:border-slate-500')}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Alertes WhatsApp</span>
              <div className="w-10 h-5 rounded-full bg-green-600/30 border border-green-500/40 relative cursor-pointer">
                <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-green-400" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Alertes Email</span>
              <div className="w-10 h-5 rounded-full bg-slate-700 border border-slate-600 relative cursor-pointer">
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-500" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
