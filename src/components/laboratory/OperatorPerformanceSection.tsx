import React from 'react';
import { Sparkles, Award } from 'lucide-react';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
};

const operators = [
  { name: 'Youssef M.', tests: 47, conformite: 96, nonConf: 2, score: 94 },
  { name: 'Karim B.', tests: 38, conformite: 84, nonConf: 6, score: 72 },
  { name: 'Sarah L.', tests: 52, conformite: 91, nonConf: 5, score: 86 },
];

function scoreColor(s: number) {
  if (s >= 85) return T.success;
  if (s >= 70) return T.warning;
  return T.danger;
}

export function OperatorPerformanceSection() {
  const best = operators.reduce((a, b) => (a.score > b.score ? a : b));

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${T.cardBorder}`,
      borderTop: '2px solid',
      borderImage: 'linear-gradient(90deg, #D4A843, transparent) 1',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 20px',
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
      }}>
        <Sparkles size={12} color={T.gold} />
        <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Agent IA: Performance Opérateurs
        </span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Opérateur', 'Tests ce mois', 'Taux Conformité', 'Non-Conformités', 'Score IA'].map(h => (
              <th key={h} style={{
                padding: '10px 16px', fontSize: 10, fontWeight: 600, color: T.textDim,
                textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'left',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {operators.map((op) => (
            <tr
              key={op.name}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
            >
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.textPri }}>{op.name}</span>
                  {op.name === best.name && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 6,
                      background: T.goldDim, border: `1px solid ${T.gold}40`,
                      color: T.gold, fontSize: 10, fontWeight: 600,
                    }}>
                      <Award size={10} />
                      Meilleur opérateur du mois
                    </span>
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 14, fontWeight: 500, color: T.textPri }}>
                  {op.tests}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${op.conformite}%`, height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, #D4A843, #FFD700)`,
                      transition: 'width 600ms ease',
                    }} />
                  </div>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 500, color: T.gold, minWidth: 32 }}>
                    {op.conformite}%
                  </span>
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 500,
                  color: op.nonConf > 4 ? T.danger : op.nonConf > 2 ? T.warning : T.success,
                }}>
                  {op.nonConf}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                  fontSize: 28, fontWeight: 200, color: scoreColor(op.score),
                  lineHeight: 1, letterSpacing: '-0.02em',
                }}>
                  {op.score}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
