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
  Clock,
  Truck,
  Receipt,
  MoreVertical,
  AlertTriangle,
  Shield,
  Zap,
} from 'lucide-react';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const BC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: { label: 'En Attente', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  en_attente_validation: { label: 'En Attente Admin', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  pret_production: { label: 'Prêt Production', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: <CheckCircle className="h-3 w-3" /> },
  valide: { label: 'Validé', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  en_production: { label: 'En Production', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: <Truck className="h-3 w-3" /> },
  livre: { label: 'Livré', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  facture: { label: 'Facturé', color: 'bg-primary/10 text-primary border-primary/30', icon: <Receipt className="h-3 w-3" /> },
  annule: { label: 'Annulé', color: 'bg-slate-500/10 text-slate-500 border-slate-500/30', icon: <AlertTriangle className="h-3 w-3" /> },
};

interface BcCardMobileProps {
  bc: BonCommande;
  onClick?: (bc: BonCommande) => void;
  onCreateBL?: (bc: BonCommande) => void;
  onGenerateInvoice?: (bc: BonCommande) => void;
  canCreateBL?: boolean;
  canGenerateInvoice?: boolean;
  isEmergency?: boolean;
}

export function BcCardMobile({
  bc,
  onClick,
  onCreateBL,
  onGenerateInvoice,
  canCreateBL = false,
  canGenerateInvoice = false,
  isEmergency = false,
}: BcCardMobileProps) {
  const statusConfig = BC_STATUS_CONFIG[bc.statut] || BC_STATUS_CONFIG.en_attente;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) {
      return;
    }
    onClick?.(bc);
  };

  const clientName = bc.client?.nom_client || '—';
  const formuleName = bc.formule?.designation;

  return (
    <div
      className={cn(
        "quote-card-mobile cursor-pointer",
        isEmergency && "border-destructive/30 bg-destructive/5"
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="card-header">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono font-bold text-primary">
              {bc.bc_id}
            </span>
            {isEmergency && (
              <Badge variant="destructive" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Urgence
              </Badge>
            )}
            {bc.validated_by && (
              <Badge variant="outline" className="text-xs border-success/30 text-success">
                <Shield className="h-3 w-3 mr-1" />
                Validé
              </Badge>
            )}
          </div>
          <p className="text-base font-semibold text-foreground">
            {clientName}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onClick?.(bc)}>
              <FileText className="h-4 w-4 mr-2" />
              Voir détails
            </DropdownMenuItem>
            {canCreateBL && (bc.statut === 'valide' || bc.statut === 'pret_production') && onCreateBL && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onCreateBL(bc)}
                  className="text-primary"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Créer BL
                </DropdownMenuItem>
              </>
            )}
            {canGenerateInvoice && bc.statut === 'livre' && onGenerateInvoice && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onGenerateInvoice(bc)}
                  className="text-primary"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Générer facture
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
            {format(new Date(bc.created_at), 'dd MMM yyyy', { locale: fr })}
          </span>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Volume</span>
          <span className="text-sm font-medium">
            {bc.volume_m3} m³
          </span>
        </div>

        {/* Formule */}
        {formuleName && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Formule</span>
            <span className="text-sm font-medium truncate max-w-[150px]">
              {formuleName}
            </span>
          </div>
        )}

        {/* Devis Reference */}
        {bc.devis_id && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Devis</span>
            <span className="text-xs font-mono text-muted-foreground">
              {bc.devis_id}
            </span>
          </div>
        )}

        {/* Emergency Warning */}
        {isEmergency && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-xs text-destructive">
              BC créé en urgence - Nécessite validation
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="card-footer">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Total HT</span>
          <span className="text-lg font-bold text-primary">
            {bc.total_ht.toLocaleString()} DH
          </span>
        </div>

        {canCreateBL && (bc.statut === 'valide' || bc.statut === 'pret_production') && onCreateBL && (
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onCreateBL(bc);
            }}
            className="gap-2"
          >
            <Truck className="h-4 w-4" />
            Créer BL
          </Button>
        )}

        {canGenerateInvoice && bc.statut === 'livre' && onGenerateInvoice && (
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onGenerateInvoice(bc);
            }}
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            Facturer
          </Button>
        )}
      </div>
    </div>
  );
}
