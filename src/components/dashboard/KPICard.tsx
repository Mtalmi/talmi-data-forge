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

  const TrendIcon = trend ? trendIcon[trend] : null;

  return (
    <div className={cn('kpi-card animate-fade-in', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      
      {trend && trendValue && TrendIcon && (
        <div className="mt-3 flex items-center gap-1">
          <TrendIcon className={cn('h-4 w-4', trendColors[trend])} />
          <span className={cn('text-sm font-medium', trendColors[trend])}>
            {trendValue}
          </span>
          <span className="text-xs text-muted-foreground ml-1">vs. hier</span>
        </div>
      )}
    </div>
  );
}
