import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText, ShoppingCart, RefreshCw, Truck, ArrowRight, TrendingUp, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface FluxStage {
  id: string;
  label: string;
  sublabel: string;
  count: number;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  borderColor: string;
  route?: string;
  tooltip: string;
}

function StageCount({ value }: { value: number }) {
  const animated = useCountUp(value, 1200);
  return (
    <span
      className="text-3xl md:text-4xl font-black tabular-nums leading-none"
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        color: 'hsl(var(--primary))',
        textShadow: value > 0 ? '0 0 20px hsl(var(--primary) / 0.4)' : 'none',
      }}
    >
      {animated}
    </span>
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

  const stages: FluxStage[] = [
    {
      id: 'en_attente',
      label: 'Devis',
      sublabel: 'en attente',
      count: stats.devisEnAttente,
      icon: <FileText className="h-6 w-6 md:h-7 md:w-7" />,
      accentColor: 'hsl(var(--warning))',
      glowColor: 'hsl(var(--warning) / 0.25)',
      bgGradient: 'linear-gradient(135deg, hsl(var(--warning) / 0.08) 0%, hsl(var(--warning) / 0.03) 100%)',
      borderColor: 'hsl(var(--warning) / 0.35)',
      tooltip: 'Devis en attente de validation client',
    },
    {
      id: 'pret_production',
      label: 'BC Validés',
      sublabel: 'prêts prod.',
      count: stats.bcPretProduction,
      icon: <ShoppingCart className="h-6 w-6 md:h-7 md:w-7" />,
      accentColor: 'hsl(220 90% 60%)',
      glowColor: 'hsl(220 90% 60% / 0.25)',
      bgGradient: 'linear-gradient(135deg, hsl(220 90% 60% / 0.08) 0%, hsl(220 90% 60% / 0.03) 100%)',
      borderColor: 'hsl(220 90% 60% / 0.35)',
      tooltip: 'Bons de commande validés, prêts pour production',
    },
    {
      id: 'en_production',
      label: 'En Production',
      sublabel: 'en cours',
      count: stats.bcEnProduction,
      icon: (
        <RefreshCw
          className={cn('h-6 w-6 md:h-7 md:w-7', stats.bcEnProduction > 0 && 'animate-spin')}
          style={{ animationDuration: '3s' }}
        />
      ),
      accentColor: 'hsl(var(--accent-teal))',
      glowColor: 'hsl(var(--accent-teal) / 0.25)',
      bgGradient: 'linear-gradient(135deg, hsl(var(--accent-teal) / 0.08) 0%, hsl(var(--accent-teal) / 0.03) 100%)',
      borderColor: 'hsl(var(--accent-teal) / 0.35)',
      route: '/production',
      tooltip: 'Commandes en cours de production / livraison',
    },
    {
      id: 'termine',
      label: 'Terminés',
      sublabel: 'livrés',
      count: stats.bcLivre,
      icon: <Truck className="h-6 w-6 md:h-7 md:w-7" />,
      accentColor: 'hsl(var(--success))',
      glowColor: 'hsl(var(--success) / 0.25)',
      bgGradient: 'linear-gradient(135deg, hsl(var(--success) / 0.08) 0%, hsl(var(--success) / 0.03) 100%)',
      borderColor: 'hsl(var(--success) / 0.35)',
      route: '/journal',
      tooltip: 'Livraisons terminées — journal quotidien',
    },
  ];

  const handleStageClick = (stage: FluxStage) => {
    if (stage.route) {
      navigate(stage.route);
      return;
    }
    if (onStageClick) {
      onStageClick(stage.id);
      setTimeout(() => {
        document.getElementById('ventes-tabs-section')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  };

  const pipelineValue = stats.totalBcHT || 0;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)/0.8) 100%)',
        borderColor: 'hsl(var(--primary)/0.15)',
        boxShadow: '0 4px 32px hsl(var(--primary)/0.06), inset 0 1px 0 hsl(var(--primary)/0.04)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{
          borderColor: 'hsl(var(--border)/0.5)',
          background: 'linear-gradient(90deg, hsl(var(--primary)/0.05) 0%, transparent 60%)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-1.5 rounded-lg"
            style={{ background: 'hsl(var(--primary)/0.12)', boxShadow: '0 0 12px hsl(var(--primary)/0.2)' }}
          >
            <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-[0.1em]">Flux Commercial</h2>
          {/* Live badge */}
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
            style={{
              background: 'hsl(var(--success)/0.1)',
              borderColor: 'hsl(var(--success)/0.25)',
              color: 'hsl(var(--success))',
            }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pipelineValue > 0 && (
            <Badge
              className="gap-1 text-xs font-bold"
              style={{
                background: 'hsl(var(--primary)/0.12)',
                color: 'hsl(var(--primary))',
                border: '1px solid hsl(var(--primary)/0.25)',
              }}
            >
              <Zap className="h-3 w-3" />
              Pipeline: {(pipelineValue / 1000).toFixed(0)}K DH
            </Badge>
          )}
          {conversionRate > 0 && (
            <Badge
              className="text-xs font-bold"
              style={{
                background: conversionRate >= 50
                  ? 'hsl(var(--success)/0.12)' : 'hsl(var(--warning)/0.12)',
                color: conversionRate >= 50 ? 'hsl(var(--success))' : 'hsl(var(--warning))',
                border: `1px solid ${conversionRate >= 50 ? 'hsl(var(--success)/0.25)' : 'hsl(var(--warning)/0.25)'}`,
              }}
            >
              {conversionRate}% conv.
            </Badge>
          )}
        </div>
      </div>

      {/* ── Stage cards ── */}
      <div className="flex items-stretch gap-0 divide-x divide-border/30">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex-1 flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleStageClick(stage)}
                  className="group flex-1 flex flex-col items-center gap-3 px-3 py-5 md:py-6 relative overflow-hidden transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  style={{
                    background: stage.bgGradient,
                    borderRight: index < stages.length - 1 ? `1px solid hsl(var(--border)/0.3)` : 'none',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background =
                      `linear-gradient(135deg, ${stage.glowColor} 0%, hsl(var(--card)/0.5) 100%)`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = stage.bgGradient;
                    (e.currentTarget as HTMLElement).style.transform = '';
                  }}
                >
                  {/* Shimmer on hover */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${stage.glowColor}, transparent 70%)`,
                    }}
                  />

                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full transition-all duration-300 group-hover:w-3/4"
                    style={{
                      height: 2,
                      width: '40%',
                      background: stage.accentColor,
                      boxShadow: `0 0 8px ${stage.accentColor}`,
                    }}
                  />

                  {/* Icon */}
                  <div
                    className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: `${stage.accentColor}18`,
                      border: `1px solid ${stage.accentColor}30`,
                      color: stage.accentColor,
                      boxShadow: `0 0 16px ${stage.accentColor}20`,
                    }}
                  >
                    {stage.icon}
                  </div>

                  {/* Count */}
                  <StageCount value={stage.count} />

                  {/* Label */}
                  <div className="text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">
                      {stage.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{stage.sublabel}</p>
                  </div>

                  {/* Status dot */}
                  <div className="flex items-center gap-1">
                    <span
                      className={cn('w-1.5 h-1.5 rounded-full', stage.count > 0 ? 'animate-pulse' : '')}
                      style={{ background: stage.count > 0 ? stage.accentColor : 'hsl(var(--muted-foreground)/0.3)' }}
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {stage.count > 0 ? 'Actif' : 'En attente'}
                    </span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="text-sm font-medium">{stage.tooltip}</p>
                {stage.route && (
                  <p className="text-xs text-muted-foreground mt-1">→ Ouvrir {stage.label}</p>
                )}
              </TooltipContent>
            </Tooltip>

            {/* Arrow connector */}
            {index < stages.length - 1 && (
              <div className="flex flex-col items-center justify-center px-0 w-0 relative z-10">
                <div
                  className="absolute -right-3 flex flex-col items-center gap-1"
                  style={{ transform: 'translateX(50%)' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center border"
                    style={{
                      background: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      boxShadow: '0 2px 8px hsl(0 0% 0% / 0.1)',
                    }}
                  >
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                  {index === 0 && conversionRate > 0 && (
                    <span
                      className="text-[9px] font-bold px-1 py-0.5 rounded-full"
                      style={{
                        background: conversionRate >= 50 ? 'hsl(var(--success)/0.12)' : 'hsl(var(--warning)/0.12)',
                        color: conversionRate >= 50 ? 'hsl(var(--success))' : 'hsl(var(--warning))',
                      }}
                    >
                      {conversionRate}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
