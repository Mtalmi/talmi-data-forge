import { Clock, Factory, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageData {
  planification: number;
  production: number;
  validation: number;
}

interface ProductionDistributionStepperProps {
  data: StageData;
  totalVolume?: {
    planification: number;
    production: number;
    validation: number;
  };
  onStageClick?: (stage: 'planification' | 'production' | 'validation') => void;
  activeStage?: string | null;
  className?: string;
}

const STAGES = [
  { 
    key: 'planification' as const, 
    label: 'Planifiés', 
    icon: Clock, 
    color: 'blue',
    bgClass: 'bg-blue-500',
    bgLightClass: 'bg-blue-500/10',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-500',
    ringClass: 'ring-blue-500/30'
  },
  { 
    key: 'production' as const, 
    label: 'En Production', 
    icon: Factory, 
    color: 'warning',
    bgClass: 'bg-warning',
    bgLightClass: 'bg-warning/10',
    textClass: 'text-warning',
    borderClass: 'border-warning',
    ringClass: 'ring-warning/30'
  },
  { 
    key: 'validation' as const, 
    label: 'Validation', 
    icon: CheckCircle, 
    color: 'purple',
    bgClass: 'bg-purple-500',
    bgLightClass: 'bg-purple-500/10',
    textClass: 'text-purple-600',
    borderClass: 'border-purple-500',
    ringClass: 'ring-purple-500/30'
  },
];

export function ProductionDistributionStepper({ 
  data, 
  totalVolume,
  onStageClick,
  activeStage,
  className 
}: ProductionDistributionStepperProps) {
  const total = data.planification + data.production + data.validation;
  
  return (
    <div className={cn("bg-card border rounded-lg p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Workflow Production</h3>
        <span className="text-xs text-muted-foreground">
          {total} BL{total > 1 ? 's' : ''} en cours
        </span>
      </div>

      {/* Stages */}
      <div className="flex items-center gap-2">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const count = data[stage.key];
          const volume = totalVolume?.[stage.key] || 0;
          const isActive = activeStage === stage.key;
          const hasItems = count > 0;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              <button
                onClick={() => onStageClick?.(stage.key)}
                className={cn(
                  "flex-1 p-3 rounded-lg border-2 transition-all",
                  "hover:shadow-md hover:scale-[1.02]",
                  isActive && `${stage.borderClass} ${stage.ringClass} ring-4`,
                  !isActive && hasItems && `border-transparent ${stage.bgLightClass}`,
                  !isActive && !hasItems && "border-dashed border-muted bg-muted/30"
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  {/* Icon with count badge */}
                  <div className="relative">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      hasItems ? stage.bgClass : "bg-muted",
                      hasItems ? "text-white" : "text-muted-foreground"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {count > 0 && (
                      <span className={cn(
                        "absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5",
                        "rounded-full text-[10px] font-bold flex items-center justify-center",
                        "bg-foreground text-background shadow-sm"
                      )}>
                        {count}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span className={cn(
                    "text-xs font-medium",
                    hasItems ? stage.textClass : "text-muted-foreground"
                  )}>
                    {stage.label}
                  </span>

                  {/* Volume */}
                  {volume > 0 && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {volume.toFixed(0)} m³
                    </span>
                  )}
                </div>
              </button>

              {/* Arrow connector */}
              {index < STAGES.length - 1 && (
                <div className="flex items-center justify-center w-6 flex-shrink-0">
                  <ArrowRight className={cn(
                    "h-4 w-4",
                    data[STAGES[index + 1].key] > 0 || data[stage.key] > 0
                      ? "text-muted-foreground"
                      : "text-muted-foreground/30"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-muted">
            {data.planification > 0 && (
              <div 
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${(data.planification / total) * 100}%` }}
              />
            )}
            {data.production > 0 && (
              <div 
                className="h-full bg-warning transition-all"
                style={{ width: `${(data.production / total) * 100}%` }}
              />
            )}
            {data.validation > 0 && (
              <div 
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${(data.validation / total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>Entrée</span>
            <span>Sortie</span>
          </div>
        </div>
      )}
    </div>
  );
}
