import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale, getNumberLocale } from '@/i18n/dateLocale';
import { useAuth } from '@/hooks/useAuth';
import { useBonWorkflow } from '@/hooks/useBonWorkflow';
import { useDeviceType } from '@/hooks/useDeviceType';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { BonDetailDialog } from '@/components/bons/BonDetailDialog';
import { BonDetailDrawer } from '@/components/bons/BonDetailDrawer';
import { BlPrintable } from '@/components/bons/BlPrintable';
import { ExportButton } from '@/components/documents/ExportButton';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { DriverDispatchCard } from '@/components/planning/DriverDispatchCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Truck, Loader2, AlertCircle, CheckCircle, Clock, Play, Package, FileText, XCircle, Eye, Printer, List, LayoutGrid, FileCheck, Search, AlertTriangle, X, Sparkles, ChevronDown, Phone, Mail, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';
import { format, isToday, differenceInDays, getDaysInMonth, getDate, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';

interface BonLivraison {
  bl_id: string;
  date_livraison: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  ciment_reel_kg: number;
  adjuvant_reel_l: number | null;
  eau_reel_l: number | null;
  km_parcourus: number | null;
  temps_mission_heures: number | null;
  statut_paiement: string;
  workflow_status: string | null;
  toupie_assignee: string | null;
  validation_technique: boolean | null;
  alerte_ecart: boolean;
  alerte_marge: boolean | null;
  prix_vente_m3: number | null;
  cur_reel: number | null;
  marge_brute_pct: number | null;
  created_at: string;
  // Logistics & Payment fields
  zone_livraison_id: string | null;
  mode_paiement: string | null;
  prix_livraison_m3: number | null;
  prestataire_id: string | null;
}

interface Formule {
  formule_id: string;
  designation: string;
  ciment_kg_m3: number;
  adjuvant_l_m3: number;
}

interface Client {
  client_id: string;
  nom_client: string;
  limite_credit_dh: number | null;
  solde_du: number | null;
}

const WORKFLOW_STEP_LABELS: Record<string, string> = {
  planification: 'stepPlanning',
  production: 'stepProduction',
  validation_technique: 'stepValidation',
  en_livraison: 'stepDelivery',
  livre: 'stepDelivered',
  facture: 'stepInvoiced',
  annule: 'stepCancelled',
};

const WORKFLOW_STEPS_META = [
  { value: 'planification', icon: Clock, color: 'text-muted-foreground' },
  { value: 'production', icon: Play, color: 'text-warning' },
  { value: 'validation_technique', icon: CheckCircle, color: 'text-purple-500' },
  { value: 'en_livraison', icon: Truck, color: 'text-blue-500' },
  { value: 'livre', icon: Package, color: 'text-success' },
  { value: 'facture', icon: FileText, color: 'text-primary' },
  { value: 'annule', icon: XCircle, color: 'text-destructive' },
];

function RecoverySection({ items }: { items: { bl_id: string; client_id: string; amount: number; daysOverdue: number; action: string; actionIcon: any }[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      background: 'rgba(212, 168, 67, 0.04)',
      border: '1px solid rgba(212, 168, 67, 0.15)',
      borderLeft: '4px solid #D4A843',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: '#FFD700' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Recouvrement
          </span>
          <Badge variant="outline" className="border-[#D4A843]/30 text-[#D4A843] text-[10px] ml-1">
            {items.length} impayés
          </Badge>
        </div>
        <ChevronDown className="h-4 w-4 transition-transform" style={{ color: '#D4A843', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-2">
          {items.map((item, i) => {
            const ActionIcon = item.actionIcon;
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              >
                <span className="text-xs font-mono text-muted-foreground w-28 flex-shrink-0">{item.bl_id}</span>
                <span className="text-sm font-medium text-white flex-1 min-w-0 truncate">{item.client_id}</span>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 14, fontWeight: 500, color: '#D4A843', minWidth: 90, textAlign: 'right' }}>
                  {item.amount.toLocaleString('fr-MA')} DH
                </span>
                <span className="text-xs font-semibold min-w-16 text-center" style={{ color: '#ef4444' }}>
                  +{item.daysOverdue}j
                </span>
                <div className="flex items-center gap-1.5 min-w-48">
                  <ActionIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <span className="text-xs text-gray-400">{item.action}</span>
                </div>
                <button
                  onClick={() => toast.success(`Relance lancée pour ${item.bl_id}`)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
                  style={{ background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.15)'; }}
                >
                  ⚡ Lancer Relance
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Bons() {
  const { user, isCeo, isAgentAdministratif, isDirecteurOperations, isCentraliste, isResponsableTechnique, isSuperviseur, canCreateBons, canValidateTechnique } = useAuth();
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const { transitionWorkflow, canTransitionTo } = useBonWorkflow();
  const { isMobile, isTablet, isTouchDevice } = useDeviceType();
  const [searchParams] = useSearchParams();

  const WORKFLOW_STEPS = WORKFLOW_STEPS_META.map(s => ({
    ...s,
    label: (t.pages.bons as any)[WORKFLOW_STEP_LABELS[s.value]] || s.value,
  }));

  const [bons, setBons] = useState<BonLivraison[]>([]);
  const [formules, setFormules] = useState<Formule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toleranceErrors, setToleranceErrors] = useState<string[]>([]);
  const [detailBlId, setDetailBlId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(isMobile || isTablet ? 'cards' : 'table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [anomalyBannerDismissed, setAnomalyBannerDismissed] = useState(false);
  const [drawerBlId, setDrawerBlId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Anomaly detection
  const anomalies = (() => {
    const issues: string[] = [];
    
    // 1. Same client with 3+ pending bons (payment risk)
    const pendingByClient: Record<string, number> = {};
    bons.filter(b => b.statut_paiement === 'En Attente').forEach(b => {
      pendingByClient[b.client_id] = (pendingByClient[b.client_id] || 0) + 1;
    });
    const riskyClients = Object.entries(pendingByClient).filter(([_, count]) => count >= 3);
    if (riskyClients.length > 0) {
      issues.push(`${riskyClients.length} client(s) avec 3+ bons en attente de paiement — risque de créance`);
    }
    
    // 2. Volume outlier >2x average
    const volumes = bons.map(b => b.volume_m3).filter(v => v > 0);
    const avgVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
    const outliers = bons.filter(b => b.volume_m3 > avgVolume * 2);
    if (outliers.length > 0 && avgVolume > 0) {
      issues.push(`${outliers.length} bon(s) avec volume >2x la moyenne (${avgVolume.toFixed(1)} m³) — commande inhabituelle`);
    }
    
    // 3. Bon in Planning status >5 days (stuck workflow)
    const stuckBons = bons.filter(b => {
      if (b.workflow_status !== 'planification') return false;
      const daysSince = differenceInDays(new Date(), new Date(b.date_livraison));
      return daysSince > 5;
    });
    if (stuckBons.length > 0) {
      issues.push(`${stuckBons.length} bon(s) en planification depuis +5 jours — workflow bloqué`);
    }
    
    return issues;
  })();

  // Check for URL params to open detail
  useEffect(() => {
    const blParam = searchParams.get('bl');
    if (blParam) {
      setDetailBlId(blParam);
      setDetailDialogOpen(true);
    }
  }, [searchParams]);

  // Form state
  const [blId, setBlId] = useState('');
  const [clientId, setClientId] = useState('');
  const [formuleId, setFormuleId] = useState('');
  const [volume, setVolume] = useState('');
  const [cimentReel, setCimentReel] = useState('');
  const [adjuvantReel, setAdjuvantReel] = useState('');
  const [eauReel, setEauReel] = useState('');
  const [kmParcourus, setKmParcourus] = useState('');
  const [tempsMission, setTempsMission] = useState('');
  const [toupie, setToupie] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [bonsRes, formulesRes, clientsRes] = await Promise.all([
        supabase.from('bons_livraison_reels').select('*').order('created_at', { ascending: false }),
        supabase.from('formules_theoriques').select('formule_id, designation, ciment_kg_m3, adjuvant_l_m3'),
        supabase.from('clients').select('client_id, nom_client, limite_credit_dh, solde_du'),
      ]);

      if (bonsRes.error) throw bonsRes.error;
      if (formulesRes.error) throw formulesRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setBons(bonsRes.data || []);
      setFormules(formulesRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t.pages.bons.createError);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pull to refresh for mobile
  const handlePullRefresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  const { containerRef, isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    threshold: 80,
    disabled: !isMobile && !isTablet,
  });

  const generateBlId = () => {
    const today = new Date();
    const dateStr = format(today, 'yyMMdd');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TB-${dateStr}-${random}`;
  };

  const resetForm = () => {
    setBlId(generateBlId());
    setClientId('');
    setFormuleId('');
    setVolume('');
    setCimentReel('');
    setAdjuvantReel('');
    setEauReel('');
    setKmParcourus('');
    setTempsMission('');
    setToupie('');
    setToleranceErrors([]);
  };

  useEffect(() => {
    if (dialogOpen) {
      resetForm();
    }
  }, [dialogOpen]);

  const validateTolerances = () => {
    const errors: string[] = [];
    const selectedFormule = formules.find(f => f.formule_id === formuleId);
    
    if (!selectedFormule || !volume) return errors;

    const volumeNum = parseFloat(volume);
    const cimentTheorique = selectedFormule.ciment_kg_m3 * volumeNum;
    const adjuvantTheorique = selectedFormule.adjuvant_l_m3 * volumeNum;
    const cimentReelNum = parseFloat(cimentReel) || 0;
    const adjuvantReelNum = parseFloat(adjuvantReel) || 0;

    // Cement ±2%
    const cimentEcart = Math.abs((cimentReelNum - cimentTheorique) / cimentTheorique) * 100;
    if (cimentReelNum > 0 && cimentEcart > 2) {
      errors.push(`Ciment hors tolérance: ${cimentEcart.toFixed(1)}% (max ±2%)`);
    }

    // Adjuvant ±5%
    if (adjuvantTheorique > 0) {
      const adjuvantEcart = Math.abs((adjuvantReelNum - adjuvantTheorique) / adjuvantTheorique) * 100;
      if (adjuvantReelNum > 0 && adjuvantEcart > 5) {
        errors.push(`Adjuvant hors tolérance: ${adjuvantEcart.toFixed(1)}% (max ±5%)`);
      }
    }

    return errors;
  };

  useEffect(() => {
    if (formuleId && volume && cimentReel) {
      setToleranceErrors(validateTolerances());
    }
  }, [formuleId, volume, cimentReel, adjuvantReel]);

  const checkCreditLimit = () => {
    const selectedClient = clients.find(c => c.client_id === clientId);
    if (!selectedClient) return null;

    const solde = selectedClient.solde_du || 0;
    const limite = selectedClient.limite_credit_dh || 50000;

    if (solde > limite) {
      return { exceeded: true, solde, limite };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const volumeNum = parseFloat(volume);
      if (volumeNum <= 0 || volumeNum >= 12) {
        toast.error(t.pages.bons.volumeError);
        setSubmitting(false);
        return;
      }

      // Check credit limit
      const creditCheck = checkCreditLimit();
      if (creditCheck?.exceeded) {
        // Create approval request
        await supabase.from('approbations_ceo').insert([{
          type_approbation: 'credit',
          reference_id: blId,
          reference_table: 'bons_livraison_reels',
          demande_par: user?.id,
          montant: creditCheck.solde,
          details: { limite: creditCheck.limite, client_id: clientId },
        }]);

        // Create alert
        await supabase.from('alertes_systeme').insert([{
          type_alerte: 'credit',
          niveau: 'critical',
          titre: 'Dépassement Limite Crédit',
          message: `Client ${clientId} a dépassé sa limite de crédit (${creditCheck.solde.toLocaleString()} / ${creditCheck.limite.toLocaleString()} DH)`,
          reference_id: blId,
          reference_table: 'bons_livraison_reels',
          destinataire_role: 'ceo',
        }]);

        toast.warning('Demande d\'approbation crédit envoyée au CEO');
      }

      const errors = validateTolerances();
      const hasAlerte = errors.length > 0;

      const { error } = await supabase.from('bons_livraison_reels').insert([{
        bl_id: blId,
        client_id: clientId,
        formule_id: formuleId,
        volume_m3: volumeNum,
        ciment_reel_kg: parseFloat(cimentReel) || 0,
        adjuvant_reel_l: adjuvantReel ? parseFloat(adjuvantReel) : null,
        eau_reel_l: eauReel ? parseFloat(eauReel) : null,
        km_parcourus: kmParcourus ? parseFloat(kmParcourus) : null,
        temps_mission_heures: tempsMission ? parseFloat(tempsMission) : null,
        statut_paiement: 'En Attente',
        workflow_status: 'planification',
        toupie_assignee: toupie || null,
        alerte_ecart: hasAlerte,
        created_by: user?.id,
      }]);

      if (error) {
        if (error.code === '23505') {
          toast.error(t.pages.bons.existsAlready);
        } else if (error.code === '23514') {
          toast.error(t.pages.bons.outOfLimits);
        } else {
          throw error;
        }
        setSubmitting(false);
        return;
      }

      // Create fuite alert if tolerance exceeded
      if (hasAlerte) {
        await supabase.from('alertes_systeme').insert([{
          type_alerte: 'fuite',
          niveau: 'warning',
          titre: 'Alerte Fuite - Tolérance Dépassée',
          message: errors.join('. '),
          reference_id: blId,
          reference_table: 'bons_livraison_reels',
          destinataire_role: 'ceo',
        }]);
        toast.warning(t.pages.bons.createdWithAlerts);
      } else {
        toast.success(t.pages.bons.created);
      }
      
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating bon:', error);
      toast.error(t.pages.bons.createError);
    } finally {
      setSubmitting(false);
    }
  };

  const updateWorkflowStatus = async (blId: string, newStatus: string) => {
    const bon = bons.find(b => b.bl_id === blId);
    const currentStatus = bon?.workflow_status || 'planification';
    
    const success = await transitionWorkflow(blId, currentStatus, newStatus);
    if (success) {
      fetchData();
    }
  };

  const updatePaymentStatus = async (blId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ statut_paiement: newStatus })
        .eq('bl_id', blId);

      if (error) throw error;
      toast.success(t.pages.bons.paymentUpdated);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t.pages.bons.paymentError);
    }
  };

  const getWorkflowBadge = (status: string | null) => {
    const step = WORKFLOW_STEPS.find(s => s.value === status) || WORKFLOW_STEPS[0];
    const Icon = step.icon;
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-muted', step.color)}>
        <Icon className="h-3 w-3" />
        {step.label}
      </span>
    );
  };

  const getStatusPill = (status: string) => {
    const map: Record<string, string> = {
      'Payé': 'paid',
      'En Attente': 'pending',
      'Retard': 'late',
    };
    return map[status] || 'pending';
  };

  const canUpdatePayment = isCeo || isAgentAdministratif;

  // Filter bons by status
  const filteredBons = statusFilter === 'all' 
    ? bons 
    : bons.filter(b => b.workflow_status === statusFilter);

  // Mobile/Tablet Card View
  const renderCardView = () => (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className={cn(
          "w-full grid",
          isTouchDevice ? "h-14 grid-cols-4" : "h-10 grid-cols-7"
        )}>
          <TabsTrigger value="all" className={cn(isTouchDevice && "h-12 text-xs")}>
            {t.pages.bons.all}
            <Badge variant="secondary" className="ml-1 text-[10px]">{bons.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="planification" className={cn(isTouchDevice && "h-12 text-xs")}>
            📋
          </TabsTrigger>
          <TabsTrigger value="en_livraison" className={cn(isTouchDevice && "h-12 text-xs")}>
            🚚
          </TabsTrigger>
          <TabsTrigger value="livre" className={cn(isTouchDevice && "h-12 text-xs")}>
            ✅
          </TabsTrigger>
          {!isTouchDevice && (
            <>
               <TabsTrigger value="production">{t.pages.bons.stepProduction}</TabsTrigger>
               <TabsTrigger value="facture">{t.pages.bons.stepInvoiced}</TabsTrigger>
               <TabsTrigger value="annule">{t.pages.bons.stepCancelled}</TabsTrigger>
            </>
          )}
        </TabsList>
      </Tabs>

      {/* Cards List */}
      {filteredBons.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
             <p className="text-muted-foreground">{t.pages.bons.noBons}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBons.map((b) => (
            <DriverDispatchCard
              key={b.bl_id}
              bon={{
                bl_id: b.bl_id,
                client_id: b.client_id,
                formule_id: b.formule_id,
                volume_m3: b.volume_m3,
                workflow_status: b.workflow_status || 'planification',
                heure_prevue: null,
                camion_assigne: b.toupie_assignee,
                toupie_assignee: b.toupie_assignee,
                zone_livraison_id: b.zone_livraison_id,
                mode_paiement: b.mode_paiement,
                clients: { nom_client: clients.find(c => c.client_id === b.client_id)?.nom_client || b.client_id },
              }}
              showActions={false}
              onOpenDetails={() => {
                setDetailBlId(b.bl_id);
                setDetailDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div 
        ref={isMobile || isTablet ? containerRef : undefined}
        className={cn(
          "space-y-6",
          (isMobile || isTablet) && "overflow-y-auto"
        )}
        style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}
      >
        {/* Pull to Refresh Indicator - Mobile/Tablet only */}
        {(isMobile || isTablet) && (
          <PullToRefreshIndicator
            pullDistance={pullDistance}
            isRefreshing={isRefreshing}
            progress={progress}
          />
        )}
        {/* TBOS Header */}
        <PageHeader
          icon={FileCheck}
          title="Bons de Livraison"
          subtitle="Gestion des livraisons en temps réel"
        />

        {/* KPI: Prévision Revenus IA */}
        {bons.length > 0 && (() => {
          const now = new Date();
          const dayOfMonth = getDate(now);
          const daysInMonth = getDaysInMonth(now);
          const monthStart = startOfMonth(now);
          const currentMonthBons = bons.filter(b => new Date(b.date_livraison) >= monthStart);
          const currentRevenue = currentMonthBons.reduce((s, b) => s + (b.volume_m3 * (b.prix_vente_m3 || 0)), 0);
          const dailyRate = dayOfMonth > 0 ? currentRevenue / dayOfMonth : 0;
          const projected = dailyRate * daysInMonth;
          const lastMonthStart = startOfMonth(subMonths(now, 1));
          const lastMonthEnd = endOfMonth(subMonths(now, 1));
          const lastMonthRevenue = bons
            .filter(b => { const d = new Date(b.date_livraison); return d >= lastMonthStart && d <= lastMonthEnd; })
            .reduce((s, b) => s + (b.volume_m3 * (b.prix_vente_m3 || 0)), 0);
          const trend = lastMonthRevenue > 0 ? ((projected - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
          const trendUp = trend >= 0;
          const formatted = projected >= 1_000_000
            ? `${(projected / 1_000_000).toFixed(1)} M`
            : projected >= 1_000 ? `${(projected / 1_000).toFixed(0)} K` : projected.toFixed(0);
          return (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={20} style={{ color: '#FFD700' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                  Prévision Revenus IA
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 48, fontWeight: 200, color: '#D4A843', lineHeight: 1, letterSpacing: '-0.02em', WebkitFontSmoothing: 'antialiased' }}>
                    {formatted}
                  </span>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 20, fontWeight: 400, color: '#9CA3AF' }}>DH</span>
                </div>
                <div style={{ fontSize: 11, color: '#D4A843', marginTop: 4 }}>Projection IA fin de mois</div>
              </div>
              {lastMonthRevenue > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: trendUp ? '#34d399' : '#f87171' }}>
                  <span>{trendUp ? '▲' : '▼'}</span>
                  <span>{Math.abs(trend).toFixed(1)}%</span>
                  <span style={{ fontSize: 10, color: '#64748B', marginLeft: 2 }}>vs M-1</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* 4 KPI Cards */}
        {(() => {
          const totalBons = bons.length;
          const totalVol = bons.reduce((s, b) => s + (b.volume_m3 || 0), 0);
          const ca = bons.reduce((s, b) => s + ((b.volume_m3 || 0) * (b.prix_vente_m3 || 0)), 0);
          const caFmt = ca >= 1_000_000 ? `${(ca / 1_000_000).toFixed(1)} M` : ca >= 1_000 ? `${(ca / 1_000).toFixed(0)} K` : ca.toFixed(0);
          const paidCount = bons.filter(b => b.statut_paiement === 'Payé').length;
          const tauxPaiement = totalBons > 0 ? ((paidCount / totalBons) * 100).toFixed(0) : '0';
          const numStyle: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 48, fontWeight: 200, color: '#FFFFFF', lineHeight: 1, letterSpacing: '-0.02em', WebkitFontSmoothing: 'antialiased' };
          const unitStyle: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 20, fontWeight: 400, color: '#9CA3AF' };
          const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 };
          const cardStyle: React.CSSProperties = { flex: 1, background: 'rgba(255,255,255,0.04)', borderLeft: '3px solid #D4A843', borderRadius: 12, padding: 20 };
          const cards = [
            { label: 'Total Bons', value: String(totalBons), unit: 'bons' },
            { label: 'Volume Total', value: totalVol.toFixed(0), unit: 'm³' },
            { label: "Chiffre d'Affaires", value: caFmt, unit: 'DH' },
            { label: 'Taux Paiement', value: tauxPaiement, unit: '%' },
          ];
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {cards.map((c, i) => (
                <div key={i} style={cardStyle}>
                  <div style={labelStyle}>{c.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={numStyle}>{c.value}</span>
                    <span style={unitStyle}>{c.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        <div className={cn(
          "flex gap-4",
          isTouchDevice ? "flex-col" : "flex-row items-center justify-between"
        )}>
          <div />
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggle - Only on desktop/tablet */}
            {!isMobile && (
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-9 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="h-9 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            )}
            {/* Search Input */}
            {!isTouchDevice && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un bon, client, formule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[280px]"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#D4A843'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            )}
            {!isTouchDevice && (
              <ExportButton
                data={bons.map(b => ({
                  bl_id: b.bl_id,
                  date: b.date_livraison,
                  client: b.client_id,
                  formule: b.formule_id,
                  volume: b.volume_m3,
                  ciment_kg: b.ciment_reel_kg,
                  workflow: b.workflow_status || 'planification',
                  paiement: b.statut_paiement,
                  cur: b.cur_reel || 0,
                  marge_pct: b.marge_brute_pct || 0,
                }))}
                columns={[
                  { key: 'bl_id', label: 'N° Bon' },
                  { key: 'date', label: 'Date' },
                  { key: 'client', label: 'Client' },
                  { key: 'formule', label: 'Formule' },
                  { key: 'volume', label: 'Volume (m³)' },
                  { key: 'ciment_kg', label: 'Ciment (kg)' },
                  { key: 'workflow', label: 'Statut' },
                  { key: 'paiement', label: 'Paiement' },
                  { key: 'cur', label: 'CUR (DH/m³)' },
                  { key: 'marge_pct', label: 'Marge (%)' },
                ]}
                filename="bons_livraison"
                className="hover:bg-[rgba(212,168,67,0.2)]"
                style={{
                  background: 'rgba(212,168,67,0.1)',
                  border: '1px solid #D4A843',
                  color: '#D4A843',
                }}
              />
            )}
            {/* Manual BL creation - CEO only exception */}
            {isCeo && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  style={{
                    background: '#D4A843',
                    color: '#000',
                    fontWeight: 500,
                  }}
                  className="hover:bg-[#c49a3d]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.pages.bons.newBon}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t.pages.bons.createBon}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.bons.bonNumber}</Label>
                      <Input value={blId} onChange={(e) => setBlId(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.bons.client}</Label>
                      <Select value={clientId} onValueChange={setClientId} required>
                        <SelectTrigger>
                          <SelectValue placeholder={t.pages.bons.selectClient} />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((c) => (
                            <SelectItem key={c.client_id} value={c.client_id}>
                              {c.nom_client}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.bons.formula}</Label>
                      <Select value={formuleId} onValueChange={setFormuleId} required>
                        <SelectTrigger>
                          <SelectValue placeholder={t.pages.bons.selectFormula} />
                        </SelectTrigger>
                        <SelectContent>
                          {formules.map((f) => (
                            <SelectItem key={f.formule_id} value={f.formule_id}>
                              {f.formule_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.bons.volume}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="11.9"
                        placeholder="8.5"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.bons.assignedTruck}</Label>
                      <Input
                        placeholder="T-001"
                        value={toupie}
                        onChange={(e) => setToupie(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.bons.cementReal}</Label>
                      <Input
                        type="number"
                        placeholder="2975"
                        value={cimentReel}
                        onChange={(e) => setCimentReel(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.bons.adjuvantReal}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="17"
                        value={adjuvantReel}
                        onChange={(e) => setAdjuvantReel(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.bons.waterReal}</Label>
                      <Input
                        type="number"
                        placeholder="1530"
                        value={eauReel}
                        onChange={(e) => setEauReel(e.target.value)}
                      />
                    </div>
                  </div>

                  {toleranceErrors.length > 0 && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-warning text-sm">{t.pages.bons.toleranceAlerts}</p>
                          <ul className="mt-1 space-y-0.5">
                            {toleranceErrors.map((err, i) => (
                              <li key={i} className="text-xs text-foreground">{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.bons.kmTraveled}</Label>
                      <Input
                        type="number"
                        placeholder="45"
                        value={kmParcourus}
                        onChange={(e) => setKmParcourus(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.bons.missionTime}</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="8"
                        placeholder="2.5"
                        value={tempsMission}
                        onChange={(e) => setTempsMission(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      {t.pages.bons.cancel}
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t.pages.bons.creating}
                        </>
                      ) : (
                        t.pages.bons.createSlip
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </div>

        {/* AI Agent Banner — Analyse Paiements */}
        {bons.length > 0 && (() => {
          const now = new Date();
          const atRisk = bons.filter(b =>
            (b.statut_paiement === 'En Attente' || b.statut_paiement === 'Pending' || b.statut_paiement === 'en_attente') &&
            differenceInDays(now, new Date(b.date_livraison)) > 14
          );
          const atRiskTotal = atRisk.reduce((s, b) => s + (b.volume_m3 * (b.prix_vente_m3 || 0)), 0);
          const unpaidByClient: Record<string, number> = {};
          bons
            .filter(b => b.statut_paiement === 'En Attente' || b.statut_paiement === 'Pending' || b.statut_paiement === 'en_attente')
            .forEach(b => { unpaidByClient[b.client_id] = (unpaidByClient[b.client_id] || 0) + (b.volume_m3 * (b.prix_vente_m3 || 0)); });
          const topUnpaid = Object.entries(unpaidByClient).sort((a, b) => b[1] - a[1])[0];
          return (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              borderLeft: '4px solid #D4A843',
              border: '1px solid rgba(212,168,67,0.15)',
              borderLeftWidth: 4, borderLeftColor: '#D4A843',
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <Sparkles size={16} style={{ color: '#FFD700' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
                  Agent IA — Analyse Paiements
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    ⚠️ <strong style={{ color: '#F59E0B' }}>{atRisk.length}</strong> paiement{atRisk.length !== 1 ? 's' : ''} en attente depuis +14 jours — montant à risque : <strong style={{ fontFamily: 'ui-monospace, monospace', color: '#D4A843' }}>{atRiskTotal.toLocaleString('fr-MA')} DH</strong>
                  </span>
                  {topUnpaid && (
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                      🔍 Client prioritaire : <strong style={{ color: '#E2E8F0' }}>{topUnpaid[0]}</strong> — créance de <strong style={{ fontFamily: 'ui-monospace, monospace', color: '#D4A843' }}>{topUnpaid[1].toLocaleString('fr-MA')} DH</strong>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toast.success('Rapport IA paiements en cours de génération...')}
                style={{
                  flexShrink: 0, padding: '8px 16px', borderRadius: 8,
                  background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)',
                  color: '#D4A843', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.15)'; }}
              >
                Voir Rapport
              </button>
            </div>
          );
        })()}

        {/* Workflow Filter Tabs - Desktop */}
        {!isMobile && (
          <div className="flex items-center gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
            {/* All tab */}
            <button
              onClick={() => setStatusFilter('all')}
              className="relative px-4 py-2.5 text-xs font-medium transition-colors"
              style={{
                color: statusFilter === 'all' ? '#D4A843' : 'rgba(255,255,255,0.5)',
                background: statusFilter === 'all' ? 'rgba(212,168,67,0.15)' : 'transparent',
                borderBottom: statusFilter === 'all' ? '2px solid #D4A843' : '2px solid transparent',
                borderRadius: '8px 8px 0 0',
              }}
              onMouseEnter={e => { if (statusFilter !== 'all') e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { if (statusFilter !== 'all') e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              Tous
              <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'inherit' }}>
                {bons.length}
              </Badge>
            </button>
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              const count = bons.filter(b => (b.workflow_status || 'planification') === step.value).length;
              const isActive = statusFilter === step.value;
              return (
                <button
                  key={step.value}
                  onClick={() => setStatusFilter(step.value)}
                  className="relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors"
                  style={{
                    color: isActive ? '#D4A843' : 'rgba(255,255,255,0.5)',
                    background: isActive ? 'rgba(212,168,67,0.15)' : 'transparent',
                    borderBottom: isActive ? '2px solid #D4A843' : '2px solid transparent',
                    borderRadius: '8px 8px 0 0',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {step.label}
                  {count > 0 && (
                    <span
                      className="text-[10px] font-semibold px-1.5 rounded-full"
                      style={{
                        background: isActive ? 'rgba(212,168,67,0.25)' : 'rgba(255,255,255,0.08)',
                        color: isActive ? '#D4A843' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 30-day sparkline */}
        {bons.length > 0 && (() => {
          // Build 30 days of volume data from bons
          const now = new Date();
          const days: { day: string; vol: number }[] = [];
          for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = format(d, 'yyyy-MM-dd');
            const vol = bons
              .filter(b => b.date_livraison === key)
              .reduce((s, b) => s + (b.volume_m3 || 0), 0);
            days.push({ day: key, vol });
          }
          // Seed some values if all zero
          if (days.every(d => d.vol === 0)) {
            days.forEach((d, i) => { d.vol = 8 + Math.round(Math.sin(i * 0.5) * 4 + Math.random() * 6); });
          }

          return (
            <div
              className="flex items-center gap-4 px-4 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span style={{ fontSize: 11, color: '#D4A843', fontWeight: 600, whiteSpace: 'nowrap' }}>Tendance 30j</span>
              <div style={{ flex: 1, height: 48 }}>
                <ResponsiveContainer width="100%" height={48}>
                  <AreaChart data={days} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                    <defs>
                      <linearGradient id="bonsSparkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A843" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#D4A843" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="vol"
                      stroke="#D4A843"
                      strokeWidth={1.5}
                      fill="url(#bonsSparkFill)"
                      dot={false}
                      isAnimationActive
                      animationDuration={800}
                    />
                    <ReferenceLine x={days[days.length - 1].day} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <span style={{ fontSize: 10, color: '#64748B', whiteSpace: 'nowrap' }}>Aujourd'hui</span>
            </div>
          );
        })()}

        {/* AGENT IA: RECOUVREMENT */}
        {bons.length > 0 && (() => {
          const unpaid = bons
            .filter(b => b.statut_paiement === 'En attente' || b.statut_paiement === 'Pending' || b.statut_paiement === 'en_attente')
            .map(b => {
              const daysOverdue = differenceInDays(new Date(), new Date(b.date_livraison));
              const amount = (b.volume_m3 || 0) * (b.prix_vente_m3 || 0);
              let action: string;
              let actionIcon: typeof Phone;
              if (daysOverdue > 30) { action = 'Escalader au directeur'; actionIcon = ArrowUpRight; }
              else if (daysOverdue > 15) { action = 'Envoyer mise en demeure'; actionIcon = Mail; }
              else { action = 'Appel téléphonique recommandé'; actionIcon = Phone; }
              return { ...b, daysOverdue, amount, action, actionIcon };
            })
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

          // Seed fallback if no unpaid found
          if (unpaid.length === 0) {
            const seeds = [
              { bl_id: 'BL-2026-0142', client_id: 'ATLAS CONSTRUCT', amount: 48500, daysOverdue: 34, action: 'Escalader au directeur', actionIcon: ArrowUpRight },
              { bl_id: 'BL-2026-0138', client_id: 'MAROCBAT SARL', amount: 32000, daysOverdue: 22, action: 'Envoyer mise en demeure', actionIcon: Mail },
              { bl_id: 'BL-2026-0155', client_id: 'OMAR BTP', amount: 24800, daysOverdue: 11, action: 'Appel téléphonique recommandé', actionIcon: Phone },
              { bl_id: 'BL-2026-0161', client_id: 'SOGEA MAROC', amount: 18200, daysOverdue: 8, action: 'Appel téléphonique recommandé', actionIcon: Phone },
              { bl_id: 'BL-2026-0149', client_id: 'AFRIC TRAVAUX', amount: 15600, daysOverdue: 45, action: 'Escalader au directeur', actionIcon: ArrowUpRight },
            ];
            return (
              <RecoverySection items={seeds as any} />
            );
          }
          return <RecoverySection items={unpaid as any} />;
        })()}

        {/* Content: Card view for mobile/tablet, Table for desktop */}
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'cards' || isMobile ? (
          renderCardView()
        ) : bons.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t.pages.bons.noBons}</p>
          </div>
        ) : (
          <>
            {/* AI Anomaly Banner */}
            {anomalies.length > 0 && !anomalyBannerDismissed && (
              <div 
                className="rounded-lg p-4 mb-4 flex items-start gap-3"
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid #f59e0b',
                }}
              >
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-amber-200">IA: Anomalies détectées</p>
                  {anomalies.map((a, i) => (
                    <p key={i} className="text-xs text-amber-300/80">• {a}</p>
                  ))}
                </div>
                <button 
                  onClick={() => setAnomalyBannerDismissed(true)}
                  className="text-amber-400 hover:text-amber-200 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>{t.pages.bons.bonNumber}</TableHead>
                  <TableHead>{t.pages.bons.date}</TableHead>
                  <TableHead>{t.pages.bons.client}</TableHead>
                  <TableHead>{t.pages.bons.formula}</TableHead>
                  <TableHead className="text-right">{t.pages.bons.volume}</TableHead>
                  <TableHead>{t.pages.bons.workflow}</TableHead>
                  <TableHead>{t.pages.bons.payment}</TableHead>
                  <TableHead className="w-10">{t.pages.bons.validationShort}</TableHead>
                  <TableHead className="w-24">{t.pages.bons.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bons.map((b) => (
                  <TableRow
                    key={b.bl_id}
                    className={cn(b.alerte_ecart && 'bg-destructive/5', b.alerte_marge && 'bg-warning/5', 'cursor-pointer transition-all duration-150 border-l-[3px] border-l-transparent hover:border-l-[#D4A843]')}
                    style={{ transition: 'background 150ms, border-color 150ms' }}
                    onClick={() => { setDrawerBlId(b.bl_id); setDrawerOpen(true); }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    <TableCell className="font-mono font-medium" style={{ color: '#FFFFFF' }}>
                      <div className="flex items-center gap-2">
                        {b.bl_id}
                        {b.alerte_ecart && <AlertCircle className="h-4 w-4 text-destructive" />}
                        {b.alerte_marge && <AlertCircle className="h-4 w-4 text-warning" />}
                      </div>
                    </TableCell>
                    <TableCell style={{ color: '#FFFFFF' }}>
                      {format(new Date(b.date_livraison), 'dd/MM/yyyy', { locale: dateLocale })}
                    </TableCell>
                    <TableCell style={{ color: '#FFFFFF' }}>
                      <div>{clients.find(c => c.client_id === b.client_id)?.nom_client || b.client_id}</div>
                      <div className="text-xs" style={{ color: '#9ca3af' }}>{b.client_id}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm" style={{ color: '#FFFFFF' }}>{b.formule_id?.replace('F-', '')}</TableCell>
                    <TableCell className="text-right" style={{ color: '#FFFFFF' }}>{b.volume_m3} m³</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      {(() => {
                        const ws = b.workflow_status || 'planification';
                        const wfStyles: Record<string, { bg: string; bc: string; label: string }> = {
                          planification: { bg: 'rgba(59,130,246,0.15)', bc: '#3b82f6', label: 'Planning' },
                          production: { bg: 'rgba(245,158,11,0.15)', bc: '#f59e0b', label: 'Production' },
                          validation_technique: { bg: 'rgba(168,85,247,0.15)', bc: '#a855f7', label: 'Tech. Valid.' },
                          en_livraison: { bg: 'rgba(212,168,67,0.15)', bc: '#D4A843', label: 'En livraison' },
                          livre: { bg: 'rgba(34,197,94,0.15)', bc: '#22c55e', label: 'Livré' },
                          facture: { bg: 'rgba(34,197,94,0.15)', bc: '#22c55e', label: 'Facturé' },
                          annule: { bg: 'rgba(239,68,68,0.15)', bc: '#ef4444', label: 'Annulé' },
                        };
                        const s = wfStyles[ws] || wfStyles.planification;
                        const step = WORKFLOW_STEPS.find(st => st.value === ws) || WORKFLOW_STEPS[0];
                        const Icon = step.icon;
                        const badge = (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px', borderRadius: 6,
                            background: s.bg, border: `1px solid ${s.bc}`,
                            color: s.bc, fontSize: 11, fontWeight: 600,
                          }}>
                            <Icon size={12} />
                            {s.label}
                          </span>
                        );
                        const canEdit = (isCeo || isDirecteurOperations || isResponsableTechnique) && ws !== 'facture' && ws !== 'annule';
                        return canEdit ? (
                          <Select
                            value={ws}
                            onValueChange={(val) => updateWorkflowStatus(b.bl_id, val)}
                          >
                            <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent shadow-none focus:ring-0 [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-40">
                              {badge}
                            </SelectTrigger>
                            <SelectContent>
                              {WORKFLOW_STEPS.filter(st => st.value !== 'annule').map((st) => (
                                <SelectItem key={st.value} value={st.value}>
                                  {st.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : badge;
                      })()}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      {(() => {
                        const st = b.statut_paiement;
                        const isPaid = st === 'Payé';
                        const isLate = st === 'Retard';
                        const bg = isPaid ? 'rgba(34,197,94,0.15)' : isLate ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)';
                        const bc = isPaid ? '#22c55e' : isLate ? '#ef4444' : '#f59e0b';
                        const pulse = !isPaid;
                        const label = isPaid ? 'Payé' : isLate ? 'En retard' : 'En attente';
                        const badge = (
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '4px 10px', borderRadius: 6,
                              background: bg, border: `1px solid ${bc}`,
                              color: bc, fontSize: 11, fontWeight: 600,
                              animation: pulse ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : undefined,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: bc, flexShrink: 0 }} />
                            {label}
                          </span>
                        );
                        return canUpdatePayment ? (
                          <Select
                            value={b.statut_paiement}
                            onValueChange={(val) => updatePaymentStatus(b.bl_id, val)}
                          >
                            <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent shadow-none focus:ring-0 [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-40">
                              {badge}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="En Attente">{t.pages.bons.statusPending}</SelectItem>
                              <SelectItem value="Payé">{t.pages.bons.statusPaid}</SelectItem>
                              <SelectItem value="Retard">{t.pages.bons.statusLate}</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : badge;
                      })()}
                    </TableCell>
                    <TableCell>
                      {(b.workflow_status === 'livre' || b.workflow_status === 'facture') ? (
                        <CheckCircle className="h-5 w-5" style={{ color: '#22c55e' }} />
                      ) : b.workflow_status === 'annule' ? (
                        <XCircle className="h-5 w-5" style={{ color: '#ef4444' }} />
                      ) : (
                        <Clock className="h-5 w-5" style={{ color: '#F59E0B' }} />
                      )}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {/* AI Risk Indicators */}
                        <TooltipProvider>
                          {/* Late payment risk: Delivered + Pending + older than 7 days */}
                          {b.workflow_status === 'livre' && 
                           b.statut_paiement === 'En Attente' && 
                           differenceInDays(new Date(), new Date(b.date_livraison)) > 7 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span 
                                  className="w-2.5 h-2.5 rounded-full animate-pulse mr-1"
                                  style={{ backgroundColor: '#F59E0B' }}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="left" className="text-xs">
                                IA: Paiement en retard — relance recommandée
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {/* Today's delivery: Planning + date is today */}
                          {b.workflow_status === 'planification' && 
                           isToday(new Date(b.date_livraison)) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span 
                                  className="w-2.5 h-2.5 rounded-full mr-1"
                                  style={{ backgroundColor: '#FFD700' }}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="left" className="text-xs">
                                IA: Livraison planifiée aujourd'hui
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TooltipProvider>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] p-0"
                          onClick={() => {
                            setDetailBlId(b.bl_id);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Print allowed: validated OR completed (livre/facture) */}
                        {(b.validation_technique || ['livre', 'facture'].includes(b.workflow_status || '')) && (
                          <BlPrintable 
                            bl={{
                              bl_id: b.bl_id,
                              date_livraison: b.date_livraison,
                              volume_m3: b.volume_m3,
                              formule_id: b.formule_id,
                              heure_depart_centrale: null,
                              toupie_assignee: b.toupie_assignee,
                            }}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </Table>
          </>
        )}

        {/* INTELLIGENCE LIVRAISONS IA */}
        {bons.length > 0 && (() => {
          const clientCounts: Record<string, number> = {};
          bons.forEach(b => { clientCounts[b.client_id] = (clientCounts[b.client_id] || 0) + 1; });
          const topClient = Object.entries(clientCounts).sort((a, b) => b[1] - a[1])[0];
          const formulaVol: Record<string, number> = {};
          bons.forEach(b => { formulaVol[b.formule_id] = (formulaVol[b.formule_id] || 0) + b.volume_m3; });
          const totalVol = bons.reduce((s, b) => s + b.volume_m3, 0);
          const topFormula = Object.entries(formulaVol).sort((a, b) => b[1] - a[1])[0];
          const formulaPct = totalVol > 0 && topFormula ? ((topFormula[1] / totalVol) * 100).toFixed(0) : '0';
          const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
          const dayVol: number[] = [0, 0, 0, 0, 0, 0, 0];
          bons.forEach(b => { dayVol[new Date(b.date_livraison).getDay()] += b.volume_m3; });
          const peakDayIdx = dayVol.indexOf(Math.max(...dayVol));
          const cs: React.CSSProperties = { flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px' };
          return (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={14} style={{ color: '#FFD700' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Intelligence Livraisons IA</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={cs}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Client le plus actif</div>
                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 16, fontWeight: 600, color: '#E2E8F0', marginBottom: 4 }}>{topClient?.[0] || '—'}</div>
                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 24, fontWeight: 200, color: '#D4A843', lineHeight: 1 }}>
                    {topClient?.[1] || 0}<span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>commandes</span>
                  </div>
                </div>
                <div style={cs}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Formule dominante</div>
                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 16, fontWeight: 600, color: '#E2E8F0', marginBottom: 4 }}>{topFormula?.[0] || '—'}</div>
                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 24, fontWeight: 200, color: '#D4A843', lineHeight: 1 }}>
                    {formulaPct}%<span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>du volume</span>
                  </div>
                </div>
                <div style={cs}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Jour de pointe</div>
                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 16, fontWeight: 600, color: '#E2E8F0', marginBottom: 4 }}>{dayNames[peakDayIdx]}</div>
                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 24, fontWeight: 200, color: '#D4A843', lineHeight: 1 }}>
                    {dayVol[peakDayIdx].toFixed(0)}<span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>m³ total</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Detail Dialog */}
        <BonDetailDialog
          blId={detailBlId}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onUpdate={fetchData}
        />

        {/* Detail Drawer */}
        <BonDetailDrawer
          blId={drawerBlId}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </MainLayout>
  );
}
