import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 3000 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'reveal' | 'stats' | 'fade'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 600);
    const t2 = setTimeout(() => setPhase('stats'), 1400);
    const t3 = setTimeout(() => setPhase('fade'), 2400);
    const t4 = setTimeout(onComplete, duration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete, duration]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center',
        'transition-all duration-700',
        phase === 'fade' && 'opacity-0 scale-105 pointer-events-none'
      )}
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, hsl(0 0% 6%) 0%, hsl(0 0% 2%) 70%)',
      }}
    >
      {/* Animated Grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(hsl(51 100% 50% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(51 100% 50% / 0.4) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial Glow */}
      <div
        className={cn(
          'absolute rounded-full transition-all duration-[2000ms]',
          phase === 'enter' ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
        )}
        style={{
          width: 700,
          height: 700,
          background: 'radial-gradient(circle, hsl(51 100% 50% / 0.12) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Logo */}
      <div
        className={cn(
          'relative transition-all duration-1000 ease-out',
          phase === 'enter' ? 'scale-75 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
        )}
      >
        {/* Ring Pulses */}
        <div className="absolute inset-[-12px] rounded-full border border-primary/20" style={{ animation: 'ring-pulse 2.5s ease-out infinite' }} />
        <div className="absolute inset-[-24px] rounded-full border border-primary/10" style={{ animation: 'ring-pulse 2.5s ease-out infinite 0.4s' }} />
        <div className="absolute inset-[-36px] rounded-full border border-primary/5" style={{ animation: 'ring-pulse 2.5s ease-out infinite 0.8s' }} />

        {/* Main Circle */}
        <div
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, hsl(51 100% 55%) 0%, hsl(45 100% 42%) 100%)',
            boxShadow: '0 0 80px hsl(51 100% 50% / 0.4), inset 0 2px 4px hsl(0 0% 100% / 0.2)',
          }}
        >
          <span
            className="text-4xl sm:text-5xl font-black tracking-tight select-none"
            style={{
              background: 'linear-gradient(180deg, hsl(0 0% 8%) 0%, hsl(0 0% 15%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            TB
          </span>
        </div>
      </div>

      {/* Company Name */}
      <div
        className={cn(
          'mt-8 text-center transition-all duration-700',
          phase === 'enter' || phase === 'reveal' && !(phase === 'reveal')
            ? 'opacity-0 translate-y-4'
            : 'opacity-100 translate-y-0',
          (phase === 'reveal' || phase === 'stats' || phase === 'fade') && 'opacity-100 translate-y-0'
        )}
      >
        <h1
          className="text-3xl sm:text-4xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(90deg, hsl(51 100% 55%) 0%, hsl(45 100% 70%) 50%, hsl(51 100% 55%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          TALMI BÉTON
        </h1>
        <div className="mt-2 flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
          <p className="text-[11px] text-primary/50 tracking-[0.35em] uppercase font-medium">
            Operating System
          </p>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
        </div>
      </div>

      {/* Stats Row */}
      <div
        className={cn(
          'mt-10 flex items-center gap-8 transition-all duration-700 delay-200',
          (phase === 'stats' || phase === 'fade') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        )}
      >
        {[
          { n: '50+', l: 'Modules' },
          { n: '24/7', l: 'Monitoring' },
          { n: '99.9%', l: 'Uptime' },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-lg font-bold text-foreground/80">{s.n}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Version Badge */}
      <div
        className={cn(
          'mt-8 transition-all duration-500 delay-300',
          (phase === 'stats' || phase === 'fade') ? 'opacity-100' : 'opacity-0'
        )}
      >
        <span className="px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.15em] uppercase bg-primary/8 text-primary/60 border border-primary/15">
          v2.0 • Enterprise Edition
        </span>
      </div>

      {/* Loading Bar */}
      <div className="absolute bottom-16 w-48">
        <div className="h-[2px] w-full bg-border/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, hsl(51 100% 50%), hsl(45 100% 60%))',
              animation: 'loading-bar 2.4s ease-in-out forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes ring-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes loading-bar {
          0% { width: 0%; }
          30% { width: 40%; }
          60% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}