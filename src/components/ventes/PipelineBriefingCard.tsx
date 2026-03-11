import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Briefing {
  briefing_text: string;
  generated_at: string;
}

export function PipelineBriefingCard() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);

  useEffect(() => {
    supabase
      .from('ventes_briefing')
      .select('briefing_text, generated_at')
      .order('generated_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setBriefing(data[0]);
      })
      .catch(() => {});
  }, []);

  if (!briefing) return null;

  const dt = new Date(briefing.generated_at);
  const formatted = `Généré le ${format(dt, 'dd/MM/yyyy')} à ${format(dt, 'HH:mm')}`;

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
          Agent IA · Briefing Pipeline
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

      {/* Body */}
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.7, margin: 0, marginBottom: 10 }}>
        {briefing.briefing_text}
      </p>

      {/* Timestamp */}
      <p style={{ color: 'rgba(212,168,67,0.4)', fontSize: 12, margin: 0 }}>
        {formatted}
      </p>
    </div>
  );
}
