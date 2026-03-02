import React, { useState } from 'react';
import { Truck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const T = {
  gold: '#FFD700',
  goldDim: 'rgba(255,215,0,0.15)',
  goldBorder: 'rgba(255,215,0,0.3)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#60A5FA',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textDim: '#64748B',
  cardBorder: '#1E2D4A',
};

const trucks = [
  { name: '🚛 Camion 1', statut: 'En route', statutColor: T.success, position: 'Km 12/18', chargement: 'B25 — 8m³', eta: '14 min', alerte: '' },
  { name: '🚛 Camion 2', statut: 'Au chantier', statutColor: T.info, position: 'Maarif', chargement: 'B30 — 6m³', eta: 'Déchargement', alerte: '' },
  { name: '🚛 Camion 3', statut: 'Retour usine', statutColor: T.textDim, position: 'Km 5/22', chargement: 'Vide', eta: '18 min', alerte: '' },
  { name: '🚛 Camion 4', statut: 'En attente', statutColor: T.warning, position: 'Usine', chargement: '—', eta: '—', alerte: '⏳ 22 min d\'attente' },
  { name: '🚛 Camion 5', statut: 'En route', statutColor: T.success, position: 'Km 3/15', chargement: 'B25S — 7m³', eta: '28 min', alerte: '⚠️ Béton > 45min' },
];

const recommendations = [
  {
    priority: 'high',
    borderColor: T.danger,
    text: '⚠️ URGENT — Camion 5: béton en transit depuis 47 min. Temps restant avant prise: ~43 min. ETA chantier: 28 min. Marge de sécurité faible. Recommandation: prioriser déchargement à l\'arrivée, alerter chef de chantier.',
  },
  {
    priority: 'medium',
    borderColor: T.warning,
    text: '💡 OPTIMISATION — Camion 4 en attente depuis 22 min. Prochaine gâchée B30 prête dans 8 min. Recommandation: charger Camion 4 avec commande Client Nexus BTP (6m³ B30, chantier Hay Riad, 11km) au lieu d\'attendre la commande initiale retardée.',
  },
  {
    priority: 'info',
    borderColor: T.info,
    text: '📊 PRÉVISION — Pic de livraisons entre 14h-16h (5 livraisons planifiées). Avec 3 camions actifs, délai moyen estimé: 35 min. Recommandation: rappeler Camion 3 pour chargement anticipé.',
  },
];

const kpis = [
  { label: 'Camions Actifs', value: '5/7' },
  { label: 'Temps Moyen Transit', value: '32 min' },
  { label: 'Taux Utilisation', value: '71%' },
  { label: 'Livraisons Aujourd\'hui', value: '8/12' },
];

const headers = ['Camion', 'Statut', 'Position', 'Chargement', 'ETA Chantier', 'Alerte'];

export function DeliveryOrchestrationPanel() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
      border: '1px solid rgba(245, 158, 11, 0.15)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: T.goldDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Truck size={14} color={T.gold} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Orchestration Livraisons
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        </div>
        {open ? <ChevronUp size={16} color={T.textSec} /> : <ChevronDown size={16} color={T.textSec} />}
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 20 }}>
            {kpis.map(k => (
              <div key={k.label} style={{
                background: `${T.cardBorder}40`, borderRadius: 10, padding: '10px 14px',
                border: `1px solid ${T.cardBorder}`, textAlign: 'center',
              }}>
                <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{k.label}</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: T.gold }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Truck Table */}
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
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
                {trucks.map((t, i) => (
                  <tr key={i} style={{
                    borderBottom: i < trucks.length - 1 ? `1px solid ${T.cardBorder}60` : 'none',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: T.textPri }}>{t.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                        background: `${t.statutColor}18`, color: t.statutColor,
                        border: `1px solid ${t.statutColor}30`,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.statutColor }} />
                        {t.statut}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: T.textSec, fontFamily: 'JetBrains Mono, monospace' }}>{t.position}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: T.textPri, fontWeight: 500 }}>{t.chargement}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: T.textSec, fontFamily: 'JetBrains Mono, monospace' }}>{t.eta}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: t.alerte ? T.danger : T.textDim, fontWeight: t.alerte ? 600 : 400 }}>
                      {t.alerte || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Recommendations */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkles size={12} color={T.gold} />
            <span style={{ color: T.textSec, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recommandations IA</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map((r, i) => (
              <div key={i} style={{
                borderLeft: `4px solid ${r.borderColor}`,
                background: `${r.borderColor}08`,
                borderRadius: '0 10px 10px 0',
                padding: '12px 16px',
                border: `1px solid ${r.borderColor}20`,
                borderLeftWidth: 4,
                borderLeftColor: r.borderColor,
              }}>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: T.textPri }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
