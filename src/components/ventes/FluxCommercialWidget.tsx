import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountUp } from '@/hooks/useCountUp';
import { useI18n } from '@/i18n/I18nContext';

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
  if (value === 0) {
    return (
      <span style={{
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
        fontSize: 48, fontWeight: 100, color: '#4A5568', lineHeight: 1, letterSpacing: '-0.03em',
      }}>—</span>
    );
  }
  return (
    <span style={{
      fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
      fontSize: 48, fontWeight: 100, color: '#D4A843', lineHeight: 1, letterSpacing: '-0.03em',
    }}>{animated}</span>
  );
}

function PipelineStage({
  count, label, sublabel, color, onClick,
}: {
  count: number; label: string; sublabel: string; color: string; onClick?: () => void;
}) {
  const isEmpty = count === 0;
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 py-2 px-1 rounded-xl transition-colors duration-200 focus:outline-none"
      style={{ background: 'transparent' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="text-center">
        <StageCount value={count} />
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          color: isEmpty ? 'rgba(226,232,240,0.2)' : '#D4A843',
          textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif', display: 'block',
        }}>{label}</span>
        <span style={{ fontSize: 10, color: isEmpty ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.35)', display: 'block' }}>{sublabel}</span>
        <svg width="28" height="28" viewBox="0 0 28 28" style={{ marginTop: 6, marginInline: 'auto' }}>
          {!isEmpty && (
            <circle cx="14" cy="14" r="10" fill="none" stroke={color} strokeWidth="1.5" opacity="0.25">
              <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.08;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
          <circle cx="14" cy="14" r="4" fill={isEmpty ? 'rgba(148,163,184,0.15)' : color} />
        </svg>
      </div>
    </button>
  );
}

function PipelineConnector({ percentage, dimmed }: { percentage?: string; dimmed?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 4px' }}>
      <style>{`
        @keyframes dashFlow { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
      `}</style>
      <svg width="50" height="12" viewBox="0 0 50 12">
        <line
          x1="0" y1="6" x2="42" y2="6"
          stroke={dimmed ? 'rgba(255,255,255,0.06)' : '#D4A843'}
          strokeWidth="1.5"
          strokeDasharray="6 4"
          style={dimmed ? {} : { animation: 'dashFlow 2s linear infinite' }}
        />
        <polygon
          points="42,2 50,6 42,10"
          fill={dimmed ? 'rgba(255,255,255,0.12)' : 'rgba(212,168,67,0.6)'}
        />
      </svg>
      {percentage && (
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(148,163,184,0.3)' }}>{percentage}</span>
      )}
    </div>
  );
}

export function FluxCommercialWidget({ stats, onStageClick }: FluxCommercialWidgetProps) {
  const { t } = useI18n();
  const vt = t.pages.ventes;
  const navigate = useNavigate();

  const conversionRate = useMemo(() => {
    const totalDevis = stats.devisEnAttente + (stats.devisConverti || 0) + (stats.devisRefuses || 0) + (stats.devisAcceptes || 0);
    if (totalDevis === 0) return 0;
    return Math.round(((stats.devisConverti || 0) / totalDevis) * 100);
  }, [stats]);

  const pipelineValue = stats.totalBcHT || 0;
  const pipelineLabel = pipelineValue >= 1000 ? `${(pipelineValue / 1000).toFixed(0)}K DH` : `${pipelineValue} DH`;

  const stages = [
    { id: 'en_attente', count: stats.devisEnAttente, label: vt.quotesLabel, sublabel: vt.pendingSub, color: '#D4A843' },
    { id: 'pret_production', count: stats.bcPretProduction, label: vt.validatedPOs, sublabel: vt.readyForProd, color: '#f59e0b' },
    { id: 'en_production', count: stats.bcEnProduction, label: vt.inProduction, sublabel: vt.inProgressSub, color: '#f97316' },
    { id: 'termine', count: stats.bcLivre, label: vt.completed, sublabel: vt.deliveredSub, color: '#22c55e' },
  ];

  const activeCount = stages.filter(s => s.count > 0).length;
  const progressPct = Math.round((activeCount / stages.length) * 100);

  const handleClick = (stage: typeof stages[0]) => {
    if ((stage as any).route) { navigate((stage as any).route); return; }
    if (onStageClick) {
      onStageClick(stage.id);
      setTimeout(() => { document.getElementById('ventes-tabs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span style={{ color: '#D4A843', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'ui-monospace' }}>{ vt.salesFeed }</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
        <div className="flex-1 border-t" style={{ borderColor: 'rgba(212,168,67,0.3)' }} />
        {pipelineValue > 0 && (
          <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.12)', fontSize: 12, fontFamily: 'ui-monospace', fontWeight: 600, color: '#D4A843' }}>{pipelineLabel}</span>
        )}
        {conversionRate > 0 && (
          <span style={{ padding: '4px 10px', borderRadius: 8, background: conversionRate >= 50 ? 'rgba(16,185,129,0.06)' : 'rgba(212,168,67,0.06)', border: `1px solid ${conversionRate >= 50 ? 'rgba(16,185,129,0.12)' : 'rgba(212,168,67,0.12)'}`, fontSize: 11, fontFamily: 'ui-monospace', fontWeight: 500, color: conversionRate >= 50 ? '#10B981' : '#D4A843' }}>{conversionRate}% {vt.conv}</span>
        )}
      </div>

      <div style={{ position: 'relative', padding: '24px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderTop: '2px solid #D4A843', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.03)', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #D4A843, #C49A35, #A07820, #10B981)', borderRadius: 2, opacity: 0.6, transition: 'width 800ms ease' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr', alignItems: 'center' }}>
          {stages.map((stage, i) => (
            <div key={stage.id} style={{ display: 'contents' }}>
              <PipelineStage count={stage.count} label={stage.label} sublabel={stage.sublabel} color={stage.color} onClick={() => handleClick(stage)} />
              {i < stages.length - 1 && (
                <PipelineConnector
                  key={`conn-${i}`}
                  percentage={i === 0 && conversionRate > 0 ? `${conversionRate}%` : undefined}
                  dimmed={stages[i].count === 0 || stages[i + 1].count === 0}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
