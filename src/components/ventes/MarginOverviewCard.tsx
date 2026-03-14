import React from 'react';
import { Sparkles, TrendingDown } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

const T = {
  gold: '#FFD700',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textDim: '#64748B',
  cardBorder: '#1E2D4A',
};

const GLASS = {
  bg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  border: '#1E2D4A',
  radius: 12,
};

const monoFont = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

const marginDistribution = [
  { range: '>18%', count: 2, color: T.success },
  { range: '10-17%', count: 2, color: T.warning },
  { range: '<10%', count: 2, color: T.danger },
];

export function MarginOverviewCard() {
  return (
    <div style={{
      background: GLASS.bg,
      border: `1px solid ${GLASS.border}`,
      borderRadius: GLASS.radius,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={14} color={T.gold} />
        </div>
        <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Agent IA: Optimiseur de Marges
        </span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
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

      {/* KPIs row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* Marge Moyenne */}
        <div style={{ background: `${T.cardBorder}40`, borderRadius: 10, padding: '14px 16px', border: `1px solid ${T.cardBorder}` }}>
          <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Marge Moyenne Portefeuille</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: monoFont, fontSize: 36, fontWeight: 200, color: T.warning }}>13.2%</span>
          </div>
          <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#EF4444', fontFamily: monoFont, fontWeight: 600 }}>
            <TrendingDown size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />-42.1% vs mois dernier
          </span>
        </div>

        {/* Devis sous seuil */}
        <div style={{ background: `${T.cardBorder}40`, borderRadius: 10, padding: '14px 16px', border: `1px solid ${T.cardBorder}` }}>
          <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Devis Sous Seuil</p>
          <span style={{ fontFamily: monoFont, fontSize: 36, fontWeight: 200, color: '#EF4444' }}>4<span style={{ fontSize: 16, color: T.textDim }}>/6</span></span>
        </div>

        {/* Gain potentiel */}
        <div style={{ background: `${T.cardBorder}40`, borderRadius: 10, padding: '14px 16px', border: `1px solid ${T.cardBorder}` }}>
          <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Gain Potentiel si Optimisé</p>
          <span style={{ fontFamily: monoFont, fontSize: 36, fontWeight: 200, color: '#22C55E', textShadow: '0 0 12px rgba(34,197,94,0.15)' }}>+38,400 <span style={{ fontSize: 14, fontWeight: 400 }}>MAD/mois</span></span>
        </div>
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
