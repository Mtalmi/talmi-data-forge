import React from 'react';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

interface CountdownItem {
  name: string;
  days: number;
  status: 'CRITIQUE' | 'BAS' | 'MODÉRÉ';
  consumptionSpeed: number; // 1-3, affects stripe animation speed
}

const ITEMS: CountdownItem[] = [
  { name: 'Eau', days: 6.0, status: 'CRITIQUE', consumptionSpeed: 3 },
  { name: 'Sable', days: 6.5, status: 'BAS', consumptionSpeed: 2 },
  { name: 'Adjuvant', days: 6.7, status: 'CRITIQUE', consumptionSpeed: 3 },
  { name: 'Gravette', days: 7.1, status: 'BAS', consumptionSpeed: 1.5 },
  { name: 'Ciment', days: 7.5, status: 'MODÉRÉ', consumptionSpeed: 1 },
];

const statusColor: Record<string, string> = {
  CRITIQUE: '#EF4444',
  BAS: '#F59E0B',
  'MODÉRÉ': '#D4A843',
};

const statusBg: Record<string, string> = {
  CRITIQUE: 'rgba(239,68,68,0.12)',
  BAS: 'rgba(245,158,11,0.12)',
  'MODÉRÉ': 'rgba(212,168,67,0.12)',
};

function formatDaysHours(days: number) {
  const d = Math.floor(days);
  const h = Math.round((days - d) * 24);
  return `${d}j ${h}h`;
}

export function StockoutCountdownTimeline() {
  const critiqueCount = ITEMS.filter(i => i.days < 7).length;

  return (
    <div>
      <style>{`
        @keyframes stripeMove {
          from { background-position: 0 0; }
          to { background-position: -40px 0; }
        }
        @keyframes countdownPulse {
          0%,100% { box-shadow: 0 0 4px rgba(239,68,68,0.2); }
          50% { box-shadow: 0 0 16px rgba(239,68,68,0.5); }
        }
      `}</style>

      <div style={{ borderTop: '2px solid #EF4444', paddingTop: 12, marginBottom: 16 }}>
        <span style={{ fontFamily: MONO, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600 }}>
          ✦ COUNTDOWN AVANT RUPTURE
        </span>
      </div>

      <div style={{
        background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
        border: '1px solid rgba(212,168,67,0.15)',
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ITEMS.map((item) => {
            const color = statusColor[item.status];
            const pct = Math.min((item.days / 10) * 100, 100);
            const isCritique = item.status === 'CRITIQUE';
            const animDuration = 4 / item.consumptionSpeed;

            return (
              <div key={item.name} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px 80px', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: '#fff', fontWeight: 500 }}>{item.name}</span>

                <div style={{
                  height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.03)',
                  overflow: 'hidden', position: 'relative',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 4,
                    background: `repeating-linear-gradient(
                      45deg,
                      ${color},
                      ${color} 6px,
                      rgba(0,0,0,0.15) 6px,
                      rgba(0,0,0,0.15) 12px
                    )`,
                    backgroundSize: '40px 40px',
                    animation: `stripeMove ${animDuration}s linear infinite${isCritique ? ', countdownPulse 2s ease-in-out infinite' : ''}`,
                    transition: 'width 800ms ease-out',
                  }} />
                </div>

                <span style={{
                  fontFamily: MONO, fontSize: 13, fontWeight: 600, color, textAlign: 'right',
                }}>
                  {formatDaysHours(item.days)}
                </span>

                <span style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 999, textAlign: 'center',
                  color, background: statusBg[item.status],
                  border: `1px solid ${color}`,
                  animation: isCritique ? 'tbos-pulse 2s infinite' : 'none',
                }}>
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(212,168,67,0.1)' }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
            ⚠ <span style={{ color: '#EF4444', fontWeight: 600 }}>{critiqueCount} matériaux</span> en zone critique (
            <span style={{ color: '#EF4444', fontWeight: 600 }}>&lt; 7 jours</span>). Commandes urgentes recommandées.
          </p>
        </div>
      </div>
    </div>
  );
}
