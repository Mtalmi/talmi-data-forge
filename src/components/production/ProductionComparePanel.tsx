import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface TheoreticalValues {
  ciment_kg_m3: number;
  adjuvant_l_m3: number;
  eau_l_m3: number;
}

interface RealValues {
  ciment_reel_kg: number;
  adjuvant_reel_l: number;
  eau_reel_l: number;
}

interface ProductionComparePanelProps {
  formule: TheoreticalValues | null;
  volume: number;
  realValues: RealValues;
  onValueChange: (field: keyof RealValues, value: number) => void;
  deviations: { field: string; percent: number }[];
  disabled?: boolean;
}

export function ProductionComparePanel({
  formule,
  volume,
  realValues,
  onValueChange,
  deviations,
  disabled = false,
}: ProductionComparePanelProps) {
  if (!formule || volume <= 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Sélectionnez une formule et un volume pour voir la comparaison
      </div>
    );
  }

  const theoreticalValues = {
    ciment: formule.ciment_kg_m3 * volume,
    adjuvant: formule.adjuvant_l_m3 * volume,
    eau: formule.eau_l_m3 * volume,
  };

  const getDeviationPercent = (field: string): number => {
    const deviation = deviations.find(d => d.field === field);
    return deviation?.percent || 0;
  };

  const hasDeviation = (field: string): boolean => {
    return getDeviationPercent(field) > 5;
  };

  const rows = [
    {
      label: 'Ciment',
      unit: 'kg',
      theoretical: theoreticalValues.ciment,
      real: realValues.ciment_reel_kg,
      field: 'ciment' as const,
      realField: 'ciment_reel_kg' as const,
    },
    {
      label: 'Adjuvant',
      unit: 'L',
      theoretical: theoreticalValues.adjuvant,
      real: realValues.adjuvant_reel_l,
      field: 'adjuvant' as const,
      realField: 'adjuvant_reel_l' as const,
    },
    {
      label: 'Eau',
      unit: 'L',
      theoretical: theoreticalValues.eau,
      real: realValues.eau_reel_l,
      field: 'eau' as const,
      realField: 'eau_reel_l' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left Panel - Theoretical */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <h3 className="font-semibold uppercase tracking-wide text-sm text-muted-foreground">
            Formule Théorique
          </h3>
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.field} className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
              <span className="text-sm font-medium">{row.label}</span>
              <span className="font-mono text-lg font-semibold">
                {row.theoretical.toFixed(1)} <span className="text-xs text-muted-foreground">{row.unit}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Volume:</span>
            <span className="font-mono font-semibold">{volume} m³</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Real Consumption */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <div className="h-3 w-3 rounded-full bg-accent" />
          <h3 className="font-semibold uppercase tracking-wide text-sm text-muted-foreground">
            Consommation Réelle
          </h3>
        </div>
        <div className="space-y-3">
          {rows.map((row) => {
            const deviation = getDeviationPercent(row.field);
            const hasError = hasDeviation(row.field);
            
            return (
              <div
                key={row.field}
                className={cn(
                  'flex justify-between items-center py-2 px-3 rounded transition-colors',
                  hasError ? 'bg-destructive/10 border border-destructive/50' : 'bg-muted/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{row.label}</span>
                  {hasError ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : row.real > 0 ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    value={row.real || ''}
                    onChange={(e) => onValueChange(row.realField, parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className={cn(
                      'w-24 px-2 py-1 text-right font-mono text-lg font-semibold rounded bg-background border',
                      hasError ? 'border-destructive text-destructive' : 'border-border',
                      disabled && 'opacity-60 cursor-not-allowed'
                    )}
                  />
                  <span className="text-xs text-muted-foreground w-6">{row.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Deviation Summary */}
        {deviations.length > 0 && (
          <div className="pt-2 border-t border-destructive/30">
            <div className="space-y-1">
              {deviations.map((d) => (
                <div key={d.field} className="flex justify-between items-center text-sm text-destructive">
                  <span className="capitalize">{d.field}</span>
                  <span className="font-mono font-semibold">+{d.percent.toFixed(1)}% écart</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
