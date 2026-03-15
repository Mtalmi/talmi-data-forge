import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { startTour } from './GuidedTour';

const MN = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
const STORAGE_KEY = 'tbos_onboarded';

const FEATURES = [
  { emoji: '🧠', title: '24 Agents IA', desc: 'Surveillance continue de votre production, qualité, logistique et finances' },
  { emoji: '🌍', title: 'Multi-Marchés', desc: 'MENA, Europe, États-Unis — unités, normes et devises adaptées' },
  { emoji: '📊', title: 'Temps Réel', desc: 'Données live, alertes prédictives, briefings automatiques' },
  { emoji: '⌨️', title: 'Power User', desc: 'Raccourcis clavier (⌘K recherche, G+D navigation) et commandes vocales' },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show on first visit only
    const onboarded = localStorage.getItem(STORAGE_KEY);
    if (!onboarded) {
      // Delay slightly so splash finishes
      const t = setTimeout(() => setOpen(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleTour = () => {
    close();
    // Small delay so modal closes first
    setTimeout(() => startTour(), 400);
  };

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 300ms ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        style={{
          width: 700, maxWidth: '90vw',
          background: '#0F1629',
          border: '1px solid rgba(212,168,67,0.2)',
          borderRadius: 16,
          padding: '40px 48px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(212,168,67,0.1)',
          animation: 'scaleIn 300ms ease-out',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #D4A843 0%, #B8860B 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(212,168,67,0.3), 0 0 40px rgba(212,168,67,0.15)',
              marginBottom: 16,
            }}
          >
            <span style={{ fontFamily: MN, fontSize: 24, fontWeight: 700, color: '#0B1120' }}>T</span>
          </div>
          <h2 style={{ fontFamily: MN, fontSize: 20, fontWeight: 600, color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>
            Bienvenue sur TBOS Suite
          </h2>
          <p style={{ fontFamily: MN, fontSize: 13, color: '#9CA3AF', textAlign: 'center', maxWidth: 480, lineHeight: 1.6 }}>
            Votre tableau de bord opérationnel stratégique, propulsé par l'intelligence artificielle
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {FEATURES.map(f => (
            <div
              key={f.title}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '16px 18px',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: 18 }}>{f.emoji}</span>
                <span style={{ fontFamily: MN, fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{f.title}</span>
              </div>
              <p style={{ fontFamily: MN, fontSize: 11, color: '#9CA3AF', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleTour}
            style={{
              fontFamily: MN, fontSize: 13, fontWeight: 600,
              background: '#D4A843', color: '#0F1629',
              border: 'none', borderRadius: 8, padding: '12px 28px',
              cursor: 'pointer', transition: 'all 200ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E0B84E'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#D4A843'; }}
          >
            Commencer la visite guidée
          </button>
          <button
            onClick={close}
            style={{
              fontFamily: MN, fontSize: 13, fontWeight: 600,
              background: 'transparent', color: '#D4A843',
              border: '1px solid rgba(212,168,67,0.4)', borderRadius: 8, padding: '12px 28px',
              cursor: 'pointer', transition: 'all 200ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            Explorer librement
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}
