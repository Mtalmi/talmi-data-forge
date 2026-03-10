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

export function PipelineKpiCards({ devisList }: PipelineKpiCardsProps) {
  const kpis = useMemo(() => {
    // Pipeline Total: sum of total_ht where statut = 'en_attente'
    const pendingDevis = devisList.filter(d => d.statut === 'en_attente');
    const pipelineTotal = pendingDevis.reduce((sum, d) => sum + (d.total_ht || 0), 0);

    // Taux de Conversion: count validé (converti) / total × 100
    const total = devisList.length;
    const converted = devisList.filter(d => d.statut === 'converti').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    // Taille Moyenne: avg total_ht across all devis
    const avgSize = total > 0 ? devisList.reduce((sum, d) => sum + (d.total_ht || 0), 0) / total : 0;

    // Cycle de Vente: avg days between created_at and scored_at where scored_at exists
    const scored = devisList.filter(d => d.scored_at && d.created_at);
    let avgCycle = 0;
    if (scored.length > 0) {
      const totalDays = scored.reduce((sum, d) => {
        return sum + Math.abs(differenceInDays(new Date(d.scored_at!), new Date(d.created_at)));
      }, 0);
      avgCycle = Math.round(totalDays / scored.length);
    }

    return { pipelineTotal, conversionRate, avgSize, avgCycle };
  }, [devisList]);

  const pipeline = formatCompact(kpis.pipelineTotal);
  const avgSizeF = formatCompact(kpis.avgSize);

  const monoFont = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="border border-amber-500/20 bg-gradient-to-br from-[#1a1f2e] to-[#141824] rounded-xl p-5">
        <div>
          <span style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 36, letterSpacing: '-0.02em', color: 'white', lineHeight: 1 }}>{pipeline.main}</span>
          <span style={{ fontFamily: monoFont, fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>{pipeline.unit}</span>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9CA3AF', marginTop: 6 }}>Pipeline Total</p>
        <p style={{ fontSize: 12, fontWeight: 500, color: kpis.pipelineTotal > 0 ? '#10B981' : '#9CA3AF', marginTop: 4 }}>
          {kpis.pipelineTotal > 0 ? `${devisList.filter(d => d.statut === 'en_attente').length} devis en attente` : 'Aucun devis en attente'}
        </p>
      </div>
      <div className="border border-amber-500/20 bg-gradient-to-br from-[#1a1f2e] to-[#141824] rounded-xl p-5">
        <div>
          <span style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 36, letterSpacing: '-0.02em', color: 'white', lineHeight: 1 }}>{kpis.conversionRate}</span>
          <span style={{ fontFamily: monoFont, fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>%</span>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9CA3AF', marginTop: 6 }}>Taux de Conversion</p>
        <p style={{ fontSize: 12, fontWeight: 500, color: kpis.conversionRate >= 50 ? '#10B981' : '#9CA3AF', marginTop: 4 }}>
          {devisList.filter(d => d.statut === 'converti').length}/{devisList.length} convertis
        </p>
      </div>
      <div className="border border-amber-500/20 bg-gradient-to-br from-[#1a1f2e] to-[#141824] rounded-xl p-5">
        <div>
          <span style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 36, letterSpacing: '-0.02em', color: 'white', lineHeight: 1 }}>{avgSizeF.main}</span>
          <span style={{ fontFamily: monoFont, fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>{avgSizeF.unit}</span>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9CA3AF', marginTop: 6 }}>Taille Moyenne</p>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', marginTop: 4 }}>
          sur {devisList.length} devis
        </p>
      </div>
      <div className="border border-amber-500/20 bg-gradient-to-br from-[#1a1f2e] to-[#141824] rounded-xl p-5">
        <div>
          <span style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 36, letterSpacing: '-0.02em', color: 'white', lineHeight: 1 }}>{kpis.avgCycle || '—'}</span>
          <span style={{ fontFamily: monoFont, fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>jours</span>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9CA3AF', marginTop: 6 }}>Cycle de Vente</p>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', marginTop: 4 }}>
          {devisList.filter(d => d.scored_at).length > 0 ? `${devisList.filter(d => d.scored_at).length} devis scorés` : 'Aucun scoring'}
        </p>
      </div>
    </div>
  );
}
