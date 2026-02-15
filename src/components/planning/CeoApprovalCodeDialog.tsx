import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lock, Shield, DollarSign, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';

interface CeoApprovalCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientId: string;
  solde: number;
  limite: number;
  onApproved: () => void;
}

const CEO_APPROVAL_CODE = 'CEO2024';

export function CeoApprovalCodeDialog({
  open,
  onOpenChange,
  clientName,
  clientId,
  solde,
  limite,
  onApproved,
}: CeoApprovalCodeDialogProps) {
  const { t } = useI18n();
  const ca = t.ceoApprovalCode;
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.trim().toUpperCase() === CEO_APPROVAL_CODE) {
      toast.success(ca.codeAccepted);
      setCode('');
      setError(false);
      setAttempts(0);
      onApproved();
      onOpenChange(false);
    } else {
      setError(true);
      setAttempts(prev => prev + 1);
      
      if (attempts >= 2) {
        toast.error(ca.tooManyAttempts);
        onOpenChange(false);
        setCode('');
        setError(false);
        setAttempts(0);
      } else {
        toast.error(ca.incorrectCode);
      }
    }
  };

  const handleClose = () => {
    setCode('');
    setError(false);
    setAttempts(0);
    onOpenChange(false);
  };

  const depassement = solde - limite;
  const depassementPct = ((depassement / limite) * 100).toFixed(0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <Lock className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-destructive">{ca.title}</DialogTitle>
              <DialogDescription>{ca.subtitle}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{ca.client}</span>
              <span className="font-medium">{clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{ca.balanceDue}</span>
              <Badge variant="destructive" className="text-sm">
                <DollarSign className="h-3 w-3 mr-1" />
                {solde.toLocaleString()} DH
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{ca.creditLimit}</span>
              <span className="font-medium">{limite.toLocaleString()} DH</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-destructive">
                <span className="text-sm font-medium">{ca.overrun}</span>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-bold">+{depassement.toLocaleString()} DH ({depassementPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">{ca.actionRequired}</p>
              <p className="text-muted-foreground">{ca.overrunMessage}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approval-code" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {ca.approvalCode}
              </Label>
              <Input
                id="approval-code"
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(false);
                }}
                placeholder={ca.enterCode}
                className={error ? 'border-destructive' : ''}
                autoComplete="off"
              />
              {error && (
                <p className="text-xs text-destructive">
                  {ca.incorrectAttempt.replace('{attempts}', String(attempts))}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose}>
                {ca.cancelDelivery}
              </Button>
              <Button type="submit" disabled={!code.trim()}>
                <Lock className="h-4 w-4 mr-2" />
                {ca.validateCode}
              </Button>
            </DialogFooter>
          </form>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              <Phone className="h-3 w-3 inline mr-1" />
              {ca.needCode}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}