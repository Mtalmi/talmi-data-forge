import { useState } from 'react';
import { Lock, Unlock, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticSuccess, hapticError } from '@/lib/haptics';
import { QCDepartureGate } from './QCDepartureGate';

interface QualityLockButtonProps {
  blId: string;
  camion?: string;
  formule?: string;
  volume?: number;
  isUnlocked: boolean;
  onUnlock: () => void;
  onSendToDelivery?: () => void;
  className?: string;
}

/**
 * Red-to-Green Quality Lock Button
 * Shows a RED lock by default, opens QC modal on click,
 * animates to GREEN checkmark when QC is completed
 */
export function QualityLockButton({
  blId,
  camion,
  formule,
  volume,
  isUnlocked,
  onUnlock,
  onSendToDelivery,
  className,
}: QualityLockButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleQCApproved = () => {
    setIsAnimating(true);
    hapticSuccess();
    
    // Animate the lock transition
    setTimeout(() => {
      onUnlock();
      setIsAnimating(false);
    }, 600);
  };

  if (isUnlocked) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Green Unlocked State */}
        <div 
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-success/20 border border-success/50",
            "transition-all duration-500",
            isAnimating && "animate-scale-in"
          )}
        >
          <CheckCircle className="h-5 w-5 text-success animate-pulse" />
          <span className="text-sm font-semibold text-success">QC Validé</span>
        </div>
        
        {/* Release Button - Only enabled after QC */}
        <Button
          size="sm"
          className={cn(
            "h-9 gap-2 bg-success hover:bg-success/90",
            "transition-all duration-300",
            "animate-fade-in"
          )}
          onClick={(e) => {
            e.stopPropagation();
            hapticSuccess();
            onSendToDelivery?.();
          }}
        >
          <Unlock className="h-4 w-4" />
          Lancer Livraison
        </Button>
      </div>
    );
  }

  return (
    <QCDepartureGate
      blId={blId}
      camion={camion}
      formule={formule}
      volume={volume}
      onApproved={handleQCApproved}
      trigger={
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "h-9 gap-2",
            "border-destructive text-destructive",
            "hover:bg-destructive hover:text-destructive-foreground",
            "transition-all duration-300",
            isAnimating && "animate-pulse",
            className
          )}
          onClick={(e) => {
            e.stopPropagation();
            hapticError();
          }}
        >
          {isAnimating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          <span>Verrou de Qualité</span>
        </Button>
      }
    />
  );
}
