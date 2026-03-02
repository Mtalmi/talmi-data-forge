import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  AlertTriangle,
  Loader2,
  Timer,
  Star,
  Zap,
  Mail,
  Shield,
  Lock,
  ShieldCheck,
  ChevronDown,
  Ban,
} from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { useAuth } from '@/hooks/useAuth';
import DevisPdfGenerator from '@/components/quotes/DevisPdfGenerator';
import { DevisSendDialog } from '@/components/quotes/DevisSendDialog';
import { ClientHoverPreview } from '@/components/ventes/ClientHoverPreview';
import { WhatsAppShareButton } from '@/components/ventes/WhatsAppShareButton';
import { DuplicateDevisButton } from '@/components/ventes/DuplicateDevisButton';
import { TechnicalApprovalBadge } from '@/components/ventes/TechnicalApprovalBadge';
import { ResponsibilityStamp } from '@/components/ventes/ResponsibilityStamp';
import { RollbackAccountabilityBadge } from '@/components/ventes/RollbackAccountabilityBadge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

const DEVIS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; isLocked?: boolean }> = {
  en_attente: { label: 'En Attente', color: 'text-[#FDB913] bg-[rgba(253,185,19,0.08)] border border-[rgba(253,185,19,0.15)]', icon: <Clock className="h-3 w-3" />, isLocked: false },
  attente_validation_tiers: { label: 'Attente validation client', color: 'text-[#FDB913] bg-[rgba(253,185,19,0.08)] border border-[rgba(253,185,19,0.15)]', icon: <Clock className="h-3 w-3" />, isLocked: false },
  valide: { label: 'Validé', color: 'text-[#10B981] bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)]', icon: <ShieldCheck className="h-3 w-3" />, isLocked: true },
  accepte: { label: 'Accepté', color: 'text-[#10B981] bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)]', icon: <ShieldCheck className="h-3 w-3" />, isLocked: true },
  refuse: { label: 'Refusé', color: 'text-[#FF6B6B] bg-[rgba(255,107,107,0.08)] border border-[rgba(255,107,107,0.15)]', icon: <XCircle className="h-3 w-3" />, isLocked: false },
  converti: { label: 'Converti en BC', color: 'text-[#00D9FF] bg-[rgba(0,217,255,0.08)] border border-[rgba(0,217,255,0.15)]', icon: <Lock className="h-3 w-3" />, isLocked: true },
  expire: { label: 'Expiré', color: 'text-[rgba(226,232,240,0.6)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]', icon: <AlertTriangle className="h-3 w-3" />, isLocked: false },
  annule: { label: 'Annulé', color: 'text-[rgba(226,232,240,0.6)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]', icon: <XCircle className="h-3 w-3" />, isLocked: true },
};

// Priority thresholds
const HIGH_VALUE_THRESHOLD = 50000; // DH
const HIGH_VOLUME_THRESHOLD = 50; // m³

interface ExpirationInfo {
  isExpiring: boolean;
  isExpired: boolean;
  daysUntilExpiration: number;
}

interface DevisTableProps {
  devisList: Devis[];
  loading: boolean;
  onConvert: (devis: Devis) => void;
  onRowClick?: (devis: Devis) => void;
  getExpirationInfo?: (devis: Devis) => ExpirationInfo;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onQuickSend?: (devis: Devis) => void;
  onRefresh?: () => void;
}

// Helper to determine if devis is high priority
const isHighPriority = (devis: Devis): { isPriority: boolean; reason: string } => {
  if (devis.total_ht >= HIGH_VALUE_THRESHOLD) {
    return { isPriority: true, reason: `Valeur élevée (${devis.total_ht.toLocaleString()} DH)` };
  }
  if (devis.volume_m3 >= HIGH_VOLUME_THRESHOLD) {
    return { isPriority: true, reason: `Volume important (${devis.volume_m3} m³)` };
  }
  return { isPriority: false, reason: '' };
};

