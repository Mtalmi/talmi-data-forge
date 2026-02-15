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
import { useI18n } from '@/i18n/I18nContext';
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
  const { t } = useI18n();
  const pw = t.photoWaiver;
  const [open, setOpen] = useState(false);
  const [manualTime, setManualTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [waiverReason, setWaiverReason] = useState('');
  const [waiverNotes, setWaiverNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { value: 'camera_defect', label: pw.cameraDefect },
    { value: 'no_smartphone', label: pw.noSmartphone },
    { value: 'poor_lighting', label: pw.poorLighting },
    { value: 'client_refuse', label: pw.clientRefuse },
    { value: 'urgent_departure', label: pw.urgentDeparture },
    { value: 'other', label: pw.otherReason },
  ];

  const handleSubmit = async () => {
    if (!manualTime) {
      toast.error(pw.enterTime);
      return;
    }
    if (!waiverReason) {
      toast.error(pw.selectReason);
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

      toast.success(pw.waiverSuccess, {
        description: `Heure: ${manualTime}`,
      });

      setOpen(false);
      setWaiverReason('');
      setWaiverNotes('');
    } catch (error) {
      toast.error(pw.saveError);
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
          <span className="text-xs">{pw.noPhoto}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CameraOff className="h-5 w-5 text-warning" />
            {pw.title.replace('{blId}', blId)}
          </DialogTitle>
          <DialogDescription>
            {pw.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="waiver-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {pw.deliveryTime}
            </Label>
            <Input
              id="waiver-time"
              type="time"
              value={manualTime}
              onChange={e => setManualTime(e.target.value)}
              className="text-center text-lg font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {pw.reason}
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

          {waiverReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="waiver-notes">{pw.specify}</Label>
              <Textarea
                id="waiver-notes"
                placeholder={pw.detailsPlaceholder}
                className="h-20"
                value={waiverNotes}
                onChange={(e) => setWaiverNotes(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div className="text-xs text-warning-foreground">
              <p className="font-medium">{pw.warning}</p>
              <p>{pw.warningText}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            {t.common?.cancel || 'Annuler'}
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
            {pw.confirmNoPhoto}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
