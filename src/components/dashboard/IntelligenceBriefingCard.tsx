import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Clock, Loader2, RefreshCw, Sun, Moon } from 'lucide-react';

interface Briefing {
  id: string;
  content: string;
  type: string;
  briefing_type: string | null;
  date: string;
  generated_at: string | null;
  score_journee: string | null;
  plant_name: string | null;
}

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

function parseResume(content: string): string {
  let text = content;
  try {
    const parsed = JSON.parse(content);
    if (parsed.resume_journee) text = parsed.resume_journee;
    else if (parsed.resume) text = parsed.resume;
    else if (parsed.content) text = parsed.content;
    else if (typeof parsed === 'string') text = parsed;
    else if (parsed.sections?.[0]?.content) text = parsed.sections[0].content;
  } catch {
    // Not JSON — use raw content (likely markdown)
  }
  text = text.replace(/^#+\s+.*\n?/, '').trim();
  return text.substring(0, 200);
}

function BriefingCard({ briefing, type }: { briefing: Briefing | null; type: 'morning' | 'evening' }) {
  const isMorning = type === 'morning';
  const icon = isMorning ? <Sun size={15} style={{ color: '#D4A843' }} /> : <Moon size={15} style={{ color: '#8B9FCC' }} />;
  const label = isMorning ? 'Briefing du Matin' : 'Rapport du Soir';
  const accentColor = isMorning ? '#D4A843' : '#8B9FCC';

  if (!briefing) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(212,168,67,0.1)',
        borderLeft: '2px solid rgba(212,168,67,0.4)',
        boxShadow: `0 0 12px ${isMorning ? 'rgba(212,168,67,0.2)' : 'rgba(139,159,204,0.2)'}`,
        borderRadius: 10, padding: '14px 16px',
        flex: 1, minWidth: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {icon}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{label}</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
          En attente du premier briefing IA...
        </p>
      </div>
    );
  }

  const resume = parseResume(briefing.content);
  const isActive = briefing.type === 'active' || briefing.briefing_type === 'active';

  return (
    <div
      className="tbos-briefing-card cursor-pointer"
      style={{
      position: 'relative',
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(4px)',
      border: `1px solid ${isMorning ? 'rgba(212,168,67,0.15)' : 'rgba(139,159,204,0.15)'}`,
      borderLeft: '2px solid rgba(212,168,67,0.4)',
      boxShadow: `0 0 12px ${isMorning ? 'rgba(212,168,67,0.2)' : 'rgba(139,159,204,0.2)'}`,
      borderRadius: 10, padding: '14px 16px',
      flex: 1, minWidth: 0,
      transition: 'all 200ms ease-out',
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = 'translateY(-1px)';
      el.style.borderColor = 'rgba(212,168,67,0.3)';
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = 'translateY(0)';
      el.style.borderColor = isMorning ? 'rgba(212,168,67,0.15)' : 'rgba(139,159,204,0.15)';
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent, rgba(212,168,67,0.7),transparent)', zIndex:99 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{label}</span>
        {briefing.score_journee && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: 'rgba(212,168,67,0.15)', color: '#D4A843' }}>
            {briefing.score_journee}
          </span>
        )}
        <span className="text-xs text-white/40" style={{ marginLeft: 'auto' }}>
          {isMorning ? 'Aujourd\'hui · 06h00' : 'Hier · 20h00'}
        </span>
      </div>

      {(() => {
        const dotIdx = resume.indexOf('.');
        if (dotIdx > 0 && dotIdx < resume.length - 1) {
          const first = resume.slice(0, dotIdx + 1);
          const rest = resume.slice(dotIdx + 1).trim();
          return (
            <p style={{ fontSize: 12, lineHeight: 1.65, marginBottom: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{first}</span>
              {rest && <span style={{ color: 'rgba(148,163,184,0.5)', fontWeight: 400 }}> {rest}{resume.length >= 200 ? '...' : ''}</span>}
            </p>
          );
        }
        return (
          <p style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.65, marginBottom: 8 }}>
            {resume}{resume.length >= 200 ? '...' : ''}
          </p>
        );
      })()}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Clock size={10} className="text-white/40" />
        <span className="text-xs text-white/40">
          {isMorning ? 'Ce matin' : (briefing.generated_at ? relativeTime(briefing.generated_at) : '—')}
        </span>
      </div>
    </div>
  );
}

export function IntelligenceBriefingCard() {
  const [morningBriefing, setMorningBriefing] = useState<Briefing | null>(null);
  const [eveningBriefing, setEveningBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBriefings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ai_briefings')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) console.error('AI Briefings query error:', error);
      if (data) console.log('AI Briefings data:', data);

      const morning = data?.find((b: any) => b.briefing_type === 'morning') ?? null;
      const evening = data?.find((b: any) => b.briefing_type === 'evening') ?? null;

      console.log('[IntelligenceBriefing] morning found:', morning);
      console.log('[IntelligenceBriefing] evening found:', evening);

      setMorningBriefing(morning);
      setEveningBriefing(evening);
    } catch (err) {
      console.error('[IntelligenceBriefing] fetch error:', err);
      setMorningBriefing(null);
      setEveningBriefing(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchBriefings();
    const ch = supabase.channel('dashboard-briefing')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_briefings' }, () => {
        fetchBriefings();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchBriefings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBriefings();
  };

  if (loading) return (
    <div style={{ background: 'rgba(15,23,41,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backdropFilter: 'blur(4px)' }}>
      <Loader2 size={16} className="animate-spin" style={{ color: '#D4A843' }} />
      <span style={{ color: '#64748B', fontSize: 12 }}>Chargement des briefings...</span>
    </div>
  );

  return (
    <div style={{
      background: 'rgba(15,23,41,0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, overflow: 'hidden',
      backdropFilter: 'blur(4px)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Brain size={17} style={{ color: '#D4A843' }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#F1F5F9', flex: 1 }}>🧠 Intelligence IA</span>
        <button onClick={handleRefresh} style={{ padding: 4, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Rafraîchir">
          <RefreshCw size={13} style={{ color: '#D4A843', ...(refreshing ? { animation: 'spin 1s linear infinite' } : {}) }} />
        </button>
      </div>

      {/* Briefing cards */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <BriefingCard briefing={morningBriefing} type="morning" />
        <BriefingCard briefing={eveningBriefing} type="evening" />
      </div>
    </div>
  );
}
