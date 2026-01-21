import { Devis } from '@/hooks/useSalesWorkflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Calendar,
  User,
  Package,
  MapPin,
  Calculator,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Send,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import DevisPdfGenerator from '@/components/quotes/DevisPdfGenerator';
import { DevisSendDialog } from '@/components/quotes/DevisSendDialog';

interface DevisDetailDialogProps {
  devis: Devis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvert: (devis: Devis) => void;
}

const DEVIS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: { label: 'En Attente', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-4 w-4" /> },
  accepte: { label: 'Accepté', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-4 w-4" /> },
  converti: { label: 'Converti en BC', color: 'bg-primary/10 text-primary border-primary/30', icon: <ArrowRight className="h-4 w-4" /> },
  refuse: { label: 'Refusé', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <XCircle className="h-4 w-4" /> },
  expire: { label: 'Expiré', color: 'bg-muted text-muted-foreground border-muted', icon: <Clock className="h-4 w-4" /> },
};

export function DevisDetailDialog({
  devis,
  open,
  onOpenChange,
  onConvert,
}: DevisDetailDialogProps) {
  if (!devis) return null;

  const statusConfig = DEVIS_STATUS_CONFIG[devis.statut] || DEVIS_STATUS_CONFIG.en_attente;
  
  // Calculate expiration info
  const expirationDate = devis.date_expiration ? new Date(devis.date_expiration) : null;
  const daysUntilExpiration = expirationDate ? differenceInDays(expirationDate, new Date()) : null;
  const isExpired = daysUntilExpiration !== null && daysUntilExpiration < 0;
  const isExpiring = daysUntilExpiration !== null && daysUntilExpiration >= 0 && daysUntilExpiration <= 3;

  const canConvert = devis.statut === 'en_attente' || devis.statut === 'accepte';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-primary" />
            Devis {devis.devis_id}
          </DialogTitle>
          <DialogDescription>
            Créé le {format(new Date(devis.created_at), 'dd MMMM yyyy', { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Expiration Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Badge variant="outline" className={cn("gap-2 px-3 py-1.5 text-sm", statusConfig.color)}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
            
            {expirationDate && devis.statut === 'en_attente' && (
              <Badge 
                variant="outline" 
                className={cn(
                  "gap-1",
                  isExpired ? "bg-destructive/10 text-destructive" : 
                  isExpiring ? "bg-warning/10 text-warning" : 
                  "bg-muted"
                )}
              >
                <Calendar className="h-3 w-3" />
                {isExpired 
                  ? `Expiré depuis ${Math.abs(daysUntilExpiration!)} jours`
                  : `Expire dans ${daysUntilExpiration} jours`
                }
              </Badge>
            )}
          </div>

          {/* Client & Formule Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-semibold">{devis.client?.nom_client || 'Non spécifié'}</p>
                </div>
              </div>
              {devis.client?.adresse && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{devis.client.adresse}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Détails Produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Formule</p>
                  <p className="font-mono font-semibold">{devis.formule_id}</p>
                  {devis.formule?.designation && (
                    <p className="text-xs text-muted-foreground">{devis.formule.designation}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className="font-mono text-lg font-bold">{devis.volume_m3} m³</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-mono">{devis.distance_km} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Tarification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <p className="text-2xl font-mono font-bold text-primary">
                    {devis.prix_vente_m3.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-muted-foreground">Prix / m³</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <p className="text-2xl font-mono font-bold text-primary">
                    {devis.total_ht.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-muted-foreground">Total HT</p>
                </div>
              </div>

              {/* Cost Breakdown (internal) */}
              <div className="space-y-1 text-sm pt-2 border-t">
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span>CUT (Coût Unitaire Théorique)</span>
                  <span className="font-mono">{devis.cut_per_m3.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span>Frais fixes</span>
                  <span className="font-mono">{devis.fixed_cost_per_m3.toFixed(2)} DH</span>
                </div>
                {devis.transport_extra_per_m3 > 0 && (
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Supplément transport</span>
                    <span className="font-mono">{devis.transport_extra_per_m3.toFixed(2)} DH</span>
                  </div>
                )}
                <div className="flex justify-between p-2 border rounded font-medium">
                  <span>Coût Total / m³</span>
                  <span className="font-mono">{devis.total_cost_per_m3.toFixed(2)} DH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {devis.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{devis.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <DevisPdfGenerator devis={devis} />
            <DevisSendDialog devis={devis} />
            
            {canConvert && (
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  onConvert(devis);
                }}
                className="gap-2 ml-auto"
              >
                <ArrowRight className="h-4 w-4" />
                Convertir en BC
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
