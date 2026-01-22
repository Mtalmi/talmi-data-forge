import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Play,
  MapPin,
  FileCheck,
  Home,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RotationStepperModal } from './RotationStepperModal';

interface DriverRotationTrackerProps {
  blId: string;
  heureDepart: string | null;
  heureArrivee: string | null;
  heureRetour: string | null;
  workflowStatus: string;
  clientName?: string;
  camionId?: string | null;
  onUpdate: () => void;
}

export function DriverRotationTracker({
  blId,
  heureDepart,
  heureArrivee,
  heureRetour,
  workflowStatus,
  clientName = 'Client',
  camionId = null,
  onUpdate,
}: DriverRotationTrackerProps) {
  const [stepperOpen, setStepperOpen] = useState(false);

  const isDelivered = workflowStatus === 'livre' || workflowStatus === 'facture';

  // Calculate current step (0-indexed for display)
  const getCurrentStep = (): number => {
    if (!heureDepart) return 0;
    if (!heureArrivee) return 1;
    if (!isDelivered) return 2;
    if (!heureRetour) return 3;
    return 4; // All done
  };

  const currentStep = getCurrentStep();
  const isComplete = currentStep === 4;

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return null;
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: fr });
    } catch {
      return timestamp.slice(0, 5);
    }
  };

  const steps = [
    { key: 'depart', label: 'Départ', icon: Play, timestamp: heureDepart, color: 'primary' },
    { key: 'arrivee', label: 'Arrivée', icon: MapPin, timestamp: heureArrivee, color: 'warning' },
    { key: 'signe', label: 'Signé', icon: FileCheck, timestamp: isDelivered ? 'done' : null, color: 'success' },
    { key: 'retour', label: 'Retour', icon: Home, timestamp: heureRetour, color: 'primary' },
  ];

  return (
    <div className="space-y-4">
      {/* Compact Progress Steps */}
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const time = step.timestamp === 'done' ? '✓' : formatTime(step.timestamp);

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isCompleted && 'bg-success text-success-foreground',
                  isCurrent && step.color === 'primary' && 'bg-primary/20 border-2 border-primary text-primary',
                  isCurrent && step.color === 'warning' && 'bg-warning/20 border-2 border-warning text-warning',
                  isCurrent && step.color === 'success' && 'bg-success/20 border-2 border-success text-success',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Step Label */}
              <div className="mt-1.5 text-center">
                <p className={cn(
                  'text-xs font-medium',
                  (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
                {time && (
                  <p className="text-[10px] font-mono text-muted-foreground">{time}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Action Button */}
      <div className="pt-2">
        {isComplete ? (
          <div className="flex items-center justify-center gap-2 p-4 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle className="h-6 w-6 text-success" />
            <span className="text-success font-semibold text-lg">Rotation Complète</span>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full min-h-[60px] text-lg gap-3 touch-manipulation"
            onClick={() => setStepperOpen(true)}
          >
            <span>Étape {currentStep + 1}/4</span>
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Rotation Stepper Modal */}
      <RotationStepperModal
        open={stepperOpen}
        onOpenChange={setStepperOpen}
        blId={blId}
        clientName={clientName}
        camionId={camionId}
        heureDepart={heureDepart}
        heureArrivee={heureArrivee}
        heureRetour={heureRetour}
        workflowStatus={workflowStatus}
        onComplete={onUpdate}
      />
    </div>
  );
}
