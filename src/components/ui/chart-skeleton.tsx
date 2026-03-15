import { useEffect, useState, memo } from 'react';

/**
 * Chart loading skeleton with shimmer effect.
 * Renders briefly (200ms) before chart data appears.
 */
export const ChartSkeleton = memo(function ChartSkeleton({
  height = 200,
  type = 'area',
}: {
  height?: number;
  type?: 'area' | 'bar' | 'donut' | 'sparkline';
}) {
  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ height, background: 'rgba(212,168,67,0.02)' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(212,168,67,0.04) 50%, transparent 100%)',
          animation: 'chartShimmer 1.2s ease-in-out infinite',
        }}
      />
      <svg width="100%" height="100%" style={{ opacity: 0.06 }}>
        {type === 'area' && (
          <path
            d={`M 0 ${height * 0.7} Q ${height * 0.3} ${height * 0.3}, ${height * 0.6} ${height * 0.5} T ${height * 1.2} ${height * 0.4} L ${height * 1.2} ${height} L 0 ${height} Z`}
            fill="currentColor"
          />
        )}
        {type === 'bar' &&
          [0.3, 0.6, 0.45, 0.8, 0.5, 0.7].map((h, i) => (
            <rect
              key={i}
              x={`${10 + i * 15}%`}
              y={height * (1 - h)}
              width="10%"
              height={height * h}
              rx={3}
              fill="currentColor"
            />
          ))}
        {type === 'donut' && (
          <circle
            cx="50%"
            cy="50%"
            r={height * 0.3}
            fill="none"
            stroke="currentColor"
            strokeWidth={height * 0.12}
          />
        )}
      </svg>
      <style>{`
        @keyframes chartShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
});

/**
 * Hook: delays rendering of chart content by `delayMs` to show skeleton first.
 */
export function useChartReady(delayMs = 200) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return ready;
}
