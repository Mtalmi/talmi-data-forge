import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addHours, parseISO, isWithinInterval, differenceInMinutes, startOfMonth, endOfMonth } from 'date-fns';

import { 
  Clock, 
  Truck, 
  AlertTriangle, 
  Factory, 
  Navigation, 
  RefreshCw,
  Calendar,
  Package,
  Users,
  Timer,
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BellRing,
  ExternalLink,
  Eye,
  Receipt,
  Phone,
  Lock,
  Shield,
  Crosshair
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useDeviceType } from '@/hooks/useDeviceType';
import { usePendingBLCount } from '@/hooks/usePendingBLCount';
import { TabletPlanningView } from '@/components/planning/TabletPlanningView';
import { PlanningCalendarHeader } from '@/components/planning/PlanningCalendarHeader';
import { DailyPlanningReport } from '@/components/planning/DailyPlanningReport';
import { DailyTimeline } from '@/components/planning/DailyTimeline';
import { FleetCapacityOptimizer } from '@/components/planning/FleetCapacityOptimizer';
import { PerformanceKPIs } from '@/components/planning/PerformanceKPIs';
import { BulkConfirmAction } from '@/components/planning/BulkConfirmAction';
import { DriverQuickContact } from '@/components/planning/DriverQuickContact';
import { ETATracker } from '@/components/planning/ETATracker';
import { SmartTruckAssignment } from '@/components/planning/SmartTruckAssignment';
import { CommandCenterSection } from '@/components/planning/CommandCenterSection';
import { DeliveryRotationProgress } from '@/components/planning/DeliveryRotationProgress';
import { SmartInvoiceDialog } from '@/components/planning/SmartInvoiceDialog';
import { FleetPanel } from '@/components/planning/FleetPanel';
import { DispatcherProxyControls } from '@/components/planning/DispatcherProxyControls';
import { CeoApprovalCodeDialog } from '@/components/planning/CeoApprovalCodeDialog';
import { CeoCodeRequestDialog } from '@/components/planning/CeoCodeRequestDialog';
import { formatTimeHHmm, normalizeTimeHHmm, timeToMinutes } from '@/lib/time';
import { buildProductionUrl } from '@/lib/workflowStatus';
import { useAuth } from '@/hooks/useAuth';
import { MidnightJustificationDialog, useNightModeCheck } from '@/components/security/MidnightJustificationDialog';

interface BonLivraison {
  bl_id: string;
  bc_id: string | null;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  workflow_status: string;
  heure_prevue: string | null;
  camion_assigne: string | null;
  toupie_assignee: string | null;
  date_livraison: string;
  heure_depart_centrale: string | null;
  heure_arrivee_chantier: string | null;
  heure_retour_centrale: string | null;
  temps_rotation_minutes: number | null;
  temps_attente_chantier_minutes: number | null;
  facturer_attente: boolean | null;
  prix_vente_m3: number | null;
  cur_reel: number | null;
  marge_brute_pct: number | null;
  prix_livraison_m3: number | null;
  facture_generee: boolean | null;
  created_at: string;
  // Logistics fields
  zone_livraison_id: string | null;
  mode_paiement: string | null;
  prestataire_id: string | null;
  clients?: { nom_client: string } | null;
  zones_livraison?: { nom_zone: string; code_zone: string } | null;
}

interface Camion {
  id_camion: string;
  immatriculation: string | null;
  chauffeur: string | null;
  statut: string;
  capacite_m3: number | null;
  telephone_chauffeur?: string | null;
}

