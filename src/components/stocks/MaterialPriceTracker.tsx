import React, { useState } from 'react';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

interface PriceItem {
  name: string;
  price: string;
  pctChange: number;
  sparkline: number[];
}

const ITEMS: PriceItem[] = [
  { name: 'Ciment', price: '450 DH/t', pctChange: 6, sparkline: [420, 425, 430, 428, 435, 442, 450] },
  { name: 'Sable', price: '120 DH/m³', pctChange: 0, sparkline: [120, 119, 121, 120, 120, 121, 120] },
  { name: 'Gravette', price: '95 DH/m³', pctChange: 1, sparkline: [93, 93, 94, 94, 94, 95, 95] },
  { name: 'Adjuvant', price: '85 DH/L', pctChange: 12, sparkline: [72, 73, 74, 76, 78, 82, 85] },
  { name: 'Eau', price: '8 DH/m³', pctChange: 0, sparkline: [8, 8, 8, 8, 8, 8, 8] },
];

function MiniSparkline({ data, color, width = 60, height = 30 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return (
    <svg width={width} height={height}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MaterialPriceTracker() {
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  return (
    <div>
      <div style={{ borderTop: '2px solid #D4A843', paddingTop: 12, marginBottom: 16 }}>
        <span style={{ fontFamily: MONO, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600 }}>
          ✦ ÉVOLUTION DES PRIX MATIÈRES
        </span>
      </div>

      <div style={{
        background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
        border: '1px solid rgba(212,168,67,0.15)',
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {ITEMS.map((item, i) => {
            const isUp = item.pctChange > 5;
            const isStable = item.pctChange <= 1;
            const trendColor = isUp ? '#EF4444' : isStable ? '#9CA3AF' : '#22C55E';
            const trendArrow = item.pctChange > 1 ? '↑' : item.pctChange < 0 ? '↓' : '→';
            const trendLabel = item.pctChange === 0 ? '0%' : `${item.pctChange > 0 ? '+' : ''}${item.pctChange}%`;
            const sparkColor = isUp ? '#EF4444' : '#D4A843';
            const hov = hovIdx === i;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setHovIdx(i)}
                onMouseLeave={() => setHovIdx(null)}
                style={{
                  borderTop: `2px solid ${isUp ? '#EF4444' : '#D4A843'}`,
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderTopWidth: 2,
                  borderTopColor: isUp ? '#EF4444' : '#D4A843',
                  borderRadius: 10,
                  padding: 12,
                  background: hov ? 'rgba(212,168,67,0.03)' : 'transparent',
                  transform: hov ? 'translateY(-1px)' : 'translateY(0)',
                  transition: 'all 200ms',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 13, color: '#fff', fontWeight: 500 }}>{item.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 18, color: '#D4A843', fontWeight: 600 }}>{item.price}</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 12, fontWeight: 600, color: trendColor,
                    padding: '2px 6px', borderRadius: 4,
                    background: isUp ? 'rgba(239,68,68,0.1)' : 'transparent',
                  }}>
                    {trendArrow} {trendLabel}
                  </span>
                  <MiniSparkline data={item.sparkline} color={sparkColor} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(212,168,67,0.1)' }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
            Alerte : Ciment (<span style={{ color: '#EF4444' }}>+6%</span>) et Adjuvant (<span style={{ color: '#EF4444' }}>+12%</span>) en hausse significative.
            Impact estimé sur marge brute : <span style={{ color: '#EF4444', fontWeight: 600 }}>-2.3 points</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
