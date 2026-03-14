import React, { useState, useMemo } from 'react';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

const goldOutlineBtn: React.CSSProperties = {
  border: '1px solid #D4A843', color: '#D4A843', background: 'transparent',
  borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
  fontSize: 13, fontFamily: MONO, fontWeight: 500,
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const goldFilledBtn: React.CSSProperties = {
  background: '#D4A843', color: '#0F1629', border: 'none',
  borderRadius: 8, padding: '8px 24px', cursor: 'pointer',
  fontSize: 14, fontWeight: 600, fontFamily: MONO,
};

interface FormulaImpact {
  name: string;
  baseMargin: number;
  cimentWeight: number; // how much ciment price change affects margin (pts per %)
}

const FORMULAS: FormulaImpact[] = [
  { name: 'F-B25', baseMargin: 37, cimentWeight: 0.533 },
  { name: 'F-B30', baseMargin: 38, cimentWeight: 0.583 },
  { name: 'F-B20', baseMargin: 39, cimentWeight: 0.483 },
];

export function CostImpactSimulator() {
  const [sliderValue, setSliderValue] = useState(6);

  const impacts = useMemo(() => {
    return FORMULAS.map(f => {
      const delta = -(sliderValue * f.cimentWeight);
      const newMargin = f.baseMargin + delta;
      return { ...f, newMargin: Math.round(newMargin * 10) / 10, delta: Math.round(delta * 10) / 10 };
    });
  }, [sliderValue]);

  const valueColor = sliderValue > 0 ? '#F59E0B' : sliderValue < 0 ? '#22C55E' : '#9CA3AF';

  return (
    <div>
      <div style={{ borderTop: '2px solid #D4A843', paddingTop: 12, marginBottom: 16 }}>
        <span style={{ fontFamily: MONO, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600 }}>
          ✦ SIMULATEUR D'IMPACT COÛTS
        </span>
      </div>

      <div style={{
        background: 'rgba(212,168,67,0.02)',
        border: '1px solid rgba(212,168,67,0.15)',
        borderRadius: 12, padding: 24,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* LEFT — Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <label style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
              Si le prix du ciment varie de :
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: MONO, fontSize: 28, color: valueColor, fontWeight: 600, transition: 'color 300ms' }}>
                {sliderValue > 0 ? '+' : ''}{sliderValue}%
              </span>
              <input
                type="range"
                min={-20}
                max={20}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: 6,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: `linear-gradient(to right, #22C55E 0%, #D4A843 50%, #EF4444 100%)`,
                  borderRadius: 3,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
              <style>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 16px; height: 16px; border-radius: 50%;
                  background: #D4A843; border: 2px solid #0F1629;
                  box-shadow: 0 0 8px rgba(212,168,67,0.4);
                  cursor: pointer;
                }
                input[type="range"]::-moz-range-thumb {
                  width: 16px; height: 16px; border-radius: 50%;
                  background: #D4A843; border: 2px solid #0F1629;
                  box-shadow: 0 0 8px rgba(212,168,67,0.4);
                  cursor: pointer;
                }
              `}</style>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontFamily: MONO, fontSize: 10, color: '#64748B' }}>
                <span>-20%</span>
                <span>0%</span>
                <span>+20%</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Impact cards */}
          <div>
            <p style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
              IMPACT SUR LES MARGES
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {impacts.map((f) => {
                const deltaColor = f.delta >= 0 ? '#22C55E' : '#EF4444';
                const newColor = f.newMargin >= f.baseMargin ? '#22C55E' : f.newMargin >= f.baseMargin - 3 ? '#F59E0B' : '#EF4444';
                return (
                  <div key={f.name} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8, padding: '10px 14px',
                    display: 'grid', gridTemplateColumns: '60px 1fr 1fr 80px', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: '#fff' }}>{f.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: '#22C55E' }}>
                      Actuelle: {f.baseMargin}%
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: newColor, transition: 'color 300ms' }}>
                      Nouvelle: {f.newMargin}%
                    </span>
                    <span style={{
                      fontFamily: MONO, fontSize: 13, fontWeight: 700, color: deltaColor,
                      textAlign: 'right', transition: 'color 300ms',
                    }}>
                      Δ {f.delta > 0 ? '+' : ''}{f.delta} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div style={{
          marginTop: 20, borderLeft: '3px solid #D4A843',
          padding: '10px 16px', background: 'rgba(212,168,67,0.03)',
          borderRadius: '0 8px 8px 0',
        }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
            <span style={{ color: '#D4A843', fontWeight: 600 }}>Recommandation :</span>{' '}
            Si la tendance se confirme, ajuster les prix de vente de <span style={{ color: '#D4A843', fontWeight: 600 }}>+4%</span> sur F-B25/F-B30 pour maintenir les marges cibles.
            Impact revenus : <span style={{ color: '#D4A843', fontWeight: 600 }}>+18,200 MAD/mois</span>.
          </p>
        </div>

        {/* Footer: badge + buttons */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: MONO, fontSize: 10, color: '#D4A843',
            padding: '3px 10px', borderRadius: 999,
            border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(212,168,67,0.06)',
          }}>
            Généré par IA · Claude Opus
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setSliderValue(0)} style={goldOutlineBtn}>Réinitialiser</button>
            <button style={goldFilledBtn}>Appliquer Simulation</button>
          </div>
        </div>
      </div>
    </div>
  );
}
