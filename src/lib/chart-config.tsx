/**
 * TBOS Unified Chart Configuration
 * Single source of truth for all Recharts styling across the application.
 */

import React from 'react';

/* ── Color Palette ── */
export const CHART_COLORS = {
  primary: '#D4A843',
  secondary: '#E8C96A',
  tertiary: '#C49A3C',
  quaternary: '#A07C2E',
  positive: '#22C55E',
  warning: '#F59E0B',
  negative: '#EF4444',
  inactive: '#9CA3AF',
  background: '#0F1629',
  tooltipBg: '#1A2332',
  tooltipBorder: 'rgba(212, 168, 67, 0.2)',
  grid: 'rgba(212, 168, 67, 0.06)',
  axisText: '#9CA3AF',
  separator: 'rgba(212, 168, 67, 0.3)',
} as const;

/** Ordered palette for multi-series charts */
export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.positive,
  CHART_COLORS.warning,
  CHART_COLORS.negative,
  CHART_COLORS.inactive,
] as const;

/** Donut/Pie palette (gold multi-tone) */
export const DONUT_PALETTE = [
  '#D4A843',
  '#C49A3C',
  '#E8C96A',
  '#A07C2E',
  '#9CA3AF',
] as const;

const MONO = 'ui-monospace, SFMono-Regular, monospace';

/* ── Axis Props ── */
export const xAxisProps = {
  tick: { fill: CHART_COLORS.axisText, fontSize: 10, fontFamily: MONO, letterSpacing: '0.5px' },
  axisLine: false,
  tickLine: false,
  dy: 8,
} as const;

export const yAxisProps = {
  tick: { fill: CHART_COLORS.axisText, fontSize: 10, fontFamily: MONO },
  axisLine: false,
  tickLine: false,
  dx: -4,
  width: 45,
} as const;

/* ── Grid Props ── */
export const gridProps = {
  horizontal: true,
  vertical: false,
  stroke: CHART_COLORS.grid,
  strokeDasharray: undefined as undefined | string,
} as const;

/* ── Crosshair Cursor (for line/area charts) ── */
export const crosshairCursor = {
  stroke: CHART_COLORS.primary,
  strokeDasharray: '4 4',
  strokeOpacity: 0.35,
  strokeWidth: 1,
} as const;

/* ── Bar hover cursor ── */
export const barCursor = {
  fill: 'rgba(212, 168, 67, 0.05)',
} as const;

/* ── Enhanced active dot for line/area charts ── */
export function EnhancedActiveDot(props: any) {
  const { cx, cy, fill } = props;
  const color = fill || CHART_COLORS.primary;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="#0F1629" strokeWidth={2} />
    </g>
  );
}

/* ── Tooltip Style ── */
export const tooltipStyle = {
  contentStyle: {
    background: CHART_COLORS.tooltipBg,
    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
    borderRadius: 6,
    padding: '8px 12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    fontFamily: MONO,
    fontSize: 11,
    color: '#FFFFFF',
  },
  itemStyle: {
    color: CHART_COLORS.primary,
    fontFamily: MONO,
    fontSize: 11,
    padding: '2px 0',
  },
  labelStyle: {
    color: '#FFFFFF',
    fontWeight: 600,
    fontFamily: MONO,
    fontSize: 11,
    marginBottom: 4,
  },
  cursor: crosshairCursor,
} as const;

/* ── Bar Chart Gradient Definition (insert as child of <BarChart>) ── */
export function GoldBarGradient({ id = 'tbosBarGold' }: { id?: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#C49A3C" />
        <stop offset="100%" stopColor="#D4A843" />
      </linearGradient>
    </defs>
  );
}

/* ── Area Fill Gradient Definition ── */
export function GoldAreaGradient({ id = 'tbosAreaGold' }: { id?: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(212, 168, 67, 0.12)" />
        <stop offset="100%" stopColor="rgba(212, 168, 67, 0)" />
      </linearGradient>
    </defs>
  );
}

/* ── Pulse Dot for latest data point on line charts ── */
export function PulseDot(props: any) {
  const { cx, cy, index, dataLength } = props;
  if (index !== dataLength - 1) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={CHART_COLORS.primary} />
      <circle cx={cx} cy={cy} r={4} fill={CHART_COLORS.primary} opacity={0.5}>
        <animate attributeName="r" from="4" to="10" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

/* ── Custom Active Dot (on hover) ── */
export function ActiveDot(props: any) {
  const { cx, cy } = props;
  return <circle cx={cx} cy={cy} r={5} fill={CHART_COLORS.primary} stroke="#0F1629" strokeWidth={2} />;
}

/* ── Chart Summary Strip ── */
interface SummaryItem {
  label: string;
  value: string | number;
  color?: string;
}

export function ChartSummaryStrip({ items }: { items: SummaryItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '8px 0 0',
        flexWrap: 'wrap',
        fontFamily: MONO,
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span style={{ color: CHART_COLORS.separator, margin: '0 8px', fontSize: 10 }}>·</span>
          )}
          <span style={{ fontSize: 10, color: CHART_COLORS.axisText, marginRight: 4 }}>
            {item.label}
          </span>
          <span style={{ fontSize: 12, fontWeight: 200, color: item.color || '#FFFFFF' }}>
            {item.value}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Bar radius shorthand ── */
export const barRadius = [3, 3, 0, 0] as [number, number, number, number];

/* ── Donut inner/outer ratio helper ── */
export function donutRadii(outerRadius: number) {
  const innerRadius = outerRadius * 0.75; // ~25% thickness
  return { innerRadius, outerRadius };
}

/* ── Unified TBOS Tooltip Component ── */
export function TbosChartTooltip({ active, payload, label, unit, currencySymbol }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: CHART_COLORS.tooltipBg,
      border: `1px solid ${CHART_COLORS.tooltipBorder}`,
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      fontFamily: MONO,
    }}>
      {label && <p style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 4 }}>{label}</p>}
      {payload.map((entry: any, i: number) => {
        const val = typeof entry.value === 'number'
          ? entry.value.toLocaleString('fr-FR')
          : entry.value;
        return (
          <p key={i} style={{ color: entry.color || CHART_COLORS.primary, fontSize: 12, fontFamily: MONO }}>
            {entry.name && entry.name !== 'value' ? `${entry.name}: ` : ''}
            {currencySymbol || ''}{val}{unit ? ` ${unit}` : ''}
          </p>
        );
      })}
    </div>
  );
}
