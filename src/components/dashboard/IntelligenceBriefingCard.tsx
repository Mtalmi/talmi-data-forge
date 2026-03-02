import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Brain, ChevronDown, ChevronUp, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface Briefing {
  id: string;
  content: string;
  type: string;
  date: string;
  generated_at: string | null;
}

export function IntelligenceBriefingCard() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('ai_briefings').select('*').order('generated_at', { ascending: false }).limit(1);
      if (data?.length) setBriefing(data[0] as Briefing);
      setLoading(false);
    };
    fetch();
    const ch = supabase.channel('dashboard-briefing')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_briefings' }, (p) => {
        setBriefing(p.new as Briefing);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (loading) return (
    <div style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid #1E2D4A', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Loader2 size={16} className="animate-spin" style={{ color: '#FFD700' }} />
      <span style={{ color: '#64748B', fontSize: 12 }}>Chargement du briefing...</span>
    </div>
  );

  if (!briefing) return (
    <div style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid #1E2D4A', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={16} style={{ color: '#64748B' }} />
        <span style={{ color: '#64748B', fontSize: 13 }}>Aucun briefing disponible. L'agent IA génère le prochain à 05:45.</span>
      </div>
    </div>
  );

  // Try to parse priorities from content
  let priorities: { label: string; urgency: string; action: string }[] = [];
  try {
    const parsed = JSON.parse(briefing.content);
    if (parsed.priorities) priorities = parsed.priorities;
  } catch { /* content is plain text */ }

  const urgencyColor = (u: string) => u === 'high' ? '#EF4444' : u === 'medium' ? '#F59E0B' : '#10B981';
  const displayContent = (() => {
    try { return JSON.parse(briefing.content).content || briefing.content; } catch { return briefing.content; }
  })();

  return (
    <div style={{
      background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
      border: '1px solid rgba(255,215,0,0.15)', borderLeft: '4px solid #FFD700',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <Brain size={18} style={{ color: '#FFD700', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#F1F5F9' }}>
            🧠 Intelligence Briefing — {new Date(briefing.date || briefing.generated_at || '').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {!expanded && priorities.length > 0 && (
            <span style={{ display: 'block', fontSize: 11, color: '#94A3B8', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ⚡ {priorities[0]?.label} — {priorities[0]?.action}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </button>

      {expanded && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid rgba(255,215,0,0.08)' }}>
          <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, margin: '12px 0', whiteSpace: 'pre-wrap' }}>
            {displayContent.substring(0, 400)}{displayContent.length > 400 ? '...' : ''}
          </p>

          {priorities.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Priorités</p>
              {priorities.slice(0, 3).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: urgencyColor(p.urgency), flexShrink: 0, boxShadow: `0 0 6px ${urgencyColor(p.urgency)}50` }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', minWidth: 120 }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{p.action}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} color="#64748B" />
            <span style={{ fontSize: 10, color: '#64748B' }}>
              Généré à {briefing.generated_at ? new Date(briefing.generated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'} par Agent IA
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
