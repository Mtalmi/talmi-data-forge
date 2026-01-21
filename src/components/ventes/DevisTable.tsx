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
} from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import DevisPdfGenerator from '@/components/quotes/DevisPdfGenerator';
import { DevisSendDialog } from '@/components/quotes/DevisSendDialog';
import { ClientHoverPreview } from '@/components/ventes/ClientHoverPreview';
import { WhatsAppShareButton } from '@/components/ventes/WhatsAppShareButton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DEVIS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: { label: 'En Attente', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  accepte: { label: 'Accepté', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  refuse: { label: 'Refusé', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <XCircle className="h-3 w-3" /> },
  converti: { label: 'Converti en BC', color: 'bg-primary/10 text-primary border-primary/30', icon: <ArrowRight className="h-3 w-3" /> },
  expire: { label: 'Expiré', color: 'bg-muted text-muted-foreground border-muted', icon: <AlertTriangle className="h-3 w-3" /> },
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
}: DevisTableProps) {
  
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
        <p className="text-muted-foreground">Aucun devis trouvé</p>
        <p className="text-sm text-muted-foreground mt-1">
          Utilisez le Calculateur de Devis ou modifiez vos filtres
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
            Expiré depuis {Math.abs(info.daysUntilExpiration)} jours
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
              ? "Expire aujourd'hui!"
              : `Expire dans ${info.daysUntilExpiration} jour${info.daysUntilExpiration > 1 ? 's' : ''}`
            }
            {devis.date_expiration && (
              <span className="block text-xs opacity-70">
                {format(new Date(devis.date_expiration), 'dd MMMM yyyy', { locale: fr })}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return null;
  };

  const renderPriorityBadge = (devis: Devis) => {
    const priority = isHighPriority(devis);
    if (!priority.isPriority) return null;
    
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
          <TableHead>N° Devis</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Formule</TableHead>
          <TableHead className="text-right">Volume</TableHead>
          <TableHead className="text-right">Total HT</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Priorité</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devisList.map((devis) => {
          const statusConfig = DEVIS_STATUS_CONFIG[devis.statut] || DEVIS_STATUS_CONFIG.en_attente;
          const expirationBadge = renderExpirationBadge(devis);
          const priorityBadge = renderPriorityBadge(devis);
          const isSelected = selectedIds.includes(devis.id);
          
          return (
            <TableRow 
              key={devis.id}
              className={cn(
                "cursor-pointer hover:bg-muted/50 transition-colors",
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
                  '—'
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs">{devis.formule_id}</span>
              </TableCell>
              <TableCell className="text-right font-mono">{devis.volume_m3} m³</TableCell>
              <TableCell className="text-right font-mono font-medium">
                {devis.total_ht.toLocaleString()} DH
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                  {expirationBadge}
                </div>
              </TableCell>
              <TableCell>
                {priorityBadge || <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  {/* Quick Send Button - prominent for pending devis */}
                  {devis.statut === 'en_attente' && devis.client_id && (
                    <>
                      <WhatsAppShareButton devis={devis} compact />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <DevisSendDialog devis={devis} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Envoyer par email</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  <DevisPdfGenerator devis={devis} />
                  {devis.statut === 'en_attente' && devis.client_id && (
                    <Button
                      size="sm"
                      onClick={() => onConvert(devis)}
                      className="gap-1"
                    >
                      <ArrowRight className="h-3 w-3" />
                      Valider BC
                    </Button>
                  )}
                  {devis.statut === 'en_attente' && !devis.client_id && (
                    <span className="text-xs text-muted-foreground">
                      Client requis
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
