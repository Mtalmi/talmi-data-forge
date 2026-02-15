import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Receipt, User, Truck, Calendar, CreditCard, TrendingUp, FileText, CheckCircle, Clock, AlertCircle, Layers,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { FacturePdfGenerator } from '@/components/documents/FacturePdfGenerator';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface Facture {
  id: string;
  facture_id: string;
  bl_id: string;
  bc_id: string | null;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number;
  total_ht: number;
  total_ttc: number;
  tva_pct: number;
  marge_brute_pct: number | null;
  marge_brute_dh: number | null;
  cur_reel: number | null;
  statut: string;
  mode_paiement: string | null;
  is_consolidee: boolean | null;
  bls_inclus: string[] | null;
  date_facture: string;
  created_at: string;
  client_name?: string;
  formule_designation?: string;
}

interface FactureDetailDialogProps {
  facture: Facture | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FactureDetailDialog({ facture, open, onOpenChange }: FactureDetailDialogProps) {
  const { t, lang } = useI18n();
  const fd = t.factureDetail;
  const ft = t.facturesTable;
  const c = t.common;
  const dateLocale = getDateLocale(lang);

  if (!facture) return null;

  const FACTURE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    emise: { label: ft.statusEmise, color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-4 w-4" /> },
    envoyee: { label: ft.statusEnvoyee, color: 'bg-primary/10 text-primary border-primary/30', icon: <FileText className="h-4 w-4" /> },
    payee: { label: ft.statusPayee, color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-4 w-4" /> },
    retard: { label: ft.statusRetard, color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertCircle className="h-4 w-4" /> },
  };

  const PAYMENT_MODE_LABELS: Record<string, string> = {
    virement: fd.bankTransfer,
    cheque: fd.check,
    especes: fd.cash,
    traite: fd.draft,
  };

  const statusConfig = FACTURE_STATUS_CONFIG[facture.statut] || FACTURE_STATUS_CONFIG.emise;
  const isConsolidated = facture.is_consolidee && facture.bls_inclus && facture.bls_inclus.length > 1;
  const tvaAmount = facture.total_ttc - facture.total_ht;

  const pdfFacture = {
    facture_id: facture.facture_id,
    bl_id: facture.bl_id,
    volume_m3: facture.volume_m3,
    prix_vente_m3: facture.prix_vente_m3,
    total_ht: facture.total_ht,
    tva_pct: facture.tva_pct,
    total_ttc: facture.total_ttc,
    cur_reel: facture.cur_reel,
    marge_brute_pct: facture.marge_brute_pct,
    date_emission: facture.date_facture,
    client: facture.client_name ? { nom_client: facture.client_name, adresse: null, telephone: null } : undefined,
    formule: facture.formule_designation ? { designation: facture.formule_designation } : undefined,
    formule_id: facture.formule_id,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{facture.facture_id}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(facture.date_facture), 'dd MMMM yyyy', { locale: dateLocale || undefined })}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={cn("gap-1 text-sm px-3 py-1", statusConfig.color)}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {isConsolidated && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Layers className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{fd.consolidatedInvoice}</p>
                <p className="text-xs text-muted-foreground">
                  {fd.groupsDeliveries} {facture.bls_inclus?.length} {ft.deliveries}: {facture.bls_inclus?.join(', ')}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {c.client}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{facture.client_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">ID: {facture.client_id}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  {fd.references}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">BL:</span>{' '}
                    <span className="font-mono font-medium">{facture.bl_id}</span>
                  </p>
                  {facture.bc_id && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">BC:</span>{' '}
                      <span className="font-mono font-medium">{facture.bc_id}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                {fd.financialDetails}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{fd.concrete} {facture.formule_id}</p>
                    <p className="text-sm text-muted-foreground">{facture.formule_designation}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">{facture.volume_m3} m³</p>
                    <p className="text-sm text-muted-foreground">{facture.prix_vente_m3.toLocaleString()} DH/m³</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{c.totalHT}</span>
                    <span className="font-mono">{facture.total_ht.toLocaleString()} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{c.tax} ({facture.tva_pct}%)</span>
                    <span className="font-mono">{tvaAmount.toLocaleString()} DH</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total TTC</span>
                    <span className="font-mono text-primary">{facture.total_ttc.toLocaleString()} DH</span>
                  </div>
                </div>

                {facture.mode_paiement && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">{fd.paymentMode}</span>
                    <Badge variant="outline">
                      {PAYMENT_MODE_LABELS[facture.mode_paiement] || facture.mode_paiement}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(facture.marge_brute_pct !== null || facture.cur_reel !== null) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  {fd.marginAnalysis}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {facture.cur_reel !== null && (
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">{fd.curReal}</p>
                      <p className="font-mono font-semibold">{facture.cur_reel.toLocaleString()} DH/m³</p>
                    </div>
                  )}
                  {facture.marge_brute_dh !== null && (
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">{fd.grossMargin}</p>
                      <p className="font-mono font-semibold">{facture.marge_brute_dh.toLocaleString()} DH</p>
                    </div>
                  )}
                  {facture.marge_brute_pct !== null && (
                    <div className={cn(
                      "text-center p-3 rounded-lg",
                      facture.marge_brute_pct >= 25 && "bg-success/10",
                      facture.marge_brute_pct >= 15 && facture.marge_brute_pct < 25 && "bg-warning/10",
                      facture.marge_brute_pct < 15 && "bg-destructive/10"
                    )}>
                      <p className="text-xs text-muted-foreground mb-1">{fd.marginPct}</p>
                      <p className={cn(
                        "font-mono font-bold text-lg",
                        facture.marge_brute_pct >= 25 && "text-success",
                        facture.marge_brute_pct >= 15 && facture.marge_brute_pct < 25 && "text-warning",
                        facture.marge_brute_pct < 15 && "text-destructive"
                      )}>
                        {facture.marge_brute_pct.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {c.close}
            </Button>
            <FacturePdfGenerator facture={pdfFacture} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
