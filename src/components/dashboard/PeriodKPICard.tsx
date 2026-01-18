import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
  className?: string;
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
}: PeriodKPICardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-3 w-3" />;
    return trend > 0 
      ? <TrendingUp className="h-3 w-3" /> 
      : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === undefined) return 'text-muted-foreground';
    // For CUR, lower is better (negative trend is good)
    if (title.includes('CUR')) {
      return trend <= 0 ? 'text-success' : 'text-destructive';
    }
    // For others, higher is better
    return trend >= 0 ? 'text-success' : 'text-destructive';
  };

  const formatTrend = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className={cn(
      'p-3 sm:p-4 rounded-lg border transition-all',
      variant === 'positive' && 'bg-success/5 border-success/30',
      variant === 'negative' && 'bg-destructive/5 border-destructive/30',
      variant === 'warning' && 'bg-warning/5 border-warning/30',
      variant === 'default' && 'bg-card border-border/50',
      className
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider truncate">{title}</p>
          <p className={cn(
            'text-lg sm:text-2xl font-bold font-mono mt-0.5 tabular-nums',
            variant === 'positive' && 'text-success',
            variant === 'negative' && 'text-destructive',
            variant === 'warning' && 'text-warning'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'p-1.5 sm:p-2 rounded-md flex-shrink-0',
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
        <div className={cn(
          'flex items-center gap-1 mt-2 text-[10px] sm:text-xs',
          getTrendColor()
        )}>
          {getTrendIcon()}
          <span className="font-medium">{formatTrend(trend)}</span>
          {trendLabel && (
            <span className="text-muted-foreground ml-1 hidden sm:inline">vs {trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
