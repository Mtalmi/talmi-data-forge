import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Play,
  MapPin,
  FileSignature,
  Home,
  Radio,
  Clock,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface DispatcherProxyControlsProps {
  blId: string;
  heureDepart: string | null;
  heureArrivee: string | null;
  heureRetour: string | null;
  workflowStatus: string;
  onUpdate: () => void;
}

type StepKey = 'depart' | 'arrivee' | 'livre' | 'retour';

export function DispatcherProxyControls({
  blId,
  heureDepart,
  heureArrivee,
  heureRetour,
  workflowStatus,
  onUpdate,
}: DispatcherProxyControlsProps) {
  const [updating, setUpdating] = useState<StepKey | null>(null);
  const [manualTimeDialogOpen, setManualTimeDialogOpen] = useState(false);
  const [pendingStep, setPendingStep] = useState<StepKey | null>(null);
  const [manualTime, setManualTime] = useState('');

  const isDelivered = ['livre', 'facture'].includes(workflowStatus);

  // Determine which step is next
  const getActiveStep = (): StepKey | null => {
    if (!heureDepart) return 'depart';
    if (!heureArrivee) return 'arrivee';
    if (!isDelivered) return 'livre';
    if (!heureRetour) return 'retour';
    return null; // All done
  };

  const activeStep = getActiveStep();

  const recordStep = async (step: StepKey, customTime?: string) => {
    setUpdating(step);
    try {
      const timestamp = customTime 
        ? new Date(`${new Date().toISOString().split('T')[0]}T${customTime}:00`).toISOString()
        : new Date().toISOString();
      
      let updateData: Record<string, unknown> = {};

      switch (step) {
        case 'depart':
          updateData = { heure_depart_centrale: timestamp };
          break;
        case 'arrivee':
          updateData = { heure_arrivee_chantier: timestamp };
          break;
        case 'livre':
          updateData = { 
            workflow_status: 'livre',
            validated_at: timestamp,
          };
          break;
        case 'retour':
          updateData = { heure_retour_centrale: timestamp };
          break;
      }

      const { error } = await supabase
        .from('bons_livraison_reels')
        .update(updateData)
        .eq('bl_id', blId);

      if (error) throw error;

      const labels: Record<StepKey, string> = {
        depart: '📍 Départ enregistré (Proxy)',
        arrivee: '📍 Arrivée enregistrée (Proxy)',
        livre: '✅ Livraison confirmée (Proxy)',
        retour: '🏠 Retour enregistré (Proxy)',
      };
      
      toast.success(labels[step], {
        description: customTime ? `Heure manuelle: ${customTime}` : 'Horodatage actuel',
      });
      onUpdate();
    } catch (error) {
      console.error('Error recording proxy step:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setUpdating(null);
      setManualTimeDialogOpen(false);
      setPendingStep(null);
      setManualTime('');
    }
  };

  const handleManualTimeSubmit = () => {
    if (!manualTime || !pendingStep) {
      toast.error('Veuillez entrer une heure valide');
      return;
    }
    recordStep(pendingStep, manualTime);
  };

  const openManualTimeDialog = (step: StepKey) => {
    setPendingStep(step);
    setManualTime(new Date().toTimeString().slice(0, 5)); // Default to current time
    setManualTimeDialogOpen(true);
  };

  const steps = [
    {
      key: 'depart' as StepKey,
      label: 'Départ',
      icon: Play,
      timestamp: heureDepart,
      color: 'primary',
    },
    {
      key: 'arrivee' as StepKey,
      label: 'Arrivée',
      icon: MapPin,
      timestamp: heureArrivee,
      color: 'warning',
    },
    {
      key: 'livre' as StepKey,
      label: 'Signé',
      icon: FileSignature,
      timestamp: isDelivered ? 'done' : null,
      color: 'success',
    },
    {
      key: 'retour' as StepKey,
      label: 'Retour',
      icon: Home,
      timestamp: heureRetour,
      color: 'primary',
    },
  ];

  if (!activeStep) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 px-3 bg-success/10 rounded-lg border border-success/20">
        <CheckCircle className="h-4 w-4 text-success" />
        <span className="text-success font-medium text-sm">Rotation Complète</span>
      </div>
    );
  }

  const currentStep = steps.find(s => s.key === activeStep);
  if (!currentStep) return null;

  const Icon = currentStep.icon;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "gap-2 h-9 px-3 border-dashed",
              "hover:border-primary hover:bg-primary/5"
            )}
          >
            <Radio className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Proxy Dispatch</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-3" onClick={e => e.stopPropagation()}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Radio className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Mode Proxy Dispatcher</p>
                <p className="text-xs text-muted-foreground">Contrôle manuel pour {blId}</p>
              </div>
            </div>

            {/* Next Step Action */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Prochaine étape:</p>
              
              {/* Quick Action - Current Time */}
              <Button
                size="sm"
                className={cn(
                  "w-full gap-2 justify-start",
                  currentStep.color === 'warning' && "bg-warning hover:bg-warning/90 text-warning-foreground",
                  currentStep.color === 'success' && "bg-success hover:bg-success/90",
                )}
                onClick={() => recordStep(activeStep)}
                disabled={updating !== null}
              >
                {updating === activeStep ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span>{currentStep.label}</span>
                <span className="text-xs opacity-75 ml-auto">Maintenant</span>
              </Button>

              {/* Manual Time Entry */}
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 justify-start"
                onClick={() => openManualTimeDialog(activeStep)}
                disabled={updating !== null}
              >
                <Clock className="h-4 w-4" />
                <span>{currentStep.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">Heure manuelle</span>
              </Button>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-2 bg-warning/10 rounded-md border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning-foreground">
                Mode proxy: utilisez uniquement si le chauffeur ne peut pas enregistrer lui-même.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Manual Time Dialog */}
      <Dialog open={manualTimeDialogOpen} onOpenChange={setManualTimeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Heure Manuelle - {pendingStep && steps.find(s => s.key === pendingStep)?.label}
            </DialogTitle>
            <DialogDescription>
              Entrez l'heure communiquée par le chauffeur via radio/téléphone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="manual-time">Heure (HH:MM)</Label>
              <Input
                id="manual-time"
                type="time"
                value={manualTime}
                onChange={e => setManualTime(e.target.value)}
                className="text-center text-lg font-mono"
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Radio className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">BL: {blId}</p>
                <p>Cette action sera enregistrée comme "proxy dispatch" dans le journal.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setManualTimeDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleManualTimeSubmit}
              disabled={!manualTime || updating !== null}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
