import { Loader2 } from 'lucide-react';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

/**
 * Full-page loading skeleton matching the dark TBOS aesthetic.
 * Shows 4 KPI skeletons + 2 chart skeletons + table skeleton.
 */
export function PageLoadingSkeleton({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Loader2 size={16} className="animate-spin" style={{ color: '#D4A843' }} />
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#D4A843', fontWeight: 600, letterSpacing: '0.15em' }}>
          {message}
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: '2px solid rgba(212,168,67,0.2)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ width: '60%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }} />
            <div style={{ width: '40%', height: 24, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: 20,
              height: 200,
            }}
          >
            <div style={{ width: '30%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />
            <div style={{ width: '100%', height: '70%', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="animate-pulse"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ width: '20%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 2, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ flex: 1, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
            <div style={{ flex: 1, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
