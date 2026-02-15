import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useZonesLivraison, MODES_PAIEMENT } from '@/hooks/useZonesLivraison';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MarginAnalysisBox } from './MarginAnalysisBox';
import { InvoiceGenerator } from './InvoiceGenerator';
import { 
  Truck, Package, Calendar, User, FileText, DollarSign,
  Lock, Loader2, Save, MapPin, CreditCard, Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface BonDetail {
  bl_id: string;
  date_livraison: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  ciment_reel_kg: number;
  adjuvant_reel_l: number | null;
  eau_reel_l: number | null;
  prix_vente_m3: number | null;
  cur_reel: number | null;
  marge_brute_pct: number | null;
  workflow_status: string | null;
  statut_paiement: string;
  toupie_assignee: string | null;
  chauffeur_nom: string | null;
  facture_id: string | null;
  created_at: string;
  zone_livraison_id: string | null;
  mode_paiement: string | null;
  prix_livraison_m3: number | null;
  prestataire_id: string | null;
}

interface BonDetailDialogProps {
  blId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function BonDetailDialog({ blId, open, onOpenChange, onUpdate }: BonDetailDialogProps) {
  const { isCeo, isAgentAdministratif } = useAuth();
  const { getZoneById, getPrestataireById } = useZonesLivraison();
  const { t, lang } = useI18n();
  const bd = t.bonDetail;
  const dateLocale = getDateLocale(lang);
  const [bon, setBon] = useState<BonDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [prixVente, setPrixVente] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (blId && open) fetchBonDetail();
  }, [blId, open]);

  const fetchBonDetail = async () => {
    if (!blId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bons_livraison_reels')
        .select('*')
        .eq('bl_id', blId)
        .single();
      if (error) throw error;
      setBon(data);
      setPrixVente(data.prix_vente_m3?.toString() || '');
    } catch (error) {
      console.error('Error fetching bon detail:', error);
      toast.error(bd.loadError);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrix = async () => {
    if (!bon || !prixVente) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ prix_vente_m3: parseFloat(prixVente) })
        .eq('bl_id', bon.bl_id);
      if (error) throw error;
      toast.success(bd.priceUpdated);
      fetchBonDetail();
      onUpdate();
    } catch (error: any) {
      console.error('Error updating prix:', error);
      if (error.message?.includes('verrouillé')) {
        toast.error(bd.priceLocked);
      } else {
        toast.error(bd.updateError);
      }
    } finally {
      setSaving(false);
    }
  };

  const isLocked = bon?.workflow_status === 'facture';
  const canEditPrix = (isCeo || isAgentAdministratif) && !isLocked;

  const getWorkflowLabel = (status: string | null) => {
    const wl = bd.workflowLabels;
    const labels: Record<string, { label: string; color: string }> = {
      planification: { label: wl.planification, color: 'bg-muted' },
      production: { label: wl.production, color: 'bg-warning/20 text-warning' },
      validation_technique: { label: wl.validation_technique, color: 'bg-purple-500/20 text-purple-500' },
      en_livraison: { label: wl.en_livraison, color: 'bg-blue-500/20 text-blue-500' },
      livre: { label: wl.livre, color: 'bg-success/20 text-success' },
      facture: { label: wl.facture, color: 'bg-primary/20 text-primary' },
      annule: { label: wl.annule, color: 'bg-destructive/20 text-destructive' },
    };
    return labels[status || 'planification'] || labels.planification;
  };

  if (loading || !bon) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const workflowStyle = getWorkflowLabel(bon.workflow_status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {bd.deliveryNote} {bon.bl_id}
            </DialogTitle>
            <Badge className={cn(workflowStyle.color)}>
              {isLocked && <Lock className="h-3 w-3 mr-1" />}
              {workflowStyle.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{bd.deliveryDate}</p>
                <p className="font-medium">
                  {format(new Date(bon.date_livraison), 'dd MMMM yyyy', { locale: dateLocale })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{bd.client}</p>
                <p className="font-medium">{bon.client_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{bd.formula}</p>
                <p className="font-mono font-medium">{bon.formule_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{bd.volume}</p>
                <p className="font-bold">{bon.volume_m3} m³</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border/50">
            <h4 className="font-semibold text-sm mb-3">{bd.actualConsumption}</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{bd.cement}</p>
                <p className="font-mono font-medium">{bon.ciment_reel_kg} kg</p>
              </div>
              <div>
                <p className="text-muted-foreground">{bd.adjuvant}</p>
                <p className="font-mono font-medium">{bon.adjuvant_reel_l || '—'} L</p>
              </div>
              <div>
                <p className="text-muted-foreground">{bd.water}</p>
                <p className="font-mono font-medium">{bon.eau_reel_l || '—'} L</p>
              </div>
            </div>
          </div>

          {(bon.zone_livraison_id || bon.mode_paiement || bon.prestataire_id) && (
            <div className="p-4 rounded-lg border border-border/50">
              <h4 className="font-semibold text-sm mb-3">{bd.logisticsPayment}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {bon.zone_livraison_id && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{bd.deliveryZone}</p>
                      <p className="font-medium">
                        {getZoneById(bon.zone_livraison_id)?.nom_zone || bon.zone_livraison_id}
                        {bon.prix_livraison_m3 ? ` (${bon.prix_livraison_m3} DH/m³)` : ''}
                      </p>
                    </div>
                  </div>
                )}
                {bon.mode_paiement && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{bd.paymentMode}</p>
                      <p className="font-medium capitalize">
                        {MODES_PAIEMENT.find(m => m.value === bon.mode_paiement)?.label || bon.mode_paiement}
                      </p>
                    </div>
                  </div>
                )}
                {bon.prestataire_id && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{bd.transportProvider}</p>
                      <p className="font-medium">
                        {getPrestataireById(bon.prestataire_id)?.nom_prestataire || bon.prestataire_id}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 rounded-lg border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {bd.sellingPrice}
              </h4>
              {isLocked && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  {bd.locked}
                </Badge>
              )}
            </div>
            
            {canEditPrix ? (
              <div className="flex gap-2">
                <Input type="number" step="0.01" min="0" value={prixVente}
                  onChange={(e) => setPrixVente(e.target.value)} placeholder={bd.pricePlaceholder} className="flex-1" />
                <Button onClick={handleSavePrix} disabled={saving || !prixVente} size="sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <><Save className="h-4 w-4 mr-1" />{bd.save}</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted font-mono text-lg">
                {bon.prix_vente_m3 ? `${bon.prix_vente_m3.toFixed(2)} DH/m³` : bd.notDefined}
              </div>
            )}
          </div>

          <Separator />

          <MarginAnalysisBox
            blId={bon.bl_id} formuleId={bon.formule_id} volumeM3={bon.volume_m3}
            cimentReelKg={bon.ciment_reel_kg} adjuvantReelL={bon.adjuvant_reel_l}
            eauReelL={bon.eau_reel_l} prixVenteM3={bon.prix_vente_m3}
            curReelFromDb={bon.cur_reel} margeBrutePct={bon.marge_brute_pct}
          />

          <Separator />

          <InvoiceGenerator
            blId={bon.bl_id} clientId={bon.client_id} formuleId={bon.formule_id}
            volumeM3={bon.volume_m3} prixVenteM3={bon.prix_vente_m3}
            curReel={bon.cur_reel} margeBrutePct={bon.marge_brute_pct}
            workflowStatus={bon.workflow_status} modePaiement={bon.mode_paiement}
            prixLivraisonM3={bon.prix_livraison_m3}
            onInvoiceGenerated={() => { fetchBonDetail(); onUpdate(); }}
          />

          {bon.facture_id && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {bd.invoice}: <span className="font-mono font-medium">{bon.facture_id}</span>
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
