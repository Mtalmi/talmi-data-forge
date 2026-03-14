import React, { useState, useEffect, useRef } from 'react';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

// ─── Animated counter ───
function AnimCounter({ target, duration = 2000, decimals = 0, prefix = '', suffix = '' }: {
  target: number; duration?: number; decimals?: number; prefix?: string; suffix?: string;
}) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setVal(parseFloat((eased * target).toFixed(decimals)));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, decimals]);
  return <>{prefix}{decimals > 0 ? val.toFixed(decimals) : val.toLocaleString('fr-FR')}{suffix}</>;
}

// ─── Mini Sparkline ───
function MiniSparkline({ data, color, width = 50, height = 16 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${2 + (i / (data.length - 1)) * (width - 4)},${2 + (1 - (v - min) / range) * (height - 4)}`).join(' ');
  return <svg width={width} height={height}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// ─── Shared styles ───
const sectionTitle = (label: string, borderColor = '#D4A843') => (
  <div style={{ borderTop: `2px solid ${borderColor}`, paddingTop: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontFamily: MONO, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600 }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.4), transparent 80%)' }} />
    <span style={{ fontFamily: MONO, fontSize: 10, color: '#D4A843', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(212,168,67,0.06)' }}>Généré par IA · Claude Opus</span>
  </div>
);

const descLine = (text: string) => (
  <p style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>{text}</p>
);

const kpiCard = (label: string, value: React.ReactNode, sub: string, color: string, glow = false) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderTop: `2px solid ${color}`, borderRadius: 10, padding: '16px 14px', flex: 1,
  }}>
    <p style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{label}</p>
    <p style={{ fontFamily: MONO, fontSize: 42, fontWeight: 100, color, lineHeight: 1, letterSpacing: '-0.02em', textShadow: glow ? `0 0 15px ${color}50` : 'none' }}>{value}</p>
    <p style={{ fontFamily: MONO, fontSize: 11, color: color === '#EF4444' ? '#EF4444' : '#9CA3AF', marginTop: 6 }}>{sub}</p>
  </div>
);

const thStyle: React.CSSProperties = { fontFamily: MONO, fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '12px 8px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '12px 8px', verticalAlign: 'middle' };

const recBox = (borderColor: string, bg: string, children: React.ReactNode) => (
  <div style={{ borderLeft: `3px solid ${borderColor}`, background: bg, padding: '12px 16px', borderRadius: '0 8px 8px 0', marginTop: 16 }}>
    <p style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', lineHeight: 1.8 }}>{children}</p>
  </div>
);

// ─── MAIN COMPONENT ───
export function SurveillanceIATab() {
  const [hovRow1, setHovRow1] = useState<number | null>(null);
  const [hovRow2, setHovRow2] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <style>{`
        @keyframes survPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.4} }
      `}</style>

      {/* ── HEADER ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontFamily: MONO, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600 }}>✦ CENTRE DE SURVEILLANCE INTELLIGENT</span>
        </div>
        <p style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF' }}>
          <span style={{ color: '#22C55E' }}>4 agents actifs</span> · Surveillance <span style={{ color: '#EF4444' }}>24/7</span> · Claude Opus
        </p>
      </div>

      {/* ── SUMMARY STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>ANOMALIES DÉTECTÉES</p>
          <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 100, color: '#EF4444' }}><AnimCounter target={3} /></p>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>ÉCART STOCK TOTAL</p>
          <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 100, color: '#EF4444' }}>-4,850 kg</p>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>PERTE ESTIMÉE</p>
          <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 100, color: '#EF4444', textShadow: '0 0 15px rgba(239,68,68,0.3)' }}>127K MAD/an</p>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>MOUVEMENTS SUSPECTS</p>
          <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 100, color: '#F59E0B' }}><AnimCounter target={2} /></p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          AGENT 1 — DÉTECTEUR D'ANOMALIES DE CONSOMMATION
         ══════════════════════════════════════════════ */}
      <div>
        {sectionTitle('✦ AGENT IA: DÉTECTEUR D\'ANOMALIES DE CONSOMMATION', '#EF4444')}
        {descLine('Compare la consommation réelle vs consommation théorique basée sur les recettes de production')}

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          {kpiCard('ÉCART MOYEN JOURNALIER', <><AnimCounter target={8.3} decimals={1} suffix="%" prefix="+" /></>, 'au-dessus de la norme', '#EF4444')}
          {kpiCard('MATÉRIAU LE PLUS IMPACTÉ', <span style={{ fontSize: 28, fontWeight: 500 }}>Ciment</span>, '+12% surconsommation', '#EF4444')}
          {kpiCard('COÛT ANOMALIES / MOIS', <><AnimCounter target={38400} suffix=" MAD" /></>, 'perte directe estimée', '#EF4444', true)}
        </div>

        <div style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(212,168,67,0.12)' }}>
                {['MATÉRIAU', 'BATCHES PRODUITS', 'CONSO. THÉORIQUE', 'CONSO. RÉELLE', 'ÉCART', 'STATUT'].map(h => (
                  <th key={h} style={{ ...thStyle, textAlign: h === 'ÉCART' || h === 'STATUT' ? 'center' : h.includes('CONSO') ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { mat: 'Ciment', batches: '14 batches', theo: '4,900 kg', reel: '5,488 kg', ecart: '+588 kg (+12%)', ecartColor: '#EF4444', reelColor: '#EF4444', status: '🔴 ANOMALIE', statusColor: '#EF4444', rowBg: 'rgba(239,68,68,0.04)', pulse: true },
                { mat: 'Adjuvant', batches: '14 batches', theo: '35 L', reel: '41 L', ecart: '+6 L (+17%)', ecartColor: '#EF4444', reelColor: '#F59E0B', status: '🔴 ANOMALIE', statusColor: '#EF4444', rowBg: 'rgba(239,68,68,0.04)', pulse: true },
                { mat: 'Sable', batches: '14 batches', theo: '11,200 kg', reel: '11,760 kg', ecart: '+560 kg (+5%)', ecartColor: '#F59E0B', reelColor: '#F59E0B', status: '⚠ ÉLEVÉ', statusColor: '#F59E0B', rowBg: 'transparent', pulse: false },
                { mat: 'Gravette', batches: '14 batches', theo: '14,700 kg', reel: '14,994 kg', ecart: '+294 kg (+2%)', ecartColor: '#9CA3AF', reelColor: '#fff', status: '✓ NORMAL', statusColor: '#22C55E', rowBg: 'transparent', pulse: false },
                { mat: 'Eau', batches: '14 batches', theo: '2,450 L', reel: '2,475 L', ecart: '+25 L (+1%)', ecartColor: '#9CA3AF', reelColor: '#fff', status: '✓ NORMAL', statusColor: '#22C55E', rowBg: 'transparent', pulse: false },
              ].map((r, i) => (
                <tr key={r.mat}
                  onMouseEnter={() => setHovRow1(i)} onMouseLeave={() => setHovRow1(null)}
                  style={{ background: hovRow1 === i ? 'rgba(212,168,67,0.03)' : r.rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                >
                  <td style={tdStyle}><span style={{ fontFamily: MONO, fontSize: 13, color: '#fff', fontWeight: 500 }}>{r.mat}</span></td>
                  <td style={tdStyle}><span style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF' }}>{r.batches}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}><span style={{ fontFamily: MONO, fontSize: 13, color: '#D4A843' }}>{r.theo}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}><span style={{ fontFamily: MONO, fontSize: 13, color: r.reelColor, fontWeight: 600 }}>{r.reel}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><span style={{ fontFamily: MONO, fontSize: 13, color: r.ecartColor, fontWeight: 600 }}>{r.ecart}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, color: r.statusColor, background: `${r.statusColor}1A`, border: `1px solid ${r.statusColor}40`, animation: r.pulse ? 'tbos-pulse 2s infinite' : 'none', display: 'inline-block', whiteSpace: 'nowrap' }}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recBox('#EF4444', 'rgba(239,68,68,0.04)', <>
          <span style={{ color: '#EF4444', fontWeight: 600 }}>Anomalie critique :</span> Ciment et Adjuvant présentent des écarts de consommation de <span style={{ fontFamily: MONO, color: '#D4A843' }}>+12%</span> et <span style={{ fontFamily: MONO, color: '#D4A843' }}>+17%</span> respectivement, bien au-delà de la tolérance de <span style={{ fontFamily: MONO, color: '#D4A843' }}>±3%</span>. Ces écarts ne sont pas expliqués par les conditions météo ni les ajustements de recette. Investigation recommandée : vérifier calibration doseur ciment, contrôler les mouvements manuels d'adjuvant, croiser avec les heures de présence opérateurs.
        </>)}
      </div>

      {/* ══════════════════════════════════════════════
          AGENT 2 — SURVEILLANCE DES ÉCARTS STOCK
         ══════════════════════════════════════════════ */}
      <div>
        {sectionTitle('✦ AGENT IA: SURVEILLANCE DES ÉCARTS STOCK', '#EF4444')}
        {descLine('Vérifie les écarts entre le stock physique attendu et le stock système')}

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          {kpiCard('ÉCART TOTAL', '-4,850 kg', 'manque à l\'inventaire', '#EF4444')}
          {kpiCard('VALEUR PERDUE', <><AnimCounter target={218} suffix="K MAD" /></>, 'sur la période', '#EF4444', true)}
          {kpiCard('FRÉQUENCE', '3x/sem', 'écarts récurrents', '#F59E0B')}
        </div>

        <div style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(212,168,67,0.12)' }}>
                {['MATÉRIAU', 'STOCK SYSTÈME', 'STOCK PHYSIQUE ESTIMÉ', 'ÉCART', 'TENDANCE 30J', 'ALERTE'].map(h => (
                  <th key={h} style={{ ...thStyle, textAlign: h === 'ÉCART' || h === 'ALERTE' || h === 'TENDANCE 30J' ? 'center' : h.includes('STOCK') ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { mat: 'Ciment', sys: '42,000 kg', phys: '38,150 kg', physColor: '#EF4444', ecart: '-3,850 kg', ecartColor: '#EF4444', trend: '↓ croissant', trendColor: '#EF4444', sparkData: [0, -500, -1200, -2000, -2800, -3500, -3850], status: '🔴 CRITIQUE', statusColor: '#EF4444', pulse: true },
                { mat: 'Adjuvant', sys: '200 L', phys: '172 L', physColor: '#EF4444', ecart: '-28 L', ecartColor: '#EF4444', trend: '↓ croissant', trendColor: '#EF4444', sparkData: [0, -5, -10, -15, -20, -25, -28], status: '🔴 CRITIQUE', statusColor: '#EF4444', pulse: true },
                { mat: 'Sable', sys: '120,000 m³', phys: '119,028 m³', physColor: '#fff', ecart: '-972 m³', ecartColor: '#F59E0B', trend: '→ stable', trendColor: '#F59E0B', sparkData: [-900, -950, -960, -970, -980, -975, -972], status: '⚠ MODÉRÉ', statusColor: '#F59E0B', pulse: false },
                { mat: 'Gravette', sys: '85,000 m³', phys: '85,000 m³', physColor: '#fff', ecart: '0', ecartColor: '#22C55E', trend: '→ stable', trendColor: '#9CA3AF', sparkData: [0, 0, 0, 0, 0, 0, 0], status: '✓ OK', statusColor: '#22C55E', pulse: false },
                { mat: 'Eau', sys: '15,000 L', phys: '15,000 L', physColor: '#fff', ecart: '0', ecartColor: '#22C55E', trend: '→ stable', trendColor: '#9CA3AF', sparkData: [0, 0, 0, 0, 0, 0, 0], status: '✓ OK', statusColor: '#22C55E', pulse: false },
              ].map((r, i) => (
                <tr key={r.mat}
                  onMouseEnter={() => setHovRow2(i)} onMouseLeave={() => setHovRow2(null)}
                  style={{ background: hovRow2 === i ? 'rgba(212,168,67,0.03)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                >
                  <td style={tdStyle}><span style={{ fontFamily: MONO, fontSize: 13, color: '#fff', fontWeight: 500 }}>{r.mat}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}><span style={{ fontFamily: MONO, fontSize: 13, color: '#D4A843' }}>{r.sys}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}><span style={{ fontFamily: MONO, fontSize: 13, color: r.physColor, fontWeight: 600 }}>{r.phys}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><span style={{ fontFamily: MONO, fontSize: 13, color: r.ecartColor, fontWeight: 600 }}>{r.ecart}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <MiniSparkline data={r.sparkData} color={r.trendColor} />
                      <span style={{ fontFamily: MONO, fontSize: 11, color: r.trendColor }}>{r.trend}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, color: r.statusColor, background: `${r.statusColor}1A`, border: `1px solid ${r.statusColor}40`, animation: r.pulse ? 'tbos-pulse 2s infinite' : 'none', display: 'inline-block', whiteSpace: 'nowrap' }}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recBox('#EF4444', 'rgba(239,68,68,0.04)', <>
          <span style={{ color: '#EF4444', fontWeight: 600 }}>Pertes récurrentes</span> sur Ciment (<span style={{ fontFamily: MONO, color: '#D4A843' }}>-3,850 kg</span>) et Adjuvant (<span style={{ fontFamily: MONO, color: '#D4A843' }}>-28 L</span>). La tendance est croissante sur 30 jours — les écarts augmentent chaque semaine. Recommandation : audit physique immédiat, installation de capteurs de niveau sur silos ciment, verrouillage de l'accès au stockage adjuvant avec badge nominatif.
        </>)}
      </div>

      {/* ══════════════════════════════════════════════
          AGENT 3 — ANALYSE DES MOUVEMENTS SUSPECTS
         ══════════════════════════════════════════════ */}
      <div>
        {sectionTitle('✦ AGENT IA: ANALYSE DES MOUVEMENTS SUSPECTS', '#F59E0B')}
        {descLine('Détecte les patterns de mouvements de stock inhabituels par horaire, volume et opérateur')}

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          {kpiCard('MOUVEMENTS SUSPECTS', <><AnimCounter target={2} /></>, 'derniers 14 jours', '#F59E0B')}
          {kpiCard('PÉRIODE LA PLUS ACTIVE', <span style={{ fontSize: 28, fontWeight: 500 }}>22h-5h</span>, <span style={{ color: '#EF4444' }}>hors heures de production</span> as any, '#EF4444')}
          {kpiCard('OPÉRATEUR À VÉRIFIER', <span style={{ fontSize: 28, fontWeight: 500 }}>ID-07</span>, '3 ajustements en 7 jours', '#F59E0B')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Card 1 */}
          <div style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)', borderLeft: '3px solid #EF4444', borderRadius: 10, padding: '16px 18px' }}>
            <p style={{ fontFamily: MONO, fontSize: 13, color: '#EF4444', fontWeight: 600, marginBottom: 8 }}>12 mars · 23:45</p>
            <p style={{ fontFamily: MONO, fontSize: 14, color: '#fff', marginBottom: 6 }}>Ajustement manuel: Ciment -800 kg</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>Opérateur: ID-07 · Motif déclaré: 'Correction inventaire'</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: '#EF4444', marginBottom: 4 }}>⚠ Aucune production en cours à cette heure</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: '#F59E0B' }}>Fréquence opérateur: 3ème ajustement négatif en 7 jours</p>
          </div>
          {/* Card 2 */}
          <div style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.15)', borderLeft: '3px solid #F59E0B', borderRadius: 10, padding: '16px 18px' }}>
            <p style={{ fontFamily: MONO, fontSize: 13, color: '#F59E0B', fontWeight: 600, marginBottom: 8 }}>10 mars · 02:15</p>
            <p style={{ fontFamily: MONO, fontSize: 14, color: '#fff', marginBottom: 6 }}>Sortie stock: Adjuvant -15 L</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>Opérateur: ID-07 · Motif: 'Test qualité'</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: '#F59E0B' }}>⚠ Aucun test qualité programmé cette nuit</p>
          </div>
        </div>

        {recBox('#F59E0B', 'rgba(245,158,11,0.04)', <>
          <span style={{ color: '#F59E0B', fontWeight: 600 }}>Pattern suspect identifié :</span> Opérateur ID-07 effectue des ajustements négatifs récurrents hors heures de production (22h-5h). 3 incidents en 7 jours totalisant <span style={{ fontFamily: MONO, color: '#D4A843' }}>-800 kg</span> ciment et <span style={{ fontFamily: MONO, color: '#D4A843' }}>-15 L</span> adjuvant. Recommandation : convocation entretien, revue des accès badge, activation caméra silo zone ciment pour les 14 prochains jours.
        </>)}
      </div>

      {/* ══════════════════════════════════════════════
          AGENT 4 — CORRÉLATION PRODUCTION-STOCK
         ══════════════════════════════════════════════ */}
      <div>
        {sectionTitle('✦ AGENT IA: CORRÉLATION PRODUCTION-STOCK', '#D4A843')}
        {descLine('Croise les données de production avec les mouvements de stock pour identifier les écarts inexpliqués')}

        {/* Scatter plot */}
        <div style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          {(() => {
            const w = 600, h = 300, pad = 50;
            // Expected correlation line points
            const expected = [[2, 700], [4, 1400], [6, 2100], [8, 2800], [10, 3500], [12, 4200], [14, 4900]];
            // Actual data - most on line, 3 outliers above
            const actual = [
              [2, 720, false], [4, 1450, false], [6, 2150, false], [8, 3200, true],
              [10, 3600, false], [11, 4400, true], [14, 5488, true],
            ];
            const maxX = 16, maxY = 6000;
            const sx = (v: number) => pad + (v / maxX) * (w - pad * 2);
            const sy = (v: number) => h - pad - (v / maxY) * (h - pad * 2);

            const expectedPath = expected.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${sx(x)},${sy(y)}`).join(' ');

            return (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width={w} height={h}>
                  {/* Grid */}
                  {[0, 1000, 2000, 3000, 4000, 5000, 6000].map(v => (
                    <g key={v}>
                      <line x1={pad} x2={w - pad} y1={sy(v)} y2={sy(v)} stroke="rgba(212,168,67,0.06)" strokeWidth="1" />
                      <text x={pad - 8} y={sy(v) + 4} textAnchor="end" fill="#64748B" fontSize="9" fontFamily={MONO}>{(v / 1000).toFixed(0)}k</text>
                    </g>
                  ))}
                  {[0, 2, 4, 6, 8, 10, 12, 14].map(v => (
                    <text key={v} x={sx(v)} y={h - pad + 18} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily={MONO}>{v}</text>
                  ))}
                  {/* Axis labels */}
                  <text x={w / 2} y={h - 5} textAnchor="middle" fill="#9CA3AF" fontSize="10" fontFamily={MONO}>Production (batches)</text>
                  <text x={12} y={h / 2} textAnchor="middle" fill="#9CA3AF" fontSize="10" fontFamily={MONO} transform={`rotate(-90, 12, ${h / 2})`}>Consommation (kg)</text>
                  {/* Expected line */}
                  <path d={expectedPath} fill="none" stroke="#D4A843" strokeWidth="2" strokeDasharray="6 3" opacity="0.5" />
                  {/* Actual dots */}
                  {actual.map(([x, y, outlier], i) => (
                    <circle key={i} cx={sx(x as number)} cy={sy(y as number)} r={outlier ? 6 : 4}
                      fill={outlier ? '#EF4444' : '#D4A843'}
                      stroke={outlier ? '#EF4444' : '#D4A843'}
                      strokeWidth={outlier ? 2 : 1}
                      opacity={outlier ? 1 : 0.7}
                      style={outlier ? { animation: 'tbos-pulse 2s infinite' } : {}}
                    />
                  ))}
                  {/* Legend */}
                  <circle cx={w - pad - 120} cy={16} r={4} fill="#D4A843" />
                  <text x={w - pad - 112} y={20} fill="#9CA3AF" fontSize="9" fontFamily={MONO}>Corrélation attendue</text>
                  <circle cx={w - pad - 120} cy={32} r={5} fill="#EF4444" />
                  <text x={w - pad - 112} y={36} fill="#9CA3AF" fontSize="9" fontFamily={MONO}>Écart inexpliqué</text>
                </svg>
              </div>
            );
          })()}

          <p style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', lineHeight: 1.8, marginTop: 16 }}>
            Sur 14 jours analysés, <span style={{ color: '#EF4444', fontWeight: 600 }}>3 journées</span> présentent des écarts de consommation inexpliqués. Les écarts se concentrent sur les shifts de nuit (22h-6h). Corrélation production-consommation : <span style={{ fontFamily: MONO, color: '#EF4444', fontWeight: 600 }}>0.87</span> (attendu : <span style={{ fontFamily: MONO, color: '#22C55E' }}>&gt;0.95</span>).
          </p>
        </div>

        {recBox('#D4A843', 'rgba(212,168,67,0.04)', <>
          Les données confirment une <span style={{ color: '#EF4444', fontWeight: 600 }}>anomalie structurelle</span> : la consommation dépasse systématiquement la production lors des shifts de nuit. Perte estimée : <span style={{ fontFamily: MONO, color: '#EF4444', textShadow: '0 0 10px rgba(239,68,68,0.3)' }}>127,000 MAD/an</span>. Actions recommandées : (1) Audit croisé production-stock sur 30 jours, (2) Double signature pour ajustements manuels &gt;500 kg, (3) Alerte automatique si écart &gt;5% sur un shift.
        </>)}

        {/* Confidentiel badge */}
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: MONO, fontSize: 10, padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(212,168,67,0.06)' }}>
            <span style={{ color: '#D4A843' }}>Généré par IA · Claude Opus</span> · <span style={{ color: '#EF4444' }}>Confidentiel</span>
          </span>
        </div>
      </div>
    </div>
  );
}
