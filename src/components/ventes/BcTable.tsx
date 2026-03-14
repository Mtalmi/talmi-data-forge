import { useState } from 'react';
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
} from '@/components/ui/dropdown-menu';
import {
  ShoppingCart,
  CheckCircle,
  Truck,
  Lock,
  Loader2,
  Factory,
  Copy,
  Star,
  Zap,
  AlertCircle,
  Clock,
  Receipt,
  Send,
  Shield,
  MoreHorizontal,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

import { BonCommande } from '@/hooks/useSalesWorkflow';
import { BcPdfGenerator } from '@/components/documents/BcPdfGenerator';
import { ClientHoverPreview } from '@/components/ventes/ClientHoverPreview';
import { WhatsAppShareButton } from '@/components/ventes/WhatsAppShareButton';
import { OrderStatusTimeline } from '@/components/ventes/OrderStatusTimeline';
import { BcApprovalTimeline } from '@/components/ventes/BcApprovalTimeline';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Progress } from '@/components/ui/progress';

// Status configs use static colors but labels are resolved dynamically via i18n
const BC_STATUS_COLORS: Record<string, { color: string; icon: React.ReactNode }> = {
  en_attente_validation: { color: 'text-[#FDB913] bg-[rgba(253,185,19,0.08)] border-none', icon: <Clock className="h-3 w-3" /> },
  pret_production: { color: '', icon: <CheckCircle className="h-3 w-3" /> },
  en_production: { color: 'text-[#00D9FF] bg-[rgba(0,217,255,0.08)] border-none', icon: <Factory className="h-3 w-3" /> },
  en_livraison: { color: 'text-[#FB923C] bg-[rgba(251,146,60,0.08)] border-none', icon: <Truck className="h-3 w-3" /> },
  en_retour: { color: 'text-[#FB923C] bg-[rgba(251,146,60,0.08)] border-none', icon: <Truck className="h-3 w-3" /> },
  termine: { color: '', icon: <CheckCircle className="h-3 w-3" /> },
  livre: { color: 'text-[#10B981] bg-[rgba(16,185,129,0.08)] border-none', icon: <Truck className="h-3 w-3" /> },
  facture: { color: 'text-[#10B981] bg-[rgba(16,185,129,0.08)] border-none', icon: <CheckCircle className="h-3 w-3" /> },
  refuse: { color: 'text-[#FF6B6B] bg-[rgba(255,107,107,0.08)] border-none', icon: <AlertCircle className="h-3 w-3" /> },
};

const BL_STATUS_COLORS: Record<string, string> = {
  en_attente_validation: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
  planification: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  production: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  en_chargement: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  validation_technique: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  en_livraison: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  en_retour: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  livre: 'bg-success/10 text-success border-success/30',
  facture: 'bg-success/10 text-success border-success/30',
};

const BC_INVOICE_COLORS: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: 'bg-muted text-muted-foreground border-muted', icon: <Clock className="h-3 w-3" /> },
  partial: { color: 'bg-warning/10 text-warning border-warning/30', icon: <AlertCircle className="h-3 w-3" /> },
  invoiced: { color: 'bg-success/10 text-success border-success/30', icon: <Receipt className="h-3 w-3" /> },
};

// Priority thresholds
const HIGH_VALUE_THRESHOLD = 50000; // DH
const HIGH_VOLUME_THRESHOLD = 50; // m³
const MULTI_DELIVERY_THRESHOLD = 12; // m³ - orders above this are multi-delivery

