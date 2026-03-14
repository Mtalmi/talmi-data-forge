import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrencyDH } from '@/lib/formatters';
import {
  AgentContainer, AgentHeader,
  AgentRecommendation, GoldText,
} from '@/components/ui/agent-card';

const monoFont = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

interface DevisRow {
  devis_id: string;
  statut: string;
  total_ht: number;
  score_ia: number | null;
  niveau_score: string | null;
  formule_id: string;
  client_id: string;
  client?: { nom_client: string } | null;
}

function probabilite(niveau: string | null) {
  if (niveau === 'Élevé') return { label: '75-90%', mid: 82.5, color: '#22C55E' };
  if (niveau === 'Moyen') return { label: '40-60%', mid: 50, color: '#F59E0B' };
  return { label: '10-30%', mid: 20, color: '#EF4444' };
}

function scoreBorderColor(niveau: string | null) {
  if (niveau === 'Élevé') return '#22C55E';
  if (niveau === 'Moyen') return '#F59E0B';
  return '#EF4444';
}

function action(niveau: string | null) {
  if (niveau === 'Élevé') return { text: '⚡ Préparer production & relancer pour BC', highlight: true };
  if (niveau === 'Moyen') return { text: '📞 Relancer sous 48h — proposer remise volume', highlight: false };
  return { text: '⏳ Attendre retour client — pas de relance agressive', highlight: false };
}

function sortOrder(niveau: string | null) {
  if (niveau === 'Élevé') return 0;
  if (niveau === 'Moyen') return 1;
  return 2;
}

export function ConversionPredictorCard({ index }: { index?: number }) {
  const [rows, setRows] = useState<DevisRow[]>([]);

  useEffect(() => {
    (supabase.from('devis' as any) as any)
      .select('devis_id, statut, total_ht, score_ia, niveau_score, formule_id, client_id, client:clients!devis_client_id_fkey(nom_client)')
      .eq('statut', 'en_attente')
      .then(({ data }: any) => setRows(data || []));
  }, []);

  const sorted = useMemo(() =>
    [...rows].sort((a, b) => sortOrder(a.niveau_score) - sortOrder(b.niveau_score)),
    [rows]
  );

  const summary = useMemo(() => {
    if (!sorted.length) return null;
    const total = sorted.reduce((s, d) => s + (d.total_ht || 0), 0);
    const avgConf = sorted.reduce((s, d) => s + probabilite(d.niveau_score).mid, 0) / sorted.length;
    return { count: sorted.length, total, avgConf: Math.round(avgConf) };
  }, [sorted]);

  if (!sorted.length) return null;

  return (
    <AgentContainer severity="operational" index={index}>
      <AgentHeader name="Prédicteur de Conversion" severityBadge="live" />

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Client', 'Formule', 'Montant', 'Score IA', 'Probabilité', 'Action recommandée'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '1.5px', color: '#9CA3AF', padding: '0 12px 10px 0',
                  whiteSpace: 'nowrap', fontFamily: monoFont,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(d => {
              const borderColor = scoreBorderColor(d.niveau_score);
              const prob = probabilite(d.niveau_score);
              const act = action(d.niveau_score);
              return (
                <tr key={d.devis_id} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 200ms',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 12px 10px 8px', fontSize: 13, color: 'white', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {d.client?.nom_client || '—'}
                  </td>
                  <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#9CA3AF', fontFamily: monoFont }}>
                    {d.formule_id}
                  </td>
                  <td style={{
                    padding: '10px 12px 10px 0', fontSize: 13, color: '#D4A843',
                    fontFamily: monoFont,
                    fontWeight: 400, whiteSpace: 'nowrap', textAlign: 'right',
                  }}>
                    {formatCurrencyDH(d.total_ht, { compact: false })}
                  </td>
                  <td style={{ padding: '10px 12px 10px 0' }}>
                    <span style={{
                      display: 'inline-block', fontSize: 11,
                      fontFamily: monoFont,
                      background: 'rgba(255,255,255,0.05)', border: `1px solid ${borderColor}`,
                      color: borderColor, borderRadius: 100, padding: '2px 10px',
                    }}>
                      <span style={{ fontWeight: 700 }}>{d.score_ia ?? '—'}</span> {d.niveau_score || ''}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px 10px 0', fontSize: 12, fontWeight: 600, color: prob.color, fontFamily: monoFont }}>
                    {prob.label}
                  </td>
                  <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: act.highlight ? 'white' : '#9CA3AF', fontWeight: act.highlight ? 500 : 400 }}>
                    {act.text}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {summary && (
        <AgentRecommendation severity="gold" title="Synthèse">
          <GoldText>{summary.count}</GoldText> deals analysés · Potentiel estimé: <GoldText>{formatCurrencyDH(summary.total, { compact: false })}</GoldText> · Confiance moyenne: <GoldText>{summary.avgConf}%</GoldText>
        </AgentRecommendation>
      )}
    </AgentContainer>
  );
}
