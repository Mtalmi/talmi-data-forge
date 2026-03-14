import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BatchDetailDrawerProps {
  open: boolean;
  onClose: () => void;
}

const TIMELINE = [
  { time: '11:42', label: 'Commande reçue', done: true, active: false },
  { time: '11:45', label: 'Planification validée', done: true, active: false },
  { time: '11:55', label: 'Production lancée', done: true, active: true },
  { time: '-- : --', label: 'Chargement', done: false, active: false },
  { time: '-- : --', label: 'Livraison', done: false, active: false },
  { time: '-- : --', label: 'Test qualité', done: false, active: false },
];

const RECIPE = [
  { mat: 'Ciment', target: 350, actual: 348, unit: 'kg/m³', ok: true, delta: '' },
  { mat: 'Sable', target: 800, actual: 805, unit: 'kg/m³', ok: true, delta: '' },
  { mat: 'Gravette', target: 1050, actual: 1047, unit: 'kg/m³', ok: true, delta: '' },
  { mat: 'Eau', target: 175, actual: 178, unit: 'L/m³', ok: false, delta: '+1.7%' },
  { mat: 'Adjuvant', target: 2.5, actual: 2.5, unit: 'L/m³', ok: true, delta: '' },
];

const COSTS = [
  { label: 'Ciment', value: 280 },
  { label: 'Sable', value: 95 },
  { label: 'Gravette', value: 85 },
  { label: 'Eau', value: 12 },
  { label: 'Adjuvant', value: 18 },
  { label: "Main d'œuvre", value: 40 },
  { label: 'Transport', value: 20 },
];

export function BatchDetailDrawer({ open, onClose }: BatchDetailDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sectionBorder = '1px solid rgba(255,255,255,0.06)';
  const goldColor = '#D4A843';
  const mono = 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace';

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
          animation: 'bddFadeIn 200ms ease-out',
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 680, zIndex: 9999,
          background: '#0F1629', borderLeft: '1px solid rgba(212,168,67,0.3)',
          display: 'flex', flexDirection: 'column',
          animation: 'bddSlideIn 300ms ease',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ padding: '24px 28px 20px', borderBottom: sectionBorder }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: mono, fontSize: 20, fontWeight: 600, color: goldColor }}>
                #403-066
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#34d399',
                background: 'rgba(52,211,153,0.12)', padding: '3px 10px',
                borderRadius: 999, border: '1px solid rgba(52,211,153,0.25)',
              }}>
                En Production
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)', padding: 4,
                transition: 'color 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>Ciments & Béton du Sud</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              F-B25 · 8 m³ · Chantier: Bd Zerktouni, Casablanca
            </p>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 24px' }}>

          {/* TIMELINE */}
          <div style={{ padding: '20px 0', borderBottom: sectionBorder }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 16 }}>
              Timeline
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 8 }}>
              {TIMELINE.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: i < TIMELINE.length - 1 ? 20 : 0 }}>
                  {/* Vertical line */}
                  {i < TIMELINE.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 5, top: 14, bottom: 0, width: 1,
                      background: step.done ? 'rgba(212,168,67,0.3)' : 'rgba(255,255,255,0.06)',
                    }} />
                  )}
                  {/* Dot */}
                  <div style={{
                    width: 11, height: 11, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    background: step.active ? goldColor : step.done ? goldColor : 'rgba(255,255,255,0.1)',
                    border: step.active ? `2px solid ${goldColor}` : step.done ? `2px solid ${goldColor}` : '2px solid rgba(255,255,255,0.15)',
                    boxShadow: step.active ? `0 0 10px rgba(212,168,67,0.5)` : 'none',
                    animation: step.active ? 'bddPulse 2s ease-in-out infinite' : 'none',
                  }} />
                  {/* Content */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <span style={{
                      fontFamily: mono, fontSize: 12, fontWeight: 400, minWidth: 50,
                      color: step.done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                    }}>
                      {step.time}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: step.active ? 600 : 400,
                      color: step.done ? '#fff' : 'rgba(255,255,255,0.3)',
                    }}>
                      {step.label}
                    </span>
                    {step.done && !step.active && (
                      <span style={{ color: '#34d399', fontSize: 12 }}>✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RECIPE VS TARGET */}
          <div style={{ padding: '20px 0', borderBottom: sectionBorder }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 12 }}>
              Recette vs Cible
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '0', fontSize: 12 }}>
              {/* Header */}
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, paddingBottom: 8 }}>Matériau</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, paddingBottom: 8, textAlign: 'center' }}>Cible</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, paddingBottom: 8, textAlign: 'center' }}>Réel</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, paddingBottom: 8, textAlign: 'right' }}>Statut</span>
              {RECIPE.map((r, i) => (
                <div key={i} className="contents">
                  <span style={{ color: 'rgba(255,255,255,0.7)', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{r.mat}</span>
                  <span style={{ fontFamily: mono, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{r.target}</span>
                  <span style={{ fontFamily: mono, color: '#fff', fontWeight: 500, textAlign: 'center', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{r.actual}</span>
                  <span style={{ textAlign: 'right', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {r.ok ? (
                      <span style={{ color: '#34d399', fontSize: 11 }}>✓</span>
                    ) : (
                      <span style={{ color: '#FBBF24', fontSize: 11 }}>⚠ {r.delta}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TRANSPORT */}
          <div style={{ padding: '20px 0', borderBottom: sectionBorder }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 12 }}>
              Transport
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Toupie', value: 'TOU-02' },
                { label: 'Chauffeur', value: 'Youssef Amrani' },
                { label: 'Distance', value: '14 km' },
                { label: 'Temps estimé', value: '28 min' },
              ].map(t => (
                <div key={t.label}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{t.label}</p>
                  <p style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{t.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* COST WATERFALL */}
          <div style={{ padding: '20px 0' }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 12 }}>
              Décomposition Coût
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {COSTS.map(c => (
                <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{c.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, color: '#fff', fontWeight: 400 }}>{c.value} DH</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(212,168,67,0.3)', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Total</span>
                <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#fff' }}>550 DH/m³</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Prix de vente</span>
                <span style={{ fontFamily: mono, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>780 DH/m³</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>Marge</span>
                <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#34d399' }}>230 DH/m³ (42%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ padding: '16px 28px', borderTop: sectionBorder, display: 'flex', gap: 12 }}>
          <button style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
            border: '1px solid #D4A843', color: '#D4A843', background: 'transparent',
            fontWeight: 600, fontSize: 13, transition: 'all 200ms',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Voir Contrôle Qualité
          </button>
          <button style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
            border: '1px solid #D4A843', color: '#D4A843', background: 'transparent',
            fontWeight: 600, fontSize: 13, transition: 'all 200ms',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Contacter Client
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bddSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes bddFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bddPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(212,168,67,0.3); }
          50% { box-shadow: 0 0 14px rgba(212,168,67,0.7); }
        }
      `}</style>
    </>,
    document.body
  );
}
