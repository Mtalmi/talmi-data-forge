import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Shield, Fingerprint, Check } from 'lucide-react';

interface BiometricScanOverlayProps {
  isActive: boolean;
  onComplete: () => void;
  duration?: number;
}

/**
 * BiometricScanOverlay - Cyber-scan authorization animation
 * Shows a 2-second biometric authorization with golden laser scanning
 */
export function BiometricScanOverlay({
  isActive,
  onComplete,
  duration = 2000,
}: BiometricScanOverlayProps) {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'authorized' | 'complete'>('idle');
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      setScanProgress(0);
      return;
    }

    // Start scanning
    setPhase('scanning');
    const startTime = Date.now();
    const scanDuration = duration * 0.7; // 70% for scanning

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / scanDuration) * 100, 100);
      setScanProgress(progress);

      if (progress >= 100) {
        clearInterval(progressInterval);
        setPhase('authorized');
        
        // Show authorized state briefly, then complete
        setTimeout(() => {
          setPhase('complete');
          onComplete();
        }, duration * 0.3);
      }
    }, 16);

    return () => clearInterval(progressInterval);
  }, [isActive, duration, onComplete]);

  if (!isActive && phase === 'idle') return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-background/95 backdrop-blur-md',
        'transition-opacity duration-300',
        phase === 'complete' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
    >
      {/* Scan lines background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Horizontal scan lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-px bg-primary/5"
            style={{ top: `${(i + 1) * 5}%` }}
          />
        ))}
        
        {/* Vertical scan lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full w-px bg-primary/5"
            style={{ left: `${(i + 1) * 5}%` }}
          />
        ))}
      </div>

      {/* Golden laser scan effect */}
      <div
        className={cn(
          'absolute left-0 right-0 h-1 transition-all duration-100',
          'bg-gradient-to-r from-transparent via-primary to-transparent',
          'shadow-[0_0_30px_hsl(51_100%_50%/0.5)]',
          phase === 'scanning' ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: `${scanProgress}%`,
        }}
      />

      {/* Central authorization panel */}
      <div className="relative z-10 text-center">
        {/* Fingerprint/Shield icon */}
        <div className={cn(
          'relative mx-auto mb-6 h-24 w-24 rounded-full',
          'flex items-center justify-center',
          'border-2 transition-all duration-500',
          phase === 'scanning' 
            ? 'border-primary/50 bg-primary/5 animate-pulse' 
            : phase === 'authorized'
              ? 'border-success bg-success/10 scale-110'
              : 'border-muted'
        )}>
          {/* Rotating ring */}
          <div className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent',
            'border-t-primary border-r-primary/50',
            phase === 'scanning' && 'animate-spin'
          )} />
          
          {/* Icon */}
          {phase === 'authorized' ? (
            <Check className="h-12 w-12 text-success animate-scale-in" />
          ) : (
            <Fingerprint className={cn(
              'h-12 w-12 transition-colors',
              phase === 'scanning' ? 'text-primary' : 'text-muted-foreground'
            )} />
          )}

          {/* Scanning glow rings */}
          {phase === 'scanning' && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="absolute -inset-4 rounded-full border border-primary/20 animate-pulse" />
              <div className="absolute -inset-8 rounded-full border border-primary/10" />
            </>
          )}
        </div>

        {/* Status text */}
        <div className="space-y-2">
          <h3 className={cn(
            'text-xl font-bold tracking-wider uppercase transition-all',
            phase === 'scanning' ? 'text-primary' : 
            phase === 'authorized' ? 'text-success' : 'text-foreground'
          )}>
            {phase === 'scanning' ? 'Autorisation Biométrique...' :
             phase === 'authorized' ? 'Autorisé' : 'Initialisation...'}
          </h3>
          
          {/* Progress bar */}
          <div className="mx-auto w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-100',
                phase === 'authorized' 
                  ? 'bg-success' 
                  : 'bg-gradient-to-r from-primary via-primary to-accent'
              )}
              style={{ width: `${scanProgress}%` }}
            />
          </div>

          {/* Percentage */}
          <p className="font-mono text-sm text-muted-foreground">
            {phase === 'scanning' ? `${Math.floor(scanProgress)}%` :
             phase === 'authorized' ? 'Token Sécurisé' : '...'}
          </p>
        </div>

        {/* Shield badge */}
        <div className={cn(
          'mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full',
          'border transition-all duration-300',
          phase === 'authorized' 
            ? 'border-success/50 bg-success/10 text-success'
            : 'border-primary/30 bg-primary/5 text-primary'
        )}>
          <Shield className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {phase === 'authorized' ? 'CEO Override Confirmé' : 'Vérification CEO en cours'}
          </span>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8">
        <div className="w-8 h-8 border-l-2 border-t-2 border-primary/30" />
      </div>
      <div className="absolute top-8 right-8">
        <div className="w-8 h-8 border-r-2 border-t-2 border-primary/30" />
      </div>
      <div className="absolute bottom-8 left-8">
        <div className="w-8 h-8 border-l-2 border-b-2 border-primary/30" />
      </div>
      <div className="absolute bottom-8 right-8">
        <div className="w-8 h-8 border-r-2 border-b-2 border-primary/30" />
      </div>
    </div>
  );
}
