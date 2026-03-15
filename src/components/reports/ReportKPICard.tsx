import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendIndicator } from '@/components/ui/formatted-value';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

interface ReportKPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  variant?: 'primary' | 'success' | 'warning' | 'accent';
  className?: string;
}

/** Split trailing unit from value string */
function splitUnit(value: string): { num: string; unit: string } {
  const match = value.match(/^(.+?)\s*(DH|m³|%|kg|L|j|K DH|M DH)$/);
  if (match) return { num: match[1].trim(), unit: match[2] };
  // Check for trailing %
  if (value.endsWith('%')) return { num: value.slice(0, -1), unit: '%' };
  return { num: value, unit: '' };
}

export const ReportKPICard = React.memo(function ReportKPICard({
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

  const { num, unit } = splitUnit(value);

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
            <p className="text-lg sm:text-2xl font-bold mt-0.5 truncate" style={{ fontFamily: MONO, fontWeight: 200 }}>
              {num}
              {unit && (
                <span style={{ fontWeight: 300, fontSize: '60%', color: '#9CA3AF', marginLeft: 4 }}>
                  {unit}
                </span>
              )}
            </p>
            
            {trend !== undefined && (
              <div className="mt-1.5">
                <TrendIndicator value={trend} label={trendLabel} />
              </div>
            )}
          </div>
          <Icon className={cn('h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0', iconStyles[variant])} />
        </div>
      </CardContent>
    </Card>
  );
});

