import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Truck,
  MapPin,
  Receipt,
  Plus,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DeliveryData {
  bl_id: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number | null;
  cur_reel: number | null;
  marge_brute_pct: number | null;
  mode_paiement: string | null;
  prix_livraison_m3: number | null;
  temps_attente_chantier_minutes: number | null;
  facturer_attente: boolean | null;
  heure_depart_centrale: string | null;
  heure_arrivee_chantier: string | null;
  heure_retour_centrale: string | null;
  toupie_assignee: string | null;
  camion_assigne: string | null;
  bc_id: string | null;
  clients?: { nom_client: string } | null;
  zones_livraison?: { nom_zone: string; code_zone: string } | null;
}

interface SmartInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: DeliveryData;
  onInvoiceGenerated: () => void;
}

const FRAIS_ATTENTE_PAR_HEURE = 500; // 500 DH per hour after 30 min threshold

export function SmartInvoiceDialog({
  open,
  onOpenChange,
  delivery,
  onInvoiceGenerated,
}: SmartInvoiceDialogProps) {
  const { user, isCeo, isAgentAdministratif } = useAuth();
  const [generating, setGenerating] = useState(false);
  
  // Editable invoice fields
  const [prixVente, setPrixVente] = useState('');
  const [fraisAttente, setFraisAttente] = useState(0);
  const [supplements, setSupplements] = useState<Array<{ label: string; amount: number }>>([]);
  const [notes, setNotes] = useState('');
  const [applyWaitingFee, setApplyWaitingFee] = useState(false);

  // Calculate waiting fee based on actual time
  useEffect(() => {
    if (delivery) {
      setPrixVente(delivery.prix_vente_m3?.toString() || '');
      
      // Auto-calculate waiting fees if applicable
      const waitMinutes = delivery.temps_attente_chantier_minutes || 0;
      const billableMinutes = Math.max(0, waitMinutes - 30); // First 30 min free
      const billableHours = billableMinutes / 60;
      const suggestedFee = Math.ceil(billableHours) * FRAIS_ATTENTE_PAR_HEURE;
      
      if (delivery.facturer_attente || waitMinutes > 30) {
        setApplyWaitingFee(true);
        setFraisAttente(suggestedFee);
      } else {
        setApplyWaitingFee(false);
        setFraisAttente(0);
      }
    }
  }, [delivery]);

  const canGenerate = isCeo || isAgentAdministratif;

  // Calculate totals
  const prix = parseFloat(prixVente) || delivery.prix_vente_m3 || 0;
  const baseHT = prix * delivery.volume_m3;
  const livraisonFees = (delivery.prix_livraison_m3 || 0) * delivery.volume_m3;
  const waitingFees = applyWaitingFee ? fraisAttente : 0;
  const supplementsTotal = supplements.reduce((sum, s) => sum + s.amount, 0);
  const totalHT = baseHT + livraisonFees + waitingFees + supplementsTotal;
  const tva = 20;
  const totalTTC = totalHT * (1 + tva / 100);
  
  // Margin calculation
  const curReel = delivery.cur_reel || 0;
  const margeBruteDH = curReel ? (prix - curReel) * delivery.volume_m3 : null;
  const margePct = curReel && prix ? ((prix - curReel) / prix) * 100 : delivery.marge_brute_pct;

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '--:--';
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: fr });
    } catch {
      return '--:--';
    }
  };

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins} min`;
  };

  const generateFactureId = () => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FAC-${year}${month}-${random}`;
  };

  const handleValidateInvoice = async () => {
    if (!prix || prix <= 0) {
      toast.error('Veuillez définir un prix de vente valide');
      return;
    }

    setGenerating(true);

    try {
      const factureId = generateFactureId();

      // Update BL if price changed
      if (prixVente && parseFloat(prixVente) !== delivery.prix_vente_m3) {
        const { error: updateError } = await supabase
          .from('bons_livraison_reels')
          .update({ prix_vente_m3: parseFloat(prixVente) })
          .eq('bl_id', delivery.bl_id);

        if (updateError) throw updateError;
      }

      // Create facture record with all fees
      const { error: factureError } = await supabase
        .from('factures')
        .insert([{
          facture_id: factureId,
          bl_id: delivery.bl_id,
          bc_id: delivery.bc_id,
          client_id: delivery.client_id,
          formule_id: delivery.formule_id,
          volume_m3: delivery.volume_m3,
          prix_vente_m3: prix,
          total_ht: totalHT,
          tva_pct: tva,
          total_ttc: totalTTC,
          cur_reel: delivery.cur_reel,
          marge_brute_dh: margeBruteDH,
          marge_brute_pct: margePct,
          mode_paiement: delivery.mode_paiement || 'virement',
          prix_livraison_m3: delivery.prix_livraison_m3 || 0,
          created_by: user?.id,
        }]);

      if (factureError) throw factureError;

      // Update BL to facture status
      const { error: blError } = await supabase
        .from('bons_livraison_reels')
        .update({
          workflow_status: 'facture',
          facture_generee: true,
          facture_id: factureId,
        })
        .eq('bl_id', delivery.bl_id);

      if (blError) throw blError;

      toast.success(`Facture ${factureId} validée avec succès`);
      onOpenChange(false);
      onInvoiceGenerated();
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Erreur lors de la validation de la facture');
    } finally {
      setGenerating(false);
    }
  };

  const addSupplement = () => {
    setSupplements([...supplements, { label: '', amount: 0 }]);
  };

  const updateSupplement = (index: number, field: 'label' | 'amount', value: string | number) => {
    const updated = [...supplements];
    updated[index] = { ...updated[index], [field]: value };
    setSupplements(updated);
  };

  const removeSupplement = (index: number) => {
    setSupplements(supplements.filter((_, i) => i !== index));
  };

  if (!canGenerate) {
    return null;
  }

  const waitMinutes = delivery.temps_attente_chantier_minutes || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Validation Facture - Proforma
          </DialogTitle>
          <DialogDescription>
            Vérifiez les détails et ajoutez les suppléments avant validation finale.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Delivery Summary */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold">{delivery.bl_id}</span>
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                Livré
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">
                Client: <span className="text-foreground">{delivery.clients?.nom_client || delivery.client_id}</span>
              </div>
              <div className="text-muted-foreground">
                Volume: <span className="font-semibold text-foreground">{delivery.volume_m3} m³</span>
              </div>
              <div className="text-muted-foreground">
                Formule: <span className="font-mono text-foreground">{delivery.formule_id}</span>
              </div>
              {delivery.zones_livraison && (
                <div className="text-muted-foreground">
                  Zone: <span className="text-foreground">{delivery.zones_livraison.code_zone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rotation Times */}
          <div className="p-3 rounded-lg border space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Temps de Rotation
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-muted/30 rounded">
                <p className="text-muted-foreground">Départ</p>
                <p className="font-mono font-medium">{formatTime(delivery.heure_depart_centrale)}</p>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <p className="text-muted-foreground">Arrivée</p>
                <p className="font-mono font-medium">{formatTime(delivery.heure_arrivee_chantier)}</p>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <p className="text-muted-foreground">Retour</p>
                <p className="font-mono font-medium">{formatTime(delivery.heure_retour_centrale)}</p>
              </div>
            </div>
            {waitMinutes > 0 && (
              <div className={cn(
                "flex items-center justify-between p-2 rounded text-sm",
                waitMinutes > 30 ? "bg-warning/10 text-warning" : "bg-muted/30"
              )}>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Temps d'attente sur site
                </span>
                <span className="font-semibold">{formatMinutes(waitMinutes)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Pricing Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Tarification</h4>
            
            {/* Base Price */}
            <div className="flex items-center gap-3">
              <Label className="flex-1">Prix Vente (DH/m³)</Label>
              <Input
                type="number"
                step="0.01"
                value={prixVente}
                onChange={(e) => setPrixVente(e.target.value)}
                className="w-32 text-right font-mono"
              />
            </div>

            {/* Waiting Fee Toggle */}
            {waitMinutes > 30 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-sm font-medium">Frais d'Attente (CGV Art.4)</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMinutes(waitMinutes - 30)} facturable
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={applyWaitingFee}
                    onCheckedChange={setApplyWaitingFee}
                  />
                  {applyWaitingFee && (
                    <Input
                      type="number"
                      value={fraisAttente}
                      onChange={(e) => setFraisAttente(parseFloat(e.target.value) || 0)}
                      className="w-24 text-right font-mono"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Supplements */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Suppléments</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addSupplement}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Ajouter
                </Button>
              </div>
              {supplements.map((supp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Description"
                    value={supp.label}
                    onChange={(e) => updateSupplement(idx, 'label', e.target.value)}
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="DH"
                    value={supp.amount || ''}
                    onChange={(e) => updateSupplement(idx, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-24 h-8 text-right font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSupplement(idx)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Invoice Summary */}
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Récapitulatif Facture
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Béton ({delivery.volume_m3}m³ × {prix.toFixed(2)})</span>
                <span className="font-mono">{baseHT.toFixed(2)} DH</span>
              </div>
              {livraisonFees > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="font-mono">{livraisonFees.toFixed(2)} DH</span>
                </div>
              )}
              {waitingFees > 0 && (
                <div className="flex justify-between text-warning">
                  <span>Frais d'attente</span>
                  <span className="font-mono">{waitingFees.toFixed(2)} DH</span>
                </div>
              )}
              {supplements.map((supp, idx) => supp.amount > 0 && (
                <div key={idx} className="flex justify-between">
                  <span className="text-muted-foreground">{supp.label || 'Supplément'}</span>
                  <span className="font-mono">{supp.amount.toFixed(2)} DH</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-mono font-medium">{totalHT.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA ({tva}%)</span>
                <span className="font-mono">{(totalHT * tva / 100).toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total TTC</span>
                <span className="font-mono text-primary">{totalTTC.toFixed(2)} DH</span>
              </div>
            </div>
          </div>

          {/* Margin Info */}
          {margePct !== null && (
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg text-sm",
              margePct < 15 ? "bg-destructive/10 text-destructive" :
              margePct < 20 ? "bg-warning/10 text-warning" :
              "bg-success/10 text-success"
            )}>
              <span className="flex items-center gap-2">
                {margePct < 20 && <AlertTriangle className="h-4 w-4" />}
                Marge Brute
              </span>
              <span className="font-mono font-bold">{margePct.toFixed(1)}%</span>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm">Notes internes</Label>
            <Textarea
              placeholder="Notes pour cette facture..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleValidateInvoice}
            disabled={generating || !prix || prix <= 0}
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Valider & Générer Facture
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
