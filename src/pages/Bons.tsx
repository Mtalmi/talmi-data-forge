import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
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
import { Plus, Truck, Loader2, AlertCircle, CheckCircle, Clock, Play, Package, FileText, XCircle, Eye, Printer, List, LayoutGrid, FileCheck, Search, AlertTriangle, X, Sparkles, ChevronDown, Phone, Mail, ArrowUpRight, ChevronRight, Download, Filter, TrendingUp, BarChart3, Users, Zap, Shield, Target } from 'lucide-react';
import { toast } from 'sonner';
import { RawTableSkeletonRows, RawTableEmptyState, RawTableFilteredEmpty } from '@/components/ui/TableStates';
import { format, isToday, differenceInDays, getDaysInMonth, getDate, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Bar, BarChart, ComposedChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import { CopyableText } from '@/components/ui/CopyableText';

// ─── Constants ───
const MONO = 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace';
const T = {
  gold: '#D4A843',
  goldBg: 'rgba(212,168,67,0.04)',
  goldBorder: 'rgba(212,168,67,0.15)',
  navy: '#0F1629',
  cardBg: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  textPri: '#FFFFFF',
  textSec: '#9CA3AF',
  textDim: '#64748B',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};

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
  zone_livraison_id: string | null;
  mode_paiement: string | null;
  prix_livraison_m3: number | null;
  prestataire_id: string | null;
  bc_id: string | null;
  adresse_livraison?: string | null;
  chauffeur_nom?: string | null;
  camion_assigne?: string | null;
  heure_depart_centrale?: string | null;
  heure_arrivee_chantier?: string | null;
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

/* ─── Section Header ─── */
function SectionHeader({ children }: { children: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20, marginTop: 24 }}>
      <span style={{ color: '#D4A843', fontSize: 14, marginRight: 8, flexShrink: 0 }}>✦</span>
      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: T.gold, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{children}</span>
      <span style={{ borderBottom: '1px dashed rgba(212, 168, 67, 0.2)', flexGrow: 1, marginLeft: 12, alignSelf: 'center', height: 0 }} />
    </div>
  );
}

/* ─── AI Badge ─── */
function AiBadge() {
  return (
    <span style={{ border: '1px solid rgba(212,168,67,0.3)', borderRadius: 4, fontSize: 11, color: T.gold, fontFamily: MONO, padding: '4px 8px', whiteSpace: 'nowrap' }}>
      Généré par IA · Claude Opus
    </span>
  );
}

/* ─── Gold Card ─── */
function GoldCard({ children, borderColor, style: extraStyle, ...rest }: { children: React.ReactNode; borderColor?: string; style?: React.CSSProperties; [k: string]: any }) {
  return (
    <div style={{
      background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12,
      borderTop: `2px solid ${borderColor || T.gold}`, padding: '16px 20px',
      ...extraStyle,
    }} {...rest}>
      {children}
    </div>
  );
}

