// ═══════════════════════════════════════════════════════
// PLANT FLOW SCHEMATIC — Real-time value chain visualization
// Silos → Malaxeur → Camions → Chantiers → Qualité
// ═══════════════════════════════════════════════════════

import { useNavigate } from 'react-router-dom';

const T = {
  dotOk: '#34D399',
  dotWarn: '#FBBF24',
  gold: '#D4AF37',
};

function FlowArrow() {
  return (
    <div className="flex items-center px-0.5 relative shrink-0" style={{ width: 20 }}>
      <div className="w-full h-[2px]" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))' }} />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
        style={{ background: T.gold, opacity: 0.6, animation: 'pulse 2s ease-in-out infinite' }}
      />
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px]" style={{ color: 'rgba(148,163,184,0.3)' }}>▸</span>
    </div>
  );
}

function MiniBar({ label, pct, warn }: { label: string; pct: number; warn?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] w-12 truncate" style={{ color: 'rgba(148,163,184,0.6)' }}>{label}</span>
      <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(pct, 3)}%`,
            background: warn ? T.dotWarn : T.dotOk,
            opacity: 0.7,
          }}
        />
      </div>
      <span className="text-[8px] w-6 text-right font-mono tabular-nums" style={{ color: warn ? T.dotWarn : 'rgba(148,163,184,0.4)' }}>{pct}%</span>
    </div>
  );
}

const panelHoverStyle = {
  transition: 'all 200ms ease-out',
  cursor: 'pointer',
} as const;

const panelHoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
    e.currentTarget.style.transform = 'translateY(-1px)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = 'rgba(15,23,41,0.8)';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
    e.currentTarget.style.transform = 'translateY(0)';
  },
};


export default function PlantFlowSchematic() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto pt-5 mb-5" style={{ animation: 'ccSectionIn 300ms ease-out 550ms both' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">
          Flux Usine
        </span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        <span className="text-emerald-400 text-[11px]">Temps réel</span>
        <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.15))' }} />
        <span className="text-amber-400/70 text-[11px] uppercase tracking-wider hover:text-amber-400 transition-colors cursor-pointer">
          VOIR TOUT →
        </span>
      </div>

      {/* Flow Strip */}
      <div className="grid grid-cols-5 gap-2 relative max-w-full overflow-hidden">
        {/* Animated scan line */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-xl">
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '30%',
            background: 'linear-gradient(90deg, rgba(212,168,67,0) 0%, rgba(212,168,67,0.15) 50%, rgba(212,168,67,0) 100%)',
            animation: 'fluxScanSweep 4s linear infinite',
          }} />
        </div>

        {/* ── STAGE 1: SILOS ── */}
        <div
          className="flux-panel group min-w-0 p-3 rounded-xl"
          style={{ ...panelHoverStyle, position:'relative', overflow:'hidden', background: 'rgba(15,23,41,0.8)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(4px)' }}
          onClick={() => navigate('/stocks')}
          {...panelHoverHandlers}
        >
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent, rgba(212,168,67,0.7),transparent)', zIndex:99 }} />
          <div className="text-[9px] uppercase tracking-[0.15em] font-medium mb-2" style={{ color: 'rgba(148,163,184,0.5)' }}>Silos</div>
          <div className="space-y-1">
            <MiniBar label="Ciment" pct={53} />
            <MiniBar label="Sable" pct={40} />
            <MiniBar label="Gravette" pct={34} warn />
            <MiniBar label="Eau" pct={30} />
          </div>
          <div className="mt-2 pt-1.5 flex items-center justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: '#D4A843' }}>VOIR →</span>
          </div>
        </div>

        {/* ── STAGE 2: MALAXEUR ── */}
        <div
          className="flux-panel group min-w-0 p-3 rounded-xl"
          style={{ ...panelHoverStyle, background: 'rgba(15,23,41,0.8)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(4px)' }}
          onClick={() => navigate('/production')}
          {...panelHoverHandlers}
        >
          <div className="text-[9px] uppercase tracking-[0.15em] font-medium mb-2" style={{ color: 'rgba(148,163,184,0.5)' }}>Malaxeur</div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.dotOk }} />
            <span className="text-[10px] font-medium animate-pulse" style={{ color: T.dotOk, textShadow: '0 0 8px rgba(34, 197, 94, 0.3)' }}>ACTIF</span>
          </div>
          <div className="space-y-0.5">
            <div className="text-[9px]" style={{ color: 'rgba(148,163,184,0.5)' }}>Batch <span className="text-white/80 font-mono">#403-068</span></div>
            <div className="text-[9px]" style={{ color: 'rgba(148,163,184,0.5)' }}>Formule <span className="text-white/80">F-B25</span></div>
            <div className="text-[9px]" style={{ color: 'rgba(148,163,184,0.5)' }}>Volume <span className="text-white/80">8 m³</span></div>
            <div className="text-[9px]" style={{ color: 'rgba(148,163,184,0.5)' }}>Temps <span className="font-mono" style={{ color: T.dotWarn }}>02:47</span></div>
          </div>
          <div className="mt-2 pt-1.5 flex items-center justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: '#D4A843' }}>VOIR →</span>
          </div>
        </div>

        {/* ── STAGE 3: CAMIONS ── */}
        <div
          className="flux-panel group min-w-0 p-3 rounded-xl"
          style={{ ...panelHoverStyle, background: 'rgba(15,23,41,0.8)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(4px)' }}
          onClick={() => navigate('/logistique')}
          {...panelHoverHandlers}
        >
          <div className="text-[9px] uppercase tracking-[0.15em] font-medium mb-2" style={{ color: 'rgba(148,163,184,0.5)' }}>Camions</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">🚛</span>
              <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.6)' }}><span className="text-white/80 font-medium">3</span> en livraison</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: T.dotWarn, opacity: 0.7 }} />
              <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.6)' }}><span className="text-white/80 font-medium">1</span> en route</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] opacity-40">⏳</span>
              <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.6)' }}><span className="text-white/80 font-medium">1</span> en attente</span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 flex items-center justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: '#D4A843' }}>VOIR →</span>
          </div>
        </div>

        {/* ── STAGE 4: CHANTIERS ── */}
        <div
          className="flux-panel group min-w-0 p-3 rounded-xl"
          style={{ ...panelHoverStyle, background: '#0f1929', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(4px)' }}
          onClick={() => navigate('/bons-de-commande')}
          {...panelHoverHandlers}
        >
          <div className="text-[9px] uppercase tracking-[0.15em] font-medium mb-2" style={{ color: 'rgba(148,163,184,0.5)' }}>Chantiers</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px]">✅</span>
              <span className="text-[9px] font-medium" style={{ color: T.dotOk }}>3 livrés</span>
              <span className="text-[8px] font-mono ml-auto" style={{ color: 'rgba(148,163,184,0.4)' }}>155 m³</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: T.dotWarn, opacity: 0.7 }} />
              <span className="text-[9px] font-medium" style={{ color: T.dotWarn }}>1 en route</span>
              <span className="text-[8px] font-mono ml-auto" style={{ color: 'rgba(148,163,184,0.4)' }}>20 m³</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] opacity-40">⏳</span>
              <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.5)' }}>1 prévu</span>
              <span className="text-[8px] font-mono ml-auto" style={{ color: 'rgba(148,163,184,0.4)' }}>20 m³</span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 flex items-center justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: '#D4A843' }}>VOIR →</span>
          </div>
        </div>

        {/* ── STAGE 5: QUALITÉ ── */}
        <div
          className="flux-panel group min-w-0 p-3 pr-4 rounded-xl"
          style={{ ...panelHoverStyle, background: 'rgba(15,23,41,0.8)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(4px)' }}
          onClick={() => navigate('/laboratoire')}
          {...panelHoverHandlers}
        >
          <div className="text-[9px] uppercase tracking-[0.15em] font-medium mb-2" style={{ color: 'rgba(148,163,184,0.5)' }}>Qualité</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.dotOk }} />
              <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.6)' }}><span className="font-medium" style={{ color: T.dotOk }}>12</span> OK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.dotWarn }} />
              <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.6)' }}><span className="font-medium" style={{ color: T.dotWarn }}>2</span> VAR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.dotOk }} />
              <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.6)' }}><span className="text-white/80 font-medium">0</span> CRIT</span>
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.4)' }}>E/C: </span>
            <span className="text-[9px] font-mono font-semibold text-[#D4A843]">0.502</span>
          </div>
          <div className="mt-1.5 pt-1.5 flex items-center justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: '#D4A843' }}>VOIR →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
