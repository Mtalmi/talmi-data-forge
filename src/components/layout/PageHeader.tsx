import { ReactNode, useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

/* ── Live clock (monospace, gray) ── */
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
  badge?: string | number;
}

/* ── Props ── */
export interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tabs?: PageTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  actions?: ReactNode;
  loading?: boolean;
}

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
    <>
      {/* ── Sticky page header ── */}
      <div
        data-seamless-header
        style={{
          position: 'sticky',
          top: 56,
          zIndex: 20,
          padding: '0 16px',
          background: '#0F1629',
        }}
      >
        <div
          style={{
            width: '100%',
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
                background: 'linear-gradient(135deg, #D4A843, #B8860B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={18} color="#0B1120" />
            </div>
            <div>
              <span style={{ fontFamily: MONO, color: '#94A3B8', fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600, fontSize: 18 }}>{title}</span>
              <p className="hidden sm:block" style={{ fontFamily: MONO, color: '#9CA3AF', fontSize: 13 }}>{subtitle}</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* ── Actions slot ── */}
          {actions && (
            <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
              {actions}
            </div>
          )}

          {/* ── Utilities: clock + spinner ── */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: '#9CA3AF',
                letterSpacing: '0.5px',
              }}
            >
              <LiveClock />
            </span>
            {loading && (
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid #D4A843',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky tab bar ── */}
      {tabs && tabs.length > 0 && (
        <div
          style={{
            position: 'sticky',
            top: 116,
            zIndex: 19,
            background: '#0F1629',
            borderBottom: '1px solid rgba(212, 168, 67, 0.06)',
            padding: '0 16px',
          }}
        >
          <div className="flex overflow-x-auto scrollbar-hide" style={{ gap: 32 }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className="flex items-center gap-2"
                style={{
                  padding: '10px 0',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #D4A843' : '2px solid transparent',
                  color: activeTab === tab.id ? '#D4A843' : '#9CA3AF',
                  fontFamily: MONO,
                  fontWeight: 400,
                  fontSize: 12,
                  letterSpacing: '1.5px',
                  transition: 'all 200ms ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      background: 'rgba(212, 168, 67, 0.2)',
                      color: '#D4A843',
                      borderRadius: 10,
                      padding: '2px 6px',
                      lineHeight: 1,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
