import { useState } from 'react';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

interface SystemStatus {
  name: string;
  status: 'green' | 'amber' | 'red';
  detail: string;
}

const SYSTEMS: SystemStatus[] = [
  { name: 'Supabase', status: 'green', detail: 'Connecté · 23ms' },
  { name: 'n8n Cloud', status: 'green', detail: 'Connecté · 145ms' },
  { name: 'Claude Opus', status: 'green', detail: 'Actif · 24 agents' },
  { name: 'GPS Flotte', status: 'green', detail: '3 véhicules actifs' },
  { name: 'WhatsApp', status: 'green', detail: 'Connecté' },
  { name: 'ONEE (Eau)', status: 'amber', detail: 'API inactive' },
];

const DOT_COLORS = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' };
const TEXT_COLORS = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' };

export function SystemHealthBar() {
  const [hover, setHover] = useState(false);

  const greenCount = SYSTEMS.filter(s => s.status === 'green').length;
  const amberCount = SYSTEMS.filter(s => s.status === 'amber').length;
  const redCount = SYSTEMS.filter(s => s.status === 'red').length;
  const total = SYSTEMS.length;

  // Build gradient segments
  const segments: string[] = [];
  let pos = 0;
  const addSeg = (count: number, color: string) => {
    if (count === 0) return;
    const pct = (count / total) * 100;
    segments.push(`${color} ${pos}% ${pos + pct}%`);
    pos += pct;
  };
  addSeg(greenCount, '#22C55E');
  addSeg(amberCount, '#F59E0B');
  addSeg(redCount, '#EF4444');
  const barBg = segments.length > 1
    ? `linear-gradient(90deg, ${segments.join(', ')})`
    : segments.length === 1
      ? (amberCount > 0 ? '#F59E0B' : redCount > 0 ? '#EF4444' : '#22C55E')
      : '#22C55E';

  return (
    <div
      className="relative w-full shrink-0"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: 'default' }}
    >
      {/* Status bar */}
      <div style={{ width: '100%', height: 3, background: barBg }} />

      {/* Tooltip panel */}
      {hover && (
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: 8,
            width: 260,
            background: '#1A2332',
            border: '1px solid rgba(212, 168, 67, 0.2)',
            borderRadius: 8,
            padding: '12px 14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 100,
          }}
        >
          <div style={{
            fontFamily: MONO, fontSize: 11, fontWeight: 600,
            letterSpacing: '1.5px', color: '#D4A843', marginBottom: 10,
          }}>
            ÉTAT DU SYSTÈME
          </div>
          {SYSTEMS.map((sys) => (
            <div key={sys.name} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: DOT_COLORS[sys.status],
                boxShadow: `0 0 6px ${DOT_COLORS[sys.status]}80`,
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: '#FFFFFF', minWidth: 80 }}>
                {sys.name}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: TEXT_COLORS[sys.status], marginLeft: 'auto' }}>
                {sys.detail}
              </span>
            </div>
          ))}
          {/* Last sync */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 4, paddingTop: 6,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF', flexShrink: 0 }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF' }}>Dernière sync</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', marginLeft: 'auto' }}>Il y a 12 sec</span>
          </div>
        </div>
      )}
    </div>
  );
}
