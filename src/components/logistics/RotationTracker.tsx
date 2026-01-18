import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Play,
  MapPin,
  Home,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RotationTrackerProps {
  blId: string;
  heureDepart: string | null;
  heureArrivee: string | null;
  heureRetour: string | null;
  tempsRotation: number | null;
  tempsAttente: number | null;
  facturerAttente: boolean;
  canEdit: boolean;
  onUpdate: () => void;
}

export function RotationTracker({
  blId,
  heureDepart,
  heureArrivee,
  heureRetour,
  tempsRotation,
  tempsAttente,
  facturerAttente,
  canEdit,
  onUpdate,
}: RotationTrackerProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const recordTimestamp = async (field: 'heure_depart_centrale' | 'heure_arrivee_chantier' | 'heure_retour_centrale') => {
    setUpdating(field);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ [field]: now })
        .eq('bl_id', blId);

      if (error) throw error;
      
      const labels: Record<string, string> = {
        heure_depart_centrale: 'Départ',
        heure_arrivee_chantier: 'Arrivée',
        heure_retour_centrale: 'Retour',
      };
      toast.success(`${labels[field]} enregistré`);
      onUpdate();
    } catch (error) {
      console.error('Error recording timestamp:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setUpdating(null);
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return null;
    return format(new Date(timestamp), 'HH:mm', { locale: fr });
  };

  const formatMinutes = (minutes: number | null) => {
    if (minutes === null || minutes === undefined) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  };

  const steps = [
    {
      key: 'heure_depart_centrale',
      label: 'Départ Centrale',
      icon: Play,
      timestamp: heureDepart,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      key: 'heure_arrivee_chantier',
      label: 'Arrivée Chantier',
      icon: MapPin,
      timestamp: heureArrivee,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      key: 'heure_retour_centrale',
      label: 'Retour Centrale',
      icon: Home,
      timestamp: heureRetour,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Timestamp Buttons */}
      <div className="flex items-center gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = !!step.timestamp;
          const canRecord = canEdit && !step.timestamp && (index === 0 || steps[index - 1].timestamp);

          return (
            <div key={step.key} className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  'p-1.5 rounded-full',
                  isCompleted ? step.bgColor : 'bg-muted'
                )}>
                  <Icon className={cn('h-4 w-4', isCompleted ? step.color : 'text-muted-foreground')} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
              </div>
              
              {isCompleted ? (
                <div className={cn('p-3 rounded-lg border', step.bgColor, 'border-transparent')}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={cn('h-4 w-4', step.color)} />
                    <span className="font-mono font-bold text-lg">{formatTime(step.timestamp)}</span>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-12"
                  disabled={!canRecord || updating !== null}
                  onClick={() => recordTimestamp(step.key as any)}
                >
                  {updating === step.key ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Icon className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              )}

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  'h-0.5 w-8 absolute right-0 top-1/2 transform -translate-y-1/2',
                  isCompleted ? 'bg-success' : 'bg-border'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Time Calculations */}
      {heureRetour && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3 w-3" />
              Temps de Rotation Total
            </div>
            <span className="font-mono font-bold text-xl">
              {formatMinutes(tempsRotation)}
            </span>
          </div>
          
          <div className={cn(
            'p-3 rounded-lg',
            facturerAttente ? 'bg-warning/10 border border-warning/30' : 'bg-muted/30'
          )}>
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3 w-3" />
              Temps d'Attente Chantier
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'font-mono font-bold text-xl',
                facturerAttente && 'text-warning'
              )}>
                {formatMinutes(tempsAttente)}
              </span>
              {facturerAttente && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-warning/20 text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  Facturer Attente
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
