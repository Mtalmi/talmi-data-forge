import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Devis } from '@/hooks/useSalesWorkflow';
import { useCountUp } from '@/hooks/useCountUp';

interface PipelineKpiCardsProps {
  devisList: Devis[];
}

function formatCompact(value: number): { main: number; unit: string; suffix: string } {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return { main: parseFloat((m % 1 === 0 ? m.toFixed(0) : m.toFixed(1))), unit: 'M', suffix: 'DH' };
  }
  if (value >= 1_000) {
    return { main: Math.round(value / 1_000), unit: 'K', suffix: 'DH' };
  }
  return { main: Math.round(value), unit: '', suffix: 'DH' };
}

const monoFont = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

/* Mini sparkline SVG */
function MiniSparkline() {
  return (
    <svg width="80" height="40" viewBox="0 0 80 40" style={{ position: 'absolute', bottom: 8, right: 8, opacity: 0.3 }}>
      <polyline
        points="0,35 16,28 32,18 48,22 64,10 80,15"
        fill="none"
        stroke="#D4A843"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnimatedValue({ value, color, unit }: { value: number; color: string; unit: string }) {
  const animated = useCountUp(value, 1500);
  const display = value === 0 && unit === '%' ? '0' : `${animated}`;
  return (
    <span style={{ fontFamily: monoFont, fontWeight: 100, fontSize: 42, letterSpacing: '-0.02em', color, lineHeight: 1 }}>
      {display}
      <span style={{ fontFamily: monoFont, fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>{unit}</span>
    </span>
  );
}

export function PipelineKpiCards({ devisList }: PipelineKpiCardsProps) {
  const kpis = useMemo(() => {
    const pendingDevis = devisList.filter(d => d.statut === 'en_attente');
    const pipelineTotal = pendingDevis.reduce((sum, d) => sum + (d.total_ht || 0), 0);
    const total = devisList.length;
    const converted = devisList.filter(d => d.statut === 'converti').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    const avgSize = total > 0 ? devisList.reduce((sum, d) => sum + (d.total_ht || 0), 0) / total : 0;
    const scored = devisList.filter(d => d.scored_at && d.created_at);
    let avgCycle = 0;
    if (scored.length > 0) {
      const totalDays = scored.reduce((sum, d) => sum + Math.abs(differenceInDays(new Date(d.scored_at!), new Date(d.created_at))), 0);
      avgCycle = Math.round(totalDays / scored.length);
    }
    return { pipelineTotal, conversionRate, avgSize, avgCycle, pendingCount: pendingDevis.length };
  }, [devisList]);

  const pipeline = formatCompact(kpis.pipelineTotal);
  const avgSizeF = formatCompact(kpis.avgSize);

  const cards = [
    { value: pipeline.main, unit: `${pipeline.unit} DH`, label: 'PIPELINE TOTAL', color: '#D4A843',
      subtitle: kpis.pipelineTotal > 0 ? `${kpis.pendingCount} devis en attente` : 'Aucun devis en attente',
      subtitleColor: kpis.pipelineTotal > 0 ? '#F59E0B' : '#9CA3AF' },
    { value: kpis.conversionRate, unit: '%', label: 'TAUX DE CONVERSION', color: kpis.conversionRate === 0 ? '#EF4444' : '#D4A843',
      subtitle: `${devisList.filter(d => d.statut === 'converti').length}/${devisList.length} convertis`, subtitleColor: '#9CA3AF' },
    { value: avgSizeF.main, unit: `${avgSizeF.unit} DH`, label: 'TAILLE MOYENNE', color: '#D4A843',
      subtitle: `sur ${devisList.length} devis`, subtitleColor: '#9CA3AF' },
    { value: kpis.avgCycle, unit: 'jours', label: 'CYCLE DE VENTE', color: '#D4A843',
      subtitle: devisList.filter(d => d.scored_at).length > 0 ? `${devisList.filter(d => d.scored_at).length} devis scorés` : 'Aucun scoring',
      subtitleColor: '#9CA3AF' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          style={{
            borderTop: '2px solid #D4A843',
            border: '1px solid rgba(212,168,67,0.2)',
            borderTopWidth: 2,
            borderTopColor: '#D4A843',
            background: 'linear-gradient(135deg, #1a1f2e, #141824)',
            borderRadius: 12,
            padding: 20,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'default',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.03)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #1a1f2e, #141824)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <AnimatedValue value={card.value} color={card.color} unit={card.unit} />
          <p style={{ fontFamily: monoFont, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', marginTop: 6 }}>{card.label}</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: card.subtitleColor, marginTop: 4 }}>{card.subtitle}</p>
          <MiniSparkline />
        </div>
      ))}
    </div>
  );
}
