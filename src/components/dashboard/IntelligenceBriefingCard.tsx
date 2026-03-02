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
    <div style={{
      background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
      border: '1px solid rgba(255,215,0,0.15)', borderLeft: '4px solid #FFD700',
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={18} style={{ color: '#FFD700' }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#F1F5F9' }}>🧠 Briefing du 1 Mars 2026</span>
        </div>
        <span style={{ color: '#64748B', fontSize: 10, fontStyle: 'italic' }}>Données de démonstration</span>
      </div>
      <p style={{ color: '#94A3B8', fontSize: 11, marginBottom: 10 }}>Généré à 05:45 par l'Agent IA</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9', marginBottom: 3 }}>📊 Production</p>
          <p style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.6 }}>Objectif: 850 m³ aujourd'hui. 14 batches planifiés. Capacité à 87%. Formule principale: F-B25 (45% du volume).</p>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', marginBottom: 3 }}>⚠️ Alertes</p>
          <p style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.6 }}>Adjuvant à 10% — commande urgente recommandée. Pompe BP-01 en maintenance, fin estimée 12:00. 2 devis en attente de validation {'>'} 48h.</p>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginBottom: 3 }}>💰 Commercial</p>
          <p style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.6 }}>Pipeline: 847K DH. 3 BCs validés prêts production. Marge brute 49.9% — pricing sain. Relancer DEV-2602-316 et DEV-2602-895.</p>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#FFD700', marginBottom: 3 }}>🎯 Priorités du jour</p>
          <p style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.6 }}>1. Valider production BL-2602-014 (Saudi Readymix, 50m³). 2. Suivre livraison Constructions Modernes (80m³ en route). 3. Relancer devis en attente.</p>
        </div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
        <span style={{ fontSize: 10, color: '#64748B' }}>Prochain briefing: demain 05:45</span>
        <button onClick={() => {}} style={{ padding: '3px 10px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          🔄 Rafraîchir
        </button>
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
