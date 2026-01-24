import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AmbientGlowProps {
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
}

/**
 * Ambient Glow Background - Premium interactive lighting effect
 * Creates a subtle glow that follows mouse movement for desktop
 * and shifts slowly on mobile for a "living" interface feel
 */
export function AmbientGlow({ className, intensity = 'subtle' }: AmbientGlowProps) {
  const [position, setPosition] = useState({ x: 50, y: 30 });
  const [isMobile, setIsMobile] = useState(false);
  const animationRef = useRef<number>();
  const targetPosition = useRef({ x: 50, y: 30 });

  // Intensity configurations
  const intensityConfig = {
    subtle: { size: 600, opacity: 0.04 },
    medium: { size: 800, opacity: 0.06 },
    strong: { size: 1000, opacity: 0.08 },
  };

  const config = intensityConfig[intensity];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mouse tracking for desktop
  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetPosition.current = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      setPosition(prev => ({
        x: prev.x + (targetPosition.current.x - prev.x) * 0.05,
        y: prev.y + (targetPosition.current.y - prev.y) * 0.05,
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Slow drift animation for mobile
  useEffect(() => {
    if (!isMobile) return;

    const drift = () => {
      const time = Date.now() / 8000;
      targetPosition.current = {
        x: 50 + Math.sin(time) * 20,
        y: 30 + Math.cos(time * 0.7) * 15,
      };
    };

    const interval = setInterval(drift, 50);
    return () => clearInterval(interval);
  }, [isMobile]);

  return (
    <div className={cn('fixed inset-0 pointer-events-none overflow-hidden z-0', className)}>
      {/* Primary Gold Glow */}
      <div
        className="absolute rounded-full transition-opacity duration-1000"
        style={{
          width: config.size,
          height: config.size,
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, hsl(51 100% 50% / ${config.opacity}) 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* Secondary Accent Glow - offset */}
      <div
        className="absolute rounded-full"
        style={{
          width: config.size * 0.6,
          height: config.size * 0.6,
          left: `${100 - position.x}%`,
          top: `${100 - position.y}%`,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, hsl(45 100% 60% / ${config.opacity * 0.5}) 0%, transparent 70%)`,
          filter: 'blur(80px)',
        }}
      />

      {/* Subtle Edge Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, hsl(0 0% 0% / 0.4) 100%)',
        }}
      />
    </div>
  );
}
