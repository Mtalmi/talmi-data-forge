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
import { PipelineBriefingCard } from '@/components/ventes/PipelineBriefingCard';
import { ConversionPredictorCard } from '@/components/ventes/ConversionPredictorCard';

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

/* ── Live clock ── */
function VentesLiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily: 'ui-monospace', fontSize: 12, color: '#9CA3AF', letterSpacing: '0.02em' }}>{time}</span>;
}

/* ── Main tab definitions ── */
const MAIN_TABS = [
  { id: 'overview', label: "VUE D'ENSEMBLE" },
  { id: 'orders', label: 'DEVIS & COMMANDES', badgeCount: 6 },
  { id: 'analytics', label: 'ANALYTIQUE' },
  { id: 'intelligence', label: 'INTELLIGENCE IA', badgeCount: 3 },
] as const;

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
  
  const effectiveRespTech = isResponsableTechnique || previewRole === 'responsable_technique';
  const effectiveCentraliste = isCentraliste || previewRole === 'centraliste';
  
  const { devisList, bcList, loading, stats, fetchData, convertToBc, createBlFromBc, createDirectBc, generateConsolidatedInvoice } = useSalesWorkflow();
  const { zones, prestataires } = useZonesLivraison();
  
  const {
    filters, setFilters, filteredDevis, filteredBc,
    autoRefreshEnabled, toggleAutoRefresh, lastRefresh, isRefreshing,
    handleRefresh, getExpirationInfo, expiringDevisCount,
  } = useVentesFilters(devisList, bcList, fetchData);
  
  // Main page tab
  const [mainTab, setMainTab] = useState('overview');
  // Sub-tab for orders section
  const [activeTab, setActiveTab] = useState('devis');
  
  // Bulk selection state
  const [selectedDevisIds, setSelectedDevisIds] = useState<string[]>([]);
  const [selectedBcIds, setSelectedBcIds] = useState<string[]>([]);
  
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [devisDetailOpen, setDevisDetailOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [launchingProduction, setLaunchingProduction] = useState<string | null>(null);
  
  const [batchReminderOpen, setBatchReminderOpen] = useState(false);
  const [showExpiringAlert, setShowExpiringAlert] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

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
  
  const handleStageClick = (stage: string) => {
    const devisStatuses = ['en_attente', 'accepte', 'converti', 'refuse', 'expire'];
    const bcStatuses = ['pret_production', 'en_production', 'termine', 'livre'];
    setFilters({ ...filters, status: stage });
    if (devisStatuses.includes(stage)) setActiveTab('devis');
    else if (bcStatuses.includes(stage)) setActiveTab('bc');
    setMainTab('orders');
  };

  // BC Detail Dialog State
  const [selectedBc, setSelectedBc] = useState<BonCommande | null>(null);
  const [bcDetailOpen, setBcDetailOpen] = useState(false);
  const [addDeliveryOpen, setAddDeliveryOpen] = useState(false);
  const [addDeliveryBc, setAddDeliveryBc] = useState<BonCommande | null>(null);
  const [directOrderOpen, setDirectOrderOpen] = useState(false);
  const [emergencyBcOpen, setEmergencyBcOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [clients, setClients] = useState<{client_id: string; nom_client: string; adresse: string | null; telephone: string | null}[]>([]);
  const [formules, setFormules] = useState<{formule_id: string; designation: string; cut_dh_m3: number | null}[]>([]);
  
  const [orderClientId, setOrderClientId] = useState('');
  const [orderFormuleId, setOrderFormuleId] = useState('');
  const [orderVolume, setOrderVolume] = useState('');
  const [orderPrix, setOrderPrix] = useState('');
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
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [modePaiement, setModePaiement] = useState('virement');
  const [selectedPrestataireId, setSelectedPrestataireId] = useState('');
  const [autoLaunchProduction, setAutoLaunchProduction] = useState(true);

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
    setDeliveryDate(undefined); setDeliveryTime('08:00'); setDeliveryAddress('');
    setContactChantier(''); setTelephoneChantier(''); setReferenceClient('');
    setConditionsAcces(''); setPompeRequise(false); setTypePompe(''); setNotes('');
    setOrderClientId(''); setOrderFormuleId(''); setOrderVolume(''); setOrderPrix('');
    setSelectedZoneId(''); setModePaiement('virement'); setSelectedPrestataireId('');
    setAutoLaunchProduction(true);
  };

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
    setConverting(false); setConvertDialogOpen(false); setSelectedDevis(null); resetFormState();
  };

  const openConvertDialog = (devis: Devis) => {
    resetFormState(); setSelectedDevis(devis);
    setDeliveryAddress(devis.client?.adresse || ''); setConvertDialogOpen(true);
  };

  const handleLaunchProduction = async (bc: BonCommande) => {
    setLaunchingProduction(bc.bc_id);
    const blId = await createBlFromBc(bc);
    setLaunchingProduction(null);
    if (blId) {
      const deliveryDate = bc.date_livraison_souhaitee || new Date().toISOString().split('T')[0];
      navigate(`/planning?date=${deliveryDate}&focus=pending`);
    }
  };

  const handleSubmitForValidation = async (bc: BonCommande) => {
    const { toast } = await import('sonner');
    toast.info(`BC ${bc.bc_id} ${t.pages.bons.statusPending}`);
  };

  const handleOpenBcDetail = (bc: BonCommande) => { setSelectedBc(bc); setBcDetailOpen(true); };
  const handleAddDeliveryFromDialog = (bc: BonCommande) => { setBcDetailOpen(false); setAddDeliveryBc(bc); setAddDeliveryOpen(true); };
  const handleCreateDelivery = async (bc: BonCommande, volume: number): Promise<string | null> => {
    setLaunchingProduction(bc.bc_id); const blId = await createBlFromBc(bc, volume); setLaunchingProduction(null); return blId;
  };

  const handleCopyBc = (bc: BonCommande) => {
    resetFormState(); setOrderClientId(bc.client_id); setOrderFormuleId(bc.formule_id);
    setOrderVolume(bc.volume_m3.toString()); setOrderPrix(bc.prix_vente_m3.toString());
    if (bc.date_livraison_souhaitee) setDeliveryDate(new Date(bc.date_livraison_souhaitee));
    if (bc.heure_livraison_souhaitee) setDeliveryTime(bc.heure_livraison_souhaitee);
    setDeliveryAddress(bc.adresse_livraison || bc.client?.adresse || '');
    setContactChantier(bc.contact_chantier || ''); setTelephoneChantier(bc.telephone_chantier || '');
    setReferenceClient(bc.reference_client || ''); setConditionsAcces(bc.conditions_acces || '');
    setPompeRequise(bc.pompe_requise || false); setTypePompe(bc.type_pompe || '');
    setNotes(bc.notes || ''); setDirectOrderOpen(true);
  };

  const handleCreateDirectOrder = async () => {
    if (!orderClientId || !orderFormuleId || !orderVolume || !orderPrix || !deliveryDate) return;
    setCreatingOrder(true);
    const bc = await createDirectBc({
      client_id: orderClientId, formule_id: orderFormuleId,
      volume_m3: parseFloat(orderVolume), prix_vente_m3: parseFloat(orderPrix),
      date_livraison_souhaitee: format(deliveryDate, 'yyyy-MM-dd'),
      heure_livraison_souhaitee: deliveryTime || undefined,
      adresse_livraison: deliveryAddress || undefined, contact_chantier: contactChantier || undefined,
      telephone_chantier: telephoneChantier || undefined, reference_client: referenceClient || undefined,
      conditions_acces: conditionsAcces || undefined, pompe_requise: pompeRequise,
      type_pompe: typePompe || undefined, notes: notes || undefined,
      zone_livraison_id: selectedZoneId || undefined, mode_paiement: modePaiement,
      prix_livraison_m3: prixLivraison, prestataire_id: selectedPrestataireId || undefined,
    });
    if (bc) {
      if (autoLaunchProduction) {
        const blId = await createBlFromBc(bc);
        setCreatingOrder(false); setDirectOrderOpen(false); resetFormState();
        if (blId) navigate(`/planning?date=${format(deliveryDate, 'yyyy-MM-dd')}`);
      } else { setCreatingOrder(false); setDirectOrderOpen(false); resetFormState(); }
    } else { setCreatingOrder(false); }
  };

  const handleClientSelect = (clientId: string) => {
    setOrderClientId(clientId);
    const client = clients.find(c => c.client_id === clientId);
    if (client) { setDeliveryAddress(client.adresse || ''); setTelephoneChantier(client.telephone || ''); }
  };

  const handleCancelDirectOrder = () => { setDirectOrderOpen(false); resetFormState(); };

  // SECURITY WALL
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

  // Dynamic badge for orders tab
  const ordersBadge = filteredDevis.length + filteredBc.length;

  return (
    <TooltipProvider>
      <MainLayout>
        {/* Ambient Atmosphere */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-15%', left: '30%', width: '50%', height: '40%', background: 'radial-gradient(ellipse, rgba(253,185,19,0.04) 0%, transparent 70%)', filter: 'blur(80px)' }}/>
          <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '30%', height: '35%', background: 'radial-gradient(ellipse, rgba(0,217,255,0.02) 0%, transparent 70%)', filter: 'blur(60px)' }}/>
        </div>

        <div className="space-y-6 overflow-x-hidden max-w-full w-full relative z-[1]" style={{ width: '100%', padding: '32px 24px' }}>

          {/* ══════════════════════════════════════════════════════
              PREMIUM PAGE HEADER
              ══════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingBottom: 8 }}>
            {/* Branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FFD700, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={18} color="#0B1120" />
              </div>
              <div>
                <span style={{ color: '#94A3B8', fontWeight: 700, fontSize: 13 }}>TBOS </span>
                <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 13 }}>Ventes</span>
                <p style={{ color: '#9CA3AF', fontSize: 12, lineHeight: 1.2, marginTop: 2 }}>Gestion des devis et bons de commande</p>
              </div>
            </div>

            <div style={{ flex: 1 }} />

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'inline-flex' }}>
                <ExportReportsDialog devisList={devisList} bcList={bcList} selectedDevisIds={selectedDevisIds} selectedBcIds={selectedBcIds} />
              </div>
              {(canCreateBcDirect || isDirecteurOperations) && (
                <button
                  onClick={() => setEmergencyBcOpen(true)}
                  style={{ border: '1px solid #D4A843', color: '#D4A843', background: 'transparent', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontFamily: 'ui-monospace', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <ShoppingCart size={14} />
                  {isDirecteurOperations && !canCreateBcDirect ? t.pages.ventes.newOrder : t.pages.ventes.directOrder}
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    style={{ border: '1px solid #D4A843', color: '#D4A843', background: 'transparent', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontFamily: 'ui-monospace', display: 'flex', alignItems: 'center', gap: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 14, lineHeight: 1 }}>⋯</span> Plus <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', padding: 4, minWidth: 200 }}>
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

              {/* Live Clock */}
              <VentesLiveClock />

              <div className="hidden">
                <ScheduledRemindersDialog devisList={devisList} onRefresh={fetchData} />
                <CommunicationLogDrawer />
                <ActivityHistoryDrawer />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              MAIN NAVIGATION TABS
              ══════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
            {MAIN_TABS.map(tab => {
              const isActive = mainTab === tab.id;
              const badgeNum = tab.id === 'orders' ? (filteredDevis.length || undefined) : tab.id === 'intelligence' ? 3 : undefined;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #D4A843' : '2px solid transparent',
                    color: isActive ? '#D4A843' : '#9CA3AF',
                    fontFamily: 'ui-monospace',
                    fontSize: 12,
                    letterSpacing: '1.5px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 200ms',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                  {badgeNum !== undefined && (
                    <span style={{
                      background: 'rgba(212,168,67,0.15)',
                      color: '#D4A843',
                      borderRadius: 10,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontFamily: 'ui-monospace',
                      fontWeight: 600,
                    }}>
                      {badgeNum}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Expiring Quotes Alert - shown across all tabs */}
          {showExpiringAlert && expiringDevisCount > 0 && (
            <ExpiringQuotesAlert
              devisList={devisList}
              onViewExpiring={() => { setFilters({ ...filters, status: 'en_attente' }); setActiveTab('devis'); setMainTab('orders'); }}
              onDismiss={() => setShowExpiringAlert(false)}
            />
          )}

          {/* ══════════════════════════════════════════════════════
              TAB: VUE D'ENSEMBLE
              ══════════════════════════════════════════════════════ */}
          {mainTab === 'overview' && (
            <div style={{ animation: 'fade-in 200ms ease-out' }} className="space-y-6">
              {/* Pipeline Commercial KPIs */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 flex-shrink-0" style={{ color: '#D4A843' }} />
                  <span style={{ color: '#D4A843', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'ui-monospace' }}>Pipeline Commercial</span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
                </div>
                <PipelineKpiCards devisList={devisList} />
              </div>

              {/* Briefing Pipeline */}
              <PipelineBriefingCard />

              {/* Flux Commercial */}
              <FluxCommercialWidget stats={stats} onStageClick={handleStageClick} />

              {/* Pending BC Validation */}
              <PendingBcValidation onRefresh={fetchData} />
              <EmergencyBcQualityView onNavigateToPlanning={(date) => navigate(`/planning?date=${date}`)} />

              {/* Revenue Forecast */}
              <RevenueForecastChart bcList={bcList} devisList={devisList} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB: DEVIS & COMMANDES
              ══════════════════════════════════════════════════════ */}
          {mainTab === 'orders' && (
            <div style={{ animation: 'fade-in 200ms ease-out' }} className="space-y-4">
              {/* Filters & Saved Views */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <VentesFilters
                    filters={filters} onFiltersChange={setFilters} clients={clients} formules={formules}
                    isRefreshing={isRefreshing || loading} lastRefresh={lastRefresh} onRefresh={handleRefresh}
                    autoRefreshEnabled={autoRefreshEnabled} onAutoRefreshToggle={toggleAutoRefresh} searchInputRef={searchInputRef}
                  />
                </div>
                <SavedFilterViews currentFilters={filters} onApplyFilter={setFilters} />
              </div>

              {/* Active Status Filter */}
              {filters.status !== 'all' && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.2)' }}>
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>{t.pages.ventes.activeFilter}:</span>
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
                  <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, status: 'all' })} className="ml-auto gap-1 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" /> {t.pages.ventes.viewAll}
                  </Button>
                </div>
              )}

              {/* Sub-Tabs: Devis / BC / Factures / Calendrier */}
              <div id="ventes-tabs-section" className="scroll-mt-36">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
                    {[
                      { value: 'devis', icon: <FileText className="h-3.5 w-3.5" />, label: t.pages.ventes.devisTab, count: filteredDevis.length, alert: expiringDevisCount > 0 },
                      { value: 'bc', icon: <ShoppingCart className="h-3.5 w-3.5" />, label: t.pages.ventes.bcTab, count: filteredBc.length },
                      { value: 'factures', icon: <Receipt className="h-3.5 w-3.5" />, label: t.pages.ventes.invoicesTab },
                      { value: 'calendar', icon: <Calendar className="h-3.5 w-3.5" />, label: t.pages.ventes.calendarTab },
                    ].map(tab => {
                      const isActive = activeTab === tab.value;
                      return (
                        <button
                          key={tab.value}
                          onClick={() => setActiveTab(tab.value)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: isActive ? '2px solid #D4A843' : '2px solid transparent',
                            color: isActive ? '#D4A843' : '#9CA3AF',
                            fontFamily: 'ui-monospace',
                            fontSize: 12,
                            fontWeight: isActive ? 600 : 400,
                            padding: '10px 18px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'all 200ms',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tab.icon}
                          {tab.label}
                          {tab.count !== undefined && (
                            <span style={{ background: 'rgba(212,168,67,0.1)', color: '#D4A843', borderRadius: 10, padding: '2px 8px', fontSize: 10, fontFamily: 'ui-monospace', fontWeight: 600 }}>{tab.count}</span>
                          )}
                          {tab.alert && (
                            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <AlertTriangle style={{ width: 10, height: 10 }} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <TabsList className="hidden">
                    <TabsTrigger value="devis" />
                    <TabsTrigger value="bc" />
                    <TabsTrigger value="factures" />
                    <TabsTrigger value="calendar" />
                  </TabsList>

                  <TabsContent value="devis" className="space-y-4">
                    <BulkActionsToolbar
                      selectedCount={selectedDevisIds.length} type="devis"
                      onMarkRefused={async () => {
                        for (const id of selectedDevisIds) {
                          await supabase.from('devis').update({ statut: 'refuse' }).eq('id', id);
                        }
                        await fetchData();
                      }}
                      onExportCSV={() => exportDevisToCSV(filteredDevis, selectedDevisIds)}
                      onClearSelection={() => setSelectedDevisIds([])}
                    />
                    <div className="flex justify-end">
                      <BulkScorerButton devisList={filteredDevis} onDone={fetchData} />
                    </div>
                    <Card className="bg-transparent" style={{ borderTop: '2px solid #D4A843' }}>
                      <CardContent className="pt-6">
                        <DevisTableResponsive
                          devisList={filteredDevis} loading={loading}
                          onConvert={openConvertDialog}
                          onRowClick={(devis) => { setSelectedDevis(devis); setDevisDetailOpen(true); }}
                          getExpirationInfo={getExpirationInfo}
                          selectedIds={selectedDevisIds} onSelectionChange={setSelectedDevisIds}
                          onRefresh={fetchData}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="bc" className="space-y-4">
                    <BulkActionsToolbar
                      selectedCount={selectedBcIds.length} type="bc"
                      onCancel={async () => {
                        for (const id of selectedBcIds) {
                          await supabase.from('bons_commande').update({ statut: 'annule' }).eq('id', id);
                        }
                        await fetchData();
                      }}
                      onExportCSV={() => exportBcToCSV(filteredBc, selectedBcIds)}
                      onClearSelection={() => setSelectedBcIds([])}
                    />
                    <Card>
                      <CardContent className="pt-6">
                        <BcTableResponsive
                          bcList={filteredBc} loading={loading}
                          onRowClick={handleOpenBcDetail}
                          onCreateBL={(bc) => console.log('Create BL for:', bc)}
                          onGenerateInvoice={(bc) => generateConsolidatedInvoice(bc.bc_id)}
                          selectedIds={selectedBcIds} onSelectionChange={setSelectedBcIds}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="factures" className="space-y-4">
                    <Card><CardContent className="pt-6"><FacturesTable /></CardContent></Card>
                  </TabsContent>

                  <TabsContent value="calendar">
                    <OrderCalendarView bcList={filteredBc} onSelectBc={handleOpenBcDetail} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB: ANALYTIQUE
              ══════════════════════════════════════════════════════ */}
          {mainTab === 'analytics' && (
            <div style={{ animation: 'fade-in 200ms ease-out' }} className="space-y-6">
              <SalesPerformanceCharts bcList={bcList} devisList={devisList} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB: INTELLIGENCE IA
              ══════════════════════════════════════════════════════ */}
          {mainTab === 'intelligence' && (
            <div style={{ animation: 'fade-in 200ms ease-out' }} className="space-y-6">
              <MarginOverviewCard />
              <PipelineAnalysisCard />
              <ConversionPredictorCard />
            </div>
          )}

        </div>

        {/* ── All Dialogs (persist across tabs) ── */}
        <ConvertToBcDialog
          open={convertDialogOpen} onOpenChange={setConvertDialogOpen}
          selectedDevis={selectedDevis} converting={converting} onConvert={handleConvertToBc}
          deliveryDate={deliveryDate} setDeliveryDate={setDeliveryDate}
          deliveryTime={deliveryTime} setDeliveryTime={setDeliveryTime}
          deliveryAddress={deliveryAddress} setDeliveryAddress={setDeliveryAddress}
          contactChantier={contactChantier} setContactChantier={setContactChantier}
          telephoneChantier={telephoneChantier} setTelephoneChantier={setTelephoneChantier}
          referenceClient={referenceClient} setReferenceClient={setReferenceClient}
          conditionsAcces={conditionsAcces} setConditionsAcces={setConditionsAcces}
          pompeRequise={pompeRequise} setPompeRequise={setPompeRequise}
          typePompe={typePompe} setTypePompe={setTypePompe}
          notes={notes} setNotes={setNotes}
          selectedZoneId={selectedZoneId} setSelectedZoneId={setSelectedZoneId}
          modePaiement={modePaiement} setModePaiement={setModePaiement}
          selectedPrestataireId={selectedPrestataireId} setSelectedPrestataireId={setSelectedPrestataireId}
          zones={zones} prestataires={prestataires}
        />

        <DirectOrderDialog
          open={directOrderOpen} onOpenChange={setDirectOrderOpen}
          creatingOrder={creatingOrder} onCreateOrder={handleCreateDirectOrder}
          onCancel={handleCancelDirectOrder}
          onClientCreated={(clientId, clientName) => {
            supabase.from('clients').select('client_id, nom_client, adresse, telephone').order('nom_client')
              .then(({ data }) => { if (data) setClients(data); });
          }}
          orderClientId={orderClientId} onClientSelect={handleClientSelect}
          orderFormuleId={orderFormuleId} setOrderFormuleId={setOrderFormuleId}
          orderVolume={orderVolume} setOrderVolume={setOrderVolume}
          orderPrix={orderPrix} setOrderPrix={setOrderPrix}
          deliveryDate={deliveryDate} setDeliveryDate={setDeliveryDate}
          deliveryTime={deliveryTime} setDeliveryTime={setDeliveryTime}
          deliveryAddress={deliveryAddress} setDeliveryAddress={setDeliveryAddress}
          contactChantier={contactChantier} setContactChantier={setContactChantier}
          telephoneChantier={telephoneChantier} setTelephoneChantier={setTelephoneChantier}
          referenceClient={referenceClient} setReferenceClient={setReferenceClient}
          conditionsAcces={conditionsAcces} setConditionsAcces={setConditionsAcces}
          pompeRequise={pompeRequise} setPompeRequise={setPompeRequise}
          typePompe={typePompe} setTypePompe={setTypePompe}
          notes={notes} setNotes={setNotes}
          selectedZoneId={selectedZoneId} setSelectedZoneId={setSelectedZoneId}
          modePaiement={modePaiement} setModePaiement={setModePaiement}
          selectedPrestataireId={selectedPrestataireId} setSelectedPrestataireId={setSelectedPrestataireId}
          autoLaunchProduction={autoLaunchProduction} setAutoLaunchProduction={setAutoLaunchProduction}
          clients={clients} formules={formules} zones={zones} prestataires={prestataires}
        />

        <DevisDetailDialog devis={selectedDevis} open={devisDetailOpen} onOpenChange={setDevisDetailOpen} onConvert={openConvertDialog} />
        <BcDetailDialog bc={selectedBc} open={bcDetailOpen} onOpenChange={setBcDetailOpen} onAddDelivery={handleAddDeliveryFromDialog} onGenerateInvoice={generateConsolidatedInvoice} onRefresh={fetchData} />
        <AddDeliveryDialog bc={addDeliveryBc} open={addDeliveryOpen} onOpenChange={setAddDeliveryOpen} onCreateDelivery={handleCreateDelivery} onRefresh={fetchData} />
        <BatchReminderDialog open={batchReminderOpen} onOpenChange={setBatchReminderOpen} devisList={devisList} onSuccess={fetchData} />
        <EmergencyBcDialog
          open={emergencyBcOpen} onOpenChange={setEmergencyBcOpen}
          clients={clients.map(c => ({ ...c, credit_bloque: false }))} formules={formules} zones={zones} prestataires={prestataires}
          onSuccess={(bcId, isEmergency) => {
            fetchData();
            if (isEmergency) navigate(`/planning?date=${format(new Date(), 'yyyy-MM-dd')}&focus=pending`);
          }}
        />
      </MainLayout>
    </TooltipProvider>
  );
}
