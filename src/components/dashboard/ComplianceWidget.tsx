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
  const scoreColor = T.warning;

  return (
    <div
      className="ops-enter ops-surface-card"
      style={{
        borderRadius: 8,
        border: '1px solid rgba(245, 158, 11, 0.15)',
        background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
        padding: 20,
      }}
    >
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <ShieldCheck size={11} color={T.gold} />
        <Sparkles size={9} color={T.gold} />
        <span style={{ color: T.gold, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Agent IA: Conformité
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Mini circular score */}
        <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke={`${T.cardBorder}`} strokeWidth="4" />
            <circle cx="26" cy="26" r="22" fill="none" stroke={scoreColor} strokeWidth="4"
              strokeDasharray={`${(score / 100) * 138.2} 138.2`}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 800, color: scoreColor }}>{score}%</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: T.danger, fontSize: 11, fontWeight: 600, marginBottom: 3 }}>1 certification à risque</p>
          <p style={{ color: T.textSec, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>NM 10.1.271 — <span style={{ color: T.danger, fontWeight: 700 }}>26j restants</span></p>
        </div>
      </div>

      <button
        onClick={() => navigate('/laboratoire')}
        style={{
          marginTop: 12, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          padding: '5px 0', borderRadius: 6, fontSize: 10, fontWeight: 600,
          background: `${T.gold}10`, color: T.gold, border: `1px solid ${T.gold}20`,
          cursor: 'pointer',
        }}
      >
        Voir Détails <ChevronRight size={10} />
      </button>
    </div>
  );
}
