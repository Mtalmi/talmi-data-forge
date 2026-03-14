import React from 'react';
import { ShieldCheck, Sparkles, Calendar } from 'lucide-react';

const T = {
  gold: '#D4A843', goldDim: 'rgba(212,168,67,0.15)',
  success: '#22C55E', warning: '#F59E0B', danger: '#EF4444',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#9CA3AF',
  cardBorder: '#1E2D4A',
};
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

const certifications = [
  { name: 'NM 10.1.008 (Béton)', statut: 'Valide', statutType: 'valid', expiration: '15 Avril 2026', jours: 44, tests: '2/3 complétés', action: 'Planifier test #3', actionUrgent: false },
  { name: 'NM 10.1.271 (Granulats)', statut: 'Renouvellement', statutType: 'renewal', expiration: '28 Mars 2026', jours: 26, tests: '0/2 requis', action: '🔴 Urgent', actionUrgent: true },
  { name: 'ISO 9001:2015', statut: 'Valide', statutType: 'valid', expiration: '10 Sept 2026', jours: 192, tests: 'Audit prévu', action: '—', actionUrgent: false },
  { name: 'NM 10.1.005 (Ciment)', statut: 'Valide', statutType: 'valid', expiration: '20 Juin 2026', jours: 110, tests: '1/1 complété', action: '—', actionUrgent: false },
];

function getJoursColor(j: number) {
  if (j < 30) return T.danger;
  if (j <= 90) return T.warning;
  return T.success;
}

const headers = ['Certification', 'Statut', 'Expiration', 'Jours Restants', 'Tests Requis', 'Action'];

export function RegulatoryComplianceCard() {
  const score = 78;

  return (
    <div style={{
      background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
      border: `1px solid rgba(34,197,94,0.15)`,
      borderTop: '2px solid #22C55E',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={14} color={T.gold} style={{ opacity: 0.7 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={12} color={T.gold} />
            <span style={{ color: T.gold, fontFamily: MONO, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
              Agent IA: Conformité Réglementaire
            </span>
            <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
          </div>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#D4A843', padding: '4px 8px', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 4 }}>
          Généré par IA · Claude Opus
        </span>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {/* Compliance Score */}
        <style>{`@keyframes compliance-ring-pulse { 0%,100%{ filter: drop-shadow(0 0 8px rgba(212,168,67,0.25)); } 50%{ filter: drop-shadow(0 0 16px rgba(212,168,67,0.5)); } }`}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0, animation: 'compliance-ring-pulse 3s ease-in-out infinite' }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="37" fill="#0B1120" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle cx="44" cy="44" r="37" fill="none" stroke="#D4A843" strokeWidth="5"
                strokeDasharray={`${(score / 100) * 232.5} 232.5`}
                strokeLinecap="round"
                transform="rotate(-90 44 44)"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 200, color: '#D4A843', lineHeight: 1, letterSpacing: '-0.02em' }}>{score}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 3 }}>Score IA</span>
            </div>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 4 }}>Score Conformité</p>
            <p style={{ color: T.textSec, fontSize: 12 }}>3/4 certifications à jour | <span style={{ color: T.danger, fontWeight: 600 }}>1 action urgente</span></p>
          </div>
        </div>

        {/* Certification Table */}
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    textAlign: i >= 3 ? 'center' : 'left',
                    color: '#9CA3AF', fontFamily: MONO, fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '1.5px',
                    borderBottom: `1px solid ${T.cardBorder}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certifications.map((c, i) => {
                const jc = getJoursColor(c.jours);
                const isValid = c.statutType === 'valid';
                const statutColor = isValid ? T.success : T.warning;
                return (
                  <tr key={i}
                    style={{
                      borderBottom: i < certifications.length - 1 ? `1px solid ${T.cardBorder}60` : 'none',
                      background: i % 2 === 0 ? 'rgba(212,168,67,0.03)' : 'transparent',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(212,168,67,0.03)' : 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: T.textPri }}>{c.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        fontFamily: MONO,
                        background: 'transparent',
                        color: statutColor,
                        border: `1px solid ${statutColor}50`,
                      }}>{c.statut}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textSec }}>{c.expiration}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 200, color: jc }}>{c.jours}j</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: T.textSec, textAlign: 'center' }}>{c.tests}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {c.action !== '—' ? (
                        <button style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                          background: c.actionUrgent ? T.danger : 'transparent',
                          color: c.actionUrgent ? '#fff' : T.gold,
                          border: c.actionUrgent ? 'none' : `1px solid ${T.gold}50`,
                          cursor: 'pointer', fontFamily: MONO,
                        }}>{c.actionUrgent ? '📅 Planifier Test' : c.action}</button>
                      ) : (
                        <span style={{ color: T.textDim, fontSize: 11 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AI Alert — ALERTE PRIORITAIRE */}
        <div style={{
          borderLeft: '4px solid #EF4444',
          background: 'rgba(239,68,68,0.05)',
          borderRadius: '0 10px 10px 0',
          padding: '14px 18px',
          border: '1px solid rgba(239,68,68,0.2)',
          borderLeftWidth: 4,
          borderLeftColor: '#EF4444',
        }}>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: T.textPri }}>
            <strong style={{ color: T.danger }}>🔴 ALERTE PRIORITAIRE</strong> — Certification NM 10.1.271 (Granulats) expire dans <strong>26 jours</strong>. 0 des 2 tests de conformité requis n'ont été effectués. Planifier le premier test <strong>cette semaine impérativement</strong>. Perte de certification = <span style={{ color: T.danger, fontWeight: 700 }}>interdiction de livrer aux marchés publics</span>.
          </p>
          <div style={{ marginTop: 10 }}>
            <button style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: T.danger, color: '#fff', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Calendar size={12} /> 📅 Planifier Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
