import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Wrench, Loader2, AlertTriangle, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nContext';

interface Stock {
  materiau: string;
  unite: string;
  quantite_actuelle: number;
}

interface StockAdjustmentDialogProps {
  stocks: Stock[];
  onRefresh?: () => void;
}

export function StockAdjustmentDialog({ stocks, onRefresh }: StockAdjustmentDialogProps) {
  const { t } = useI18n();
  const { isCeo, isSuperviseur, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [materiau, setMateriau] = useState('');
  const [nouvelleQuantite, setNouvelleQuantite] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [notes, setNotes] = useState('');

  const REASON_CODES = [
    { value: 'inventaire_physique', label: t.pages.stocks.physicalInventory },
    { value: 'correction_erreur', label: t.pages.stocks.dataEntryCorrection },
    { value: 'perte_materiel', label: t.pages.stocks.materialLoss },
    { value: 'audit_externe', label: t.pages.stocks.postAuditAdjustment },
    { value: 'etalonnage', label: t.pages.stocks.calibration },
    { value: 'autre', label: t.pages.stocks.otherJustificationRequired },
  ];

  const canAdjust = isCeo || isSuperviseur;
  if (authLoading) return <Skeleton className="w-32 h-11 rounded-md" />;
  if (!canAdjust) return null;

  const resetForm = () => { setMateriau(''); setNouvelleQuantite(''); setReasonCode(''); setNotes(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonCode) { toast.error(t.pages.stocks.reasonCodeRequired); return; }
    if (reasonCode === 'autre' && !notes.trim()) { toast.error(t.pages.stocks.detailedJustificationRequired); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('secure_adjust_stock', {
        p_materiau: materiau, p_nouvelle_quantite: parseFloat(nouvelleQuantite),
        p_reason_code: reasonCode, p_notes: notes
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; message?: string; delta?: number };
      if (!result.success) { toast.error(result.error || t.pages.stocks.adjustmentError); return; }
      toast.success(result.message || t.pages.stocks.adjustmentDone);
      resetForm(); setOpen(false); onRefresh?.();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error(t.pages.stocks.adjustmentError);
    } finally { setSubmitting(false); }
  };

  const selectedStock = stocks.find(s => s.materiau === materiau);
  const delta = selectedStock && nouvelleQuantite ? parseFloat(nouvelleQuantite) - selectedStock.quantite_actuelle : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 min-h-[44px] border-warning/50 text-warning hover:bg-warning/10">
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">{t.pages.stocks.manualAdjustment}</span>
          <span className="sm:hidden">{t.pages.stocks.adjust}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-warning" />
            {t.pages.stocks.manualStockAdjustment}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            {t.pages.stocks.auditedAction}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="form-label-industrial">{t.pages.stocks.material}</Label>
            <Select value={materiau} onValueChange={setMateriau} required>
              <SelectTrigger className="min-h-[48px]"><SelectValue placeholder={t.pages.stocks.selectMaterialPlaceholder} /></SelectTrigger>
              <SelectContent>
                {stocks.map((s) => (
                  <SelectItem key={s.materiau} value={s.materiau}>
                    {s.materiau} - {t.pages.stocks.current}: {s.quantite_actuelle.toLocaleString()} {s.unite}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="form-label-industrial">{t.pages.stocks.newQuantity} {selectedStock ? `(${selectedStock.unite})` : ''}</Label>
            <Input type="number" step="0.01" min="0" placeholder="0" value={nouvelleQuantite} onChange={(e) => setNouvelleQuantite(e.target.value)} required className="min-h-[48px]" />
          </div>
          <div className="space-y-2">
            <Label className="form-label-industrial text-warning">{t.pages.stocks.reasonCode} <span className="text-destructive">*</span></Label>
            <Select value={reasonCode} onValueChange={setReasonCode} required>
              <SelectTrigger className="min-h-[48px]"><SelectValue placeholder={t.pages.stocks.selectReason} /></SelectTrigger>
              <SelectContent>
                {REASON_CODES.map((reason) => (<SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="form-label-industrial">{t.pages.stocks.detailedJustification} {reasonCode === 'autre' && <span className="text-destructive">*</span>}</Label>
            <Textarea placeholder={t.pages.stocks.explainAdjustment} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} required={reasonCode === 'autre'} />
          </div>
          {selectedStock && nouvelleQuantite && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t.pages.stocks.currentStockColon}</span>
                <span className="font-mono font-semibold">{selectedStock.quantite_actuelle.toLocaleString()} {selectedStock.unite}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-muted-foreground">{t.pages.stocks.newStockColon}</span>
                <span className="font-mono font-semibold">{parseFloat(nouvelleQuantite).toLocaleString()} {selectedStock.unite}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-warning/30">
                <span className="font-semibold">{t.pages.stocks.variation}</span>
                <span className={`font-mono font-bold ${delta >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {delta >= 0 ? '+' : ''}{delta.toLocaleString()} {selectedStock.unite}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="min-h-[44px]">{t.pages.stocks.cancel}</Button>
            <Button type="submit" variant="destructive" disabled={submitting || !reasonCode} className="min-h-[44px]">
              {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.pages.stocks.adjusting}</>) : (<><Shield className="h-4 w-4 mr-2" />{t.pages.stocks.confirmAdjustment}</>)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
