import { useState } from 'react';
import { CheckCheck } from 'lucide-react';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

/**
 * "Valider Passation" button with idle → loading → done state transition.
 * Shows timestamp and validator name on completion.
 */
export function PassationButton({ shiftInfo }: { shiftInfo?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleClick = () => {
    if (state !== 'idle') return;
    setState('loading');
    setTimeout(() => setState('done'), 1000);
  };

  const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20, paddingTop: 16, borderTop: state === 'done' ? '2px solid #22C55E' : '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleClick}
            onMouseDown={e => { if (state === 'idle') (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            disabled={state !== 'idle'}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px',
              background: state === 'done' ? 'rgba(34,197,94,0.15)' : state === 'loading' ? '#D4A843' : '#D4A843',
              border: state === 'done' ? '1px solid rgba(34,197,94,0.3)' : 'none',
              borderRadius: 9,
              color: state === 'done' ? '#22C55E' : '#0F1629',
              fontWeight: 700, fontSize: 12,
              cursor: state === 'idle' ? 'pointer' : 'default',
              fontFamily: 'DM Sans, sans-serif',
              opacity: state === 'done' ? 0.7 : 1,
              transition: 'all 200ms',
              pointerEvents: state === 'idle' ? 'auto' : 'none',
            }}
          >
            {state === 'loading' ? (
              <svg width="14" height="14" viewBox="0 0 16 16" style={{ animation: 'tbosActionSpin 0.8s linear infinite' }}>
                <circle cx="8" cy="8" r="6" fill="none" stroke="#0F1629" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
              </svg>
            ) : (
              <><CheckCheck size={13} /> {state === 'done' ? '✓ Passation Validée' : 'Valider Passation'}</>
            )}
          </button>
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#D4A843', padding: '4px 8px', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 4, background: 'rgba(212,168,67,0.06)' }}>
            Généré par IA · Claude Opus
          </span>
        </div>
        {shiftInfo && (
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF' }}>{shiftInfo}</span>
        )}
      </div>
      {state === 'done' && (
        <p style={{ fontFamily: MONO, fontSize: 11, color: '#22C55E', opacity: 0.8, margin: 0 }}>
          Validée à {now} par Max Talmi
        </p>
      )}
      <style>{`@keyframes tbosActionSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