export default function Planning() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const { isMobile, isTablet, isTouchDevice } = useDeviceType();
  const { isDirecteurOperations, isCeo, isAgentAdministratif, isSuperviseur, user, canEditPlanning, canOverrideCreditBlock, role } = useAuth();
  const { count: pendingBLCount, earliestDate: pendingEarliestDate } = usePendingBLCount();
  const [bons, setBons] = useState<BonLivraison[]>([]);
  const [camions, setCamions] = useState<Camion[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const pendingValidationRef = useRef<HTMLDivElement>(null);
  const [focusPending, setFocusPending] = useState(() => searchParams.get('focus') === 'pending');
  const [monthlyDeliveryData, setMonthlyDeliveryData] = useState<{
    date: string;
    totalVolume: number;
    count: number;
    statuses: { planification: number; production: number; livre: number };
  }[]>([]);
  
  // Directeur Opérations is READ-ONLY on Planning board
  const isReadOnly = isDirecteurOperations && !isCeo && !isAgentAdministratif;
  
  // Midnight Protocol
  const isNightMode = useNightModeCheck();
  const [midnightDialogOpen, setMidnightDialogOpen] = useState(false);
  const [pendingNightBon, setPendingNightBon] = useState<BonLivraison | null>(null);
  const [midnightLoading, setMidnightLoading] = useState(false);
  
  // CEO Approval Dialog State
  const [ceoApprovalOpen, setCeoApprovalOpen] = useState(false);
  const [pendingCreditApproval, setPendingCreditApproval] = useState<{
    bon: BonLivraison;
    clientName: string;
    solde: number;
    limite: number;
  } | null>(null);
  
  // Client credit data cache for checking limits (now includes overdue invoice status)
  const [clientCreditData, setClientCreditData] = useState<Record<string, {
    nom_client: string;
    solde_du: number;
    limite_credit_dh: number;
    credit_bloque: boolean;
    has_overdue_invoice: boolean;
  }>>({});

  // CEO Code Request Dialog State
  const [ceoCodeDialogOpen, setCeoCodeDialogOpen] = useState(false);
  const [ceoCodeRequestData, setCeoCodeRequestData] = useState<{
    blId: string;
    clientId: string;
    clientName: string;
    solde: number;
    limite: number;
  } | null>(null);
  // Initialize date: always default to today unless explicit date param provided
  const todayFormatted = format(new Date(), 'yyyy-MM-dd');
  const urlDate = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState(urlDate || todayFormatted);

  // If user navigated to /planning?focus=pending (e.g. by clicking the sidebar badge),
  // jump to the earliest pending date and scroll to the "À Confirmer" section.
  useEffect(() => {
    if (searchParams.get('focus') === 'pending') {
      setFocusPending(true);
    }
    // Reset to today if no date param and not focusing pending
    if (!urlDate && !searchParams.get('focus')) {
      setSelectedDate(todayFormatted);
    }
  }, [searchParams, urlDate, todayFormatted]);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch BLs for the selected date
      const { data: blData, error: blError } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id,
          bc_id,
          client_id,
          formule_id,
          volume_m3,
          workflow_status,
          heure_prevue,
          camion_assigne,
          toupie_assignee,
          date_livraison,
          heure_depart_centrale,
          heure_arrivee_chantier,
          heure_retour_centrale,
          temps_rotation_minutes,
          temps_attente_chantier_minutes,
          facturer_attente,
          prix_vente_m3,
          cur_reel,
          marge_brute_pct,
          prix_livraison_m3,
          facture_generee,
          created_at,
          zone_livraison_id,
          mode_paiement,
          prestataire_id,
          clients(nom_client),
          zones_livraison(nom_zone, code_zone)
        `)
        .eq('date_livraison', selectedDate)
        .order('heure_prevue', { ascending: true, nullsFirst: false });

      if (blError) throw blError;
      setBons((blData || []) as BonLivraison[]);

      // Fetch available trucks
      const { data: camionData, error: camionError } = await supabase
        .from('flotte')
        .select('id_camion, immatriculation, chauffeur, statut, capacite_m3, telephone_chauffeur')
        .eq('type', 'Toupie')
        .order('id_camion');

      if (camionError) throw camionError;
      setCamions(camionData || []);

      // Fetch client credit data for credit limit checks (including overdue invoice status)
      const uniqueClientIds = [...new Set((blData || []).map(bl => bl.client_id))];
      if (uniqueClientIds.length > 0) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('client_id, nom_client, solde_du, limite_credit_dh, credit_bloque')
          .in('client_id', uniqueClientIds);
        
        // Check for overdue invoices per client
        const { data: overdueData } = await supabase
          .from('factures')
          .select('client_id')
          .in('client_id', uniqueClientIds)
          .eq('statut', 'emise')
          .lt('date_facture', format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
        
        const overdueClients = new Set((overdueData || []).map(f => f.client_id));
        
        if (clientData) {
          const creditMap: Record<string, any> = {};
          clientData.forEach(c => {
            creditMap[c.client_id] = {
              nom_client: c.nom_client,
              solde_du: c.solde_du || 0,
              limite_credit_dh: c.limite_credit_dh || 50000,
              credit_bloque: c.credit_bloque || false,
              has_overdue_invoice: overdueClients.has(c.client_id),
            };
          });
          setClientCreditData(creditMap);
        }
      }

    } catch (error) {
      console.error('Error fetching planning data:', error);
      toast.error(t.pages.production.loadingError);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Initial fetch and when date changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime sync with Production page - listen for workflow changes
  useEffect(() => {
    const channel = supabase
      .channel('planning-production-sync')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'bons_livraison_reels',
          filter: `date_livraison=eq.${selectedDate}`
        },
        (payload) => {
          // Debounce the refetch slightly to batch rapid updates
          setTimeout(() => fetchData(), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, fetchData]);

  // Auto-refresh every 30 seconds for live dispatch (reduced from 15s since we have realtime)
  useEffect(() => {
    const autoRefreshInterval = setInterval(fetchData, 30000);
    return () => clearInterval(autoRefreshInterval);
  }, [fetchData]);

  // Fetch monthly summary for calendar
  const fetchMonthlyData = useCallback(async () => {
    try {
      const currentDate = parseISO(selectedDate);
      const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('bons_livraison_reels')
        .select('date_livraison, volume_m3, workflow_status')
        .gte('date_livraison', monthStart)
        .lte('date_livraison', monthEnd);

      if (error) throw error;

      // Aggregate by date
      const aggregated = new Map<string, {
        totalVolume: number;
        count: number;
        statuses: { planification: number; production: number; livre: number };
      }>();

      (data || []).forEach(bl => {
        const dateKey = bl.date_livraison;
        const existing = aggregated.get(dateKey) || {
          totalVolume: 0,
          count: 0,
          statuses: { planification: 0, production: 0, livre: 0 }
        };

        existing.totalVolume += bl.volume_m3 || 0;
        existing.count += 1;

        if (['planification', 'validation_technique'].includes(bl.workflow_status)) {
          existing.statuses.planification += 1;
        } else if (['production', 'en_livraison'].includes(bl.workflow_status)) {
          existing.statuses.production += 1;
        } else if (['livre', 'facture'].includes(bl.workflow_status)) {
          existing.statuses.livre += 1;
        }

        aggregated.set(dateKey, existing);
      });

      setMonthlyDeliveryData(
        Array.from(aggregated.entries()).map(([date, data]) => ({
          date,
          ...data
        }))
      );
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  // State for pending validation section
  const [pendingValidationOpen, setPendingValidationOpen] = useState(true);
  
  // State for smart invoice dialog
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedDeliveryForInvoice, setSelectedDeliveryForInvoice] = useState<BonLivraison | null>(null);
  // Categorize BLs for the dispatch board - NOW EXCLUDES pending validation BLs from main board
  const { pendingValidation, aProduire, enChargement, enLivraison, aFacturer, facturesAujourdhui, conflicts } = useMemo(() => {
    const now = new Date();
    const in2Hours = addHours(now, 2);
    
    const pendingValidation: BonLivraison[] = [];
    const aProduire: BonLivraison[] = [];
    const enChargement: BonLivraison[] = [];
    const enLivraison: BonLivraison[] = [];
    const aFacturer: BonLivraison[] = []; // Delivered but not invoiced
    const facturesAujourdhui: BonLivraison[] = []; // Invoiced
    const scheduledTimes: { bl: BonLivraison; time: Date }[] = [];

    bons.forEach(bon => {
      // NEW: Pending validation goes to separate section
      if (bon.workflow_status === 'en_attente_validation') {
        pendingValidation.push(bon);
      } else if (['production', 'validation_technique'].includes(bon.workflow_status)) {
        // Both production and validation_technique go to "En Chargement"
        enChargement.push(bon);
      } else if (bon.workflow_status === 'en_livraison') {
        enLivraison.push(bon);
      } else if (bon.workflow_status === 'livre') {
        // Delivered but NOT yet invoiced - needs attention
        aFacturer.push(bon);
      } else if (bon.workflow_status === 'facture') {
        // Invoiced - can be archived
        facturesAujourdhui.push(bon);
      } else if (bon.workflow_status === 'planification') {
        // Only planification goes to À Produire (ready to start production)
        if (bon.heure_prevue) {
          const hhmm = formatTimeHHmm(bon.heure_prevue);
          if (!hhmm) {
            aProduire.push(bon);
            return;
          }
          const [hours, minutes] = hhmm.split(':').map(Number);
          const scheduledTime = new Date(selectedDate);
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          if (isWithinInterval(scheduledTime, { start: now, end: in2Hours }) || scheduledTime < now) {
            aProduire.push(bon);
          }
          scheduledTimes.push({ bl: bon, time: scheduledTime });
        } else {
          aProduire.push(bon); // No time = needs attention
        }
      }
    });

    // Detect scheduling conflicts (within 15 minutes)
    const conflicts: { bl1: BonLivraison; bl2: BonLivraison }[] = [];
    for (let i = 0; i < scheduledTimes.length; i++) {
      for (let j = i + 1; j < scheduledTimes.length; j++) {
        const diff = Math.abs(differenceInMinutes(scheduledTimes[i].time, scheduledTimes[j].time));
        if (diff < 15) {
          conflicts.push({ bl1: scheduledTimes[i].bl, bl2: scheduledTimes[j].bl });
        }
      }
    }

    return { pendingValidation, aProduire, enChargement, enLivraison, aFacturer, facturesAujourdhui, conflicts };
  }, [bons, selectedDate]);

  // Focus pending effect - must be after useMemo that defines pendingValidation
  useEffect(() => {
    if (!focusPending) return;
    if (!pendingEarliestDate || pendingBLCount <= 0) return;

    // Step 1: switch date first
    if (selectedDate !== pendingEarliestDate) {
      setSelectedDate(pendingEarliestDate);
      return;
    }

    // Step 2: after data for that date is loaded and there is pending, expand + scroll
    if (!loading && pendingValidation.length > 0) {
      setPendingValidationOpen(true);
      setTimeout(() => {
        pendingValidationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      setFocusPending(false);
    }
  }, [focusPending, pendingEarliestDate, pendingBLCount, selectedDate, pendingValidation.length, loading]);

  const updateBonTime = async (blId: string, time: string) => {
    // Block if read-only
    if (isReadOnly) {
      toast.error(t.pages.planning.readOnlyError);
      return;
    }
    
    try {
      const trimmed = (time || '').trim();
      const normalized = trimmed ? normalizeTimeHHmm(trimmed) : null;
      if (trimmed && !normalized) {
        toast.error(t.pages.planning.invalidTime);
        return;
      }
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ heure_prevue: normalized })
        .eq('bl_id', blId);

      if (error) throw error;
      
      // Log the action
      await logPlanningAction('UPDATE_TIME', blId, {
        action: 'Updated delivery time',
        new_time: normalized,
        scheduled_by: user?.email,
        timestamp: new Date().toISOString(),
      });
      
      toast.success(t.pages.planning.timeUpdated);
      fetchData();
    } catch (error) {
      console.error('Error updating time:', error);
      toast.error(t.pages.planning.updateError);
    }
  };

  const assignTruck = async (blId: string, camionId: string) => {
    // Block if read-only
    if (isReadOnly) {
      toast.error(t.pages.planning.readOnlyAssign);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ 
          camion_assigne: camionId || null,
          toupie_assignee: camionId || null 
        })
        .eq('bl_id', blId);

      if (error) throw error;
      
      // Log the action
      await logPlanningAction('ASSIGN_TRUCK', blId, {
        action: 'Assigned truck',
        camion_id: camionId,
        assigned_by: user?.email,
        timestamp: new Date().toISOString(),
      });
      
      toast.success(t.pages.planning.truckAssigned);
      fetchData();
    } catch (error) {
      console.error('Error assigning truck:', error);
      toast.error(t.pages.planning.assignError);
    }
  };

  // Start production: advance to 'production' status and navigate to Production page
  const executeStartProduction = async (bon: BonLivraison, nightJustification?: string) => {
    try {
      // Update workflow status to production
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ 
          workflow_status: 'production',
          heure_depart_centrale: new Date().toISOString()
        })
        .eq('bl_id', bon.bl_id);

      if (error) throw error;
      
      // Log the action (with night justification if applicable)
      await logPlanningAction('START_PRODUCTION', bon.bl_id, {
        action: 'Started production',
        client_id: bon.client_id,
        volume_m3: bon.volume_m3,
        started_by: user?.email,
        timestamp: new Date().toISOString(),
        ...(nightJustification && { 
          midnight_protocol: true, 
          justification_urgence: nightJustification 
        }),
      });

      // If night mode, also create a system alert for CEO War Room
      if (nightJustification) {
        await supabase.from('alertes_systeme').insert({
          type_alerte: 'midnight_production',
          niveau: 'critical',
          titre: t.pages.planning.nightProductionAlert,
          message: `BL ${bon.bl_id} lancé en production hors horaires par ${user?.email}. Justification: ${nightJustification}`,
          reference_id: bon.bl_id,
          reference_table: 'bons_livraison_reels',
        });
      }
      
      toast.success(t.pages.planning.productionLaunched);
      navigate(buildProductionUrl(bon.bl_id, parseISO(selectedDate)));
    } catch (error) {
      console.error('Error starting production:', error);
      toast.error(t.pages.planning.launchError);
    }
  };

  const startProduction = async (bon: BonLivraison) => {
    // Block if read-only
    if (isReadOnly) {
      toast.error(t.pages.planning.readOnlyLaunch);
      return;
    }
    
    // Midnight Protocol: require justification during off-hours
    if (isNightMode) {
      setPendingNightBon(bon);
      setMidnightDialogOpen(true);
      return;
    }
    
    await executeStartProduction(bon);
  };

  // View in production center without starting - preserves date context
  const viewInProduction = (bon: BonLivraison) => {
    navigate(buildProductionUrl(bon.bl_id, parseISO(selectedDate)));
  };

  // Check if client is over credit limit
  const checkClientCreditLimit = (clientId: string): { exceeded: boolean; clientName: string; solde: number; limite: number } | null => {
    const creditInfo = clientCreditData[clientId];
    if (!creditInfo) return null;
    
    const solde = creditInfo.solde_du;
    const limite = creditInfo.limite_credit_dh;
    
    if (creditInfo.credit_bloque || solde > limite) {
      return {
        exceeded: true,
        clientName: creditInfo.nom_client,
        solde,
        limite,
      };
    }
    return null;
  };

  // Determine current user role for audit tagging
  const getCurrentRole = (): string => {
    if (isCeo) return 'ceo';
    if (isAgentAdministratif) return 'agent_administratif';
    if (isDirecteurOperations) return 'directeur_operations';
    if (isSuperviseur) return 'superviseur';
    return role || 'unknown';
  };

  // Log planning action for audit trail with role tagging
  const logPlanningAction = async (action: string, blId: string, details?: Record<string, any>) => {
    try {
      const userRole = getCurrentRole();
      await supabase.from('audit_superviseur').insert({
        user_id: user?.id,
        user_name: user?.email,
        table_name: 'bons_livraison_reels',
        record_id: blId,
        action: action,
        new_data: {
          ...details,
          created_by_role: userRole,
          user_role: userRole,
        },
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Get credit status for visual indicator
  const getClientCreditStatus = (clientId: string): 'green' | 'red' | 'blocked' => {
    const creditInfo = clientCreditData[clientId];
    if (!creditInfo) return 'green';
    if (creditInfo.credit_bloque) return 'blocked';
    if (creditInfo.has_overdue_invoice || creditInfo.solde_du > creditInfo.limite_credit_dh) return 'red';
    return 'green';
  };

  // Confirm a pending BL - moves to planification status
  // Read-only users (Directeur Opérations) cannot perform this action
  const confirmBl = async (bon: BonLivraison) => {
    // Block if read-only
    if (isReadOnly) {
      toast.error(t.pages.planning.readOnlyPlan);
      return;
    }

    // Check credit status
    const creditStatus = getClientCreditStatus(bon.client_id);
    const creditInfo = clientCreditData[bon.client_id];
    
    // If client has issues, only Agent Admin or CEO can override
    if (creditStatus !== 'green' && !canOverrideCreditBlock) {
      setPendingCreditApproval({
        bon,
        clientName: creditInfo?.nom_client || bon.client_id,
        solde: creditInfo?.solde_du || 0,
        limite: creditInfo?.limite_credit_dh || 50000,
      });
      setCeoApprovalOpen(true);
      return;
    }
    
    // Proceed with confirmation
    await executeConfirmBl(bon);
  };

  // Execute the actual BL confirmation with logging
  const executeConfirmBl = async (bon: BonLivraison) => {
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ workflow_status: 'planification' })
        .eq('bl_id', bon.bl_id);

      if (error) throw error;
      
      // Log the action with user signature
      await logPlanningAction('CONFIRM_BL', bon.bl_id, {
        action: 'Confirmed delivery',
        client_id: bon.client_id,
        volume_m3: bon.volume_m3,
        scheduled_by: user?.email,
        timestamp: new Date().toISOString(),
      });
      
      toast.success(`${bon.bl_id} ${t.pages.planning.confirmed}`);
      fetchData();
    } catch (error) {
      console.error('Error confirming BL:', error);
      toast.error(t.pages.planning.confirmError);
    }
  };

  // Handle CEO/Agent Admin approval callback
  const handleCeoApprovalSuccess = async () => {
    if (pendingCreditApproval) {
      // Log the override
      await logPlanningAction('CREDIT_OVERRIDE', pendingCreditApproval.bon.bl_id, {
        action: 'Credit limit override approved',
        client_id: pendingCreditApproval.bon.client_id,
        solde: pendingCreditApproval.solde,
        limite: pendingCreditApproval.limite,
        approved_by: user?.email,
        timestamp: new Date().toISOString(),
      });
      
      await executeConfirmBl(pendingCreditApproval.bon);
      setPendingCreditApproval(null);
    }
  };

  // Reject a pending BL - cancels it and reverts BC
  const rejectBl = async (bon: BonLivraison) => {
    try {
      // Delete the BL
      const { error: deleteError } = await supabase
        .from('bons_livraison_reels')
        .delete()
        .eq('bl_id', bon.bl_id);

      if (deleteError) throw deleteError;

      // If there's a BC linked, revert the volume
      if (bon.bc_id) {
        const { data: bc } = await supabase
          .from('bons_commande')
          .select('volume_livre, volume_m3, nb_livraisons')
          .eq('bc_id', bon.bc_id)
          .single();

        if (bc) {
          const newVolumeLivre = Math.max(0, (bc.volume_livre || 0) - bon.volume_m3);
          await supabase
            .from('bons_commande')
            .update({
              volume_livre: newVolumeLivre,
              volume_restant: bc.volume_m3 - newVolumeLivre,
              nb_livraisons: Math.max(0, (bc.nb_livraisons || 1) - 1),
              statut: 'pret_production'
            })
            .eq('bc_id', bon.bc_id);
        }
      }

      toast.success(`${bon.bl_id} ${t.pages.planning.rejected}`);
      fetchData();
    } catch (error) {
      console.error('Error rejecting BL:', error);
      toast.error(t.pages.planning.rejectError);
    }
  };

  const confirmAllPending = async (blIds: string[]) => {
    try {
      for (const blId of blIds) {
        await supabase
          .from('bons_livraison_reels')
          .update({ workflow_status: 'planification' })
          .eq('bl_id', blId);
      }
      fetchData();
    } catch (error) {
      console.error('Error confirming all:', error);
      throw error;
    }
  };

  // Premium status badge with gradient styling
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      en_attente_validation: { 
        label: t.pages.planning.statusToConfirm, 
        variant: 'outline', 
        className: 'border-amber-400/60 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30' 
      },
      planification: { 
        label: t.pages.planning.statusToStart, 
        variant: 'outline', 
        className: 'border-blue-400/60 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30' 
      },
      production: { 
        label: t.pages.planning.statusLoading, 
        variant: 'secondary', 
        className: 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-700 dark:text-violet-300 border border-violet-400/30' 
      },
      validation_technique: { 
        label: t.pages.planning.statusToValidate, 
        variant: 'secondary', 
        className: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30' 
      },
      en_livraison: { 
        label: t.pages.planning.statusEnRoute, 
        variant: 'default', 
        className: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 border-0' 
      },
      livre: { 
        label: t.pages.planning.statusDelivered, 
        variant: 'default', 
        className: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 border-0' 
      },
      facture: { 
        label: t.pages.planning.statusInvoiced, 
        variant: 'default', 
        className: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-600/25 border-0' 
      },
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant} className={cn("font-medium", config.className)}>{config.label}</Badge>;
  };

  const BonCard = ({ bon, showTimeInput = false }: { bon: BonLivraison; showTimeInput?: boolean }) => {
    const [timeDraft, setTimeDraft] = useState(() => formatTimeHHmm(bon.heure_prevue) || '');
    const creditStatus = getClientCreditStatus(bon.client_id);

    useEffect(() => {
      setTimeDraft(formatTimeHHmm(bon.heure_prevue) || '');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bon.heure_prevue]);

    const commitTime = async () => {
      const trimmed = timeDraft.trim();
      if (!trimmed) {
        await updateBonTime(bon.bl_id, '');
        return;
      }
      const normalized = normalizeTimeHHmm(trimmed);
      if (!normalized) {
        toast.error(t.pages.planning.invalidTime);
        setTimeDraft(formatTimeHHmm(bon.heure_prevue) || '');
        return;
      }
      if (normalized !== (formatTimeHHmm(bon.heure_prevue) || '')) {
        await updateBonTime(bon.bl_id, normalized);
      }
    };

    // Get dynamic border color based on status
    const getBorderColor = (status: string) => {
      const colors: Record<string, string> = {
        en_attente_validation: 'border-l-amber-400',
        planification: 'border-l-blue-400',
        production: 'border-l-violet-500',
        validation_technique: 'border-l-amber-500',
        en_livraison: 'border-l-rose-500',
        livre: 'border-l-emerald-500',
        facture: 'border-l-emerald-600',
      };
      return colors[status] || 'border-l-primary/50';
    };

    // Credit status indicator component
    const CreditIndicator = () => {
      if (creditStatus === 'green') {
        return (
          <div className="flex items-center gap-1" title={t.pages.planning.clientOk}>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          </div>
        );
      } else if (creditStatus === 'blocked') {
        return (
          <div className="flex items-center gap-1" title={t.pages.planning.clientBlocked}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm shadow-red-600/50 animate-pulse" />
            <span className="text-[10px] text-red-500 font-medium">{t.pages.planning.blocked}</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-1" title={t.pages.planning.unpaidInvoices}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-[10px] text-red-400 font-medium">{t.pages.planning.unpaid}</span>
          </div>
        );
      }
    };

    return (
      <Card
        data-testid={`planning-bon-card-${bon.bl_id}`}
        className={cn(
          "mb-3 border-l-4 hover:shadow-lg hover:shadow-black/5 transition-all duration-200 bg-card/80 backdrop-blur-sm",
          getBorderColor(bon.workflow_status),
          isTouchDevice && "active:scale-[0.98]",
          // Add red ring for credit issues
          creditStatus !== 'green' && "ring-1 ring-red-500/30"
        )}
      >
        <CardContent className={cn("p-4", isTouchDevice && "p-5")}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {/* Credit Status Indicator - Red/Green Light */}
            <CreditIndicator />
            <div>
              <p className={cn("font-semibold", isTouchDevice ? "text-base" : "text-sm")}>{bon.bl_id}</p>
              <p className={cn("text-muted-foreground", isTouchDevice ? "text-sm" : "text-xs")}>
                {bon.clients?.nom_client || bon.client_id}
              </p>
            </div>
          </div>
          {getStatusBadge(bon.workflow_status)}
        </div>
        
        <div className={cn("grid grid-cols-2 gap-2 mb-3", isTouchDevice ? "text-sm" : "text-xs")}>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Package className={cn(isTouchDevice ? "h-4 w-4" : "h-3 w-3")} />
            <span>{bon.formule_id}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Factory className={cn(isTouchDevice ? "h-4 w-4" : "h-3 w-3")} />
            <span className="font-semibold">{bon.volume_m3} m³</span>
          </div>
          {bon.zones_livraison && (
            <div className="flex items-center gap-1 text-muted-foreground col-span-2">
              <Navigation className={cn(isTouchDevice ? "h-4 w-4" : "h-3 w-3")} />
              <span>Zone {bon.zones_livraison.code_zone}: {bon.zones_livraison.nom_zone}</span>
            </div>
          )}
        </div>

        {showTimeInput && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="HH:mm"
                value={timeDraft}
                onChange={(e) => setTimeDraft(e.target.value)}
                onBlur={commitTime}
                className={cn("text-sm", isTouchDevice ? "h-11 text-base" : "h-8")}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={bon.camion_assigne || bon.toupie_assignee || 'none'}
                  onValueChange={(value) => assignTruck(bon.bl_id, value === 'none' ? '' : value)}
                >
                  <SelectTrigger className={cn("text-sm", isTouchDevice ? "h-11 text-base" : "h-8")}>
                    <SelectValue placeholder={t.pages.planning.assignTruckPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="none">{t.pages.planning.notAssigned}</SelectItem>
                    {camions.map(c => {
                      const isCurrentlyAssigned = c.id_camion === (bon.camion_assigne || bon.toupie_assignee);
                      const isAvailable = c.statut === 'Disponible';
                      const isBlocked = !isAvailable && !isCurrentlyAssigned;
                      
                      // Determine reason for blocking
                       const blockReason = c.statut === 'En Livraison' 
                        ? t.pages.planning.onMission 
                        : c.statut === 'Maintenance' 
                          ? t.pages.planning.maintenanceLabel
                          : c.statut === 'Hors Service'
                            ? t.pages.planning.outOfService
                            : c.statut;

                      return (
                        <SelectItem 
                          key={c.id_camion} 
                          value={c.id_camion}
                          disabled={isBlocked}
                          className={cn(
                            isBlocked && "opacity-50 cursor-not-allowed",
                            isCurrentlyAssigned && "bg-primary/10 font-medium"
                          )}
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{c.id_camion} - {c.chauffeur || t.pages.planning.noDriver}</span>
                            {isBlocked && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {blockReason}
                              </span>
                            )}
                            {isAvailable && !isCurrentlyAssigned && (
                              <span className="text-xs text-emerald-600 ml-2">{t.pages.planning.availableShort}</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {/* Smart Truck Assignment */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
                    <Sparkles className="h-3 w-3" />
                    {t.pages.planning.smartSuggestion}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <SmartTruckAssignment
                    bon={bon}
                    camions={camions}
                    assignedTrucks={bons.filter(b => b.camion_assigne || b.toupie_assignee).map(b => b.camion_assigne || b.toupie_assignee || '')}
                    onAssign={(camionId) => assignTruck(bon.bl_id, camionId)}
                    currentAssignment={bon.camion_assigne || bon.toupie_assignee}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
            {/* Launch Production Button - CREDIT GATE LOGIC */}
            {bon.workflow_status === 'planification' && bon.heure_prevue && (bon.camion_assigne || bon.toupie_assignee) && (
              <div className="space-y-2 mt-2">
                {/* Credit Status Badge */}
                {creditStatus !== 'green' && (
                  <div className={cn(
                    "flex items-center gap-2 p-2 rounded-md text-xs",
                    creditStatus === 'blocked' 
                      ? "bg-red-500/10 border border-red-500/30 text-red-600" 
                      : "bg-amber-500/10 border border-amber-500/30 text-amber-600"
                  )}>
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                     <span>
                      {creditStatus === 'blocked' 
                        ? t.pages.planning.clientBlocked 
                        : t.pages.planning.unpaidInvoices}
                    </span>
                  </div>
                )}
                
                {/* Production Button - Disabled for Red status unless can override */}
                {creditStatus === 'green' || canOverrideCreditBlock ? (
                  <Button 
                    size={isTouchDevice ? "lg" : "sm"}
                    className={cn(
                      "w-full gap-2",
                      isTouchDevice && "min-h-[52px] text-base",
                      creditStatus !== 'green' && "bg-amber-600 hover:bg-amber-700"
                    )}
                    data-testid={`launch-production-${bon.bl_id}`}
                    onClick={() => {
                      if (creditStatus !== 'green') {
                        // Log the override action
                        logPlanningAction('CREDIT_OVERRIDE_PRODUCTION', bon.bl_id, {
                          action: 'Credit override for production start',
                          credit_status: creditStatus,
                          overridden_by: user?.email,
                          timestamp: new Date().toISOString(),
                        });
                      }
                      startProduction(bon);
                    }}
                  >
                    <Factory className={cn(isTouchDevice ? "h-5 w-5" : "h-4 w-4")} />
                    {creditStatus !== 'green' ? t.pages.planning.overrideAndLaunch : t.pages.planning.launchProduction}
                    <ArrowRight className={cn(isTouchDevice ? "h-5 w-5" : "h-4 w-4")} />
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      size={isTouchDevice ? "lg" : "sm"}
                      variant="outline"
                      disabled
                      className={cn(
                        "w-full gap-2 opacity-50 cursor-not-allowed border-red-500/30",
                        isTouchDevice && "min-h-[52px] text-base"
                      )}
                    >
                      <Lock className="h-4 w-4 text-red-500" />
                      {t.pages.planning.productionBlocked}
                    </Button>
                    {/* Request CEO Code Button - For non-override users */}
                    {isAgentAdministratif && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="w-full gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                        onClick={() => {
                          const creditInfo = clientCreditData[bon.client_id];
                          setCeoCodeRequestData({
                            blId: bon.bl_id,
                            clientId: bon.client_id,
                            clientName: creditInfo?.nom_client || bon.client_id,
                            solde: creditInfo?.solde_du || 0,
                            limite: creditInfo?.limite_credit_dh || 50000,
                          });
                          setCeoCodeDialogOpen(true);
                        }}
                      >
                        <Shield className="h-4 w-4" />
                        {t.pages.planning.requestCeoCode}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!showTimeInput && bon.heure_prevue && (
          <div className={cn(
            "flex items-center gap-2 text-muted-foreground mt-2",
            isTouchDevice ? "text-sm" : "text-xs"
          )}>
            <Timer className={cn(isTouchDevice ? "h-4 w-4" : "h-3 w-3")} />
            <span>{t.pages.planning.scheduled}: {formatTimeHHmm(bon.heure_prevue) || bon.heure_prevue}</span>
            {(bon.camion_assigne || bon.toupie_assignee) && (
              <>
                <span className="text-muted-foreground">•</span>
                <Truck className={cn(isTouchDevice ? "h-4 w-4" : "h-3 w-3")} />
                <span>{bon.camion_assigne || bon.toupie_assignee}</span>
              </>
            )}
          </div>
        )}

        {/* Quick Link to Production for items in production/validation */}
        {['production', 'validation_technique'].includes(bon.workflow_status) && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3 gap-2 border-violet-500/50 text-violet-600 hover:bg-violet-500/10"
            data-testid={`view-in-production-${bon.bl_id}`}
            onClick={() => viewInProduction(bon)}
          >
            <Eye className="h-4 w-4" />
            {t.pages.planning.viewInProduction}
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}

        {/* 🆕 PROXY DISPATCH BUTTON - Visible for En Chargement & En Livraison */}
        {['production', 'validation_technique', 'en_livraison'].includes(bon.workflow_status) && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                {t.pages.planning.manualControl}
              </span>
              <DispatcherProxyControls
                blId={bon.bl_id}
                heureDepart={bon.heure_depart_centrale ?? null}
                heureArrivee={bon.heure_arrivee_chantier ?? null}
                heureRetour={bon.heure_retour_centrale ?? null}
                workflowStatus={bon.workflow_status}
                clientName={bon.clients?.nom_client ?? 'Client'}
                camionId={bon.camion_assigne || bon.toupie_assignee || null}
                onUpdate={fetchData}
              />
            </div>
          </div>
        )}

        {/* 🆕 Rotation Progress Tracker for en_livraison status */}
        {bon.workflow_status === 'en_livraison' && (
          <div className="mt-2 space-y-2">
            <DeliveryRotationProgress
              heureDepart={bon.heure_depart_centrale}
              heureArrivee={bon.heure_arrivee_chantier}
              heureRetour={bon.heure_retour_centrale}
              workflowStatus={bon.workflow_status}
            />
            <ETATracker 
              departureTime={bon.heure_depart_centrale}
              scheduledTime={bon.heure_prevue}
              zoneCode={bon.zones_livraison?.code_zone}
              status={bon.workflow_status}
              deliveryDate={bon.date_livraison}
            />
          </div>
        )}

        {/* 🆕 Driver Quick Contact for assigned trucks */}
        {(bon.camion_assigne || bon.toupie_assignee) && (
          <div className="mt-3 pt-3 border-t">
            {(() => {
              const assignedCamion = camions.find(c => c.id_camion === (bon.camion_assigne || bon.toupie_assignee));
              if (assignedCamion?.chauffeur) {
                return (
                  <DriverQuickContact 
                    driverName={assignedCamion.chauffeur}
                    phoneNumber={assignedCamion.telephone_chauffeur || null}
                    blId={bon.bl_id}
                    compact
                  />
                );
              }
              return null;
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
  };

  const availableCamions = camions.filter(c => c.statut === 'Disponible').length;
  const totalBonsToday = bons.length;
  const pendingBons = bons.filter(b => ['planification', 'validation_technique'].includes(b.workflow_status)).length;

  // Mark as delivered
  const markDelivered = async (bon: BonLivraison) => {
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ 
          workflow_status: 'livre',
          heure_retour_centrale: new Date().toISOString()
        })
        .eq('bl_id', bon.bl_id);

      if (error) throw error;
      toast.success(t.pages.planning.deliveryConfirmed);
      fetchData();
    } catch (error) {
      console.error('Error marking delivered:', error);
      toast.error(t.pages.planning.confirmDeliveryError);
    }
  };

  // Tablet/Mobile optimized view
  if (isMobile || isTablet) {
    return (
      <MainLayout>
        <TabletPlanningView
          pendingValidation={pendingValidation}
          aProduire={aProduire}
          enChargement={enChargement}
          enLivraison={enLivraison}
          livresAujourdhui={[...aFacturer, ...facturesAujourdhui]}
          conflicts={conflicts}
          totalBonsToday={totalBonsToday}
          pendingBons={pendingBons}
          availableCamions={availableCamions}
          totalCamions={camions.length}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onRefresh={fetchData}
          onStartProduction={startProduction}
          onMarkDelivered={markDelivered}
          onOpenDetails={(bon) => navigate(`/bons?bl=${bon.bl_id}`)}
          onConfirmBl={confirmBl}
          onRejectBl={rejectBl}
          loading={loading}
        />
      </MainLayout>
    );
  }

  // Desktop view
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Read-Only Banner for Directeur Opérations */}
        {isReadOnly && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
            <Eye className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {t.pages.planning.readOnlyMode}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.pages.planning.readOnlyDescription}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t.pages.planning.title}</h1>
            <p className="text-muted-foreground">{t.pages.planning.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* GPS Tracking Link */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
              onClick={() => navigate('/logistique')}
            >
              <Crosshair className="h-4 w-4" />
              {t.pages.planning.gpsTracking}
              {enLivraison.length > 0 && (
                <Badge className="bg-emerald-500 text-white ml-1">{enLivraison.length}</Badge>
              )}
            </Button>
            
            {pendingBLCount > 0 && pendingEarliestDate && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10 relative"
                onClick={() => {
                  setFocusPending(true);
                }}
              >
                <BellRing className="h-4 w-4" />
                {t.pages.planning.toConfirm}
                <Badge className="bg-amber-500 text-white ml-1">{pendingBLCount}</Badge>
              </Button>
            )}
            <DailyPlanningReport
              date={parseISO(selectedDate)}
              stats={{
                totalDeliveries: bons.length,
                pendingCount: pendingValidation.length + aProduire.length,
                trucksAvailable: availableCamions,
                trucksTotal: camions.length,
                enRouteCount: enLivraison.length,
                totalVolume: bons.reduce((sum, b) => sum + b.volume_m3, 0),
                deliveredCount: aFacturer.length + facturesAujourdhui.length,
              }}
              deliveries={bons.map(b => ({
                bl_id: b.bl_id,
                client_name: b.clients?.nom_client || b.client_id,
                formule_id: b.formule_id,
                volume_m3: b.volume_m3,
                heure_prevue: b.heure_prevue,
                toupie_assignee: b.toupie_assignee || b.camion_assigne,
                workflow_status: b.workflow_status,
              }))}
            />
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              {t.pages.planning.refresh}
            </Button>
          </div>
        </div>

        {/* Collapsible Calendar Header */}
        <PlanningCalendarHeader
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          deliveryData={monthlyDeliveryData}
          isOpen={calendarOpen}
          onOpenChange={setCalendarOpen}
        />

        {/* 🆕 Pending Validation Section - NEW BLs awaiting dispatcher confirmation */}
        {pendingValidation.length > 0 && (
          <div ref={pendingValidationRef}>
          <Collapsible open={pendingValidationOpen} onOpenChange={setPendingValidationOpen}>
            <Card className="border-2 border-dashed border-amber-500/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 animate-pulse">
                      <ClipboardCheck className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{t.pages.planning.toConfirm}</span>
                        <Badge className="bg-amber-500 text-white animate-bounce">{pendingValidation.length}</Badge>
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                          <BulkConfirmAction
                            pendingBLs={pendingValidation}
                            onConfirmAll={confirmAllPending}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">
                        {t.pages.planning.pendingDispatcherValidation}
                      </p>
                    </div>
                    {pendingValidationOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pendingValidation.map(bon => (
                      <Card key={bon.bl_id} className="border border-amber-500/30 bg-card hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-sm">{bon.bl_id}</p>
                              <p className="text-xs text-muted-foreground">
                                {bon.clients?.nom_client || bon.client_id}
                              </p>
                            </div>
                            <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                              {t.pages.planning.newLabel}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Package className="h-3 w-3" />
                              <span>{bon.formule_id}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Factory className="h-3 w-3 text-muted-foreground" />
                              <span className="font-semibold">{bon.volume_m3} m³</span>
                            </div>
                            {bon.zones_livraison && (
                              <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                <Navigation className="h-3 w-3" />
                                <span>Zone {bon.zones_livraison.code_zone}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-success hover:bg-success/90 text-white gap-1.5"
                              onClick={() => confirmBl(bon)}
                            >
                              <CheckCircle className="h-4 w-4" />
                               {t.pages.planning.confirm}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-destructive/50 text-destructive hover:bg-destructive/10"
                              onClick={() => rejectBl(bon)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </div>
        )}

        {/* Conflict Alert */}
        {conflicts.length > 0 && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">{t.pages.planning.conflictDetected}</p>
                <p className="text-sm text-muted-foreground">
                  {conflicts.length} {t.pages.planning.conflictDescription}
                </p>
                <div className="mt-2 space-y-1">
                  {conflicts.map((c, i) => (
                    <p key={i} className="text-xs text-destructive">
                      • {c.bl1.bl_id} ({c.bl1.heure_prevue}) ↔ {c.bl2.bl_id} ({c.bl2.heure_prevue})
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBonsToday}</p>
                <p className="text-xs text-muted-foreground">{t.pages.planning.deliveriesToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingBons}</p>
                <p className="text-xs text-muted-foreground">{t.pages.planning.waitingLabel}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Truck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableCamions}/{camions.length}</p>
                <p className="text-xs text-muted-foreground">{t.pages.planning.trucksAvailable}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Navigation className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enLivraison.length}</p>
                <p className="text-xs text-muted-foreground">{t.pages.planning.onRoute}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🆕 Command Center - Intelligence Dashboard */}
        <CommandCenterSection 
          bons={bons}
          camions={camions}
        />

        {/* Live Dispatch Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* À Produire - Premium styling */}
          <Card className="border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-b from-amber-50/30 to-card dark:from-amber-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                  <Factory className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-orange-400">
                  {t.pages.planning.toProduce}
                </span>
                <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md shadow-amber-500/20">
                  {aProduire.length}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t.pages.planning.next2Hours}</p>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-3">
              {aProduire.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Factory className="h-8 w-8 text-amber-300 dark:text-amber-700" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t.pages.planning.noPlannedDelivery}</p>
                </div>
              ) : (
                aProduire.map(bon => <BonCard key={bon.bl_id} bon={bon} showTimeInput />)
              )}
            </CardContent>
          </Card>

          {/* En Chargement - Premium styling */}
          <Card className="border-violet-200/50 dark:border-violet-900/30 bg-gradient-to-b from-violet-50/30 to-card dark:from-violet-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400">
                  {t.pages.planning.enChargement}
                </span>
                <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 shadow-md shadow-violet-500/20">
                  {enChargement.length}
                </Badge>
                {enChargement.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto gap-1.5 text-violet-600 hover:bg-violet-500/10 h-7 text-xs"
                    data-testid="centre-production-link"
                    onClick={() => navigate(`/production?date=${selectedDate}`)}
                  >
                    <Eye className="h-3 w-3" />
                    {t.pages.planning.productionCenter}
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t.pages.planning.productionAndValidation}</p>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-3">
              {enChargement.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Package className="h-8 w-8 text-violet-300 dark:text-violet-700" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t.pages.planning.noLoadingInProgress}</p>
                </div>
              ) : (
                enChargement.map(bon => <BonCard key={bon.bl_id} bon={bon} />)
              )}
            </CardContent>
          </Card>

          {/* En Livraison - Premium styling */}
          <Card className="border-rose-200/50 dark:border-rose-900/30 bg-gradient-to-b from-rose-50/30 to-card dark:from-rose-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/20">
                  <Navigation className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent dark:from-rose-400 dark:to-pink-400">
                  {t.pages.planning.enLivraison}
                </span>
                <Badge className="ml-auto bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 shadow-md shadow-rose-500/20">
                  {enLivraison.length}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t.pages.planning.trucksOnRoute}</p>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-3">
              {enLivraison.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <Navigation className="h-8 w-8 text-rose-300 dark:text-rose-700" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t.pages.planning.noTruckOnDelivery}</p>
                </div>
              ) : (
                enLivraison.map(bon => <BonCard key={bon.bl_id} bon={bon} />)
              )}
            </CardContent>
          </Card>

          {/* 🆕 À Facturer - Livrées mais pas encore facturées (PRIORITÉ!) */}
          {aFacturer.length > 0 && (
            <Card className="border-2 border-warning/50 bg-warning/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-1.5 rounded bg-warning/20 animate-pulse">
                    <Receipt className="h-4 w-4 text-warning" />
                  </div>
                  {t.pages.planning.toInvoice}
                  <Badge className="ml-auto bg-warning text-white">{aFacturer.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{t.pages.planning.deliveredAwaitingInvoice}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aFacturer.map(bon => (
                    <div 
                      key={bon.bl_id}
                      className="flex items-center justify-between p-3 bg-warning/10 border border-warning/30 rounded-lg hover:bg-warning/20 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedDeliveryForInvoice(bon);
                        setInvoiceDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold">{bon.bl_id}</span>
                        <span className="text-muted-foreground">{bon.clients?.nom_client || bon.client_id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{bon.volume_m3} m³</span>
                        {bon.facturer_attente && (
                          <Badge variant="outline" className="border-warning text-warning text-xs gap-1">
                            <Clock className="h-3 w-3" />
                            {t.pages.planning.waiting}
                          </Badge>
                        )}
                        <Button size="sm" className="gap-1 bg-success hover:bg-success/90">
                          <Receipt className="h-4 w-4" />
                          {t.pages.planning.invoice}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Facturées Aujourd'hui - Archivable */}
          {facturesAujourdhui.length > 0 && (
            <Card className="border-success/30 bg-success/5 opacity-80">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-1.5 rounded bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  {t.pages.planning.invoiced}
                  <Badge variant="outline" className="ml-auto border-success/30 text-success">{facturesAujourdhui.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {facturesAujourdhui.map(bon => (
                    <div 
                      key={bon.bl_id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium">{bon.bl_id}</span>
                        <span className="text-muted-foreground">{bon.clients?.nom_client || bon.client_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{bon.volume_m3} m³</span>
                        <Badge variant="outline" className="text-success border-success/30 text-xs">
                          {t.pages.planning.invoicedCheck}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Full Day Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t.pages.planning.chronologicalPlanning} - {format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: dateLocale })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bons.filter(b => !['annule', 'livre', 'facture'].includes(b.workflow_status)).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t.pages.planning.noScheduledDelivery}
              </p>
            ) : (
              <div className="space-y-2">
                {bons
                  .filter(b => !['annule', 'livre', 'facture'].includes(b.workflow_status))
                  .sort((a, b) => {
                    const am = timeToMinutes(a.heure_prevue);
                    const bm = timeToMinutes(b.heure_prevue);
                    if (am === null && bm === null) return 0;
                    if (am === null) return 1;
                    if (bm === null) return -1;
                    return am - bm;
                  })
                  .map(bon => (
                    <div 
                      key={bon.bl_id}
                      className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-16 text-center">
                        <p className="font-mono font-semibold text-lg">
                          {formatTimeHHmm(bon.heure_prevue) || '--:--'}
                        </p>
                      </div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                        <p className="font-medium">{bon.bl_id}</p>
                        <p className="text-sm text-muted-foreground">{bon.clients?.nom_client || bon.client_id}</p>
                        <p className="text-sm">{bon.formule_id} - {bon.volume_m3}m³</p>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{bon.camion_assigne || bon.toupie_assignee || t.pages.planning.notAssigned}</span>
                        </div>
                        {getStatusBadge(bon.workflow_status)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Smart Invoice Dialog */}
        {selectedDeliveryForInvoice && (
          <SmartInvoiceDialog
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
            delivery={selectedDeliveryForInvoice}
            onInvoiceGenerated={fetchData}
          />
        )}

        {/* CEO Approval Dialog for Credit Limit Override */}
        {pendingCreditApproval && (
          <CeoApprovalCodeDialog
            open={ceoApprovalOpen}
            onOpenChange={(open) => {
              setCeoApprovalOpen(open);
              if (!open) setPendingCreditApproval(null);
            }}
            clientName={pendingCreditApproval.clientName}
            clientId={pendingCreditApproval.bon.client_id}
            solde={pendingCreditApproval.solde}
            limite={pendingCreditApproval.limite}
            onApproved={handleCeoApprovalSuccess}
          />
        )}

        {/* CEO Code Request Dialog for Agent Admin */}
        {ceoCodeRequestData && (
          <CeoCodeRequestDialog
            open={ceoCodeDialogOpen}
            onOpenChange={(open) => {
              setCeoCodeDialogOpen(open);
              if (!open) setCeoCodeRequestData(null);
            }}
            blId={ceoCodeRequestData.blId}
            clientId={ceoCodeRequestData.clientId}
            clientName={ceoCodeRequestData.clientName}
            solde={ceoCodeRequestData.solde}
            limite={ceoCodeRequestData.limite}
            onCodeVerified={async () => {
              // Find the bon and start production
              const bon = bons.find(b => b.bl_id === ceoCodeRequestData.blId);
              if (bon) {
                await logPlanningAction('CEO_CODE_PRODUCTION', bon.bl_id, {
                  action: 'Production started with CEO emergency code',
                  client_id: bon.client_id,
                  timestamp: new Date().toISOString(),
                });
                await startProduction(bon);
              }
            }}
          />
        )}

        {/* Midnight Protocol Justification Dialog */}
        <MidnightJustificationDialog
          open={midnightDialogOpen}
          onOpenChange={(open) => {
            setMidnightDialogOpen(open);
            if (!open) setPendingNightBon(null);
          }}
          actionLabel={t.pages.planning.launchProductionUrgency}
          loading={midnightLoading}
          onConfirm={async (justification) => {
            if (!pendingNightBon) return;
            setMidnightLoading(true);
            try {
              await executeStartProduction(pendingNightBon, justification);
            } finally {
              setMidnightLoading(false);
              setMidnightDialogOpen(false);
              setPendingNightBon(null);
            }
          }}
        />

        {/* Fleet Panel - Right Sidebar (Desktop and Tablet) */}
        {!isMobile && (
          <FleetPanel selectedDate={selectedDate} />
        )}
      </div>
    </MainLayout>
  );
}
