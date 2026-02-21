import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { useI18n } from '@/i18n/I18nContext';

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
  value,
  title,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
}: KPICardProps) {
  const { t } = useI18n();
  const numericValue = typeof value === 'number' ? value : parseInt(String(value), 10);
  const isNumeric = !isNaN(numericValue) && typeof value === 'number';
  const animated = useCountUp(isNumeric ? numericValue : 0, 1600);

  const TrendIcon = trend ? { up: TrendingUp, down: TrendingDown, neutral: Minus }[trend] : null;

  const accentColor = {
    default: 'hsl(var(--primary))',
    positive: 'hsl(var(--primary))',
    negative: 'hsl(var(--destructive))',
    warning: 'hsl(var(--warning))',
  }[variant];

  const iconBg = {
    default: 'bg-primary/10 border-primary/20 text-primary',
    positive: 'bg-primary/10 border-primary/20 text-primary',
    negative: 'bg-destructive/10 border-destructive/20 text-destructive',
    warning: 'bg-warning/10 border-warning/20 text-warning',
  }[variant];

  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  return (
    <div
      className={cn(
        'kpi-card god-tier-card tbos-card tbos-card-stagger animate-fade-in group card-magnetic press-feedback ripple-container',
        'relative overflow-hidden rounded-xl border p-4 sm:p-5',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1',
        variant === 'positive' && 'bg-primary/[0.03] border-primary/20',
        variant === 'negative' && 'bg-destructive/[0.03] border-destructive/20',
        variant === 'warning' && 'bg-warning/[0.03] border-warning/20',
        variant === 'default' && 'bg-card border-border/40',
      )}
      style={{
        ['--hover-glow' as string]: `0 8px 32px ${accentColor}22`,
      }}
    >
      {/* Left accent bar */}
      <span
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: `linear-gradient(180deg, ${accentColor}, ${accentColor}44)` }}
      />

      {/* Subtle radial glow behind icon */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 100% 0%, ${accentColor}0A, transparent 60%)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {title}
          </p>
          <p
            className={cn(
              'text-2xl sm:text-3xl font-black tracking-tight tabular-nums transition-all duration-700',
              variant === 'negative' ? 'text-destructive' : variant === 'warning' ? 'text-warning' : 'text-primary',
            )}
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {isNumeric ? animated.toLocaleString('fr-MA') : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            'p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-md shrink-0',
            iconBg,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && trendValue && TrendIcon && (
        <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
              trend === 'up' && 'bg-success/10',
              trend === 'down' && 'bg-destructive/10',
              trend === 'neutral' && 'bg-muted/50',
            )}
          >
            <TrendIcon className={cn('h-3.5 w-3.5', trendColors[trend])} />
            <span className={trendColors[trend]}>{trendValue}</span>
          </div>
          <span className="text-xs text-muted-foreground">{t.common.vs}. {t.common.yesterday}</span>
        </div>
      )}
    </div>
  );
}
