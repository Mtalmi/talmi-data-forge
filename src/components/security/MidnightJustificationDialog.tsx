import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Moon, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { getCasablancaHour, isCurrentlyOffHours } from '@/lib/timezone';
import { useI18n } from '@/i18n/I18nContext';

const MIN_JUSTIFICATION_LENGTH = 20;

interface MidnightJustificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLabel: string;
  onConfirm: (justification: string) => void | Promise<void>;
  loading?: boolean;
}

export function MidnightJustificationDialog({
  open, onOpenChange, actionLabel, onConfirm, loading = false,
}: MidnightJustificationDialogProps) {
  const [justification, setJustification] = useState('');
  const { t } = useI18n();
  const mj = t.midnightJustification;
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
            {mj.title}
          </DialogTitle>
          <DialogDescription>{mj.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <div className="flex items-center gap-2">
                <span className="font-bold">{mj.currentTime.replace('{hour}', String(currentHour))}</span>
                <Badge variant="destructive" className="text-[10px] animate-pulse">{mj.offHours}</Badge>
              </div>
              <p className="text-xs mt-1">{mj.flagged}</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-semibold">
              <Shield className="h-4 w-4 text-destructive" />
              {mj.justLabel}
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive animate-pulse">
                {mj.required}
              </Badge>
            </Label>
            <Textarea value={justification} onChange={(e) => setJustification(e.target.value)}
              placeholder={mj.placeholder}
              className="min-h-[100px] border-destructive/50 focus:border-destructive" maxLength={500} />
            <div className="flex items-center justify-between text-xs">
              <span className={justification.trim().length < MIN_JUSTIFICATION_LENGTH ? 'text-destructive' : 'text-success'}>
                {mj.minChars.replace('{count}', String(justification.trim().length)).replace('{min}', String(MIN_JUSTIFICATION_LENGTH))}
              </span>
              <span className="text-muted-foreground">{justification.length}/500</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>{mj.cancel}</Button>
          <Button onClick={handleConfirm} disabled={!isValid || loading}
            className="gap-2 bg-destructive hover:bg-destructive/90">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{mj.processing}</>
            ) : (
              <><Shield className="h-4 w-4" />{actionLabel}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useNightModeCheck(): boolean {
  const hour = getCasablancaHour();
  return hour >= 18 || hour < 6;
}