import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReportKPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  variant?: 'primary' | 'success' | 'warning' | 'accent';
  className?: string;
}

export function ReportKPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'primary',
  className,
}: ReportKPICardProps) {
  const variantStyles = {
    primary: 'from-primary/10 to-primary/5 border-primary/20',
    success: 'from-success/10 to-success/5 border-success/20',
    warning: 'from-warning/10 to-warning/5 border-warning/20',
    accent: 'from-accent/10 to-accent/5 border-accent/20',
  };

  const iconStyles = {
    primary: 'text-primary/50',
    success: 'text-success/50',
    warning: 'text-warning/50',
    accent: 'text-accent/50',
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-muted-foreground';
    return trend > 0 ? 'text-success' : 'text-destructive';
  };

  const getTrendIcon = () => {
    if (trend === undefined || Math.abs(trend) < 0.5) return Minus;
    return trend > 0 ? TrendingUp : TrendingDown;
  };

  const formatTrend = (val: number) => {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className={cn(
      'bg-gradient-to-br transition-all hover:shadow-md',
      variantStyles[variant],
      className
    )}>
      <CardContent className="pt-4 sm:pt-6 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-lg sm:text-2xl font-bold mt-0.5 truncate">{value}</p>
            
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-1 mt-1.5 text-xs sm:text-sm',
                getTrendColor()
              )}>
                <TrendIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium">{formatTrend(trend)}</span>
                {trendLabel && (
                  <span className="text-muted-foreground hidden sm:inline">vs {trendLabel}</span>
                )}
              </div>
            )}
          </div>
          <Icon className={cn('h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0', iconStyles[variant])} />
        </div>
      </CardContent>
    </Card>
  );
}
