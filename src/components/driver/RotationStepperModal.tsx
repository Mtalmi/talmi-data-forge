import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Fuel,
  Gauge,
  AlertTriangle,
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
  const [retourFormOpen, setRetourFormOpen] = useState(false);
  const [lastKmReading, setLastKmReading] = useState<number | null>(null);
  
  // Retour form state (Final Debrief)
  const [kmCompteur, setKmCompteur] = useState('');
  const [didRefuel, setDidRefuel] = useState(false);
  const [litresCarburant, setLitresCarburant] = useState('');
  const [tempsAttenteReel, setTempsAttenteReel] = useState('');

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

    // For 'retour' step, open the Final Debrief form to collect KM/fuel data
    if (stepKey === 'retour') {
      // Fetch last km reading for this truck
      if (camionId) {
        const { data } = await supabase
          .from('flotte')
          .select('km_compteur')
          .eq('id_camion', camionId)
          .single();
        setLastKmReading(data?.km_compteur || null);
      }
      setRetourFormOpen(true);
      return;
    }

    await executeStep(stepKey);
  };

  const executeStep = async (stepKey: StepKey, extraData?: Record<string, unknown>) => {
    setUpdating(stepKey);
    try {
      const now = new Date().toISOString();
      let updateData: Record<string, unknown> = { ...extraData };

      switch (stepKey) {
        case 'depart':
          updateData.heure_depart_centrale = now;
          setLocalHeureDepart(now);
          break;
        case 'arrivee':
          updateData.heure_arrivee_chantier = now;
          setLocalHeureArrivee(now);
          break;
        case 'retour':
          // Retour is handled by handleRetourSubmit with full debrief
          // This case should not be reached directly
          updateData.heure_retour_centrale = now;
          setLocalHeureRetour(now);
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

  const handleRetourSubmit = async () => {
    setUpdating('retour');
    
    const kmVal = parseFloat(kmCompteur);
    if (isNaN(kmVal) || kmVal <= 0) {
      toast.error('Veuillez entrer le compteur kilométrique');
      setUpdating(null);
      return;
    }

    const litresVal = didRefuel ? parseFloat(litresCarburant) : 0;
    if (didRefuel && (isNaN(litresVal) || litresVal <= 0)) {
      toast.error('Veuillez entrer les litres de carburant');
      setUpdating(null);
      return;
    }

    try {
      const now = new Date().toISOString();
      
      // Calculate km traveled for this rotation
      let kmParcourus: number | null = null;
      let consommation: number | null = null;

      if (lastKmReading && lastKmReading > 0) {
        kmParcourus = kmVal - lastKmReading;
        if (kmParcourus > 0 && litresVal > 0) {
          consommation = (litresVal / kmParcourus) * 100;
        }
      }

      // Parse temps d'attente réel if provided
      const tempsAttenteReelVal = tempsAttenteReel ? parseFloat(tempsAttenteReel) : null;

      // Record fuel entry if refueled
      if (didRefuel && camionId && litresVal > 0) {
        await supabase.from('suivi_carburant').insert([{
          id_camion: camionId,
          litres: litresVal,
          km_compteur: kmVal,
          km_parcourus: kmParcourus,
          consommation_l_100km: consommation,
          date_releve: new Date().toISOString().split('T')[0],
        }]);
      }

      // Update truck km counter and set to Disponible
      if (camionId) {
        await supabase
          .from('flotte')
          .update({ 
            km_compteur: kmVal,
            statut: 'Disponible',
            bc_mission_id: null,
          })
          .eq('id_camion', camionId);
      }

      // Update BL with all debrief data
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({
          heure_retour_centrale: now,
          km_parcourus: kmParcourus,
          km_final: kmVal,
          litres_ajoutes: litresVal > 0 ? litresVal : null,
          consommation_calculee: consommation,
          temps_attente_reel_minutes: tempsAttenteReelVal,
          debrief_valide: true,
          debrief_at: now,
        })
        .eq('bl_id', blId);

      if (error) throw error;

      setLocalHeureRetour(now);
      toast.success('🏠 Rotation validée - Camion libéré!', {
        description: `KM: ${kmVal} ${litresVal > 0 ? `• Carburant: ${litresVal}L` : ''} ${consommation ? `• ${consommation.toFixed(1)} L/100km` : ''}`,
      });
      
      setRetourFormOpen(false);
      onComplete();
      
      // Close modal after a brief delay
      setTimeout(() => onOpenChange(false), 1500);
      
      // Reset form
      setKmCompteur('');
      setDidRefuel(false);
      setLitresCarburant('');
      setTempsAttenteReel('');
    } catch (error) {
      console.error('Error completing debrief:', error);
      toast.error("Erreur lors de la validation");
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

      {/* Final Debrief Dialog for KM/Fuel/Waiting Time Entry */}
      <Dialog open={retourFormOpen} onOpenChange={setRetourFormOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-success" />
              Validation de Fin de Rotation
            </DialogTitle>
            <DialogDescription>
              {blId} • {camionId} — Données obligatoires avant libération du camion
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Previous KM Info */}
            {lastKmReading && (
              <div className="p-3 bg-muted/50 rounded-lg border text-sm">
                <span className="text-muted-foreground">Dernier relevé:</span>{' '}
                <span className="font-mono font-semibold">{lastKmReading.toLocaleString()} km</span>
              </div>
            )}

            {/* KM Final - Required */}
            <div className="space-y-2">
              <Label htmlFor="km-compteur" className="flex items-center gap-2 font-semibold">
                <Gauge className="h-4 w-4 text-primary" />
                KM Final (Compteur) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="km-compteur"
                type="number"
                placeholder="Ex: 125430"
                value={kmCompteur}
                onChange={(e) => setKmCompteur(e.target.value)}
                className="text-lg font-mono"
              />
              {lastKmReading && kmCompteur && parseFloat(kmCompteur) > lastKmReading && (
                <p className="text-xs text-muted-foreground">
                  Distance parcourue: <span className="font-mono font-semibold text-foreground">{(parseFloat(kmCompteur) - lastKmReading).toLocaleString()} km</span>
                </p>
              )}
            </div>

            {/* Fuel Checkbox */}
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg border">
              <Checkbox
                id="did-refuel"
                checked={didRefuel}
                onCheckedChange={(checked) => setDidRefuel(!!checked)}
              />
              <Label htmlFor="did-refuel" className="flex items-center gap-2 cursor-pointer">
                <Fuel className="h-4 w-4" />
                Carburant Ajouté
              </Label>
            </div>

            {/* Fuel Amount - Conditional */}
            {didRefuel && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label htmlFor="litres-carburant" className="flex items-center gap-2 font-semibold">
                  <Fuel className="h-4 w-4 text-warning" />
                  Litres de Carburant <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="litres-carburant"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 85.5"
                  value={litresCarburant}
                  onChange={(e) => setLitresCarburant(e.target.value)}
                  className="text-lg font-mono"
                />
                {kmCompteur && lastKmReading && litresCarburant && parseFloat(litresCarburant) > 0 && (
                  <p className="text-xs text-success">
                    Consommation estimée: <span className="font-mono font-semibold">
                      {((parseFloat(litresCarburant) / (parseFloat(kmCompteur) - lastKmReading)) * 100).toFixed(1)} L/100km
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Temps d'Attente Réel - Optional */}
            <div className="space-y-2">
              <Label htmlFor="temps-attente" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Temps d'Attente Réel (minutes)
              </Label>
              <Input
                id="temps-attente"
                type="number"
                placeholder="Laisser vide si pas de correction"
                value={tempsAttenteReel}
                onChange={(e) => setTempsAttenteReel(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Uniquement si différent du temps calculé automatiquement
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRetourFormOpen(false)}
              disabled={updating === 'retour'}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 gap-2 bg-success hover:bg-success/90"
              onClick={handleRetourSubmit}
              disabled={updating === 'retour'}
            >
              {updating === 'retour' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Valider & Libérer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
