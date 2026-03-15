import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const NAV_SHORTCUTS = [
  { keys: 'G → D', label: 'Tableau de Bord' },
  { keys: 'G → P', label: 'Production' },
  { keys: 'G → V', label: 'Ventes' },
  { keys: 'G → C', label: 'Clients' },
  { keys: 'G → S', label: 'Stocks' },
  { keys: 'G → L', label: 'Laboratoire' },
  { keys: 'G → T', label: 'Logistique' },
  { keys: 'G → B', label: 'Bons de Commande' },
  { keys: 'G → R', label: 'Créances' },
];

const ACTION_SHORTCUTS = [
  { keys: '⌘K', label: 'Recherche / Palette' },
  { keys: 'N → D', label: 'Nouveau Devis' },
  { keys: 'N → T', label: 'Nouveau Test' },
  { keys: 'N → B', label: 'Nouveau Bon' },
  { keys: '1 2 3 4', label: 'Changer d\'onglet' },
  { keys: 'Escape', label: 'Fermer modal' },
  { keys: '?', label: 'Cette aide' },
];

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

export function ShortcutsHelpModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(prev => !prev);
    document.addEventListener('tbos-show-shortcuts-help', handler);
    return () => document.removeEventListener('tbos-show-shortcuts-help', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
    };
    document.addEventListener('keydown', esc, true);
    return () => document.removeEventListener('keydown', esc, true);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            data-tbos-modal
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed left-1/2 top-[12%] z-[201] -translate-x-1/2 w-[calc(100vw-2rem)] max-w-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Raccourcis clavier"
          >
            <div style={{
              background: '#0F1629',
              border: '1px solid rgba(212,168,67,0.15)',
              borderRadius: 12,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(212,168,67,0.1)' }}>
                <h2 style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '2px', fontWeight: 700, color: '#D4A843', textTransform: 'uppercase' }}>
                  RACCOURCIS CLAVIER
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="p-1 rounded-md transition-colors"
                  style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body — two columns */}
              <div className="grid grid-cols-2 gap-6 px-6 py-5">
                {/* Navigation */}
                <div>
                  <h3 style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '1.5px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10 }}>
                    NAVIGATION
                  </h3>
                  <div className="space-y-2">
                    {NAV_SHORTCUTS.map(s => (
                      <ShortcutRow key={s.keys} keys={s.keys} label={s.label} />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h3 style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '1.5px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10 }}>
                    ACTIONS
                  </h3>
                  <div className="space-y-2">
                    {ACTION_SHORTCUTS.map(s => (
                      <ShortcutRow key={s.keys} keys={s.keys} label={s.label} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(212,168,67,0.06)' }}>
                <button
                  onClick={() => { setOpen(false); setTimeout(() => window.dispatchEvent(new Event('tbos-start-tour')), 300); }}
                  style={{ fontFamily: MONO, fontSize: 10, color: '#D4A843', background: 'transparent', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
                >
                  🎯 Visite Guidée
                </button>
                <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(156,163,175,0.5)' }}>
                  Appuyez sur <kbd style={{ padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.08)', color: '#D4A843', fontSize: 10 }}>?</kbd> pour afficher/masquer cette aide
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      <kbd style={{
        fontFamily: MONO,
        fontSize: 10,
        padding: '2px 6px',
        borderRadius: 4,
        border: '1px solid rgba(212,168,67,0.2)',
        background: 'rgba(212,168,67,0.08)',
        color: '#D4A843',
        whiteSpace: 'nowrap',
      }}>
        {keys}
      </kbd>
    </div>
  );
}
