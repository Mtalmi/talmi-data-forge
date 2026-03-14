import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingDown, Clock, Gauge } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useState } from 'react';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

interface SiloVisualProps {
  materiau: string;
  quantite: number;
  capacite: number;
  seuil: number;
  unite: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  avgDailyUsage?: number;
  sparklineData?: number[];
  className?: string;
}

export function SiloVisual({
  materiau,
  quantite,
  capacite,
  seuil,
  unite,
  daysRemaining,
  hoursRemaining,
  avgDailyUsage,
  sparklineData,
  className,
}: SiloVisualProps) {
  const { t } = useI18n();
  const [hov, setHov] = useState(false);
  const percentage = capacite > 0 ? Math.min((quantite / capacite) * 100, 100) : 0;
  const seuilPercentage = capacite > 0 ? (seuil / capacite) * 100 : 0;
  const isCritical = quantite <= seuil;
  const isLow = quantite <= seuil * 1.5 && !isCritical;

  // Color-code fill by level: <20% red, 20-40% amber, 40-70% gold, >70% green
  const fillColor = percentage < 20 ? '#EF4444'
    : percentage < 40 ? '#F59E0B'
    : percentage < 70 ? '#D4A843'
    : '#22C55E';

  const borderColor = percentage < 20 ? 'border-red-500' : percentage < 40 ? 'border-amber-500' : percentage < 70 ? 'border-[#D4A843]' : 'border-emerald-500';

  const formatQuantity = (qty: number) => {
    if (qty >= 1000) return `${(qty / 1000).toFixed(1)}k`;
    return qty.toFixed(0);
  };

  const displayAutonomy = (() => {
    if (daysRemaining === undefined) return null;
    if (daysRemaining > 365) return '—';
    const rounded = Math.round(daysRemaining * 10) / 10;
    return `${rounded}j${hoursRemaining !== undefined ? ` ${Math.round(hoursRemaining % 24)}h` : ''}`;
  })();

  const glowConfig = daysRemaining === undefined
    ? null
    : daysRemaining < 3
    ? { color: 'rgba(239,68,68,0.8)', border: 'rgba(239,68,68,0.4)', speed: '0.8s' }
    : daysRemaining <= 7
    ? { color: 'rgba(251,146,60,0.6)', border: 'rgba(251,146,60,0.35)', speed: '1.5s' }
    : { color: 'rgba(34,197,94,0.6)', border: 'rgba(34,197,94,0.3)', speed: '1.5s' };

  // Autonomy badge border color by urgency
  const autoBorderColor = daysRemaining === undefined ? 'rgba(100,116,139,0.3)'
    : daysRemaining < 7 ? '#EF4444'
    : daysRemaining <= 10 ? '#F59E0B'
    : '#22C55E';

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? '0 4px 20px rgba(212,168,67,0.1)' : 'none',
        cursor: 'pointer',
      }}
    >
      {isCritical && (
        <div className="mb-2 flex items-center gap-1 px-2 py-1 rounded bg-destructive/20 border border-destructive/50 animate-pulse">
          <AlertTriangle className="h-3 w-3 text-destructive" />
          <span className="text-xs font-bold text-destructive uppercase">
            {t.pages.stocks.criticalOrderRequired}
          </span>
        </div>
      )}

      {/* Silo Container */}
      <div
        className="relative w-24 h-48 flex flex-col"
        style={{
          borderRadius: 12,
          boxShadow: glowConfig ? `0 0 ${daysRemaining !== undefined && daysRemaining < 3 ? '12px' : '6px'} ${glowConfig.border}` : undefined,
          border: glowConfig ? `1px solid ${glowConfig.border}` : undefined,
          transition: 'box-shadow 0.3s ease',
          animation: daysRemaining !== undefined && daysRemaining < 3 ? 'silo-pulse-border 0.8s ease-in-out infinite' : undefined,
          ['--silo-pulse-color' as string]: daysRemaining !== undefined && daysRemaining < 3 ? 'rgba(239,68,68,0.6)' : undefined,
        }}
      >
        {/* Top cap */}
        <div className={cn(
          'h-4 rounded-t-full border-2 border-b-0',
          borderColor,
          'bg-muted/30'
        )} />
        
        {/* Silo body */}
        <div className={cn(
          'flex-1 relative border-2 border-t-0 border-b-0 overflow-hidden',
          borderColor,
          'bg-muted/20'
        )}>
          {/* Fill level — color-coded by percentage */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-700"
            style={{
              height: `${percentage}%`,
              background: `linear-gradient(to top, ${fillColor}, ${fillColor}cc)`,
              transformOrigin: 'bottom',
              animation: 'silo-breathing 3s ease-in-out infinite',
            }}
          />
          {/* Liquid shimmer overlay */}
          {percentage > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{
                height: `${percentage}%`,
                background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)',
                backgroundSize: '100% 200%',
                animation: 'silo-liquid-shimmer 4s linear infinite',
              }}
            />
          )}
          {/* Drain overlay for low autonomy */}
          {daysRemaining !== undefined && daysRemaining < 3 && percentage > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{
                height: `${percentage}%`,
                background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 40%, transparent 60%)',
                backgroundSize: '100% 200%',
                animation: 'silo-drain-sweep 4s linear infinite',
              }}
            />
          )}
          
          {/* Alert threshold line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-warning/70"
            style={{ bottom: `${seuilPercentage}%` }}
          >
            <span className="absolute -right-1 -top-3 text-[10px] text-warning font-mono">
              Min
            </span>
          </div>
          
          {/* Percentage text — monospace weight 200 size 24px */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{
              fontFamily: MONO,
              fontWeight: 200,
              fontSize: 24,
              color: '#fff',
            }}>
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
        
        {/* Bottom cone */}
        <div className={cn('h-6 relative overflow-hidden', borderColor)}>
          <div
            className={cn('absolute inset-0 border-l-2 border-r-2', borderColor, 'bg-muted/30')}
            style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 30% 100%)' }}
          />
          {percentage > 0 && (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${fillColor}, ${fillColor}cc)`,
                clipPath: 'polygon(0 0, 100% 0, 70% 100%, 30% 100%)',
                height: `${Math.min(percentage, 100)}%`,
              }}
            />
          )}
        </div>
        
        {/* Output pipe */}
        <div className={cn('h-4 w-6 mx-auto border-2 border-t-0 rounded-b', borderColor, 'bg-muted/30')} />
      </div>

      {/* Material Info */}
      <div className="mt-4 text-center">
        <h3 style={{ fontFamily: MONO, fontWeight: 500, fontSize: 14, color: '#fff' }}>{materiau}</h3>
        <p style={{ fontFamily: MONO, fontWeight: 300, fontSize: 13, color: '#D4A843' }}>
          {formatQuantity(quantite)} <span style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF' }}>{unite}</span>
        </p>
        <p style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF' }}>
          / {formatQuantity(capacite)} {unite}
        </p>
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length >= 2 && (() => {
        const sparkColor = daysRemaining !== undefined && daysRemaining < 3 ? '#ef4444'
          : daysRemaining !== undefined && daysRemaining <= 7 ? '#f97316' : '#22c55e';
        const W = 80, H = 24, pad = 2;
        const min = Math.min(...sparklineData);
        const max = Math.max(...sparklineData);
        const range = max - min || 1;
        const pts = sparklineData.map((v, i) => ({
          x: pad + (i / (sparklineData.length - 1)) * (W - pad * 2),
          y: pad + (1 - (v - min) / range) * (H - pad * 2),
        }));
        const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
        const last3 = sparklineData.slice(-3);
        const trend = last3.length >= 2
          ? last3[last3.length - 1] - last3[0] < -range * 0.05 ? 'down'
          : last3[last3.length - 1] - last3[0] > range * 0.05 ? 'up' : 'flat'
          : 'flat';
        const uid = `spark-${materiau.replace(/\s/g, '')}`;
        return (
          <div className="mt-2 flex items-center justify-center gap-1">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              <defs>
                <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#${uid})`} />
              <path d={line} fill="none" stroke={sparkColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {trend === 'down' && <span className="text-xs text-destructive font-bold">↓</span>}
            {trend === 'up' && <span className="text-xs text-emerald-400 font-bold">↑</span>}
          </div>
        );
      })()}

      {/* Autonomy — with borderTop colored by urgency */}
      {displayAutonomy !== null && (
        <div
          className="mt-3 p-2 rounded-lg"
          style={{
            borderTop: `2px solid ${autoBorderColor}`,
            border: `1px solid ${autoBorderColor}33`,
            borderTopWidth: 2,
            borderTopColor: autoBorderColor,
            background: daysRemaining !== undefined && daysRemaining <= 3
              ? 'rgba(239,68,68,0.08)'
              : daysRemaining !== undefined && daysRemaining <= 7
                ? 'rgba(245,158,11,0.08)'
                : 'rgba(212,168,67,0.05)',
            ...(glowConfig ? {
              animation: `silo-badge-glow ${glowConfig.speed} ease-in-out infinite alternate`,
              ['--silo-glow-color' as string]: glowConfig.color,
            } : {}),
          }}
        >
          <div className="flex items-center gap-1.5 justify-center">
            <Gauge className={cn(
              'h-3.5 w-3.5',
              daysRemaining !== undefined && daysRemaining <= 3 
                ? 'text-destructive animate-pulse' 
                : daysRemaining !== undefined && daysRemaining <= 7 
                  ? 'text-warning' 
                  : 'text-[#D4A843]'
            )} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF' }}>
              {t.pages.stocks.estimatedAutonomy}
            </span>
          </div>
          <div className="mt-1 text-center" style={{
            fontFamily: MONO,
            fontWeight: 600,
            fontSize: 18,
            color: daysRemaining !== undefined && daysRemaining <= 3
              ? '#EF4444'
              : daysRemaining !== undefined && daysRemaining <= 7
                ? '#F59E0B'
                : '#D4A843',
          }}>
            {displayAutonomy}
          </div>
          {avgDailyUsage !== undefined && avgDailyUsage > 0 && (
            <div className="mt-1 text-center flex items-center justify-center gap-1">
              <TrendingDown className="h-3 w-3" style={{ color: '#9CA3AF' }} />
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF' }}>
                Conso moy: {avgDailyUsage.toFixed(0)} {unite}{t.pages.stocks.perDay}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Legacy fallback */}
      {daysRemaining === undefined && hoursRemaining === undefined && (
        <div className={cn(
          'mt-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
          'bg-muted text-muted-foreground'
        )}>
          <Clock className="h-3 w-3" />
          <span>{t.pages.stocks.calculationInProgress}</span>
        </div>
      )}

      {/* Status indicator — pulse for healthy, red pulse for critical */}
      <div style={{
        marginTop: 8,
        width: 8, height: 8, borderRadius: '50%',
        background: isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#22C55E',
        animation: isCritical
          ? 'silo-status-pulse-red 2s infinite'
          : 'silo-status-pulse-green 2s infinite',
      }} />

      <style>{`
        @keyframes silo-status-pulse-green {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        @keyframes silo-status-pulse-red {
          0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 rgba(239,68,68,0); }
          50% { transform: scale(1.4); opacity: 0.8; box-shadow: 0 0 8px rgba(239,68,68,0.5); }
        }
      `}</style>
    </div>
  );
}