export function DevisTable({
  devisList,
  loading,
  onConvert,
  onRowClick,
  getExpirationInfo,
  selectedIds,
  onSelectionChange,
  onQuickSend,
  onRefresh,
}: DevisTableProps) {
  const { canApproveDevis, isResponsableTechnique, isDirecteurOperations, isCentraliste, isCeo, user, loading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const dt = t.devisTable;
  const dateLocale = getDateLocale(lang);
  const [validating, setValidating] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [cancelConfirmDevis, setCancelConfirmDevis] = useState<Devis | null>(null);
  
  // Status options for dropdown (excluding locked states like 'converti')
  const STATUS_OPTIONS = [
    { value: 'en_attente', label: 'En Attente', icon: <Clock className="h-3 w-3" /> },
    { value: 'accepte', label: 'Accepté', icon: <CheckCircle className="h-3 w-3" /> },
    { value: 'refuse', label: 'Refusé', icon: <XCircle className="h-3 w-3" /> },
    { value: 'annule', label: 'Annulé', icon: <Ban className="h-3 w-3" />, requiresConfirm: true },
  ];
  
  // Handle status change with audit logging
  const handleStatusChange = async (devis: Devis, newStatus: string) => {
    // Check if this requires confirmation (Annulé)
    if (newStatus === 'annule') {
      setCancelConfirmDevis(devis);
      return;
    }
    
    await executeStatusChange(devis, newStatus);
  };
  
  const executeStatusChange = async (devis: Devis, newStatus: string) => {
    setUpdatingStatus(devis.devis_id);
    try {
      const oldStatus = devis.statut;
      
      const { error } = await supabase
        .from('devis')
        .update({ statut: newStatus })
        .eq('devis_id', devis.devis_id);
      
      if (error) throw error;
      
      // The universal audit trigger will automatically log this change
      toast.success(`${dt.statusUpdated}: ${DEVIS_STATUS_CONFIG[newStatus]?.label || newStatus}`);
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || dt.statusError);
    } finally {
      setUpdatingStatus(null);
    }
  };
  
  const handleConfirmCancel = async () => {
    if (!cancelConfirmDevis) return;
    await executeStatusChange(cancelConfirmDevis, 'annule');
    setCancelConfirmDevis(null);
  };
  
  // =====================================================
  // HARD PERMISSION WALL - Devis Approval Authority
  // ONLY CEO, Superviseur, Agent Administratif can APPROVE
  // Dir Ops and Centraliste are READ-ONLY
  // =====================================================
  const isReadOnlyRole = isDirecteurOperations || isCentraliste;
  // Resp Technique can approve technical aspects only
  const canApproveTechnical = isCeo || isResponsableTechnique;
  
  // =====================================================
  // ANTI-FRAUD: Self-Approval Block
  // A user CANNOT approve a Devis they created themselves
  // This is enforced at both UI and database levels
  // =====================================================
  const canApproveSpecificDevis = (devis: Devis): boolean => {
    // Must have role permission
    if (!canApproveDevis || isReadOnlyRole) return false;
    // Cannot approve own devis (anti-fraud)
    if (devis.created_by === user?.id) return false;
    return true;
  };
  
  // Check if current user is the creator (for showing the warning message)
  const isCreator = (devis: Devis): boolean => devis.created_by === user?.id;
  
  const handleValidateDevis = async (devis: Devis) => {
    setValidating(devis.devis_id);
    try {
      // Use the new approve_devis_with_stamp RPC for full responsibility tracking
      const { data, error } = await supabase.rpc('approve_devis_with_stamp', {
        p_devis_id: devis.devis_id,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; approved_by?: string; approved_role?: string };
      
      if (result.success) {
        toast.success(`${dt.approvedBy} ${result.approved_by} (${result.approved_role})`);
        onRefresh?.();
      }
    } catch (error: any) {
      toast.error(error.message || dt.approvalError);
    } finally {
      setValidating(null);
    }
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(devisList.map(d => d.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(i => i !== id));
    }
  };

  const allSelected = devisList.length > 0 && selectedIds.length === devisList.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < devisList.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (devisList.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{dt.noQuotes}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {dt.useCalculator}
        </p>
      </div>
    );
  }

  const renderExpirationBadge = (devis: Devis) => {
    if (!getExpirationInfo || devis.statut !== 'en_attente') return null;
    
    const info = getExpirationInfo(devis);
    
    if (info.isExpired) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              Expiré
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {dt.expiredSince} {Math.abs(info.daysUntilExpiration)} {dt.days}
          </TooltipContent>
        </Tooltip>
      );
    }
    
    if (info.isExpiring) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1",
                info.daysUntilExpiration <= 3 
                  ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse" 
                  : "bg-warning/10 text-warning border-warning/30"
              )}
            >
              <Timer className="h-3 w-3" />
              {info.daysUntilExpiration}j
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {info.daysUntilExpiration === 0 
              ? dt.expiresToday
              : `${dt.expiresIn} ${info.daysUntilExpiration} ${info.daysUntilExpiration > 1 ? dt.days : dt.day}`
            }
            {devis.date_expiration && (
              <span className="block text-xs opacity-70">
                {format(new Date(devis.date_expiration), 'dd MMMM yyyy', { locale: dateLocale })}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return null;
  };

  const renderPriorityIndicator = (devis: Devis) => {
    const priority = isHighPriority(devis);
    const hasPriority = Boolean((devis as any).priority) || priority.isPriority;

    if (!hasPriority) {
      return <Star className="w-5 h-5 text-white/10" />;
    }
    
    return (
      <Tooltip>
        <TooltipTrigger>
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {priority.reason || 'Priorité élevée'}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Tout sélectionner"
                className={cn(someSelected && "data-[state=checked]:bg-primary/50")}
              />
            </TableHead>
            <TableHead>N° Devis</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-center">Formule</TableHead>
            <TableHead className="text-right">Volume (m³)</TableHead>
            <TableHead className="text-right">Total HT (DH)</TableHead>
            <TableHead className="text-center">Statut</TableHead>
            <TableHead className="text-center">Score IA</TableHead>
            <TableHead className="text-center">Marge IA</TableHead>
            <TableHead className="text-center">Priorité</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devisList.map((devis) => {
            const statusConfig = DEVIS_STATUS_CONFIG[devis.statut] || DEVIS_STATUS_CONFIG.en_attente;
            const expirationBadge = renderExpirationBadge(devis);
            const priorityIndicator = renderPriorityIndicator(devis);
            const isSelected = selectedIds.includes(devis.id);
            
            return (
              <TableRow 
                key={devis.id}
                className={cn(
                  "hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer border-b border-white/5",
                  getExpirationInfo && getExpirationInfo(devis).isExpired && "opacity-60 bg-muted/30",
                  isSelected && "bg-primary/5"
                )}
                onClick={() => onRowClick?.(devis)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectOne(devis.id, !!checked)}
                    aria-label={`Sélectionner ${devis.devis_id}`}
                  />
                </TableCell>
                <TableCell className="font-mono font-medium">{devis.devis_id}</TableCell>
                <TableCell>
                  {devis.client ? (
                    <ClientHoverPreview clientId={devis.client_id || ''} clientName={devis.client.nom_client} />
                  ) : (
                    <span className="text-xs text-amber-400/60 bg-amber-400/10 rounded-full px-2 py-0.5">{dt.unassigned}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-xs font-mono">{devis.formule_id}</span>
                </TableCell>
                <TableCell className="text-right font-mono">{devis.volume_m3}</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {Number(devis.total_ht).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {/* Clickable Status Dropdown - only for non-locked statuses */}
                    {statusConfig.isLocked ? (
                      <Badge variant="outline" className={cn("gap-1", statusConfig.color)} title={statusConfig.label}>
                        {statusConfig.icon}
                        <span className="whitespace-nowrap">{statusConfig.label}</span>
                      </Badge>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                      <button 
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md text-xs font-medium",
                              "hover:opacity-80 transition-colors cursor-pointer",
                              statusConfig.color
                            )}
                            style={{ padding: '4px 12px', borderRadius: 6, border: 'none' }}
                            disabled={updatingStatus === devis.devis_id}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', opacity: 0.6, flexShrink: 0 }} />
                            {updatingStatus === devis.devis_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            {statusConfig.label}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40 bg-background">
                          {STATUS_OPTIONS.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={() => handleStatusChange(devis, option.value)}
                              disabled={option.value === devis.statut}
                              className={cn(
                                "gap-2 cursor-pointer",
                                option.value === devis.statut && "opacity-50"
                              )}
                            >
                              {option.icon}
                              {option.label}
                              {option.value === devis.statut && (
                                <CheckCircle className="h-3 w-3 ml-auto text-success" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {/* Security Seal for locked devis */}
                    {statusConfig.isLocked && (
                      <Badge className="gap-0.5 h-5 text-[10px] bg-slate-800 text-white border-slate-700">
                        <Lock className="h-2.5 w-2.5" />
                      </Badge>
                    )}
                    {/* Public Accountability Badge - Visible to ALL roles */}
                    <RollbackAccountabilityBadge 
                      rollbackCount={(devis as any).rollback_count} 
                      compact 
                    />
                    {expirationBadge}
                  </div>
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  {(() => {
                    // Mock scores by devis_id pattern for demo
                    const MOCK_SCORES: Record<string, { score: number; reasons: { factor: string; impact: string }[] }> = {
                      '650': { score: 62, reasons: [{ factor: 'Volume faible', impact: '-20' }, { factor: 'Client récurrent', impact: '+15' }] },
                      '716': { score: 78, reasons: [{ factor: 'Client fidèle', impact: '+25' }, { factor: 'Volume élevé', impact: '+20' }] },
                      '349': { score: 75, reasons: [{ factor: 'Historique positif', impact: '+20' }, { factor: 'Délai court', impact: '+15' }] },
                      '544': { score: 91, reasons: [{ factor: 'Gros volume', impact: '+30' }, { factor: 'Client stratégique', impact: '+25' }] },
                      '316': { score: 55, reasons: [{ factor: 'Client moyen', impact: '+10' }, { factor: 'Marge correcte', impact: '+12' }] },
                      '895': { score: 42, reasons: [{ factor: 'Petit montant', impact: '-15' }, { factor: 'Client nouveau', impact: '-10' }] },
                    };
                    const realScore = (devis as any).ai_score;
                    const realReasons = (devis as any).ai_score_reasons;
                    // Try mock by last 3 digits of devis_id
                    const idSuffix = devis.devis_id?.split('-').pop() || '';
                    const mock = MOCK_SCORES[idSuffix];
                    const score = realScore ?? mock?.score ?? null;
                    const reasons = realReasons ?? mock?.reasons ?? null;
                    const bg = score == null ? '#64748B' : score > 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626';
                    const isStar = score != null && score >= 85;
                    return (
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto relative" style={{ background: bg }}>
                            {score != null ? score : '—'}
                            {isStar && <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          {reasons && Array.isArray(reasons) ? (
                            <div className="space-y-1 text-xs">
                              {reasons.map((r: any, i: number) => (
                                <div key={i}>{r.factor}: <span className="font-mono">{r.impact}</span></div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pas encore scoré</span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  {(() => {
                    const MOCK_MARGINS: Record<string, { pct: number; tip: string }> = {
                      '544': { pct: 23, tip: '' },
                      '716': { pct: 18, tip: '' },
                      '349': { pct: 14, tip: '💡 Marge sous le seuil de 18%. Recommandation: augmenter de 45 MAD/m³ ou substituer formule B25 → B25S pour économiser 12 MAD/m³ sur les agrégats.' },
                      '316': { pct: 8, tip: '⚠️ Marge critique. Ce devis est à 8% contre un seuil minimum de 18%. Recommandation urgente: renégocier le prix (+62 MAD/m³) ou proposer formule alternative. Coût transport élevé: 47km aller-retour.' },
                      '650': { pct: 11, tip: '💡 Marge sous le seuil de 18%. Recommandation: revoir le prix de vente ou réduire les coûts logistiques.' },
                      '895': { pct: 5, tip: '🔴 Marge dangereuse. Risque de perte nette après coûts indirects. Recommandation: ne pas accepter en l\'état. Proposer réduction volume ou formule économique.' },
                    };
                    const idSuffix = devis.devis_id?.split('-').pop() || '';
                    const mock = MOCK_MARGINS[idSuffix];
                    const pct = mock?.pct ?? Math.floor(Math.random() * 20 + 5);
                    const tip = mock?.tip ?? '';
                    const bg = pct >= 18 ? 'rgba(16,185,129,0.12)' : pct >= 10 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
                    const border = pct >= 18 ? 'rgba(16,185,129,0.25)' : pct >= 10 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)';
                    const color = pct >= 18 ? '#10B981' : pct >= 10 ? '#F59E0B' : '#EF4444';
                    const needsTip = pct < 18 && tip;
                    return (
                      <Tooltip>
                        <TooltipTrigger>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: bg, border: `1px solid ${border}`, color,
                            fontFamily: 'JetBrains Mono, monospace', cursor: needsTip ? 'help' : 'default',
                          }}>
                            Marge: {pct}%
                          </span>
                        </TooltipTrigger>
                        {needsTip && (
                          <TooltipContent side="left" className="max-w-[280px]" style={{ background: '#0D1220', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 8, padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <span style={{ fontSize: 12, flexShrink: 0 }}>✨</span>
                              <p style={{ fontSize: 11, lineHeight: 1.5, color: '#F1F5F9' }}>{tip}</p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-center">
                  {priorityIndicator}
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 flex-nowrap justify-center">
                    {/* Quick Send + PDF - primary actions for pending devis */}
                    {devis.statut === 'en_attente' && devis.client_id && (
                      <DevisSendDialog devis={devis} />
                    )}
                    
                    {/* PDF Button */}
                    <DevisPdfGenerator devis={devis} />
                    
                    {/* Validate Button - SECURITY HARDENED */}
                    {devis.statut === 'en_attente' && (
                      canApproveSpecificDevis(devis) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-success hover:bg-success/10"
                          onClick={() => handleValidateDevis(devis)}
                          disabled={validating === devis.devis_id}
                        >
                          {validating === devis.devis_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-3 w-3" />
                          )}
                          {dt.validate}
                        </Button>
                      ) : isCreator(devis) ? (
                        <span className="text-xs text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5 whitespace-nowrap">
                          {dt.awaitingThirdParty}
                        </span>
                      ) : isReadOnlyRole ? (
                        <span className="text-xs text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5 whitespace-nowrap">
                          {dt.awaitingValidation}
                        </span>
                      ) : null
                    )}
                    
                    {/* Convert to BC Button after validation */}
                    {(devis.statut === 'valide' || devis.statut === 'accepte') && devis.client_id && canApproveDevis && (
                      <Button
                        size="sm"
                        onClick={() => onConvert(devis)}
                        className="gap-1"
                      >
                        <ArrowRight className="h-3 w-3" />
                        {dt.createBC}
                      </Button>
                    )}
                    
                    {devis.statut === 'en_attente' && !devis.client_id && (
                      <span className="text-xs text-red-400 bg-red-500/10 rounded-full px-2 py-0.5 whitespace-nowrap">
                        {dt.clientRequired}
                      </span>
                    )}
                    
                    {/* More actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/30 hover:text-white/60">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {/* Technical Approval Badge */}
                        {(devis as any).requires_technical_approval && (
                          <DropdownMenuItem className="gap-2" asChild>
                            <div>
                              <TechnicalApprovalBadge
                                devisId={devis.devis_id}
                                requiresApproval={(devis as any).requires_technical_approval}
                                isApproved={!!(devis as any).technical_approved_at}
                                approvedByName={(devis as any).technical_approved_by_name}
                                approvedAt={(devis as any).technical_approved_at}
                                canApprove={canApproveTechnical}
                                onApproved={onRefresh}
                              />
                            </div>
                          </DropdownMenuItem>
                        )}
                        {/* Responsibility Stamp */}
                        {(devis as any).validated_by_name && (
                          <DropdownMenuItem className="gap-2" asChild>
                            <div>
                              <ResponsibilityStamp
                                actionType="validated"
                                userName={(devis as any).validated_by_name}
                                userRole={(devis as any).validated_by_role}
                                timestamp={(devis as any).validated_at}
                                compact
                              />
                            </div>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="gap-2" asChild>
                          <div><DuplicateDevisButton devis={devis} onDuplicated={onRefresh} compact /></div>
                        </DropdownMenuItem>
                        {devis.statut === 'en_attente' && devis.client_id && (
                          <DropdownMenuItem className="gap-2" asChild>
                            <div><WhatsAppShareButton devis={devis} compact /></div>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Confirmation Dialog for Annulé Status */}
      <AlertDialog open={!!cancelConfirmDevis} onOpenChange={(open) => !open && setCancelConfirmDevis(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-warning" />
              {dt.confirmCancel}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {dt.cancelDesc1} <strong>{cancelConfirmDevis?.devis_id}</strong>.
              </p>
              <p className="text-warning font-medium">
                ⚠️ {dt.cancelAuditWarning}
              </p>
              <p className="text-sm text-muted-foreground">
                {dt.cancelDesc2}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dt.cancelBtn}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {dt.confirmCancelBtn}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
