import { useRef, useState, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TiltCard({ children, className, style }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * -12,  // tilt around X axis
      y: (x - 0.5) * 12,   // tilt around Y axis
      active: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0, active: false });
  }, []);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        ...style,
        perspective: '800px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="w-full h-full"
        style={{
          transform: tilt.active
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
            : 'rotateX(0) rotateY(0) scale(1)',
          transition: tilt.active
            ? 'transform 0.15s ease-out'
            : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Specular highlight — moves with cursor */}
        <div
          className="absolute inset-0 rounded-[20px] pointer-events-none z-10 transition-opacity duration-300"
          style={{
            background: tilt.active
              ? `radial-gradient(circle at ${((tilt.y / 12) + 0.5) * 100}% ${((-tilt.x / 12) + 0.5) * 100}%, rgba(255,255,255,0.08) 0%, transparent 60%)`
              : 'none',
            opacity: tilt.active ? 1 : 0,
          }}
        />
        {children}
      </div>
    </div>
  );
}
