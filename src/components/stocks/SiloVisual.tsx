import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingDown } from 'lucide-react';

interface SiloVisualProps {
  materiau: string;
  quantite: number;
  capacite: number;
  seuil: number;
  unite: string;
  daysRemaining?: number;
  className?: string;
}

export function SiloVisual({
  materiau,
  quantite,
  capacite,
  seuil,
  unite,
  daysRemaining,
  className,
}: SiloVisualProps) {
  const percentage = capacite > 0 ? Math.min((quantite / capacite) * 100, 100) : 0;
  const seuilPercentage = capacite > 0 ? (seuil / capacite) * 100 : 0;
  const isCritical = quantite <= seuil;
  const isLow = quantite <= seuil * 1.5 && !isCritical;

  // Material-specific colors
  const getMaterialColor = (mat: string) => {
    switch (mat) {
      case 'Ciment':
        return { bg: 'bg-slate-400', fill: 'from-slate-500 to-slate-600', border: 'border-slate-500' };
      case 'Sable':
        return { bg: 'bg-amber-400', fill: 'from-amber-400 to-amber-500', border: 'border-amber-500' };
      case 'Gravette':
        return { bg: 'bg-stone-400', fill: 'from-stone-400 to-stone-500', border: 'border-stone-500' };
      case 'Adjuvant':
        return { bg: 'bg-blue-400', fill: 'from-blue-400 to-blue-500', border: 'border-blue-500' };
      case 'Eau':
        return { bg: 'bg-cyan-400', fill: 'from-cyan-400 to-cyan-500', border: 'border-cyan-500' };
      default:
        return { bg: 'bg-gray-400', fill: 'from-gray-400 to-gray-500', border: 'border-gray-500' };
    }
  };

  const colors = getMaterialColor(materiau);

  const formatQuantity = (qty: number) => {
    if (qty >= 1000) {
      return `${(qty / 1000).toFixed(1)}k`;
    }
    return qty.toFixed(0);
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Critical Alert */}
      {isCritical && (
        <div className="mb-2 flex items-center gap-1 px-2 py-1 rounded bg-destructive/20 border border-destructive/50 animate-pulse">
          <AlertTriangle className="h-3 w-3 text-destructive" />
          <span className="text-xs font-bold text-destructive uppercase">
            Commande Critique Requise
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
              'text-2xl font-bold',
              percentage > 50 ? 'text-background' : 'text-foreground'
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
        <h3 className="font-bold text-lg">{materiau}</h3>
        <p className={cn(
          'font-mono text-lg',
          isCritical && 'text-destructive font-bold'
        )}>
          {formatQuantity(quantite)} <span className="text-sm text-muted-foreground">{unite}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          / {formatQuantity(capacite)} {unite}
        </p>
      </div>

      {/* Days Remaining */}
      {daysRemaining !== undefined && (
        <div className={cn(
          'mt-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
          daysRemaining <= 3 ? 'bg-destructive/20 text-destructive' :
          daysRemaining <= 7 ? 'bg-warning/20 text-warning' :
          'bg-muted text-muted-foreground'
        )}>
          <TrendingDown className="h-3 w-3" />
          <span>
            {daysRemaining <= 999 ? `${daysRemaining}j restants` : '∞'}
          </span>
        </div>
      )}

      {/* Status indicator */}
      <div className={cn(
        'mt-2 h-2 w-2 rounded-full',
        isCritical ? 'bg-destructive animate-ping' :
        isLow ? 'bg-warning' :
        'bg-success'
      )} />
    </div>
  );
}
