import React from 'react';
import { Users, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  danger: '#EF4444', warning: '#F59E0B', success: '#10B981', info: '#3B82F6',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
};

const alerts = [
  {
    severity: 'high',
    text: '🔴 Atlas Construction — Volume commandé en baisse de 40% sur 3 mois (de 120m³/mois à 72m³/mois). Dernier contact commercial: il y a 35 jours. Concurrent identifié: BétonPlus propose -5% sur B25. Recommandation: appeler cette semaine, proposer remise fidélité 3%.',
  },
  {
    severity: 'high',
    text: '🔴 Sigma Bâtiment — Aucune commande depuis 28 jours (fréquence habituelle: hebdomadaire). 4 factures impayées totalisant 189,000 MAD. Possible lien entre retards de paiement et arrêt des commandes. Recommandation: réunion direction pour négocier plan de paiement.',
  },
  {
    severity: 'medium',
    text: '⚠️ Omega Immobilier — Volume en baisse progressive de 15% sur 2 mois. Nouveau projet démarré mais pas de commande associée. Recommandation: contacter chef de projet pour le nouveau chantier Hay Hassani.',
  },
];

const kpis = [
  { label: 'Clients Actifs', value: '4/6', trend: '↓1 ce mois', trendColor: T.warning },
  { label: 'Risque Perte', value: '2 clients', valueColor: T.danger },
  { label: 'Revenue à Risque', value: '312,000 MAD/an', valueColor: T.danger },
  { label: 'Taux Rétention 12M', value: '83%', valueColor: T.warning },
];

export function ClientChurnPredictorCard() {
  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.cardBorder}`,
      borderTop: '2px solid #D4A843',
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Gold shimmer border */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 12, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)',
        backgroundSize: '200% 100%',
        animation: 'churn-shimmer 4s ease-in-out infinite',
      }} />
      <style>{`@keyframes churn-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: T.goldDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Users size={14} color={T.gold} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, borderLeft: '3px solid #D4A843', paddingLeft: 10 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Prédiction Attrition Clients
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        </div>
        {/* AI pill badge */}
        <span style={{
          background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843',
          fontSize: 11, borderRadius: 9999, padding: '2px 10px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
        }}>✨ Généré par IA · Claude Opus</span>
      </div>

      <div style={{ padding: '0 20px 20px', position: 'relative', zIndex: 1 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: 8,
              border: `1px solid ${T.cardBorder}`, padding: '10px 12px',
            }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{k.label}</p>
              <span style={{ fontSize: 15, fontWeight: 800, color: k.valueColor || T.textPri, fontFamily: 'JetBrains Mono, monospace' }}>{k.value}</span>
              {k.trend && (
                <span style={{ fontSize: 9, fontWeight: 600, color: k.trendColor, marginLeft: 6 }}>{k.trend}</span>
              )}
            </div>
          ))}
        </div>

        {/* Alert cards */}
        <p style={{ fontSize: 13, fontWeight: 700, color: T.textPri, marginBottom: 12 }}>Clients à Risque de Perte — Prédiction IA</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map((a, i) => {
            const bc = a.severity === 'high' ? T.danger : T.warning;
            return (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `3px solid ${bc}`,
                borderRadius: 8,
                padding: '12px 16px',
              }}>
                <p style={{ fontSize: 11, lineHeight: 1.7, color: T.textSec }}>{a.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
