import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useBonWorkflow } from '@/hooks/useBonWorkflow';
import { useMachineSync } from '@/hooks/useMachineSync';
import { useStocks } from '@/hooks/useStocks';
import { usePreviewRole } from '@/hooks/usePreviewRole';
import { ProductionComparePanel } from '@/components/production/ProductionComparePanel';
import { ApiDocumentation } from '@/components/production/ApiDocumentation';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Factory,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  Play,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BonProduction {
  bl_id: string;
  date_livraison: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  ciment_reel_kg: number;
  adjuvant_reel_l: number | null;
  eau_reel_l: number | null;
  workflow_status: string | null;
  source_donnees: string | null;
  machine_id: string | null;
  justification_ecart: string | null;
  validation_technique: boolean | null;
  alerte_ecart: boolean | null;
  // BC linkage
  bc_id: string | null;
  bon_commande?: {
    volume_m3: number;
    volume_livre: number | null;
    nb_livraisons: number | null;
    client_nom: string | null;
  } | null;
  client?: { nom_client: string } | null;
}

interface Formule {
  formule_id: string;
  designation: string;
  ciment_kg_m3: number;
  adjuvant_l_m3: number;
  eau_l_m3: number;
  sable_m3?: number;
  gravette_m3?: number;
}

export default function Production() {
  const [searchParams, setSearchParams] = useSearchParams();
  const blFromUrl = searchParams.get('bl');
  
  const { role, isCeo, isCentraliste, isResponsableTechnique } = useAuth();
  const { previewRole } = usePreviewRole();
  const { transitionWorkflow } = useBonWorkflow();
  const { syncing, lastSync, simulateMachineSync, updateBonWithMachineData, requiresJustification } = useMachineSync();
  const { deductConsumption, fetchStocks } = useStocks();

  const [bons, setBons] = useState<BonProduction[]>([]);
  const [formules, setFormules] = useState<Formule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBon, setSelectedBon] = useState<BonProduction | null>(null);
  const [selectedFormule, setSelectedFormule] = useState<Formule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  
  // Filter state
  type FilterType = 'all' | 'production' | 'validation' | 'machine' | 'ecart';
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const clearBlFromUrl = useCallback(() => {
    if (!searchParams.get('bl')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('bl');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeAllDialogs = useCallback(() => {
    setDialogOpen(false);
    setValidationDialogOpen(false);
    setSelectedBon(null);
    setSelectedFormule(null);
    setJustification('');
    setDeviations([]);
    clearBlFromUrl();
  }, [clearBlFromUrl]);
  
  // Edit state - includes sable/gravette for machine sync
  const [editValues, setEditValues] = useState<{
    ciment_reel_kg: number;
    adjuvant_reel_l: number;
    eau_reel_l: number;
    sable_reel_kg?: number;
    gravette_reel_kg?: number;
  }>({
    ciment_reel_kg: 0,
    adjuvant_reel_l: 0,
    eau_reel_l: 0,
  });
  const [justification, setJustification] = useState('');
  const [deviations, setDeviations] = useState<{ field: string; percent: number }[]>([]);
  const [saving, setSaving] = useState(false);

  // In “Mode Test”, permissions should reflect the previewed role (not the real logged-in role)
  const effectiveRole = (previewRole ?? role) as string | null;
  const effectiveIsCeo = effectiveRole === 'ceo';
  const effectiveIsCentraliste = effectiveRole === 'centraliste';
  const effectiveIsResponsableTechnique = effectiveRole === 'responsable_technique';

  // Who can interact with production orders
  const canEdit = !!(effectiveIsCeo || effectiveIsCentraliste || effectiveIsResponsableTechnique);
  // Centraliste can adjust real consumption + justification in production (as per ops needs)
  const canManuallyEditConsumption = !!(effectiveIsCeo || effectiveIsCentraliste);
  // Who can validate and advance to next workflow step
  const canValidate = !!(effectiveIsCeo || effectiveIsCentraliste || effectiveIsResponsableTechnique);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open dialog if BL is passed in URL
  useEffect(() => {
    if (blFromUrl && bons.length > 0 && formules.length > 0) {
      const bon = bons.find(b => b.bl_id === blFromUrl);
      if (bon) {
        handleSelectBon(bon);
      }
    }
  }, [blFromUrl, bons, formules]);

  const fetchData = async () => {
    try {
      const [bonsRes, formulesRes] = await Promise.all([
        supabase
          .from('bons_livraison_reels')
          .select(`
            *,
            client:clients(nom_client)
          `)
          .in('workflow_status', ['production', 'validation_technique'])
          .order('created_at', { ascending: false }),
        supabase
          .from('formules_theoriques')
          .select('formule_id, designation, ciment_kg_m3, adjuvant_l_m3, eau_l_m3'),
      ]);

      if (bonsRes.error) throw bonsRes.error;
      if (formulesRes.error) throw formulesRes.error;

      // Fetch BC data for linked BLs
      const bcIds = (bonsRes.data || [])
        .map(bl => bl.bc_id)
        .filter((id): id is string => !!id);

      let bcMap: Record<string, { volume_m3: number; volume_livre: number | null; nb_livraisons: number | null; client_nom: string | null }> = {};
      
      if (bcIds.length > 0) {
        const { data: bcData } = await supabase
          .from('bons_commande')
          .select(`
            bc_id,
            volume_m3,
            volume_livre,
            nb_livraisons,
            client:clients(nom_client)
          `)
          .in('bc_id', bcIds);

        if (bcData) {
          bcMap = bcData.reduce((acc, bc) => {
            acc[bc.bc_id] = {
              volume_m3: bc.volume_m3,
              volume_livre: bc.volume_livre,
              nb_livraisons: bc.nb_livraisons,
              client_nom: bc.client?.nom_client || null,
            };
            return acc;
          }, {} as typeof bcMap);
        }
      }

      // Merge BC data into bons
      const enrichedBons = (bonsRes.data || []).map(bon => ({
        ...bon,
        bon_commande: bon.bc_id ? bcMap[bon.bc_id] || null : null,
      }));

      setBons(enrichedBons as BonProduction[]);
      setFormules(formulesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Opens VALIDATION dialog for "Production" status, SYNC dialog for "validation_technique"
  const handleSelectBon = (bon: BonProduction) => {
    setSelectedBon(bon);
    const formule = formules.find(f => f.formule_id === bon.formule_id);
    setSelectedFormule(formule || null);
    
    // If values are 0/null (not synced), default to theoretical formula values
    // This prevents false "100% deviation" alerts for orders not yet synced
    const theoreticalCiment = formule ? formule.ciment_kg_m3 * bon.volume_m3 : 0;
    const theoreticalAdjuvant = formule ? formule.adjuvant_l_m3 * bon.volume_m3 : 0;
    const theoreticalEau = formule ? formule.eau_l_m3 * bon.volume_m3 : 0;
    
    setEditValues({
      ciment_reel_kg: bon.ciment_reel_kg || theoreticalCiment,
      adjuvant_reel_l: bon.adjuvant_reel_l || theoreticalAdjuvant,
      eau_reel_l: bon.eau_reel_l || theoreticalEau,
    });
    setJustification(bon.justification_ecart || '');
    updateDeviations(bon, formule);
    
    // Orders in "production" status -> show validation dialog
    // Orders in "validation_technique" status -> show sync/edit dialog
    if (bon.workflow_status === 'production') {
      setValidationDialogOpen(true);
    } else {
      setDialogOpen(true);
    }
  };

  const updateDeviations = (bon: BonProduction, formule: Formule | null) => {
    if (!formule) {
      setDeviations([]);
      return;
    }
    
    const result = requiresJustification(
      editValues.ciment_reel_kg,
      formule.ciment_kg_m3 * bon.volume_m3,
      editValues.adjuvant_reel_l,
      formule.adjuvant_l_m3 * bon.volume_m3,
      editValues.eau_reel_l,
      formule.eau_l_m3 * bon.volume_m3
    );
    setDeviations(result.deviations);
  };

  useEffect(() => {
    if (selectedBon && selectedFormule) {
      const result = requiresJustification(
        editValues.ciment_reel_kg,
        selectedFormule.ciment_kg_m3 * selectedBon.volume_m3,
        editValues.adjuvant_reel_l,
        selectedFormule.adjuvant_l_m3 * selectedBon.volume_m3,
        editValues.eau_reel_l,
        selectedFormule.eau_l_m3 * selectedBon.volume_m3
      );
      setDeviations(result.deviations);
    }
  }, [editValues, selectedBon, selectedFormule, requiresJustification]);

  const handleSync = async () => {
    if (!selectedBon || !selectedFormule) return;

    const result = await simulateMachineSync(selectedFormule, selectedBon.volume_m3);
    
    if (result.success && result.data) {
      setEditValues({
        ciment_reel_kg: result.data.ciment_reel_kg,
        adjuvant_reel_l: result.data.adjuvant_reel_l,
        eau_reel_l: result.data.eau_reel_l,
        sable_reel_kg: result.data.sable_reel_kg,
        gravette_reel_kg: result.data.gravette_reel_kg,
      });
      
      // Update the BL with machine data
      await updateBonWithMachineData(selectedBon.bl_id, result.data);
      fetchData();
    }
  };

  const handleValueChange = (field: keyof typeof editValues, value: number) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedBon) return;

    // Check if justification is required but not provided
    if (deviations.length > 0 && !justification.trim()) {
      toast.error('Une justification est requise pour les écarts > 5%');
      return;
    }

    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        ciment_reel_kg: editValues.ciment_reel_kg,
        adjuvant_reel_l: editValues.adjuvant_reel_l,
        eau_reel_l: editValues.eau_reel_l,
        alerte_ecart: deviations.length > 0,
      };

      if (justification.trim()) {
        updateData.justification_ecart = justification.trim();
      }

      const { error } = await supabase
        .from('bons_livraison_reels')
        .update(updateData)
        .eq('bl_id', selectedBon.bl_id);

      if (error) throw error;

      // Create alert if there are deviations
      if (deviations.length > 0) {
        await supabase.from('alertes_systeme').insert([{
          type_alerte: 'ecart_production',
          niveau: 'warning',
          titre: 'Écart Production > 5%',
          message: `BL ${selectedBon.bl_id}: ${deviations.map(d => `${d.field} +${d.percent.toFixed(1)}%`).join(', ')}. Justification: ${justification}`,
          reference_id: selectedBon.bl_id,
          reference_table: 'bons_livraison_reels',
          destinataire_role: 'ceo',
        }]);
      }

      // Close dialog first to ensure UI updates immediately
      closeAllDialogs();
      toast.success('Données de production enregistrées');
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceToValidation = async () => {
    if (!selectedBon || !selectedFormule) return;

    // Check if justification is required
    if (deviations.length > 0 && !justification.trim()) {
      toast.error('Une justification est requise avant de passer en validation');
      return;
    }

    setSaving(true);
    try {
      // Update production data
      const updateData: Record<string, unknown> = {
        ciment_reel_kg: editValues.ciment_reel_kg,
        adjuvant_reel_l: editValues.adjuvant_reel_l,
        eau_reel_l: editValues.eau_reel_l,
        alerte_ecart: deviations.length > 0,
      };

      if (justification.trim()) {
        updateData.justification_ecart = justification.trim();
      }

      const { error: saveError } = await supabase
        .from('bons_livraison_reels')
        .update(updateData)
        .eq('bl_id', selectedBon.bl_id);

      if (saveError) throw saveError;

      // Deduct stock consumption using real machine data when available
      const consumption = [
        { materiau: 'ciment', quantite: editValues.ciment_reel_kg / 1000 }, // Convert kg to tonnes
        { materiau: 'adjuvant', quantite: editValues.adjuvant_reel_l },
        { materiau: 'eau', quantite: editValues.eau_reel_l / 1000 }, // Convert L to m³
        // Use real sable/gravette if synced from machine, otherwise use theoretical
        { materiau: 'sable', quantite: editValues.sable_reel_kg 
          ? editValues.sable_reel_kg / 1600 // kg to m³ 
          : (selectedFormule.sable_m3 || 0.4) * selectedBon.volume_m3 },
        { materiau: 'gravette', quantite: editValues.gravette_reel_kg 
          ? editValues.gravette_reel_kg / 1500 // kg to m³
          : (selectedFormule.gravette_m3 || 0.8) * selectedBon.volume_m3 },
      ].filter(c => c.quantite > 0);

      await deductConsumption(selectedBon.bl_id, consumption);

      // Create alert if there are deviations
      if (deviations.length > 0) {
        await supabase.from('alertes_systeme').insert([{
          type_alerte: 'ecart_production',
          niveau: 'warning',
          titre: 'Écart Production > 5%',
          message: `BL ${selectedBon.bl_id}: ${deviations.map(d => `${d.field} +${d.percent.toFixed(1)}%`).join(', ')}. Justification: ${justification}`,
          reference_id: selectedBon.bl_id,
          reference_table: 'bons_livraison_reels',
          destinataire_role: 'ceo',
        }]);
      }

      // Transition to validation_technique
      const success = await transitionWorkflow(
        selectedBon.bl_id,
        selectedBon.workflow_status || 'production',
        'validation_technique'
      );

      if (success) {
        toast.success('Production enregistrée & stocks mis à jour');
        setDialogOpen(false);
        fetchData();
        fetchStocks();
      }
    } catch (error) {
      console.error('Error advancing to validation:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setSaving(false);
    }
  };

  const getSourceBadge = (source: string | null) => {
    if (source === 'machine_sync') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-success/20 text-success">
          <Wifi className="h-3 w-3" />
          Machine
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
        <WifiOff className="h-3 w-3" />
        Manuel
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
              <Factory className="h-5 w-5 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
              <span className="truncate">Centre Production</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              Interface Centraliste - Comparaison Théorique vs Réel
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {lastSync && (
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
                Sync: {format(lastSync, 'HH:mm:ss', { locale: fr })}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={fetchData} className="min-h-[40px]">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          </div>
        </div>

        {/* Status Filters - Clickable */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
          <button
            onClick={() => setActiveFilter(activeFilter === 'production' ? 'all' : 'production')}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all cursor-pointer",
              activeFilter === 'production'
                ? "bg-warning text-warning-foreground border-2 border-warning shadow-md"
                : "bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20"
            )}
          >
            <Play className="h-3 w-3" />
            Production
            {activeFilter !== 'production' && (
              <span className="ml-1 bg-warning/30 px-1.5 rounded-full text-[10px]">
                {bons.filter(b => b.workflow_status === 'production').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'validation' ? 'all' : 'validation')}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all cursor-pointer",
              activeFilter === 'validation'
                ? "bg-purple-500 text-white border-2 border-purple-500 shadow-md"
                : "bg-purple-500/10 text-purple-500 border border-purple-500/30 hover:bg-purple-500/20"
            )}
          >
            <CheckCircle className="h-3 w-3" />
            Validation
            {activeFilter !== 'validation' && (
              <span className="ml-1 bg-purple-500/30 px-1.5 rounded-full text-[10px]">
                {bons.filter(b => b.workflow_status === 'validation_technique').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'machine' ? 'all' : 'machine')}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all cursor-pointer",
              activeFilter === 'machine'
                ? "bg-success text-success-foreground border-2 border-success shadow-md"
                : "bg-success/10 text-success border border-success/30 hover:bg-success/20"
            )}
          >
            <Wifi className="h-3 w-3" />
            Machine
            {activeFilter !== 'machine' && (
              <span className="ml-1 bg-success/30 px-1.5 rounded-full text-[10px]">
                {bons.filter(b => b.source_donnees === 'machine_sync').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'ecart' ? 'all' : 'ecart')}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all cursor-pointer",
              activeFilter === 'ecart'
                ? "bg-destructive text-destructive-foreground border-2 border-destructive shadow-md"
                : "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20"
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            Écart &gt; 5%
            {activeFilter !== 'ecart' && (
              <span className="ml-1 bg-destructive/30 px-1.5 rounded-full text-[10px]">
                {bons.filter(b => b.alerte_ecart).length}
              </span>
            )}
          </button>
        </div>

        {/* Production Queue */}
        {(() => {
          // Apply filter
          const filteredBons = bons.filter(bon => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'production') return bon.workflow_status === 'production';
            if (activeFilter === 'validation') return bon.workflow_status === 'validation_technique';
            if (activeFilter === 'machine') return bon.source_donnees === 'machine_sync';
            if (activeFilter === 'ecart') return bon.alerte_ecart === true;
            return true;
          });
          
          return (
            <div className="card-industrial overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : filteredBons.length === 0 ? (
                <div className="p-8 text-center">
                  <Factory className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    {activeFilter !== 'all' 
                      ? `Aucun bon correspondant au filtre "${activeFilter}"`
                      : 'Aucun bon en production'}
                  </p>
                  {activeFilter !== 'all' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveFilter('all')}
                      className="mt-2"
                    >
                      Voir tous les bons
                    </Button>
                  )}
                </div>
              ) : (
                <Table className="data-table-industrial">
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Bon</TableHead>
                      <TableHead>Commande</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Formule</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBons.map((bon) => (
                  <TableRow
                    key={bon.bl_id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/30',
                      bon.alerte_ecart && 'bg-destructive/5'
                    )}
                    onClick={() => canEdit && handleSelectBon(bon)}
                  >
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        {bon.bl_id}
                        {bon.alerte_ecart && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {bon.bc_id ? (
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs text-primary">{bon.bc_id}</span>
                          {bon.bon_commande && bon.bon_commande.nb_livraisons && bon.bon_commande.nb_livraisons > 1 && (
                            <div className="text-[10px] text-muted-foreground">
                              Liv. {bon.bon_commande.nb_livraisons} / {bon.bon_commande.volume_m3}m³
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(bon.date_livraison), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {bon.bon_commande?.client_nom || bon.client?.nom_client || bon.client_id}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{bon.formule_id}</TableCell>
                    <TableCell className="text-right font-semibold">{bon.volume_m3} m³</TableCell>
                    <TableCell>{getSourceBadge(bon.source_donnees)}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                        bon.workflow_status === 'production' && 'bg-warning/20 text-warning',
                        bon.workflow_status === 'validation_technique' && 'bg-purple-500/20 text-purple-500'
                      )}>
                        {bon.workflow_status === 'production' && <Play className="h-3 w-3" />}
                        {bon.workflow_status === 'validation_technique' && <CheckCircle className="h-3 w-3" />}
                        {bon.workflow_status === 'production' ? 'Production' : 'Validation'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
          );
        })()}

        {/* API Documentation (Hidden/Collapsible) */}
        {isCeo && (
          <ApiDocumentation className="mt-8" />
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) closeAllDialogs();
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Factory className="h-5 w-5 text-primary" />
              Production: {selectedBon?.bl_id}
            </DialogTitle>
          </DialogHeader>

          {selectedBon && selectedFormule && (
            <div className="space-y-6 mt-4">
              {/* Info Bar */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Client:</span>
                    <p className="font-medium">{selectedBon.client_id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Formule:</span>
                    <p className="font-mono font-medium">{selectedBon.formule_id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Volume:</span>
                    <p className="font-semibold">{selectedBon.volume_m3} m³</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSync}
                  disabled={syncing}
                  className="gap-2"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Synchroniser avec la Centrale
                    </>
                  )}
                </Button>
              </div>

              {/* Compare Panel - Read-only for Centraliste, editable for CEO */}
              <ProductionComparePanel
                formule={selectedFormule}
                volume={selectedBon.volume_m3}
                realValues={editValues}
                onValueChange={handleValueChange}
                deviations={deviations}
                disabled={saving}
                readOnly={!canManuallyEditConsumption}
              />

              {/* Info message for Centraliste */}
              {!canManuallyEditConsumption && (
                <div className="p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Les données de consommation sont synchronisées automatiquement avec la centrale. 
                  Cliquez sur "Synchroniser" pour récupérer les valeurs réelles.
                </div>
              )}

              {/* Justification (required if deviations > 5%) */}
              {deviations.length > 0 && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="font-semibold text-destructive">
                      Justification Requise
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Un ou plusieurs écarts dépassent 5%. Veuillez fournir une justification pour continuer.
                  </p>
                  <div className="space-y-2">
                    <Label className="form-label-industrial">Justification de l'écart</Label>
                    <Textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Expliquez la raison de l'écart de consommation..."
                      rows={3}
                      className={cn(
                        !justification.trim() && 'border-destructive'
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Machine Info */}
              {selectedBon.machine_id && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wifi className="h-4 w-4 text-success" />
                  <span>Machine ID: {selectedBon.machine_id}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={closeAllDialogs}>
                  Annuler
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Enregistrer
                </Button>
                {selectedBon.workflow_status === 'production' && canValidate && (
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      onClick={handleAdvanceToValidation}
                      disabled={saving || (deviations.length > 0 && !justification.trim())}
                      className="gap-2"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Valider Production
                    </Button>
                    {deviations.length > 0 && !justification.trim() && (
                      <span className="text-xs text-muted-foreground">
                        Justification obligatoire (écart &gt; 5%)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Validation Dialog - Simple confirm to validate production */}
      <Dialog
        open={validationDialogOpen}
        onOpenChange={(open) => {
          setValidationDialogOpen(open);
          if (!open) closeAllDialogs();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              Valider Commande
            </DialogTitle>
          </DialogHeader>

          {selectedBon && selectedFormule && (
            <div className="space-y-4 mt-4">
              {/* Order summary */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">N° Bon:</span>
                    <p className="font-mono font-medium">{selectedBon.bl_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Client:</span>
                    <p className="font-medium">{selectedBon.client?.nom_client || selectedBon.client_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Formule:</span>
                    <p className="font-mono">{selectedBon.formule_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume:</span>
                    <p className="font-semibold">{selectedBon.volume_m3} m³</p>
                  </div>
                </div>
                
                {selectedBon.bc_id && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Commande liée:</span>
                    <p className="font-mono text-xs text-primary">{selectedBon.bc_id}</p>
                  </div>
                )}
              </div>

              {/* Consumption summary */}
              <div className="p-3 rounded-lg border space-y-2">
                <h4 className="text-sm font-medium">Consommation Réelle</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Ciment</span>
                    <span className="font-mono font-medium">{editValues.ciment_reel_kg} kg</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Adjuvant</span>
                    <span className="font-mono font-medium">{editValues.adjuvant_reel_l} L</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Eau</span>
                    <span className="font-mono font-medium">{editValues.eau_reel_l} L</span>
                  </div>
                </div>
                {selectedBon.source_donnees === 'machine_sync' && (
                  <div className="flex items-center gap-1 text-xs text-success mt-1">
                    <Wifi className="h-3 w-3" />
                    Données synchronisées depuis la centrale
                  </div>
                )}
              </div>

              {/* Warning if deviations */}
              {deviations.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Écarts détectés</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {deviations.map(d => `${d.field}: +${d.percent.toFixed(1)}%`).join(', ')}
                  </p>
                  {!justification.trim() && (
                    <div className="space-y-1">
                      <Label className="text-xs">Justification requise</Label>
                      <Textarea
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Expliquez l'écart..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setValidationDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={async () => {
                    await handleAdvanceToValidation();
                    setValidationDialogOpen(false);
                  }}
                  disabled={saving || (deviations.length > 0 && !justification.trim())}
                  className="gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Valider Production
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
