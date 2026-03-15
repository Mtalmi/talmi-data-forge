import { useState, useRef, useEffect } from 'react';
import { useUnits, UnitSystem } from './UnitContext';

const M = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

const OPTIONS: { id: UnitSystem; flag: string; label: string; units: string }[] = [
  { id: 'mena', flag: '🇲🇦', label: 'Métrique MENA', units: 'm³, kg, L, °C, MPa, DH, km' },
  { id: 'eu',   flag: '🇪🇺', label: 'Métrique EU',   units: 'm³, kg, L, °C, MPa, EUR, km' },
  { id: 'us',   flag: '🇺🇸', label: 'Impérial US',   units: 'yd³, lb, gal, °F, PSI, USD, mi' },
];

export function UnitSwitcher() {
  const { system, setSystem, config } = useUnits();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = OPTIONS.find(o => o.id === system)!;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 transition-colors duration-200"
        style={{
          fontFamily: M, fontSize: 12, color: '#9CA3AF', background: 'transparent',
          border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
      >
        <span>{current.flag}</span>
        <span style={{
          fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: '0.5px',
          color: '#D4A843', border: '1px solid #D4A843',
          borderRadius: 4, padding: '1px 5px', background: 'transparent',
        }}>
          {config.badge}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          width: 240, background: '#1A2332',
          border: '1px solid rgba(212,168,67,0.15)', borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100,
          overflow: 'hidden',
        }}>
          {OPTIONS.map((opt) => {
            const active = opt.id === system;
            return (
              <button
                key={opt.id}
                onClick={() => { setSystem(opt.id); setOpen(false); }}
                className="w-full flex items-center gap-3 transition-colors duration-150"
                style={{
                  padding: '10px 14px', border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(212,168,67,0.08)' : 'transparent',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.05)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 16 }}>{opt.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: M, fontSize: 12, color: active ? '#D4A843' : '#FFFFFF', fontWeight: active ? 600 : 400 }}>
                      {opt.label}
                    </span>
                    {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A843', flexShrink: 0 }} />}
                  </div>
                  <span style={{ fontFamily: M, fontSize: 9, color: '#9CA3AF' }}>{opt.units}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
