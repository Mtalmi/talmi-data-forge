import { useState, useEffect, useRef } from 'react';
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
import { FileText, ShoppingCart, AlertTriangle, X, Calendar, Mail, Receipt, Zap } from 'lucide-react';
import { format } from 'date-fns';
import SmartQuoteCalculator from '@/components/quotes/SmartQuoteCalculator';
import { BcDetailDialog } from '@/components/bons/BcDetailDialog';
import { AddDeliveryDialog } from '@/components/bons/AddDeliveryDialog';

// Refactored components
import { PipelineStats } from '@/components/ventes/PipelineStats';
import { FluxCommercialWidget } from '@/components/ventes/FluxCommercialWidget';
import { DevisTable } from '@/components/ventes/DevisTable';
import { BcTable } from '@/components/ventes/BcTable';
import { DevisTableResponsive } from '@/components/ventes/DevisTableResponsive';
import { BcTableResponsive } from '@/components/ventes/BcTableResponsive';
import { ConvertToBcDialog } from '@/components/ventes/ConvertToBcDialog';
import { DirectOrderDialog } from '@/components/ventes/DirectOrderDialog';
import { VentesFilters } from '@/components/ventes/VentesFilters';
import { BulkActionsToolbar, exportDevisToCSV, exportBcToCSV } from '@/components/ventes/BulkActionsToolbar';
import { DevisDetailDialog } from '@/components/ventes/DevisDetailDialog';
import { ActivityHistoryDrawer } from '@/components/ventes/ActivityHistoryDrawer';
import { OrderCalendarView } from '@/components/ventes/OrderCalendarView';
import { WorkflowStepper, WorkflowStage } from '@/components/ventes/WorkflowStepper';
import { FacturesTable } from '@/components/ventes/FacturesTable';

// Phase 5-7 Components
import { useVentesKeyboardShortcuts, KeyboardShortcutsHint } from '@/components/ventes/KeyboardShortcuts';
import { SavedFilterViews } from '@/components/ventes/SavedFilterViews';
import { ExpiringQuotesAlert } from '@/components/ventes/ExpiringQuotesAlert';
import { RevenueForecastChart } from '@/components/ventes/RevenueForecastChart';
import { BatchReminderDialog } from '@/components/ventes/BatchReminderDialog';
import { CommunicationLogDrawer } from '@/components/ventes/CommunicationLogDrawer';
import { ScheduledRemindersDialog } from '@/components/ventes/ScheduledRemindersDialog';
import { ExportReportsDialog } from '@/components/ventes/ExportReportsDialog';

// Strategic BC Workflow Components
import { EmergencyBcDialog } from '@/components/ventes/EmergencyBcDialog';
import { PendingBcValidation } from '@/components/ventes/PendingBcValidation';
import { EmergencyBcQualityView } from '@/components/ventes/EmergencyBcQualityView';

import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Lock, Shield } from 'lucide-react';

