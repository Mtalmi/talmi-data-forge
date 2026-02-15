import { ClipboardList, Factory, Truck, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface ProductionWorkflowStepperProps {
  currentStatus: string;
  blId?: string;
  bcId?: string | null;
  onNavigate?: (target: 'bc' | 'planning' | 'facture') => void;
}

export function ProductionWorkflowStepper({ 
  currentStatus, 
  blId,
  bcId,
  onNavigate 
}: ProductionWorkflowStepperProps) {
  const { t } = useI18n();

  const STEPS = [
    { key: 'bc', label: t.pages.production.stepBonCommande, icon: ClipboardList, statuses: ['pret_production'] },
    { key: 'production', label: t.pages.production.stepProduction, icon: Factory, statuses: ['production'] },
    { key: 'validation', label: t.pages.production.stepValidation, icon: CheckCircle, statuses: ['validation_technique'] },
    { key: 'livraison', label: t.pages.production.stepLivraison, icon: Truck, statuses: ['en_livraison', 'livre'] },
    { key: 'facture', label: t.pages.production.stepFacture, icon: FileText, statuses: ['facture'] },
  ];

  const getCurrentStepIndex = () => {
    for (let i = 0; i < STEPS.length; i++) {
      if (STEPS[i].statuses.includes(currentStatus)) {
        return i;
      }
    }
    return 1; // Default to production
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto py-2">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isFuture = index > currentIndex;
        const isClickable = (step.key === 'bc' && bcId) || 
                           (step.key === 'planning' && !isFuture) ||
                           (step.key === 'facture' && isCompleted);

        return (
          <div key={step.key} className="flex items-center flex-1">
            <button
              onClick={() => isClickable && onNavigate?.(step.key as 'bc' | 'planning' | 'facture')}
              disabled={!isClickable}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                isClickable && "cursor-pointer hover:scale-105",
                !isClickable && "cursor-default"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isActive && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                isCompleted && "bg-success text-success-foreground",
                isFuture && "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "text-primary",
                isCompleted && "text-success",
                isFuture && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </button>
            
            {index < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2",
                index < currentIndex ? "bg-success" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
