import { useState, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrencyDH } from '@/lib/formatters';

const T = {
  gold: '#D4A843',
  amber: '#B8860B',
  red: '#DC2626',
  textPri: 'rgba(255,255,255,0.9)',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: '#64748B',
};

const GLASS = {
  bg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  border: '#1E2D4A',
};

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

function scoreColor(niveau: string | null) {
  if (niveau === 'Élevé') return T.gold;
  if (niveau === 'Moyen') return T.amber;
  return T.red;
}

function probabilite(niveau: string | null) {
  if (niveau === 'Élevé') return { label: '75-90%', mid: 82.5 };
  if (niveau === 'Moyen') return { label: '40-60%', mid: 50 };
  return { label: '10-30%', mid: 20 };
}

function action(niveau: string | null) {
  if (niveau === 'Élevé') return '⚡ Préparer production & relancer pour BC';
  if (niveau === 'Moyen') return '📞 Relancer sous 48h — proposer remise volume';
  return '⏳ Attendre retour client — pas de relance agressive';
}

function sortOrder(niveau: string | null) {
  if (niveau === 'Élevé') return 0;
  if (niveau === 'Moyen') return 1;
  return 2;
}

export function ConversionPredictorCard() {
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
    <div style={{
      background: GLASS.bg,
      border: `1px solid ${GLASS.border}`,
      borderRadius: 12,
      padding: '20px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Shimmer border */}
      <div style={{
        position: 'absolute', inset: -1, borderRadius: 13, padding: 1, pointerEvents: 'none',
        background: `linear-gradient(90deg, transparent 0%, ${T.gold}40 50%, transparent 100%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 4s ease-in-out infinite',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Prédicteur de Conversion
          </span>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 600, color: T.gold,
          background: 'rgba(15,22,41,0.8)', border: `1px solid ${T.gold}`,
          borderRadius: 100, padding: '3px 10px', letterSpacing: '0.05em',
        }}>
          ✨ Généré par IA · Claude Opus
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Client', 'Formule', 'Montant', 'Score IA', 'Probabilité', 'Action recommandée'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.15em', color: 'rgba(148,163,184,0.35)', padding: '0 12px 10px 0',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(d => {
              const color = scoreColor(d.niveau_score);
              const prob = probabilite(d.niveau_score);
              const isEleve = d.niveau_score === 'Élevé';
              return (
                <tr key={d.devis_id} style={{
                  borderLeft: isEleve ? `2px solid ${T.gold}` : '2px solid transparent',
                  boxShadow: isEleve ? 'inset 4px 0 12px -4px rgba(212,168,67,0.12)' : undefined,
                }}>
                  <td style={{ padding: '8px 12px 8px 8px', fontSize: 13, color: T.textPri, whiteSpace: 'nowrap' }}>
                    {d.client?.nom_client || '—'}
                  </td>
                  <td style={{ padding: '8px 12px 8px 0', fontSize: 12, color: T.textDim }}>
                    {d.formule_id}
                  </td>
                  <td style={{
                    padding: '8px 12px 8px 0', fontSize: 13, color: T.textPri,
                    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                    fontWeight: 200, whiteSpace: 'nowrap',
                  }}>
                    {formatCurrencyDH(d.total_ht, { compact: false })}
                  </td>
                  <td style={{ padding: '8px 12px 8px 0' }}>
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 200,
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                      background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}`,
                      color, borderRadius: 100, padding: '2px 10px',
                    }}>
                      {d.score_ia ?? '—'} {d.niveau_score || ''}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px 8px 0', fontSize: 12, fontWeight: 600, color }}>
                    {prob.label}
                  </td>
                  <td style={{ padding: '8px 12px 8px 0', fontSize: 12, color: T.textMuted }}>
                    {action(d.niveau_score)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ marginTop: 14, fontSize: 11, color: T.textDim }}>
          {summary.count} deals analysés · Potentiel estimé: {formatCurrencyDH(summary.total, { compact: false })} · Confiance moyenne: {summary.avgConf}%
        </div>
      )}
    </div>
  );
}
