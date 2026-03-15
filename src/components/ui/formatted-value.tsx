import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatTrend } from '@/lib/formatters';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

/* ── UnitValue: renders "45 460 DH" with the unit visually lighter ── */
interface UnitValueProps {
  value: string | number;
  unit?: string;
  className?: string;
  numberClassName?: string;
  unitClassName?: string;
  style?: React.CSSProperties;
}

export function UnitValue({
  value,
  unit,
  className,
  numberClassName,
  unitClassName,
  style,
}: UnitValueProps) {
  // If no unit, render as-is
  if (!unit) {
    return <span className={className} style={style}>{value}</span>;
  }

  // Split value from unit if unit is embedded
  const strVal = String(value);
  const cleanValue = strVal
    .replace(/\s*(DH|m³|%|kg|L|j|K DH|M DH)\s*$/i, '')
    .trim();

  return (
    <span className={cn('inline-flex items-baseline', className)} style={style}>
      <span className={cn('tabular-nums', numberClassName)} style={{ fontFamily: MONO }}>
        {cleanValue || value}
      </span>
      <span
        className={cn(unitClassName)}
        style={{
          fontWeight: 300,
          fontSize: '60%',
          color: '#9CA3AF',
          marginLeft: 4,
          fontFamily: MONO,
        }}
      >
        {unit}
      </span>
    </span>
  );
}

/* ── TrendIndicator: standardized trend arrows ── */
interface TrendIndicatorProps {
  value: number;
  label?: string;
  className?: string;
  /** For metrics where lower is better (e.g. CUR) */
  invertColor?: boolean;
}

export function TrendIndicator({ value, label, className, invertColor = false }: TrendIndicatorProps) {
  const isPositive = invertColor ? value <= 0 : value >= 0;
  const isZero = Math.abs(value) < 0.05;

  const color = isZero ? '#9CA3AF' : isPositive ? '#22C55E' : '#EF4444';
  const arrow = isZero ? '→' : value > 0 ? '↗' : '↘';
  const text = isZero ? 'stable' : formatTrend(value);

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      style={{ fontFamily: MONO, fontSize: 12, color }}
    >
      <span>{arrow}</span>
      <span style={{ fontWeight: 600 }}>{text}</span>
      {label && (
        <span style={{ color: '#9CA3AF', fontWeight: 400 }}>vs {label}</span>
      )}
    </span>
  );
}

/* ── SectionHeader: ✦ + TITLE + dotted gold line ── */
interface SectionHeaderProps {
  children: ReactNode;
  className?: string;
}

export function SectionHeader({ children, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center gap-0 mb-4 mt-6', className)}>
      <span
        style={{
          color: '#D4A843',
          fontSize: 14,
          marginRight: 8,
          flexShrink: 0,
        }}
      >
        ✦
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: '#D4A843',
          textTransform: 'uppercase' as const,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {children}
      </span>
      <span
        style={{
          borderBottom: '1px dashed rgba(212, 168, 67, 0.2)',
          flexGrow: 1,
          marginLeft: 12,
          alignSelf: 'center',
          height: 0,
        }}
      />
    </div>
  );
}
