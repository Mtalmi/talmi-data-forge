import { useState, useEffect } from 'react';
import { Lock, Shield, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticSuccess } from '@/lib/haptics';

interface VaultSubmitButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

type SubmitState = 'idle' | 'securing' | 'locking' | 'complete';

/**
 * Vault Submit Button - High-security authorization animation
 * Shows "Securing Transaction..." with a golden progress bar
 */
export function VaultSubmitButton({ 
  onClick, 
  disabled, 
  children = 'Autoriser',
  className 
}: VaultSubmitButtonProps) {
  const [state, setState] = useState<SubmitState>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (state === 'securing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 60) {
            clearInterval(interval);
            setState('locking');
            return 60;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    } else if (state === 'locking') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setState('complete');
            hapticSuccess();
            return 100;
          }
          return prev + 4;
        });
      }, 25);
      return () => clearInterval(interval);
    }
  }, [state]);

  const handleClick = async () => {
    if (disabled || state !== 'idle') return;
    
    setState('securing');
    setProgress(0);
    
    try {
      await onClick();
    } catch (error) {
      setState('idle');
      setProgress(0);
      throw error;
    }
  };

  const stateLabels = {
    idle: children,
    securing: 'Sécurisation...',
    locking: 'Verrouillage...',
    complete: 'Autorisé ✓',
  };

  const StateIcon = {
    idle: Lock,
    securing: Shield,
    locking: Lock,
    complete: CheckCircle2,
  }[state];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || state !== 'idle'}
      className={cn(
        'relative w-full overflow-hidden rounded-xl',
        'px-6 py-4 font-bold text-base tracking-wide',
        'transition-all duration-500 ease-out',
        'flex items-center justify-center gap-3',
        disabled ? [
          'bg-muted/30 text-muted-foreground cursor-not-allowed',
          'border border-border/30',
        ] : state === 'idle' ? [
          'bg-gradient-to-r from-primary to-primary/80',
          'text-primary-foreground',
          'border border-primary/50',
          'shadow-[0_0_40px_hsl(var(--primary)/0.3)]',
          'hover:shadow-[0_0_60px_hsl(var(--primary)/0.5)]',
          'hover:scale-[1.02]',
          'active:scale-[0.98]',
        ] : state === 'complete' ? [
          'bg-gradient-to-r from-success to-success/80',
          'text-success-foreground',
          'border border-success/50',
          'shadow-[0_0_40px_hsl(var(--success)/0.4)]',
        ] : [
          'bg-background',
          'text-foreground',
          'border border-primary/40',
        ],
        className
      )}
    >
      {/* Progress Bar Background */}
      {(state === 'securing' || state === 'locking') && (
        <div className="absolute inset-0 bg-background">
          {/* Progress Fill */}
          <div 
            className={cn(
              'absolute inset-y-0 left-0 transition-all duration-100',
              state === 'securing' 
                ? 'bg-gradient-to-r from-primary/30 to-primary/20' 
                : 'bg-gradient-to-r from-primary/50 to-primary/30'
            )}
            style={{ width: `${progress}%` }}
          />
          {/* Golden Scan Line */}
          <div 
            className="absolute top-0 h-full w-1 bg-gradient-to-b from-transparent via-primary to-transparent opacity-60"
            style={{ 
              left: `${progress}%`,
              boxShadow: '0 0 20px hsl(var(--primary))'
            }}
          />
        </div>
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-3">
        <StateIcon className={cn(
          'h-5 w-5 transition-all duration-300',
          state === 'securing' && 'animate-pulse',
          state === 'locking' && 'animate-bounce',
          state === 'complete' && 'text-success-foreground'
        )} />
        <span>{stateLabels[state]}</span>
      </span>

      {/* Vault Lock Effect */}
      {state === 'complete' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      )}
    </button>
  );
}