interface BcTableProps {
  bcList: BonCommande[];
  loading: boolean;
  launchingProduction: string | null;
  onLaunchProduction: (bc: BonCommande) => void;
  onSubmitForValidation?: (bc: BonCommande) => void;
  onCopyBc: (bc: BonCommande) => void;
  onOpenDetail: (bc: BonCommande) => void;
  onGenerateInvoice?: (bcId: string) => Promise<string | null>;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

// Helper to determine BC priority
const getBcPriority = (bc: BonCommande): { isPriority: boolean; isUrgent: boolean; reason: string } => {
  if (bc.date_livraison_souhaitee && bc.statut === 'pret_production') {
    const deliveryDate = parseISO(bc.date_livraison_souhaitee);
    if (isPast(deliveryDate) && !isToday(deliveryDate)) {
      return { isPriority: true, isUrgent: true, reason: 'Livraison en retard!' };
    }
    if (isToday(deliveryDate)) {
      return { isPriority: true, isUrgent: true, reason: "Livraison aujourd'hui" };
    }
    if (isTomorrow(deliveryDate)) {
      return { isPriority: true, isUrgent: false, reason: 'Livraison demain' };
    }
  }
  if (bc.total_ht >= HIGH_VALUE_THRESHOLD) {
    return { isPriority: true, isUrgent: false, reason: `Valeur élevée (${bc.total_ht.toLocaleString()} DH)` };
  }
  if (bc.volume_m3 >= HIGH_VOLUME_THRESHOLD) {
    return { isPriority: true, isUrgent: false, reason: `Volume important (${bc.volume_m3} m³)` };
  }
  return { isPriority: false, isUrgent: false, reason: '' };
};

export function BcTable({
  bcList,
  loading,
  launchingProduction,
  onLaunchProduction,
  onSubmitForValidation,
  onCopyBc,
  onOpenDetail,
  onGenerateInvoice,
  selectedIds,
  onSelectionChange,
}: BcTableProps) {
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const { isDirecteurOperations, isCeo, isSuperviseur, isAgentAdministratif, canValidateBcPrice, isInEmergencyWindow } = useAuth();
  const { t } = useI18n();
  const bt = t.bcTable;

  const BC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    en_attente_validation: { label: bt.statusWaitingAdmin, ...BC_STATUS_COLORS.en_attente_validation },
    pret_production: { label: bt.statusReadyProd, ...BC_STATUS_COLORS.pret_production },
    en_production: { label: bt.statusInProd, ...BC_STATUS_COLORS.en_production },
    en_livraison: { label: bt.statusInDelivery, ...BC_STATUS_COLORS.en_livraison },
    en_retour: { label: bt.statusReturning, ...BC_STATUS_COLORS.en_retour },
    termine: { label: bt.statusComplete, ...BC_STATUS_COLORS.termine },
    livre: { label: bt.statusDelivered, ...BC_STATUS_COLORS.livre },
    facture: { label: bt.statusInvoiced, ...BC_STATUS_COLORS.facture },
    refuse: { label: bt.statusRefused, ...BC_STATUS_COLORS.refuse },
  };

  const BL_WORKFLOW_STATUS: Record<string, { label: string; color: string }> = {
    en_attente_validation: { label: bt.statusToConfirm, color: BL_STATUS_COLORS.en_attente_validation },
    planification: { label: bt.statusPlanned, color: BL_STATUS_COLORS.planification },
    production: { label: bt.statusInProd, color: BL_STATUS_COLORS.production },
    en_chargement: { label: bt.statusLoading, color: BL_STATUS_COLORS.en_chargement },
    validation_technique: { label: bt.statusReadyDepart, color: BL_STATUS_COLORS.validation_technique },
    en_livraison: { label: bt.statusInDelivery, color: BL_STATUS_COLORS.en_livraison },
    en_retour: { label: bt.statusReturning, color: BL_STATUS_COLORS.en_retour },
    livre: { label: bt.statusDelivered, color: BL_STATUS_COLORS.livre },
    facture: { label: bt.statusInvoiced, color: BL_STATUS_COLORS.facture },
  };

