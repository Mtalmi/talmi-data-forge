import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo');

  useEffect(() => {
    // Phase 1: Logo appears (0-1000ms)
    const textTimer = setTimeout(() => setPhase('text'), 1000);
    
    // Phase 2: Text appears (1000-2000ms)
    const fadeTimer = setTimeout(() => setPhase('fade'), 2000);
    
    // Phase 3: Fade out and complete (2000-2500ms)
    const completeTimer = setTimeout(onComplete, duration);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <div 
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center',
        'bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505]',
        'transition-opacity duration-500',
        phase === 'fade' && 'opacity-0 pointer-events-none'
      )}
    >
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(45, 100%, 50%) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'pulse 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Golden Logo Container */}
      <div 
        className={cn(
          'relative transition-all duration-1000 ease-out',
          phase === 'logo' ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        )}
        style={{
          animation: phase !== 'logo' ? 'float 3s ease-in-out infinite' : undefined,
        }}
      >
        {/* Logo Circle */}
        <div 
          className={cn(
            'w-32 h-32 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#B8860B]',
            'shadow-[0_0_60px_rgba(212,175,55,0.5)]',
            'transition-all duration-700'
          )}
        >
          {/* TB Monogram */}
          <span 
            className="text-4xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            TB
          </span>
        </div>

        {/* Golden Ring Animation */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/30"
          style={{
            animation: 'ring-pulse 2s ease-out infinite',
          }}
        />
        <div 
          className="absolute inset-[-8px] rounded-full border border-[#D4AF37]/20"
          style={{
            animation: 'ring-pulse 2s ease-out infinite 0.5s',
          }}
        />
      </div>

      {/* Company Name */}
      <div 
        className={cn(
          'mt-8 text-center transition-all duration-700 delay-300',
          phase === 'text' || phase === 'fade' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        <h1 
          className="text-3xl font-bold tracking-wider"
          style={{
            background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          TALMI BÉTON
        </h1>
        <p className="text-sm text-[#D4AF37]/60 mt-2 tracking-[0.3em] uppercase">
          Operating System
        </p>
      </div>

      {/* Version Badge */}
      <div 
        className={cn(
          'mt-6 transition-all duration-700 delay-500',
          phase === 'text' || phase === 'fade' ? 'opacity-100' : 'opacity-0'
        )}
      >
        <span className="px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-[#D4AF37]/10 text-[#D4AF37]/80 border border-[#D4AF37]/20">
          Imperial Launch Edition
        </span>
      </div>

      {/* Loading Indicator */}
      <div 
        className={cn(
          'absolute bottom-12 transition-opacity duration-500',
          phase === 'text' ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-2 h-2 rounded-full bg-[#D4AF37]/60"
              style={{
                animation: 'bounce-dot 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ring-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
