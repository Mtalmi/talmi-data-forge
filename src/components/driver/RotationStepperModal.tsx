import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Play,
  MapPin,
  FileCheck,
  Home,
  Check,
  Loader2,
  ChevronRight,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProofOfDeliveryModal } from './ProofOfDeliveryModal';

interface RotationStepperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blId: string;
  clientName: string;
  camionId: string | null;
  heureDepart: string | null;
  heureArrivee: string | null;
  heureRetour: string | null;
  workflowStatus: string;
  onComplete: () => void;
}

type StepKey = 'depart' | 'arrivee' | 'signe' | 'retour';

interface Step {
  key: StepKey;
  label: string;
  sublabel: string;
  icon: typeof Play;
  color: string;
}

const steps: Step[] = [
  { key: 'depart', label: 'Départ', sublabel: 'Quitter la centrale', icon: Play, color: 'primary' },
  { key: 'arrivee', label: 'Arrivée', sublabel: 'Sur le chantier', icon: MapPin, color: 'warning' },
  { key: 'signe', label: 'Signé', sublabel: 'Preuve de livraison', icon: FileCheck, color: 'success' },
  { key: 'retour', label: 'Retour', sublabel: 'Centrale & libérer camion', icon: Home, color: 'primary' },
];

export function RotationStepperModal({
  open,
  onOpenChange,
  blId,
  clientName,
  camionId,
  heureDepart,
  heureArrivee,
  heureRetour,
  workflowStatus,
  onComplete,
}: RotationStepperModalProps) {
  const [localHeureDepart, setLocalHeureDepart] = useState(heureDepart);
  const [localHeureArrivee, setLocalHeureArrivee] = useState(heureArrivee);
  const [localHeureRetour, setLocalHeureRetour] = useState(heureRetour);
  const [localWorkflowStatus, setLocalWorkflowStatus] = useState(workflowStatus);
  const [updating, setUpdating] = useState<StepKey | null>(null);
  const [proofModalOpen, setProofModalOpen] = useState(false);

  // Sync props with local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalHeureDepart(heureDepart);
      setLocalHeureArrivee(heureArrivee);
      setLocalHeureRetour(heureRetour);
      setLocalWorkflowStatus(workflowStatus);
    }
  }, [open, heureDepart, heureArrivee, heureRetour, workflowStatus]);

  const isDelivered = ['livre', 'facture'].includes(localWorkflowStatus);

  // Determine current step (0-indexed)
  const getCurrentStep = (): number => {
    if (!localHeureDepart) return 0;
    if (!localHeureArrivee) return 1;
    if (!isDelivered) return 2;
    if (!localHeureRetour) return 3;
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

  const recordStep = async (stepKey: StepKey) => {
    // For 'signe' step, open the Proof of Delivery modal
    if (stepKey === 'signe') {
      setProofModalOpen(true);
      return;
    }

    setUpdating(stepKey);
    try {
      const now = new Date().toISOString();
      let updateData: Record<string, unknown> = {};

      switch (stepKey) {
        case 'depart':
          updateData = { heure_depart_centrale: now };
          setLocalHeureDepart(now);
          break;
        case 'arrivee':
          updateData = { heure_arrivee_chantier: now };
          setLocalHeureArrivee(now);
          break;
        case 'retour':
          updateData = { heure_retour_centrale: now };
          setLocalHeureRetour(now);
          // Also free up the truck!
          if (camionId) {
            await supabase
              .from('flotte')
              .update({ statut: 'Disponible' })
              .eq('id_camion', camionId);
          }
          break;
      }

      const { error } = await supabase
        .from('bons_livraison_reels')
        .update(updateData)
        .eq('bl_id', blId);

      if (error) throw error;

      const labels: Record<StepKey, string> = {
        depart: '📍 Départ enregistré',
        arrivee: '📍 Arrivée enregistrée',
        signe: '✅ BL signé',
        retour: '🏠 Retour enregistré - Camion libéré!',
      };

      toast.success(labels[stepKey]);
      onComplete();

      // If this was the last step, close modal after a brief delay
      if (stepKey === 'retour') {
        setTimeout(() => onOpenChange(false), 1500);
      }
    } catch (error) {
      console.error('Error recording step:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setUpdating(null);
    }
  };

  const handleProofComplete = async (proofData: {
    photoUrl?: string;
    signatureDataUrl: string;
    signerName: string;
    signedAt: string;
  }) => {
    setUpdating('signe');
    try {
      const justificationParts = [
        `Signé par: ${proofData.signerName}`,
        proofData.photoUrl ? `Photo BL: ${proofData.photoUrl}` : 'Sans photo BL',
        'Signature digitale capturée',
      ];

      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({
          workflow_status: 'livre',
          validated_at: proofData.signedAt,
          justification_ecart: justificationParts.join(' | '),
        })
        .eq('bl_id', blId);

      if (error) throw error;

      setLocalWorkflowStatus('livre');
      toast.success('✅ BL signé et archivé', {
        description: `Signé par ${proofData.signerName}`,
      });
      onComplete();
    } catch (error) {
      console.error('Error completing proof:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setUpdating(null);
    }
  };

  const getStepStatus = (index: number): 'completed' | 'current' | 'pending' => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const getStepTimestamp = (stepKey: StepKey): string | null => {
    switch (stepKey) {
      case 'depart': return localHeureDepart;
      case 'arrivee': return localHeureArrivee;
      case 'signe': return isDelivered ? 'done' : null;
      case 'retour': return localHeureRetour;
      default: return null;
    }
  };

  return (
    <>
      <Dialog open={open && !proofModalOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Rotation {blId}
              </span>
              <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                {currentStep}/4 étapes
              </span>
            </DialogTitle>
            <DialogDescription>
              {clientName} {camionId && `• ${camionId}`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Steps Progress */}
            <div className="space-y-3">
              {steps.map((step, index) => {
                const status = getStepStatus(index);
                const Icon = step.icon;
                const timestamp = getStepTimestamp(step.key);
                const time = timestamp === 'done' ? '✓' : formatTime(timestamp);
                const isUpdating = updating === step.key;

                return (
                  <div
                    key={step.key}
                    className={cn(
                      "relative flex items-center gap-4 p-4 rounded-lg border transition-all",
                      status === 'completed' && "bg-success/10 border-success/30",
                      status === 'current' && "bg-primary/5 border-primary shadow-sm",
                      status === 'pending' && "bg-muted/30 border-border opacity-60"
                    )}
                  >
                    {/* Step Number/Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                        status === 'completed' && "bg-success text-success-foreground",
                        status === 'current' && step.color === 'primary' && "bg-primary text-primary-foreground",
                        status === 'current' && step.color === 'warning' && "bg-warning text-warning-foreground",
                        status === 'current' && step.color === 'success' && "bg-success text-success-foreground",
                        status === 'pending' && "bg-muted text-muted-foreground"
                      )}
                    >
                      {status === 'completed' ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={cn(
                            "font-semibold",
                            status === 'pending' && "text-muted-foreground"
                          )}>
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {step.sublabel}
                          </p>
                        </div>
                        {time && (
                          <span className="text-sm font-mono text-muted-foreground">
                            {time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button (only for current step) */}
                    {status === 'current' && (
                      <Button
                        size="sm"
                        onClick={() => recordStep(step.key)}
                        disabled={isUpdating}
                        className={cn(
                          "gap-2 shrink-0",
                          step.color === 'warning' && "bg-warning hover:bg-warning/90 text-warning-foreground",
                          step.color === 'success' && "bg-success hover:bg-success/90"
                        )}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {step.key === 'signe' ? 'Signer' : 'Confirmer'}
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-10 top-[68px] w-0.5 h-3",
                          status === 'completed' ? "bg-success" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Completion Message */}
            {isComplete && (
              <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/30 text-center">
                <div className="flex items-center justify-center gap-2 text-success font-semibold">
                  <Check className="h-5 w-5" />
                  Rotation Complète!
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {camionId && (
                    <>Camion <span className="font-medium">{camionId}</span> libéré et disponible</>
                  )}
                </p>
              </div>
            )}

            {/* Truck Info Banner */}
            {camionId && !isComplete && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg border flex items-center gap-3">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">{camionId}</p>
                  <p className="text-xs text-muted-foreground">
                    Sera libéré à l'étape 4/4 (Retour)
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Proof of Delivery Modal for Signature Step */}
      <ProofOfDeliveryModal
        open={proofModalOpen}
        onOpenChange={setProofModalOpen}
        blId={blId}
        clientName={clientName}
        onComplete={handleProofComplete}
      />
    </>
  );
}
