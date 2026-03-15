import { useState, useCallback, useRef } from 'react';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

export type ActionState = 'idle' | 'loading' | 'done';

/**
 * Hook for action buttons: idle → loading (1s spinner) → done (success state).
 * Persists 'done' for the session.
 */
export function useActionButton(key?: string) {
  const [state, setState] = useState<ActionState>('idle');

  const trigger = useCallback((onComplete?: () => void) => {
    if (state !== 'idle') return;
    setState('loading');
    setTimeout(() => {
      setState('done');
      onComplete?.();
    }, 1000);
  }, [state]);

  return { state, trigger, isDone: state === 'done', isLoading: state === 'loading' };
}

/**
 * GoldSpinner — small 16px spinning circle for loading state
 */
export function GoldSpinner({ size = 16, color = '#D4A843' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ animation: 'tbosActionSpin 0.8s linear infinite' }}>
      <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
      <style>{`@keyframes tbosActionSpin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

/**
 * Styles for the 3 button states
 */
export function getActionBtnStyle(
  state: ActionState,
  variant: 'gold' | 'red' | 'goldOutline' | 'green' | 'whatsapp' = 'gold',
): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 6,
    cursor: state === 'idle' ? 'pointer' : 'default',
    transition: 'all 200ms',
    border: 'none',
    pointerEvents: state === 'idle' ? 'auto' : 'none',
    opacity: state === 'done' ? 0.7 : 1,
  };

  if (state === 'done') {
    return {
      ...base,
      background: 'rgba(34,197,94,0.15)',
      color: '#22C55E',
      border: '1px solid rgba(34,197,94,0.3)',
    };
  }

  if (state === 'loading') {
    return {
      ...base,
      background: variant === 'red' ? '#EF4444' : variant === 'whatsapp' ? '#25D366' : variant === 'goldOutline' ? 'transparent' : '#D4A843',
      color: variant === 'goldOutline' ? '#D4A843' : variant === 'gold' ? '#0F1629' : '#fff',
    };
  }

  // idle
  switch (variant) {
    case 'red':
      return { ...base, background: '#EF4444', color: '#fff' };
    case 'goldOutline':
      return { ...base, background: 'transparent', color: '#D4A843', border: '1px solid #D4A843' };
    case 'green':
      return { ...base, background: '#22C55E', color: '#fff' };
    case 'whatsapp':
      return { ...base, background: '#25D366', color: '#fff' };
    default:
      return { ...base, background: '#D4A843', color: '#0F1629' };
  }
}

/**
 * Hook for sequential button triggering (Approuver Tout pattern)
 */
export function useSequentialActions(count: number, delayMs = 100) {
  const [masterState, setMasterState] = useState<ActionState>('idle');
  const [itemStates, setItemStates] = useState<ActionState[]>(Array(count).fill('idle'));
  const triggersRef = useRef<((onComplete?: () => void) => void)[]>([]);

  const registerTrigger = useCallback((index: number, triggerFn: (onComplete?: () => void) => void) => {
    triggersRef.current[index] = triggerFn;
  }, []);

  const triggerAll = useCallback(() => {
    if (masterState !== 'idle') return;
    setMasterState('loading');
    
    let completed = 0;
    triggersRef.current.forEach((trigger, i) => {
      setTimeout(() => {
        trigger?.(() => {
          completed++;
          setItemStates(prev => {
            const next = [...prev];
            next[i] = 'done';
            return next;
          });
          if (completed >= count) {
            setMasterState('done');
          }
        });
      }, i * delayMs);
    });
  }, [masterState, count, delayMs]);

  return { masterState, itemStates, triggerAll, registerTrigger };
}
