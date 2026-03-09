import React from 'react';
import { Shield, Sparkles, TrendingDown, Mail } from 'lucide-react';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
};

const riskKpis = [
  { label: 'Montant à Risque', value: '256,500 MAD', color: T.danger, bold: true },
  { label: 'Clients à Risque', value: '3/6', color: T.warning },
  { label: 'Taux Recouvrement 30j', value: '73%', color: T.textPri, trend: '↓ 4%', trendColor: T.danger },
  { label: 'Prédiction Encaissement Semaine', value: '142,000 MAD', color: T.success },
];

const atRiskInvoices = [
  { facture: '#1847', client: 'Atlas Construction', montant: '84,200 MAD', echeance: '8 Mars', prob: 82, action: 'Relance immédiate' },
  { facture: '#1851', client: 'Sigma Bâtiment', montant: '126,500 MAD', echeance: '12 Mars', prob: 91, action: 'Livraison contre paiement' },
  { facture: '#1839', client: 'Omega Immobilier', montant: '45,800 MAD', echeance: '5 Mars', prob: 58, action: 'Relance préventive' },
];

function getProbColor(prob: number) {
  if (prob >= 75) return T.danger;
  if (prob >= 50) return '#D4A843';
  return T.success;
}
function getProbBg(prob: number) {
  if (prob >= 75) return 'rgba(239,68,68,0.15)';
  if (prob >= 50) return 'rgba(212,168,67,0.15)';
  return 'rgba(16,185,129,0.15)';
}

const headers = ['Facture', 'Client', 'Montant', 'Échéance', 'Prob. Retard', 'Action Recommandée', ''];

export function PaymentRiskScorerCard() {
  return (
    <div style={{
      background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
      border: '1px solid rgba(239,68,68,0.15)',
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
          <Shield size={14} color={T.gold} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Risque de Paiement
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 20 }}>
          {riskKpis.map(k => (
            <div key={k.label} style={{
              background: `${T.cardBorder}40`, borderRadius: 10, padding: '10px 14px',
              border: `1px solid ${T.cardBorder}`, textAlign: 'center',
            }}>
              <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{k.label}</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: k.bold ? 800 : 700, color: k.color }}>
                {k.value}
                {k.trend && <span style={{ fontSize: 11, color: k.trendColor, marginLeft: 6 }}>{k.trend}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* At-Risk Invoices Table */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.textSec, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Factures à Risque — Prédiction IA</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                {headers.map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    color: T.textDim, fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    borderBottom: `1px solid ${T.cardBorder}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atRiskInvoices.map((inv, i) => {
                const probColor = getProbColor(inv.prob);
                return (
                  <tr key={i} style={{
                    borderBottom: i < atRiskInvoices.length - 1 ? `1px solid ${T.cardBorder}60` : 'none',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: T.gold, fontFamily: 'JetBrains Mono, monospace' }}>{inv.facture}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: T.textPri }}>{inv.client}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: T.textPri, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{inv.montant}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: T.textSec }}>{inv.echeance}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: `${probColor}18`, color: probColor,
                        border: `1px solid ${probColor}30`,
                      }}>
                        {inv.prob}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: T.textSec, fontWeight: 500 }}>{inv.action}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                        background: `${T.gold}18`, color: T.gold, border: `1px solid ${T.gold}30`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Mail size={10} /> Relancer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
