import { useRef, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ParallaxCardProps {
  children: ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  glowColor?: 'gold' | 'ruby' | 'emerald';
}

/**
 * ParallaxCard - Premium 3D tilt effect for dashboard cards
 * Uses device orientation on mobile and mouse position on desktop
 * Creates floating data effect in 3D space
 */
export function ParallaxCard({
  children,
  className,
  intensity = 'subtle',
  glowColor = 'gold',
}: ParallaxCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const intensityMultiplier = {
    subtle: 0.5,
    medium: 1,
    strong: 1.5,
  };

  const glowColors = {
    gold: 'hsl(51 100% 50% / 0.15)',
    ruby: 'hsl(350 100% 50% / 0.15)',
    emerald: 'hsl(142 76% 36% / 0.15)',
  };

  // Mouse tracking for desktop
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const percentX = (e.clientX - centerX) / (rect.width / 2);
      const percentY = (e.clientY - centerY) / (rect.height / 2);

      const maxRotation = 8 * intensityMultiplier[intensity];
      
      setTransform({
        rotateX: -percentY * maxRotation,
        rotateY: percentX * maxRotation,
      });
    };

    const handleMouseLeave = () => {
      setTransform({ rotateX: 0, rotateY: 0 });
      setIsHovered(false);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [intensity]);

  // Device orientation for mobile
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;

      const maxRotation = 6 * intensityMultiplier[intensity];
      const beta = Math.max(-30, Math.min(30, e.beta)); // Front-back tilt
      const gamma = Math.max(-30, Math.min(30, e.gamma)); // Left-right tilt

      setTransform({
        rotateX: (beta / 30) * maxRotation,
        rotateY: (gamma / 30) * maxRotation,
      });
    };

    // Request permission on iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch {
          // Permission denied or not available
        }
      } else {
        // Non-iOS or older iOS
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    // Only add on mobile
    if (window.innerWidth < 768) {
      requestPermission();
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [intensity]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative transition-transform duration-200 ease-out',
        'preserve-3d',
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Floating glow effect */}
      <div
        className={cn(
          'absolute -inset-1 rounded-xl opacity-0 transition-opacity duration-300 blur-xl',
          isHovered && 'opacity-100'
        )}
        style={{
          background: `radial-gradient(circle at center, ${glowColors[glowColor]}, transparent 70%)`,
          transform: 'translateZ(-20px)',
        }}
      />

      {/* Main content with slight elevation */}
      <div
        className="relative"
        style={{
          transform: 'translateZ(0px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </div>

      {/* Inner content floating effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: 'translateZ(10px)',
        }}
      />
    </div>
  );
}
