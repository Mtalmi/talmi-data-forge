import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Briefing {
  briefing_text: string | null;
  generated_at: string | null;
}

export function ProductionBriefingCard() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('production_briefing' as any)
      .select('briefing_text, generated_at')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setBriefing(data as Briefing);
        setLoaded(true);
      }, () => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const hasBriefing = briefing && briefing.briefing_text;

  return (
    <section>
      {/* Section header matching Agent IA style */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Sparkles size={15} strokeWidth={1.5} style={{ color: '#D4A843', flexShrink: 0 }} />
        <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
          Briefing Production
        </span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(212,168,67,0.3) 0%, transparent 80%)' }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(15,22,41,0.8)',
          border: '1px solid #D4A843',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#D4A843', letterSpacing: '0.05em' }}>Généré par IA · Claude Opus</span>
        </div>
      </div>

      {/* Card body */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(212, 168, 67, 0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderLeft: '3px solid #D4A843',
        borderTop: '2px solid #D4A843',
        borderRadius: 12,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        animation: 'prod-briefing-shimmer 4s ease-in-out infinite',
      }}>
        <style>{`
          @keyframes prod-briefing-shimmer {
            0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,67,0); }
            50% { box-shadow: 0 0 20px 0 rgba(212,168,67,0.08); }
          }
        `}</style>

        {hasBriefing ? (
          <>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.7, margin: 0, marginBottom: 10 }}>
              {briefing.briefing_text}
            </p>
            {briefing.generated_at && (
              <p style={{ color: 'rgba(212,168,67,0.4)', fontSize: 12, margin: 0, textAlign: 'right' }}>
                {`Généré le ${format(new Date(briefing.generated_at), 'dd/MM')} à ${format(new Date(briefing.generated_at), 'HH:mm')}`}
              </p>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
            <Sparkles size={16} color="rgba(212,168,67,0.4)" />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Briefing IA en attente de génération…</span>
          </div>
        )}
      </div>
    </section>
  );
}