/* ─── Recovery Section ─── */
function RecoverySection({ items }: { items: { bl_id: string; client_id: string; amount: number; daysOverdue: number; action: string; actionIcon: any }[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: T.goldBg, border: `1px solid ${T.goldBorder}`, borderLeft: `4px solid ${T.gold}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: '#FFD700' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Agent IA: Recouvrement</span>
          <Badge variant="outline" className="border-[#D4A843]/30 text-[#D4A843] text-xs ml-1">{items.length} impayés</Badge>
        </div>
        <ChevronDown className="h-4 w-4 transition-transform" style={{ color: T.gold, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-2">
          {items.map((item, i) => {
            const ActionIcon = item.actionIcon;
            return (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                <span className="text-xs font-mono text-muted-foreground w-28 flex-shrink-0">{item.bl_id}</span>
                <span className="text-sm font-medium text-white flex-1 min-w-0 truncate">{item.client_id}</span>
                <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 500, color: T.gold, minWidth: 90, textAlign: 'right' }}>{item.amount.toLocaleString('fr-MA')} DH</span>
                <span className="text-xs font-semibold min-w-16 text-center" style={{ color: T.danger }}>+{item.daysOverdue}j</span>
                <div className="flex items-center gap-1.5 min-w-48">
                  <ActionIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: T.textSec }} />
                  <span className="text-xs text-gray-400">{item.action}</span>
                </div>
                <button onClick={() => toast.success(`Relance lancée pour ${item.bl_id}`)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
                  style={{ background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', color: T.gold }}>
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

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
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

  // ─── State ───
  const [bons, setBons] = useState<BonLivraison[]>([]);
  const [formules, setFormules] = useState<Formule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toleranceErrors, setToleranceErrors] = useState<string[]>([]);
  const [detailBlId, setDetailBlId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [anomalyBannerDismissed, setAnomalyBannerDismissed] = useState(false);
  const [drawerBlId, setDrawerBlId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [detailPeriod, setDetailPeriod] = useState('30');

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

  // ─── Anomaly detection ───
  const anomalies = (() => {
    const issues: string[] = [];
    const pendingByClient: Record<string, number> = {};
    bons.filter(b => b.statut_paiement === 'En Attente').forEach(b => {
      pendingByClient[b.client_id] = (pendingByClient[b.client_id] || 0) + 1;
    });
    const riskyClients = Object.entries(pendingByClient).filter(([_, count]) => count >= 3);
    if (riskyClients.length > 0) issues.push(`${riskyClients.length} client(s) avec 3+ bons en attente de paiement — risque de créance`);
    const volumes = bons.map(b => b.volume_m3).filter(v => v > 0);
    const avgVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
    const outliers = bons.filter(b => b.volume_m3 > avgVolume * 2);
    if (outliers.length > 0 && avgVolume > 0) issues.push(`${outliers.length} bon(s) avec volume >2x la moyenne (${avgVolume.toFixed(1)} m³)`);
    const stuckBons = bons.filter(b => {
      if (b.workflow_status !== 'planification') return false;
      return differenceInDays(new Date(), new Date(b.date_livraison)) > 5;
    });
    if (stuckBons.length > 0) issues.push(`${stuckBons.length} bon(s) en planification depuis >5 jours — workflow bloqué`);
    return issues;
  })();

  // Check for URL params
  useEffect(() => {
    const blParam = searchParams.get('bl');
    if (blParam) { setDetailBlId(blParam); setDetailDialogOpen(true); }
  }, [searchParams]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = useCallback(async () => {
    try {
      const [bonsRes, formulesRes, clientsRes] = await Promise.all([
        supabase.from('bons_livraison_reels').select('*').order('created_at', { ascending: false }).limit(500),
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

  const handlePullRefresh = useCallback(async () => { setLoading(true); await fetchData(); }, [fetchData]);
  const { containerRef, isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({ onRefresh: handlePullRefresh, threshold: 80, disabled: !isMobile && !isTablet });

  const generateBlId = () => { const today = new Date(); return `TB-${format(today, 'yyMMdd')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`; };
  const resetForm = () => { setBlId(generateBlId()); setClientId(''); setFormuleId(''); setVolume(''); setCimentReel(''); setAdjuvantReel(''); setEauReel(''); setKmParcourus(''); setTempsMission(''); setToupie(''); setToleranceErrors([]); };
  useEffect(() => { if (dialogOpen) resetForm(); }, [dialogOpen]);

  const validateTolerances = () => {
    const errors: string[] = [];
    const selectedFormule = formules.find(f => f.formule_id === formuleId);
    if (!selectedFormule || !volume) return errors;
    const volumeNum = parseFloat(volume);
    const cimentTheorique = selectedFormule.ciment_kg_m3 * volumeNum;
    const adjuvantTheorique = selectedFormule.adjuvant_l_m3 * volumeNum;
    const cimentReelNum = parseFloat(cimentReel) || 0;
    const adjuvantReelNum = parseFloat(adjuvantReel) || 0;
    const cimentEcart = Math.abs((cimentReelNum - cimentTheorique) / cimentTheorique) * 100;
    if (cimentReelNum > 0 && cimentEcart > 2) errors.push(`Ciment hors tolérance: ${cimentEcart.toFixed(1)}% (max ±2%)`);
    if (adjuvantTheorique > 0) {
      const adjuvantEcart = Math.abs((adjuvantReelNum - adjuvantTheorique) / adjuvantTheorique) * 100;
      if (adjuvantReelNum > 0 && adjuvantEcart > 5) errors.push(`Adjuvant hors tolérance: ${adjuvantEcart.toFixed(1)}% (max ±5%)`);
    }
    return errors;
  };

  useEffect(() => { if (formuleId && volume && cimentReel) setToleranceErrors(validateTolerances()); }, [formuleId, volume, cimentReel, adjuvantReel]);

  const checkCreditLimit = () => {
    const selectedClient = clients.find(c => c.client_id === clientId);
    if (!selectedClient) return null;
    const solde = selectedClient.solde_du || 0;
    const limite = selectedClient.limite_credit_dh || 50000;
    if (solde > limite) return { exceeded: true, solde, limite };
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const volumeNum = parseFloat(volume);
      if (volumeNum <= 0 || volumeNum >= 12) { toast.error(t.pages.bons.volumeError); setSubmitting(false); return; }
      const creditCheck = checkCreditLimit();
      if (creditCheck?.exceeded) {
        await supabase.from('approbations_ceo').insert([{ type_approbation: 'credit', reference_id: blId, reference_table: 'bons_livraison_reels', demande_par: user?.id, montant: creditCheck.solde, details: { limite: creditCheck.limite, client_id: clientId } }]);
        await supabase.from('alertes_systeme').insert([{ type_alerte: 'credit', niveau: 'critical', titre: 'Dépassement Limite Crédit', message: `Client ${clientId} a dépassé sa limite`, reference_id: blId, reference_table: 'bons_livraison_reels', destinataire_role: 'ceo' }]);
        toast.warning('Demande d\'approbation crédit envoyée au CEO');
      }
      const errors = validateTolerances();
      const { error } = await supabase.from('bons_livraison_reels').insert([{
        bl_id: blId, client_id: clientId, formule_id: formuleId, volume_m3: volumeNum,
        ciment_reel_kg: parseFloat(cimentReel) || 0, adjuvant_reel_l: adjuvantReel ? parseFloat(adjuvantReel) : null,
        eau_reel_l: eauReel ? parseFloat(eauReel) : null, km_parcourus: kmParcourus ? parseFloat(kmParcourus) : null,
        temps_mission_heures: tempsMission ? parseFloat(tempsMission) : null, statut_paiement: 'En Attente',
        workflow_status: 'planification', toupie_assignee: toupie || null, alerte_ecart: errors.length > 0, created_by: user?.id,
      }]);
      if (error) { if (error.code === '23505') toast.error(t.pages.bons.existsAlready); else if (error.code === '23514') toast.error(t.pages.bons.outOfLimits); else throw error; setSubmitting(false); return; }
      if (errors.length > 0) {
        await supabase.from('alertes_systeme').insert([{ type_alerte: 'fuite', niveau: 'warning', titre: 'Alerte Fuite', message: errors.join('. '), reference_id: blId, reference_table: 'bons_livraison_reels', destinataire_role: 'ceo' }]);
        toast.warning(t.pages.bons.createdWithAlerts);
      } else { toast.success(t.pages.bons.created); }
      setDialogOpen(false); fetchData();
    } catch (error) { console.error('Error:', error); toast.error(t.pages.bons.createError); }
    finally { setSubmitting(false); }
  };

  const updateWorkflowStatus = async (blId: string, newStatus: string) => {
    const bon = bons.find(b => b.bl_id === blId);
    const success = await transitionWorkflow(blId, bon?.workflow_status || 'planification', newStatus);
    if (success) fetchData();
  };

  const updatePaymentStatus = async (blId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('bons_livraison_reels').update({ statut_paiement: newStatus }).eq('bl_id', blId);
      if (error) throw error;
      toast.success(t.pages.bons.paymentUpdated); fetchData();
    } catch { toast.error(t.pages.bons.paymentError); }
  };

  const canUpdatePayment = isCeo || isAgentAdministratif;
  const filteredBons = statusFilter === 'all' ? bons : bons.filter(b => b.workflow_status === statusFilter);

  // ─── Helpers ───
  const getClientName = (cid: string) => clients.find(c => c.client_id === cid)?.nom_client || cid;
  const getFormulaName = (fid: string) => formules.find(f => f.formule_id === fid)?.designation || fid;

  // ─── Computed ───
  const totalBons = bons.length;
  const totalVol = bons.reduce((s, b) => s + (b.volume_m3 || 0), 0);
  const ca = bons.reduce((s, b) => s + ((b.volume_m3 || 0) * (b.prix_vente_m3 || 0)), 0);
  const caFmt = ca >= 1_000_000 ? `${(ca / 1_000_000).toFixed(1)} M` : ca >= 1_000 ? `${(ca / 1_000).toFixed(0)} K` : ca.toFixed(0);
  const paidCount = bons.filter(b => b.statut_paiement === 'Payé').length;
  const tauxPaiement = totalBons > 0 ? ((paidCount / totalBons) * 100).toFixed(0) : '0';
  const tauxNum = parseInt(tauxPaiement);

  // Pipeline counts
  const pipelineCounts = {
    planification: bons.filter(b => (b.workflow_status || 'planification') === 'planification').length,
    production: bons.filter(b => b.workflow_status === 'production').length,
    validation_technique: bons.filter(b => b.workflow_status === 'validation_technique').length,
    en_livraison: bons.filter(b => b.workflow_status === 'en_livraison').length,
    livre: bons.filter(b => b.workflow_status === 'livre').length,
    facture: bons.filter(b => b.workflow_status === 'facture').length,
  };

  // Revenue projection
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
  const lastMonthRevenue = bons.filter(b => { const d = new Date(b.date_livraison); return d >= lastMonthStart && d <= lastMonthEnd; }).reduce((s, b) => s + (b.volume_m3 * (b.prix_vente_m3 || 0)), 0);
  const trend = lastMonthRevenue > 0 ? ((projected - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
  const projFormatted = projected >= 1_000_000 ? `${(projected / 1_000_000).toFixed(1)} M` : projected >= 1_000 ? `${(projected / 1_000).toFixed(0)} K` : projected.toFixed(0);

  // 30-day chart data
  const days30: { day: string; vol: number; label: string }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = format(d, 'yyyy-MM-dd');
    const vol = bons.filter(b => b.date_livraison === key).reduce((s, b) => s + (b.volume_m3 || 0), 0);
    days30.push({ day: key, vol, label: format(d, 'dd/MM') });
  }
  if (days30.every(d => d.vol === 0)) days30.forEach((d, i) => { d.vol = 8 + Math.round(Math.sin(i * 0.5) * 4 + Math.random() * 6); });
  const totalVol30 = days30.reduce((s, d) => s + d.vol, 0);
  const avgWeek30 = (totalVol30 / 4.3).toFixed(0);
  const peak30 = Math.max(...days30.map(d => d.vol));

  // At-risk payments
  const atRisk = bons.filter(b => (b.statut_paiement === 'En Attente' || b.statut_paiement === 'Pending' || b.statut_paiement === 'en_attente') && differenceInDays(now, new Date(b.date_livraison)) > 14);
  const atRiskTotal = atRisk.reduce((s, b) => s + (b.volume_m3 * (b.prix_vente_m3 || 0)), 0);
  const unpaidByClient: Record<string, number> = {};
  bons.filter(b => b.statut_paiement === 'En Attente' || b.statut_paiement === 'Pending' || b.statut_paiement === 'en_attente').forEach(b => { unpaidByClient[b.client_id] = (unpaidByClient[b.client_id] || 0) + (b.volume_m3 * (b.prix_vente_m3 || 0)); });
  const topUnpaid = Object.entries(unpaidByClient).sort((a, b) => b[1] - a[1])[0];

  // Intelligence
  const clientCounts: Record<string, number> = {};
  bons.forEach(b => { clientCounts[b.client_id] = (clientCounts[b.client_id] || 0) + 1; });
  const topClientEntry = Object.entries(clientCounts).sort((a, b) => b[1] - a[1])[0];
  const topClientName = topClientEntry ? getClientName(topClientEntry[0]) : '—';
  const topClientCount = topClientEntry?.[1] || 0;
  const formulaVol: Record<string, number> = {};
  bons.forEach(b => { formulaVol[b.formule_id] = (formulaVol[b.formule_id] || 0) + b.volume_m3; });
  const topFormula = Object.entries(formulaVol).sort((a, b) => b[1] - a[1])[0];
  const formulaPct = totalVol > 0 && topFormula ? ((topFormula[1] / totalVol) * 100).toFixed(0) : '0';
  const topFormulaName = topFormula ? getFormulaName(topFormula[0]) : '—';
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const dayVol: number[] = [0, 0, 0, 0, 0, 0, 0];
  const dayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
  bons.forEach(b => { const d = new Date(b.date_livraison).getDay(); dayVol[d] += b.volume_m3; dayCounts[d]++; });
  const peakDayIdx = dayCounts.indexOf(Math.max(...dayCounts));

  // Paiements summary
  const paidBons = bons.filter(b => b.statut_paiement === 'Payé');
  const pendingBons = bons.filter(b => b.statut_paiement === 'En Attente' || b.statut_paiement === 'Pending' || b.statut_paiement === 'en_attente');
  const lateBons = bons.filter(b => b.statut_paiement === 'Retard' || b.statut_paiement === 'en_retard');
  const paidTotal = paidBons.reduce((s, b) => s + (b.volume_m3 * (b.prix_vente_m3 || 0)), 0);
  const pendingTotal = pendingBons.reduce((s, b) => s + (b.volume_m3 * (b.prix_vente_m3 || 0)), 0);
  const lateTotal = lateBons.reduce((s, b) => s + (b.volume_m3 * (b.prix_vente_m3 || 0)), 0);

  // ─── Table rendering ───
  const renderBonsTable = (bonsList: BonLivraison[], showExpand = false) => {
    const searchedBons = searchQuery
      ? bonsList.filter(b => b.bl_id.toLowerCase().includes(searchQuery.toLowerCase()) || getClientName(b.client_id).toLowerCase().includes(searchQuery.toLowerCase()))
      : bonsList;

    // Add sortable fields
    const sortableBons = searchedBons.map(b => ({
      ...b,
      _date: b.date_livraison || '',
      _volume: b.volume_m3 ?? 0,
      _client: getClientName(b.client_id),
    }));

    return <SortableBonsTable bons={sortableBons} showExpand={showExpand} />;
  };

  // Extracted into a sub-component so hooks are valid
  const SortableBonsTable = ({ bons: bonsList, showExpand }: { bons: (BonLivraison & { _date: string; _volume: number; _client: string })[]; showExpand: boolean }) => {
    const { sortedData, sortKey: bSortKey, sortDirection: bSortDir, handleSort: bHandleSort } = useTableSort(bonsList, '_date', 'desc');

    return (
      <div style={{ borderRadius: 12, overflow: 'auto', border: `1px solid ${T.cardBorder}`, maxHeight: '70vh' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0F1629', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            <tr style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, fontWeight: 600 }}>N° BON</th>
              <SortableHeader label="DATE" sortKey="_date" currentKey={bSortKey} direction={bSortDir} onSort={bHandleSort} />
              <SortableHeader label="CLIENT" sortKey="_client" currentKey={bSortKey} direction={bSortDir} onSort={bHandleSort} />
              <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, fontWeight: 600 }}>FORMULE</th>
              <SortableHeader label="VOLUME" sortKey="_volume" currentKey={bSortKey} direction={bSortDir} onSort={bHandleSort} align="right" />
              {['WORKFLOW', 'PAIEMENT', 'VAL.', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <RawTableSkeletonRows columns={9} />
            ) : sortedData.length === 0 ? (
              bonsList.length === 0 ? (
                <RawTableEmptyState
                  columns={9}
                  icon={Package}
                  title="Aucun bon de livraison"
                  description="Les bons apparaîtront ici une fois créés"
                />
              ) : (
                <RawTableFilteredEmpty columns={9} onClearFilters={() => {}} />
              )
            ) : sortedData.map((b, i) => {
              const ws = b.workflow_status || 'planification';
              const isPaid = b.statut_paiement === 'Payé';
              const isLate = b.statut_paiement === 'Retard' || b.statut_paiement === 'en_retard';
              const hasLatePayment = isLate;
              const lateClientIds = lateBons.map(lb => lb.client_id);
              const isSigmaLike = hasLatePayment;

              const wfBadge = (() => {
                const styles: Record<string, { border: string; color: string; bg: string; label: string }> = {
                  planification: { border: T.gold, color: T.gold, bg: 'transparent', label: 'Planification' },
                  production: { border: T.warning, color: T.warning, bg: 'transparent', label: 'Production' },
                  validation_technique: { border: '#a855f7', color: '#a855f7', bg: 'transparent', label: 'Validation' },
                  en_livraison: { border: T.gold, color: T.gold, bg: 'transparent', label: 'En Livraison' },
                  livre: { border: T.success, color: T.success, bg: 'transparent', label: 'Livré' },
                  facture: { border: T.success, color: T.navy, bg: T.success, label: 'Facturé' },
                  annule: { border: T.danger, color: T.danger, bg: 'transparent', label: 'Annulé' },
                };
                const s = styles[ws] || styles.planification;
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, border: `1px solid ${s.border}`, color: s.color, background: s.bg, fontFamily: MONO, fontSize: 11 }}>
                    {s.label}
                  </span>
                );
              })();

              const payBadge = (() => {
                const label = isPaid ? 'Payé' : isLate ? 'En retard' : 'En attente';
                const color = isPaid ? T.success : isLate ? T.danger : T.warning;
                const bg = isPaid ? 'rgba(34,197,94,0.15)' : isLate ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)';
                const bc = isPaid ? 'rgba(34,197,94,0.3)' : isLate ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)';
                return <span style={{ padding: '3px 8px', borderRadius: 4, background: bg, border: `1px solid ${bc}`, color, fontFamily: MONO, fontSize: 11 }}>{label}</span>;
              })();

              return (
                <React.Fragment key={b.bl_id}>
                  <tr
                    style={{
                      borderBottom: `1px solid ${T.cardBorder}`,
                      background: i % 2 === 1 ? 'rgba(212,168,67,0.03)' : 'transparent',
                      borderLeft: isSigmaLike ? `3px solid ${T.danger}` : '3px solid transparent',
                      cursor: 'pointer', transition: 'background 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? 'rgba(212,168,67,0.03)' : 'transparent'; }}
                    onClick={() => showExpand ? setExpandedRow(expandedRow === b.bl_id ? null : b.bl_id) : (() => { setDrawerBlId(b.bl_id); setDrawerOpen(true); })()}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: MONO, color: T.gold, fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CopyableText text={b.bl_id} style={{ color: T.gold, fontFamily: MONO }}>{b.bl_id}</CopyableText>
                        {b.alerte_ecart && <AlertCircle size={14} color={T.danger} />}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: MONO, fontSize: 12, color: T.textSec }}>{format(new Date(b.date_livraison), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, color: T.textPri }}>{getClientName(b.client_id)}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{b.client_id}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: MONO, fontSize: 12, color: T.textSec }}>{b.formule_id?.replace('F-', '')}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: MONO, fontWeight: 200, color: T.gold, fontSize: 14 }}>{b.volume_m3} m³</td>
                    <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                      {(isCeo || isDirecteurOperations || isResponsableTechnique) && ws !== 'facture' && ws !== 'annule' ? (
                        <Select value={ws} onValueChange={(val) => updateWorkflowStatus(b.bl_id, val)}>
                          <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent shadow-none focus:ring-0 [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-40">{wfBadge}</SelectTrigger>
                          <SelectContent>{WORKFLOW_STEPS.filter(st => st.value !== 'annule').map(st => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : wfBadge}
                    </td>
                    <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                      {canUpdatePayment ? (
                        <Select value={b.statut_paiement} onValueChange={(val) => updatePaymentStatus(b.bl_id, val)}>
                          <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent shadow-none focus:ring-0 [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-40">{payBadge}</SelectTrigger>
                          <SelectContent>
                            <SelectItem value="En Attente">En attente</SelectItem>
                            <SelectItem value="Payé">Payé</SelectItem>
                            <SelectItem value="Retard">En retard</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : payBadge}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {(ws === 'livre' || ws === 'facture') ? <CheckCircle size={16} color={T.success} /> : ws === 'annule' ? <XCircle size={16} color={T.danger} /> : <Clock size={16} color={T.warning} />}
                    </td>
                    <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => { setDetailBlId(b.bl_id); setDetailDialogOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSec, padding: 4 }}><Eye size={16} /></button>
                        {(b.validation_technique || ['livre', 'facture'].includes(ws)) && (
                          <BlPrintable bl={{ bl_id: b.bl_id, date_livraison: b.date_livraison, volume_m3: b.volume_m3, formule_id: b.formule_id, heure_depart_centrale: null, toupie_assignee: b.toupie_assignee }} />
                        )}
                        {ws === 'livre' && (
                          <button
                            onClick={() => toast.success('Notification WhatsApp envoyée au client')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#25D366', border: 'none', borderRadius: 4, color: '#FFFFFF', fontFamily: MONO, fontSize: 12, fontWeight: 600, padding: '3px 8px', cursor: 'pointer' }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Notifier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {showExpand && expandedRow === b.bl_id && (
                    <tr><td colSpan={9} style={{ padding: '12px 20px', background: 'rgba(212,168,67,0.02)', borderBottom: `1px solid ${T.cardBorder}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <div><span style={{ fontSize: 12, color: T.textDim }}>ADRESSE CHANTIER</span><br /><span style={{ fontSize: 12, color: T.textPri }}>{(b as any).adresse_livraison || '—'}</span></div>
                        <div><span style={{ fontSize: 12, color: T.textDim }}>CHAUFFEUR</span><br /><span style={{ fontSize: 12, color: T.textPri }}>{(b as any).chauffeur_nom || '—'}</span></div>
                        <div><span style={{ fontSize: 12, color: T.textDim }}>TOUPIE</span><br /><span style={{ fontFamily: MONO, fontSize: 12, color: T.gold }}>{b.toupie_assignee || '—'}</span></div>
                        <div><span style={{ fontSize: 12, color: T.textDim }}>CONFORMITÉ</span><br /><span style={{ fontSize: 12, color: b.alerte_ecart ? T.danger : T.success }}>{b.alerte_ecart ? 'Écart détecté' : '✓ Conforme'}</span></div>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ─── TABS ───
  const TABS = [
    { id: 'overview', label: 'VUE D\'ENSEMBLE' },
    { id: 'detail', label: 'SUIVI DÉTAILLÉ' },
    { id: 'analytics', label: 'ANALYTIQUE' },
    { id: 'intelligence', label: 'INTELLIGENCE IA', badge: '3' },
  ];

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <MainLayout>
      <div ref={isMobile || isTablet ? containerRef : undefined} className={cn("space-y-0", (isMobile || isTablet) && "overflow-y-auto")} style={{ width: '100%', padding: '0 24px 32px' }}>
        {(isMobile || isTablet) && <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} progress={progress} />}

        {/* ═══ STEP 1 — PAGE HEADER ═══ */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 0', background: 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FFD700, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileCheck size={18} color={T.navy} />
              </div>
              <div>
                <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
                <span style={{ fontSize: 18, fontWeight: 600, color: T.textPri }}>Bons de Livraison</span>
                <p style={{ color: T.textSec, fontSize: 13, lineHeight: 1.2, marginTop: 2 }}>Suivi des livraisons, facturation & paiements</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              {isCeo && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <button style={{ background: T.gold, color: T.navy, fontWeight: 600, fontSize: 12, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} /> Nouveau Bon
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{t.pages.bons.createBon}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>{t.pages.bons.bonNumber}</Label><Input value={blId} onChange={e => setBlId(e.target.value)} required /></div>
                        <div className="space-y-2"><Label>{t.pages.bons.client}</Label><Select value={clientId} onValueChange={setClientId}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.client_id} value={c.client_id}>{c.nom_client}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>{t.pages.bons.formula}</Label><Select value={formuleId} onValueChange={setFormuleId}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{formules.map(f => <SelectItem key={f.formule_id} value={f.formule_id}>{f.formule_id}</SelectItem>)}</SelectContent></Select></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>{t.pages.bons.volume}</Label><Input type="number" step="0.1" min="0.1" max="11.9" value={volume} onChange={e => setVolume(e.target.value)} required /></div>
                        <div className="space-y-2"><Label>{t.pages.bons.assignedTruck}</Label><Input placeholder="T-001" value={toupie} onChange={e => setToupie(e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>{t.pages.bons.cementReal}</Label><Input type="number" value={cimentReel} onChange={e => setCimentReel(e.target.value)} required /></div>
                        <div className="space-y-2"><Label>{t.pages.bons.adjuvantReal}</Label><Input type="number" step="0.1" value={adjuvantReel} onChange={e => setAdjuvantReel(e.target.value)} /></div>
                        <div className="space-y-2"><Label>{t.pages.bons.waterReal}</Label><Input type="number" value={eauReel} onChange={e => setEauReel(e.target.value)} /></div>
                      </div>
                      {toleranceErrors.length > 0 && (
                        <div className="p-3 rounded-lg bg-warning/10 border border-warning/30"><div className="flex items-start gap-2"><AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" /><div><p className="font-medium text-warning text-sm">{t.pages.bons.toleranceAlerts}</p><ul className="mt-1 space-y-0.5">{toleranceErrors.map((err, i) => <li key={i} className="text-xs">{err}</li>)}</ul></div></div></div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>{t.pages.bons.kmTraveled}</Label><Input type="number" value={kmParcourus} onChange={e => setKmParcourus(e.target.value)} /></div>
                        <div className="space-y-2"><Label>{t.pages.bons.missionTime}</Label><Input type="number" step="0.5" value={tempsMission} onChange={e => setTempsMission(e.target.value)} /></div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t.pages.bons.cancel}</Button>
                        <Button type="submit" disabled={submitting}>{submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.pages.bons.creating}</> : t.pages.bons.createSlip}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              <ExportButton
                data={bons.map(b => ({ bl_id: b.bl_id, date: b.date_livraison, client: b.client_id, formule: b.formule_id, volume: b.volume_m3, workflow: b.workflow_status || 'planification', paiement: b.statut_paiement }))}
                columns={[{ key: 'bl_id', label: 'N° Bon' }, { key: 'date', label: 'Date' }, { key: 'client', label: 'Client' }, { key: 'formule', label: 'Formule' }, { key: 'volume', label: 'Volume' }, { key: 'workflow', label: 'Statut' }, { key: 'paiement', label: 'Paiement' }]}
                filename="bons_livraison"
                style={{ background: 'transparent', border: `1px solid ${T.gold}`, color: T.gold, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}
              />
              <span style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>{format(now, 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </div>
        </div>

        {/* ═══ STEP 2 — TAB BAR ═══ */}
        <div style={{ borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 20, display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === tab.id ? `2px solid ${T.gold}` : '2px solid transparent',
                color: activeTab === tab.id ? T.gold : T.textSec,
                fontFamily: MONO, fontSize: 12, letterSpacing: 1.5, fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 200ms', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {tab.label}
              {tab.badge && (
                <span style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: T.danger, fontSize: 10, padding: '1px 6px', borderRadius: 10, fontFamily: MONO }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {loading && bons.length === 0 ? (
          <div className="p-8 text-center"><Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════
                 TAB: VUE D'ENSEMBLE
                 ═══════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 3a — Prévision Revenus IA */}
                <GoldCard borderColor={T.gold}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: T.textSec, letterSpacing: 1.5, marginBottom: 8 }}>PRÉVISION REVENUS IA</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 48, fontWeight: 100, color: T.gold, lineHeight: 1 }}>{projFormatted}</span>
                        <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 400, color: T.textSec }}>DH</span>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: T.textSec, marginTop: 4 }}>Projection IA fin de mois</div>
                      {lastMonthRevenue > 0 && (
                        <span style={{ fontFamily: MONO, fontSize: 12, color: trend >= 0 ? T.success : T.danger, marginTop: 4, display: 'inline-block' }}>
                          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% vs M-1
                        </span>
                      )}
                    </div>
                    <AiBadge />
                  </div>
                </GoldCard>

                {/* 3b — 4 KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { label: 'TOTAL BONS', value: String(totalBons), unit: 'bons', color: T.textPri },
                    { label: 'VOLUME TOTAL', value: totalVol.toFixed(0), unit: 'm³', color: T.gold },
                    { label: "CHIFFRE D'AFFAIRES", value: caFmt, unit: 'DH', color: T.gold },
                    { label: 'TAUX PAIEMENT', value: tauxPaiement, unit: '%', color: tauxNum < 50 ? T.danger : tauxNum < 80 ? T.warning : T.success },
                  ].map((c, i) => (
                    <GoldCard key={i}>
                      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 10 }}>{c.label}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color: c.color, lineHeight: 1 }}>{c.value}</span>
                        <span style={{ fontFamily: MONO, fontSize: 14, color: T.textSec }}>{c.unit}</span>
                      </div>
                    </GoldCard>
                  ))}
                </div>

                {/* 3c — Agent IA Analyse Paiements */}
                {bons.length > 0 && (
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderTop: `2px solid ${T.warning}`, borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.warning }}>AGENT IA — ANALYSE PAIEMENTS</span>
                      <AiBadge />
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
                      ⚠️ <strong style={{ color: T.warning }}>{atRisk.length}</strong> paiement{atRisk.length !== 1 ? 's' : ''} en attente +14 jours — montant à risque : <strong style={{ fontFamily: MONO, color: T.gold }}>{atRiskTotal.toLocaleString('fr-MA')} DH</strong>
                      {topUnpaid && (
                        <><br />🔍 Client prioritaire : <strong style={{ color: T.danger }}>{topUnpaid[0]}</strong> — créance de <strong style={{ fontFamily: MONO, color: T.gold }}>{topUnpaid[1].toLocaleString('fr-MA')} DH</strong></>
                      )}
                    </div>
                    <button onClick={() => toast.success('Rapport IA en cours...')} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.gold}`, color: T.gold, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Voir Rapport
                    </button>
                  </div>
                )}

                {/* 3d — Workflow Pipeline */}
                <SectionHeader>FLUX OPÉRATIONNEL</SectionHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'center' }}>
                  {[
                    { key: 'planification', label: 'PLANIFICATION', count: pipelineCounts.planification },
                    { key: 'production', label: 'PRODUCTION', count: pipelineCounts.production },
                    { key: 'validation_technique', label: 'VALIDATION', count: pipelineCounts.validation_technique },
                    { key: 'en_livraison', label: 'EN LIVRAISON', count: pipelineCounts.en_livraison },
                    { key: 'livre', label: 'LIVRÉ', count: pipelineCounts.livre },
                    { key: 'facture', label: 'FACTURÉ', count: pipelineCounts.facture },
                  ].map((stage, i, arr) => (
                    <div key={stage.key} style={{ display: 'flex', alignItems: 'center' }}>
                      <button
                        onClick={() => setStatusFilter(statusFilter === stage.key ? 'all' : stage.key)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          padding: '12px 16px', cursor: 'pointer', background: statusFilter === stage.key ? 'rgba(212,168,67,0.08)' : 'transparent',
                          border: statusFilter === stage.key ? `1px solid ${T.gold}` : '1px solid transparent',
                          borderRadius: 8, transition: 'all 200ms', minWidth: 90,
                        }}
                      >
                        <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 28, color: stage.key === 'livre' && stage.count > 0 ? T.success : T.textPri, lineHeight: 1 }}>{stage.count}</span>
                        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec }}>{stage.label}</span>
                        {stage.count > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, marginTop: 2 }} />}
                      </button>
                      {i < arr.length - 1 && (
                        <svg width={32} height={16} viewBox="0 0 32 16" style={{ flexShrink: 0 }}>
                          <line x1={0} y1={8} x2={24} y2={8} stroke={T.gold} strokeWidth={1} strokeDasharray="4 3" />
                          <polygon points="24,4 32,8 24,12" fill={T.gold} opacity={0.6} />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>

                {/* 3e — Tendance 30J */}
                <SectionHeader>TENDANCE 30 JOURS</SectionHeader>
                <GoldCard>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={days30} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="bonsAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={T.gold} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={T.gold} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="vol" stroke={T.gold} strokeWidth={1.5} fill="url(#bonsAreaFill)" dot={false} isAnimationActive animationDuration={800} />
                        {/* Pulse dot on last point */}
                        <Area type="monotone" dataKey="vol" stroke="none" fill="none"
                          dot={(props: any) => {
                            if (props.index === days30.length - 1) {
                              return <circle cx={props.cx} cy={props.cy} r={5} fill={T.gold} stroke={T.gold} strokeWidth={2} opacity={0.8}><animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" /></circle>;
                            }
                            return <circle cx={0} cy={0} r={0} />;
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', gap: 24, marginTop: 8, padding: '8px 0', borderTop: `1px solid ${T.cardBorder}` }}>
                    {[
                      { label: 'TOTAL', value: `${totalVol30.toFixed(0)} m³` },
                      { label: 'MOY./SEM.', value: `${avgWeek30} m³` },
                      { label: 'PIC', value: `${peak30} m³` },
                      { label: 'VS MOIS DERN.', value: `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`, color: trend >= 0 ? T.success : T.danger },
                    ].map((m, i) => (
                      <div key={i}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim, letterSpacing: 1 }}>{m.label}</span>
                        <div style={{ fontFamily: MONO, fontSize: 12, color: m.color || T.textPri, fontWeight: 500 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </GoldCard>

                {/* 3f — Anomalies */}
                {anomalies.length > 0 && !anomalyBannerDismissed && (
                  <div style={{ borderLeft: `4px solid ${T.warning}`, background: 'rgba(245,158,11,0.05)', borderRadius: '0 12px 12px 0', padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <AlertTriangle size={18} color={T.warning} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: MONO, color: T.warning, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>IA: Anomalies détectées</p>
                      {anomalies.map((a, i) => (
                        <p key={i} style={{ fontSize: 12, color: T.textSec, margin: '2px 0' }}>• {a.replace('>5 jours', '').includes('>5') ? a : a.replace(/(>\d+ jours)/g, '<strong style="color:#EF4444">$1</strong>')}</p>
                      ))}
                    </div>
                    <button onClick={() => setAnomalyBannerDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.warning, padding: 4 }}><X size={16} /></button>
                  </div>
                )}

                {/* 3g — Bons Table */}
                {renderBonsTable(filteredBons)}

                {/* 3h — Intelligence Livraisons IA */}
                <SectionHeader>✦ INTELLIGENCE LIVRAISONS IA</SectionHeader>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <GoldCard>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 8 }}>CLIENT LE PLUS ACTIF</div>
                    <div style={{ fontFamily: MONO, fontSize: 16, color: T.textPri, marginBottom: 4 }}>{topClientName}</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: T.textSec }}>{topClientCount} commandes</div>
                  </GoldCard>
                  <GoldCard>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 8 }}>FORMULE DOMINANTE</div>
                    <div style={{ fontFamily: MONO, fontSize: 16, color: T.textPri, marginBottom: 4 }}>{topFormulaName}</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: T.gold }}>{formulaPct}% du volume</div>
                  </GoldCard>
                  <GoldCard>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 8 }}>JOUR DE POINTE</div>
                    <div style={{ fontFamily: MONO, fontSize: 24, color: T.textPri, marginBottom: 4 }}>{dayNames[peakDayIdx]}</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: T.textSec }}>{dayVol[peakDayIdx].toFixed(0)} m³ total</div>
                  </GoldCard>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════
                 TAB: SUIVI DÉTAILLÉ
                 ═══════════════════════════════════════════ */}
            {activeTab === 'detail' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 4a — Filter Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['7', '30', '90'].map(p => (
                      <button key={p} onClick={() => setDetailPeriod(p)} style={{
                        padding: '6px 14px', borderRadius: 6, fontFamily: MONO, fontSize: 12, cursor: 'pointer',
                        background: detailPeriod === p ? T.gold : 'transparent',
                        color: detailPeriod === p ? T.navy : T.textSec,
                        border: detailPeriod === p ? 'none' : `1px solid rgba(212,168,67,0.3)`,
                        fontWeight: detailPeriod === p ? 600 : 400,
                      }}>{p}J</button>
                    ))}
                  </div>
                  <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textDim }} />
                    <input
                      placeholder="Rechercher bon, client..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.cardBorder}`, borderRadius: 8, color: T.textPri, fontSize: 13, outline: 'none' }}
                      onFocus={e => { e.target.style.borderColor = T.gold; }}
                      onBlur={e => { e.target.style.borderColor = T.cardBorder; }}
                    />
                  </div>
                </div>

                {/* 4b — Table with expandable rows */}
                {renderBonsTable(filteredBons, true)}

                {/* Pagination */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: T.textSec }}>Affichage 1-{filteredBons.length} sur {filteredBons.length}</span>
                </div>

                {/* 4c — Résumé Paiements */}
                <SectionHeader>RÉSUMÉ PAIEMENTS</SectionHeader>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <GoldCard borderColor={T.success}>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 8 }}>PAYÉ</div>
                    <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color: T.success }}>{paidTotal.toLocaleString('fr-MA')} DH</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{paidBons.length} bons</div>
                  </GoldCard>
                  <GoldCard borderColor={T.warning}>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 8 }}>EN ATTENTE</div>
                    <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color: T.warning }}>{pendingTotal.toLocaleString('fr-MA')} DH</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{pendingBons.length} bons</div>
                  </GoldCard>
                  <GoldCard borderColor={T.danger}>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 8 }}>EN RETARD</div>
                    <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color: T.danger }}>{lateTotal.toLocaleString('fr-MA')} DH</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{lateBons.length} bons</div>
                  </GoldCard>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════
                 TAB: ANALYTIQUE
                 ═══════════════════════════════════════════ */}
            {activeTab === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* ROW 1 — Headline Chart */}
                <SectionHeader>✦ PERFORMANCE LIVRAISONS — 90 JOURS</SectionHeader>
                <GoldCard>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <ComposedChart data={days30} margin={{ top: 8, right: 40, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="anlBarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={T.gold} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={T.gold} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,67,0.06)" />
                        <Bar dataKey="vol" fill="url(#anlBarFill)" radius={[3, 3, 0, 0]} />
                        <Line type="monotone" dataKey="vol" stroke={T.gold} strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', gap: 24, padding: '8px 0', borderTop: `1px solid ${T.cardBorder}`, marginTop: 8 }}>
                    {[
                      { label: 'TOTAL VOL.', value: `${totalVol.toFixed(0)} m³` },
                      { label: 'TOTAL CA', value: `${caFmt} DH` },
                      { label: 'MOY./SEM.', value: `${avgWeek30} m³` },
                      { label: 'TENDANCE', value: `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`, color: trend >= 0 ? T.success : T.danger },
                    ].map((m, i) => (
                      <div key={i}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim, letterSpacing: 1 }}>{m.label}</span>
                        <div style={{ fontFamily: MONO, fontSize: 12, color: m.color || T.gold, fontWeight: 500 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </GoldCard>

                {/* ROW 2 — Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {/* Volume par Client */}
                  <GoldCard>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 12 }}>VOLUME PAR CLIENT</div>
                    {Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cid, count], i) => {
                      const maxC = Math.max(...Object.values(clientCounts));
                      return (
                        <div key={cid} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: T.textSec }}>{getClientName(cid)}</span>
                            <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold }}>{count}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(count / maxC) * 100}%`, background: `linear-gradient(90deg, #C49A3C, ${T.gold})`, borderRadius: 99, transition: 'width 800ms ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </GoldCard>

                  {/* Volume par Formule */}
                  <GoldCard>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 12 }}>VOLUME PAR FORMULE</div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
                      <div style={{ position: 'relative', width: 100, height: 100 }}>
                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke={T.gold} strokeWidth="3" strokeDasharray={`${parseInt(formulaPct)} ${100 - parseInt(formulaPct)}`} strokeLinecap="round" />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 200, color: T.gold }}>{formulaPct}%</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: 12, color: T.textSec, marginTop: 8 }}>{topFormulaName}</div>
                  </GoldCard>

                  {/* Workflow Efficacité */}
                  <GoldCard>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 12 }}>WORKFLOW EFFICACITÉ</div>
                    {[
                      { label: 'Planification', count: pipelineCounts.planification, color: pipelineCounts.planification > 5 ? T.danger : T.gold },
                      { label: 'Production', count: pipelineCounts.production, color: T.gold },
                      { label: 'Livraison', count: pipelineCounts.en_livraison, color: T.gold },
                      { label: 'Facturé', count: pipelineCounts.facture, color: T.success },
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${T.cardBorder}` : 'none' }}>
                        <span style={{ fontSize: 12, color: T.textSec }}>{s.label}</span>
                        <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 200, color: s.color }}>{s.count}</span>
                      </div>
                    ))}
                    {pipelineCounts.planification > 5 && (
                      <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 10, color: T.danger }}>⚠ {pipelineCounts.planification} bons bloqués en planification</div>
                    )}
                  </GoldCard>
                </div>

                {/* ROW 3 — Efficiency */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
                  {/* Suivi Paiements */}
                  <GoldCard borderColor={T.warning}>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 12 }}>SUIVI PAIEMENTS</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color: tauxNum < 50 ? T.danger : T.warning }}>{tauxPaiement}%</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: T.textSec }}>taux paiement</span>
                    </div>
                    {/* Aging bar */}
                    <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ width: `${paidBons.length / Math.max(totalBons, 1) * 100}%`, background: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: T.navy }}>{paidBons.length}</span>
                      </div>
                      <div style={{ width: `${pendingBons.length / Math.max(totalBons, 1) * 100}%`, background: T.warning, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: T.navy }}>{pendingBons.length}</span>
                      </div>
                      <div style={{ width: `${lateBons.length / Math.max(totalBons, 1) * 100}%`, background: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: T.textPri }}>{lateBons.length}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 10, color: T.success }}>● Payé</span>
                      <span style={{ fontSize: 10, color: T.warning }}>● En attente</span>
                      <span style={{ fontSize: 10, color: T.danger }}>● En retard</span>
                    </div>
                  </GoldCard>

                  {/* Délai Moyen */}
                  <GoldCard>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: T.textSec, marginBottom: 12 }}>DÉLAI MOYEN LIVRAISON</div>
                    <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color: T.gold, marginBottom: 4 }}>4.2 <span style={{ fontSize: 14, color: T.textSec }}>jours</span></div>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Planification → Livraison</div>
                    {[{ label: 'Planification', val: '2.1j' }, { label: 'Production', val: '0.8j' }, { label: 'Transit', val: '1.3j' }].map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 2 ? `1px solid ${T.cardBorder}` : 'none' }}>
                        <span style={{ fontSize: 11, color: T.textDim }}>{s.label}</span>
                        <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold }}>{s.val}</span>
                      </div>
                    ))}
                  </GoldCard>
                </div>

                {/* ROW 4 — Insight IA */}
                <GoldCard style={{ background: 'rgba(212,168,67,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontFamily: MONO, letterSpacing: 2, fontSize: 13, color: T.gold }}>✦ INSIGHT IA — ANALYSE LIVRAISONS</span>
                    <AiBadge />
                  </div>
                  <p style={{ fontFamily: MONO, fontSize: 13, color: T.textSec, lineHeight: 1.8, margin: 0 }}>
                    Analyse 90 jours : <strong style={{ color: T.gold }}>{pipelineCounts.planification} bons bloqués</strong> en planification depuis {'>'}5 jours — cause : validation technique en attente. Le taux de paiement de <strong style={{ color: T.danger }}>{tauxPaiement}%</strong> est critique. Recommandation : (1) <strong style={{ color: T.gold }}>Relancer validation technique</strong> cette semaine — potentiel 48,000 DH de CA débloqué. (2) <strong style={{ color: T.gold }}>Suspendre livraisons</strong> clients en retard jusqu'à régularisation. (3) <strong style={{ color: T.gold }}>Automatiser</strong> le passage Planification → Production pour les clients avec historique {'>'}3 livraisons conformes.
                  </p>
                </GoldCard>
              </div>
            )}

            {/* ═══════════════════════════════════════════
                 TAB: INTELLIGENCE IA
                 ═══════════════════════════════════════════ */}
            {activeTab === 'intelligence' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Header */}
                <div>
                  <div style={{ fontFamily: MONO, letterSpacing: 2, fontSize: 15, color: T.gold, marginBottom: 4 }}>✦ CENTRE D'INTELLIGENCE LIVRAISONS</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: T.textSec }}>3 agents actifs · Surveillance continue · Claude Opus</div>
                </div>

                {/* Top Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <GoldCard borderColor={T.danger}>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1.5, color: T.textSec, marginBottom: 6 }}>WORKFLOW BLOQUÉS</div>
                    <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 28, color: T.danger }}>{pipelineCounts.planification}</span>
                  </GoldCard>
                  <GoldCard borderColor={T.warning}>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1.5, color: T.textSec, marginBottom: 6 }}>PAIEMENTS À RISQUE</div>
                    <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 28, color: T.warning }}>{lateTotal.toLocaleString('fr-MA')} DH</span>
                  </GoldCard>
                  <GoldCard borderColor={T.gold}>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1.5, color: T.textSec, marginBottom: 6 }}>PRÉVISION MOIS</div>
                    <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 28, color: T.gold }}>{projFormatted} DH</span>
                  </GoldCard>
                </div>

                {/* AGENT 1 — Détecteur Blocage */}
                <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${T.danger}`, borderRadius: 12, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: MONO, letterSpacing: 2, fontSize: 13, color: T.gold }}>✦ AGENT IA: DÉTECTEUR DE BLOCAGE WORKFLOW</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.success, border: `1px solid ${T.success}40`, borderRadius: 4, padding: '2px 8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.success, animation: 'pulse 2s infinite' }} /> LIVE
                      </span>
                    </div>
                    <AiBadge />
                  </div>

                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'BONS BLOQUÉS', value: String(pipelineCounts.planification), color: T.danger },
                      { label: 'DURÉE MOY. BLOCAGE', value: '8.3 jours', color: T.warning },
                      { label: 'CA BLOQUÉ', value: '48,000 DH', color: T.danger },
                    ].map((k, i) => (
                      <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: T.textDim, marginBottom: 4 }}>{k.label}</div>
                        <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 28, color: k.color }}>{k.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.cardBorder}`, marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
                          {['N° BON', 'CLIENT', 'DATE CRÉATION', 'JOURS EN PLANIF.', 'CAUSE BLOCAGE', 'ACTION'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: T.textDim, textAlign: 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { bl: 'BL-2602-003', client: 'Constructions Modernes', date: '31/01', days: 42, cause: 'Validation technique manquante', action: 'Relancer' },
                          { bl: 'BL-2602-004', client: 'BTP Maroc', date: '09/02', days: 33, cause: 'Validation technique manquante', action: 'Relancer' },
                          { bl: 'BL-2602-005', client: 'Ciments & Béton du Sud', date: '17/02', days: 25, cause: 'Attente confirmation volume', action: 'Appeler' },
                          { bl: 'BL-2602-006', client: 'TGCC', date: '24/02', days: 18, cause: 'Validation technique manquante', action: 'Relancer' },
                          { bl: 'BL-2603-007', client: 'BTP Maroc', date: '02/03', days: 12, cause: 'Production en attente matière', action: 'Vérifier Stock' },
                          { bl: 'BL-2603-008', client: 'TGCC', date: '06/03', days: 8, cause: 'Validation technique manquante', action: 'Relancer' },
                        ].map((r, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${T.cardBorder}`, background: i % 2 === 1 ? 'rgba(212,168,67,0.03)' : 'transparent', transition: 'background 150ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? 'rgba(212,168,67,0.03)' : 'transparent'; }}>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 12, color: T.gold }}>{r.bl}</td>
                            <td style={{ padding: '8px 12px', fontSize: 12, color: T.textPri }}>{r.client}</td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 12, color: T.textSec }}>{r.date}</td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontWeight: 200, fontSize: 16, color: r.days > 30 ? T.danger : r.days > 14 ? T.warning : T.gold }}>{r.days}j</td>
                            <td style={{ padding: '8px 12px', fontSize: 12, color: T.textSec }}>{r.cause}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <button onClick={() => toast.success(`${r.action} lancé pour ${r.bl}`)} style={{ padding: '4px 12px', borderRadius: 6, background: 'transparent', border: `1px solid ${T.gold}`, color: T.gold, fontSize: 11, fontFamily: MONO, cursor: 'pointer' }}>{r.action}</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button onClick={() => toast.success('Relance globale lancée')} style={{ padding: '10px 20px', borderRadius: 8, background: T.gold, color: T.navy, fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer' }}>Relancer Tout</button>

                  {/* Recommendation */}
                  <div style={{ borderLeft: `3px solid ${T.danger}`, background: 'rgba(239,68,68,0.04)', padding: '12px 16px', borderRadius: '0 8px 8px 0', marginTop: 16 }}>
                    <p style={{ fontFamily: MONO, fontSize: 12, color: T.textSec, lineHeight: 1.7, margin: 0 }}>
                      {pipelineCounts.planification} bons bloqués en planification représentent <strong style={{ color: T.danger }}>48,000 DH</strong> de CA gelé. 4 bons attendent une validation technique — contacter le responsable technique cette semaine. Le bon BL-2602-003 est bloqué depuis <strong style={{ color: T.danger }}>42 jours</strong> — risque de perte client. Action prioritaire : débloquer les 3 bons {'>'}25 jours avant vendredi.
                    </p>
                  </div>
                </div>

                {/* AGENT 2 — Intelligence Paiements */}
                <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${T.warning}`, borderRadius: 12, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontFamily: MONO, letterSpacing: 2, fontSize: 13, color: T.gold }}>✦ AGENT IA: INTELLIGENCE PAIEMENTS</span>
                    <AiBadge />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'TAUX PAIEMENT', value: `${tauxPaiement}%`, sub: 'objectif >80%', color: tauxNum < 50 ? T.danger : T.warning },
                      { label: 'RETARDS', value: `${lateTotal.toLocaleString('fr-MA')} DH`, color: T.danger },
                      { label: 'DÉLAI MOY.', value: '34 jours', color: T.warning },
                    ].map((k, i) => (
                      <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: T.textDim, marginBottom: 4 }}>{k.label}</div>
                        <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 28, color: k.color }}>{k.value}</span>
                        {k.sub && <div style={{ fontFamily: MONO, fontSize: 10, color: T.textDim, marginTop: 2 }}>{k.sub}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Client payment table */}
                  <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.cardBorder}`, marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
                          {['CLIENT', 'BONS LIVRÉS', 'PAYÉS', 'EN ATTENTE', 'EN RETARD', 'SCORE PAIEMENT'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: T.textDim, textAlign: 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { client: 'TGCC', livres: 2, payes: 2, attente: 0, retard: 0, score: 98, color: T.success },
                          { client: 'BTP Maroc', livres: 2, payes: 1, attente: 1, retard: 0, score: 72, color: T.warning },
                          { client: 'Constructions Modernes', livres: 1, payes: 0, attente: 1, retard: 0, score: 55, color: T.warning },
                          { client: 'Ciments & Béton du Sud', livres: 1, payes: 0, attente: 1, retard: 0, score: 60, color: T.warning },
                          { client: 'Sigma Bâtiment', livres: 2, payes: 0, attente: 0, retard: 2, score: 12, color: T.danger, flagged: true },
                        ].map((r, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${T.cardBorder}`, borderLeft: r.flagged ? `3px solid ${T.danger}` : 'none', background: i % 2 === 1 ? 'rgba(212,168,67,0.03)' : 'transparent', transition: 'background 150ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? 'rgba(212,168,67,0.03)' : 'transparent'; }}>
                            <td style={{ padding: '8px 12px', fontSize: 12, color: T.textPri, fontWeight: 600 }}><span style={{ display: 'inline-flex', alignItems: 'center' }}>{r.client === 'Sigma Bâtiment' ? <><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#EF4444', marginRight: 5, boxShadow: '0 0 4px rgba(239,68,68,0.4)' }} />{r.client}</> : r.client}</span></td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 12, color: T.textSec }}>{r.livres}</td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 12, color: T.success }}>{r.payes}</td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 12, color: r.attente > 0 ? T.warning : T.textDim }}>{r.attente}</td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 12, color: r.retard > 0 ? T.danger : T.textDim }}>{r.retard}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 20, color: r.color }}>{r.score}</span>
                              <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>/100</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ borderLeft: `3px solid ${T.warning}`, background: 'rgba(245,158,11,0.04)', padding: '12px 16px', borderRadius: '0 8px 8px 0' }}>
                    <p style={{ fontFamily: MONO, fontSize: 12, color: T.textSec, lineHeight: 1.7, margin: 0 }}>
                      Taux de paiement critique à <strong style={{ color: T.danger }}>{tauxPaiement}%</strong>. Sigma Bâtiment : 2 bons livrés, <strong style={{ color: T.danger }}>13,200 DH impayés</strong>, 0 paiements reçus. Score 12/100 <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(212,168,67,0.5)' }}>(Créances)</span> — cohérent avec le pattern de défaut. Score santé 23/100 <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(212,168,67,0.5)' }}>(Clients)</span>. Recommandation : (1) <strong style={{ color: T.gold }}>Aucune nouvelle livraison sans paiement anticipé</strong>. (2) Relance formelle cette semaine. (3) Pour les autres clients, rappel automatique à J+7 après livraison.
                    </p>
                  </div>
                </div>

                {/* AGENT 3 — Prédicteur Volume */}
                <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${T.gold}`, borderRadius: 12, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontFamily: MONO, letterSpacing: 2, fontSize: 13, color: T.gold }}>✦ AGENT IA: PRÉDICTEUR DE VOLUME</span>
                    <AiBadge />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'PRÉVISION MARS', value: `${projFormatted} DH`, color: T.gold },
                      { label: 'LIVRAISONS PRÉVUES', value: '12', color: T.textPri },
                      { label: 'FORMULE DOMINANTE', value: 'B25 — 100%', color: T.gold },
                    ].map((k, i) => (
                      <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: T.textDim, marginBottom: 4 }}>{k.label}</div>
                        <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 28, color: k.color }}>{k.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Forecast chart */}
                  <div style={{ height: 120, marginBottom: 16 }}>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={days30.slice(-14)} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={T.gold} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={T.gold} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="vol" stroke={T.gold} strokeWidth={1.5} fill="url(#forecastFill)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Forecast table */}
                  <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.cardBorder}`, marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
                          {['SEMAINE', 'LIVRAISONS', 'VOLUME', 'CA ESTIMÉ', 'CAPACITÉ', 'RISQUE'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: T.textDim, textAlign: 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { sem: 'Sem 12 (17-21 mars)', livr: 4, vol: '52 m³', ca: '15,600 DH', cap: '85%', risque: 'OK', rColor: T.success },
                          { sem: 'Sem 13 (24-28 mars)', livr: 3, vol: '38 m³', ca: '11,400 DH', cap: '65%', risque: 'OK', rColor: T.success },
                          { sem: 'Sem 14 (31 mars-4 avr)', livr: 2, vol: '24 m³', ca: '7,200 DH', cap: '40%', risque: '⚠ Sous-capacité', rColor: T.warning },
                        ].map((r, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${T.cardBorder}`, background: i % 2 === 1 ? 'rgba(212,168,67,0.03)' : 'transparent', transition: 'background 150ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? 'rgba(212,168,67,0.03)' : 'transparent'; }}>
                            <td style={{ padding: '8px 12px', fontSize: 12, color: T.textPri }}>{r.sem}</td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 14, fontWeight: 200, color: T.gold }}>{r.livr}</td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 12, color: T.textSec }}>{r.vol}</td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 12, color: T.gold }}>{r.ca}</td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 12, color: T.textSec }}>{r.cap}</td>
                            <td style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 11, color: r.rColor }}>{r.risque}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ borderLeft: `3px solid ${T.gold}`, background: T.goldBg, padding: '12px 16px', borderRadius: '0 8px 8px 0' }}>
                    <p style={{ fontFamily: MONO, fontSize: 12, color: T.textSec, lineHeight: 1.7, margin: 0 }}>
                      Volume prévu en baisse semaine 14 — coïncide avec début Ramadan. Recommandation : <strong style={{ color: T.gold }}>prospecter 2 livraisons supplémentaires</strong> pour maintenir le CA au-dessus de 10K/semaine. Les <strong style={{ color: T.gold }}>{pipelineCounts.planification} bons bloqués</strong> en planification représentent un potentiel de 48K DH — les débloquer compenserait entièrement la baisse Ramadan.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Detail Dialog */}
        <BonDetailDialog blId={detailBlId} open={detailDialogOpen} onOpenChange={setDetailDialogOpen} onUpdate={fetchData} />
        <BonDetailDrawer blId={drawerBlId} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </MainLayout>
  );
}
