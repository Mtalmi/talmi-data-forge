import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

export function LanguageSwitcher({ variant = 'compact' }: { variant?: 'compact' | 'full'; className?: string }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [arHover, setArHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const items = [
    { code: 'fr' as const, flag: '🇫🇷', label: 'Français', active: true },
    { code: 'ar' as const, flag: '🇲🇦', label: 'العربية', active: false, badge: 'Bientôt', tooltip: 'Support RTL arabe — disponible Q2 2026' },
  ];

  const current = items.find(i => i.code === lang) ?? items[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px',
          background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)',
          borderRadius: 6, color: '#F59E0B', cursor: 'pointer', fontFamily: MONO, fontSize: 12, fontWeight: 600,
        }}
        aria-label="Switch language"
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{current.flag}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 200,
          background: '#1A2332', border: '1px solid rgba(212, 168, 67, 0.15)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.3)', padding: 4,
          minWidth: 200,
        }}>
          {items.map(item => (
            <div
              key={item.code}
              style={{ position: 'relative' }}
              onMouseEnter={() => item.code === 'ar' && setArHover(true)}
              onMouseLeave={() => item.code === 'ar' && setArHover(false)}
            >
              <button
                onClick={() => { if (item.active) { setLang(item.code); setOpen(false); } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '8px 16px', fontFamily: MONO, fontSize: 12, borderRadius: 6,
                  background: 'transparent', border: 'none', cursor: item.active ? 'pointer' : 'default',
                  color: item.active ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(212, 168, 67, 0.08)'; }}
                onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 16 }}>{item.flag}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.active && lang === item.code && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D4A843', flexShrink: 0 }} />
                )}
                {item.badge && (
                  <span style={{
                    background: 'rgba(212, 168, 67, 0.15)', color: '#D4A843',
                    fontSize: 9, fontFamily: MONO, borderRadius: 4, padding: '2px 6px', fontWeight: 600,
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Tooltip for Arabic */}
              {item.tooltip && arHover && (
                <div style={{
                  position: 'absolute', bottom: '100%', right: 0, marginBottom: 6,
                  background: '#1A2332', color: '#FFFFFF', fontFamily: MONO, fontSize: 11,
                  padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(212, 168, 67, 0.15)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', zIndex: 210,
                }}>
                  {item.tooltip}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
