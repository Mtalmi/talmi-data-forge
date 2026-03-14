import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { TrendIndicator } from '@/components/ui/formatted-value';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

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
  delay?: number;
}

/** Extract numeric value, prefix, suffix, and unit from a display string */
function parseDisplayValue(value: string | number) {
  if (typeof value === 'number') {
    return { num: value, prefix: '', suffix: '', unit: '', decimals: value % 1 !== 0 ? 1 : 0 };
  }
  const str = String(value);
  if (str === '—' || str === '0') return null;

  const match = str.match(/^([^\d-]*)(-?[\d\s,.]+)\s*(DH|m³|%|kg|L|j|K DH|M DH|K|M)?(.*)$/);
  if (!match) return null;

  const rawNum = match[2].replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(rawNum);
  if (isNaN(num)) return null;

  const decPart = match[2].split(/[.,]/)[1];
  const unit = match[3] || '';
  const trailing = match[4]?.trim() || '';

  return {
    prefix: match[1],
    num,
    suffix: trailing,
    unit,
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
  delay = 0,
}: PeriodKPICardProps) {
  const parsed = parseDisplayValue(value);
  const animatedNum = useCountUp(parsed?.num ?? 0, 1600, delay);

  const formatAnimated = () => {
    if (!parsed) return value;
    const formatted = parsed.decimals > 0
      ? animatedNum.toLocaleString('fr-FR', { minimumFractionDigits: parsed.decimals, maximumFractionDigits: parsed.decimals })
      : animatedNum.toLocaleString('fr-FR');
    return formatted.replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ');
  };

  const displayNum = formatAnimated();
  const done = animatedNum === Math.floor(parsed?.num ?? 0);
  const unit = parsed?.unit || '';

  const accentColor = {
    default: 'hsl(var(--primary))',
    positive: 'hsl(var(--primary))',
    negative: 'hsl(var(--destructive))',
    warning: 'hsl(var(--warning))',
  }[variant];

  const iconCls = {
    default: 'bg-muted text-muted-foreground',
    positive: 'bg-primary/10 text-primary border border-primary/20',
    negative: 'bg-destructive/10 text-destructive border border-destructive/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
  }[variant];

  return (
    <div
      className={cn(
        'kpi-card god-tier-card tbos-card p-3 sm:p-4 rounded-xl border',
        'relative overflow-hidden group',
        'transition-all duration-300 ease-out hover:-translate-y-1',
        'card-magnetic press-feedback ripple-container',
        variant === 'positive' && 'bg-primary/[0.03] border-primary/20',
        variant === 'negative' && 'bg-destructive/[0.03] border-destructive/20',
        variant === 'warning' && 'bg-warning/[0.03] border-warning/20',
        variant === 'default' && 'bg-card border-border/40',
        className,
      )}
      style={style}
    >
      {/* Left accent bar */}
      <span
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full opacity-70"
        style={{ background: `linear-gradient(180deg, ${accentColor}, transparent)` }}
      />

      {/* Hover radial glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 90% 10%, ${accentColor}0C, transparent 65%)`,
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-bold uppercase tracking-[0.1em] truncate">
            {title}
          </p>
          <p
            className={cn(
              'text-lg sm:text-2xl font-black mt-0.5 tabular-nums transition-all duration-700',
              variant === 'negative' ? 'text-destructive' : variant === 'warning' ? 'text-warning' : 'text-primary',
              done && parsed?.num ? 'drop-shadow-[0_0_10px_hsl(51_100%_50%/0.4)]' : '',
            )}
            style={{ fontFamily: MONO, fontWeight: 200 }}
          >
            {parsed?.prefix}
            {displayNum}
            {unit && (
              <span style={{ fontWeight: 300, fontSize: '60%', color: '#9CA3AF', marginLeft: 4 }}>
                {unit}
              </span>
            )}
            {parsed?.suffix}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <div
          className={cn(
            'p-1.5 sm:p-2 rounded-md flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm',
            iconCls,
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-2.5 pt-2 border-t border-border/30">
          <TrendIndicator
            value={trend}
            label={trendLabel}
            invertColor={title.includes('CUR')}
          />
        </div>
      )}
    </div>
  );
}

