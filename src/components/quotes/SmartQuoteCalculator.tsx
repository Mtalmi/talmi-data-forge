import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import { Calculator, Loader2, TrendingUp, Truck, Package, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Formule {
  formule_id: string;
  designation: string;
  ciment_kg_m3: number;
  eau_l_m3: number;
  adjuvant_l_m3: number;
  sable_m3: number | null;
  gravette_m3: number | null;
  sable_kg_m3: number | null;
  gravier_kg_m3: number | null;
}

interface QuoteResult {
  cut_per_m3: number;
  fixed_cost_per_m3: number;
  transport_extra_per_m3: number;
  total_cost_per_m3: number;
  margin_pct: number;
  prix_vente_minimum: number;
  total_quote: number;
}

interface Prix {
  matiere_premiere: string;
  prix_unitaire_dh: number;
}

export default function SmartQuoteCalculator() {
  const [formules, setFormules] = useState<Formule[]>([]);
  const [prix, setPrix] = useState<Prix[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [selectedFormule, setSelectedFormule] = useState('');
  const [volume, setVolume] = useState('');
  const [distance, setDistance] = useState('20');
  
  // Quote result
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  useEffect(() => {
    if (dialogOpen) {
      fetchData();
    }
  }, [dialogOpen]);

  const fetchData = async () => {
    try {
      const [formulesRes, prixRes] = await Promise.all([
        supabase.from('formules_theoriques').select('*'),
        supabase.from('prix_achat_actuels').select('matiere_premiere, prix_unitaire_dh'),
      ]);

      if (formulesRes.error) throw formulesRes.error;
      if (prixRes.error) throw prixRes.error;

      setFormules(formulesRes.data || []);
      setPrix(prixRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const getPrice = useCallback((keyword: string): number => {
    const found = prix.find(p => p.matiere_premiere.toLowerCase().includes(keyword.toLowerCase()));
    return found?.prix_unitaire_dh || 0;
  }, [prix]);

  const calculateCUT = useCallback((formule: Formule): number => {
    const prixCiment = getPrice('ciment');
    const prixSable = getPrice('sable');
    const prixGravette = getPrice('gravier') || getPrice('gravette');
    const prixEau = getPrice('eau');
    const prixAdjuvant = getPrice('adjuvant');

    // Calculate sable in m³
    const sableM3 = formule.sable_m3 || (formule.sable_kg_m3 ? formule.sable_kg_m3 / 1600 : 0);
    // Calculate gravette in m³
    const gravetteM3 = formule.gravette_m3 || (formule.gravier_kg_m3 ? formule.gravier_kg_m3 / 1500 : 0);

    let cut = 0;
    // Ciment: price per tonne, convert kg to tonnes
    cut += (formule.ciment_kg_m3 / 1000) * prixCiment;
    // Sable: price per m³
    cut += sableM3 * prixSable;
    // Gravette: price per m³
    cut += gravetteM3 * prixGravette;
    // Eau: price per m³, convert liters to m³
    cut += (formule.eau_l_m3 / 1000) * prixEau;
    // Adjuvant: price per liter
    cut += formule.adjuvant_l_m3 * prixAdjuvant;

    return Math.round(cut * 100) / 100;
  }, [getPrice]);

  const calculateQuote = () => {
    if (!selectedFormule || !volume) {
      toast.error('Veuillez sélectionner une formule et un volume');
      return;
    }

    setLoading(true);
    
    try {
      const formule = formules.find(f => f.formule_id === selectedFormule);
      if (!formule) {
        toast.error('Formule non trouvée');
        setLoading(false);
        return;
      }

      const volumeM3 = parseFloat(volume);
      const distanceKm = parseFloat(distance) || 20;
      const fixedCost = 150; // Fixed overhead per m³
      const marginPct = 0.25; // 25% margin

      // Calculate CUT
      const cut = calculateCUT(formule);

      // Calculate extra transport cost beyond 20km (5 DH/m³/km)
      const transportExtra = distanceKm > 20 ? (distanceKm - 20) * 5 : 0;

      // Total cost per m³
      const totalCost = cut + fixedCost + transportExtra;

      // Prix de Vente Minimum with 25% margin
      const pvm = totalCost / (1 - marginPct);

      setQuoteResult({
        cut_per_m3: cut,
        fixed_cost_per_m3: fixedCost,
        transport_extra_per_m3: transportExtra,
        total_cost_per_m3: totalCost,
        margin_pct: marginPct * 100,
        prix_vente_minimum: Math.round(pvm * 100) / 100,
        total_quote: Math.round(pvm * volumeM3 * 100) / 100,
      });

      toast.success('Devis calculé avec succès');
    } catch (error) {
      console.error('Error calculating quote:', error);
      toast.error('Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const resetCalculator = () => {
    setSelectedFormule('');
    setVolume('');
    setDistance('20');
    setQuoteResult(null);
  };

  const selectedFormuleData = formules.find(f => f.formule_id === selectedFormule);

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => {
      setDialogOpen(open);
      if (!open) resetCalculator();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="h-4 w-4" />
          Calculateur de Devis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculateur de Devis Intelligent
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left: Input Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="form-label-industrial">Formule Béton</Label>
              <Select value={selectedFormule} onValueChange={setSelectedFormule}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une formule" />
                </SelectTrigger>
                <SelectContent>
                  {formules.map((f) => (
                    <SelectItem key={f.formule_id} value={f.formule_id}>
                      {f.formule_id} - {f.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFormuleData && (
              <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
                <p className="font-medium text-muted-foreground mb-2">Composition par m³:</p>
                <div className="grid grid-cols-2 gap-1">
                  <span>Ciment: {selectedFormuleData.ciment_kg_m3} kg</span>
                  <span>Eau: {selectedFormuleData.eau_l_m3} L</span>
                  <span>Adjuvant: {selectedFormuleData.adjuvant_l_m3} L</span>
                  <span>
                    Sable: {selectedFormuleData.sable_m3 
                      ? `${selectedFormuleData.sable_m3} m³` 
                      : selectedFormuleData.sable_kg_m3 
                        ? `${selectedFormuleData.sable_kg_m3} kg` 
                        : '—'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="form-label-industrial">Volume (m³)</Label>
              <Input
                type="number"
                min="0.5"
                max="100"
                step="0.5"
                placeholder="Ex: 12"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="form-label-industrial flex items-center gap-2">
                Distance (km)
                <span className="text-xs text-muted-foreground font-normal">
                  (gratuit jusqu'à 20km)
                </span>
              </Label>
              <Input
                type="number"
                min="1"
                max="200"
                step="1"
                placeholder="20"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
              {parseFloat(distance) > 20 && (
                <p className="text-xs text-warning flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  +{((parseFloat(distance) - 20) * 5).toFixed(0)} DH/m³ transport supplémentaire
                </p>
              )}
            </div>

            <Button 
              onClick={calculateQuote} 
              disabled={loading || !selectedFormule || !volume}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calcul...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculer le Devis
                </>
              )}
            </Button>
          </div>

          {/* Right: Results */}
          <div className="space-y-4">
            {quoteResult ? (
              <>
                {/* Total Quote Highlight */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                    Prix de Vente Minimum
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {quoteResult.prix_vente_minimum.toLocaleString()} DH/m³
                  </p>
                  <div className="mt-2 pt-2 border-t border-primary/20">
                    <p className="text-lg font-semibold">
                      Total Devis: <span className="text-primary">{quoteResult.total_quote.toLocaleString()} DH</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      pour {volume} m³
                    </p>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    Décomposition des coûts
                  </p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                      <span className="text-sm flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        Coût Unitaire Théorique (CUT)
                      </span>
                      <span className="font-mono font-medium">
                        {quoteResult.cut_per_m3.toFixed(2)} DH
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                      <span className="text-sm">+ Frais fixes</span>
                      <span className="font-mono font-medium">
                        {quoteResult.fixed_cost_per_m3.toFixed(2)} DH
                      </span>
                    </div>
                    
                    {quoteResult.transport_extra_per_m3 > 0 && (
                      <div className="flex justify-between items-center p-2 rounded bg-warning/10">
                        <span className="text-sm flex items-center gap-2">
                          <Truck className="h-4 w-4 text-warning" />
                          + Transport ({parseFloat(distance) - 20}km × 5 DH)
                        </span>
                        <span className="font-mono font-medium text-warning">
                          {quoteResult.transport_extra_per_m3.toFixed(2)} DH
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center p-2 rounded border border-muted">
                      <span className="text-sm font-medium">= Coût Total</span>
                      <span className="font-mono font-bold">
                        {quoteResult.total_cost_per_m3.toFixed(2)} DH/m³
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 rounded bg-success/10">
                      <span className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-success" />
                        Marge ({quoteResult.margin_pct}%)
                      </span>
                      <span className="font-mono font-medium text-success">
                        +{(quoteResult.prix_vente_minimum - quoteResult.total_cost_per_m3).toFixed(2)} DH
                      </span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" onClick={resetCalculator} className="w-full">
                  Nouveau Calcul
                </Button>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 rounded-lg border-2 border-dashed border-muted">
                <Calculator className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Sélectionnez une formule et un volume pour calculer le devis
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Formule: CUT + 150 DH/m³ + Transport<br />
                  Marge minimale: 25%
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
