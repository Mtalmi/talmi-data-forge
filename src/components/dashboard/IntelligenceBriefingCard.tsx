import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Brain, ChevronDown, ChevronUp, Clock, Loader2, RefreshCw } from 'lucide-react';

interface Briefing {
  id: string;
  content: string;
  type: string;
  date: string;
  generated_at: string | null;
}

const MOCK_SECTIONS = [
  { icon: '📊', title: 'Production', color: '#F1F5F9', content: 'Objectif: 850 m³ aujourd\'hui. 14 batches planifiés. Capacité à 87%. Formule principale: F-B25 (45% du volume).' },
  { icon: '⚠️', title: 'Alertes', color: '#EF4444', content: 'Adjuvant à 10% — commande urgente recommandée. Pompe BP-01 en maintenance, fin estimée 12:00. 2 devis en attente de validation > 48h.' },
  { icon: '💰', title: 'Commercial', color: '#10B981', content: 'Pipeline: 847K DH. 3 BCs validés prêts production. Marge brute 49.9% — pricing sain. Relancer DEV-2602-316 et DEV-2602-895.' },
  { icon: '🎯', title: 'Priorités du jour', color: '#FFD700', content: '1. Valider production BL-2602-014 (Saudi Readymix, 50m³). 2. Suivre livraison Constructions Modernes (80m³ en route). 3. Relancer devis en attente.' },
];

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function parseSections(content: string) {
  // Try JSON first
  try {
    const parsed = JSON.parse(content);
    if (parsed.sections && Array.isArray(parsed.sections)) return parsed.sections;
    if (parsed.content) return null; // plain text in JSON wrapper
  } catch { /* not JSON */ }

  // Try markdown heading parsing: ## Title\ncontent
  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  const matches = [...content.matchAll(headingRegex)];
  if (matches.length >= 2) {
    const sections: { title: string; content: string }[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = (matches[i].index ?? 0) + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
      sections.push({
        title: matches[i][1].trim(),
        content: content.slice(start, end).trim(),
      });
    }
    return sections;
  }

  return null; // couldn't parse into sections
}

export function IntelligenceBriefingCard() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBriefing = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('ai_briefings')
        .select('*')
        .eq('type', 'morning')
        .order('generated_at', { ascending: false })
        .limit(1);
      if (data?.length) {
        setBriefing(data[0] as Briefing);
        setIsLive(true);
      } else {
        // fallback: try any briefing
        const { data: fallback } = await supabase
          .from('ai_briefings')
          .select('*')
          .order('generated_at', { ascending: false })
          .limit(1);
        if (fallback?.length) {
          setBriefing(fallback[0] as Briefing);
          setIsLive(true);
        } else {
          setBriefing(null);
          setIsLive(false);
        }
      }
    } catch {
      setBriefing(null);
      setIsLive(false);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchBriefing();
    const ch = supabase.channel('dashboard-briefing')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_briefings' }, (p) => {
        setBriefing(p.new as Briefing);
        setIsLive(true);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchBriefing]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBriefing();
  };

  const liveBadge = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: isLive ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.2)', color: isLive ? '#10B981' : '#64748B' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isLive ? '#10B981' : '#64748B', ...(isLive ? { boxShadow: '0 0 6px #10B98180' } : {}) }} />
      {isLive ? 'Live' : 'Demo'}
    </span>
  );

  const refreshBtn = (
    <button onClick={(e) => { e.stopPropagation(); handleRefresh(); }} style={{ padding: 4, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Rafraîchir">
      <RefreshCw size={13} style={{ color: '#FFD700', ...(refreshing ? { animation: 'spin 1s linear infinite' } : {}) }} />
    </button>
  );

  if (loading) return (
    <div style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid #1E2D4A', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Loader2 size={16} className="animate-spin" style={{ color: '#FFD700' }} />
      <span style={{ color: '#64748B', fontSize: 12 }}>Chargement du briefing...</span>
    </div>
  );

  // Determine sections to render
  let sections = MOCK_SECTIONS;
  let headerTitle = '🧠 Briefing du 1 Mars 2026';
  let subtitle = 'Généré à 05:45 par l\'Agent IA';

  if (briefing && isLive) {
    headerTitle = `🧠 Intelligence Briefing — ${new Date(briefing.date || briefing.generated_at || '').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    subtitle = briefing.generated_at ? `Généré ${relativeTime(briefing.generated_at)} par Agent IA` : '';

    const parsed = parseSections(briefing.content);
    if (parsed && parsed.length > 0) {
      const iconMap = ['📊', '⚠️', '💰', '🎯'];
      const colorMap = ['#F1F5F9', '#EF4444', '#10B981', '#FFD700'];
      sections = parsed.map((s: any, i: number) => ({
        icon: s.icon || iconMap[i % iconMap.length],
        title: s.title,
        color: s.color || colorMap[i % colorMap.length],
        content: s.content || s.text || '',
      }));
    } else {
      // Plain text — show as single block, keep mock structure for visual density
      // but replace first section content with the actual briefing text
      sections = [{
        icon: '📊', title: 'Briefing', color: '#F1F5F9',
        content: briefing.content.substring(0, 600) + (briefing.content.length > 600 ? '...' : ''),
      }];
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
      border: '1px solid rgba(255,215,0,0.15)', borderLeft: '4px solid #FFD700',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10,
        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <Brain size={18} style={{ color: '#FFD700', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#F1F5F9' }}>{headerTitle}</span>
            {liveBadge}
          </div>
          {!expanded && <span style={{ display: 'block', fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{subtitle}</span>}
        </div>
        {refreshBtn}
        {expanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </button>

      {expanded && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid rgba(255,215,0,0.08)' }}>
          <p style={{ color: '#94A3B8', fontSize: 11, marginBottom: 10, marginTop: 8 }}>{subtitle}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sections.map((s, i) => (
              <div key={i}>
                <p style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 3 }}>{s.icon} {s.title}</p>
                <p style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.6 }}>{s.content}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} color="#64748B" />
              <span style={{ fontSize: 10, color: '#64748B' }}>
                {isLive && briefing?.generated_at ? relativeTime(briefing.generated_at) : 'Prochain briefing: demain 05:45'}
              </span>
            </div>
            {!isLive && <span style={{ fontSize: 10, color: '#64748B', fontStyle: 'italic' }}>Données de démonstration</span>}
          </div>
        </div>
      )}
    </div>
  );
}
