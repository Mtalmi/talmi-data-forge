import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Truck, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActiveDelivery {
  bl_id: string;
  bc_id: string | null;
  client_nom: string | null;
  volume_m3: number;
  workflow_status: string;
}

interface AvailableTruck {
  id_camion: string;
  chauffeur: string | null;
  capacite_m3: number | null;
}

interface TruckRescueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  truckId: string;
  activeDelivery: ActiveDelivery | null;
  onComplete: () => void;
}

const INCIDENT_TYPES = [
  'Panne mécanique',
  'Accident',
  'Crevaison',
  'Problème hydraulique',
  'Panne électrique',
  'Autre',
];

export function TruckRescueModal({
  open,
  onOpenChange,
  truckId,
  activeDelivery,
  onComplete,
}: TruckRescueModalProps) {
  const [step, setStep] = useState<'incident' | 'rescue' | 'confirm'>('incident');
  const [incidentType, setIncidentType] = useState('Panne mécanique');
  const [description, setDescription] = useState('');
  const [volumePerdu, setVolumePerdu] = useState<string>('0');
  const [rescueTruckId, setRescueTruckId] = useState<string>('');
  const [availableTrucks, setAvailableTrucks] = useState<AvailableTruck[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch available trucks for rescue
  useEffect(() => {
    if (open) {
      fetchAvailableTrucks();
    }
  }, [open]);

  const fetchAvailableTrucks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('flotte')
        .select('id_camion, chauffeur, capacite_m3')
        .eq('type', 'Toupie')
        .eq('statut', 'Disponible')
        .neq('id_camion', truckId)
        .order('id_camion');

      if (error) throw error;
      setAvailableTrucks(data || []);
    } catch (error) {
      console.error('Error fetching available trucks:', error);
      toast.error('Erreur lors du chargement des camions disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Veuillez décrire l\'incident');
      return;
    }

    setSubmitting(true);
    try {
      const volumeLost = parseFloat(volumePerdu) || 0;
      const volumeToRescue = activeDelivery ? activeDelivery.volume_m3 - volumeLost : 0;

      // 1. Create incident record
      const { data: incident, error: incidentError } = await supabase
        .from('incidents_flotte')
        .insert({
          id_camion: truckId,
          type_incident: incidentType,
          description: description,
          bl_id: activeDelivery?.bl_id || null,
          bc_id: activeDelivery?.bc_id || null,
          volume_perdu: volumeLost,
          camion_rescue: rescueTruckId || null,
          resolu: !!rescueTruckId,
        })
        .select()
        .single();

      if (incidentError) throw incidentError;

      // 2. Set broken truck to 'Hors Service' and clear mission
      const { error: truckError } = await supabase
        .from('flotte')
        .update({ 
          statut: 'Hors Service',
          bc_mission_id: null,
          mission_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id_camion', truckId);

      if (truckError) throw truckError;

      // 3. If rescue truck selected and we have an active delivery, reassign
      if (rescueTruckId && activeDelivery && volumeToRescue > 0) {
        // Update the BL to assign new truck
        const { error: blError } = await supabase
          .from('bons_livraison_reels')
          .update({
            toupie_assignee: rescueTruckId,
            camion_assigne: rescueTruckId,
            volume_perdu: volumeLost,
            justification: `Incident sur ${truckId}: ${incidentType}. Réassigné à ${rescueTruckId}. Volume perdu: ${volumeLost}m³`,
            updated_at: new Date().toISOString(),
          })
          .eq('bl_id', activeDelivery.bl_id);

        if (blError) throw blError;

        // Rescue truck status will be updated by the sync_truck_status_on_assignment trigger
      }

      // 4. Send CEO notification via edge function
      try {
        const { error: notifyError } = await supabase.functions.invoke('notify-incident', {
          body: {
            incident_id: incident.id,
            truck_id: truckId,
            bc_id: activeDelivery?.bc_id || null,
            bl_id: activeDelivery?.bl_id || null,
            client_name: activeDelivery?.client_nom || null,
            incident_type: incidentType,
            description: description,
            volume_perdu: volumeLost,
            rescue_truck: rescueTruckId || null,
          },
        });

        if (notifyError) {
          console.error('Error sending CEO notification:', notifyError);
          // Don't fail the whole operation for notification failure
        }
      } catch (notifyErr) {
        console.error('Failed to notify CEO:', notifyErr);
      }

      toast.success('Incident enregistré et CEO notifié');
      
      // Reset form
      setStep('incident');
      setIncidentType('Panne mécanique');
      setDescription('');
      setVolumePerdu('0');
      setRescueTruckId('');
      
      onComplete();
      onOpenChange(false);

    } catch (error) {
      console.error('Error handling incident:', error);
      toast.error('Erreur lors de l\'enregistrement de l\'incident');
    } finally {
      setSubmitting(false);
    }
  };

  const volumeLost = parseFloat(volumePerdu) || 0;
  const volumeToRescue = activeDelivery ? Math.max(0, activeDelivery.volume_m3 - volumeLost) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Incident Camion - {truckId}
          </DialogTitle>
          <DialogDescription>
            Signaler une panne et organiser un secours si nécessaire
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Active Delivery Info */}
          {activeDelivery && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Mission en cours</span>
                <Badge variant="outline" className="font-mono">
                  {activeDelivery.bc_id || activeDelivery.bl_id}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <span className="ml-1 font-medium">{activeDelivery.client_nom || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Volume:</span>
                  <span className="ml-1 font-medium font-mono">{activeDelivery.volume_m3} m³</span>
                </div>
              </div>
            </div>
          )}

          {/* Incident Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type d'incident</Label>
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description de l'incident *</Label>
            <Textarea
              placeholder="Décrivez l'incident en détail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Volume Perdu */}
          {activeDelivery && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Volume Perdu (m³)
              </Label>
              <Input
                type="number"
                min="0"
                max={activeDelivery.volume_m3}
                step="0.5"
                value={volumePerdu}
                onChange={(e) => setVolumePerdu(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Volume qui ne peut pas être récupéré (sera déduit du stock, non facturé)
              </p>
              {volumeLost > 0 && (
                <div className="p-2 bg-destructive/10 rounded border border-destructive/20 text-sm">
                  <span className="text-destructive font-medium">
                    Perte: {volumeLost} m³ → Stock à déduire
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Rescue Truck Selection */}
          {activeDelivery && volumeToRescue > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4 text-success" />
                Camion de Secours (optionnel)
              </Label>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : availableTrucks.length === 0 ? (
                <div className="p-3 bg-warning/10 rounded border border-warning/20 text-sm text-warning">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  Aucun camion disponible pour secours
                </div>
              ) : (
                <>
                  <Select value={rescueTruckId} onValueChange={setRescueTruckId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un camion de secours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun (ne pas réassigner)</SelectItem>
                      {availableTrucks.map((truck) => (
                        <SelectItem key={truck.id_camion} value={truck.id_camion}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{truck.id_camion}</span>
                            {truck.capacite_m3 && (
                              <span className="text-muted-foreground">({truck.capacite_m3}m³)</span>
                            )}
                            {truck.chauffeur && (
                              <span className="text-muted-foreground">• {truck.chauffeur}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {rescueTruckId && (
                    <div className="p-2 bg-success/10 rounded border border-success/20 text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        <span className="font-mono font-medium">{rescueTruckId}</span> 
                        {' '}prendra en charge{' '}
                        <span className="font-mono font-medium">{volumeToRescue} m³</span>
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="p-3 bg-muted rounded-lg border space-y-2 text-sm">
            <h4 className="font-medium">Résumé des actions:</h4>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                <span><span className="font-mono">{truckId}</span> → Hors Service</span>
              </li>
              {volumeLost > 0 && (
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  <span>Volume perdu: {volumeLost} m³ (déduit du stock)</span>
                </li>
              )}
              {rescueTruckId && volumeToRescue > 0 && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                  <span>
                    <span className="font-mono">{rescueTruckId}</span> réassigné ({volumeToRescue} m³)
                  </span>
                </li>
              )}
              <li className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-primary" />
                <span>Email envoyé au CEO (max.talmi@gmail.com)</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || !description.trim()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Confirmer Incident
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
