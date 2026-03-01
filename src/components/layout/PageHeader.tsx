import { ReactNode, useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ── Live clock (JetBrains Mono, gray) ── */
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <>{time}</>;
}

/* ── Tab definition ── */
export interface PageTab {
  id: string;
  label: string;
}

/* ── Props ── */
export interface PageHeaderProps {
  /** Lucide icon component for the branded circle */
  icon: LucideIcon;
  /** Module name displayed after "TBOS " */
  title: string;
  /** Small subtitle below the title */
  subtitle: string;
  /** Optional tab pills — centered between branding and utilities */
  tabs?: PageTab[];
  /** Currently active tab id */
  activeTab?: string;
  /** Tab change callback */
  onTabChange?: (id: string) => void;
  /** Action buttons / controls rendered on the right (before clock & bell) */
  actions?: ReactNode;
  /** Whether to show a loading spinner */
  loading?: boolean;
}

const T = {
  gold: '#D4A843',
  goldBorder: 'rgba(245, 158, 11, 0.25)',
  navy: '#0B1120',
  textSec: '#94A3B8',
  textDim: '#64748B',
  danger: '#EF4444',
};

/**
 * Standardized TBOS page header — matches the Production / Planning gold standard.
 *
 * Row 1 (sticky): [Icon + TBOS Title] — [Tabs (centered)] — [Clock + Bell + Spinner]
 */
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  actions,
  loading,
}: PageHeaderProps) {
  return (
    <div
      data-seamless-header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 16px',
        background: 'transparent',
        border: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          minHeight: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        {/* ── Branding ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${T.gold}, #B8860B)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={18} color={T.navy} />
          </div>
          <div>
            <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
            <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>{title}</span>
            <p className="hidden sm:block" style={{ color: T.textDim, fontSize: 10, lineHeight: 1 }}>{subtitle}</p>
          </div>
        </div>

        {/* ── Tabs (centered) ── */}
        {tabs && tabs.length > 0 ? (
          <div className="flex gap-1 flex-1 justify-center overflow-x-auto scrollbar-hide" style={{ minWidth: 0 }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: activeTab === tab.id ? `${T.gold}18` : 'transparent',
                  border: activeTab === tab.id ? `1px solid ${T.goldBorder}` : '1px solid transparent',
                  color: activeTab === tab.id ? T.gold : T.textSec,
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'all 200ms',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          /* spacer when no tabs */
          <div className="flex-1" />
        )}

        {/* ── Actions slot ── */}
        {actions && (
          <div className="hidden sm:flex items-center gap-8 flex-shrink-0">
            {actions}
          </div>
        )}

        {/* ── Utilities: clock, bell, spinner ── */}
        <div className="hidden sm:flex items-center gap-16 flex-shrink-0">
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: '#6B7280',
              letterSpacing: '0.02em',
            }}
          >
            <LiveClock />
          </span>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={18} color={T.textSec} />
            <div
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: T.danger,
              }}
            />
          </div>
          {loading && (
            <div
              style={{
                width: 14,
                height: 14,
                border: `2px solid ${T.gold}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
