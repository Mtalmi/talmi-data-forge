import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Play, MapPin, FileSignature, Home, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DeliveryRotationProgressProps {
  heureDepart: string | null;
  heureArrivee: string | null;
  heureRetour: string | null;
  workflowStatus: string;
  compact?: boolean;
}

export function DeliveryRotationProgress({
  heureDepart,
  heureArrivee,
  heureRetour,
  workflowStatus,
  compact = false,
}: DeliveryRotationProgressProps) {
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return null;
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: fr });
    } catch {
      return null;
    }
  };

  const isDelivered = ['livre', 'facture'].includes(workflowStatus);

  const steps = [
    {
      key: 'depart',
      label: 'Départ',
      icon: Play,
      timestamp: heureDepart,
      completed: !!heureDepart,
      color: 'primary',
    },
    {
      key: 'arrivee',
      label: 'Arrivée',
      icon: MapPin,
      timestamp: heureArrivee,
      completed: !!heureArrivee,
      color: 'warning',
    },
    {
      key: 'livre',
      label: 'Signé',
      icon: FileSignature,
      timestamp: isDelivered ? 'done' : null,
      completed: isDelivered,
      color: 'success',
    },
    {
      key: 'retour',
      label: 'Retour',
      icon: Home,
      timestamp: heureRetour,
      completed: !!heureRetour,
      color: 'primary',
    },
  ];

  // Find current active step
  const activeStepIndex = steps.findIndex(s => !s.completed);

  const activeClassesByColor: Record<string, string> = {
    primary: 'bg-primary/20 text-primary ring-2 ring-primary/50',
    warning: 'bg-warning/20 text-warning ring-2 ring-warning/50',
    success: 'bg-success/20 text-success ring-2 ring-success/50',
  };

  const getActiveClasses = (color: string) => activeClassesByColor[color] || activeClassesByColor.primary;

  if (compact) {
    // Compact view: just show progress dots
    return (
      <div className="flex items-center gap-1">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStepIndex;
          const isCompleted = step.completed;
          
          return (
            <Tooltip key={step.key}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                    isCompleted && "bg-success text-white",
                    isActive && "bg-primary/20 text-primary animate-pulse",
                    !isCompleted && !isActive && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Icon className="h-2.5 w-2.5" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">{step.label}</p>
                {step.timestamp && step.timestamp !== 'done' && (
                  <p className="text-muted-foreground">{formatTime(step.timestamp)}</p>
                )}
                {step.completed && <p className="text-success">✓ Complété</p>}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  // Full view with timestamps
  return (
    <div className="flex items-center justify-between gap-1 py-1">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === activeStepIndex;
        const isCompleted = step.completed;
        const timeStr = step.timestamp && step.timestamp !== 'done' ? formatTime(step.timestamp) : null;
        
        return (
          <div key={step.key} className="flex flex-col items-center flex-1 relative">
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "absolute top-3 left-1/2 w-full h-0.5 -z-10",
                  isCompleted ? "bg-success" : "bg-muted"
                )}
              />
            )}
            
            {/* Step indicator */}
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium z-10 transition-all",
                isCompleted && `bg-success text-white`,
                isActive && cn(getActiveClasses(step.color), 'animate-pulse'),
                !isCompleted && !isActive && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
            </div>
            
            {/* Label and time */}
            <span className={cn(
              "text-[10px] mt-1",
              isCompleted ? "text-success font-medium" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
            {timeStr && (
              <span className="text-[9px] text-muted-foreground font-mono">{timeStr}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
