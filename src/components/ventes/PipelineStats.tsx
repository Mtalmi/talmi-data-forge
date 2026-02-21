import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText, ShoppingCart, Truck, ArrowRight, TrendingUp, Loader2, Percent, CalendarDays, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { useCountUp } from '@/hooks/useCountUp';

interface PipelineStatsProps {
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

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  onClick?: () => void;
  clickable?: boolean;
}

function StatCard({ icon, value, label, accentColor, glowColor, bgGradient, onClick, clickable }: StatCardProps) {
  const animated = useCountUp(value, 1200);
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border p-4 transition-all duration-200',
        clickable && 'cursor-pointer hover:-translate-y-1',
      )}
      style={{
        background: bgGradient,
        borderColor: `${accentColor}30`,
        boxShadow: `0 4px 20px ${accentColor}08`,
      }}
      onMouseEnter={e => {
        if (!clickable) return;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${glowColor}, 0 0 0 1px ${accentColor}40`;
        (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}60`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${accentColor}08`;
        (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}30`;
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: accentColor }}
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-400"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${glowColor}, transparent 70%)` }}
      />

      <div className="flex items-center gap-3 relative">
        <div
          className="p-2 rounded-lg flex-shrink-0 transition-all duration-300 group-hover:scale-110"
          style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25`, color: accentColor }}
        >
          {icon}
        </div>
        <div>
          <p
            className="text-2xl font-black tabular-nums leading-none"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: accentColor }}
          >
            {animated}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function PipelineStats({ stats, onStageClick }: PipelineStatsProps) {
  const { t } = useI18n();
  const p = t.pipelineStats;

  const conversionRate = useMemo(() => {
    const totalDevis = stats.devisEnAttente + (stats.devisConverti || 0) + (stats.devisRefuses || 0) + (stats.devisAcceptes || 0);
    if (totalDevis === 0) return 0;
    return Math.round(((stats.devisConverti || 0) / totalDevis) * 100);
  }, [stats]);

  const pipelineValue = useMemo(() => stats.totalBcHT || 0, [stats.totalBcHT]);

  const forecastValue = useMemo(() => {
    const avgBcValue = pipelineValue / Math.max(stats.bcPretProduction + stats.bcEnProduction, 1);
    return avgBcValue * (stats.bcPretProduction + stats.bcEnProduction);
  }, [pipelineValue, stats.bcPretProduction, stats.bcEnProduction]);

  const handleStageClick = (stage: string) => {
    if (onStageClick) onStageClick(stage);
  };

  const totalDevisHT_K = useCountUp(Math.round(stats.totalDevisHT / 1000), 1400);

  return (
    <>
      {/* ── Top 5 KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 tbos-stagger-enter">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          value={stats.devisEnAttente}
          label={p.pendingQuotes}
          accentColor="hsl(var(--warning))"
          glowColor="hsl(var(--warning) / 0.2)"
          bgGradient="linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--warning)/0.04) 100%)"
          clickable={!!onStageClick}
          onClick={() => handleStageClick('en_attente')}
        />
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          value={stats.bcPretProduction}
          label={p.readyBc}
          accentColor="hsl(220 90% 60%)"
          glowColor="hsl(220 90% 60% / 0.2)"
          bgGradient="linear-gradient(135deg, hsl(var(--card)) 0%, hsl(220 90% 60% / 0.04) 100%)"
          clickable={!!onStageClick}
          onClick={() => handleStageClick('pret_production')}
        />

        {/* Conversion rate — special card */}
        <div
          className="relative overflow-hidden rounded-xl border p-4"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)/0.10) 0%, hsl(var(--primary)/0.04) 100%)',
            borderColor: 'hsl(var(--primary)/0.30)',
            boxShadow: '0 4px 20px hsl(var(--primary)/0.12), 0 0 0 1px hsl(var(--primary)/0.06)',
          }}
        >
          <div className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full" style={{ background: 'hsl(var(--primary))' }} />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary)/0.12), transparent 70%)' }}
          />
          <div className="flex items-center gap-3 relative">
            <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--primary)/0.15)', border: '1px solid hsl(var(--primary)/0.25)', color: 'hsl(var(--primary))' }}>
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--primary))', textShadow: '0 0 16px hsl(var(--primary)/0.4)' }}>
                  {conversionRate}
                </span>
                <span className="text-sm font-bold" style={{ color: 'hsl(var(--primary)/0.7)' }}>%</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1">{p.conversionRate}</p>
            </div>
          </div>
        </div>

        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          value={Math.round(stats.totalDevisHT / 1000)}
          label={`${p.inQuotes} (K)`}
          accentColor="hsl(var(--success))"
          glowColor="hsl(var(--success) / 0.2)"
          bgGradient="linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--success)/0.04) 100%)"
        />
        <StatCard
          icon={<Truck className="h-5 w-5" />}
          value={stats.bcLivre}
          label={p.deliveredBc}
          accentColor="hsl(var(--success))"
          glowColor="hsl(var(--success) / 0.2)"
          bgGradient="linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--success)/0.04) 100%)"
          clickable={!!onStageClick}
          onClick={() => handleStageClick('termine')}
        />
      </div>

      {/* ── Commercial Flow Card ── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--primary)/0.02) 100%)',
          borderColor: 'hsl(var(--primary)/0.15)',
          boxShadow: '0 4px 32px hsl(var(--primary)/0.05)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{
            borderColor: 'hsl(var(--border)/0.4)',
            background: 'linear-gradient(90deg, hsl(var(--primary)/0.05) 0%, transparent 60%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg" style={{ background: 'hsl(var(--primary)/0.12)' }}>
              <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-[0.08em]">{p.commercialFlow}</h3>
          </div>
          {pipelineValue > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  className="gap-1 text-xs font-bold"
                  style={{
                    background: 'hsl(var(--success)/0.12)',
                    color: 'hsl(var(--success))',
                    border: '1px solid hsl(var(--success)/0.25)',
                  }}
                >
                  <DollarSign className="h-3 w-3" />
                  {p.pipeline}: {(pipelineValue / 1000).toFixed(0)}K DH
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{p.totalActiveBc}</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Stage flow */}
        <div className="px-5 py-6 flex items-center justify-between gap-2">
          {/* Quotes */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn('flex-1 text-center transition-all duration-200', onStageClick && 'cursor-pointer hover:-translate-y-1')}
                onClick={() => handleStageClick('en_attente')}
              >
                <div
                  className="pipeline-stage inline-flex flex-col items-center gap-2 p-5 rounded-2xl transition-all duration-200 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--warning)/0.10), hsl(var(--warning)/0.05))',
                    border: '1px solid hsl(var(--warning)/0.30)',
                  }}
                >
                  <FileText className="h-8 w-8" style={{ color: 'hsl(var(--warning))' }} />
                  <p className="pipeline-count" style={{ color: 'hsl(var(--warning))' }}>{stats.devisEnAttente}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{p.quotes}</p>
                  <span className="status-dot status-dot-yellow" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{p.clickToFilter}</p>
              <p className="text-xs opacity-70">{p.value}: {stats.totalDevisHT.toLocaleString()} DH</p>
            </TooltipContent>
          </Tooltip>

          {/* Arrow 1 */}
          <div className="flex flex-col items-center gap-1">
            <ArrowRight className="h-5 w-5 text-muted-foreground/60" />
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }}>
              {conversionRate}%
            </span>
          </div>

          {/* Validated BC */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn('flex-1 text-center transition-all duration-200', onStageClick && 'cursor-pointer hover:-translate-y-1')}
                onClick={() => handleStageClick('pret_production')}
              >
                <div
                  className="pipeline-stage inline-flex flex-col items-center gap-2 p-5 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, hsl(220 90% 60% / 0.10), hsl(220 90% 60% / 0.04))',
                    border: '1px solid hsl(220 90% 60% / 0.30)',
                  }}
                >
                  <ShoppingCart className="h-8 w-8" style={{ color: 'hsl(220 90% 60%)' }} />
                  <p className="pipeline-count" style={{ color: 'hsl(220 90% 60%)' }}>{stats.bcPretProduction}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{p.validatedBc}</p>
                  <span className="status-dot status-dot-green" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>{p.readyForProduction}</TooltipContent>
          </Tooltip>

          {/* Arrow 2 */}
          <ArrowRight className="h-5 w-5 text-muted-foreground/60" />

          {/* In Production */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn('flex-1 text-center transition-all duration-200', onStageClick && 'cursor-pointer hover:-translate-y-1')}
                onClick={() => handleStageClick('en_production')}
              >
                <div
                  className="pipeline-stage inline-flex flex-col items-center gap-2 p-5 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--accent-teal)/0.10), hsl(var(--accent-teal)/0.04))',
                    border: '1px solid hsl(var(--accent-teal)/0.30)',
                  }}
                >
                  <Loader2
                    className={cn('h-8 w-8', stats.bcEnProduction > 0 && 'animate-spin')}
                    style={{ color: 'hsl(var(--accent-teal))' }}
                  />
                  <p className="pipeline-count" style={{ color: 'hsl(var(--accent-teal))' }}>{stats.bcEnProduction}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{p.inProduction}</p>
                  <span className="status-dot status-dot-gold" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>{p.blCreatedDelivery}</TooltipContent>
          </Tooltip>

          {/* Arrow 3 */}
          <ArrowRight className="h-5 w-5 text-muted-foreground/60" />

          {/* Completed */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn('flex-1 text-center transition-all duration-200', onStageClick && 'cursor-pointer hover:-translate-y-1')}
                onClick={() => handleStageClick('termine')}
              >
                <div
                  className="pipeline-stage inline-flex flex-col items-center gap-2 p-5 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--success)/0.10), hsl(var(--success)/0.04))',
                    border: '1px solid hsl(var(--success)/0.30)',
                  }}
                >
                  <Truck className="h-8 w-8" style={{ color: 'hsl(var(--success))' }} />
                  <p className="pipeline-count" style={{ color: 'hsl(var(--success))' }}>{stats.bcLivre}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{p.completed}</p>
                  <span className="status-dot status-dot-green" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>{p.deliveredInvoiced}</TooltipContent>
          </Tooltip>
        </div>

        {/* Forecast bar */}
        {forecastValue > 0 && (
          <div
            className="mx-5 mb-5 p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--muted)/0.5) 0%, hsl(var(--muted)/0.2) 100%)',
              border: '1px solid hsl(var(--border)/0.5)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{p.revenueForecast}</span>
              </div>
              <span
                className="text-lg font-black"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--primary))', textShadow: '0 0 16px hsl(var(--primary)/0.3)' }}
              >
                {forecastValue.toLocaleString()} DH
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min((stats.bcEnProduction / (stats.bcPretProduction + stats.bcEnProduction + 0.01)) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, hsl(var(--primary)/0.6), hsl(var(--primary)))',
                  boxShadow: '0 0 8px hsl(var(--primary)/0.4)',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span className="font-medium">{stats.bcPretProduction} {p.toLaunch}</span>
              <span className="font-medium">{stats.bcEnProduction} {p.inProgress}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