  const BC_INVOICE_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: bt.invoicePending, ...BC_INVOICE_COLORS.pending },
    partial: { label: bt.invoicePartial, ...BC_INVOICE_COLORS.partial },
    invoiced: { label: bt.statusInvoiced, ...BC_INVOICE_COLORS.invoiced },
  };

  const handleGenerateInvoice = async (bc: BonCommande) => {
    if (!onGenerateInvoice) return;
    setGeneratingInvoice(bc.bc_id);
    await onGenerateInvoice(bc.bc_id);
    setGeneratingInvoice(null);
  };

  const isEmergencyBc = (bc: BonCommande) => bc.notes?.includes('[URGENCE/EMERGENCY');

  const canLaunchProduction = (bc: BonCommande) => {
    if (isCeo || isSuperviseur || isAgentAdministratif) return true;
    if (isDirecteurOperations) {
      return bc.prix_verrouille || isEmergencyBc(bc);
    }
    return false;
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(bcList.map(bc => bc.id));
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

  const allSelected = bcList.length > 0 && selectedIds.length === bcList.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < bcList.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (bcList.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={bt.noBc}
        description={bt.convertQuoteToBc}
      />
    );
  }

  // Priority dot for PO number
  const renderPriorityDot = (bc: BonCommande) => {
    const priority = getBcPriority(bc);
    if (!priority.isPriority) return null;
    
    return (
      <Tooltip>
        <TooltipTrigger>
          <span 
            className={cn(
              "inline-block h-2 w-2 rounded-full shrink-0",
              priority.isUrgent ? "bg-red-500 animate-pulse" : "bg-amber-500"
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {priority.reason}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderDeliveryDate = (bc: BonCommande) => {
    if (!bc.date_livraison_souhaitee) return '—';
    
    const date = parseISO(bc.date_livraison_souhaitee);
    const priority = getBcPriority(bc);
    const isOverdue = isPast(date) && !isToday(date);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isWithin3Days = diffDays >= 0 && diffDays <= 3;
    
    const dateColor = isOverdue ? '#EF4444' : isWithin3Days ? '#F59E0B' : '#9CA3AF';

    return (
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: dateColor, fontWeight: isOverdue ? 500 : 400 }}>
        {isToday(date) ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#D4A843', fontWeight: 500, justifyContent: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A843', animation: 'pulse 2s ease-in-out infinite' }} />
            Auj.
          </span>
        ) : isTomorrow(date) ? (
          <span style={{ color: '#F59E0B' }}>Demain</span>
        ) : (
          format(date, 'dd/MM/yy')
        )}
      </span>
    );
  };

  // Merged Suivi column: progress bar + invoice badge
  const renderSuivi = (bc: BonCommande) => {
    const volumeLivre = bc.volume_livre || 0;
    const volumeTotal = bc.volume_m3;
    const progressPct = volumeTotal > 0 ? Math.min(100, (volumeLivre / volumeTotal) * 100) : 0;
    
    let invoiceBadge: React.ReactNode = null;
    if (bc.facture_consolidee_id) {
      invoiceBadge = (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400">
          <Receipt className="h-2.5 w-2.5" />
          Facturé
        </span>
      );
    } else if (bc.statut === 'livre' || bc.statut === 'termine') {
      invoiceBadge = (
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#F59E0B' }}>
          {bt.toInvoice}
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct}%`, height: '100%', borderRadius: 3,
              background: progressPct >= 100 ? '#22C55E' : 'linear-gradient(90deg, #C49A3C, #D4A843)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
            {volumeLivre}/{volumeTotal}
          </span>
        </div>
        {invoiceBadge}
      </div>
    );
  };

  // Kebab menu actions
  const renderKebabMenu = (bc: BonCommande) => {
    const bcIsEmergency = isEmergencyBc(bc);
    const bcCanLaunch = canLaunchProduction(bc);
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-150"
            style={{ background: 'transparent', color: '#D4A843' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; e.currentTarget.style.color = '#E8C96A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D4A843'; }}
            onClick={e => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="min-w-[180px] p-1"
          style={{ 
            background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', 
            border: '1px solid rgba(245, 158, 11, 0.15)', 
            borderRadius: '8px' 
          }}
        >
          {/* Launch Production */}
          {bc.statut === 'pret_production' && bcCanLaunch && (
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onLaunchProduction(bc); }}
              disabled={launchingProduction === bc.bc_id}
              className="gap-2 text-[13px] cursor-pointer rounded-md px-3 py-2 hover:bg-white/[0.06]"
            >
              {launchingProduction === bc.bc_id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span>🚀</span>
              )}
              {bt.launch || 'Lancer Production'}
            </DropdownMenuItem>
          )}
          
          {/* Submit for validation */}
          {bc.statut === 'pret_production' && !bcCanLaunch && isDirecteurOperations && onSubmitForValidation && (
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onSubmitForValidation(bc); }}
              className="gap-2 text-[13px] cursor-pointer rounded-md px-3 py-2 hover:bg-white/[0.06]"
            >
              <Send className="h-3.5 w-3.5" />
              {bt.submit || 'Soumettre'}
            </DropdownMenuItem>
          )}
          
          {/* Add Delivery */}
          {(() => {
            const hasRemainingVolume = bc.statut === 'en_production' && 
              bc.volume_m3 > MULTI_DELIVERY_THRESHOLD && 
              (bc.volume_m3 - (bc.volume_livre || 0)) > 0;
            if (!hasRemainingVolume) return null;
            const linkedBls = bc.linkedBls || [];
            const validatedStatuses = ['validation_technique', 'en_livraison', 'livre', 'facture', 'annule'];
            const allBlsValidated = linkedBls.length === 0 || 
              linkedBls.every(bl => validatedStatuses.includes(bl.workflow_status) || bl.validation_technique === true);
            return (
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onOpenDetail(bc); }}
                disabled={!allBlsValidated}
                className="gap-2 text-[13px] cursor-pointer rounded-md px-3 py-2 hover:bg-white/[0.06]"
              >
                <Truck className="h-3.5 w-3.5" />
                +BL ({(bc.volume_m3 - (bc.volume_livre || 0)).toFixed(1)} m³)
              </DropdownMenuItem>
            );
          })()}

          {/* WhatsApp / Message Client */}
          <DropdownMenuItem 
            className="gap-2 text-[13px] cursor-pointer rounded-md px-3 py-2 hover:bg-white/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <span>💬</span>
            <span className="flex-1">Message Client</span>
          </DropdownMenuItem>

          {/* Copy */}
          <DropdownMenuItem 
            onClick={(e) => { e.stopPropagation(); onCopyBc(bc); }}
            className="gap-2 text-[13px] cursor-pointer rounded-md px-3 py-2 hover:bg-white/[0.06]"
          >
            <span>📋</span>
            Dupliquer
          </DropdownMenuItem>

          {/* PDF */}
          <DropdownMenuItem 
            className="gap-2 text-[13px] cursor-pointer rounded-md px-3 py-2 hover:bg-white/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <span>📄</span>
            <BcPdfGenerator bc={bc} compact />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full table-fixed" style={{ minWidth: '900px' }}>
        <colgroup>
          <col style={{ width: '3%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '6%' }} />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox 
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label={bt.selectAll}
                className={cn(someSelected && "data-[state=checked]:bg-primary/50")}
              />
            </TableHead>
            <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{bt.bcNumber}</TableHead>
            <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{bt.client}</TableHead>
            <TableHead className="text-center" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{bt.formula}</TableHead>
            <TableHead className="text-center" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{bt.deliveryDate}</TableHead>
            <TableHead className="text-right" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{bt.volume}</TableHead>
            <TableHead className="text-right" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{bt.totalHt}</TableHead>
            <TableHead className="text-center" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{bt.status}</TableHead>
            <TableHead className="text-center" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>Suivi</TableHead>
            <TableHead className="text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bcList.map((bc) => {
            const statusConfig = BC_STATUS_CONFIG[bc.statut] || BC_STATUS_CONFIG.pret_production;
            const isSelected = selectedIds.includes(bc.id);
            const bcIsEmergency = isEmergencyBc(bc);
            
            // Get the most advanced BL workflow status for display
            const linkedBls = bc.linkedBls || [];
            const blStatusOrder = ['facture', 'livre', 'en_livraison', 'validation_technique', 'production', 'planification', 'en_attente_validation'];
            const getBlRank = (status: string) => {
              const idx = blStatusOrder.indexOf(status);
              return idx === -1 ? blStatusOrder.length : idx;
            };
            const mostAdvancedBl = linkedBls.length > 0 
              ? linkedBls.reduce((best, bl) => {
                  const bestIndex = getBlRank(best.workflow_status);
                  const currentIndex = getBlRank(bl.workflow_status);
                  return currentIndex < bestIndex ? bl : best;
                })
              : null;
            
            return (
              <TableRow 
                key={bc.id} 
                className={cn(
                  "transition-colors duration-150 cursor-pointer",
                  isSelected && "bg-primary/5",
                  bcIsEmergency && bc.statut === 'pret_production' && "bg-red-500/5 animate-pulse border-l-2 border-l-red-500",
                  bc.statut === 'en_attente_validation' && "bg-amber-500/5 border-l-2 border-l-amber-500"
                )}
                style={{ background: undefined, transition: 'background 200ms' }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(212,168,67,0.03)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = ''; }}
                onClick={() => onOpenDetail(bc)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectOne(bc.id, !!checked)}
                    aria-label={`${bt.select} ${bc.bc_id}`}
                  />
                </TableCell>
                
                {/* PO NO with priority dot */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {renderPriorityDot(bc)}
                    <span
                      style={{ fontFamily: 'ui-monospace, monospace', color: '#D4A843', fontWeight: 500, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                    >{bc.bc_id}</span>
                    {bcIsEmergency && (
                      <Zap className="h-3 w-3 text-red-500 shrink-0" />
                    )}
                  </div>
                </TableCell>
                
                {/* CLIENT - truncate */}
                <TableCell>
                  {bc.client ? (
                    <div className="truncate text-sm">
                      <ClientHoverPreview clientId={bc.client_id} clientName={bc.client.nom_client} />
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                
                {/* FORMULA */}
                <TableCell className="text-center">
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 400, fontSize: 12 }}>{bc.formule_id}</span>
                </TableCell>
                
                {/* DELIVERY DATE */}
                <TableCell className="text-center">{renderDeliveryDate(bc)}</TableCell>
                
                {/* VOLUME */}
                <TableCell className="text-right">
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 300, fontSize: 12 }}>{bc.volume_m3}</span>
                </TableCell>
                
                {/* TOTAL HT */}
                <TableCell className="text-right">
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 300, color: 'white', fontSize: 13 }}>
                    {Number(bc.total_ht).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </TableCell>
                
                {/* STATUS */}
                <TableCell className="text-center">
                  <div className="flex flex-col gap-1 items-center">
                    {bc.statut === 'pret_production' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #22C55E', color: '#22C55E', background: 'rgba(34,197,94,0.08)', fontFamily: 'ui-monospace, monospace', fontSize: 11, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    ) : (bc.statut === 'termine' || bc.statut === 'livre') && !bc.facture_consolidee_id ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #D4A843', color: '#D4A843', background: 'rgba(212,168,67,0.08)', fontFamily: 'ui-monospace, monospace', fontSize: 11, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    ) : (
                      <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", statusConfig.color)} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    )}
                    {mostAdvancedBl && bc.statut === 'en_production' && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge 
                            variant="outline" 
                            className={cn("gap-0.5 text-[9px] px-1.5 py-0", BL_WORKFLOW_STATUS[mostAdvancedBl.workflow_status]?.color || '')}
                          >
                            BL: {BL_WORKFLOW_STATUS[mostAdvancedBl.workflow_status]?.label || mostAdvancedBl.workflow_status}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-medium">{linkedBls.length} BL(s) liés</p>
                            {linkedBls.slice(0, 3).map(bl => (
                              <p key={bl.bl_id} className="text-muted-foreground">
                                {bl.bl_id}: {BL_WORKFLOW_STATUS[bl.workflow_status]?.label || bl.workflow_status}
                              </p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {bc.statut === 'en_attente_validation' && isDirecteurOperations && (
                      <span className="text-[9px] text-amber-500">En attente Admin</span>
                    )}
                  </div>
                </TableCell>
                
                {/* SUIVI (merged Invoice + Progress) */}
                <TableCell className="text-center">
                  {renderSuivi(bc)}
                </TableCell>
                
                {/* ACTIONS (kebab) */}
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  {renderKebabMenu(bc)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
