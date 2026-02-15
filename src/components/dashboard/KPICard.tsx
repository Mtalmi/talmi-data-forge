import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

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
  // Animate numeric values
  const numericValue = typeof value === 'number' ? value : parseInt(String(value), 10);
  const isNumeric = !isNaN(numericValue) && typeof value === 'number';
  const animatedNum = useAnimatedCounter(isNumeric ? numericValue : 0, 1200, 0);

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
    default: 'bg-primary/10 border border-primary/20',
    positive: 'bg-primary/10 border border-primary/20',
    negative: 'bg-destructive/10 border border-destructive/20',
    warning: 'bg-warning/10 border border-warning/20',
  };

  const iconColors = {
    default: 'text-primary',
    positive: 'text-primary',
    negative: 'text-destructive',
    warning: 'text-warning',
  };

  const TrendIcon = trend ? trendIcon[trend] : null;

  return (
    <div className={cn(
      'kpi-card animate-fade-in group',
      'hover:scale-[1.02] hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] transition-all duration-300',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums">
            {isNumeric ? animatedNum : value}
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
