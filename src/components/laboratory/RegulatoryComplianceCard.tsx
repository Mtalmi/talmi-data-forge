import React from 'react';
import { ShieldCheck, Sparkles, Calendar } from 'lucide-react';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
};

const certifications = [
  { name: 'NM 10.1.008 (Béton)', statut: '✅ Valide', statutColor: T.success, expiration: '15 Avril 2026', jours: 44, tests: '2/3 complétés', action: 'Planifier test #3', actionUrgent: false },
  { name: 'NM 10.1.271 (Granulats)', statut: '⚠️ Renouvellement', statutColor: T.warning, expiration: '28 Mars 2026', jours: 26, tests: '0/2 requis', action: '🔴 Urgent', actionUrgent: true },
  { name: 'ISO 9001:2015', statut: '✅ Valide', statutColor: T.success, expiration: '10 Sept 2026', jours: 192, tests: 'Audit prévu', action: '—', actionUrgent: false },
  { name: 'NM 10.1.005 (Ciment)', statut: '✅ Valide', statutColor: T.success, expiration: '20 Juin 2026', jours: 110, tests: '1/1 complété', action: '—', actionUrgent: false },
];

function getJoursColor(j: number) {
  if (j < 30) return T.danger;
  if (j <= 60) return T.warning;
  return T.success;
}

const headers = ['Certification', 'Statut', 'Expiration', 'Jours Restants', 'Tests Requis', 'Action'];

export function RegulatoryComplianceCard() {
  const score = 78;
  const scoreColor = T.warning; // below 85% threshold

  return (
    <div style={{
      background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
      border: '1px solid rgba(245,158,11,0.15)',
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
          <ShieldCheck size={14} color={T.gold} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Conformité Réglementaire
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {/* Compliance Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0, filter: 'drop-shadow(0 0 12px rgba(212,168,67,0.25))' }}>
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
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 32, fontWeight: 200, color: '#D4A843', lineHeight: 1, letterSpacing: '-0.02em' }}>{score}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 3 }}>Score IA</span>
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
                    color: T.textDim, fontSize: 10, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    borderBottom: `1px solid ${T.cardBorder}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certifications.map((c, i) => {
                const jc = getJoursColor(c.jours);
                return (
                  <tr key={i}
                    style={{ borderBottom: i < certifications.length - 1 ? `1px solid ${T.cardBorder}60` : 'none', transition: 'background 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: T.textPri }}>{c.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                        background: `${c.statutColor}18`, color: c.statutColor, border: `1px solid ${c.statutColor}30`,
                      }}>{c.statut}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textSec }}>{c.expiration}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: jc }}>{c.jours}j</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: T.textSec, textAlign: 'center' }}>{c.tests}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {c.action !== '—' ? (
                        <button style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                          background: c.actionUrgent ? `${T.danger}18` : `${T.gold}18`,
                          color: c.actionUrgent ? T.danger : T.gold,
                          border: `1px solid ${c.actionUrgent ? T.danger : T.gold}30`,
                          cursor: 'pointer',
                        }}>{c.action}</button>
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

        {/* AI Alert */}
        <div style={{
          borderLeft: `4px solid ${T.danger}`,
          background: `${T.danger}08`,
          borderRadius: '0 10px 10px 0',
          padding: '14px 18px',
          border: `1px solid ${T.danger}20`,
          borderLeftWidth: 4,
          borderLeftColor: T.danger,
        }}>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: T.textPri }}>
            <strong style={{ color: T.danger }}>🔴 ALERTE PRIORITAIRE</strong> — Certification NM 10.1.271 (Granulats) expire dans <strong>26 jours</strong>. 0 des 2 tests de conformité requis n'ont été effectués. Planifier le premier test <strong>cette semaine impérativement</strong>. Perte de certification = <span style={{ color: T.danger, fontWeight: 700 }}>interdiction de livrer aux marchés publics</span>.
          </p>
          <div style={{ marginTop: 10 }}>
            <button style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: `${T.danger}22`, color: T.danger, border: `1px solid ${T.danger}40`,
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
