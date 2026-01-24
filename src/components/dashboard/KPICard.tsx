import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
}: KPICardProps) {
  const variantStyles = {
    default: '',
    positive: 'positive',
    negative: 'negative',
    warning: 'warning',
  };

  const trendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const iconBgColors = {
    default: 'bg-primary/15',
    positive: 'bg-success/15',
    negative: 'bg-destructive/15',
    warning: 'bg-warning/15',
  };

  const iconColors = {
    default: 'text-primary',
    positive: 'text-success',
    negative: 'text-destructive',
    warning: 'text-warning',
  };

  const TrendIcon = trend ? trendIcon[trend] : null;

  return (
    <div className={cn(
      'kpi-card animate-fade-in group',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110",
          iconBgColors[variant]
        )}>
          <Icon className={cn("h-5 w-5", iconColors[variant])} />
        </div>
      </div>
      
      {trend && trendValue && TrendIcon && (
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold",
            trend === 'up' && "bg-success/10",
            trend === 'down' && "bg-destructive/10",
            trend === 'neutral' && "bg-muted/50"
          )}>
            <TrendIcon className={cn('h-3.5 w-3.5', trendColors[trend])} />
            <span className={trendColors[trend]}>{trendValue}</span>
          </div>
          <span className="text-xs text-muted-foreground">vs. hier</span>
        </div>
      )}
    </div>
  );
}
