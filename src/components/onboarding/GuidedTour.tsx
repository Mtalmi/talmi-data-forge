import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const MN = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

export interface TourStep {
  selector: string; // data-tour="xxx" → [data-tour="xxx"]
  title: string;
  body: string;
  position?: 'right' | 'left' | 'bottom' | 'top';
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="sidebar"]',
    title: 'Navigation',
    body: 'Accédez à toutes les sections de votre centrale. Les badges rouges indiquent des actions requises.',
    position: 'right',
  },
  {
    selector: '[data-tour="search"]',
    title: 'Recherche Universelle',
    body: 'Tapez ⌘K pour rechercher clients, batches, factures, camions, ou lancer des actions rapides.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="plant-selector"]',
    title: 'Sélecteur de Centrale',
    body: 'Basculez entre vos centrales ou affichez des démonstrations EU/US.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="unit-switcher"]',
    title: "Système d'Unités",
    body: "Passez du métrique MENA au métrique EU ou à l'impérial US. Toutes les valeurs se convertissent automatiquement.",
    position: 'bottom',
  },
  {
    selector: '[data-tour="briefing"]',
    title: 'Briefing IA',
    body: "Chaque matin, Claude Opus synthétise l'état de votre centrale en un paragraphe. Production, qualité, logistique, finances — tout est résumé.",
    position: 'bottom',
  },
  {
    selector: '[data-tour="score-gauge"]',
    title: 'Score Opérationnel',
    body: 'Votre performance quotidienne sur 100, calculée en temps réel. Maintenez > 80 pour une série record.',
    position: 'left',
  },
  {
    selector: '[data-tour="kpi-cards"]',
    title: 'KPIs Cliquables',
    body: 'Chaque carte est un lien direct vers la page détaillée. Cliquez pour approfondir.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="shutdown-prediction"]',
    title: "Prédiction d'Arrêt",
    body: "L'IA croise vos stocks, commandes, météo et délais fournisseurs pour prédire les arrêts AVANT qu'ils arrivent. Cette fonctionnalité à elle seule peut économiser 85,000 DH/jour.",
    position: 'bottom',
  },
];

function getTooltipPos(rect: DOMRect, position: string) {
  const gap = 16;
  switch (position) {
    case 'right': return { top: rect.top + rect.height / 2, left: rect.right + gap, transform: 'translateY(-50%)' };
    case 'left': return { top: rect.top + rect.height / 2, left: rect.left - gap, transform: 'translate(-100%, -50%)' };
    case 'top': return { top: rect.top - gap, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' };
    default: return { top: rect.bottom + gap, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };
  }
}

function getArrowStyle(position: string): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute', width: 0, height: 0,
    borderStyle: 'solid',
  };
  switch (position) {
    case 'right': return { ...base, left: -8, top: '50%', transform: 'translateY(-50%)', borderWidth: '8px 8px 8px 0', borderColor: 'transparent #1A2332 transparent transparent' };
    case 'left': return { ...base, right: -8, top: '50%', transform: 'translateY(-50%)', borderWidth: '8px 0 8px 8px', borderColor: 'transparent transparent transparent #1A2332' };
    case 'top': return { ...base, bottom: -8, left: '50%', transform: 'translateX(-50%)', borderWidth: '8px 8px 0 8px', borderColor: '#1A2332 transparent transparent transparent' };
    default: return { ...base, top: -8, left: '50%', transform: 'translateX(-50%)', borderWidth: '0 8px 8px 8px', borderColor: 'transparent transparent #1A2332 transparent' };
  }
}

export function GuidedTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef(0);

  // Listen for tour start event
  useEffect(() => {
    const start = () => { setStep(0); setActive(true); };
    window.addEventListener('tbos-start-tour', start);
    return () => window.removeEventListener('tbos-start-tour', start);
  }, []);

  // Track highlighted element position
  useEffect(() => {
    if (!active) return;
    const currentStep = TOUR_STEPS[step];
    if (!currentStep) { setActive(false); return; }

    const updateRect = () => {
      const el = document.querySelector(currentStep.selector);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
      rafRef.current = requestAnimationFrame(updateRect);
    };
    updateRect();
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, step]);

  // Keyboard navigation
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setActive(false); return; }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (step < TOUR_STEPS.length - 1) setStep(s => s + 1);
        else setActive(false);
      }
      if (e.key === 'ArrowLeft' && step > 0) setStep(s => s - 1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, step]);

  // Scroll element into view
  useEffect(() => {
    if (!active) return;
    const el = document.querySelector(TOUR_STEPS[step]?.selector || '');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [active, step]);

  if (!active || !rect) return null;

  const currentStep = TOUR_STEPS[step];
  const pos = currentStep.position || 'bottom';
  const tooltipPos = getTooltipPos(rect, pos);
  const padding = 8;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
      {/* Overlay with hole — use clip-path */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          transition: 'clip-path 300ms ease',
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%,
            0% ${rect.top - padding}px,
            ${rect.left - padding}px ${rect.top - padding}px,
            ${rect.left - padding}px ${rect.bottom + padding}px,
            ${rect.right + padding}px ${rect.bottom + padding}px,
            ${rect.right + padding}px ${rect.top - padding}px,
            0% ${rect.top - padding}px
          )`,
        }}
        onClick={() => setActive(false)}
      />

      {/* Spotlight glow */}
      <div
        style={{
          position: 'fixed',
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          borderRadius: 8,
          boxShadow: '0 0 0 4px rgba(212,168,67,0.5), 0 0 20px rgba(212,168,67,0.2)',
          pointerEvents: 'none',
          transition: 'all 300ms ease',
        }}
      />

      {/* Tooltip */}
      <div
        style={{
          position: 'fixed',
          ...tooltipPos,
          background: '#1A2332',
          border: '1px solid rgba(212,168,67,0.3)',
          borderRadius: 10,
          padding: '16px 20px',
          maxWidth: 320,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 100000,
        }}
      >
        {/* Arrow */}
        <div style={getArrowStyle(pos)} />

        {/* Title */}
        <div style={{ fontFamily: MN, fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginBottom: 8 }}>
          {currentStep.title}
        </div>

        {/* Body */}
        <div style={{ fontFamily: MN, fontSize: 12, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 16 }}>
          {currentStep.body}
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-3">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 16 : 6, height: 6, borderRadius: 3,
              background: i === step ? '#D4A843' : 'rgba(212,168,67,0.2)',
              transition: 'all 200ms',
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActive(false)}
            style={{ fontFamily: MN, fontSize: 11, color: '#9CA3AF', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            Passer
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{ fontFamily: MN, fontSize: 11, color: '#D4A843', background: 'transparent', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}
              >
                ←
              </button>
            )}
            <button
              onClick={() => {
                if (step < TOUR_STEPS.length - 1) setStep(s => s + 1);
                else setActive(false);
              }}
              style={{
                fontFamily: MN, fontSize: 11, fontWeight: 600,
                background: '#D4A843', color: '#0F1629',
                border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer',
              }}
            >
              {step < TOUR_STEPS.length - 1 ? `Suivant (${step + 1}/${TOUR_STEPS.length})` : 'Terminer la visite ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function startTour() {
  window.dispatchEvent(new Event('tbos-start-tour'));
}
