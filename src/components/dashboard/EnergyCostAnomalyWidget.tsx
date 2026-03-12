import { Zap, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  danger: '#EF4444', warning: '#F59E0B',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
};

const anomalies = [
  'Électricité +23% cette semaine vs production -5%. Vérifier malaxeur principal.',
  'Consommation eau +15% par m³ depuis 3 jours. Possible fuite circuit refroidissement.',
];

export function EnergyCostAnomalyWidget() {
  const navigate = useNavigate();

  return (
    <div
      className="ops-enter ops-surface-card"
      style={{
        borderRadius: 8,
        border: '1px solid rgba(245, 158, 11, 0.15)',
        borderTop: '1px solid rgba(212,168,67,0.3)',
        background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
        padding: 16,
      }}
    >
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Zap size={11} color={T.gold} />
          <Sparkles size={9} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Détection Anomalies
          </span>
          <span style={{ color: '#D4A843', fontSize: 11, animation: 'agentSparkle 2s ease-in-out infinite' }}>✦</span>
          <span style={{ marginLeft: 4, display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 9999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,168,67,0.3)', fontSize: 11, fontWeight: 600, color: '#D4A843' }}>
            Confiance: 85%
          </span>
        </div>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: 'rgba(148,163,184,0.5)', whiteSpace: 'nowrap' }}>Dernière analyse: il y a 1h</span>
      </div>

      {/* Status */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: `${T.danger}18`, border: `1px solid ${T.danger}30`, marginBottom: 10 }}>
        <span style={{ fontSize: 10 }}>🔴</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.danger }}>2 Anomalies Détectées</span>
      </div>

      {/* Anomaly list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {anomalies.map((a, i) => (
          <p key={i} style={{ fontSize: 10, lineHeight: 1.5, color: T.textSec, paddingLeft: 8, borderLeft: `2px solid ${i === 0 ? T.danger : T.warning}40` }}>
            {a}
          </p>
        ))}
      </div>

      {/* Cost */}
      <p style={{ fontSize: 11, fontWeight: 700, color: T.danger, marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>
        Surcoût Estimé: 4,200 MAD/sem
      </p>

      <button
        onClick={() => navigate('/maintenance')}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          padding: '5px 0', borderRadius: 6, fontSize: 10, fontWeight: 600,
          background: `${T.gold}10`, color: T.gold, border: `1px solid ${T.gold}20`, cursor: 'pointer',
        }}
      >
        Voir Analyse <ChevronRight size={10} />
      </button>
    </div>
  );
}
