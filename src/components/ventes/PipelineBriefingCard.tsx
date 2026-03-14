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
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBriefing(data as Briefing);
        setLoaded(true);
      }, () => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const hasBriefing = briefing && briefing.briefing_text;

  // Highlight key numbers in briefing text
  const highlightNumbers = (text: string) => {
    // Match patterns like "847 000 DH", "62%", "+5pts", "30 jours", numbers with DH/MAD
    const parts = text.split(/(\d[\d\s]*(?:\.\d+)?(?:\s*(?:DH|MAD|%|pts|jours|mois|semaines)))/gi);
    return parts.map((part, i) => {
      if (/\d/.test(part) && /(?:DH|MAD|%|pts|jours|mois|semaines)/i.test(part)) {
        return <span key={i} style={{ fontFamily: 'ui-monospace, monospace', color: '#D4A843', fontWeight: 600 }}>{part}</span>;
      }
      return part;
    });
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
      border: '1px solid #1E2D4A',
      borderRadius: 12,
      borderTop: '2px solid #D4A843',
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
        <span style={{ fontFamily: 'ui-monospace, monospace', color: '#D4A843', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          Briefing Pipeline
        </span>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(212,168,67,0.06)',
          border: '1px solid #D4A843',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#D4A843', letterSpacing: '0.05em' }}>Généré par IA · Claude Opus</span>
        </div>
      </div>

      {hasBriefing ? (
        <>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.7, margin: 0, marginBottom: 10 }}>
            {highlightNumbers(briefing.briefing_text!)}
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
