import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import WorldClassProduction from '@/components/production/WorldClassProduction';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { useAuth } from '@/hooks/useAuth';
import { useBonWorkflow } from '@/hooks/useBonWorkflow';
import { useMachineSync } from '@/hooks/useMachineSync';
import { useStocks } from '@/hooks/useStocks';
import { usePreviewRole } from '@/hooks/usePreviewRole';
import { ProductionComparePanel } from '@/components/production/ProductionComparePanel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { buildPlanningUrl } from '@/lib/workflowStatus';

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
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const blFromUrl = searchParams.get('bl');
  const dateFromUrl = searchParams.get('date');
  
  const { role, isCeo, isCentraliste, isResponsableTechnique } = useAuth();
  const { previewRole } = usePreviewRole();
  const { transitionWorkflow } = useBonWorkflow();
  const { syncing, lastSync, simulateMachineSync, updateBonWithMachineData, requiresJustification } = useMachineSync();
  const { stocks, deductConsumption, fetchStocks, getCriticalStocks } = useStocks();

  const [bons, setBons] = useState<BonProduction[]>([]);
  const [formules, setFormules] = useState<Formule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBon, setSelectedBon] = useState<BonProduction | null>(null);
  const [selectedFormule, setSelectedFormule] = useState<Formule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  
  // Filter state - includes planification for newly launched BLs
  type FilterType = 'all' | 'planification' | 'production' | 'validation' | 'machine' | 'ecart';
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Search and date selection - initialize from URL or default to today
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (dateFromUrl) {
      const parsed = parseISO(dateFromUrl);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  });
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>(() => {
    const initialDate = dateFromUrl ? parseISO(dateFromUrl) : new Date();
    const validDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;
    return { from: startOfDay(validDate), to: endOfDay(validDate) };
  });
  
  // Batch selection
  const [selectedBls, setSelectedBls] = useState<Set<string>>(new Set());
  const [batchValidating, setBatchValidating] = useState(false);
  
  // Sorting
  type SortField = 'date' | 'client' | 'volume' | 'formule';
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Collapsible sections
  const [kpiExpanded, setKpiExpanded] = useState(true);
  const [chartExpanded, setChartExpanded] = useState(true);

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

  const realtimeDebounceRef = React.useRef<number | null>(null);

  const setUrlDate = useCallback((date: Date) => {
    const next = new URLSearchParams(searchParams);
    next.set('date', format(date, 'yyyy-MM-dd'));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

      const [bonsRes, formulesRes] = await Promise.all([
        supabase
          .from('bons_livraison_reels')
          .select(`
            *,
            client:clients(nom_client)
          `)
          // Keep Production in lockstep with Planning date
          .eq('date_livraison', selectedDateStr)
          // Show all active production workflow stages - from planification through validation
          .in('workflow_status', ['planification', 'production', 'validation_technique'])
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
      toast.error(t.pages.production.loadingError);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Initial fetch and when date changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keep Production synced with Planning updates via realtime (date-aware)
  useEffect(() => {
    const scheduleRefetch = () => {
      if (realtimeDebounceRef.current) {
        window.clearTimeout(realtimeDebounceRef.current);
      }
      realtimeDebounceRef.current = window.setTimeout(() => {
        fetchData();
      }, 250);
    };

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

    const channel = supabase
      .channel(`production-workflow-sync:${selectedDateStr}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bons_livraison_reels', filter: `date_livraison=eq.${selectedDateStr}` },
        scheduleRefetch
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bons_commande' },
        scheduleRefetch
      )
      .subscribe();

    return () => {
      if (realtimeDebounceRef.current) {
        window.clearTimeout(realtimeDebounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [selectedDate, fetchData]);

  // Auto-open dialog if BL is passed in URL
  useEffect(() => {
    if (blFromUrl && bons.length > 0 && formules.length > 0) {
      const bon = bons.find(b => b.bl_id === blFromUrl);
      if (bon) {
        handleSelectBon(bon);
      }
    }
  }, [blFromUrl, bons, formules]);

  // fetchData moved to useCallback above (date-aware)

  // Opens VALIDATION dialog for "Production" status, SYNC dialog for "validation_technique"
  const handleSelectBon = (bon: BonProduction) => {
    setSelectedBon(bon);
    const formule = formules.find(f => f.formule_id === bon.formule_id);
    setSelectedFormule(formule || null);
    
    // Calculate theoretical values
    const theoreticalCiment = formule ? formule.ciment_kg_m3 * bon.volume_m3 : 0;
    const theoreticalAdjuvant = formule ? formule.adjuvant_l_m3 * bon.volume_m3 : 0;
    const theoreticalEau = formule ? formule.eau_l_m3 * bon.volume_m3 : 0;
    
    // For manual entries (not machine-synced), check if stored values are realistic
    // This prevents false deviation alerts from placeholder or incomplete data
    const isMachineSynced = bon.source_donnees === 'machine_sync';
    
    // Check if stored values are realistic (within 50% of theoretical)
    const isRealisticCiment = bon.ciment_reel_kg && theoreticalCiment > 0 &&
      bon.ciment_reel_kg >= theoreticalCiment * 0.5 && 
      bon.ciment_reel_kg <= theoreticalCiment * 1.5;
    const isRealisticAdjuvant = bon.adjuvant_reel_l && theoreticalAdjuvant > 0 &&
      bon.adjuvant_reel_l >= theoreticalAdjuvant * 0.5 && 
      bon.adjuvant_reel_l <= theoreticalAdjuvant * 1.5;
    const isRealisticEau = bon.eau_reel_l && theoreticalEau > 0 &&
      bon.eau_reel_l >= theoreticalEau * 0.5 && 
      bon.eau_reel_l <= theoreticalEau * 1.5;
    
    setEditValues({
      ciment_reel_kg: (isMachineSynced || isRealisticCiment) ? bon.ciment_reel_kg : theoreticalCiment,
      adjuvant_reel_l: (isMachineSynced || isRealisticAdjuvant) ? (bon.adjuvant_reel_l ?? theoreticalAdjuvant) : theoreticalAdjuvant,
      eau_reel_l: (isMachineSynced || isRealisticEau) ? (bon.eau_reel_l ?? theoreticalEau) : theoreticalEau,
    });
    setJustification(bon.justification_ecart || '');
    updateDeviations(bon, formule);
    
    // Orders in "planification" -> show info only (waiting for dispatcher)
    // Orders in "production" status -> show validation dialog (centraliste entry)
    // Orders in "validation_technique" status -> show sync/edit dialog
    if (bon.workflow_status === 'planification') {
      // Planification BLs are just for visibility - can transition to production
      setValidationDialogOpen(true);
    } else if (bon.workflow_status === 'production') {
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
      toast.error(t.pages.production.justificationRequired);
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
      toast.success(t.pages.production.dataSaved);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(t.pages.production.saveError);
    } finally {
      setSaving(false);
    }
  };

  // Handler to start production (transition from planification to production)
  const handleStartProduction = async () => {
    if (!selectedBon) return;

    setSaving(true);
    try {
      const success = await transitionWorkflow(
        selectedBon.bl_id,
        'planification',
        'production'
      );

      if (success) {
        toast.success(t.pages.production.productionStarted);
        closeAllDialogs();
        fetchData();
      }
    } catch (error) {
      console.error('Error starting production:', error);
      toast.error(t.pages.production.startError);
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceToValidation = async () => {
    if (!selectedBon || !selectedFormule) return;

    // Check if justification is required
    if (deviations.length > 0 && !justification.trim()) {
      toast.error(t.pages.production.justificationRequiredValidation);
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

      // NOTE: Stock deduction is handled automatically by database trigger (trigger_deduct_stock_on_production)
      // when workflow_status transitions from 'production' to 'validation_technique'.
      // This ensures single source of truth and prevents double deduction.
      // The trigger uses the real consumption values (ciment_reel_kg, adjuvant_reel_l, eau_reel_l)
      // that were just saved to the BL record above.

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
        toast.success(t.pages.production.productionRecorded);
        closeAllDialogs();
        fetchData();
        fetchStocks();
      }
    } catch (error) {
      console.error('Error advancing to validation:', error);
      toast.error(t.pages.production.validationError);
    } finally {
      setSaving(false);
    }
  };

  // Handler to send validated BL to delivery (validation_technique -> en_livraison)
  const handleSendToDelivery = async (blId: string) => {
    setSaving(true);
    try {
      const success = await transitionWorkflow(blId, 'validation_technique', 'en_livraison');
      if (success) {
        toast.success(t.pages.production.sentToDelivery);
        fetchData();
      }
    } catch (error) {
      console.error('Error sending to delivery:', error);
      toast.error(t.pages.production.deliveryError);
    } finally {
      setSaving(false);
    }
  };

  // Computed KPIs
  const kpiData = useMemo(() => {
    const totalVolume = bons.reduce((sum, b) => sum + b.volume_m3, 0);
    const avgCUR = 0; // Would need cur_reel data
    const deviationCount = bons.filter(b => b.alerte_ecart).length;
    const machineSyncCount = bons.filter(b => b.source_donnees === 'machine_sync').length;
    
    // Count and volume by stage
    const planificationBons = bons.filter(b => b.workflow_status === 'planification');
    const productionBons = bons.filter(b => b.workflow_status === 'production');
    const validationBons = bons.filter(b => b.workflow_status === 'validation_technique');
    
    const planificationCount = planificationBons.length;
    const productionCount = productionBons.length;
    const validatedCount = validationBons.length;
    
    const planificationVolume = planificationBons.reduce((sum, b) => sum + b.volume_m3, 0);
    const productionVolume = productionBons.reduce((sum, b) => sum + b.volume_m3, 0);
    const validationVolume = validationBons.reduce((sum, b) => sum + b.volume_m3, 0);
    
    const criticalStocks = stocks.filter(s => s.quantite_actuelle <= s.seuil_alerte).map(s => ({
      materiau: s.materiau,
      quantite: s.quantite_actuelle,
      seuil: s.seuil_alerte,
      unite: s.unite,
    }));
    
    return { 
      totalVolume, 
      avgCUR, 
      deviationCount, 
      machineSyncCount, 
      planificationCount, 
      productionCount, 
      validatedCount, 
      planificationVolume,
      productionVolume,
      validationVolume,
      criticalStocks 
    };
  }, [bons, stocks]);

  // Filtered and sorted bons
  const filteredAndSortedBons = useMemo(() => {
    let result = [...bons];
    
    // Apply status filter
    if (activeFilter !== 'all') {
      result = result.filter(bon => {
        if (activeFilter === 'planification') return bon.workflow_status === 'planification';
        if (activeFilter === 'production') return bon.workflow_status === 'production';
        if (activeFilter === 'validation') return bon.workflow_status === 'validation_technique';
        if (activeFilter === 'machine') return bon.source_donnees === 'machine_sync';
        if (activeFilter === 'ecart') return bon.alerte_ecart === true;
        return true;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(bon => 
        bon.bl_id.toLowerCase().includes(q) ||
        (bon.bc_id?.toLowerCase().includes(q)) ||
        (bon.client?.nom_client?.toLowerCase().includes(q)) ||
        (bon.bon_commande?.client_nom?.toLowerCase().includes(q)) ||
        bon.formule_id.toLowerCase().includes(q)
      );
    }
    
    // Apply date range filter
    if (dateRange.from) {
      result = result.filter(bon => {
        const bonDate = new Date(bon.date_livraison);
        const from = startOfDay(dateRange.from!);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
        return isWithinInterval(bonDate, { start: from, end: to });
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date_livraison).getTime() - new Date(b.date_livraison).getTime();
          break;
        case 'client':
          const clientA = a.bon_commande?.client_nom || a.client?.nom_client || '';
          const clientB = b.bon_commande?.client_nom || b.client?.nom_client || '';
          comparison = clientA.localeCompare(clientB);
          break;
        case 'volume':
          comparison = a.volume_m3 - b.volume_m3;
          break;
        case 'formule':
          comparison = a.formule_id.localeCompare(b.formule_id);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [bons, activeFilter, searchQuery, dateRange, sortField, sortDirection]);

  // Batch actions
  const handleToggleSelect = (blId: string) => {
    const newSet = new Set(selectedBls);
    if (newSet.has(blId)) {
      newSet.delete(blId);
    } else {
      newSet.add(blId);
    }
    setSelectedBls(newSet);
  };

  const handleSelectAll = () => {
    if (selectedBls.size === filteredAndSortedBons.length) {
      setSelectedBls(new Set());
    } else {
      setSelectedBls(new Set(filteredAndSortedBons.map(b => b.bl_id)));
    }
  };

  const handleBatchValidate = async () => {
    if (selectedBls.size === 0) return;
    
    setBatchValidating(true);
    let successCount = 0;
    
    for (const blId of selectedBls) {
      const bon = bons.find(b => b.bl_id === blId);
      if (!bon || bon.workflow_status !== 'validation_technique') continue;
      
      try {
        const success = await transitionWorkflow(blId, 'validation_technique', 'en_livraison');
        if (success) successCount++;
      } catch (error) {
        console.error(`Error validating ${blId}:`, error);
      }
    }
    
    setBatchValidating(false);
    setSelectedBls(new Set());
    toast.success(`${successCount} ${t.pages.production.batchValidatedSent}`);
    fetchData();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleNavigate = (target: 'bc' | 'planning' | 'facture') => {
    if (target === 'planning') {
      navigate(buildPlanningUrl(selectedDate));
    }
    // BC and Facture navigation would go to Ventes with appropriate tab
  };

  const getSourceBadge = (source: string | null) => {
    if (source === 'machine_sync') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-success/20 text-success">
          <Wifi className="h-3 w-3" />
          {t.production.machine}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
        <WifiOff className="h-3 w-3" />
        {t.production.manual}
      </span>
    );
  };

  return (
    <MainLayout>
      <WorldClassProduction />

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
              {t.pages.production.productionLabel}: {selectedBon?.bl_id}
            </DialogTitle>
          </DialogHeader>

          {selectedBon && selectedFormule && (
            <div className="space-y-6 mt-4">
              {/* Info Bar */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">{t.pages.production.clientLabel}:</span>
                    <p className="font-medium">{selectedBon.client_id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t.pages.production.formulaLabel}:</span>
                    <p className="font-mono font-medium">{selectedBon.formule_id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t.pages.production.volumeLabel}:</span>
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
                      {t.pages.production.syncing}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      {t.pages.production.syncWithPlant}
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
                  {t.pages.production.consumptionReadOnly}
                </div>
              )}

              {/* Justification (required if deviations > 5%) */}
              {deviations.length > 0 && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="font-semibold text-destructive">
                      {t.pages.production.justificationRequired2}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t.pages.production.deviationOver5Explain}
                  </p>
                  <div className="space-y-2">
                    <Label className="form-label-industrial">{t.pages.production.justificationLabel}</Label>
                    <Textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder={t.pages.production.justificationPlaceholder}
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
                  <span>{t.pages.production.machineId}: {selectedBon.machine_id}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={closeAllDialogs}>
                  {t.pages.production.cancel}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {t.pages.production.save}
                </Button>
                {selectedBon.workflow_status === 'production' && canValidate && (
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      onClick={handleAdvanceToValidation}
                      disabled={saving || (deviations.length > 0 && !justification.trim())}
                      className="gap-2"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      {t.pages.production.validateProduction}
                    </Button>
                    {deviations.length > 0 && !justification.trim() && (
                      <span className="text-xs text-muted-foreground">
                        {t.pages.production.justificationMandatory}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Validation Dialog - Start production or validate based on status */}
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
              {selectedBon?.workflow_status === 'planification' ? (
                <>
                  <Play className="h-5 w-5 text-primary" />
                  {t.pages.production.startProduction}
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  {t.pages.production.validateProduction}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedBon && selectedFormule && (
            <div className="space-y-4 mt-4">
              {/* Order summary */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t.pages.production.slipNumber}:</span>
                    <p className="font-mono font-medium">{selectedBon.bl_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.pages.production.clientLabel}:</span>
                    <p className="font-medium">{selectedBon.client?.nom_client || selectedBon.client_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.pages.production.formulaLabel}:</span>
                    <p className="font-mono">{selectedBon.formule_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.pages.production.volumeLabel}:</span>
                    <p className="font-semibold">{selectedBon.volume_m3} m³</p>
                  </div>
                </div>
                
                {selectedBon.bc_id && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">{t.pages.production.linkedOrder}:</span>
                    <p className="font-mono text-xs text-primary">{selectedBon.bc_id}</p>
                  </div>
                )}
              </div>

              {/* Planification status - Show start production info */}
              {selectedBon.workflow_status === 'planification' && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">{t.pages.production.plannedOrder}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.pages.production.plannedOrderDescription}
                  </p>
                </div>
              )}

              {/* Production status - Show consumption summary */}
              {selectedBon.workflow_status === 'production' && (
                <>
                  <div className="p-3 rounded-lg border space-y-2">
                    <h4 className="text-sm font-medium">{t.pages.production.theoreticalConsumption}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">{t.pages.production.cement}</span>
                        <span className="font-mono font-medium">{editValues.ciment_reel_kg.toFixed(0)} kg</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">{t.pages.production.adjuvant}</span>
                        <span className="font-mono font-medium">{editValues.adjuvant_reel_l.toFixed(1)} L</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">{t.pages.production.water}</span>
                        <span className="font-mono font-medium">{editValues.eau_reel_l.toFixed(0)} L</span>
                      </div>
                    </div>
                    {selectedBon.source_donnees === 'machine_sync' && (
                      <div className="flex items-center gap-1 text-xs text-success mt-1">
                        <Wifi className="h-3 w-3" />
                        {t.pages.production.dataSyncedFromPlant}
                      </div>
                    )}
                  </div>

                  {/* Warning if deviations */}
                  {deviations.length > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">{t.pages.production.deviationsDetected}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {deviations.map(d => `${d.field}: +${d.percent.toFixed(1)}%`).join(', ')}
                      </p>
                      {!justification.trim() && (
                        <div className="space-y-1">
                          <Label className="text-xs">{t.pages.production.justificationRequiredLabel}</Label>
                          <Textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder={t.pages.production.explainDeviation}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setValidationDialogOpen(false)}>
                  {t.pages.production.cancel}
                </Button>
                
                {selectedBon.workflow_status === 'planification' ? (
                  <Button
                    onClick={handleStartProduction}
                    disabled={saving}
                    className="gap-2 bg-primary hover:bg-primary/90"
                    data-testid="dialog-start-production"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {t.pages.production.startProduction}
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      await handleAdvanceToValidation();
                      setValidationDialogOpen(false);
                    }}
                    disabled={saving || (deviations.length > 0 && !justification.trim())}
                    className="gap-2"
                    data-testid="dialog-validate-production"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {t.pages.production.validateProduction}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
