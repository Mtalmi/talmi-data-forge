import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Lock, ShieldCheck, MoreVertical, ArrowRight, Mail, Star, Ban } from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

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

export function DevisCardMobile({
  devis, onConvert, onClick, getExpirationInfo, onStatusChange, onQuickSend, canApproveDevis, isUpdating = false,
}: DevisCardMobileProps) {
  const { t, lang } = useI18n();
  const dc = t.devisCardMobile;
  const dateLocale = getDateLocale(lang);

  const STATUS_ICONS: Record<string, React.ReactNode> = {
    en_attente: <Clock className="h-3 w-3" />,
    valide: <ShieldCheck className="h-3 w-3" />,
    accepte: <ShieldCheck className="h-3 w-3" />,
    refuse: <XCircle className="h-3 w-3" />,
    converti: <Lock className="h-3 w-3" />,
    expire: <AlertTriangle className="h-3 w-3" />,
    annule: <XCircle className="h-3 w-3" />,
  };

  const STATUS_COLORS: Record<string, string> = {
    en_attente: 'bg-warning/10 text-warning border-warning/30',
    valide: 'bg-success/10 text-success border-success/30',
    accepte: 'bg-success/10 text-success border-success/30',
    refuse: 'bg-destructive/10 text-destructive border-destructive/30',
    converti: 'bg-primary/10 text-primary border-primary/30',
    expire: 'bg-muted text-muted-foreground border-muted',
    annule: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
  };

  const LOCKED_STATUSES = ['valide', 'accepte', 'converti', 'annule'];
  const statusLabels = dc.statuses as Record<string, string>;

  const statusColor = STATUS_COLORS[devis.statut] || STATUS_COLORS.en_attente;
  const statusIcon = STATUS_ICONS[devis.statut] || STATUS_ICONS.en_attente;
  const statusLabel = statusLabels[devis.statut] || statusLabels.en_attente;
  const isLocked = LOCKED_STATUSES.includes(devis.statut);

  const isHighPriority = devis.total_ht >= HIGH_VALUE_THRESHOLD || devis.volume_m3 >= HIGH_VOLUME_THRESHOLD;
  const expirationInfo = getExpirationInfo?.(devis);
  const clientName = devis.client?.nom_client || '—';
  const formuleName = devis.formule?.designation;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return;
    onClick?.(devis);
  };

  return (
    <div
      className={cn(
        "quote-card-mobile cursor-pointer",
        isHighPriority && "border-primary/30",
        expirationInfo?.isExpiring && "border-warning/30",
        expirationInfo?.isExpired && "border-destructive/30 opacity-60"
      )}
      onClick={handleCardClick}
    >
      <div className="card-header">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono font-bold text-primary">{devis.devis_id}</span>
            {isHighPriority && (
              <Badge variant="outline" className="text-xs border-primary/30">
                <Star className="h-3 w-3 mr-1" />{dc.priority}
              </Badge>
            )}
          </div>
          <p className="text-base font-semibold text-foreground">{clientName}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onClick?.(devis)}>
              <FileText className="h-4 w-4 mr-2" />{dc.viewDetails}
            </DropdownMenuItem>
            {onQuickSend && (
              <DropdownMenuItem onClick={() => onQuickSend(devis)}>
                <Mail className="h-4 w-4 mr-2" />{dc.sendByEmail}
              </DropdownMenuItem>
            )}
            {devis.statut === 'accepte' && !isLocked && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onConvert(devis)} className="text-primary">
                  <ArrowRight className="h-4 w-4 mr-2" />{dc.convertToBc}
                </DropdownMenuItem>
              </>
            )}
            {canApproveDevis && onStatusChange && !isLocked && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange(devis, 'accepte')}>
                  <CheckCircle className="h-4 w-4 mr-2" />{dc.accept}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(devis, 'refuse')}>
                  <XCircle className="h-4 w-4 mr-2" />{dc.refuse}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(devis, 'annule')} className="text-destructive">
                  <Ban className="h-4 w-4 mr-2" />{dc.cancel}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="card-body">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{dc.status}</span>
          <Badge className={cn("text-xs", statusColor)}>
            {statusIcon}<span className="ml-1.5">{statusLabel}</span>
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{dc.date}</span>
          <span className="text-sm font-medium">
            {format(new Date(devis.created_at), 'dd MMM yyyy', { locale: dateLocale || undefined })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{dc.volume}</span>
          <span className="text-sm font-medium">{devis.volume_m3} m³</span>
        </div>
        {formuleName && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{dc.formula}</span>
            <span className="text-sm font-medium truncate max-w-[150px]">{formuleName}</span>
          </div>
        )}
        {expirationInfo?.isExpiring && !expirationInfo.isExpired && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/30">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
            <span className="text-xs text-warning">
              {dc.expiresIn.replace('{days}', String(expirationInfo.daysUntilExpiration))}
            </span>
          </div>
        )}
        {expirationInfo?.isExpired && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-xs text-destructive">{dc.quoteExpired}</span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{dc.totalHT}</span>
          <span className="text-lg font-bold text-primary">{devis.total_ht.toLocaleString()} DH</span>
        </div>
        {devis.statut === 'accepte' && !isLocked && (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onConvert(devis); }} disabled={isUpdating} className="gap-2">
            <ArrowRight className="h-4 w-4" />{dc.convert}
          </Button>
        )}
      </div>
    </div>
  );
}
