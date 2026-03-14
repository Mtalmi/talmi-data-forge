import React from 'react';
import { Sparkles, TrendingDown } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { useCountUp } from '@/hooks/useCountUp';

const monoFont = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

const marginDistribution = [
  { range: '>18%', count: 2, color: '#22C55E' },
  { range: '10-17%', count: 2, color: '#F59E0B' },
  { range: '<10%', count: 2, color: '#EF4444' },
];

function AnimVal({ value, color, suffix, suffixStyle }: { value: number; color: string; suffix?: string; suffixStyle?: React.CSSProperties }) {
  const v = useCountUp(value, 1500);
  return (
    <span style={{ fontFamily: monoFont, fontSize: 42, fontWeight: 100, color }}>
      {value === 13.2 ? `${(v / 10).toFixed(1)}%` : value === 4 ? v : `+${v.toLocaleString('fr-FR')}`}
      {suffix && <span style={{ fontSize: 16, color: '#9CA3AF', fontFamily: monoFont, fontWeight: 400, marginLeft: 4, ...suffixStyle }}>{suffix}</span>}
    </span>
  );
}

export function MarginOverviewCard() {
  const margeVal = useCountUp(132, 1500);
  const devisVal = useCountUp(4, 1500);
  const gainVal = useCountUp(38400, 1500);

  return (
    <div style={{
      background: 'rgba(15,23,41,0.6)',
      border: '1px solid rgba(212,168,67,0.12)',
      borderRadius: 12,
      borderTop: '2px solid #F59E0B',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={14} color="#D4A843" />
        </div>
        <span style={{ color: '#D4A843', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: monoFont }}>
          Agent IA: Optimiseur de Marges
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(212,168,67,0.06)',
          border: '1px solid rgba(212,168,67,0.3)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#D4A843', letterSpacing: '0.05em', fontFamily: monoFont }}>Généré par IA · Claude Opus</span>
        </div>
      </div>

      {/* KPIs row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {/* Marge Moyenne */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: monoFont }}>Marge Moyenne Portefeuille</p>
          <span style={{ fontFamily: monoFont, fontSize: 42, fontWeight: 100, color: '#F59E0B' }}>
            {(margeVal / 10).toFixed(1)}%
          </span>
          <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: '#EF4444', fontFamily: monoFont, fontWeight: 500 }}>
            <TrendingDown size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />-42.1% vs mois dernier
          </span>
        </div>

        {/* Devis sous seuil */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: monoFont }}>Devis Sous Seuil</p>
          <span style={{ fontFamily: monoFont, fontSize: 42, fontWeight: 100, color: '#EF4444' }}>
            {devisVal}<span style={{ fontSize: 16, color: '#9CA3AF', fontFamily: monoFont }}>/6</span>
          </span>
        </div>

        {/* Gain potentiel */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: monoFont }}>Gain Potentiel si Optimisé</p>
          <span style={{ fontFamily: monoFont, fontSize: 42, fontWeight: 100, color: '#22C55E', textShadow: '0 0 20px rgba(34,197,94,0.3)' }}>
            +{gainVal.toLocaleString('fr-FR')}
          </span>
          <span style={{ fontSize: 16, color: '#9CA3AF', fontFamily: monoFont, marginLeft: 6 }}>MAD/mois</span>
        </div>
      </div>

      {/* Recommandation box */}
      <div style={{
        background: 'rgba(212,168,67,0.04)',
        borderLeft: '3px solid #D4A843',
        borderRadius: '0 8px 8px 0',
        padding: 16,
        marginBottom: 16,
      }}>
        <span style={{ color: '#D4A843', fontWeight: 600, fontFamily: monoFont, fontSize: 13 }}>Recommandation : </span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
          Augmenter les prix F-B30 de <span style={{ color: '#D4A843', fontFamily: monoFont, fontWeight: 600 }}>+8%</span> et F-B20 de <span style={{ color: '#D4A843', fontFamily: monoFont, fontWeight: 600 }}>+5%</span>. Impact estimé : récupération de <span style={{ color: '#D4A843', fontFamily: monoFont, fontWeight: 600 }}>28,400 MAD/mois</span> sans risque de perte client.
        </span>
      </div>

      {/* Mini bar chart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 160, height: 48 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marginDistribution} barSize={28}>
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {marginDistribution.map((d, i) => (
                  <Cell key={i} fill={d.color} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {marginDistribution.map(d => (
            <div key={d.range} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, opacity: 0.7 }} />
              <span style={{ fontSize: 10, color: d.color, fontFamily: monoFont }}>{d.range}: {d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
