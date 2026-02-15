import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { useContractCompliance } from '@/hooks/useContractCompliance';
import { useI18n } from '@/i18n/I18nContext';

interface ContractVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fournisseurId: string | null;
  fournisseurNom: string;
  amount: number;
  onProceed: () => void;
  onUploadContract: () => void;
}

export function ContractVerificationDialog({
  open,
  onOpenChange,
  fournisseurId,
  fournisseurNom,
  amount,
  onProceed,
  onUploadContract,
}: ContractVerificationDialogProps) {
  const { validatePaymentAgainstContract, getContractForSupplier } = useContractCompliance();
  const { t } = useI18n();
  const cv = t.contractVerification;

  const validation = fournisseurId 
    ? validatePaymentAgainstContract(fournisseurId, amount)
    : { hasContract: false };

  const contract = fournisseurId ? getContractForSupplier(fournisseurId) : undefined;

  if (!validation.hasContract) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-destructive">
              <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              {cv.blocked}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{cv.supplier}:</span>
                  <span className="font-medium">{fournisseurNom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{cv.amount}:</span>
                  <span className="font-mono font-bold">{amount.toLocaleString('fr-FR')} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{cv.reason}:</span>
                  <span className="text-destructive font-medium">{cv.noContract}</span>
                </div>
              </div>
            </div>

            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm text-warning">
                <strong>⚠️ {cv.lawLabel}</strong> {cv.lawWarning}
              </AlertDescription>
            </Alert>

            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm font-medium mb-2">{cv.requiredActions}</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal ml-4">
                <li>{cv.step1}</li>
                <li>{cv.step2}</li>
                <li>{cv.step3}</li>
              </ol>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                {cv.cancel}
              </Button>
              <Button className="flex-1 gap-2" onClick={onUploadContract}>
                <Upload className="h-4 w-4" />
                {cv.uploadContract}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const hasVariance = validation.variancePercent && Math.abs(validation.variancePercent) > 5;

  if (hasVariance && validation.isOverpayment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-warning">
              <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              {cv.varianceDetected}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{cv.supplier}:</span>
                  <span className="font-medium">{fournisseurNom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{cv.contractAmount}:</span>
                  <span className="font-mono">{contract?.monthly_amount.toLocaleString('fr-FR')} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{cv.invoiceAmount}:</span>
                  <span className="font-mono font-bold">{amount.toLocaleString('fr-FR')} DH</span>
                </div>
                <hr className="border-warning/30 my-2" />
                <div className="flex justify-between font-semibold">
                  <span>{cv.variance}:</span>
                  <span className="text-warning">
                    {validation.variance! > 0 ? '+' : ''}{validation.variance?.toLocaleString('fr-FR')} DH 
                    ({validation.variancePercent?.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm text-warning">
                ⚠️ {cv.varianceWarning}
              </AlertDescription>
            </Alert>

            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm font-medium mb-2">{cv.possibleActions}</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
                <li>{cv.verifyInvoice}</li>
                <li>{cv.updateContract}</li>
                <li>{cv.approveCeo}</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                {cv.cancel}
              </Button>
              <Button variant="outline" className="flex-1" onClick={onUploadContract}>
                {cv.updateContractBtn}
              </Button>
              <Button className="flex-1" onClick={onProceed}>
                {cv.approveVariance}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-success">
            <div className="p-2 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            {cv.verified}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-success/10 border border-success/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{cv.supplier}:</span>
                <span className="font-medium">{fournisseurNom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{cv.contract}:</span>
                <span className="font-medium">{contract?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{cv.monthlyAmount}:</span>
                <span className="font-mono">{contract?.monthly_amount.toLocaleString('fr-FR')} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{cv.invoiceAmount}:</span>
                <span className="font-mono font-bold">{amount.toLocaleString('fr-FR')} DH</span>
              </div>
            </div>
          </div>

          {contract?.pdf_url && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(contract.pdf_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              {cv.viewPdf}
            </Button>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {cv.cancel}
            </Button>
            <Button className="flex-1 gap-2" onClick={onProceed}>
              <CheckCircle className="h-4 w-4" />
              {cv.proceedPayment}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
