import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const M = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
const GOLD = '#D4A843';
const RED = '#EF4444';
const AMBER = '#F59E0B';
const GREEN = '#22C55E';
const GRAY = '#9CA3AF';
const WHITE = '#FFFFFF';

const Badge = () => (
  <span style={{ fontFamily: M, fontSize: 9, color: GOLD, background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
    ✨ Généré par IA · Claude Opus
  </span>
);

interface LineItem {
  text: string;
  color: string;
  bold?: boolean;
}

interface Scenario {
  title: string;
  borderColor: string;
  badge: string;
  badgeColor: string;
  lines: LineItem[];
  recommendation: string;
  recColor: string;
  hasSlider?: boolean;
  gauge?: { before: number; after: number; afterColor: string };
}

const SCENARIOS: Scenario[] = [
  {
    title: 'ET SI ON PERD SIGMA BÂTIMENT ?',
    borderColor: RED,
    badge: '−12% CA',
    badgeColor: RED,
    lines: [
      { text: 'Impact CA: −189K DH/an (−12% du portefeuille)', color: RED },
      { text: 'Impact volume: −96 m³/an', color: RED },
      { text: 'Créances à provisionner: 189K DH', color: RED },
      { text: 'Capacité libérée: réaffectable à 2 nouveaux clients', color: GRAY },
    ],
    recommendation: 'Le portefeuille survit. Prospecter LafargeHolcim et ONCF Projets (identifiés par Agent Détecteur Concentration, page Ventes) pour compenser. Temps de récupération estimé: 3 mois.',
    recColor: GREEN,
    gauge: { before: 84, after: 78, afterColor: AMBER },
  },
  {
    title: 'ET SI LE PRIX DU CIMENT AUGMENTE DE +15% ?',
    borderColor: AMBER,
    badge: '−284K DH',
    badgeColor: RED,
    lines: [
      { text: 'Impact marge F-B20: 39% → 34.2% (−4.8 pts)', color: AMBER },
      { text: 'Impact marge F-B25: 37% → 32.1% (−4.9 pts)', color: AMBER },
      { text: 'Impact marge F-B30: 35% → 29.8% (−5.2 pts) — SOUS SEUIL 30%', color: RED, bold: true },
      { text: 'Impact annuel: −284,000 DH de marge brute', color: RED },
    ],
    recommendation: 'Ajuster prix F-B30 de +6% et F-B25 de +4% immédiatement. Négocier contrat annuel ciment LafargeHolcim (−5% si engagement volume). Impact net après ajustement: −45,000 DH (absorbable).',
    recColor: GOLD,
    hasSlider: true,
  },
  {
    title: 'ET SI T-09 EST HORS SERVICE 30 JOURS ?',
    borderColor: AMBER,
    badge: '−42K DH/mois',
    badgeColor: RED,
    lines: [
      { text: 'Capacité flotte: −25% (3→2 toupies actives)', color: AMBER },
      { text: 'Livraisons max/jour: 8 → 6', color: AMBER },
      { text: 'Revenu perdu: −42,000 DH/mois', color: RED },
      { text: 'Maintenance prolongée: +18,000 DH coût pièces', color: RED },
    ],
    recommendation: 'Sous-traiter 2 livraisons/jour (coût 2,400 DH/jour). Location toupie temporaire: 8,000 DH/semaine. Option recommandée: sous-traitance ciblée jours de pic uniquement (mardi, mercredi). Coût: 4,800 DH/semaine vs 42,000 DH/mois de revenu protégé.',
    recColor: GOLD,
  },
];

function MiniGauge({ value, color }: { value: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  return (
    <svg width={44} height={44} viewBox="0 0 44 44">
      <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(212,168,67,0.1)" strokeWidth={3} />
      <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
      />
      <text x={22} y={24} textAnchor="middle" style={{ fontFamily: M, fontSize: 12, fontWeight: 200, fill: color }}>{value}</text>
    </svg>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const [open, setOpen] = useState(false);
  const [sliderVal, setSliderVal] = useState(15);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(212,168,67,0.08)',
        borderTop: `2px solid ${scenario.borderColor}`,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 200ms',
      }}
      onClick={() => setOpen(!open)}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,168,67,0.2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,168,67,0.08)'; }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: M, fontSize: 12, fontWeight: 600, color: WHITE, letterSpacing: '0.5px' }}>
            {scenario.title}
          </div>
        </div>
        <span style={{
          fontFamily: M, fontSize: 10, fontWeight: 600,
          color: scenario.badgeColor,
          background: `${scenario.badgeColor}15`,
          border: `1px solid ${scenario.badgeColor}40`,
          borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {scenario.badge}
        </span>
        {open ? <ChevronUp size={14} style={{ color: GRAY, flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: GRAY, flexShrink: 0 }} />}
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: '0 16px 16px' }} onClick={e => e.stopPropagation()}>
          {/* Lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {scenario.lines.map((line, i) => (
              <div key={i} style={{ fontFamily: M, fontSize: 11, color: line.color, lineHeight: 1.5, fontWeight: line.bold ? 700 : 400 }}>
                • {line.text}
              </div>
            ))}
          </div>

          {/* Slider for cement scenario */}
          {scenario.hasSlider && (
            <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(212,168,67,0.06)' }}>
              <div style={{ fontFamily: M, fontSize: 10, color: GRAY, marginBottom: 6 }}>
                Variation ciment: <span style={{ color: GOLD, fontWeight: 600 }}>{sliderVal > 0 ? '+' : ''}{sliderVal}%</span>
              </div>
              <input
                type="range"
                min={-20}
                max={30}
                value={sliderVal}
                onChange={e => setSliderVal(Number(e.target.value))}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', accentColor: GOLD, height: 4, cursor: 'pointer' }}
              />
              <div className="flex justify-between" style={{ fontFamily: M, fontSize: 9, color: GRAY, marginTop: 2 }}>
                <span>−20%</span><span>+30%</span>
              </div>
            </div>
          )}

          {/* Gauge */}
          {scenario.gauge && (
            <div className="flex items-center gap-3 mb-3" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(212,168,67,0.06)' }}>
              <span style={{ fontFamily: M, fontSize: 10, color: GRAY }}>Santé portefeuille:</span>
              <MiniGauge value={scenario.gauge.before} color={GOLD} />
              <span style={{ fontFamily: M, fontSize: 14, color: GRAY }}>→</span>
              <MiniGauge value={scenario.gauge.after} color={scenario.gauge.afterColor} />
            </div>
          )}

          {/* Recommendation */}
          <div style={{
            borderLeft: `3px solid ${scenario.recColor}`,
            background: `${scenario.recColor}08`,
            borderRadius: '0 6px 6px 0',
            padding: '10px 12px',
          }}>
            <div style={{ fontFamily: M, fontSize: 10, fontWeight: 600, color: scenario.recColor, marginBottom: 4, letterSpacing: '0.5px' }}>
              RECOMMANDATION
            </div>
            <p style={{ fontFamily: M, fontSize: 11, color: GRAY, lineHeight: 1.6, margin: 0 }}>
              {scenario.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ScenarioSimulator() {
  return (
    <div className="mt-8">
      {/* Header */}
      <div style={{
        borderTop: `2px solid ${GOLD}`,
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(212,168,67,0.08)',
        borderRadius: 10,
        padding: '20px 24px',
      }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span style={{ color: GOLD, fontSize: 14 }}>✦</span>
            <span style={{ fontFamily: M, fontSize: 13, fontWeight: 600, letterSpacing: '2px', color: GOLD }}>
              SIMULATEUR DE SCÉNARIOS
            </span>
            <span style={{
              fontFamily: M, fontSize: 9, color: GOLD,
              border: '1px solid rgba(212,168,67,0.3)',
              borderRadius: 4, padding: '2px 8px', fontWeight: 600,
            }}>
              Interactif
            </span>
          </div>
          <Badge />
        </div>

        {/* 3 scenario cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {SCENARIOS.map((s, i) => (
            <ScenarioCard key={i} scenario={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
