import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnimatedCounterWithGlow } from '@/hooks/useAnimatedCounter';

interface PeriodKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
  className?: string;
  style?: React.CSSProperties;
}

function parseDisplayValue(value: string | number) {
  if (typeof value === 'number') {
    return { num: value, prefix: '', suffix: '', decimals: value % 1 !== 0 ? 1 : 0 };
  }
  const str = String(value);
  if (str === '—' || str === '0') return null;
  
  const match = str.match(/^([^\d-]*)(-?[\d,.]+)(.*)$/);
  if (!match) return null;
  
  const num = parseFloat(match[2].replace(',', '.'));
  if (isNaN(num)) return null;
  
  const decPart = match[2].split(/[.,]/)[1];
  return {
    prefix: match[1],
    num,
    suffix: match[3],
    decimals: decPart ? decPart.length : 0,
  };
}

export function PeriodKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  className,
  style,
}: PeriodKPICardProps) {
  const parsed = parseDisplayValue(value);
  const { display: animatedNum, done } = useAnimatedCounterWithGlow(
    parsed?.num ?? 0,
    1500,
    parsed?.decimals ?? 0
  );

  const displayValue = parsed
    ? `${parsed.prefix}${animatedNum}${parsed.suffix}`
    : value;

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-3 w-3" />;
    return trend > 0 
      ? <TrendingUp className="h-3 w-3" /> 
      : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === undefined) return 'text-muted-foreground';
    if (title.includes('CUR')) {
      return trend <= 0 ? 'text-success' : 'text-destructive';
    }
    return trend >= 0 ? 'text-success' : 'text-destructive';
  };

  const formatTrend = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div 
      className={cn(
        'kpi-card god-tier-card p-3 sm:p-4 rounded-xl border card-magnetic press-feedback ripple-container',
        variant === 'positive' && 'positive bg-success/5 border-success/20',
        variant === 'negative' && 'negative bg-destructive/5 border-destructive/20',
        variant === 'warning' && 'warning bg-warning/5 border-warning/20',
        variant === 'default' && 'bg-card border-border/40',
        className
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider truncate">{title}</p>
          <p className={cn(
            'text-lg sm:text-2xl font-bold mt-0.5 tabular-nums transition-all duration-700 metric-gold',
            variant === 'negative' && '!text-destructive',
            variant === 'warning' && '!text-warning',
            done && parsed?.num ? 'drop-shadow-[0_0_12px_hsl(51_100%_50%/0.5)]' : ''
          )}>
            {displayValue}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'p-1.5 sm:p-2 rounded-md flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
          variant === 'positive' && 'bg-success/10',
          variant === 'negative' && 'bg-destructive/10',
          variant === 'warning' && 'bg-warning/10',
          variant === 'default' && 'bg-muted'
        )}>
          <Icon className={cn(
            'h-4 w-4 sm:h-5 sm:w-5',
            variant === 'positive' && 'text-success',
            variant === 'negative' && 'text-destructive',
            variant === 'warning' && 'text-warning',
            variant === 'default' && 'text-muted-foreground'
          )} />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-3 pt-2 border-t border-border/30 flex items-center gap-2">
          <span className={cn(
            trend > 0 ? 'trend-badge-up' : trend < 0 ? 'trend-badge-down' : 'trend-badge-neutral'
          )}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
            {' '}{Math.abs(trend).toFixed(1)}%
          </span>
          {trendLabel && (
            <span className="text-[10px] text-muted-foreground">vs {trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
