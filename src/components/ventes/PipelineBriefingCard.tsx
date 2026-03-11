import { useEffect, useState } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Briefing {
  briefing_text: string | null;
  generated_at: string | null;
}

export function PipelineBriefingCard() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('ventes_briefing')
      .select('briefing_text, generated_at')
      .eq('id', '1')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBriefing(data as Briefing);
        setLoaded(true);
      }, () => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const hasBriefing = briefing && briefing.briefing_text;

  return (
    <div style={{
      background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
      border: '1px solid #1E2D4A',
      borderRadius: 12,
      borderTop: '2px solid transparent',
      borderImage: 'linear-gradient(90deg, #D4A843, transparent) 1',
      borderImageSlice: '1 1 0 1',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      marginBottom: 24,
      animation: 'gold-shimmer-border 4s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes gold-shimmer-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,67,0); }
          50% { box-shadow: 0 0 20px 0 rgba(212,168,67,0.08); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={14} color="#D4A843" />
        </div>
        <span style={{ color: '#D4A843', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Briefing Pipeline
        </span>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(212,168,67,0.08)',
          border: '1px solid rgba(212,168,67,0.25)',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#D4A843', letterSpacing: '0.05em' }}>Généré par IA · Claude Opus</span>
        </div>
      </div>

      {hasBriefing ? (
        <>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.7, margin: 0, marginBottom: 10 }}>
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
  );
}