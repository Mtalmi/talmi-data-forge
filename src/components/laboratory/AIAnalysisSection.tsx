import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bot, ShieldCheck, Target, AlertTriangle, Loader2, TrendingDown } from 'lucide-react';

interface AIAnalysis {
  root_cause: string;
  confidence: number;
  similar_incidents: number;
  recommended_actions: string[];
  severity: string;
  estimated_impact: string;
}

export function AIAnalysisSection() {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('n8n_workflow_results')
        .select('result_data')
        .eq('agent_type', 'quality')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data?.[0]?.result_data) {
        try {
          const rd = typeof data[0].result_data === 'string' ? JSON.parse(data[0].result_data) : data[0].result_data;
          setAnalysis(rd as AIAnalysis);
        } catch { /* ignore */ }
      }
      setLoading(false);
    };
    fetch();
    const ch = supabase.channel('lab-ai-analysis')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'n8n_workflow_results' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const T = { gold: '#FFD700', danger: '#EF4444', textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B', warning: '#F59E0B' };

  if (loading) return (
    <div style={{ borderTop: `1px solid ${T.danger}20`, marginTop: 16, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Loader2 size={14} className="animate-spin" style={{ color: T.gold }} />
      <span style={{ fontSize: 12, color: T.textDim }}>Analyse en cours...</span>
    </div>
  );

  if (!analysis) return (
    <div style={{ borderTop: `1px solid ${T.danger}20`, marginTop: 16, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 14px', borderRadius: 999,
        background: 'rgba(212,168,67,0.08)',
        border: '1px solid rgba(212,168,67,0.25)',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#D4A843', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
          <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#D4A843' }} />
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#D4A843', letterSpacing: '0.04em' }}>Agent IA · Analyse en cours</span>
      </div>
    </div>
  );

  return (
    <div style={{ borderTop: `1px solid ${T.danger}20`, marginTop: 16, paddingTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Bot size={16} color={T.gold} />
        <span style={{ fontWeight: 800, fontSize: 14, color: T.gold }}>🤖 Analyse IA</span>
        <span style={{
          padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700,
          background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)', color: T.gold,
        }}>
          Confiance: {Math.round(analysis.confidence * 100)}%
        </span>
      </div>

      <p style={{ fontSize: 13, color: T.textPri, lineHeight: 1.6, marginBottom: 12 }}>{analysis.root_cause}</p>

      {analysis.recommended_actions?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, color: T.textDim, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Actions recommandées:</p>
          {analysis.recommended_actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '4px 0' }}>
              <Target size={10} color={T.gold} style={{ marginTop: 3, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.textSec }}>{a}</span>
            </div>
          ))}
        </div>
      )}

      {analysis.estimated_impact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={12} color={T.warning} />
          <span style={{ fontSize: 11, color: T.warning, fontWeight: 600 }}>Impact estimé: </span>
          <span style={{ fontSize: 11, color: T.textSec }}>{analysis.estimated_impact}</span>
        </div>
      )}

      {analysis.similar_incidents > 0 && (
        <p style={{ fontSize: 10, color: T.textDim, marginTop: 8 }}>
          <TrendingDown size={10} style={{ display: 'inline', marginRight: 4 }} />
          Basé sur {analysis.similar_incidents} incidents similaires
        </p>
      )}
    </div>
  );
}
