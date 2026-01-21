import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addHours, parseISO, isWithinInterval, differenceInMinutes, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
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
  BellRing
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
import { formatTimeHHmm, normalizeTimeHHmm, timeToMinutes } from '@/lib/time';

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
  heure_retour_centrale: string | null;
  temps_rotation_minutes: number | null;
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
  const { isMobile, isTablet, isTouchDevice } = useDeviceType();
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
  
  // Initialize date from URL param or default to today
  const initialDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(initialDate);

  // If user navigated to /planning?focus=pending (e.g. by clicking the sidebar badge),
  // jump to the earliest pending date and scroll to the "À Confirmer" section.
  useEffect(() => {
    if (searchParams.get('focus') === 'pending') {
      setFocusPending(true);
    }
  }, [searchParams]);


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
          heure_retour_centrale,
          temps_rotation_minutes,
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

    } catch (error) {
      console.error('Error fetching planning data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Initial fetch and when date changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 15 seconds for live dispatch
  useEffect(() => {
    const autoRefreshInterval = setInterval(fetchData, 15000);
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

  // Categorize BLs for the dispatch board - NOW EXCLUDES pending validation BLs from main board
  const { pendingValidation, aProduire, enChargement, enLivraison, livresAujourdhui, conflicts } = useMemo(() => {
    const now = new Date();
    const in2Hours = addHours(now, 2);
    
    const pendingValidation: BonLivraison[] = [];
    const aProduire: BonLivraison[] = [];
    const enChargement: BonLivraison[] = [];
    const enLivraison: BonLivraison[] = [];
    const livresAujourdhui: BonLivraison[] = [];
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
      } else if (['livre', 'facture'].includes(bon.workflow_status)) {
        livresAujourdhui.push(bon);
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

    return { pendingValidation, aProduire, enChargement, enLivraison, livresAujourdhui, conflicts };
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
    try {
      const trimmed = (time || '').trim();
      const normalized = trimmed ? normalizeTimeHHmm(trimmed) : null;
      if (trimmed && !normalized) {
        toast.error('Heure invalide. Format attendu: HH:mm');
        return;
      }
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ heure_prevue: normalized })
        .eq('bl_id', blId);

      if (error) throw error;
      toast.success('Heure mise à jour');
      fetchData();
    } catch (error) {
      console.error('Error updating time:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const assignTruck = async (blId: string, camionId: string) => {
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ 
          camion_assigne: camionId || null,
          toupie_assignee: camionId || null 
        })
        .eq('bl_id', blId);

      if (error) throw error;
      toast.success('Camion assigné');
      fetchData();
    } catch (error) {
      console.error('Error assigning truck:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  // Start production: advance to 'production' status and navigate to Production page
  const startProduction = async (bon: BonLivraison) => {
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
      
      toast.success('Production lancée!');
      // Navigate to Production page with BL ID as search param
      navigate(`/production?bl=${bon.bl_id}`);
    } catch (error) {
      console.error('Error starting production:', error);
      toast.error('Erreur lors du lancement');
    }
  };

  // Confirm a pending BL - moves to planification status
  const confirmBl = async (bon: BonLivraison) => {
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ workflow_status: 'planification' })
        .eq('bl_id', bon.bl_id);

      if (error) throw error;
      toast.success(`${bon.bl_id} confirmé et ajouté au dispatch!`);
      fetchData();
    } catch (error) {
      console.error('Error confirming BL:', error);
      toast.error('Erreur lors de la confirmation');
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

      toast.success(`${bon.bl_id} rejeté`);
      fetchData();
    } catch (error) {
      console.error('Error rejecting BL:', error);
      toast.error('Erreur lors du rejet');
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      en_attente_validation: { label: 'À Confirmer', variant: 'outline' },
      planification: { label: 'Prêt', variant: 'outline', className: 'border-blue-500 text-blue-600' },
      production: { label: 'Chargement', variant: 'secondary', className: 'bg-violet-500/20 text-violet-700 border-violet-500/30' },
      validation_technique: { label: 'Validation Tech', variant: 'secondary', className: 'bg-amber-500/20 text-amber-700 border-amber-500/30' },
      en_livraison: { label: 'En Route', variant: 'default', className: 'bg-rose-500 text-white' },
      livre: { label: 'Livré', variant: 'default', className: 'bg-emerald-500 text-white' },
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const BonCard = ({ bon, showTimeInput = false }: { bon: BonLivraison; showTimeInput?: boolean }) => {
    const [timeDraft, setTimeDraft] = useState(() => formatTimeHHmm(bon.heure_prevue) || '');

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
        toast.error('Heure invalide. Format attendu: HH:mm');
        setTimeDraft(formatTimeHHmm(bon.heure_prevue) || '');
        return;
      }
      if (normalized !== (formatTimeHHmm(bon.heure_prevue) || '')) {
        await updateBonTime(bon.bl_id, normalized);
      }
    };

    return (
      <Card className={cn(
        "mb-3 border-l-4 border-l-primary/50 hover:shadow-md transition-shadow",
        isTouchDevice && "active:scale-[0.98]"
      )}>
        <CardContent className={cn("p-4", isTouchDevice && "p-5")}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className={cn("font-semibold", isTouchDevice ? "text-base" : "text-sm")}>{bon.bl_id}</p>
            <p className={cn("text-muted-foreground", isTouchDevice ? "text-sm" : "text-xs")}>
              {bon.clients?.nom_client || bon.client_id}
            </p>
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
                    <SelectValue placeholder="Assigner camion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assigné</SelectItem>
                    {camions.map(c => (
                      <SelectItem key={c.id_camion} value={c.id_camion}>
                        {c.id_camion} - {c.chauffeur || 'Sans chauffeur'}
                        {c.statut !== 'Disponible' && ` (${c.statut})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Smart Truck Assignment */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
                    <Sparkles className="h-3 w-3" />
                    Suggestion intelligente
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
            {/* Launch Production Button */}
            {bon.workflow_status === 'planification' && bon.heure_prevue && (bon.camion_assigne || bon.toupie_assignee) && (
              <Button 
                size={isTouchDevice ? "lg" : "sm"}
                className={cn(
                  "w-full mt-2 gap-2",
                  isTouchDevice && "min-h-[52px] text-base"
                )}
                onClick={() => startProduction(bon)}
              >
                <Factory className={cn(isTouchDevice ? "h-5 w-5" : "h-4 w-4")} />
                Lancer Production
                <ArrowRight className={cn(isTouchDevice ? "h-5 w-5" : "h-4 w-4")} />
              </Button>
            )}
          </div>
        )}

        {!showTimeInput && bon.heure_prevue && (
          <div className={cn(
            "flex items-center gap-2 text-muted-foreground mt-2",
            isTouchDevice ? "text-sm" : "text-xs"
          )}>
            <Timer className={cn(isTouchDevice ? "h-4 w-4" : "h-3 w-3")} />
            <span>Prévu: {formatTimeHHmm(bon.heure_prevue) || bon.heure_prevue}</span>
            {(bon.camion_assigne || bon.toupie_assignee) && (
              <>
                <span className="text-muted-foreground">•</span>
                <Truck className={cn(isTouchDevice ? "h-4 w-4" : "h-3 w-3")} />
                <span>{bon.camion_assigne || bon.toupie_assignee}</span>
              </>
            )}
          </div>
        )}

        {/* 🆕 ETA Tracker for en_livraison status */}
        {bon.workflow_status === 'en_livraison' && (
          <div className="mt-3 pt-3 border-t">
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
      toast.success('Livraison confirmée!');
      fetchData();
    } catch (error) {
      console.error('Error marking delivered:', error);
      toast.error('Erreur lors de la confirmation');
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
          livresAujourdhui={livresAujourdhui}
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Planning & Dispatch</h1>
            <p className="text-muted-foreground">Ordonnancement des livraisons</p>
          </div>
          <div className="flex items-center gap-3">
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
                À Confirmer
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
                deliveredCount: livresAujourdhui.length,
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
              Actualiser
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
                        <span>À Confirmer</span>
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
                        Nouvelles livraisons en attente de validation dispatcher
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
                              Nouveau
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
                              Confirmer
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
                <p className="font-semibold text-destructive">⚠️ Conflit de Planning Détecté!</p>
                <p className="text-sm text-muted-foreground">
                  {conflicts.length} conflit(s) - Plusieurs livraisons planifiées dans un intervalle de 15 minutes.
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
                <p className="text-xs text-muted-foreground">Livraisons aujourd'hui</p>
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
                <p className="text-xs text-muted-foreground">En attente</p>
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
                <p className="text-xs text-muted-foreground">Camions dispo</p>
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
                <p className="text-xs text-muted-foreground">En route</p>
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
          {/* À Produire */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded bg-warning/10">
                  <Factory className="h-4 w-4 text-warning" />
                </div>
                À Produire
                <Badge variant="outline" className="ml-auto">{aProduire.length}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">Prochaines 2 heures</p>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {aProduire.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune livraison planifiée
                </p>
              ) : (
                aProduire.map(bon => <BonCard key={bon.bl_id} bon={bon} showTimeInput />)
              )}
            </CardContent>
          </Card>

          {/* En Chargement */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded bg-violet-500/20">
                  <Package className="h-4 w-4 text-violet-600" />
                </div>
                En Chargement
                <Badge variant="secondary" className="ml-auto bg-violet-500/20 text-violet-700">{enChargement.length}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">Production & Validation Technique</p>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {enChargement.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun chargement en cours
                </p>
              ) : (
                enChargement.map(bon => <BonCard key={bon.bl_id} bon={bon} />)
              )}
            </CardContent>
          </Card>

          {/* En Livraison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded bg-primary/10">
                  <Navigation className="h-4 w-4 text-primary" />
                </div>
                En Livraison
                <Badge className="ml-auto">{enLivraison.length}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">Camions en route</p>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {enLivraison.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun camion en livraison
                </p>
              ) : (
                enLivraison.map(bon => <BonCard key={bon.bl_id} bon={bon} />)
              )}
            </CardContent>
          </Card>

          {/* Livraisons Terminées */}
          {livresAujourdhui.length > 0 && (
            <Card className="border-success/30 bg-success/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-1.5 rounded bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  Livrées Aujourd'hui
                  <Badge variant="outline" className="ml-auto border-success/30 text-success">{livresAujourdhui.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {livresAujourdhui.map(bon => (
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
                          {bon.workflow_status === 'facture' ? 'Facturé' : 'Livré'}
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
              Planning Chronologique - {format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bons.filter(b => !['annule', 'livre', 'facture'].includes(b.workflow_status)).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune livraison planifiée pour cette date
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
                          <span className="text-sm">{bon.camion_assigne || bon.toupie_assignee || 'Non assigné'}</span>
                        </div>
                        {getStatusBadge(bon.workflow_status)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