export default function Ventes() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { 
    isCentraliste, isCeo, isSuperviseur, isAgentAdministratif, isCommercial, 
    isDirecteurOperations, isResponsableTechnique,
    canCreateBcDirect, canValidateBcPrice, isInEmergencyWindow 
  } = useAuth();
  
  // =====================================================
  // HARD PERMISSION WALL - Centraliste TOTAL BLOCK
  // Centraliste has ZERO access to Ventes module
  // =====================================================
  if (isCentraliste && !isCeo && !isSuperviseur) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="p-6 rounded-full bg-destructive/10">
            <Lock className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-destructive">{t.pages.accessDenied}</h1>
          <p className="text-muted-foreground text-center max-w-md">
             {t.pages.moduleNotAccessible}<br />
             {t.pages.contactAdmin}
          </p>
          <Button variant="outline" onClick={() => navigate('/production')}>
            {t.pages.backToProduction}
          </Button>
        </div>
      </MainLayout>
    );
  }
  
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
    toast.info(`BC ${bc.bc_id} est en attente de validation par l'Agent Administratif`);
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

  return (
    <TooltipProvider>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t.pages.ventes.title}</h1>
              <p className="text-muted-foreground">
                {t.pages.ventes.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SmartQuoteCalculator variant="prominent" />
              <ExportReportsDialog 
                devisList={devisList}
                bcList={bcList}
                selectedDevisIds={selectedDevisIds}
                selectedBcIds={selectedBcIds}
              />
              <ScheduledRemindersDialog devisList={devisList} onRefresh={fetchData} />
              <Button 
                onClick={() => setBatchReminderOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                {t.pages.ventes.reminders}
              </Button>
              {/* Strategic BC Creation - Role-Based */}
              {(canCreateBcDirect || isDirecteurOperations) && (
                <Button 
                  onClick={() => setEmergencyBcOpen(true)}
                  variant={isInEmergencyWindow && isDirecteurOperations ? "default" : "outline"}
                  className={`gap-2 ${isInEmergencyWindow && isDirecteurOperations ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                >
                  {isInEmergencyWindow && isDirecteurOperations ? (
                    <Zap className="h-4 w-4" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                   {isDirecteurOperations && !canCreateBcDirect ? t.pages.ventes.newOrder : t.pages.ventes.directOrder}
                </Button>
              )}
              <CommunicationLogDrawer />
              <ActivityHistoryDrawer />
              <KeyboardShortcutsHint />
            </div>
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


          {/* Flux Commercial Widget */}
          <FluxCommercialWidget stats={stats} onStageClick={handleStageClick} />

          {/* Pending BC Validation - For Admin/CEO */}
          <PendingBcValidation onRefresh={fetchData} />

          {/* Emergency BC Quality View - For Resp. Technique */}
          <EmergencyBcQualityView onNavigateToPlanning={(date) => navigate(`/planning?date=${date}`)} />

          {/* Stats Cards + Revenue Forecast */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <PipelineStats stats={stats} onStageClick={handleStageClick} />
            </div>
            <RevenueForecastChart bcList={bcList} devisList={devisList} />
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

          {/* Tabs for Devis, BC, Factures and Calendar */}
          <div id="ventes-tabs-section" className="scroll-mt-36">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
               <TabsTrigger value="devis" className="gap-2">
                 <FileText className="h-4 w-4" />
                 {t.pages.ventes.devisTab} ({filteredDevis.length})
                 {expiringDevisCount > 0 && (
                   <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                     <AlertTriangle className="h-3 w-3" />
                   </Badge>
                 )}
               </TabsTrigger>
               <TabsTrigger value="bc" className="gap-2">
                 <ShoppingCart className="h-4 w-4" />
                 {t.pages.ventes.bcTab} ({filteredBc.length})
                 {filteredBc.some(bc => bc.statut === 'en_attente_validation') && canValidateBcPrice && (
                   <Badge variant="outline" className="ml-1 h-5 px-1 bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse">
                     {filteredBc.filter(bc => bc.statut === 'en_attente_validation').length}
                   </Badge>
                 )}
               </TabsTrigger>
               <TabsTrigger value="factures" className="gap-2">
                 <Receipt className="h-4 w-4" />
                 {t.pages.ventes.invoicesTab}
               </TabsTrigger>
               <TabsTrigger value="calendar" className="gap-2">
                 <Calendar className="h-4 w-4" />
                 {t.pages.ventes.calendarTab}
               </TabsTrigger>
            </TabsList>

            {/* Devis Tab */}
            <TabsContent value="devis" className="space-y-4">
              {/* Bulk Actions Toolbar */}
              <BulkActionsToolbar
                selectedCount={selectedDevisIds.length}
                type="devis"
                onMarkRefused={async () => {
                  // Mark selected devis as refused
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
              <Card>
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
              {/* Bulk Actions Toolbar */}
              <BulkActionsToolbar
                selectedCount={selectedBcIds.length}
                type="bc"
                onCancel={async () => {
                  // Cancel selected BC (update status)
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
                      // Handle BL creation
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
