import { useState } from 'react';
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
  FileText,
  AlertTriangle,
  XCircle,
  CheckCircle,
  ExternalLink,
  Upload,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContractCompliance } from '@/hooks/useContractCompliance';

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

  const validation = fournisseurId 
    ? validatePaymentAgainstContract(fournisseurId, amount)
    : { hasContract: false };

  const contract = fournisseurId ? getContractForSupplier(fournisseurId) : undefined;

  if (!validation.hasContract) {
    // No contract - BLOCKED
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-destructive">
              <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              Paiement Bloqué - Contrat Manquant
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fournisseur:</span>
                  <span className="font-medium">{fournisseurNom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant:</span>
                  <span className="font-mono font-bold">{amount.toLocaleString('fr-FR')} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Motif:</span>
                  <span className="text-destructive font-medium">Aucun contrat actif trouvé</span>
                </div>
              </div>
            </div>

            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm text-warning">
                <strong>⚠️ Loi Marocaine:</strong> Les paiements sans contrat ne sont pas 
                déductibles fiscalement
              </AlertDescription>
            </Alert>

            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm font-medium mb-2">Actions requises:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal ml-4">
                <li>Télécharger le contrat du fournisseur</li>
                <li>Remplir les détails du contrat</li>
                <li>Réessayer le paiement</li>
              </ol>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={onUploadContract}
              >
                <Upload className="h-4 w-4" />
                Télécharger Contrat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Has contract - check variance
  const hasVariance = validation.variancePercent && Math.abs(validation.variancePercent) > 5;

  if (hasVariance && validation.isOverpayment) {
    // Variance detected - WARNING
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-warning">
              <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              Écart Détecté - Vérification Requise
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fournisseur:</span>
                  <span className="font-medium">{fournisseurNom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant Contrat:</span>
                  <span className="font-mono">{contract?.monthly_amount.toLocaleString('fr-FR')} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant Facture:</span>
                  <span className="font-mono font-bold">{amount.toLocaleString('fr-FR')} DH</span>
                </div>
                <hr className="border-warning/30 my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Écart:</span>
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
                ⚠️ La facture dépasse le montant du contrat de plus de 5%
              </AlertDescription>
            </Alert>

            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm font-medium mb-2">Actions possibles:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
                <li>Vérifier la facture avec le fournisseur</li>
                <li>Mettre à jour le contrat si les tarifs ont changé</li>
                <li>Approuver l'écart (CEO/Karim)</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onUploadContract}
              >
                Mettre à jour Contrat
              </Button>
              <Button
                className="flex-1"
                onClick={onProceed}
              >
                Approuver Écart
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Contract exists and amount matches - APPROVED
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-success">
            <div className="p-2 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            Contrat Vérifié
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-success/10 border border-success/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fournisseur:</span>
                <span className="font-medium">{fournisseurNom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contrat:</span>
                <span className="font-medium">{contract?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant mensuel:</span>
                <span className="font-mono">{contract?.monthly_amount.toLocaleString('fr-FR')} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant facture:</span>
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
              Voir le Contrat PDF
            </Button>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={onProceed}
            >
              <CheckCircle className="h-4 w-4" />
              Procéder au Paiement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
