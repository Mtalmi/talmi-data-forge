import { FileText, ShoppingCart, Truck, Receipt, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WorkflowStage = 'devis' | 'bc' | 'bl' | 'facture';

interface WorkflowStepperProps {
  currentStage?: WorkflowStage;
  onStageClick?: (stage: WorkflowStage) => void;
  compact?: boolean;
}

const WORKFLOW_STAGES: { id: WorkflowStage; label: string; icon: React.ReactNode; description: string; isExternal?: boolean }[] = [
  { id: 'devis', label: 'Devis', icon: <FileText className="h-5 w-5" />, description: 'Proposition commerciale' },
  { id: 'bc', label: 'Bon de Commande', icon: <ShoppingCart className="h-5 w-5" />, description: 'Commande validée' },
  { id: 'bl', label: 'Bon de Livraison', icon: <Truck className="h-5 w-5" />, description: 'Planning & Dispatch', isExternal: true },
  { id: 'facture', label: 'Facture', icon: <Receipt className="h-5 w-5" />, description: 'Facturation' },
];

export function WorkflowStepper({ currentStage, onStageClick, compact = false }: WorkflowStepperProps) {
  const currentIndex = currentStage ? WORKFLOW_STAGES.findIndex(s => s.id === currentStage) : -1;

  return (
    <div className={cn(
      "flex items-center justify-between w-full",
      compact ? "gap-1" : "gap-2"
    )}>
      {WORKFLOW_STAGES.map((stage, index) => {
        const isActive = stage.id === currentStage;
        const isCompleted = currentIndex > -1 && index < currentIndex;
        const isClickable = !!onStageClick;

        return (
          <div key={stage.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <button
              onClick={() => onStageClick?.(stage.id)}
              disabled={!isClickable}
              className={cn(
                "flex flex-col items-center gap-1 flex-1 py-2 px-1 rounded-lg transition-all",
                isClickable && "hover:bg-muted/50 cursor-pointer",
                !isClickable && "cursor-default"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all",
                  compact ? "h-8 w-8" : "h-10 w-10",
                  isActive && "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20",
                  isCompleted && "bg-success text-success-foreground",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <CheckCircle className={cn(compact ? "h-4 w-4" : "h-5 w-5")} /> : stage.icon}
              </div>
              <span
                className={cn(
                  "text-center transition-colors flex items-center gap-0.5",
                  compact ? "text-[10px]" : "text-xs",
                  isActive && "text-primary font-semibold",
                  isCompleted && "text-success font-medium",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}
              >
                {stage.label}
                {stage.isExternal && <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />}
              </span>
              {!compact && (
                <span className="text-[10px] text-muted-foreground text-center hidden sm:block">
                  {stage.description}
                </span>
              )}
            </button>

            {/* Connector Line */}
            {index < WORKFLOW_STAGES.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-shrink-0 transition-colors",
                  compact ? "w-4" : "w-8",
                  index < currentIndex ? "bg-success" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
