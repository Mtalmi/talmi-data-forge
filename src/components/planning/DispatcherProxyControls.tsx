import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Radio, CheckCircle } from 'lucide-react';
import { RotationStepperModal } from '@/components/driver/RotationStepperModal';

interface DispatcherProxyControlsProps {
  blId: string;
  heureDepart: string | null;
  heureArrivee: string | null;
  heureRetour: string | null;
  workflowStatus: string;
  clientName?: string;
  camionId?: string | null;
  onUpdate: () => void;
}

export function DispatcherProxyControls({
  blId,
  heureDepart,
  heureArrivee,
  heureRetour,
  workflowStatus,
  clientName = 'Client',
  camionId = null,
  onUpdate,
}: DispatcherProxyControlsProps) {
  const [stepperOpen, setStepperOpen] = useState(false);

  const isDelivered = ['livre', 'facture'].includes(workflowStatus);

  // Calculate current step for badge
  const getCurrentStep = (): number => {
    if (!heureDepart) return 1;
    if (!heureArrivee) return 2;
    if (!isDelivered) return 3;
    if (!heureRetour) return 4;
    return 4; // Complete
  };

  const currentStep = getCurrentStep();
  const isComplete = heureDepart && heureArrivee && isDelivered && heureRetour;

  if (isComplete) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 px-3 bg-success/10 rounded-lg border border-success/20">
        <CheckCircle className="h-4 w-4 text-success" />
        <span className="text-success font-medium text-sm">Rotation Complète</span>
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={(e) => {
          e.stopPropagation();
          setStepperOpen(true);
        }}
        className={cn(
          "gap-2 h-9 px-4",
          "bg-muted/80 hover:bg-muted border border-border/50",
          "shadow-sm hover:shadow-md transition-all"
        )}
      >
        <Radio className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-xs font-semibold">Rotation</span>
        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
          {currentStep}/4
        </span>
      </Button>

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
    </>
  );
}
