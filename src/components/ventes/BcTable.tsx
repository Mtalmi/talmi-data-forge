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
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { BcPdfGenerator } from '@/components/documents/BcPdfGenerator';
import { ClientHoverPreview } from '@/components/ventes/ClientHoverPreview';
import { WhatsAppShareButton } from '@/components/ventes/WhatsAppShareButton';
import { OrderStatusTimeline } from '@/components/ventes/OrderStatusTimeline';
import { BcApprovalTimeline } from '@/components/ventes/BcApprovalTimeline';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const BC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente_validation: { label: 'En Attente Admin', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse', icon: <Clock className="h-3 w-3" /> },
  pret_production: { label: 'Prêt Production', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: <CheckCircle className="h-3 w-3" /> },
  en_production: { label: 'En Production', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: <Factory className="h-3 w-3" /> },
  en_livraison: { label: 'En Livraison', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30', icon: <Truck className="h-3 w-3" /> },
  en_retour: { label: 'En Retour', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: <Truck className="h-3 w-3" /> },
  termine: { label: 'Terminé', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  livre: { label: 'Livré', color: 'bg-success/10 text-success border-success/30', icon: <Truck className="h-3 w-3" /> },
  facture: { label: 'Facturé', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  refuse: { label: 'Refusé', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertCircle className="h-3 w-3" /> },
};

// BL workflow status display for linked BLs - UNIFIED with workflowStatus.ts palette
const BL_WORKFLOW_STATUS: Record<string, { label: string; color: string }> = {
  en_attente_validation: { label: 'À Confirmer', color: 'bg-slate-500/10 text-slate-600 border-slate-500/30' },
  planification: { label: 'Planifié', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  production: { label: 'En Production', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  en_chargement: { label: 'En Chargement', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  validation_technique: { label: 'Prêt Départ', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  en_livraison: { label: 'En Livraison', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30' },
  en_retour: { label: 'En Retour', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  livre: { label: 'Livré', color: 'bg-success/10 text-success border-success/30' },
  facture: { label: 'Facturé', color: 'bg-success/10 text-success border-success/30' },
};

// Invoice status for BC
const BC_INVOICE_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'bg-muted text-muted-foreground border-muted', icon: <Clock className="h-3 w-3" /> },
  partial: { label: 'Partiel', color: 'bg-warning/10 text-warning border-warning/30', icon: <AlertCircle className="h-3 w-3" /> },
  invoiced: { label: 'Facturé', color: 'bg-success/10 text-success border-success/30', icon: <Receipt className="h-3 w-3" /> },
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
  // Check if delivery is today or past due
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
  
  // High value order
  if (bc.total_ht >= HIGH_VALUE_THRESHOLD) {
    return { isPriority: true, isUrgent: false, reason: `Valeur élevée (${bc.total_ht.toLocaleString()} DH)` };
  }
  
  // High volume order
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

  const handleGenerateInvoice = async (bc: BonCommande) => {
    if (!onGenerateInvoice) return;
    setGeneratingInvoice(bc.bc_id);
    await onGenerateInvoice(bc.bc_id);
    setGeneratingInvoice(null);
  };

  // Check if BC is an emergency bypass
  const isEmergencyBc = (bc: BonCommande) => bc.notes?.includes('[URGENCE/EMERGENCY');

  // Determine if current user can launch production for this BC
  const canLaunchProduction = (bc: BonCommande) => {
    // CEO and Superviseur can always launch
    if (isCeo || isSuperviseur || isAgentAdministratif) return true;
    // Dir Ops can only launch if it's already validated or in emergency window with bypass
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
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Aucun bon de commande</p>
        <p className="text-sm text-muted-foreground mt-1">
          Convertissez un devis pour créer un BC
        </p>
      </div>
    );
  }

  const renderPriorityBadge = (bc: BonCommande) => {
    const priority = getBcPriority(bc);
    if (!priority.isPriority) return null;
    
    if (priority.isUrgent) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="destructive" 
              className="gap-1 animate-pulse"
            >
              <AlertCircle className="h-3 w-3" />
              Urgent
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {priority.reason}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant="outline" 
            className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/30"
          >
            <Star className="h-3 w-3 fill-current" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Priorité: {priority.reason}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderDeliveryDate = (bc: BonCommande) => {
    if (!bc.date_livraison_souhaitee) return '—';
    
    const date = parseISO(bc.date_livraison_souhaitee);
    const priority = getBcPriority(bc);
    
    return (
      <span className={cn(
        "text-sm",
        priority.isUrgent && bc.statut === 'pret_production' && "text-destructive font-medium"
      )}>
        {isToday(date) ? (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            Aujourd'hui
          </span>
        ) : isTomorrow(date) ? (
          <span className="text-warning">Demain</span>
        ) : (
          format(date, 'dd/MM/yyyy', { locale: fr })
        )}
      </span>
    );
  };

  return (
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
          <TableHead>N° BC</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Formule</TableHead>
          <TableHead>Date Livraison</TableHead>
          <TableHead className="text-right">Volume</TableHead>
          <TableHead className="text-right">Total HT</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Facture</TableHead>
          <TableHead>Progression</TableHead>
          <TableHead>Priorité</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bcList.map((bc) => {
          const statusConfig = BC_STATUS_CONFIG[bc.statut] || BC_STATUS_CONFIG.pret_production;
          const isSelected = selectedIds.includes(bc.id);
          const priorityBadge = renderPriorityBadge(bc);
          const bcIsEmergency = isEmergencyBc(bc);
          const bcCanLaunch = canLaunchProduction(bc);
          
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
                "cursor-pointer hover:bg-muted/50",
                isSelected && "bg-primary/5",
                // Emergency BC red pulse glow
                bcIsEmergency && bc.statut === 'pret_production' && "bg-red-500/5 animate-pulse border-l-2 border-l-red-500",
                // Pending validation orange glow
                bc.statut === 'en_attente_validation' && "bg-amber-500/5 border-l-2 border-l-amber-500"
              )}
              onClick={() => onOpenDetail(bc)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectOne(bc.id, !!checked)}
                  aria-label={`Sélectionner ${bc.bc_id}`}
                />
              </TableCell>
              <TableCell className="font-mono font-medium">{bc.bc_id}</TableCell>
              <TableCell>
                {bc.client ? (
                  <ClientHoverPreview clientId={bc.client_id} clientName={bc.client.nom_client} />
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs">{bc.formule_id}</span>
              </TableCell>
              <TableCell>{renderDeliveryDate(bc)}</TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end">
                  <span className="font-mono">{bc.volume_m3} m³</span>
                  {bc.volume_m3 > MULTI_DELIVERY_THRESHOLD && (
                    <span className="text-[10px] text-muted-foreground">
                      {bc.volume_livre || 0}/{bc.volume_m3} livré
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                {bc.total_ht.toLocaleString()} DH
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {/* Emergency Badge */}
                  {bcIsEmergency && (
                    <Badge variant="destructive" className="gap-1 text-[10px]">
                      <Zap className="h-3 w-3" />
                      URGENCE
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                  {/* Show linked BL status if in production */}
                  {mostAdvancedBl && bc.statut === 'en_production' && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          variant="outline" 
                          className={cn("gap-1 text-[10px]", BL_WORKFLOW_STATUS[mostAdvancedBl.workflow_status]?.color || '')}
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
                </div>
              </TableCell>
              <TableCell>
                {/* Invoice Status */}
                {bc.facture_consolidee_id ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className={cn("gap-1", BC_INVOICE_STATUS.invoiced.color)}>
                        {BC_INVOICE_STATUS.invoiced.icon}
                        {BC_INVOICE_STATUS.invoiced.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Facture: {bc.facture_consolidee_id}
                    </TooltipContent>
                  </Tooltip>
                ) : bc.statut === 'livre' || bc.statut === 'termine' ? (
                  <Badge variant="outline" className={cn("gap-1", BC_INVOICE_STATUS.pending.color)}>
                    {BC_INVOICE_STATUS.pending.icon}
                    À facturer
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell>
                <OrderStatusTimeline bc={bc} compact showDeliveryProgress />
              </TableCell>
              <TableCell>
                {priorityBadge || <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Role-Adaptive Action Buttons */}
                  {bc.statut === 'pret_production' && (
                    <>
                      {bcCanLaunch ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onLaunchProduction(bc)}
                          disabled={launchingProduction === bc.bc_id}
                          className={cn("gap-1", bcIsEmergency && "bg-red-600 hover:bg-red-700")}
                        >
                          {launchingProduction === bc.bc_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Factory className="h-3 w-3" />
                          )}
                          Lancer
                        </Button>
                      ) : isDirecteurOperations && onSubmitForValidation ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSubmitForValidation(bc)}
                              className="gap-1 text-amber-600 border-amber-500 hover:bg-amber-50"
                            >
                              <Send className="h-3 w-3" />
                              Soumettre
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Soumettre pour validation prix par l'Agent Admin
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </>
                  )}
                  
                  {/* Pending Validation - show for Dir Ops */}
                  {bc.statut === 'en_attente_validation' && isDirecteurOperations && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/30">
                          <Clock className="h-3 w-3" />
                          En attente Admin
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Prix en attente de validation par l'Agent Administratif
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Add Delivery - only show when ALL linked BLs are validated or past production */}
                  {(() => {
                    const hasRemainingVolume = bc.statut === 'en_production' && 
                      bc.volume_m3 > MULTI_DELIVERY_THRESHOLD && 
                      (bc.volume_m3 - (bc.volume_livre || 0)) > 0;
                    
                    if (!hasRemainingVolume) return null;
                    
                    // Check if all linked BLs are validated (past production phase)
                    const linkedBls = bc.linkedBls || [];
                    const validatedStatuses = ['validation_technique', 'en_livraison', 'livre', 'facture', 'annule'];
                    const allBlsValidated = linkedBls.length === 0 || 
                      linkedBls.every(bl => validatedStatuses.includes(bl.workflow_status) || bl.validation_technique === true);
                    
                    if (!allBlsValidated) {
                      // Show disabled state with explanation
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="gap-1 opacity-50"
                            >
                              <Truck className="h-3 w-3" />
                              +BL
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">En attente validation</p>
                            <p className="text-xs text-muted-foreground">
                              Le BL en cours doit être validé par le centraliste avant d'ajouter une nouvelle livraison
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onOpenDetail(bc)}
                            className="gap-1"
                          >
                            <Truck className="h-3 w-3" />
                            +BL
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Ajouter une livraison ({(bc.volume_m3 - (bc.volume_livre || 0)).toFixed(1)} m³ restants)
                        </TooltipContent>
                      </Tooltip>
                    );
                  })()}
                  <WhatsAppShareButton bc={bc} compact />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCopyBc(bc)}
                        className="gap-1"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Dupliquer cette commande</TooltipContent>
                  </Tooltip>
                  <BcPdfGenerator bc={bc} compact />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
