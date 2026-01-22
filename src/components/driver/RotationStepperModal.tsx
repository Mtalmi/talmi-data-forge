import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
  Truck,
  Fuel,
  Gauge,
  Clock,
  Timer,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
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
  { key: 'retour', label: 'Retour', sublabel: 'Fin de mission', icon: Home, color: 'primary' },
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
  const [lastKmReading, setLastKmReading] = useState<number | null>(null);
  
  // Retour form state (Fin de Mission)
  const [kmFinal, setKmFinal] = useState('');
  const [didRefuel, setDidRefuel] = useState(false);
  const [litresCarburant, setLitresCarburant] = useState('');
  const [noteAttente, setNoteAttente] = useState('');

  // Sync props with local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalHeureDepart(heureDepart);
      setLocalHeureArrivee(heureArrivee);
      setLocalHeureRetour(heureRetour);
      setLocalWorkflowStatus(workflowStatus);
      
      // Fetch last km reading for this truck
      if (camionId) {
        supabase
          .from('flotte')
          .select('km_compteur')
          .eq('id_camion', camionId)
          .single()
          .then(({ data }) => {
            setLastKmReading(data?.km_compteur || null);
          });
      }
    }
  }, [open, heureDepart, heureArrivee, heureRetour, workflowStatus, camionId]);

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
  const isRetourStep = currentStep === 3;

  // Auto-calculations
  const calculations = useMemo(() => {
    const kmVal = parseFloat(kmFinal) || 0;
    const litresVal = parseFloat(litresCarburant) || 0;
    const kmParcourus = lastKmReading && kmVal > lastKmReading ? kmVal - lastKmReading : null;
    
    // L/100km calculation
    let consommation: number | null = null;
    if (kmParcourus && kmParcourus > 0 && litresVal > 0) {
      consommation = (litresVal / kmParcourus) * 100;
    }

    // Cycle time (Retour - Départ)
    let cycleMinutes: number | null = null;
    if (localHeureDepart) {
      const now = new Date();
      cycleMinutes = differenceInMinutes(now, new Date(localHeureDepart));
    }

    // Waiting time (Signé - Arrivée) - Use validated_at from workflow or estimate
    let attenteMinutes: number | null = null;
    if (localHeureArrivee && isDelivered) {
      // Approximate: assume signature happened shortly after arrival for now
      // In reality, we'd use the validated_at timestamp
      attenteMinutes = 15; // Placeholder, will be calculated from real data
    }

    return {
      kmParcourus,
      consommation,
      cycleMinutes,
      attenteMinutes,
    };
  }, [kmFinal, litresCarburant, lastKmReading, localHeureDepart, localHeureArrivee, isDelivered]);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return null;
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: fr });
    } catch {
      return timestamp.slice(0, 5);
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes || minutes < 0) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins} min`;
  };

  // Single-click timestamp recording for Départ and Arrivée
  const recordTimestamp = async (stepKey: 'depart' | 'arrivee') => {
    setUpdating(stepKey);
    try {
      const now = new Date().toISOString();
      const field = stepKey === 'depart' ? 'heure_depart_centrale' : 'heure_arrivee_chantier';
      
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ [field]: now })
        .eq('bl_id', blId);

      if (error) throw error;

      // Update local state immediately for instant feedback
      if (stepKey === 'depart') {
        setLocalHeureDepart(now);
      } else {
        setLocalHeureArrivee(now);
      }

      const labels = {
        depart: '📍 Départ enregistré',
        arrivee: '📍 Arrivée enregistrée',
      };
      
      toast.success(labels[stepKey]);
      onComplete();
    } catch (error) {
      console.error('Error recording timestamp:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setUpdating(null);
    }
  };

  const handleRetourSubmit = async () => {
    setUpdating('retour');
    
    const kmVal = parseFloat(kmFinal);
    if (isNaN(kmVal) || kmVal <= 0) {
      toast.error('Veuillez entrer le KM Final');
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
      const nowDate = new Date();
      
      // Calculate values
      let kmParcourus: number | null = null;
      let consommation: number | null = null;
      let tempsRotation: number | null = null;
      let tempsAttente: number | null = null;

      if (lastKmReading && lastKmReading > 0) {
        kmParcourus = kmVal - lastKmReading;
        if (kmParcourus > 0 && litresVal > 0) {
          consommation = (litresVal / kmParcourus) * 100;
        }
      }

      // Calculate Cycle Time (Retour - Départ)
      if (localHeureDepart) {
        tempsRotation = differenceInMinutes(nowDate, new Date(localHeureDepart));
      }

      // Calculate Waiting Time (we'll fetch validated_at for accurate calculation)
      if (localHeureArrivee) {
        // Fetch the actual signature time
        const { data: blData } = await supabase
          .from('bons_livraison_reels')
          .select('validated_at')
          .eq('bl_id', blId)
          .single();
        
        if (blData?.validated_at) {
          tempsAttente = differenceInMinutes(new Date(blData.validated_at), new Date(localHeureArrivee));
        }
      }

      // Determine if attente should be billed (>30 min)
      const facturerAttente = tempsAttente !== null && tempsAttente > 30;

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

      // Update BL with all debrief data - syncs to Journal
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({
          heure_retour_centrale: now,
          km_parcourus: kmParcourus,
          km_final: kmVal,
          litres_ajoutes: litresVal > 0 ? litresVal : null,
          consommation_calculee: consommation,
          temps_rotation_minutes: tempsRotation,
          temps_attente_chantier_minutes: tempsAttente,
          facturer_attente: facturerAttente,
          justification_ecart: noteAttente || null,
          debrief_valide: true,
          debrief_at: now,
        })
        .eq('bl_id', blId);

      if (error) throw error;

      setLocalHeureRetour(now);
      
      // Show success with calculations summary
      const summaryParts = [`KM: ${kmVal.toLocaleString()}`];
      if (kmParcourus) summaryParts.push(`Dist: ${kmParcourus}km`);
      if (consommation) summaryParts.push(`${consommation.toFixed(1)} L/100km`);
      if (tempsRotation) summaryParts.push(`Cycle: ${formatDuration(tempsRotation)}`);
      
      toast.success('🏠 Rotation validée - Camion libéré!', {
        description: summaryParts.join(' • '),
      });
      
      onComplete();
      
      // Close modal after a brief delay
      setTimeout(() => {
        onOpenChange(false);
        // Reset form
        setKmFinal('');
        setDidRefuel(false);
        setLitresCarburant('');
        setNoteAttente('');
      }, 1500);
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
      setProofModalOpen(false);
      
      toast.success('✅ BL signé et archivé', {
        description: `Signé par ${proofData.signerName}`,
      });
      onComplete();
    } catch (error) {
      console.error('Error completing proof:', error);
      toast.error("Erreur lors de l'enregistrement");
      throw error;
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
        <DialogContent className={cn(
          "sm:max-w-[520px] max-h-[90vh] overflow-y-auto",
          // Glassmorphism effect
          "bg-background/80 backdrop-blur-xl border-border/50",
          "shadow-2xl shadow-primary/5"
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                Rotation {blId}
              </span>
              <span className={cn(
                "text-sm font-semibold px-3 py-1 rounded-full",
                isComplete 
                  ? "bg-success/20 text-success" 
                  : "bg-primary/10 text-primary"
              )}>
                {currentStep}/4 étapes
              </span>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {clientName} 
              {camionId && (
                <>
                  <span className="text-border">•</span>
                  <span className="font-mono font-medium text-foreground">{camionId}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Steps Progress - Compact single-click design */}
            <div className="space-y-2">
              {steps.map((step, index) => {
                const status = getStepStatus(index);
                const Icon = step.icon;
                const timestamp = getStepTimestamp(step.key);
                const time = timestamp === 'done' ? '✓' : formatTime(timestamp);
                const isUpdating = updating === step.key;
                const isSingleClick = step.key === 'depart' || step.key === 'arrivee';

                // Hide Retour step row when in Retour mode (show expanded form instead)
                if (step.key === 'retour' && isRetourStep) return null;

                return (
                  <div
                    key={step.key}
                    className={cn(
                      "relative flex items-center gap-3 p-3 rounded-xl border transition-all",
                      // Glassmorphism step cards
                      status === 'completed' && "bg-success/10 border-success/30 backdrop-blur-sm",
                      status === 'current' && "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/40 shadow-lg shadow-primary/10",
                      status === 'pending' && "bg-muted/30 border-border/30 opacity-50"
                    )}
                  >
                    {/* Step Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold shadow-inner",
                        status === 'completed' && "bg-success text-success-foreground",
                        status === 'current' && step.color === 'primary' && "bg-primary text-primary-foreground",
                        status === 'current' && step.color === 'warning' && "bg-warning text-warning-foreground",
                        status === 'current' && step.color === 'success' && "bg-success text-success-foreground",
                        status === 'pending' && "bg-muted text-muted-foreground"
                      )}
                    >
                      {status === 'completed' ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-semibold text-sm",
                        status === 'pending' && "text-muted-foreground"
                      )}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.sublabel}
                      </p>
                    </div>

                    {/* Timestamp or Action */}
                    {time ? (
                      <span className="text-sm font-mono font-semibold text-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                        {time}
                      </span>
                    ) : status === 'current' ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (isSingleClick) {
                            recordTimestamp(step.key as 'depart' | 'arrivee');
                          } else if (step.key === 'signe') {
                            setProofModalOpen(true);
                          }
                        }}
                        disabled={isUpdating}
                        className={cn(
                          "h-11 px-5 text-sm font-semibold rounded-xl shadow-lg transition-all",
                          "hover:scale-105 active:scale-95",
                          step.color === 'warning' && "bg-warning hover:bg-warning/90 text-warning-foreground shadow-warning/20",
                          step.color === 'success' && "bg-success hover:bg-success/90 shadow-success/20",
                          step.color === 'primary' && "bg-primary hover:bg-primary/90 shadow-primary/20"
                        )}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {step.key === 'signe' ? 'Signer' : (
                              <><Zap className="h-4 w-4 mr-1" /> Maintenant</>
                            )}
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Expanded Retour / Fin de Mission Section */}
            {isRetourStep && (
              <div className={cn(
                "p-5 rounded-2xl border-2 border-primary/30",
                "bg-gradient-to-br from-primary/5 via-background to-success/5",
                "backdrop-blur-sm shadow-xl shadow-primary/5",
                "animate-in slide-in-from-bottom-4 duration-300"
              )}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-primary/20">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Fin de Mission</h3>
                    <p className="text-xs text-muted-foreground">
                      Données obligatoires avant libération
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Previous KM Info */}
                  {lastKmReading && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border">
                      <span className="text-sm text-muted-foreground">Dernier relevé</span>
                      <span className="font-mono font-bold text-lg">{lastKmReading.toLocaleString()} km</span>
                    </div>
                  )}

                  {/* KM Final - Large touch-friendly input */}
                  <div className="space-y-2">
                    <Label htmlFor="km-final" className="flex items-center gap-2 font-semibold">
                      <Gauge className="h-4 w-4 text-primary" />
                      KM Final <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="km-final"
                      type="number"
                      inputMode="numeric"
                      placeholder="Ex: 125430"
                      value={kmFinal}
                      onChange={(e) => setKmFinal(e.target.value)}
                      className="h-14 text-xl font-mono text-center rounded-xl border-2 focus:border-primary"
                    />
                    {calculations.kmParcourus && calculations.kmParcourus > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Distance parcourue</span>
                        <span className="font-mono font-bold text-primary">{calculations.kmParcourus.toLocaleString()} km</span>
                      </div>
                    )}
                  </div>

                  {/* Fuel Toggle */}
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                    didRefuel ? "border-warning/50 bg-warning/10" : "border-border/50 bg-muted/30"
                  )}>
                    <Label htmlFor="did-refuel" className="flex items-center gap-3 cursor-pointer">
                      <Fuel className={cn("h-5 w-5", didRefuel ? "text-warning" : "text-muted-foreground")} />
                      <span className="font-medium">Carburant Ajouté</span>
                    </Label>
                    <Checkbox
                      id="did-refuel"
                      checked={didRefuel}
                      onCheckedChange={(checked) => setDidRefuel(!!checked)}
                      className="h-6 w-6"
                    />
                  </div>

                  {/* Fuel Amount - Conditional */}
                  {didRefuel && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <Label htmlFor="litres" className="flex items-center gap-2 font-semibold">
                        <Fuel className="h-4 w-4 text-warning" />
                        Litres <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="litres"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="Ex: 85.5"
                        value={litresCarburant}
                        onChange={(e) => setLitresCarburant(e.target.value)}
                        className="h-14 text-xl font-mono text-center rounded-xl border-2 focus:border-warning"
                      />
                      {calculations.consommation && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Consommation</span>
                          <span className={cn(
                            "font-mono font-bold",
                            calculations.consommation > 35 ? "text-destructive" : "text-success"
                          )}>
                            {calculations.consommation.toFixed(1)} L/100km
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Note d'Attente */}
                  <div className="space-y-2">
                    <Label htmlFor="note-attente" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      Note d'Attente
                      <span className="text-xs text-muted-foreground">(optionnel)</span>
                    </Label>
                    <Textarea
                      id="note-attente"
                      placeholder="Raison du délai, problème chantier..."
                      value={noteAttente}
                      onChange={(e) => setNoteAttente(e.target.value)}
                      className="min-h-[80px] rounded-xl resize-none"
                    />
                  </div>

                  {/* Auto-Calculated Summary Preview */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-xl border">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Timer className="h-3 w-3" />
                        Cycle Total
                      </div>
                      <span className="font-mono font-bold text-lg">
                        {formatDuration(calculations.cycleMinutes)}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        Attente
                      </div>
                      <span className="font-mono font-bold text-lg">
                        {formatDuration(calculations.attenteMinutes)}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    className={cn(
                      "w-full h-14 text-lg font-bold rounded-xl",
                      "bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70",
                      "shadow-xl shadow-success/20",
                      "transition-all hover:scale-[1.02] active:scale-[0.98]"
                    )}
                    onClick={handleRetourSubmit}
                    disabled={updating === 'retour'}
                  >
                    {updating === 'retour' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Valider & Libérer Camion
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Completion Message */}
            {isComplete && (
              <div className={cn(
                "p-5 rounded-2xl text-center",
                "bg-gradient-to-br from-success/20 to-success/5",
                "border-2 border-success/30"
              )}>
                <div className="flex items-center justify-center gap-2 text-success font-bold text-lg mb-2">
                  <Check className="h-6 w-6" />
                  Rotation Complète!
                </div>
                {camionId && (
                  <p className="text-sm text-muted-foreground">
                    Camion <span className="font-mono font-semibold text-foreground">{camionId}</span> libéré et disponible
                  </p>
                )}
              </div>
            )}

            {/* Truck Info Banner (when not in Retour step) */}
            {camionId && !isComplete && !isRetourStep && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-mono font-medium">{camionId}</p>
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
