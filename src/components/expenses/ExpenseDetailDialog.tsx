import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
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
import { cn } from '@/lib/utils';

interface ExpenseDetailDialogProps {
  expense: ExpenseControlled;
  open: boolean;
  onClose: () => void;
}

export function ExpenseDetailDialog({ expense, open, onClose }: ExpenseDetailDialogProps) {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const d = t.pages.depenses;

  const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    brouillon: { label: d.draft, icon: <Clock className="h-4 w-4" />, color: 'text-muted-foreground' },
    en_attente: { label: d.pending, icon: <Clock className="h-4 w-4" />, color: 'text-warning' },
    approuve: { label: d.approved, icon: <CheckCircle className="h-4 w-4" />, color: 'text-success' },
    rejete: { label: d.rejected, icon: <XCircle className="h-4 w-4" />, color: 'text-destructive' },
    paye: { label: d.paid, icon: <Banknote className="h-4 w-4" />, color: 'text-primary' },
    bloque_plafond: { label: d.blockedCap, icon: <AlertTriangle className="h-4 w-4" />, color: 'text-destructive' },
  };

  const LEVEL_CONFIG: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
    level_1: { label: d.level1, desc: d.level1Desc, icon: <ShieldCheck className="h-4 w-4" />, color: 'text-success' },
    level_2: { label: d.level2, desc: d.level2Desc, icon: <ShieldAlert className="h-4 w-4" />, color: 'text-warning' },
    level_3: { label: d.level3, desc: d.level3Desc, icon: <ShieldX className="h-4 w-4" />, color: 'text-destructive' },
  };

  const CATEGORY_LABELS: Record<string, string> = {
    carburant: d.fuel,
    maintenance: d.maintenance,
    fournitures: d.supplies,
    transport: d.transport,
    reparation: d.repair,
    nettoyage: d.cleaning,
    petit_equipement: d.smallEquipment,
    services_externes: d.externalServices,
    frais_administratifs: d.adminFees,
    autre: d.other,
  };

  const statusConfig = STATUS_CONFIG[expense.statut] || STATUS_CONFIG['en_attente'];
  const levelConfig = LEVEL_CONFIG[expense.approval_level] || LEVEL_CONFIG['level_1'];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {d.expenseDetail} #{expense.reference}
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
              <p className="text-xs text-muted-foreground">{d.category}</p>
              <Badge variant="outline">
                {CATEGORY_LABELS[expense.categorie] || expense.categorie}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {d.requestDate}
              </p>
              <p className="font-medium">
                {expense.requested_at 
                  ? format(new Date(expense.requested_at), 'dd MMMM yyyy', { locale: dateLocale || undefined })
                  : '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> {d.requester}
              </p>
              <p className="font-medium">{expense.requested_by_name || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{d.amountTTC}</p>
              <p className="text-xl font-bold font-mono">
                {expense.montant_ttc.toLocaleString('fr-FR')} MAD
              </p>
            </div>
          </div>

          {/* Financial Details */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{d.amountHT}:</span>
              <span className="font-mono">{expense.montant_ht.toLocaleString('fr-FR')} MAD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{d.vat} ({expense.tva_pct || 0}%):</span>
              <span className="font-mono">
                {((expense.montant_ttc - expense.montant_ht) || 0).toLocaleString('fr-FR')} MAD
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>{d.totalTTC}:</span>
              <span className="font-mono">{expense.montant_ttc.toLocaleString('fr-FR')} MAD</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{d.description}</p>
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
                {d.fuelProtocol}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{d.vehicleId}</p>
                  <p className="font-mono font-medium flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {expense.vehicule_id || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{d.mileage}</p>
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
                {d.justification}
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
              <p className="text-xs text-muted-foreground">{d.notes}</p>
              <p className="text-sm bg-muted/30 p-3 rounded-lg">{expense.notes}</p>
            </div>
          )}

          {/* Approval Trail */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase">
              {d.approvalHistory}
            </p>
            
            {expense.level1_approved_at && (
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{d.level1Approved}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.by} {expense.level1_approved_by_name} {d.on}{' '}
                    {format(new Date(expense.level1_approved_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale || undefined })}
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
                  <p className="font-medium">{d.level2Approved}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.by} {expense.level2_approved_by_name} {d.on}{' '}
                    {format(new Date(expense.level2_approved_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale || undefined })}
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
                  <p className="font-medium">{d.level3Approved}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.by} {expense.level3_approved_by_name} {d.on}{' '}
                    {format(new Date(expense.level3_approved_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale || undefined })}
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
                  <p className="font-medium text-destructive">{d.rejected}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.by} {expense.rejected_by_name} {d.on}{' '}
                    {format(new Date(expense.rejected_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale || undefined })}
                  </p>
                  {expense.rejection_reason && (
                    <p className="text-xs mt-1 italic text-destructive">
                      {d.reason}: {expense.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {expense.paid_at && (
              <div className="flex items-start gap-3 text-sm">
                <Banknote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-primary">{d.paid}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.on} {format(new Date(expense.paid_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale || undefined })}
                    {expense.payment_method && ` - ${expense.payment_method}`}
                  </p>
                  {expense.payment_reference && (
                    <p className="text-xs font-mono">{d.ref}: {expense.payment_reference}</p>
                  )}
                </div>
              </div>
            )}

            {expense.was_blocked_by_cap && expense.cap_override_reason && (
              <div className="flex items-start gap-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">{d.capUnblocked}</p>
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
