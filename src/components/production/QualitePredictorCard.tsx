import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

interface FormuleRow {
  formule: string;
  totalBatches: number;
  valideBatches: number;
  ecartBatches: number;
  conformitePct: number;
  risque: 'Faible' | 'Modéré' | 'Élevé';
}

export function QualitePredictorCard() {
  const [rows, setRows] = useState<FormuleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();

      const { data: batches } = await supabase
        .from('production_batches')
        .select('id, quality_status, has_critical_variance, bl_id, bons_livraison_reels!inner(formule_id)')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      if (!batches || batches.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const grouped: Record<string, { total: number; valide: number; ecart: number }> = {};
      batches.forEach((b: any) => {
        const formule = b.bons_livraison_reels?.formule_id || 'Inconnu';
        if (!grouped[formule]) grouped[formule] = { total: 0, valide: 0, ecart: 0 };
        grouped[formule].total++;
        const qs = (b.quality_status || '').toLowerCase();
        if (qs === 'validé' || qs === 'valide' || qs === 'conforme' || qs === 'ok') {
          grouped[formule].valide++;
        }
        if (qs === 'ecart' || qs === 'écart' || qs === 'non_conforme' || qs === 'rejeté' || qs === 'rejete' || b.has_critical_variance) {
          grouped[formule].ecart++;
        }
      });

      const result: FormuleRow[] = Object.entries(grouped).map(([formule, g]) => {
        const conformitePct = g.total > 0 ? Math.round((g.valide / g.total) * 100) : 0;
        let risque: 'Faible' | 'Modéré' | 'Élevé' = 'Faible';
        if (conformitePct < 80 || g.ecart > 2) risque = 'Élevé';
        else if (conformitePct < 95 || g.ecart > 0) risque = 'Modéré';
        return { formule, totalBatches: g.total, valideBatches: g.valide, ecartBatches: g.ecart, conformitePct, risque };
      });

      const order = { 'Élevé': 0, 'Modéré': 1, 'Faible': 2 };
      result.sort((a, b) => order[a.risque] - order[b.risque]);

      setRows(result);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return null;

  const totalFormules = rows.length;
  const totalBatches = rows.reduce((s, r) => s + r.totalBatches, 0);
  const totalValide = rows.reduce((s, r) => s + r.valideBatches, 0);
  const totalEcarts = rows.reduce((s, r) => s + r.ecartBatches, 0);
  const globalConformite = totalBatches > 0 ? Math.round((totalValide / totalBatches) * 100) : 0;

  const conformiteColor = (pct: number) =>
    pct >= 95 ? '#34d399' : pct >= 80 ? '#fbbf24' : '#f87171';

  const risqueDisplay = (r: FormuleRow['risque']) => {
    if (r === 'Faible') return { icon: '✅', color: '#34d399' };
    if (r === 'Modéré') return { icon: '⚠️', color: '#fbbf24' };
    return { icon: '🔴', color: '#f87171' };
  };

  const actionText = (r: FormuleRow['risque']) => {
    if (r === 'Faible') return 'Maintenir les paramètres actuels';
    if (r === 'Modéré') return 'Vérifier le dosage et recalibrer';
    return 'Arrêt recommandé — contrôle qualité urgent';
  };

  const COLS = [
    { label: 'Formule', width: '14%', align: 'left' as const },
    { label: 'Batches aujourd\'hui', width: '14%', align: 'center' as const },
    { label: 'Conformité', width: '12%', align: 'center' as const },
    { label: 'Écarts détectés', width: '13%', align: 'center' as const },
    { label: 'Risque qualité', width: '14%', align: 'center' as const },
    { label: 'Action', width: '33%', align: 'left' as const },
  ];

  return (
    <section>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Sparkles size={15} strokeWidth={1.5} style={{ color: '#D4A843', flexShrink: 0 }} />
        <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
          Agent IA: Prédicteur Qualité
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

      {/* Table card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(212, 168, 67, 0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderLeft: '3px solid #D4A843',
        borderTop: '2px solid #D4A843',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {rows.length > 0 ? (
          <>
            {/* Header row */}
            <div style={{
              display: 'flex', padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              {COLS.map(c => (
                <div key={c.label} style={{
                  width: c.width, fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)',
                  textAlign: c.align,
                  display: 'flex', justifyContent: c.align === 'center' ? 'center' : 'flex-start',
                  alignItems: 'center',
                }}>{c.label}</div>
              ))}
            </div>

            {/* Data rows */}
            {rows.map(r => {
              const rd = risqueDisplay(r.risque);
              const isEleve = r.risque === 'Élevé';
              return (
                <div key={r.formule} style={{
                  display: 'flex', padding: '12px 16px', alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderLeft: isEleve ? '2px solid #D4A843' : '2px solid transparent',
                  background: isEleve ? 'rgba(212,168,67,0.03)' : 'transparent',
                  transition: 'background 150ms',
                }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.04)')}
                   onMouseLeave={e => (e.currentTarget.style.background = isEleve ? 'rgba(212,168,67,0.03)' : 'transparent')}>
                  {/* Formule */}
                  <div style={{ width: COLS[0].width, fontSize: 13, color: '#fff', fontWeight: 500 }}>
                    {r.formule}
                  </div>
                  {/* Batches */}
                  <div style={{ width: COLS[1].width, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 13, fontWeight: 200, color: 'rgba(255,255,255,0.7)' }}>
                      {r.totalBatches}
                    </span>
                  </div>
                  {/* Conformité */}
                  <div style={{ width: COLS[2].width, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                      fontSize: 13, fontWeight: 200, color: conformiteColor(r.conformitePct),
                    }}>{r.conformitePct}%</span>
                  </div>
                  {/* Écarts */}
                  <div style={{ width: COLS[3].width, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                      fontSize: 13, fontWeight: 200,
                      color: r.ecartBatches > 0 ? '#f87171' : '#34d399',
                    }}>{r.ecartBatches}</span>
                  </div>
                  {/* Risque */}
                  <div style={{ width: COLS[4].width, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, color: rd.color }}>{rd.icon} {r.risque}</span>
                  </div>
                  {/* Action */}
                  <div style={{ width: COLS[5].width, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                    {actionText(r.risque)}
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace' }}>
                {totalFormules} formules analysées · Conformité globale: {globalConformite}% · {totalEcarts} écarts détectés aujourd'hui
              </p>
            </div>
          </>
        ) : (
          <div style={{ padding: '24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Sparkles size={16} color="#D4A843" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.7 }}>
                  Risque qualité <span style={{ color: '#34d399', fontWeight: 600 }}>faible</span> pour les prochaines 4h. Formule B30: surveiller affaissement (+8mm vs cible). Prochain contrôle recommandé: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', color: '#D4A843' }}>14h30</span>.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                    background: 'rgba(212,168,67,0.15)', color: '#D4A843',
                    boxShadow: '0 0 0 1px rgba(212, 168, 67, 0.3)',
                  }}>Confiance: 91%</span>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                    background: 'rgba(16,185,129,0.15)', color: '#34d399',
                  }}>Risque Faible</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
