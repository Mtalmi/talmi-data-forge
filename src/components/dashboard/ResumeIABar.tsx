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
      className="relative z-[1] mb-5 px-4 py-2.5 rounded-lg backdrop-blur-sm bg-gradient-to-r from-[#D4A843]/[0.04] via-transparent to-transparent"
      style={{
        border: '1px solid rgba(212, 168, 67, 0.1)',
        borderLeft: '3px solid #D4A843',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0 animate-pulse" style={{ color: '#D4A843', fontSize: '12px', animationDuration: '3s' }}>✦</span>
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
    </div>
  );
};
