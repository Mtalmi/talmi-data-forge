import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Loader2, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InvoiceGeneratorProps {
  blId: string;
  clientId: string;
  formuleId: string;
  volumeM3: number;
  prixVenteM3: number | null;
  curReel: number | null;
  margeBrutePct: number | null;
  workflowStatus: string | null;
  modePaiement?: string | null;
  prixLivraisonM3?: number | null;
  onInvoiceGenerated: () => void;
}

export function InvoiceGenerator({
  blId, clientId, formuleId, volumeM3, prixVenteM3, curReel, margeBrutePct,
  workflowStatus, modePaiement, prixLivraisonM3, onInvoiceGenerated,
}: InvoiceGeneratorProps) {
  const { user, isCeo, isAgentAdministratif } = useAuth();
  const { t } = useI18n();
  const ig = t.invoiceGen;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingPrix, setEditingPrix] = useState(false);
  const [prixVente, setPrixVente] = useState(prixVenteM3?.toString() || '');

  const canGenerate = (isCeo || isAgentAdministratif) && workflowStatus === 'livre';
  const isFacture = workflowStatus === 'facture';

  const prix = parseFloat(prixVente) || prixVenteM3 || 0;
  const totalHT = prix * volumeM3;
  const tva = 20;
  const totalTTC = totalHT * (1 + tva / 100);
  const margeBruteDH = curReel ? (prix - curReel) * volumeM3 : null;
  const calculatedMargePct = curReel && prix ? ((prix - curReel) / prix) * 100 : margeBrutePct;

  const generateFactureId = () => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FAC-${year}${month}-${random}`;
  };

  const handleGenerateInvoice = async () => {
    if (!prix || prix <= 0) {
      toast.error(ig.invalidPrice);
      return;
    }
    setGenerating(true);
    try {
      const factureId = generateFactureId();
      if (prixVente && parseFloat(prixVente) !== prixVenteM3) {
        const { error: updateError } = await supabase
          .from('bons_livraison_reels')
          .update({ prix_vente_m3: parseFloat(prixVente) })
          .eq('bl_id', blId);
        if (updateError) throw updateError;
      }
      const { error: factureError } = await supabase
        .from('factures')
        .insert([{
          facture_id: factureId, bl_id: blId, client_id: clientId, formule_id: formuleId,
          volume_m3: volumeM3, prix_vente_m3: prix, total_ht: totalHT, tva_pct: tva,
          total_ttc: totalTTC, cur_reel: curReel, marge_brute_dh: margeBruteDH,
          marge_brute_pct: calculatedMargePct, mode_paiement: modePaiement || 'virement',
          prix_livraison_m3: prixLivraisonM3 || 0, created_by: user?.id,
        }]);
      if (factureError) throw factureError;
      const { error: blError } = await supabase
        .from('bons_livraison_reels')
        .update({ workflow_status: 'facture', facture_generee: true, facture_id: factureId })
        .eq('bl_id', blId);
      if (blError) throw blError;
      toast.success(ig.success.replace('{id}', factureId));
      setDialogOpen(false);
      onInvoiceGenerated();
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error(ig.error);
    } finally {
      setGenerating(false);
    }
  };

  if (isFacture) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm">
        <Lock className="h-4 w-4 text-primary" />
        <span className="text-primary font-medium">{ig.invoiceLocked}</span>
        <span className="text-muted-foreground">- {ig.priceLocked}</span>
      </div>
    );
  }
  if (!canGenerate) return null;

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} className="w-full" variant="default">
        <FileText className="h-4 w-4 mr-2" />
        {ig.generateInvoice}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {ig.generateInvoice}
            </DialogTitle>
            <DialogDescription>{ig.createInvoiceDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">{ig.bon}:</span><span className="font-mono ml-2">{blId}</span></div>
                <div><span className="text-muted-foreground">{ig.client}:</span><span className="ml-2">{clientId}</span></div>
                <div><span className="text-muted-foreground">{ig.formula}:</span><span className="font-mono ml-2">{formuleId}</span></div>
                <div><span className="text-muted-foreground">{ig.volume}:</span><span className="ml-2">{volumeM3} m³</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{ig.sellingPrice}</span>
                {!editingPrix && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingPrix(true)} className="h-6 text-xs">
                    {ig.modify}
                  </Button>
                )}
              </Label>
              {editingPrix ? (
                <Input type="number" step="0.01" min="0" value={prixVente} onChange={(e) => setPrixVente(e.target.value)} placeholder="Ex: 850.00" />
              ) : (
                <div className="p-3 rounded-lg bg-muted font-mono text-lg">
                  {prix > 0 ? `${prix.toFixed(2)} DH/m³` : ig.notDefined}
                </div>
              )}
            </div>

            {prix > 0 && (
              <div className="space-y-2 p-3 rounded-lg border border-border">
                <h4 className="font-semibold text-sm">{ig.invoiceSummary}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{ig.totalHT}</span><span className="font-mono">{totalHT.toFixed(2)} DH</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{ig.tva} ({tva}%)</span><span className="font-mono">{(totalHT * tva / 100).toFixed(2)} DH</span></div>
                  <div className="flex justify-between border-t pt-1 font-bold"><span>{ig.totalTTC}</span><span className="font-mono">{totalTTC.toFixed(2)} DH</span></div>
                </div>
              </div>
            )}

            {calculatedMargePct !== null && calculatedMargePct < 20 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive text-sm">{ig.lowMarginWarning} ({calculatedMargePct.toFixed(1)}%)</p>
                  <p className="text-xs text-muted-foreground mt-1">{ig.lowMarginDesc}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
              <Lock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning text-sm">{ig.priceLockedAfter}</p>
                <p className="text-xs text-muted-foreground mt-1">{ig.priceLockedDesc}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{ig.cancel}</Button>
            <Button onClick={handleGenerateInvoice} disabled={generating || !prix || prix <= 0}>
              {generating ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />{ig.generating}</>) : (<><CheckCircle className="h-4 w-4 mr-2" />{ig.confirmGenerate}</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
