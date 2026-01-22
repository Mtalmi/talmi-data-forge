import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Wrench, Loader2, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Stock {
  materiau: string;
  unite: string;
  quantite_actuelle: number;
}

interface StockAdjustmentDialogProps {
  stocks: Stock[];
  onRefresh?: () => void;
}

const REASON_CODES = [
  { value: 'inventaire_physique', label: 'Inventaire Physique' },
  { value: 'correction_erreur', label: 'Correction d\'Erreur de Saisie' },
  { value: 'perte_materiel', label: 'Perte/Casse de Matériel' },
  { value: 'audit_externe', label: 'Ajustement Post-Audit' },
  { value: 'etalonnage', label: 'Calibration/Étalonnage' },
  { value: 'autre', label: 'Autre (Justification Requise)' },
];

export function StockAdjustmentDialog({ stocks, onRefresh }: StockAdjustmentDialogProps) {
  const { isCeo, isSuperviseur } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [materiau, setMateriau] = useState('');
  const [nouvelleQuantite, setNouvelleQuantite] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [notes, setNotes] = useState('');

  // STRICT: Only CEO and Superviseur can access this
  const canAdjust = isCeo || isSuperviseur;

  if (!canAdjust) {
    return null;
  }

  const resetForm = () => {
    setMateriau('');
    setNouvelleQuantite('');
    setReasonCode('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reasonCode) {
      toast.error('Code raison obligatoire');
      return;
    }

    if (reasonCode === 'autre' && !notes.trim()) {
      toast.error('Justification détaillée requise pour "Autre"');
      return;
    }
    
    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('secure_adjust_stock', {
        p_materiau: materiau,
        p_nouvelle_quantite: parseFloat(nouvelleQuantite),
        p_reason_code: reasonCode,
        p_notes: notes
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string; delta?: number };
      
      if (!result.success) {
        toast.error(result.error || 'Erreur lors de l\'ajustement');
        return;
      }

      toast.success(result.message || 'Ajustement effectué');
      resetForm();
      setOpen(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Erreur lors de l\'ajustement');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStock = stocks.find(s => s.materiau === materiau);
  const delta = selectedStock && nouvelleQuantite 
    ? parseFloat(nouvelleQuantite) - selectedStock.quantite_actuelle 
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 min-h-[44px] border-warning/50 text-warning hover:bg-warning/10">
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">Ajustement Manuel</span>
          <span className="sm:hidden">Ajuster</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-warning" />
            Ajustement Manuel de Stock
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            Cette action est auditée et visible dans le tableau de bord CEO
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="form-label-industrial">Matériau</Label>
            <Select value={materiau} onValueChange={setMateriau} required>
              <SelectTrigger className="min-h-[48px]">
                <SelectValue placeholder="Sélectionner le matériau..." />
              </SelectTrigger>
              <SelectContent>
                {stocks.map((s) => (
                  <SelectItem key={s.materiau} value={s.materiau}>
                    {s.materiau} - Actuel: {s.quantite_actuelle.toLocaleString()} {s.unite}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="form-label-industrial">
              Nouvelle Quantité {selectedStock ? `(${selectedStock.unite})` : ''}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={nouvelleQuantite}
              onChange={(e) => setNouvelleQuantite(e.target.value)}
              required
              className="min-h-[48px]"
            />
          </div>

          {/* Reason Code - MANDATORY */}
          <div className="space-y-2">
            <Label className="form-label-industrial text-warning">
              Code Raison <span className="text-destructive">*</span>
            </Label>
            <Select value={reasonCode} onValueChange={setReasonCode} required>
              <SelectTrigger className="min-h-[48px]">
                <SelectValue placeholder="Sélectionner la raison..." />
              </SelectTrigger>
              <SelectContent>
                {REASON_CODES.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="form-label-industrial">
              Justification Détaillée {reasonCode === 'autre' && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              placeholder="Expliquez la raison de cet ajustement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              required={reasonCode === 'autre'}
            />
          </div>

          {/* Delta Preview */}
          {selectedStock && nouvelleQuantite && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Stock actuel:</span>
                <span className="font-mono font-semibold">
                  {selectedStock.quantite_actuelle.toLocaleString()} {selectedStock.unite}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-muted-foreground">Nouveau stock:</span>
                <span className="font-mono font-semibold">
                  {parseFloat(nouvelleQuantite).toLocaleString()} {selectedStock.unite}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-warning/30">
                <span className="font-semibold">Variation:</span>
                <span className={`font-mono font-bold ${delta >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {delta >= 0 ? '+' : ''}{delta.toLocaleString()} {selectedStock.unite}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="min-h-[44px]">
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={submitting || !reasonCode}
              className="min-h-[44px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajustement...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Confirmer l'Ajustement
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
