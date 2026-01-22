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
  Shield,
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEVIS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: { label: 'En Attente', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  valide: { label: 'Validé', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
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
  const { isCeo, isSuperviseur, isAgentAdministratif, isDirecteurOperations, isCentraliste, isResponsableTechnique } = useAuth();
  const [validating, setValidating] = useState<string | null>(null);
  
  // Role-based button visibility
  // Only CEO, Superviseur, Agent Admin can VALIDATE a devis
  const canValidateDevis = isCeo || isSuperviseur || isAgentAdministratif;
  // Dir Ops and Centraliste should NOT see validate button - they only see validated jobs
  const isReadOnlyRole = isDirecteurOperations || isCentraliste;
  // Resp Technique can approve technical aspects
  const canApproveTechnical = isCeo || isResponsableTechnique;
  
  const handleValidateDevis = async (devis: Devis) => {
    setValidating(devis.devis_id);
    try {
      const { data, error } = await supabase.rpc('validate_devis', {
        p_devis_id: devis.devis_id,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string; validated_by?: string };
      
      if (result.success) {
        toast.success(`Devis validé par ${result.validated_by}`);
        onRefresh?.();
      } else {
        toast.error(result.error || 'Erreur lors de la validation');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la validation');
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
                <div className="flex items-center gap-1 flex-wrap">
                  {/* Technical Approval Badge for special formulas */}
                  {(devis as any).requires_technical_approval && (
                    <TechnicalApprovalBadge
                      devisId={devis.devis_id}
                      requiresApproval={(devis as any).requires_technical_approval}
                      isApproved={!!(devis as any).technical_approved_at}
                      approvedByName={(devis as any).technical_approved_by_name}
                      approvedAt={(devis as any).technical_approved_at}
                      canApprove={canApproveTechnical}
                      onApproved={onRefresh}
                    />
                  )}
                  
                  {/* Responsibility Stamp if validated */}
                  {(devis as any).validated_by_name && (
                    <ResponsibilityStamp
                      actionType="validated"
                      userName={(devis as any).validated_by_name}
                      userRole={(devis as any).validated_by_role}
                      timestamp={(devis as any).validated_at}
                      compact
                    />
                  )}
                  
                  {/* Duplicate Button */}
                  <DuplicateDevisButton devis={devis} onDuplicated={onRefresh} compact />
                  
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
                  
                  {/* VALIDATE BUTTON - Only for CEO, Superviseur, Agent Admin */}
                  {/* Hidden for Dir Ops and Centraliste - they only see approved jobs */}
                  {devis.statut === 'en_attente' && devis.client_id && !isReadOnlyRole && canValidateDevis && (
                    <Button
                      size="sm"
                      onClick={() => handleValidateDevis(devis)}
                      disabled={validating === devis.devis_id}
                      className="gap-1 bg-success hover:bg-success/90"
                    >
                      {validating === devis.devis_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      Valider
                    </Button>
                  )}
                  
                  {/* Convert to BC Button after validation */}
                  {(devis.statut === 'valide' || devis.statut === 'accepte') && devis.client_id && canValidateDevis && (
                    <Button
                      size="sm"
                      onClick={() => onConvert(devis)}
                      className="gap-1"
                    >
                      <ArrowRight className="h-3 w-3" />
                      Créer BC
                    </Button>
                  )}
                  
                  {devis.statut === 'en_attente' && !devis.client_id && (
                    <span className="text-xs text-muted-foreground">
                      Client requis
                    </span>
                  )}
                  
                  {/* Read-only indicator for Dir Ops / Centraliste */}
                  {isReadOnlyRole && devis.statut === 'en_attente' && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      En attente validation
                    </Badge>
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
