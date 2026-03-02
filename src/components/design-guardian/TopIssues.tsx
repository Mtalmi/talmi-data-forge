import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Camera } from 'lucide-react';
import { AUDIT_ISSUES, type AuditIssue } from './audit-data';
import { toast } from 'sonner';

function sevStyle(sev: AuditIssue['severity']) {
  if (sev === 'critique') return { border: 'border-l-red-500', badge: 'bg-red-900/50 text-red-400', label: 'CRITIQUE' };
  if (sev === 'majeur') return { border: 'border-l-yellow-500', badge: 'bg-yellow-900/50 text-yellow-400', label: 'MAJEUR' };
  return { border: 'border-l-blue-500', badge: 'bg-blue-900/50 text-blue-400', label: 'MINEUR' };
}

export default function TopIssues() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  return (
    <div className="space-y-2">
      {AUDIT_ISSUES.map((issue) => {
        const s = sevStyle(issue.severity);
        const isExpanded = expanded === issue.id;
        const isResolved = resolved.has(issue.id);

        return (
          <div
            key={issue.id}
            className={`bg-slate-800/50 border border-slate-700 rounded-xl border-l-4 ${s.border} ${isResolved ? 'opacity-50' : ''}`}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/20 transition-colors"
              onClick={() => toggle(issue.id)}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />}
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.badge} flex-shrink-0`}>{s.label}</span>
              <span className="text-sm text-white font-medium flex-1 truncate">{issue.page} — {issue.title}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-slate-700 text-slate-400 flex-shrink-0">{issue.category}</span>
              <span className="text-[10px] text-slate-600 flex-shrink-0">{issue.detected}</span>
            </div>
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-700/30 pt-3">
                <p className="text-sm text-slate-300">{issue.description}</p>
                {/* Screenshot placeholder */}
                <div className="bg-slate-900/60 border border-slate-700 rounded-lg h-24 flex items-center justify-center gap-2 text-slate-600">
                  <Camera className="w-5 h-5" />
                  <span className="text-xs">📸 Capture automatique</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info('Prompt de fix généré — voir section Générateur');
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Générer Prompt de Fix
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setResolved(prev => new Set(prev).add(issue.id));
                      toast.success('Marqué comme résolu');
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors"
                  >
                    <Check className="w-3 h-3" /> Marquer Résolu
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
