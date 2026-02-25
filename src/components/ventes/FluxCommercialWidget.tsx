import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountUp } from '@/hooks/useCountUp';

interface FluxCommercialWidgetProps {
  stats: {
    devisEnAttente: number;
    devisAcceptes?: number;
    devisConverti?: number;
    devisRefuses?: number;
    bcPretProduction: number;
    bcEnProduction: number;
    bcLivre: number;
    totalDevisHT: number;
    totalBcHT?: number;
  };
  onStageClick?: (stage: string) => void;
}

function StageCount({ value }: { value: number }) {
  const animated = useCountUp(value, 1200);
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '2.5rem',
      fontWeight: 200,
      color: 'white',
      lineHeight: 1,
      letterSpacing: '-0.03em',
    }}>
      {animated}
    </span>
  );
}

function PipelineStage({
  count, label, sublabel, status, color, onClick,
}: {
  count: number; label: string; sublabel: string;
  status: 'active' | 'waiting'; color: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 py-2 px-1 rounded-xl transition-colors duration-200 focus:outline-none"
      style={{ background: 'transparent' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <StageCount value={count} />
      <span style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
        color: 'rgba(226,232,240,0.7)', textTransform: 'uppercase',
        fontFamily: 'DM Sans, sans-serif',
      }}>{label}</span>
      <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.35)' }}>{sublabel}</span>
      <div style={{
        width: 4, height: 4, borderRadius: '50%', marginTop: 2,
        background: status === 'active' ? color : 'rgba(148,163,184,0.3)',
        boxShadow: status === 'active' ? `0 0 8px ${color}40` : 'none',
      }} />
    </button>
  );
}

function PipelineConnector({ percentage }: { percentage?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          width: 40, height: 1,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.15))',
        }} />
        <div style={{
          width: 0, height: 0,
          borderTop: '3px solid transparent',
          borderBottom: '3px solid transparent',
          borderLeft: '5px solid rgba(255,255,255,0.15)',
        }} />
      </div>
      {percentage && (
        <span style={{
          fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(148,163,184,0.3)',
        }}>{percentage}</span>
      )}
    </div>
  );
}

export function FluxCommercialWidget({ stats, onStageClick }: FluxCommercialWidgetProps) {
  const navigate = useNavigate();

  const conversionRate = useMemo(() => {
    const totalDevis = stats.devisEnAttente + (stats.devisConverti || 0)
      + (stats.devisRefuses || 0) + (stats.devisAcceptes || 0);
    if (totalDevis === 0) return 0;
    return Math.round(((stats.devisConverti || 0) / totalDevis) * 100);
  }, [stats]);

  const pipelineValue = stats.totalBcHT || 0;
  const pipelineLabel = pipelineValue >= 1000
    ? `${(pipelineValue / 1000).toFixed(0)}K DH`
    : `${pipelineValue} DH`;

  const stages = [
    { id: 'en_attente', count: stats.devisEnAttente, label: 'Devis', sublabel: 'en attente', color: '#FDB913' },
    { id: 'pret_production', count: stats.bcPretProduction, label: 'BC Validés', sublabel: 'prêts prod.', color: '#3B82F6' },
    { id: 'en_production', count: stats.bcEnProduction, label: 'En Production', sublabel: 'en cours', color: '#00D9FF', route: '/production' },
    { id: 'termine', count: stats.bcLivre, label: 'Terminés', sublabel: 'livrés', color: '#10B981', route: '/journal' },
  ];

  const activeCount = stages.filter(s => s.count > 0).length;
  const progressPct = Math.round((activeCount / stages.length) * 100);

  const handleClick = (stage: typeof stages[0]) => {
    if (stage.route) { navigate(stage.route); return; }
    if (onStageClick) {
      onStageClick(stage.id);
      setTimeout(() => {
        document.getElementById('ventes-tabs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.2em',
            color: 'rgba(226,232,240,0.6)', textTransform: 'uppercase',
          }}>Flux Commercial</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '2px 8px', borderRadius: 6,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.15)',
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#10B981',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: '#10B981', letterSpacing: '0.1em' }}>LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pipelineValue > 0 && (
            <span style={{
              padding: '4px 12px', borderRadius: 8,
              background: 'rgba(253,185,19,0.06)',
              border: '1px solid rgba(253,185,19,0.12)',
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500, color: '#FDB913',
            }}>{pipelineLabel}</span>
          )}
          {conversionRate > 0 && (
            <span style={{
              padding: '4px 10px', borderRadius: 8,
              background: conversionRate >= 50 ? 'rgba(16,185,129,0.06)' : 'rgba(253,185,19,0.06)',
              border: `1px solid ${conversionRate >= 50 ? 'rgba(16,185,129,0.12)' : 'rgba(253,185,19,0.12)'}`,
              fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              color: conversionRate >= 50 ? '#10B981' : '#FDB913',
            }}>{conversionRate}% conv.</span>
          )}
        </div>
      </div>

      {/* Pipeline container */}
      <div style={{
        position: 'relative',
        padding: '24px 16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Top progress bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progressPct}%`, height: '100%',
            background: 'linear-gradient(90deg, #FDB913, #3B82F6, #00D9FF, #10B981)',
            borderRadius: 2, opacity: 0.6,
            transition: 'width 800ms ease',
          }} />
        </div>

        {/* Stages grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr',
          alignItems: 'center',
        }}>
          {stages.map((stage, i) => (
            <>
              <PipelineStage
                key={stage.id}
                count={stage.count}
                label={stage.label}
                sublabel={stage.sublabel}
                status={stage.count > 0 ? 'active' : 'waiting'}
                color={stage.color}
                onClick={() => handleClick(stage)}
              />
              {i < stages.length - 1 && (
                <PipelineConnector
                  key={`conn-${i}`}
                  percentage={i === 0 && conversionRate > 0 ? `${conversionRate}%` : undefined}
                />
              )}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
