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
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  'pret_production': { label: 'Prêt', color: 'bg-blue-500', icon: Clock },
  'production': { label: 'En Production', color: 'bg-orange-500', icon: Factory },
  'validation_technique': { label: 'Validation', color: 'bg-purple-500', icon: CheckCircle },
  'en_livraison': { label: 'En Livraison', color: 'bg-yellow-500', icon: Truck },
  'livre': { label: 'Livré', color: 'bg-green-500', icon: CheckCircle },
  'facture': { label: 'Facturé', color: 'bg-gray-500', icon: CheckCircle },
};

export function ProductionBatchCardMobile({ 
  batch, 
  onViewDetails,
  onNavigateToBc 
}: ProductionBatchCardMobileProps) {
  const statusConfig = STATUS_CONFIG[batch.workflow_status || 'production'] || STATUS_CONFIG['production'];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="mobile-card hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-primary">
                {batch.bl_id}
              </span>
              {batch.alerte_ecart && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(batch.date_livraison), 'dd MMM yyyy', { locale: fr })}
            </p>
          </div>
          
          <Badge 
            variant="secondary" 
            className={cn("flex items-center gap-1", statusConfig.color, "text-white")}
          >
            <StatusIcon className="h-3 w-3" />
            <span className="text-xs">{statusConfig.label}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Client Info */}
        {batch.client_nom && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-xs text-muted-foreground">Client</span>
            <span className="text-sm font-medium truncate max-w-[200px]">
              {batch.client_nom}
            </span>
          </div>
        )}

        {/* Formule */}
        {batch.formule_nom && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-xs text-muted-foreground">Formule</span>
            <span className="text-sm font-medium">{batch.formule_nom}</span>
          </div>
        )}

        {/* Volume */}
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-xs text-muted-foreground">Volume</span>
          <span className="text-lg font-bold text-primary">{batch.volume_m3} m³</span>
        </div>

        {/* Validation Status */}
        {batch.validation_technique !== null && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-xs text-muted-foreground">Validation Tech.</span>
            <Badge variant={batch.validation_technique ? "secondary" : "destructive"} className={batch.validation_technique ? "bg-success/10 text-success border-success/30" : ""}>
              {batch.validation_technique ? 'Validé' : 'En Attente'}
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={onViewDetails}
            className="flex-1 h-12"
            variant="default"
          >
            <span>Voir Détails</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          
          {batch.bc_id && onNavigateToBc && (
            <Button 
              onClick={onNavigateToBc}
              className="h-12 px-4"
              variant="outline"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
