import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Camera,
  CameraOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface PhotoWaiverOptionProps {
  blId: string;
  onWaiverComplete: (waiverData: {
    waiverReason: string;
    waiverNotes?: string;
    manualTimestamp: string;
    waivedAt: string;
  }) => void;
  disabled?: boolean;
}

export function PhotoWaiverOption({
  blId,
  onWaiverComplete,
  disabled = false,
}: PhotoWaiverOptionProps) {
  const [open, setOpen] = useState(false);
  const [manualTime, setManualTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [waiverReason, setWaiverReason] = useState('');
  const [waiverNotes, setWaiverNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { value: 'camera_defect', label: 'Caméra défectueuse' },
    { value: 'no_smartphone', label: 'Pas de smartphone' },
    { value: 'poor_lighting', label: 'Éclairage insuffisant' },
    { value: 'client_refuse', label: 'Client refuse photo' },
    { value: 'urgent_departure', label: 'Départ urgent' },
    { value: 'other', label: 'Autre raison' },
  ];

  const handleSubmit = async () => {
    if (!manualTime) {
      toast.error('Veuillez entrer l\'heure');
      return;
    }
    if (!waiverReason) {
      toast.error('Veuillez sélectionner une raison');
      return;
    }

    setSubmitting(true);
    try {
      onWaiverComplete({
        waiverReason,
        waiverNotes: waiverNotes || undefined,
        manualTimestamp: manualTime,
        waivedAt: new Date().toISOString(),
      });

      toast.success('Photo ignorée - Horodatage manuel enregistré', {
        description: `Heure: ${manualTime}`,
      });

      setOpen(false);
      setWaiverReason('');
      setWaiverNotes('');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-warning"
          disabled={disabled}
        >
          <CameraOff className="h-4 w-4" />
          <span className="text-xs">Pas de photo?</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CameraOff className="h-5 w-5 text-warning" />
            Ignorer Photo - BL {blId}
          </DialogTitle>
          <DialogDescription>
            Si la caméra n'est pas disponible, entrez l'heure manuellement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Manual Time Entry */}
          <div className="space-y-2">
            <Label htmlFor="waiver-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Heure de livraison (obligatoire)
            </Label>
            <Input
              id="waiver-time"
              type="time"
              value={manualTime}
              onChange={e => setManualTime(e.target.value)}
              className="text-center text-lg font-mono"
            />
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Raison (obligatoire)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map(reason => (
                <Button
                  key={reason.value}
                  type="button"
                  variant={waiverReason === reason.value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-9",
                    waiverReason === reason.value && "ring-2 ring-primary/50"
                  )}
                  onClick={() => setWaiverReason(reason.value)}
                >
                  {reason.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Optional Notes - Always shown for 'other', but captured for all reasons */}
          {waiverReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="waiver-notes">Précisez</Label>
              <Textarea
                id="waiver-notes"
                placeholder="Détails supplémentaires..."
                className="h-20"
                value={waiverNotes}
                onChange={(e) => setWaiverNotes(e.target.value)}
              />
            </div>
          )}

          {/* Warning Notice */}
          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div className="text-xs text-warning-foreground">
              <p className="font-medium">Attention</p>
              <p>L'absence de photo sera consignée dans le journal d'audit. Utilisez cette option uniquement en cas de nécessité.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 gap-2 bg-warning hover:bg-warning/90 text-warning-foreground"
            onClick={handleSubmit}
            disabled={!manualTime || !waiverReason || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Confirmer sans photo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
