import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function extractFirstSentence(content: string): string {
  let text = content;
  try {
    const parsed = JSON.parse(content);
    if (parsed.resume_journee) text = parsed.resume_journee;
    else if (parsed.resume) text = parsed.resume;
    else if (parsed.content) text = parsed.content;
    else if (typeof parsed === 'string') text = parsed;
    else if (parsed.sections?.[0]?.content) text = parsed.sections[0].content;
  } catch {
    // Not JSON — use raw content
  }
  // Strip markdown headers
  text = text.replace(/^#+\s+.*\n?/, '').trim();
  // Extract first sentence (ending with . ! or ?)
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : text.split('\n')[0]?.trim() || text;
}

export const ResumeIABar = () => {
  const [recommendation, setRecommendation] = useState<string>('');

  useEffect(() => {
    const fetchMorningBriefing = async () => {
      const { data } = await supabase
        .from('ai_briefings')
        .select('content')
        .eq('briefing_type', 'morning')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.content) {
        setRecommendation(extractFirstSentence(data.content));
      }
    };
    fetchMorningBriefing();
  }, []);

  const displayText = recommendation || 'Analyse en cours — les recommandations du briefing matinal seront disponibles sous peu.';

  return (
    <div
      className="relative z-[1] mb-5 px-4 py-3"
      style={{ background: 'linear-gradient(135deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.02) 100%)', border: '1px solid rgba(212,168,67,0.12)', borderLeft: '3px solid #D4A843', borderRadius: '8px' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex-shrink-0 animate-pulse text-[#D4A843]" style={{ fontSize: '14px', animationDuration: '3s' }}>✦</span>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0"
            style={{ color: '#D4A843' }}
          >
            Résumé IA
          </span>
          <span
            className="w-px h-3 flex-shrink-0"
            style={{ background: 'rgba(212,168,67,0.2)' }}
          />
          <span
            className="text-[11px] overflow-hidden whitespace-nowrap text-ellipsis"
            style={{ color: 'rgba(203,213,225,0.7)', fontStyle: 'italic' }}
          >
            {displayText}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="rounded px-3 py-1 text-xs transition-colors duration-200 hover:bg-[#D4A843]/10" style={{ border: '1px solid #D4A843', color: '#D4A843', background: 'transparent' }}>
            Voir Rapport
          </button>
          <button className="rounded px-3 py-1 text-xs transition-colors duration-200 hover:bg-[#D4A843]/10" style={{ border: '1px solid #D4A843', color: '#D4A843', background: 'transparent' }}>
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
};
