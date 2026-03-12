import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ResumeIABar = () => {
  const [recommendation, setRecommendation] = useState<string>('');

  useEffect(() => {
    const fetchMorningBriefing = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('ai_briefings')
        .select('content')
        .eq('type', 'matin')
        .gte('date', today)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.content) {
        try {
          const parsed = JSON.parse(data.content);
          const rec = parsed?.recommandations?.[0] || parsed?.recommandation || parsed?.resume || data.content;
          setRecommendation(typeof rec === 'string' ? rec : JSON.stringify(rec));
        } catch {
          // Raw text — extract first meaningful line
          const lines = data.content.split('\n').filter((l: string) => l.trim().length > 10);
          setRecommendation(lines[0] || data.content);
        }
      }
    };
    fetchMorningBriefing();
  }, []);

  const displayText = recommendation || 'Analyse en cours — les recommandations du briefing matinal seront disponibles sous peu.';

  return (
    <div
      className="relative z-[1] mb-5 px-4 py-2.5 rounded-lg backdrop-blur-sm"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderLeft: '3px solid #D4A843',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0" style={{ color: '#D4A843', fontSize: '12px' }}>✦</span>
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
          className="text-[11px] truncate"
          style={{ color: 'rgba(203,213,225,0.7)', fontStyle: 'italic' }}
        >
          {displayText}
        </span>
      </div>
    </div>
  );
};
