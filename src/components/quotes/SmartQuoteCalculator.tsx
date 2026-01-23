import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSalesWorkflow } from '@/hooks/useSalesWorkflow';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Calculator, Loader2, TrendingUp, Truck, Package, Info, Save, Clock } from 'lucide-react';
import { toast } from 'sonner';

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
  total_ht: number;
  tva: number;
  total_ttc: number;
}

interface Prix {
  matiere_premiere: string;
  prix_unitaire_dh: number;
}

interface SmartQuoteCalculatorProps {
  variant?: 'default' | 'prominent';
}

export default function SmartQuoteCalculator({ variant = 'default' }: SmartQuoteCalculatorProps) {
  const { saveDevis } = useSalesWorkflow();
  const { isDirecteurOperations, isCentraliste, canApproveDevis } = useAuth();
  
  // DIR_OPS and CENTRALISTE create devis but cannot approve them
  const isNonApproverRole = isDirecteurOperations || isCentraliste;
  const [formules, setFormules] = useState<Formule[]>([]);
  const [clients, setClients] = useState<{ client_id: string; nom_client: string }[]>([]);
  const [prix, setPrix] = useState<Prix[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [selectedFormule, setSelectedFormule] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [volume, setVolume] = useState('');
  const [distance, setDistance] = useState('20');
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  useEffect(() => {
    if (dialogOpen) fetchData();
  }, [dialogOpen]);

  const fetchData = async () => {
    try {
      const [formulesRes, prixRes, clientsRes] = await Promise.all([
        supabase.from('formules_theoriques').select('*'),
        supabase.from('prix_achat_actuels').select('matiere_premiere, prix_unitaire_dh'),
        supabase.from('clients').select('client_id, nom_client').order('nom_client'),
      ]);
      setFormules(formulesRes.data || []);
      setPrix(prixRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
    const sableM3 = formule.sable_m3 || (formule.sable_kg_m3 ? formule.sable_kg_m3 / 1600 : 0);
    const gravetteM3 = formule.gravette_m3 || (formule.gravier_kg_m3 ? formule.gravier_kg_m3 / 1500 : 0);
    let cut = 0;
    cut += (formule.ciment_kg_m3 / 1000) * prixCiment;
    cut += sableM3 * prixSable;
    cut += gravetteM3 * prixGravette;
    cut += (formule.eau_l_m3 / 1000) * prixEau;
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
      if (!formule) { setLoading(false); return; }
      const volumeM3 = parseFloat(volume);
      const distanceKm = parseFloat(distance) || 20;
      const fixedCost = 150;
      const marginPct = 0.25;
      const cut = calculateCUT(formule);
      const transportExtra = distanceKm > 20 ? (distanceKm - 20) * 5 : 0;
      const totalCost = cut + fixedCost + transportExtra;
      const pvm = totalCost / (1 - marginPct);
      const totalHT = Math.round(pvm * volumeM3 * 100) / 100;
      const tva = Math.round(totalHT * 0.20 * 100) / 100; // 20% TVA Morocco
      const totalTTC = Math.round((totalHT + tva) * 100) / 100;
      setQuoteResult({
        cut_per_m3: cut,
        fixed_cost_per_m3: fixedCost,
        transport_extra_per_m3: transportExtra,
        total_cost_per_m3: totalCost,
        margin_pct: marginPct * 100,
        prix_vente_minimum: Math.round(pvm * 100) / 100,
        total_ht: totalHT,
        tva,
        total_ttc: totalTTC,
      });
      toast.success('Devis calculé');
    } finally {
      setLoading(false);
    }
  };

  const resetCalculator = () => {
    setSelectedFormule('');
    setSelectedClient('');
    setVolume('');
    setDistance('20');
    setQuoteResult(null);
  };

  const handleSaveDevis = async () => {
    if (!quoteResult || !selectedFormule) return;
    setSaving(true);
    const result = await saveDevis({
      client_id: selectedClient || undefined,
      formule_id: selectedFormule,
      volume_m3: parseFloat(volume),
      distance_km: parseFloat(distance) || 20,
      cut_per_m3: quoteResult.cut_per_m3,
      fixed_cost_per_m3: quoteResult.fixed_cost_per_m3,
      transport_extra_per_m3: quoteResult.transport_extra_per_m3,
      total_cost_per_m3: quoteResult.total_cost_per_m3,
      margin_pct: quoteResult.margin_pct,
      prix_vente_m3: quoteResult.prix_vente_minimum,
      total_ht: quoteResult.total_ht,
    });
    setSaving(false);
    if (result) {
      // Show custom message for DIR_OPS and other non-approver roles
      if (isNonApproverRole) {
        toast.success('Devis créé. En attente de validation par l\'administration.', {
          icon: <Clock className="h-4 w-4" />,
          duration: 5000,
        });
      }
      resetCalculator();
      setDialogOpen(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetCalculator(); }}>
      <DialogTrigger asChild>
        <Button 
          variant={variant === 'prominent' ? 'default' : 'outline'} 
          className={variant === 'prominent' ? 'gap-2 bg-primary text-primary-foreground' : 'gap-2'}
          data-quote-calculator
        >
          <Calculator className="h-4 w-4" />
          {variant === 'prominent' ? 'Nouveau Devis' : 'Calculateur de Devis'}
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Formule Béton</Label>
              <Select value={selectedFormule} onValueChange={setSelectedFormule}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {formules.map((f) => (
                    <SelectItem key={f.formule_id} value={f.formule_id}>{f.formule_id} - {f.designation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client (optionnel)</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.client_id} value={c.client_id}>{c.nom_client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Volume (m³)</Label>
              <Input type="number" min="0.5" placeholder="Ex: 12" value={volume} onChange={(e) => setVolume(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Distance (km)</Label>
              <Input type="number" min="1" placeholder="20" value={distance} onChange={(e) => setDistance(e.target.value)} />
            </div>
            <Button onClick={calculateQuote} disabled={loading || !selectedFormule || !volume} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
              Calculer
            </Button>
          </div>
          <div className="space-y-4">
            {quoteResult ? (
              <>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-semibold uppercase text-primary mb-1">Prix de Vente Minimum</p>
                  <p className="text-3xl font-bold text-primary">{quoteResult.prix_vente_minimum.toLocaleString()} DH/m³</p>
                  <p className="text-xs text-muted-foreground">Hors Taxe</p>
                  <div className="mt-3 pt-3 border-t border-primary/20 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Total HT</span>
                      <span className="font-mono font-medium">{quoteResult.total_ht.toLocaleString()} DH</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>TVA (20%)</span>
                      <span className="font-mono">{quoteResult.tva.toLocaleString()} DH</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-1 border-t border-primary/20">
                      <span>Total TTC</span>
                      <span className="text-primary">{quoteResult.total_ttc.toLocaleString()} DH</span>
                    </div>
                  </div>
                </div>
                {/* Info banner for non-approver roles */}
                {isNonApproverRole && (
                  <Alert className="bg-warning/10 border-warning/30">
                    <Clock className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-warning text-sm">
                      Le devis sera créé avec le statut "En Attente" et devra être validé par l'administration.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleSaveDevis} disabled={saving} className="flex-1 gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isNonApproverRole ? 'Soumettre pour Validation' : 'Enregistrer Devis'}
                  </Button>
                  <Button variant="outline" onClick={resetCalculator}>Nouveau</Button>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 rounded-lg border-2 border-dashed border-muted">
                <Calculator className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Sélectionnez une formule et un volume pour calculer</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
