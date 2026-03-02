import React from 'react';
import { FlaskConical, Sparkles, TestTube, BarChart3 } from 'lucide-react';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
};

const formulas = [
  { name: 'B25', ciment: '350 kg/m³', resistance: '31.2 MPa', requis: '25 MPa', surdosage: 24.8, economie: '14 MAD/m³' },
  { name: 'B30', ciment: '400 kg/m³', resistance: '35.8 MPa', requis: '30 MPa', surdosage: 19.3, economie: '11 MAD/m³' },
  { name: 'B25S', ciment: '330 kg/m³', resistance: '27.1 MPa', requis: '25 MPa', surdosage: 8.4, economie: '3 MAD/m³' },
  { name: 'B35', ciment: '420 kg/m³', resistance: '38.5 MPa', requis: '35 MPa', surdosage: 10.0, economie: '8 MAD/m³' },
];

function getSurdosageColor(v: number) {
  if (v > 20) return T.danger;
  if (v >= 10) return T.warning;
  return T.success;
}

const headers = ['Formule', 'Ciment Actuel', 'Résistance Moy.', 'Requis', 'Sur-dosage', 'Économie Potentielle'];

export function FormulaOptimizationCard() {
  return (
    <div style={{
      background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
      border: '1px solid rgba(16,185,129,0.15)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: T.goldDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <FlaskConical size={14} color={T.gold} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Optimisation Formules
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {/* Savings Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginBottom: 20 }}>
          <div style={{ background: `${T.cardBorder}40`, borderRadius: 10, padding: '10px 14px', border: `1px solid ${T.cardBorder}`, textAlign: 'center' }}>
            <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Économie Totale Identifiée</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: T.gold }}>36 MAD/m³</p>
          </div>
          <div style={{ background: `${T.cardBorder}40`, borderRadius: 10, padding: '10px 14px', border: `1px solid ${T.cardBorder}`, textAlign: 'center' }}>
            <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Impact Annuel Estimé</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 800, color: T.success }}>374,400 MAD</p>
          </div>
          <div style={{ background: `${T.cardBorder}40`, borderRadius: 10, padding: '10px 14px', border: `1px solid ${T.cardBorder}`, textAlign: 'center' }}>
            <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Formules Analysées</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: T.textPri }}>4 <span style={{ color: T.textDim, fontSize: 12 }}>|</span> <span style={{ color: T.warning }}>3 optimisables</span></p>
          </div>
        </div>

        {/* Formula Table */}
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    textAlign: i >= 2 ? 'center' : 'left',
                    color: T.textDim, fontSize: 10, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    borderBottom: `1px solid ${T.cardBorder}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formulas.map((f, i) => {
                const sc = getSurdosageColor(f.surdosage);
                return (
                  <tr key={i}
                    style={{ borderBottom: i < formulas.length - 1 ? `1px solid ${T.cardBorder}60` : 'none', transition: 'background 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: T.gold }}>{f.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textPri, fontFamily: 'JetBrains Mono, monospace' }}>{f.ciment}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textPri, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>{f.resistance}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textSec, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>{f.requis}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: `${sc}18`, color: sc, border: `1px solid ${sc}30`,
                      }}>
                        +{f.surdosage}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: T.success, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>{f.economie}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AI Recommendation */}
        <div style={{
          borderLeft: `4px solid ${T.success}`,
          background: `${T.success}08`,
          borderRadius: '0 10px 10px 0',
          padding: '16px 20px',
          border: `1px solid ${T.success}20`,
          borderLeftWidth: 4,
          borderLeftColor: T.success,
        }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: T.gold, marginBottom: 10 }}>
            💡 RECOMMANDATION PRIORITAIRE — Formule B25
          </p>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: T.textPri, marginBottom: 12 }}>
            Les 20 derniers tests montrent une résistance moyenne de 31.2 MPa, soit 24.8% au-dessus du requis de 25 MPa. Réduction possible du ciment de 350 → 330 kg/m³.
          </p>
          <p style={{ fontWeight: 700, fontSize: 11, color: T.gold, marginBottom: 8 }}>Impact estimé:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, paddingLeft: 12 }}>
            <p style={{ fontSize: 12, color: T.textSec }}>
              <span style={{ color: T.success, fontWeight: 600 }}>Économie:</span> 14 MAD/m³ × ~200 m³/semaine = <span style={{ color: T.success, fontWeight: 700 }}>2,800 MAD/semaine</span>
            </p>
            <p style={{ fontSize: 12, color: T.textSec }}>
              <span style={{ color: T.success, fontWeight: 600 }}>Économie annuelle projetée:</span> <span style={{ color: T.success, fontWeight: 700 }}>145,600 MAD</span>
            </p>
            <p style={{ fontSize: 12, color: T.textSec }}>
              <span style={{ color: T.warning, fontWeight: 600 }}>Risque:</span> Faible — marge de sécurité maintenue à +8%
            </p>
          </div>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>
            <strong style={{ color: T.textPri }}>Action:</strong> Lancer série de 5 tests avec formule ajustée pour validation.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: `${T.success}22`, color: T.success, border: `1px solid ${T.success}40`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <TestTube size={12} /> 🧪 Lancer Test
            </button>
            <button style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: `${T.cardBorder}40`, color: T.textSec, border: `1px solid ${T.cardBorder}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <BarChart3 size={12} /> 📊 Voir Historique
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
