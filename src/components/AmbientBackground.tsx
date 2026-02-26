import { useEffect, useRef } from 'react';

const AmbientBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      time++;
      ctx.fillStyle = '#0A0A0C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const orbs = [
        { x: 0.3, y: 0.4, r: 0.4, speed: 0.0003, phase: 0 },
        { x: 0.7, y: 0.6, r: 0.45, speed: 0.0002, phase: 2 },
        { x: 0.5, y: 0.3, r: 0.35, speed: 0.00035, phase: 4 },
        { x: 0.2, y: 0.7, r: 0.3, speed: 0.00025, phase: 1 },
        { x: 0.8, y: 0.2, r: 0.35, speed: 0.0004, phase: 3 },
      ];

      for (const orb of orbs) {
        const cx = canvas.width * (orb.x + Math.sin(time * orb.speed + orb.phase) * 0.1);
        const cy = canvas.height * (orb.y + Math.cos(time * orb.speed * 0.7 + orb.phase) * 0.08);
        const radius = Math.min(canvas.width, canvas.height) * orb.r;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, 'rgba(212, 168, 67, 0.22)');
        gradient.addColorStop(0.25, 'rgba(212, 168, 67, 0.12)');
        gradient.addColorStop(0.5, 'rgba(212, 168, 67, 0.05)');
        gradient.addColorStop(1, 'rgba(10, 10, 12, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default AmbientBackground;
