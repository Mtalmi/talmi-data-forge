import React from 'react';
import { Sparkles, Award } from 'lucide-react';

const T = {
  gold: '#D4A843', goldDim: 'rgba(212,168,67,0.15)',
  success: '#22C55E', warning: '#F59E0B', danger: '#EF4444',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#9CA3AF',
  cardBorder: '#1E2D4A',
};
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

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
      borderTop: '2px solid #D4A843',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontFamily: MONO, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
            Agent IA: Performance Opérateurs
          </span>
          <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#D4A843', padding: '4px 8px', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 4 }}>
          Généré par IA · Claude Opus
        </span>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Opérateur', 'Tests ce mois', 'Taux Conformité', 'Non-Conformités', 'Score IA'].map(h => (
              <th key={h} style={{
                padding: '10px 16px', fontFamily: MONO, fontSize: 11, fontWeight: 600, color: '#9CA3AF',
                textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: 'left',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {operators.map((op, i) => (
            <tr
              key={op.name}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: i % 2 === 0 ? 'rgba(212,168,67,0.03)' : 'transparent',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'rgba(212,168,67,0.03)' : 'transparent'; }}
            >
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.textPri }}>{op.name}</span>
                  {op.name === best.name && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 6,
                      background: '#D4A843', color: '#0F1629',
                      fontSize: 10, fontWeight: 600, fontFamily: MONO,
                    }}>
                      <Award size={10} />
                      Meilleur opérateur du mois
                    </span>
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 200, color: T.textPri }}>
                  {op.tests}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${op.conformite}%`, height: '100%', borderRadius: 3,
                      background: 'linear-gradient(90deg, #C49A3C, #D4A843)',
                      transition: 'width 600ms ease',
                    }} />
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 200, color: T.gold, minWidth: 32 }}>
                    {op.conformite}%
                  </span>
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  fontFamily: MONO, fontSize: 14, fontWeight: 200,
                  color: op.nonConf > 4 ? T.danger : op.nonConf > 2 ? T.warning : T.success,
                }}>
                  {op.nonConf}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  fontFamily: MONO,
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
