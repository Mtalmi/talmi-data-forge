import React from 'react';
import { ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  warning: '#F59E0B', danger: '#EF4444',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
};

export function ComplianceWidget() {
  const navigate = useNavigate();
  const score = 78;

  return (
    <div
      className="ops-enter ops-surface-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        border: '1px solid rgba(245, 158, 11, 0.15)',
        borderTop: '2px solid #D4A843',
        background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
        padding: 20,
        transition: 'all 200ms ease-out',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,168,67,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.15)'; e.currentTarget.style.borderTop = '2px solid #D4A843'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.7), transparent)', zIndex: 99, pointerEvents: 'none' }} />
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <ShieldCheck size={11} color={T.gold} />
          <Sparkles size={9} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Conformité
          </span>
          <span style={{ color: '#D4A843', fontSize: 11, animation: 'agentSparkle 2s ease-in-out infinite' }}>✦</span>
          <span style={{ marginLeft: 4, display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 12, background: 'rgba(212,168,67,0.06)', border: '1px solid #D4A843', fontSize: 12, fontWeight: 600, color: '#D4A843' }}>
            Confiance: 78%
          </span>
        </div>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: 'rgba(212,168,67,0.6)', whiteSpace: 'nowrap' }}>Dernière analyse: il y a 2h</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Mini circular score */}
        <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0, filter: 'drop-shadow(0 0 6px rgba(212,168,67,0.3))' }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke={`${T.cardBorder}`} strokeWidth="4" />
            <circle cx="26" cy="26" r="22" fill="none" stroke="#D4A843" strokeWidth="4"
              strokeDasharray={`${(score / 100) * 138.2} 138.2`}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 800, color: '#D4A843' }}>{score}%</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: T.danger, fontSize: 11, fontWeight: 600, marginBottom: 3 }}>
            <span style={{ color: '#EF4444', fontWeight: 700 }}>1</span> certification à risque
          </p>
          <p style={{ color: T.textSec, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>NM 10.1.271 — <span style={{ color: T.danger, fontWeight: 700 }}>26j restants</span></p>
        </div>
      </div>

      <button
        onClick={() => navigate('/laboratoire')}
        style={{
          marginTop: 12, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          padding: '8px 24px', borderRadius: 6, fontSize: 13,
          background: 'transparent', color: '#D4A843', border: '1px solid #D4A843',
          cursor: 'pointer',
        }}
      >
        Voir Détails
      </button>
    </div>
  );
}