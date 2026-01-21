import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Play,
  MapPin,
  FileSignature,
  Home,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DriverRotationTrackerProps {
  blId: string;
  heureDepart: string | null;
  heureArrivee: string | null;
  heureRetour: string | null;
  workflowStatus: string;
  onUpdate: () => void;
}

export function DriverRotationTracker({
  blId,
  heureDepart,
  heureArrivee,
  heureRetour,
  workflowStatus,
  onUpdate,
}: DriverRotationTrackerProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const recordStep = async (step: 'depart' | 'arrivee' | 'livre' | 'retour') => {
    setUpdating(step);
    try {
      const now = new Date().toISOString();
      let updateData: Record<string, unknown> = {};

      switch (step) {
        case 'depart':
          updateData = { heure_depart_centrale: now };
          break;
        case 'arrivee':
          updateData = { heure_arrivee_chantier: now };
          break;
        case 'livre':
          updateData = { 
            workflow_status: 'livre',
            validated_at: now,
          };
          break;
        case 'retour':
          updateData = { heure_retour_centrale: now };
          break;
      }

      const { error } = await supabase
        .from('bons_livraison_reels')
        .update(updateData)
        .eq('bl_id', blId);

      if (error) throw error;

      const labels: Record<string, string> = {
        depart: 'Départ enregistré',
        arrivee: 'Arrivée sur chantier',
        livre: 'Livraison confirmée',
        retour: 'Retour à la centrale',
      };
      toast.success(labels[step]);
      onUpdate();
    } catch (error) {
      console.error('Error recording step:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setUpdating(null);
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return null;
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: fr });
    } catch {
      return timestamp.slice(0, 5);
    }
  };

  const isDelivered = workflowStatus === 'livre' || workflowStatus === 'facture';
  const isEnRoute = workflowStatus === 'en_livraison';

  // Determine current step
  const getActiveStep = () => {
    if (!heureDepart) return 0; // Need to record departure
    if (!heureArrivee) return 1; // En route, need to record arrival
    if (!isDelivered) return 2; // Arrived, need to confirm delivery
    if (!heureRetour) return 3; // Delivered, need to record return
    return 4; // All done
  };

  const activeStep = getActiveStep();

  const steps = [
    {
      key: 'depart',
      label: 'Départ',
      sublabel: 'Centrale',
      icon: Play,
      timestamp: heureDepart,
      color: 'primary',
    },
    {
      key: 'arrivee',
      label: 'Arrivée',
      sublabel: 'Chantier',
      icon: MapPin,
      timestamp: heureArrivee,
      color: 'warning',
    },
    {
      key: 'livre',
      label: 'BL Signé',
      sublabel: 'Livraison OK',
      icon: FileSignature,
      timestamp: isDelivered ? 'done' : null,
      color: 'success',
    },
    {
      key: 'retour',
      label: 'Retour',
      sublabel: 'Centrale',
      icon: Home,
      timestamp: heureRetour,
      color: 'primary',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Progress Steps */}
      <div className="flex items-start justify-between gap-1">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < activeStep;
          const isCurrent = index === activeStep;
          const time = step.timestamp === 'done' ? '✓' : formatTime(step.timestamp);

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  'relative w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  isCompleted && `bg-${step.color} text-${step.color}-foreground`,
                  isCurrent && `bg-${step.color}/20 border-2 border-${step.color} text-${step.color}`,
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground',
                  isCompleted && step.color === 'primary' && 'bg-primary text-primary-foreground',
                  isCompleted && step.color === 'warning' && 'bg-warning text-warning-foreground',
                  isCompleted && step.color === 'success' && 'bg-success text-success-foreground',
                  isCurrent && step.color === 'primary' && 'bg-primary/20 border-primary text-primary',
                  isCurrent && step.color === 'warning' && 'bg-warning/20 border-warning text-warning',
                  isCurrent && step.color === 'success' && 'bg-success/20 border-success text-success'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-center">
                <p className={cn(
                  'text-xs font-semibold',
                  (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
                {time && (
                  <p className="text-xs font-mono text-muted-foreground">{time}</p>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute h-0.5 w-full top-6 left-1/2',
                    isCompleted ? 'bg-success' : 'bg-border'
                  )}
                  style={{ display: 'none' }} // Hidden for now, using gap
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Action Button - Large Touch Target */}
      <div className="pt-2">
        {activeStep === 0 && isEnRoute && (
          <Button
            size="lg"
            className="w-full min-h-[60px] text-lg gap-3 bg-primary hover:bg-primary/90 touch-manipulation"
            onClick={() => recordStep('depart')}
            disabled={updating !== null}
          >
            {updating === 'depart' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Play className="h-6 w-6" />
                Départ de la Centrale
              </>
            )}
          </Button>
        )}

        {activeStep === 1 && (
          <Button
            size="lg"
            className="w-full min-h-[60px] text-lg gap-3 bg-warning hover:bg-warning/90 text-warning-foreground touch-manipulation"
            onClick={() => recordStep('arrivee')}
            disabled={updating !== null}
          >
            {updating === 'arrivee' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <MapPin className="h-6 w-6" />
                Arrivé sur Chantier
              </>
            )}
          </Button>
        )}

        {activeStep === 2 && (
          <Button
            size="lg"
            className="w-full min-h-[60px] text-lg gap-3 bg-success hover:bg-success/90 touch-manipulation"
            onClick={() => recordStep('livre')}
            disabled={updating !== null}
          >
            {updating === 'livre' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <FileSignature className="h-6 w-6" />
                BL Signé - Confirmer Livraison
              </>
            )}
          </Button>
        )}

        {activeStep === 3 && (
          <Button
            size="lg"
            variant="outline"
            className="w-full min-h-[60px] text-lg gap-3 touch-manipulation"
            onClick={() => recordStep('retour')}
            disabled={updating !== null}
          >
            {updating === 'retour' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Home className="h-6 w-6" />
                Retour à la Centrale
              </>
            )}
          </Button>
        )}

        {activeStep === 4 && (
          <div className="flex items-center justify-center gap-2 p-4 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle className="h-6 w-6 text-success" />
            <span className="text-success font-semibold text-lg">Rotation Complète</span>
          </div>
        )}
      </div>

      {/* Time Summary (when completed) */}
      {heureDepart && heureArrivee && (
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Départ: {formatTime(heureDepart)}</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>Arrivée: {formatTime(heureArrivee)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
