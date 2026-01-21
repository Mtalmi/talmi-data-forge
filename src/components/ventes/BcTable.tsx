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
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { BcPdfGenerator } from '@/components/documents/BcPdfGenerator';
import { ClientHoverPreview } from '@/components/ventes/ClientHoverPreview';
import { WhatsAppShareButton } from '@/components/ventes/WhatsAppShareButton';
import { OrderStatusTimeline } from '@/components/ventes/OrderStatusTimeline';
import { cn } from '@/lib/utils';

const BC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pret_production: { label: 'Prêt Production', color: 'bg-primary/10 text-primary border-primary/30', icon: <CheckCircle className="h-3 w-3" /> },
  en_production: { label: 'En Production', color: 'bg-warning/10 text-warning border-warning/30', icon: <Factory className="h-3 w-3" /> },
  termine: { label: 'Terminé', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  livre: { label: 'Livré', color: 'bg-success/10 text-success border-success/30', icon: <Truck className="h-3 w-3" /> },
  facture: { label: 'Facturé', color: 'bg-primary/10 text-primary border-primary/30', icon: <CheckCircle className="h-3 w-3" /> },
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
  onCopyBc: (bc: BonCommande) => void;
  onOpenDetail: (bc: BonCommande) => void;
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
  onCopyBc,
  onOpenDetail,
  selectedIds,
  onSelectionChange,
}: BcTableProps) {
  
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
          
          return (
            <TableRow 
              key={bc.id} 
              className={cn(
                "cursor-pointer hover:bg-muted/50",
                isSelected && "bg-primary/5"
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
                <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              </TableCell>
              <TableCell>
                <OrderStatusTimeline bc={bc} compact showDeliveryProgress />
              </TableCell>
              <TableCell>
                {priorityBadge || <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Launch Production - for new orders */}
                  {bc.statut === 'pret_production' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onLaunchProduction(bc)}
                      disabled={launchingProduction === bc.bc_id}
                      className="gap-1"
                    >
                      {launchingProduction === bc.bc_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Factory className="h-3 w-3" />
                      )}
                      Lancer
                    </Button>
                  )}
                  {/* Add Delivery - for multi-delivery orders in production */}
                  {bc.statut === 'en_production' && bc.volume_m3 > MULTI_DELIVERY_THRESHOLD && (bc.volume_m3 - (bc.volume_livre || 0)) > 0 && (
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
                  )}
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
