import { format } from 'date-fns';

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
      return format(new Date(timestamp), 'HH:mm');
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
      gradient: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      ringColor: 'ring-emerald-500/40',
    },
    {
      key: 'arrivee',
      label: 'Arrivée',
      icon: MapPin,
      timestamp: heureArrivee,
      completed: !!heureArrivee,
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
      ringColor: 'ring-amber-500/40',
    },
    {
      key: 'livre',
      label: 'Signé',
      icon: FileSignature,
      timestamp: isDelivered ? 'done' : null,
      completed: isDelivered,
      gradient: 'from-green-500 to-emerald-500',
      bgLight: 'bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400',
      ringColor: 'ring-green-500/40',
    },
    {
      key: 'retour',
      label: 'Retour',
      icon: Home,
      timestamp: heureRetour,
      completed: !!heureRetour,
      gradient: 'from-rose-500 to-pink-500',
      bgLight: 'bg-rose-500/10',
      textColor: 'text-rose-600 dark:text-rose-400',
      ringColor: 'ring-rose-500/40',
    },
  ];

  // Find current active step
  const activeStepIndex = steps.findIndex(s => !s.completed);

  if (compact) {
    // Premium compact view with gradient indicators
    return (
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStepIndex;
          const isCompleted = step.completed;
          
          return (
            <Tooltip key={step.key}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted && `bg-gradient-to-br ${step.gradient} shadow-lg`,
                    isActive && cn(step.bgLight, `ring-2 ${step.ringColor}`),
                    !isCompleted && !isActive && "bg-muted/60 border border-border/50"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-white drop-shadow-sm" />
                  ) : (
                    <Icon className={cn(
                      "h-3.5 w-3.5 transition-all",
                      isActive ? step.textColor : "text-muted-foreground/60"
                    )} />
                  )}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" 
                          style={{ animationDuration: '2s' }} />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-popover/95 backdrop-blur-sm border-border/50 shadow-xl"
              >
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold text-sm">{step.label}</p>
                  {step.timestamp && step.timestamp !== 'done' && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatTime(step.timestamp)}
                    </p>
                  )}
                  {step.completed && (
                    <p className="text-xs text-success font-medium">✓ Complété</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  // Premium full view with elegant styling
  return (
    <div className="relative py-2">
      {/* Background connector line */}
      <div className="absolute top-[22px] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-muted via-muted to-muted rounded-full" />
      
      {/* Completed progress line overlay */}
      {activeStepIndex > 0 && (
        <div 
          className="absolute top-[22px] left-[16%] h-[2px] bg-gradient-to-r from-emerald-500 via-amber-500 to-green-500 rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.min((activeStepIndex / (steps.length - 1)) * 68, 68)}%`
          }}
        />
      )}
      
      <div className="flex items-start justify-between relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStepIndex;
          const isCompleted = step.completed;
          const timeStr = step.timestamp && step.timestamp !== 'done' ? formatTime(step.timestamp) : null;
          
          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              {/* Step indicator */}
              <div
                className={cn(
                  "relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted && `bg-gradient-to-br ${step.gradient} shadow-lg shadow-${step.gradient.split('-')[1]}-500/25`,
                  isActive && cn(step.bgLight, `ring-2 ${step.ringColor} backdrop-blur-sm`),
                  !isCompleted && !isActive && "bg-muted/40 border-2 border-dashed border-border/60"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4.5 w-4.5 text-white drop-shadow-sm" />
                ) : (
                  <Icon className={cn(
                    "h-4 w-4 transition-all",
                    isActive ? step.textColor : "text-muted-foreground/50"
                  )} />
                )}
                
                {/* Active pulse ring */}
                {isActive && (
                  <span 
                    className={cn("absolute inset-0 rounded-full animate-ping", step.bgLight)}
                    style={{ animationDuration: '2.5s', opacity: 0.4 }} 
                  />
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-[11px] font-medium mt-1.5 transition-colors",
                isCompleted ? step.textColor : isActive ? step.textColor : "text-muted-foreground/70"
              )}>
                {step.label}
              </span>
              
              {/* Time badge */}
              {timeStr && (
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-md mt-0.5",
                  isCompleted 
                    ? `${step.bgLight} ${step.textColor}` 
                    : "bg-muted/50 text-muted-foreground"
                )}>
                  {timeStr}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
