import { useState, useEffect, useRef, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { useSalesWorkflow, Devis, BonCommande } from '@/hooks/useSalesWorkflow';
import { useZonesLivraison } from '@/hooks/useZonesLivraison';
import { useVentesFilters } from '@/hooks/useVentesFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FileText, ShoppingCart, AlertTriangle, X, Calendar, Mail, Receipt, Zap, ChevronDown, BarChart3, TrendingUp, Loader2, Target } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import SmartQuoteCalculator from '@/components/quotes/SmartQuoteCalculator';
import { BcDetailDialog } from '@/components/bons/BcDetailDialog';
import { AddDeliveryDialog } from '@/components/bons/AddDeliveryDialog';

// Refactored components

import { FluxCommercialWidget } from '@/components/ventes/FluxCommercialWidget';
import { DevisTable } from '@/components/ventes/DevisTable';
import { BcTable } from '@/components/ventes/BcTable';
import { DevisTableResponsive } from '@/components/ventes/DevisTableResponsive';
import { BcTableResponsive } from '@/components/ventes/BcTableResponsive';
import { ConvertToBcDialog } from '@/components/ventes/ConvertToBcDialog';
import { DirectOrderDialog } from '@/components/ventes/DirectOrderDialog';
import { VentesFilters } from '@/components/ventes/VentesFilters';
import { BulkActionsToolbar, exportDevisToCSV, exportBcToCSV } from '@/components/ventes/BulkActionsToolbar';
import { BulkScorerButton } from '@/components/ventes/BulkScorerButton';
import { DevisDetailDialog } from '@/components/ventes/DevisDetailDialog';
import { ActivityHistoryDrawer } from '@/components/ventes/ActivityHistoryDrawer';
import { OrderCalendarView } from '@/components/ventes/OrderCalendarView';
import { WorkflowStepper, WorkflowStage } from '@/components/ventes/WorkflowStepper';
import { FacturesTable } from '@/components/ventes/FacturesTable';

// World-Class Premium Layer
import { WorldClassVentes } from '@/components/ventes/WorldClassVentes';
import { MarginOverviewCard } from '@/components/ventes/MarginOverviewCard';
import { PipelineAnalysisCard } from '@/components/ventes/PipelineAnalysisCard';
import { PipelineKpiCards } from '@/components/ventes/PipelineKpiCards';

// Phase 5-7 Components
import { useVentesKeyboardShortcuts, KeyboardShortcutsHint } from '@/components/ventes/KeyboardShortcuts';
import { SavedFilterViews } from '@/components/ventes/SavedFilterViews';
import { ExpiringQuotesAlert } from '@/components/ventes/ExpiringQuotesAlert';
import { RevenueForecastChart } from '@/components/ventes/RevenueForecastChart';
import { SalesPerformanceCharts } from '@/components/ventes/SalesPerformanceCharts';
import { BatchReminderDialog } from '@/components/ventes/BatchReminderDialog';
import { CommunicationLogDrawer } from '@/components/ventes/CommunicationLogDrawer';
import { ScheduledRemindersDialog } from '@/components/ventes/ScheduledRemindersDialog';
import { ExportReportsDialog } from '@/components/ventes/ExportReportsDialog';

// Strategic BC Workflow Components
import { EmergencyBcDialog } from '@/components/ventes/EmergencyBcDialog';
import { PendingBcValidation } from '@/components/ventes/PendingBcValidation';
import { EmergencyBcQualityView } from '@/components/ventes/EmergencyBcQualityView';

import { useAuth } from '@/hooks/useAuth';
import { usePreviewRole } from '@/hooks/usePreviewRole';
import { Navigate } from 'react-router-dom';
import { Lock, Shield } from 'lucide-react';
import { AccessDenied } from '@/components/layout/AccessDenied';

export default function Ventes() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { 
    isCentraliste, isCeo, isSuperviseur, isAgentAdministratif, isCommercial, 
    isDirecteurOperations, isResponsableTechnique,
    canCreateBcDirect, canValidateBcPrice, isInEmergencyWindow,
    loading: authLoading,
  } = useAuth();
  const { previewRole } = usePreviewRole();
  
  // SECURITY: Resp. Technique and Centraliste are BLOCKED from Sales (guard applied in render below)
  const effectiveRespTech = isResponsableTechnique || previewRole === 'responsable_technique';
  const effectiveCentraliste = isCentraliste || previewRole === 'centraliste';
  
  const { devisList, bcList, loading, stats, fetchData, convertToBc, createBlFromBc, createDirectBc, generateConsolidatedInvoice } = useSalesWorkflow();
  const { zones, prestataires } = useZonesLivraison();
  
  // Use the new filters hook
  const {
    filters,
    setFilters,
    filteredDevis,
    filteredBc,
    autoRefreshEnabled,
    toggleAutoRefresh,
    lastRefresh,
    isRefreshing,
    handleRefresh,
    getExpirationInfo,
    expiringDevisCount,
  } = useVentesFilters(devisList, bcList, fetchData);
  
  // Tab control state
  const [activeTab, setActiveTab] = useState('devis');
  
  // Bulk selection state
  const [selectedDevisIds, setSelectedDevisIds] = useState<string[]>([]);
  const [selectedBcIds, setSelectedBcIds] = useState<string[]>([]);
  
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [devisDetailOpen, setDevisDetailOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [launchingProduction, setLaunchingProduction] = useState<string | null>(null);
  
  // Phase 5-7 State
  const [batchReminderOpen, setBatchReminderOpen] = useState(false);
  const [showExpiringAlert, setShowExpiringAlert] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

  // Keyboard shortcuts
  useVentesKeyboardShortcuts({
    onNewQuote: () => document.querySelector<HTMLButtonElement>('[data-quote-calculator]')?.click(),
    onNewOrder: () => setDirectOrderOpen(true),
    onFocusSearch: () => searchInputRef.current?.focus(),
    onNextItem: () => {
      const currentList = activeTab === 'devis' ? filteredDevis : filteredBc;
      setSelectedRowIndex(prev => Math.min(prev + 1, currentList.length - 1));
    },
    onPrevItem: () => setSelectedRowIndex(prev => Math.max(0, prev - 1)),
    onEditSelected: () => {
      if (selectedRowIndex >= 0) {
        if (activeTab === 'devis' && filteredDevis[selectedRowIndex]) {
          setSelectedDevis(filteredDevis[selectedRowIndex]);
          setDevisDetailOpen(true);
        } else if (activeTab === 'bc' && filteredBc[selectedRowIndex]) {
          setSelectedBc(filteredBc[selectedRowIndex]);
          setBcDetailOpen(true);
        }
      }
    },
    onRefresh: handleRefresh,
    onToggleTab: () => {
      setSelectedRowIndex(-1);
      setActiveTab(activeTab === 'devis' ? 'bc' : 'devis');
    },
  });
  
  // Handle pipeline stage click - update filters and switch tab
  const handleStageClick = (stage: string) => {
    // Devis-specific statuses
    const devisStatuses = ['en_attente', 'accepte', 'converti', 'refuse', 'expire'];
    // BC-specific statuses
    const bcStatuses = ['pret_production', 'en_production', 'termine', 'livre'];
    
    // Update the status filter
    setFilters({ ...filters, status: stage });
    
    // Switch to the appropriate tab
    if (devisStatuses.includes(stage)) {
      setActiveTab('devis');
    } else if (bcStatuses.includes(stage)) {
      setActiveTab('bc');
    }
  };

  // BC Detail Dialog State
  const [selectedBc, setSelectedBc] = useState<BonCommande | null>(null);
  const [bcDetailOpen, setBcDetailOpen] = useState(false);
  
  // Add Delivery Dialog State
  const [addDeliveryOpen, setAddDeliveryOpen] = useState(false);
  const [addDeliveryBc, setAddDeliveryBc] = useState<BonCommande | null>(null);
  
  // Direct Order Dialog State
  const [directOrderOpen, setDirectOrderOpen] = useState(false);
  const [emergencyBcOpen, setEmergencyBcOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [clients, setClients] = useState<{client_id: string; nom_client: string; adresse: string | null; telephone: string | null}[]>([]);
  const [formules, setFormules] = useState<{formule_id: string; designation: string; cut_dh_m3: number | null}[]>([]);
  
  // Direct Order Form State
  const [orderClientId, setOrderClientId] = useState('');
  const [orderFormuleId, setOrderFormuleId] = useState('');
  const [orderVolume, setOrderVolume] = useState('');
  const [orderPrix, setOrderPrix] = useState('');
  
  // Shared form state
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [deliveryTime, setDeliveryTime] = useState('08:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactChantier, setContactChantier] = useState('');
  const [telephoneChantier, setTelephoneChantier] = useState('');
  const [referenceClient, setReferenceClient] = useState('');
  const [conditionsAcces, setConditionsAcces] = useState('');
  const [pompeRequise, setPompeRequise] = useState(false);
  const [typePompe, setTypePompe] = useState('');
  const [notes, setNotes] = useState('');
  
  // Zone and Payment Mode state
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [modePaiement, setModePaiement] = useState('virement');
  const [selectedPrestataireId, setSelectedPrestataireId] = useState('');
  
  // Auto-launch production toggle
  const [autoLaunchProduction, setAutoLaunchProduction] = useState(true);

  // Fetch clients and formules for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      const [clientsRes, formulesRes] = await Promise.all([
        supabase.from('clients').select('client_id, nom_client, adresse, telephone').order('nom_client'),
        supabase.from('formules_theoriques').select('formule_id, designation, cut_dh_m3').order('formule_id'),
      ]);
      if (clientsRes.data) setClients(clientsRes.data);
      if (formulesRes.data) setFormules(formulesRes.data);
    };
    fetchDropdownData();
  }, []);

  const resetFormState = () => {
    setDeliveryDate(undefined);
    setDeliveryTime('08:00');
    setDeliveryAddress('');
    setContactChantier('');
    setTelephoneChantier('');
    setReferenceClient('');
    setConditionsAcces('');
    setPompeRequise(false);
    setTypePompe('');
    setNotes('');
    setOrderClientId('');
    setOrderFormuleId('');
    setOrderVolume('');
    setOrderPrix('');
    setSelectedZoneId('');
    setModePaiement('virement');
    setSelectedPrestataireId('');
    setAutoLaunchProduction(true);
  };

  // Get selected zone pricing
  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const prixLivraison = selectedZone?.prix_livraison_m3 || 0;

  const handleConvertToBc = async () => {
    if (!selectedDevis) return;
    
    setConverting(true);
    await convertToBc(selectedDevis, {
      date_livraison_souhaitee: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : undefined,
      heure_livraison_souhaitee: deliveryTime || undefined,
      adresse_livraison: deliveryAddress || undefined,
      contact_chantier: contactChantier || undefined,
      telephone_chantier: telephoneChantier || undefined,
      reference_client: referenceClient || undefined,
      conditions_acces: conditionsAcces || undefined,
      pompe_requise: pompeRequise,
      type_pompe: typePompe || undefined,
      notes: notes || undefined,
      zone_livraison_id: selectedZoneId || undefined,
      mode_paiement: modePaiement,
      prix_livraison_m3: prixLivraison,
      prestataire_id: selectedPrestataireId || undefined,
    });
    setConverting(false);
    setConvertDialogOpen(false);
    setSelectedDevis(null);
    resetFormState();
  };

  const openConvertDialog = (devis: Devis) => {
    resetFormState();
    setSelectedDevis(devis);
    setDeliveryAddress(devis.client?.adresse || '');
    setConvertDialogOpen(true);
  };

  // Handle launching production from BC
  const handleLaunchProduction = async (bc: BonCommande) => {
    setLaunchingProduction(bc.bc_id);
    const blId = await createBlFromBc(bc);
    setLaunchingProduction(null);
    
    if (blId) {
      // Navigate to Planning with the delivery date and focus on pending section
      const deliveryDate = bc.date_livraison_souhaitee || new Date().toISOString().split('T')[0];
      navigate(`/planning?date=${deliveryDate}&focus=pending`);
    }
  };

  // Handle submitting BC for validation (Dir Ops path)
  const handleSubmitForValidation = async (bc: BonCommande) => {
    // This is informational - the BC was already created in pending status
    // Just show a toast confirmation
    const { toast } = await import('sonner');
    toast.info(`BC ${bc.bc_id} ${t.pages.bons.statusPending}`);
  };

  // Handle opening BC detail dialog
  const handleOpenBcDetail = (bc: BonCommande) => {
    setSelectedBc(bc);
    setBcDetailOpen(true);
  };

  // Handle adding delivery from BC detail dialog - opens the new AddDeliveryDialog
  const handleAddDeliveryFromDialog = (bc: BonCommande) => {
    setBcDetailOpen(false);
    setAddDeliveryBc(bc);
    setAddDeliveryOpen(true);
  };

  // Handle creating a delivery with specific volume
  const handleCreateDelivery = async (bc: BonCommande, volume: number): Promise<string | null> => {
    setLaunchingProduction(bc.bc_id);
    const blId = await createBlFromBc(bc, volume);
    setLaunchingProduction(null);
    return blId;
  };

  // Handle copying a BC to a new order
  const handleCopyBc = (bc: BonCommande) => {
    resetFormState();
    setOrderClientId(bc.client_id);
    setOrderFormuleId(bc.formule_id);
    setOrderVolume(bc.volume_m3.toString());
    setOrderPrix(bc.prix_vente_m3.toString());
    if (bc.date_livraison_souhaitee) {
      setDeliveryDate(new Date(bc.date_livraison_souhaitee));
    }
    if (bc.heure_livraison_souhaitee) {
      setDeliveryTime(bc.heure_livraison_souhaitee);
    }
    setDeliveryAddress(bc.adresse_livraison || bc.client?.adresse || '');
    setContactChantier(bc.contact_chantier || '');
    setTelephoneChantier(bc.telephone_chantier || '');
    setReferenceClient(bc.reference_client || '');
    setConditionsAcces(bc.conditions_acces || '');
    setPompeRequise(bc.pompe_requise || false);
    setTypePompe(bc.type_pompe || '');
    setNotes(bc.notes || '');
    setDirectOrderOpen(true);
  };

  // Handle direct order creation
  const handleCreateDirectOrder = async () => {
    if (!orderClientId || !orderFormuleId || !orderVolume || !orderPrix || !deliveryDate) {
      return;
    }

    setCreatingOrder(true);
    const bc = await createDirectBc({
      client_id: orderClientId,
      formule_id: orderFormuleId,
      volume_m3: parseFloat(orderVolume),
      prix_vente_m3: parseFloat(orderPrix),
      date_livraison_souhaitee: format(deliveryDate, 'yyyy-MM-dd'),
      heure_livraison_souhaitee: deliveryTime || undefined,
      adresse_livraison: deliveryAddress || undefined,
      contact_chantier: contactChantier || undefined,
      telephone_chantier: telephoneChantier || undefined,
      reference_client: referenceClient || undefined,
      conditions_acces: conditionsAcces || undefined,
      pompe_requise: pompeRequise,
      type_pompe: typePompe || undefined,
      notes: notes || undefined,
      zone_livraison_id: selectedZoneId || undefined,
      mode_paiement: modePaiement,
      prix_livraison_m3: prixLivraison,
      prestataire_id: selectedPrestataireId || undefined,
    });
    
    if (bc) {
      if (autoLaunchProduction) {
        const blId = await createBlFromBc(bc);
        setCreatingOrder(false);
        setDirectOrderOpen(false);
        resetFormState();
        if (blId) {
          const deliveryDateStr = format(deliveryDate, 'yyyy-MM-dd');
          navigate(`/planning?date=${deliveryDateStr}`);
        }
      } else {
        setCreatingOrder(false);
        setDirectOrderOpen(false);
        resetFormState();
      }
    } else {
      setCreatingOrder(false);
    }
  };

  // Auto-fill client address when client is selected
  const handleClientSelect = (clientId: string) => {
    setOrderClientId(clientId);
    const client = clients.find(c => c.client_id === clientId);
    if (client) {
      setDeliveryAddress(client.adresse || '');
      setTelephoneChantier(client.telephone || '');
    }
  };

  const handleCancelDirectOrder = () => {
    setDirectOrderOpen(false);
    resetFormState();
  };

  // =====================================================
  // HARD PERMISSION WALL - Centraliste TOTAL BLOCK
  // =====================================================
  // SECURITY: Block Centraliste and Resp. Technique from Sales
  if ((effectiveCentraliste || effectiveRespTech) && !isCeo && !isSuperviseur) {
    return (
      <AccessDenied 
        module="Ventes" 
        reason={effectiveRespTech 
          ? "Le module Ventes est interdit au Responsable Technique. Contactez la direction pour toute demande commerciale."
          : "Le module Ventes est interdit aux Centralistes. Retournez à la Production."
        } 
      />
    );
  }

  return (
    <TooltipProvider>
      <MainLayout>
        {/* Ambient Atmosphere */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: '-15%', left: '30%', width: '50%', height: '40%',
            background: 'radial-gradient(ellipse, rgba(253,185,19,0.04) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}/>
          <div style={{
            position: 'absolute', top: '20%', right: '-5%', width: '30%', height: '35%',
            background: 'radial-gradient(ellipse, rgba(0,217,255,0.02) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}/>
        </div>
        <div className="space-y-6 overflow-x-hidden max-w-full w-full relative z-[1]" style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>

          {/* ── Premium Page Header ── */}
          {/* MOBILE HEADER (< md) */}
           <div className="md:hidden space-y-3">
            {/* Title + Primary CTA */}
            <div className="px-1 py-2">
              <div className="flex items-center justify-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={18} color="#F59E0B" />
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontWeight: 700, fontSize: 13 }}>TBOS </span>
                    <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: 13 }}>Ventes</span>
                    <p style={{ color: '#64748B', fontSize: 10, lineHeight: 1 }}>Gestion des devis et bons de commande</p>
                  </div>
                </div>
                <SmartQuoteCalculator variant="prominent" />
              </div>
            </div>

            {/* Secondary Actions + Search + Filter */}
            <div className="flex items-center gap-2">
              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-muted-foreground transition-all duration-200 active:scale-95">
                    <span className="text-base">⋯</span> Actions
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5">
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <div onClick={() => document.querySelector<HTMLButtonElement>('[data-export-reports]')?.click()}>
                      <FileText className="h-4 w-4 mr-3 text-muted-foreground" />
                      Exporter
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer" onClick={() => setBatchReminderOpen(true)}>
                    <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                    {t.pages.ventes.reminders}
                  </DropdownMenuItem>
                  {(canCreateBcDirect || isDirecteurOperations) && (
                    <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer" onClick={() => setEmergencyBcOpen(true)}>
                      <ShoppingCart className="h-4 w-4 mr-3 text-muted-foreground" />
                      {isDirecteurOperations && !canCreateBcDirect ? t.pages.ventes.newOrder : t.pages.ventes.directOrder}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <div><Receipt className="h-4 w-4 mr-3 text-muted-foreground" />Rappels Auto</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <div><Zap className="h-4 w-4 mr-3 text-muted-foreground" />Communications</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <div><Calendar className="h-4 w-4 mr-3 text-muted-foreground" />Historique</div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* DESKTOP HEADER (md+) */}
          <div className="hidden md:block">
            <PageHeader
              icon={BarChart3}
              title="Ventes"
              subtitle="Gestion des devis et bons de commande"
              actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ExportReportsDialog 
                    devisList={devisList}
                    bcList={bcList}
                    selectedDevisIds={selectedDevisIds}
                    selectedBcIds={selectedBcIds}
                  />
                  {(canCreateBcDirect || isDirecteurOperations) && (
                    <button 
                      onClick={() => setEmergencyBcOpen(true)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 12,
                        padding: '7px 16px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 500,
                        transition: 'all 150ms',
                        whiteSpace: 'nowrap' as const,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <ShoppingCart size={14} />
                      {isDirecteurOperations && !canCreateBcDirect ? t.pages.ventes.newOrder : t.pages.ventes.directOrder}
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        style={{
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 8,
                          padding: '7px 12px',
                          background: 'transparent',
                          color: 'rgba(255,255,255,0.5)',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontFamily: 'DM Sans, sans-serif',
                          fontWeight: 500,
                          transition: 'all 150ms',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 14, lineHeight: 1 }}>⋯</span>
                        Plus
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      style={{
                        background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        padding: 4,
                        minWidth: 200,
                      }}
                    >
                      <DropdownMenuItem className="cursor-pointer rounded-md" style={{ padding: '10px 16px', fontSize: 13, color: '#D1D5DB' }} onSelect={() => document.querySelector<HTMLButtonElement>('[data-scheduled-reminders]')?.click()}>
                        <Receipt className="h-4 w-4 mr-3 text-muted-foreground" />Rappels Auto
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-md" style={{ padding: '10px 16px', fontSize: 13, color: '#D1D5DB' }} onSelect={() => setBatchReminderOpen(true)}>
                        <Mail className="h-4 w-4 mr-3 text-muted-foreground" />{t.pages.ventes.reminders}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-md" style={{ padding: '10px 16px', fontSize: 13, color: '#D1D5DB' }} onSelect={() => document.querySelector<HTMLButtonElement>('[data-communication-log]')?.click()}>
                        <Zap className="h-4 w-4 mr-3 text-muted-foreground" />Communications
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-md" style={{ padding: '10px 16px', fontSize: 13, color: '#D1D5DB' }} onSelect={() => document.querySelector<HTMLButtonElement>('[data-activity-history]')?.click()}>
                        <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />Historique
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <SmartQuoteCalculator variant="prominent" />
                  <div className="hidden">
                    <ScheduledRemindersDialog devisList={devisList} onRefresh={fetchData} />
                    <CommunicationLogDrawer />
                    <ActivityHistoryDrawer />
                  </div>
                </div>
              }
            />
          </div>

          {/* Expiring Quotes Alert */}
          {showExpiringAlert && expiringDevisCount > 0 && (
            <ExpiringQuotesAlert
              devisList={devisList}
              onViewExpiring={() => {
                setFilters({ ...filters, status: 'en_attente' });
                setActiveTab('devis');
              }}
              onDismiss={() => setShowExpiringAlert(false)}
            />
          )}

          {/* ── PIPELINE COMMERCIAL Section Header + KPI Row ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Pipeline Commercial</span>
              <div className="flex-1 border-t border-amber-500/30" />
            </div>
            <PipelineKpiCards devisList={devisList} />
          </div>


          {/* Filters & Saved Views */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <VentesFilters
                filters={filters}
                onFiltersChange={setFilters}
                clients={clients}
                formules={formules}
                isRefreshing={isRefreshing || loading}
                lastRefresh={lastRefresh}
                onRefresh={handleRefresh}
                autoRefreshEnabled={autoRefreshEnabled}
                onAutoRefreshToggle={toggleAutoRefresh}
                searchInputRef={searchInputRef}
              />
            </div>
            <SavedFilterViews currentFilters={filters} onApplyFilter={setFilters} />
          </div>

          {/* Active Status Filter Indicator */}
          {filters.status !== 'all' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
               <span className="text-sm text-muted-foreground">{t.pages.ventes.activeFilter}:</span>
               <Badge variant="secondary" className="gap-1">
                 {filters.status === 'en_attente' && t.pages.ventes.statusEnAttente}
                 {filters.status === 'accepte' && t.pages.ventes.statusAccepte}
                 {filters.status === 'converti' && t.pages.ventes.statusConverti}
                 {filters.status === 'refuse' && t.pages.ventes.statusRefuse}
                 {filters.status === 'pret_production' && t.pages.ventes.statusPretProd}
                 {filters.status === 'en_production' && t.pages.ventes.statusEnProd}
                 {filters.status === 'termine' && t.pages.ventes.statusTermine}
                 {filters.status === 'livre' && t.pages.ventes.statusLivre}
               </Badge>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => setFilters({ ...filters, status: 'all' })}
                 className="ml-auto gap-1 text-muted-foreground hover:text-foreground"
               >
                 <X className="h-3 w-3" />
                 {t.pages.ventes.viewAll}
              </Button>
            </div>
          )}


          {/* Tabs for Devis, BC, Factures and Calendar — PRIMARY CONTENT */}
          <div id="ventes-tabs-section" className="scroll-mt-36">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList 
              className="h-auto gap-0.5 flex flex-nowrap overflow-x-auto scrollbar-hide w-auto"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 12,
                padding: 4,
                display: 'inline-flex',
              }}
            >
               <TabsTrigger value="devis" className="shrink-0 whitespace-nowrap gap-2 rounded-[9px] px-[18px] py-2 text-xs font-medium transition-all data-[state=inactive]:text-slate-400/50 data-[state=inactive]:hover:text-slate-300/80 data-[state=inactive]:hover:bg-white/[0.03] data-[state=active]:bg-white/[0.06] data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                 <FileText className="h-3.5 w-3.5" />
                 {t.pages.ventes.devisTab}
                 <span className="ml-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ color: '#FDB913', background: 'rgba(253,185,19,0.1)' }}>{filteredDevis.length}</span>
                 {expiringDevisCount > 0 && (
                   <Badge variant="destructive" className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center">
                     <AlertTriangle className="h-2.5 w-2.5" />
                   </Badge>
                 )}
               </TabsTrigger>
               <TabsTrigger value="bc" className="shrink-0 whitespace-nowrap gap-2 rounded-[9px] px-[18px] py-2 text-xs font-medium transition-all data-[state=inactive]:text-slate-400/50 data-[state=inactive]:hover:text-slate-300/80 data-[state=inactive]:hover:bg-white/[0.03] data-[state=active]:bg-white/[0.06] data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                 <ShoppingCart className="h-3.5 w-3.5" />
                 {t.pages.ventes.bcTab}
                 <span className="ml-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ color: '#FDB913', background: 'rgba(253,185,19,0.1)' }}>{filteredBc.length}</span>
                 {filteredBc.some(bc => bc.statut === 'en_attente_validation') && canValidateBcPrice && (
                   <Badge variant="outline" className="ml-0.5 h-4 px-1 bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse text-[9px]">
                     {filteredBc.filter(bc => bc.statut === 'en_attente_validation').length}
                   </Badge>
                 )}
               </TabsTrigger>
               <TabsTrigger value="factures" className="shrink-0 whitespace-nowrap gap-2 rounded-[9px] px-[18px] py-2 text-xs font-medium transition-all data-[state=inactive]:text-slate-400/50 data-[state=inactive]:hover:text-slate-300/80 data-[state=inactive]:hover:bg-white/[0.03] data-[state=active]:bg-white/[0.06] data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                 <Receipt className="h-3.5 w-3.5" />
                 {t.pages.ventes.invoicesTab}
               </TabsTrigger>
               <TabsTrigger value="calendar" className="shrink-0 whitespace-nowrap gap-2 rounded-[9px] px-[18px] py-2 text-xs font-medium transition-all data-[state=inactive]:text-slate-400/50 data-[state=inactive]:hover:text-slate-300/80 data-[state=inactive]:hover:bg-white/[0.03] data-[state=active]:bg-white/[0.06] data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                 <Calendar className="h-3.5 w-3.5" />
                 {t.pages.ventes.calendarTab}
               </TabsTrigger>
            </TabsList>

            {/* Devis Tab */}
            <TabsContent value="devis" className="space-y-4">
              <BulkActionsToolbar
                selectedCount={selectedDevisIds.length}
                type="devis"
                onMarkRefused={async () => {
                  for (const id of selectedDevisIds) {
                    const devis = filteredDevis.find(d => d.id === id);
                    if (devis) {
                      await supabase
                        .from('devis')
                        .update({ statut: 'refuse' })
                        .eq('id', id);
                    }
                  }
                  await fetchData();
                }}
                onExportCSV={() => exportDevisToCSV(filteredDevis, selectedDevisIds)}
                onClearSelection={() => setSelectedDevisIds([])}
              />
              <div className="flex justify-end">
                <BulkScorerButton devisList={filteredDevis} onDone={fetchData} />
              </div>
              <Card className="bg-transparent">
                <CardContent className="pt-6">
                  <DevisTableResponsive
                    devisList={filteredDevis}
                    loading={loading}
                    onConvert={openConvertDialog}
                    onRowClick={(devis) => {
                      setSelectedDevis(devis);
                      setDevisDetailOpen(true);
                    }}
                    getExpirationInfo={getExpirationInfo}
                    selectedIds={selectedDevisIds}
                    onSelectionChange={setSelectedDevisIds}
                    onRefresh={fetchData}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* BC Tab */}
            <TabsContent value="bc" className="space-y-4">
              <BulkActionsToolbar
                selectedCount={selectedBcIds.length}
                type="bc"
                onCancel={async () => {
                  for (const id of selectedBcIds) {
                    await supabase
                      .from('bons_commande')
                      .update({ statut: 'annule' })
                      .eq('id', id);
                  }
                  await fetchData();
                }}
                onExportCSV={() => exportBcToCSV(filteredBc, selectedBcIds)}
                onClearSelection={() => setSelectedBcIds([])}
              />
              <Card>
                <CardContent className="pt-6">
                  <BcTableResponsive
                    bcList={filteredBc}
                    loading={loading}
                    onRowClick={handleOpenBcDetail}
                    onCreateBL={(bc) => {
                      console.log('Create BL for:', bc);
                    }}
                    onGenerateInvoice={(bc) => generateConsolidatedInvoice(bc.bc_id)}
                    selectedIds={selectedBcIds}
                    onSelectionChange={setSelectedBcIds}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Factures Tab */}
            <TabsContent value="factures" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <FacturesTable />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <OrderCalendarView
                bcList={filteredBc}
                onSelectBc={handleOpenBcDetail}
              />
            </TabsContent>
          </Tabs>
          </div>

          {/* Pipeline Briefing IA */}
          <PipelineBriefingCard />

          {/* Flux Commercial Widget */}
          <FluxCommercialWidget stats={stats} onStageClick={handleStageClick} />

          {/* Pending BC Validation - For Admin/CEO */}
          <PendingBcValidation onRefresh={fetchData} />

          {/* Emergency BC Quality View - For Resp. Technique */}
          <EmergencyBcQualityView onNavigateToPlanning={(date) => navigate(`/planning?date=${date}`)} />

          {/* Revenue Forecast */}
          <div className="mb-8">
            <RevenueForecastChart bcList={bcList} devisList={devisList} />
          </div>

          {/* Sales Performance Charts */}
          <div className="mb-8">
            <SalesPerformanceCharts bcList={bcList} devisList={devisList} />
          </div>

          {/* ══ Margin Optimizer AI ══ */}
          <MarginOverviewCard />

          {/* ══ Pipeline Analysis AI ══ */}
          <PipelineAnalysisCard />

        </div>

        {/* Convert to BC Dialog */}
        <ConvertToBcDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        selectedDevis={selectedDevis}
        converting={converting}
        onConvert={handleConvertToBc}
        deliveryDate={deliveryDate}
        setDeliveryDate={setDeliveryDate}
        deliveryTime={deliveryTime}
        setDeliveryTime={setDeliveryTime}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        contactChantier={contactChantier}
        setContactChantier={setContactChantier}
        telephoneChantier={telephoneChantier}
        setTelephoneChantier={setTelephoneChantier}
        referenceClient={referenceClient}
        setReferenceClient={setReferenceClient}
        conditionsAcces={conditionsAcces}
        setConditionsAcces={setConditionsAcces}
        pompeRequise={pompeRequise}
        setPompeRequise={setPompeRequise}
        typePompe={typePompe}
        setTypePompe={setTypePompe}
        notes={notes}
        setNotes={setNotes}
        selectedZoneId={selectedZoneId}
        setSelectedZoneId={setSelectedZoneId}
        modePaiement={modePaiement}
        setModePaiement={setModePaiement}
        selectedPrestataireId={selectedPrestataireId}
        setSelectedPrestataireId={setSelectedPrestataireId}
        zones={zones}
        prestataires={prestataires}
      />

      {/* Direct Order Dialog */}
      <DirectOrderDialog
        open={directOrderOpen}
        onOpenChange={setDirectOrderOpen}
        creatingOrder={creatingOrder}
        onCreateOrder={handleCreateDirectOrder}
        onCancel={handleCancelDirectOrder}
        onClientCreated={(clientId, clientName) => {
          // Refresh client list to include newly created client
          supabase.from('clients').select('client_id, nom_client, adresse, telephone').order('nom_client')
            .then(({ data }) => {
              if (data) setClients(data);
            });
        }}
        orderClientId={orderClientId}
        onClientSelect={handleClientSelect}
        orderFormuleId={orderFormuleId}
        setOrderFormuleId={setOrderFormuleId}
        orderVolume={orderVolume}
        setOrderVolume={setOrderVolume}
        orderPrix={orderPrix}
        setOrderPrix={setOrderPrix}
        deliveryDate={deliveryDate}
        setDeliveryDate={setDeliveryDate}
        deliveryTime={deliveryTime}
        setDeliveryTime={setDeliveryTime}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        contactChantier={contactChantier}
        setContactChantier={setContactChantier}
        telephoneChantier={telephoneChantier}
        setTelephoneChantier={setTelephoneChantier}
        referenceClient={referenceClient}
        setReferenceClient={setReferenceClient}
        conditionsAcces={conditionsAcces}
        setConditionsAcces={setConditionsAcces}
        pompeRequise={pompeRequise}
        setPompeRequise={setPompeRequise}
        typePompe={typePompe}
        setTypePompe={setTypePompe}
        notes={notes}
        setNotes={setNotes}
        selectedZoneId={selectedZoneId}
        setSelectedZoneId={setSelectedZoneId}
        modePaiement={modePaiement}
        setModePaiement={setModePaiement}
        selectedPrestataireId={selectedPrestataireId}
        setSelectedPrestataireId={setSelectedPrestataireId}
        autoLaunchProduction={autoLaunchProduction}
        setAutoLaunchProduction={setAutoLaunchProduction}
        clients={clients}
        formules={formules}
        zones={zones}
        prestataires={prestataires}
      />

        {/* Devis Detail Dialog */}
        <DevisDetailDialog
          devis={selectedDevis}
          open={devisDetailOpen}
          onOpenChange={setDevisDetailOpen}
          onConvert={openConvertDialog}
        />

        {/* BC Detail Dialog */}
        <BcDetailDialog
          bc={selectedBc}
          open={bcDetailOpen}
          onOpenChange={setBcDetailOpen}
          onAddDelivery={handleAddDeliveryFromDialog}
          onGenerateInvoice={generateConsolidatedInvoice}
          onRefresh={fetchData}
        />

        {/* Add Delivery Dialog - for multi-delivery orders */}
        <AddDeliveryDialog
          bc={addDeliveryBc}
          open={addDeliveryOpen}
          onOpenChange={setAddDeliveryOpen}
          onCreateDelivery={handleCreateDelivery}
          onRefresh={fetchData}
        />

        {/* Batch Reminder Dialog */}
        <BatchReminderDialog
          open={batchReminderOpen}
          onOpenChange={setBatchReminderOpen}
          devisList={devisList}
          onSuccess={fetchData}
        />

        {/* Strategic Emergency BC Dialog */}
        <EmergencyBcDialog
          open={emergencyBcOpen}
          onOpenChange={setEmergencyBcOpen}
          clients={clients.map(c => ({ ...c, credit_bloque: false }))}
          formules={formules}
          zones={zones}
          prestataires={prestataires}
          onSuccess={(bcId, isEmergency) => {
            fetchData();
            if (isEmergency) {
              // Navigate to planning for emergency BCs
              navigate(`/planning?date=${format(new Date(), 'yyyy-MM-dd')}&focus=pending`);
            }
          }}
        />
      </MainLayout>
    </TooltipProvider>
  );
}
