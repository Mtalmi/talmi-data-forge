import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Factory, 
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface ProductionBatchCardMobileProps {
  batch: {
    bl_id: string;
    date_livraison: string;
    client_nom?: string | null;
    formule_nom?: string | null;
    volume_m3: number;
    workflow_status: string | null;
    alerte_ecart?: boolean | null;
    validation_technique?: boolean | null;
    bc_id?: string | null;
  };
  onViewDetails: () => void;
  onNavigateToBc?: () => void;
}

export function ProductionBatchCardMobile({ 
  batch, 
  onViewDetails,
  onNavigateToBc 
}: ProductionBatchCardMobileProps) {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const pl = t.productionList;

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    'pret_production': { label: pl.ready, color: 'bg-blue-500', icon: Clock },
    'production': { label: pl.inProduction, color: 'bg-orange-500', icon: Factory },
    'validation_technique': { label: pl.validation, color: 'bg-purple-500', icon: CheckCircle },
    'en_livraison': { label: pl.inDelivery, color: 'bg-yellow-500', icon: Truck },
    'livre': { label: pl.delivered, color: 'bg-green-500', icon: CheckCircle },
    'facture': { label: pl.invoiced, color: 'bg-gray-500', icon: CheckCircle },
  };

  const statusConfig = STATUS_CONFIG[batch.workflow_status || 'production'] || STATUS_CONFIG['production'];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="mobile-card hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-primary">{batch.bl_id}</span>
              {batch.alerte_ecart && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(batch.date_livraison), 'dd MMM yyyy', { locale: dateLocale || undefined })}
            </p>
          </div>
          
          <Badge variant="secondary" className={cn("flex items-center gap-1", statusConfig.color, "text-white")}>
            <StatusIcon className="h-3 w-3" />
            <span className="text-xs">{statusConfig.label}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {batch.client_nom && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-xs text-muted-foreground">{t.production.client}</span>
            <span className="text-sm font-medium truncate max-w-[200px]">{batch.client_nom}</span>
          </div>
        )}

        {batch.formule_nom && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-xs text-muted-foreground">{t.production.formula}</span>
            <span className="text-sm font-medium">{batch.formule_nom}</span>
          </div>
        )}

        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-xs text-muted-foreground">{t.common.total}</span>
          <span className="text-lg font-bold text-primary">{batch.volume_m3} m³</span>
        </div>

        {batch.validation_technique !== null && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-xs text-muted-foreground">{pl.techValidation}</span>
            <Badge variant={batch.validation_technique ? "secondary" : "destructive"} className={batch.validation_technique ? "bg-success/10 text-success border-success/30" : ""}>
              {batch.validation_technique ? pl.validated : pl.pending}
            </Badge>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={onViewDetails} className="flex-1 h-12" variant="default">
            <span>{pl.viewDetails}</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          
          {batch.bc_id && onNavigateToBc && (
            <Button onClick={onNavigateToBc} className="h-12 px-4" variant="outline">
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
