import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Plus } from 'lucide-react';

const M = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

const PLANTS = [
  { id: 'ma', name: 'Atlas Concrete Morocco', location: 'Casablanca', live: true, stats: '14 mars · 671 m³ · 14 batches · Score 87/100' },
  { id: 'eu', name: 'EuroBeton München', location: 'Allemagne', live: false, stats: 'Demo · données simulées' },
  { id: 'us', name: 'Liberty Ready-Mix', location: 'Houston, TX', live: false, stats: 'Demo · données simulées' },
];

export function PlantSelector() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('ma');
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const current = PLANTS.find(p => p.id === active)!;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="hidden md:flex items-center gap-2 transition-colors duration-200"
        style={{ fontFamily: M, fontSize: 12, color: '#FFFFFF', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <Building2 size={14} strokeWidth={1.5} style={{ color: '#D4A843', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{current.name}</span>
          <span style={{ fontFamily: M, fontSize: 9, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
            {current.stats.split('·').map((part, i) => {
              const trimmed = part.trim();
              const isGold = trimmed.includes('m³') || trimmed.includes('Score');
              return (
                <span key={i}>
                  {i > 0 && <span> · </span>}
                  <span style={isGold ? { color: '#D4A843', fontWeight: 600 } : {}}>{trimmed}</span>
                </span>
              );
            })}
          </span>
        </div>
        <ChevronDown size={12} style={{ color: '#9CA3AF', flexShrink: 0, transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 200,
          background: '#1A2332', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: 320, overflow: 'hidden',
        }}>
          {PLANTS.map(plant => {
            const isActive = plant.id === active;
            const isHovered = hovered === plant.id;
            return (
              <div key={plant.id} style={{ position: 'relative' }}
                onMouseEnter={() => setHovered(plant.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <button
                  onClick={() => { setActive(plant.id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isActive ? 'rgba(212,168,67,0.08)' : 'transparent',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.05)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2">
                      {isActive && <span style={{ fontFamily: M, fontSize: 11, color: '#D4A843' }}>✓</span>}
                      <span style={{ fontFamily: M, fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? '#D4A843' : '#FFFFFF' }}>
                        {plant.name}
                      </span>
                      <span style={{ fontFamily: M, fontSize: 10, color: '#9CA3AF' }}>· {plant.location}</span>
                    </div>
                    <div style={{ fontFamily: M, fontSize: 9, color: '#9CA3AF', marginTop: 2, marginLeft: isActive ? 19 : 0 }}>{plant.stats}</div>
                  </div>
                  {plant.live ? (
                    <span style={{ fontFamily: M, fontSize: 9, fontWeight: 600, color: '#22C55E', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>● LIVE</span>
                  ) : (
                    <span style={{ fontFamily: M, fontSize: 9, fontWeight: 600, color: '#6B7280', background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', borderRadius: 4, padding: '2px 6px' }}>Demo</span>
                  )}
                  {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A843', flexShrink: 0 }} />}
                </button>

                {/* Demo tooltip */}
                {!plant.live && isHovered && (
                  <div style={{
                    position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8,
                    background: '#1A2332', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 8,
                    padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    fontFamily: M, fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', zIndex: 210,
                    maxWidth: 300,
                  }}>
                    Mode démo — données simulées pour présentation.<br />
                    Connectez une centrale réelle pour activer.
                  </div>
                )}
              </div>
            );
          })}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(212,168,67,0.1)', margin: '2px 0' }} />

          {/* Add plant */}
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 14px', border: 'none', cursor: 'pointer',
              background: 'transparent', transition: 'background 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <Plus size={12} style={{ color: '#D4A843' }} />
            <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, color: '#D4A843' }}>Ajouter une centrale</span>
          </button>
        </div>
      )}
    </div>
  );
}
