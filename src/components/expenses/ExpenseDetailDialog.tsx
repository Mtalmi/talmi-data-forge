import { ExpenseControlled } from '@/hooks/useExpensesControlled';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Banknote,
  Clock,
  Fuel,
  Car,
  Image,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExpenseDetailDialogProps {
  expense: ExpenseControlled;
  open: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  brouillon: { label: 'Brouillon', icon: <Clock className="h-4 w-4" />, color: 'text-muted-foreground' },
  en_attente: { label: 'En attente', icon: <Clock className="h-4 w-4" />, color: 'text-warning' },
  approuve: { label: 'Approuvé', icon: <CheckCircle className="h-4 w-4" />, color: 'text-success' },
  rejete: { label: 'Rejeté', icon: <XCircle className="h-4 w-4" />, color: 'text-destructive' },
  paye: { label: 'Payé', icon: <Banknote className="h-4 w-4" />, color: 'text-primary' },
  bloque_plafond: { label: 'Bloqué (Plafond)', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-destructive' },
};

const LEVEL_CONFIG: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
  level_1: { label: 'Niveau 1', desc: '≤ 2,000 MAD', icon: <ShieldCheck className="h-4 w-4" />, color: 'text-success' },
  level_2: { label: 'Niveau 2', desc: '2,001-20,000 MAD', icon: <ShieldAlert className="h-4 w-4" />, color: 'text-warning' },
  level_3: { label: 'Niveau 3', desc: '> 20,000 MAD', icon: <ShieldX className="h-4 w-4" />, color: 'text-destructive' },
};

const CATEGORY_LABELS: Record<string, string> = {
  carburant: 'Carburant',
  maintenance: 'Maintenance',
  fournitures: 'Fournitures',
  transport: 'Transport',
  reparation: 'Réparation',
  nettoyage: 'Nettoyage',
  petit_equipement: 'Petit Équipement',
  services_externes: 'Services Externes',
  frais_administratifs: 'Frais Administratifs',
  autre: 'Autre',
};

export function ExpenseDetailDialog({ expense, open, onClose }: ExpenseDetailDialogProps) {
  const statusConfig = STATUS_CONFIG[expense.statut] || STATUS_CONFIG['en_attente'];
  const levelConfig = LEVEL_CONFIG[expense.approval_level] || LEVEL_CONFIG['level_1'];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Détail Dépense #{expense.reference}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Level */}
          <div className="flex items-center justify-between">
            <div className={cn('flex items-center gap-2', statusConfig.color)}>
              {statusConfig.icon}
              <span className="font-medium">{statusConfig.label}</span>
            </div>
            <div className={cn('flex items-center gap-2', levelConfig.color)}>
              {levelConfig.icon}
              <span className="text-sm">{levelConfig.label}</span>
            </div>
          </div>

          <Separator />

          {/* Main Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Catégorie</p>
              <Badge variant="outline">
                {CATEGORY_LABELS[expense.categorie] || expense.categorie}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Date demande
              </p>
              <p className="font-medium">
                {expense.requested_at 
                  ? format(new Date(expense.requested_at), 'dd MMMM yyyy', { locale: fr })
                  : '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Demandeur
              </p>
              <p className="font-medium">{expense.requested_by_name || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Montant TTC</p>
              <p className="text-xl font-bold font-mono">
                {expense.montant_ttc.toLocaleString('fr-FR')} MAD
              </p>
            </div>
          </div>

          {/* Financial Details */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant HT:</span>
              <span className="font-mono">{expense.montant_ht.toLocaleString('fr-FR')} MAD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TVA ({expense.tva_pct || 0}%):</span>
              <span className="font-mono">
                {((expense.montant_ttc - expense.montant_ht) || 0).toLocaleString('fr-FR')} MAD
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total TTC:</span>
              <span className="font-mono">{expense.montant_ttc.toLocaleString('fr-FR')} MAD</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm">{expense.description}</p>
            {expense.sous_categorie && (
              <Badge variant="secondary" className="text-xs">
                {expense.sous_categorie}
              </Badge>
            )}
          </div>

          {/* Fuel Protocol Data */}
          {expense.categorie === 'carburant' && (
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg space-y-3">
              <p className="text-sm font-medium flex items-center gap-2 text-warning">
                <Fuel className="h-4 w-4" />
                Protocole Carburant
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ID Véhicule</p>
                  <p className="font-mono font-medium flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {expense.vehicule_id || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kilométrage</p>
                  <p className="font-mono font-medium">
                    {expense.kilometrage ? `${expense.kilometrage.toLocaleString()} km` : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Receipt Photo */}
          {expense.receipt_photo_url && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Image className="h-3 w-3" />
                Justificatif
              </p>
              <img
                src={expense.receipt_photo_url}
                alt="Receipt"
                className="w-full rounded-lg border max-h-64 object-contain bg-muted"
              />
            </div>
          )}

          {/* Notes */}
          {expense.notes && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm bg-muted/30 p-3 rounded-lg">{expense.notes}</p>
            </div>
          )}

          {/* Approval Trail */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase">
              Historique d'approbation
            </p>
            
            {expense.level1_approved_at && (
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Niveau 1 approuvé</p>
                  <p className="text-xs text-muted-foreground">
                    Par {expense.level1_approved_by_name} le{' '}
                    {format(new Date(expense.level1_approved_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                  {expense.level1_notes && (
                    <p className="text-xs mt-1 italic">{expense.level1_notes}</p>
                  )}
                </div>
              </div>
            )}

            {expense.level2_approved_at && (
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Niveau 2 approuvé</p>
                  <p className="text-xs text-muted-foreground">
                    Par {expense.level2_approved_by_name} le{' '}
                    {format(new Date(expense.level2_approved_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                  {expense.level2_notes && (
                    <p className="text-xs mt-1 italic">{expense.level2_notes}</p>
                  )}
                </div>
              </div>
            )}

            {expense.level3_approved_at && (
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Niveau 3 (CEO) approuvé</p>
                  <p className="text-xs text-muted-foreground">
                    Par {expense.level3_approved_by_name} le{' '}
                    {format(new Date(expense.level3_approved_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                  {expense.level3_notes && (
                    <p className="text-xs mt-1 italic">{expense.level3_notes}</p>
                  )}
                </div>
              </div>
            )}

            {expense.rejected_at && (
              <div className="flex items-start gap-3 text-sm">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Rejeté</p>
                  <p className="text-xs text-muted-foreground">
                    Par {expense.rejected_by_name} le{' '}
                    {format(new Date(expense.rejected_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                  {expense.rejection_reason && (
                    <p className="text-xs mt-1 italic text-destructive">
                      Raison: {expense.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {expense.paid_at && (
              <div className="flex items-start gap-3 text-sm">
                <Banknote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-primary">Payé</p>
                  <p className="text-xs text-muted-foreground">
                    Le {format(new Date(expense.paid_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    {expense.payment_method && ` - ${expense.payment_method}`}
                  </p>
                  {expense.payment_reference && (
                    <p className="text-xs font-mono">Réf: {expense.payment_reference}</p>
                  )}
                </div>
              </div>
            )}

            {expense.was_blocked_by_cap && expense.cap_override_reason && (
              <div className="flex items-start gap-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Plafond débloqué</p>
                  <p className="text-xs mt-1 italic">{expense.cap_override_reason}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
