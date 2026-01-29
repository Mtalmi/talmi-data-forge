import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Lock,
  ShieldCheck,
  MoreVertical,
  ArrowRight,
  Mail,
  Star,
  Ban,
} from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const DEVIS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; isLocked?: boolean }> = {
  en_attente: { label: 'En Attente', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" />, isLocked: false },
  valide: { label: 'Validé', color: 'bg-success/10 text-success border-success/30', icon: <ShieldCheck className="h-3 w-3" />, isLocked: true },
  accepte: { label: 'Accepté', color: 'bg-success/10 text-success border-success/30', icon: <ShieldCheck className="h-3 w-3" />, isLocked: true },
  refuse: { label: 'Refusé', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <XCircle className="h-3 w-3" />, isLocked: false },
  converti: { label: 'Converti en BC', color: 'bg-primary/10 text-primary border-primary/30', icon: <Lock className="h-3 w-3" />, isLocked: true },
  expire: { label: 'Expiré', color: 'bg-muted text-muted-foreground border-muted', icon: <AlertTriangle className="h-3 w-3" />, isLocked: false },
  annule: { label: 'Annulé', color: 'bg-slate-500/10 text-slate-500 border-slate-500/30', icon: <XCircle className="h-3 w-3" />, isLocked: true },
};

const HIGH_VALUE_THRESHOLD = 50000;
const HIGH_VOLUME_THRESHOLD = 50;

interface ExpirationInfo {
  isExpiring: boolean;
  isExpired: boolean;
  daysUntilExpiration: number;
}

interface DevisCardMobileProps {
  devis: Devis;
  onConvert: (devis: Devis) => void;
  onClick?: (devis: Devis) => void;
  getExpirationInfo?: (devis: Devis) => ExpirationInfo;
  onStatusChange?: (devis: Devis, newStatus: string) => void;
  onQuickSend?: (devis: Devis) => void;
  canApproveDevis: boolean;
  isUpdating?: boolean;
}

const isHighPriority = (devis: Devis): { isPriority: boolean; reason: string } => {
  if (devis.total_ht >= HIGH_VALUE_THRESHOLD) {
    return { isPriority: true, reason: `Valeur élevée (${devis.total_ht.toLocaleString()} DH)` };
  }
  if (devis.volume_m3 >= HIGH_VOLUME_THRESHOLD) {
    return { isPriority: true, reason: `Volume important (${devis.volume_m3} m³)` };
  }
  return { isPriority: false, reason: '' };
};

export function DevisCardMobile({
  devis,
  onConvert,
  onClick,
  getExpirationInfo,
  onStatusChange,
  onQuickSend,
  canApproveDevis,
  isUpdating = false,
}: DevisCardMobileProps) {
  const statusConfig = DEVIS_STATUS_CONFIG[devis.statut] || DEVIS_STATUS_CONFIG.en_attente;
  const priority = isHighPriority(devis);
  const expirationInfo = getExpirationInfo?.(devis);
  const isLocked = statusConfig.isLocked;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or dropdowns
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) {
      return;
    }
    onClick?.(devis);
  };

  return (
    <div
      className={cn(
        "quote-card-mobile cursor-pointer",
        priority.isPriority && "border-primary/30",
        expirationInfo?.isExpiring && "border-warning/30",
        expirationInfo?.isExpired && "border-destructive/30 opacity-60"
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="card-header">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono font-bold text-primary">
              {devis.numero_devis}
            </span>
            {priority.isPriority && (
              <Badge variant="outline" className="text-xs border-primary/30">
                <Star className="h-3 w-3 mr-1" />
                Prioritaire
              </Badge>
            )}
          </div>
          <p className="text-base font-semibold text-foreground">
            {devis.client_nom}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onClick?.(devis)}>
              <FileText className="h-4 w-4 mr-2" />
              Voir détails
            </DropdownMenuItem>
            {onQuickSend && (
              <DropdownMenuItem onClick={() => onQuickSend(devis)}>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer par email
              </DropdownMenuItem>
            )}
            {devis.statut === 'accepte' && !isLocked && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onConvert(devis)}
                  className="text-primary"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Convertir en BC
                </DropdownMenuItem>
              </>
            )}
            {canApproveDevis && onStatusChange && !isLocked && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange(devis, 'accepte')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accepter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(devis, 'refuse')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusChange(devis, 'annule')}
                  className="text-destructive"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Annuler
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      <div className="card-body">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Statut</span>
          <Badge className={cn("text-xs", statusConfig.color)}>
            {statusConfig.icon}
            <span className="ml-1.5">{statusConfig.label}</span>
          </Badge>
        </div>

        {/* Date */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Date</span>
          <span className="text-sm font-medium">
            {format(new Date(devis.date_devis), 'dd MMM yyyy', { locale: fr })}
          </span>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Volume</span>
          <span className="text-sm font-medium">
            {devis.volume_m3} m³
          </span>
        </div>

        {/* Formule */}
        {devis.formule_nom && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Formule</span>
            <span className="text-sm font-medium truncate max-w-[150px]">
              {devis.formule_nom}
            </span>
          </div>
        )}

        {/* Expiration Warning */}
        {expirationInfo?.isExpiring && !expirationInfo.isExpired && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/30">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
            <span className="text-xs text-warning">
              Expire dans {expirationInfo.daysUntilExpiration} jour(s)
            </span>
          </div>
        )}

        {expirationInfo?.isExpired && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-xs text-destructive">
              Devis expiré
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="card-footer">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Total HT</span>
          <span className="text-lg font-bold text-primary">
            {devis.total_ht.toLocaleString()} DH
          </span>
        </div>

        {devis.statut === 'accepte' && !isLocked && (
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onConvert(devis);
            }}
            disabled={isUpdating}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Convertir
          </Button>
        )}
      </div>
    </div>
  );
}
