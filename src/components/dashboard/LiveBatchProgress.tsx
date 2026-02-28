// ═══════════════════════════════════════════════════════
// LIVE BATCH PROGRESS — Current production tracking
// ═══════════════════════════════════════════════════════

const T = {
  gold: '#D4AF37',
  dotOk: '#34D399',
  dotWarn: '#FBBF24',
};

const phases = [
  { label: 'Chargement', done: true },
  { label: 'Malaxage', done: true },
  { label: 'Déchargement', done: false, active: true },
  { label: 'Prêt', done: false },
];

export default function LiveBatchProgress() {
  return (
    <div
      className="ops-surface-card group/card relative overflow-hidden rounded-[16px] p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.4s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-3px) scale(1.008)';
        el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25), 0 0 60px rgba(212,175,55,0.04)';
        el.style.borderColor = 'rgba(212,175,55,0.15)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0) scale(1)';
        el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
        el.style.borderColor = 'rgba(255,255,255,0.08)';
      }}
    >
      {/* Category accent — amber */}
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #FDB913, transparent)' }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.dotOk }} />
          <span className="text-[11px] font-medium text-white/90 uppercase tracking-[0.1em]">Batch en Cours</span>
        </div>
        <span className="text-[11px] font-mono tabular-nums" style={{ color: 'rgba(148,163,184,0.5)' }}>#403-068</span>
      </div>

      {/* Details */}
      <div className="text-[11px] mb-3" style={{ color: 'rgba(148,163,184,0.6)' }}>
        <span className="text-white/80 font-medium">F-B25 Standard</span>
        {' · '}8 m³{' · '}
        <span className="text-white/70">BTP Maroc SARL</span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.4)' }}>Progression</span>
          <span className="text-[10px] text-white/80 font-mono font-medium tabular-nums">72%</span>
        </div>
        <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: '72%',
              background: `linear-gradient(90deg, ${T.dotWarn}, ${T.dotOk})`,
              boxShadow: `0 0 8px rgba(52,211,153,0.2)`,
            }}
          />
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center justify-between mb-3">
        {phases.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            {i > 0 && (
              <div
                className="absolute h-px"
                style={{
                  background: p.done ? T.dotOk : 'rgba(255,255,255,0.06)',
                  opacity: p.done ? 0.4 : 1,
                }}
              />
            )}
            <span className="text-[11px]" style={{ opacity: p.active ? 1 : p.done ? 0.8 : 0.3 }}>
              {p.done ? '✅' : p.active ? '⏳' : '○'}
            </span>
            <span
              className="text-[8px]"
              style={{
                color: p.active ? T.dotWarn : p.done ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.25)',
                fontWeight: p.active ? 500 : 400,
              }}
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>

      {/* Connecting line between phases */}
      <div className="flex items-center gap-0 mx-4 -mt-6 mb-3">
        <div className="flex-1 h-px" style={{ background: T.dotOk, opacity: 0.3 }} />
        <div className="flex-1 h-px" style={{ background: T.dotOk, opacity: 0.3 }} />
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${T.dotWarn}60, rgba(255,255,255,0.06))` }} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="text-[10px]" style={{ color: 'rgba(148,163,184,0.5)' }}>
          Temps restant: <span className="text-white/80 font-mono font-medium">01:47</span>
        </div>
        <div className="text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>
          Prochain: <span className="text-white/60">#403-069 · F-B30 · 12 m³</span>
        </div>
      </div>
    </div>
  );
}
