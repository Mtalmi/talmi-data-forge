import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Clock, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, startOfMonth, subMonths } from 'date-fns';

const T = {
  gold: '#D4A843',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  textDim: '#64748B',
  cardBorder: '#1E2D4A',
};

const GLASS = {
  bg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  border: '#1E2D4A',
  radius: 12,
};

interface DevisRow {
  devis_id: string;
  statut: string;
  created_at: string;
  total_ht: number;
  client_id: string | null;
  client?: { nom_client: string } | null;
}

export function PipelineAnalysisCard() {
  const [open, setOpen] = useState(false);
  const [devisData, setDevisData] = useState<DevisRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (supabase.from('devis' as any) as any)
      .select('devis_id, statut, created_at, total_ht, client_id, client:clients!devis_client_id_fkey(nom_client)')
      .then(({ data }: any) => {
        setDevisData(data || []);
        setLoading(false);
      });
  }, [open]);

  const overdueDevis = useMemo(() => {
    const now = new Date();
    return devisData
      .filter(d => d.statut === 'en_attente' && differenceInDays(now, new Date(d.created_at)) > 14)
      .map(d => ({
        client: d.client?.nom_client || 'Client inconnu',
        days: differenceInDays(now, new Date(d.created_at)),
        id: d.devis_id,
      }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);
  }, [devisData]);

  const topClient = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>();
    devisData.forEach(d => {
      if (!d.client_id) return;
      const name = d.client?.nom_client || 'Inconnu';
      const cur = map.get(d.client_id) || { name, total: 0 };
      cur.total += d.total_ht || 0;
      map.set(d.client_id, cur);
    });
    let best: { name: string; total: number } | null = null;
    map.forEach(v => { if (!best || v.total > best.total) best = v; });
    return best;
  }, [devisData]);

  const trend = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const thisMonth = devisData.filter(d => new Date(d.created_at) >= thisMonthStart).length;
    const lastMonth = devisData.filter(d => {
      const dt = new Date(d.created_at);
      return dt >= lastMonthStart && dt < thisMonthStart;
    }).length;
    const diff = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth > 0 ? 100 : 0;
    return { thisMonth, lastMonth, diff };
  }, [devisData]);

  return (
    <div style={{
      background: GLASS.bg,
      border: `1px solid ${GLASS.border}`,
      borderRadius: GLASS.radius,
      borderTop: '2px solid #D4A843',
      padding: open ? 20 : '14px 20px',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: 24,
      animation: 'gold-shimmer-border 4s ease-in-out infinite',
      transition: 'padding 200ms ease',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(212,168,67,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Sparkles size={14} color={T.gold} />
        </div>
        <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Agent IA: Analyse Pipeline
        </span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(212,168,67,0.06)',
          border: '1px solid #D4A843',
        }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: T.gold, letterSpacing: '0.05em' }}>Généré par IA · Claude Opus</span>
        </div>
        {open ? <ChevronUp size={16} color={T.gold} /> : <ChevronDown size={16} color={T.gold} />}
      </button>

      {open && (
        <div style={{ marginTop: 18 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: T.textDim, fontSize: 12 }}>Analyse en cours...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div style={{ background: `${T.cardBorder}40`, borderRadius: 10, padding: '14px 16px', border: `1px solid ${T.cardBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Clock size={13} color={T.danger} />
                  <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Devis en retard</p>
                </div>
                {overdueDevis.length === 0 ? (
                  <span style={{ fontSize: 11, color: T.success }}>✓ Aucun devis en retard</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {overdueDevis.map(d => (
                      <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'rgba(241,245,249,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{d.client}</span>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 200, color: T.danger }}>{d.days}j</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: `${T.cardBorder}40`, borderRadius: 10, padding: '14px 16px', border: `1px solid ${T.cardBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Users size={13} color={T.gold} />
                  <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Top client pipeline</p>
                </div>
                {topClient ? (
                  <div>
                    <span style={{ fontSize: 13, color: 'rgba(241,245,249,0.9)', fontWeight: 600 }}>{topClient.name}</span>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 20, fontWeight: 200, color: T.gold }}>
                        {topClient.total >= 1000 ? `${(topClient.total / 1000).toFixed(0)}K` : topClient.total.toFixed(0)}
                      </span>
                      <span style={{ fontSize: 11, color: T.textDim, marginLeft: 4 }}>DH</span>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: T.textDim }}>—</span>
                )}
              </div>

              <div style={{ background: `${T.cardBorder}40`, borderRadius: 10, padding: '14px 16px', border: `1px solid ${T.cardBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <TrendingUp size={13} color={trend.diff >= 0 ? T.success : T.danger} />
                  <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tendance du mois</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 26, fontWeight: 200, color: 'white' }}>{trend.thisMonth}</span>
                  <span style={{ fontSize: 11, color: T.textDim }}>devis</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: trend.diff >= 0 ? T.success : T.danger, fontFamily: 'ui-monospace, monospace' }}>
                  {trend.diff >= 0 ? '+' : ''}{trend.diff}% vs mois dernier ({trend.lastMonth})
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
