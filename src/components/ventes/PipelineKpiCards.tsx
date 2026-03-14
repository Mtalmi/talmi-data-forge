import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Devis } from '@/hooks/useSalesWorkflow';
import { formatCurrencyDH } from '@/lib/formatters';

interface PipelineKpiCardsProps {
  devisList: Devis[];
}

function formatCompact(value: number): { main: string; unit: string } {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return { main: `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`, unit: 'DH' };
  }
  if (value >= 1_000) {
    return { main: `${Math.round(value / 1_000)}K`, unit: 'DH' };
  }
  return { main: `${Math.round(value)}`, unit: 'DH' };
}

const monoFont = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

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
      const totalDays = scored.reduce((sum, d) => {
        return sum + Math.abs(differenceInDays(new Date(d.scored_at!), new Date(d.created_at)));
      }, 0);
      avgCycle = Math.round(totalDays / scored.length);
    }

    return { pipelineTotal, conversionRate, avgSize, avgCycle, pendingCount: pendingDevis.length };
  }, [devisList]);

  const pipeline = formatCompact(kpis.pipelineTotal);
  const avgSizeF = formatCompact(kpis.avgSize);

  const cards = [
    {
      main: pipeline.main,
      unit: pipeline.unit,
      label: 'PIPELINE TOTAL',
      mainColor: '#D4A843',
      subtitle: kpis.pipelineTotal > 0
        ? `${kpis.pendingCount} devis en attente`
        : 'Aucun devis en attente',
      subtitleColor: kpis.pipelineTotal > 0 ? '#F59E0B' : '#9CA3AF',
    },
    {
      main: `${kpis.conversionRate}`,
      unit: '%',
      label: 'TAUX DE CONVERSION',
      mainColor: kpis.conversionRate === 0 ? '#EF4444' : '#D4A843',
      subtitle: `${devisList.filter(d => d.statut === 'converti').length}/${devisList.length} convertis`,
      subtitleColor: '#9CA3AF',
    },
    {
      main: avgSizeF.main,
      unit: avgSizeF.unit,
      label: 'TAILLE MOYENNE',
      mainColor: '#D4A843',
      subtitle: `sur ${devisList.length} devis`,
      subtitleColor: '#9CA3AF',
    },
    {
      main: kpis.avgCycle ? `${kpis.avgCycle}` : '—',
      unit: 'jours',
      label: 'CYCLE DE VENTE',
      mainColor: '#D4A843',
      subtitle: devisList.filter(d => d.scored_at).length > 0
        ? `${devisList.filter(d => d.scored_at).length} devis scorés`
        : 'Aucun scoring',
      subtitleColor: '#9CA3AF',
    },
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
          }}
        >
          <div>
            <span style={{ fontFamily: monoFont, fontWeight: 200, fontSize: 36, letterSpacing: '-0.02em', color: card.mainColor, lineHeight: 1 }}>{card.main}</span>
            <span style={{ fontFamily: monoFont, fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>{card.unit}</span>
          </div>
          <p style={{ fontFamily: monoFont, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', marginTop: 6 }}>{card.label}</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: card.subtitleColor, marginTop: 4 }}>
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}
