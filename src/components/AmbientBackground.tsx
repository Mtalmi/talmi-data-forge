import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const AmbientBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    const particles: Particle[] = [];
    let lastBurst = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Burst gold particles periodically
    const burstParticles = (count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.8;
        particles.push({
          x: canvas.width * (0.3 + Math.random() * 0.4),
          y: canvas.height * (0.2 + Math.random() * 0.3),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          life: 0,
          maxLife: 60 + Math.random() * 60,
          size: 1 + Math.random() * 1.5,
        });
      }
    };

    const animate = () => {
      time++;
      ctx.fillStyle = '#0A0A0C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animated golden orbs
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

      // Gold data particles
      if (time - lastBurst > 3600) { // ~60s at 60fps
        burstParticles(5 + Math.floor(Math.random() * 6));
        lastBurst = time;
      }

      // Also emit sparse ambient particles continuously
      if (time % 120 === 0 && particles.length < 30) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height * 0.6 + Math.random() * canvas.height * 0.3,
          vx: Math.cos(angle) * 0.3,
          vy: Math.sin(angle) * 0.4 - 0.2,
          life: 0,
          maxLife: 80 + Math.random() * 80,
          size: 1 + Math.random(),
        });
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        // Gentle curve
        p.vx += Math.sin(p.life * 0.03) * 0.02;

        const alpha = 1 - p.life / p.maxLife;
        const fade = alpha * alpha; // quadratic fade

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        glow.addColorStop(0, `rgba(255, 215, 0, ${fade * 0.3})`);
        glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.size * 4, p.y - p.size * 4, p.size * 8, p.size * 8);

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * fade, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${fade * 0.7})`;
        ctx.fill();
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
