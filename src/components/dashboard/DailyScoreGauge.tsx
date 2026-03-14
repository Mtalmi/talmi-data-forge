import { useEffect, useState } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

interface DailyScoreGaugeProps {
  score?: number;
  deltaVsYesterday?: number;
  streak?: number;
  streakBroken?: boolean;
  streakBrokenCause?: string;
  weeklyRecord?: { score: number; day: string };
}

export function DailyScoreGauge({
  score = 87,
  deltaVsYesterday = 3,
  streak = 12,
  streakBroken = false,
  streakBrokenCause,
  weeklyRecord = { score: 94, day: 'jeudi' },
}: DailyScoreGaugeProps) {
  const animatedScore = useCountUp(score, 1800);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 100, 1);
  const dashOffset = circumference * (1 - pct);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
      {/* Circular Gauge */}
      <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none" stroke="rgba(212, 168, 67, 0.1)" strokeWidth="5"
          />
          {/* Filled ring */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? dashOffset : circumference}
            style={{ transition: 'stroke-dashoffset 1.8s ease-out' }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D4A843" />
              <stop offset="100%" stopColor="#FDB913" />
            </linearGradient>
          </defs>
        </svg>
        {/* Score text centered */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: MONO, fontSize: 20, fontWeight: 200, color: '#D4A843',
            lineHeight: 1, letterSpacing: '-0.02em',
            textShadow: '0 0 12px rgba(212,168,67,0.3)',
          }}>
            {animatedScore}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(212,168,67,0.5)', marginTop: 1 }}>/100</span>
        </div>
      </div>

      {/* Right side: label + streak + record */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase' }}>
          SCORE JOURNÉE
        </span>
        {/* Delta vs yesterday */}
        <span style={{
          fontFamily: MONO, fontSize: 11,
          color: deltaVsYesterday >= 0 ? '#22C55E' : '#EF4444',
          fontWeight: 600,
        }}>
          {deltaVsYesterday >= 0 ? '↗' : '↘'} {deltaVsYesterday >= 0 ? '+' : ''}{deltaVsYesterday} vs hier
        </span>
        {/* Streak */}
        {!streakBroken ? (
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#D4A843' }}>
            🔥 {streak} jours consécutifs &gt; 80/100
          </span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#EF4444', lineHeight: 1.4 }}>
            Série interrompue hier{streakBrokenCause ? ` (${streakBrokenCause})` : ''}
          </span>
        )}
        {/* Weekly record */}
        <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>
          Record semaine: {weeklyRecord.score}/100 ({weeklyRecord.day})
        </span>
      </div>
    </div>
  );
}
