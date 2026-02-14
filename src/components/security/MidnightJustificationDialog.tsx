import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Moon, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { getCasablancaHour, isCurrentlyOffHours } from '@/lib/timezone';

const MIN_JUSTIFICATION_LENGTH = 20;

interface MidnightJustificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLabel: string;
  onConfirm: (justification: string) => void | Promise<void>;
  loading?: boolean;
}

/**
 * Midnight Protocol Justification Dialog
 * 
 * Enforces mandatory justification for critical actions performed
 * during off-hours (18:00 - 06:00 Africa/Casablanca).
 * 
 * Usage: Check isCurrentlyOffHours() before showing this dialog.
 * If off-hours, show this dialog instead of performing the action directly.
 */
export function MidnightJustificationDialog({
  open,
  onOpenChange,
  actionLabel,
  onConfirm,
  loading = false,
}: MidnightJustificationDialogProps) {
  const [justification, setJustification] = useState('');
  const currentHour = getCasablancaHour();
  const isValid = justification.trim().length >= MIN_JUSTIFICATION_LENGTH;

  const handleConfirm = async () => {
    if (!isValid) return;
    await onConfirm(justification.trim());
    setJustification('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-destructive" />
            🌙 MODE NUIT ACTIF
          </DialogTitle>
          <DialogDescription>
            Protocole d'urgence nocturne — Justification obligatoire
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <div className="flex items-center gap-2">
                <span className="font-bold">Heure actuelle: {currentHour}h00 🇲🇦</span>
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  HORS HORAIRES
                </Badge>
              </div>
              <p className="text-xs mt-1">
                Cette action sera signalée dans le War Room CEO et le Forensic Audit Feed.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-semibold">
              <Shield className="h-4 w-4 text-destructive" />
              Justification d'Urgence
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive animate-pulse">
                REQUIS
              </Badge>
            </Label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Décrivez la raison de cette opération nocturne (min. 20 caractères)..."
              className="min-h-[100px] border-destructive/50 focus:border-destructive"
              maxLength={500}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={justification.trim().length < MIN_JUSTIFICATION_LENGTH ? 'text-destructive' : 'text-success'}>
                {justification.trim().length}/{MIN_JUSTIFICATION_LENGTH} caractères minimum
              </span>
              <span className="text-muted-foreground">{justification.length}/500</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="gap-2 bg-destructive hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                {actionLabel}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to check if Midnight Protocol should be enforced.
 * Extended window: 18:00 - 06:00 (covers full night operations).
 */
export function useNightModeCheck(): boolean {
  const hour = getCasablancaHour();
  return hour >= 18 || hour < 6;
}
