import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingDown, Clock, Gauge } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

interface SiloVisualProps {
  materiau: string;
  quantite: number;
  capacite: number;
  seuil: number;
  unite: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  avgDailyUsage?: number;
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
  className,
}: SiloVisualProps) {
  const { t } = useI18n();
  const percentage = capacite > 0 ? Math.min((quantite / capacite) * 100, 100) : 0;
  const seuilPercentage = capacite > 0 ? (seuil / capacite) * 100 : 0;
  const isCritical = quantite <= seuil;
  const isLow = quantite <= seuil * 1.5 && !isCritical;

  // Gold-unified colors — critical uses red (semantic)
  const colors = isCritical
    ? { border: 'border-red-500', fill: 'from-red-500 to-red-600' }
    : { border: 'border-[#FFD700]', fill: 'from-[#FFD700] to-[#B8860B]' };

  const formatQuantity = (qty: number) => {
    if (qty >= 1000) {
      return `${(qty / 1000).toFixed(1)}k`;
    }
    return qty.toFixed(0);
  };

  // Show real autonomy or "—" instead of 999j
  const displayAutonomy = (() => {
    if (daysRemaining === undefined) return null;
    if (daysRemaining > 365) return '—';
    const rounded = Math.round(daysRemaining * 10) / 10;
    return `${rounded}j${hoursRemaining !== undefined ? ` ${Math.round(hoursRemaining % 24)}h` : ''}`;
  })();

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {isCritical && (
        <div className="mb-2 flex items-center gap-1 px-2 py-1 rounded bg-destructive/20 border border-destructive/50 animate-pulse">
          <AlertTriangle className="h-3 w-3 text-destructive" />
          <span className="text-xs font-bold text-destructive uppercase">
            {t.pages.stocks.criticalOrderRequired}
          </span>
        </div>
      )}

      {/* Silo Container */}
      <div className="relative w-24 h-48 flex flex-col">
        {/* Top cap */}
        <div className={cn(
          'h-4 rounded-t-full border-2 border-b-0',
          colors.border,
          'bg-muted/30'
        )} />
        
        {/* Silo body */}
        <div className={cn(
          'flex-1 relative border-2 border-t-0 border-b-0 overflow-hidden',
          colors.border,
          'bg-muted/20'
        )}>
          {/* Fill level */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 transition-all duration-700',
              'bg-gradient-to-t',
              isCritical ? 'from-destructive to-destructive/80' : colors.fill,
              isCritical && 'animate-pulse'
            )}
            style={{ height: `${percentage}%` }}
          />
          
          {/* Alert threshold line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-warning/70"
            style={{ bottom: `${seuilPercentage}%` }}
          >
            <span className="absolute -right-1 -top-3 text-[10px] text-warning font-mono">
              Min
            </span>
          </div>
          
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              'text-2xl font-bold font-mono text-white',
            )}>
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
        
        {/* Bottom cone */}
        <div className={cn(
          'h-6 relative overflow-hidden',
          colors.border
        )}>
          <div
            className={cn(
              'absolute inset-0 border-l-2 border-r-2',
              colors.border,
              'bg-muted/30'
            )}
            style={{
              clipPath: 'polygon(0 0, 100% 0, 70% 100%, 30% 100%)',
            }}
          />
          {percentage > 0 && (
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-t',
                isCritical ? 'from-destructive to-destructive/80' : colors.fill
              )}
              style={{
                clipPath: 'polygon(0 0, 100% 0, 70% 100%, 30% 100%)',
                height: `${Math.min(percentage, 100)}%`,
              }}
            />
          )}
        </div>
        
        {/* Output pipe */}
        <div className={cn(
          'h-4 w-6 mx-auto border-2 border-t-0 rounded-b',
          colors.border,
          'bg-muted/30'
        )} />
      </div>

      {/* Material Info */}
      <div className="mt-4 text-center">
        <h3 className="font-bold text-sm text-white">{materiau}</h3>
        <p className={cn(
          'font-mono text-sm',
          isCritical ? 'text-destructive font-bold' : 'text-gray-300'
        )}>
          {formatQuantity(quantite)} <span className="text-xs text-gray-500">{unite}</span>
        </p>
        <p className="text-xs text-gray-500 font-mono">
          / {formatQuantity(capacite)} {unite}
        </p>
      </div>

      {/* Autonomy */}
      {displayAutonomy !== null && (
        <div className={cn(
          'mt-3 p-2 rounded-lg',
          daysRemaining !== undefined && daysRemaining <= 3 
            ? 'border border-destructive/50 bg-destructive/10' 
            : daysRemaining !== undefined && daysRemaining <= 7 
              ? 'border border-warning/50 bg-warning/10' 
              : 'border border-[#FFD700]/20 bg-[#FFD700]/5'
        )}>
          <div className="flex items-center gap-1.5 justify-center">
            <Gauge className={cn(
              'h-3.5 w-3.5',
              daysRemaining !== undefined && daysRemaining <= 3 
                ? 'text-destructive animate-pulse' 
                : daysRemaining !== undefined && daysRemaining <= 7 
                  ? 'text-warning' 
                  : 'text-[#FFD700]'
            )} />
            <span className="text-xs text-gray-400">
              {t.pages.stocks.estimatedAutonomy}
            </span>
          </div>
          <div className={cn(
            'mt-1 text-center font-mono text-lg font-bold',
            daysRemaining !== undefined && daysRemaining <= 3 
              ? 'text-destructive' 
              : daysRemaining !== undefined && daysRemaining <= 7 
                ? 'text-warning' 
                : 'text-[#FFD700]'
          )}>
            {displayAutonomy}
          </div>
          {avgDailyUsage !== undefined && avgDailyUsage > 0 && (
            <div className="mt-1 text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <TrendingDown className="h-3 w-3" />
              <span>{t.pages.stocks.avgConsumption}: {avgDailyUsage.toFixed(0)} {unite}{t.pages.stocks.perDay}</span>
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

      {/* Status indicator */}
      <div className={cn(
        'mt-2 h-2 w-2 rounded-full',
        isCritical ? 'bg-destructive animate-ping' :
        isLow ? 'bg-warning' :
        'bg-emerald-400'
      )} />
    </div>
  );
}
