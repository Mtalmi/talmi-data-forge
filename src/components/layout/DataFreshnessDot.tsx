import { useState, useEffect } from 'react';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

interface DataFreshnessDotProps {
  lastUpdated?: Date;
}

export function DataFreshnessDot({ lastUpdated }: DataFreshnessDotProps) {
  const [now, setNow] = useState(Date.now());
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const ts = lastUpdated || new Date(now - 15000); // default: 15s ago
  const ageSeconds = Math.floor((now - ts.getTime()) / 1000);

  let color: string;
  let pulse = false;
  if (ageSeconds < 60) {
    color = '#22C55E';
    pulse = true;
  } else if (ageSeconds < 300) {
    color = '#D4A843';
  } else if (ageSeconds < 900) {
    color = '#F59E0B';
  } else {
    color = '#EF4444';
  }

  const label = ageSeconds < 60
    ? `${ageSeconds}s`
    : ageSeconds < 3600
      ? `${Math.floor(ageSeconds / 60)}min`
      : `${Math.floor(ageSeconds / 3600)}h`;

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: 'default' }}
    >
      <span className="relative inline-flex" style={{ width: 8, height: 8 }}>
        {pulse && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: color, opacity: 0.4 }}
          />
        )}
        <span
          className="relative inline-block rounded-full"
          style={{
            width: 8, height: 8, background: color,
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      </span>

      {hover && (
        <span
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            whiteSpace: 'nowrap',
            fontFamily: MONO,
            fontSize: 10,
            color: '#9CA3AF',
            background: '#1A2332',
            border: '1px solid rgba(212,168,67,0.2)',
            borderRadius: 6,
            padding: '4px 8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            zIndex: 50,
          }}
        >
          Données mises à jour il y a {label}
        </span>
      )}
    </span>
  );
}
