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
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        border: '1px solid rgba(245, 158, 11, 0.15)',
        borderTop: '2px solid #EF4444',
        background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
        padding: 16,
        transition: 'all 200ms ease-out',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,168,67,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.15)'; e.currentTarget.style.borderTop = '2px solid #EF4444'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)', zIndex: 99, pointerEvents: 'none' }} />
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Zap size={11} color={T.gold} />
          <Sparkles size={9} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Détection Anomalies
          </span>
          <span style={{ color: '#D4A843', fontSize: 11, animation: 'agentSparkle 2s ease-in-out infinite' }}>✦</span>
          <span style={{ marginLeft: 4, display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 12, background: 'rgba(212,168,67,0.06)', border: '1px solid #D4A843', fontSize: 12, fontWeight: 600, color: '#D4A843' }}>
            Confiance: 85%
          </span>
        </div>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: 'rgba(212,168,67,0.6)', whiteSpace: 'nowrap' }}>Dernière analyse: il y a 1h</span>
      </div>

      {/* Status */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: `${T.danger}18`, border: `1px solid ${T.danger}30`, marginBottom: 10, animation: 'anomalyBadgePulse 2s ease-in-out infinite' }}>
        <span style={{ fontSize: 10 }}>🔴</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.danger }}>2 Anomalies Détectées</span>
      </div>
      <style>{`
        @keyframes anomalyBadgePulse {
          0%, 100% { box-shadow: 0 0 10px rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 20px rgba(239,68,68,0.1); }
        }
      `}</style>

      {/* Anomaly list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {anomalies.map((a, i) => (
          <p key={i} style={{ fontSize: 10, lineHeight: 1.5, color: T.textSec, paddingLeft: 8, marginBottom: 6, borderLeft: '2px solid #F59E0B', borderRadius: 2, transition: 'all 0.2s ease', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {a}
          </p>
        ))}
      </div>

      {/* Cost */}
      <p style={{ fontSize: 16, fontWeight: 600, color: '#EF4444', marginBottom: 10, fontFamily: 'ui-monospace, monospace', textShadow: '0 0 8px rgba(239,68,68,0.2)' }}>
        Surcoût Estimé: 4,200 MAD/sem
      </p>

      <button
        onClick={() => navigate('/maintenance')}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          padding: '8px 24px', borderRadius: 6, fontSize: 13,
          background: 'transparent', color: '#D4A843', border: '1px solid #D4A843',
          cursor: 'pointer',
        }}
      >
        Voir Analyse
      </button>
    </div>
  );
}