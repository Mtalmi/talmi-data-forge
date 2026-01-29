import { useState, useEffect } from 'react';
import { ProductionBatchCardMobile } from './ProductionBatchCardMobile';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Factory, 
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Batch {
  bl_id: string;
  date_livraison: string;
  client_nom?: string | null;
  formule_nom?: string | null;
  volume_m3: number;
  workflow_status: string | null;
  alerte_ecart?: boolean | null;
  validation_technique?: boolean | null;
  bc_id?: string | null;
  ciment_reel_kg?: number;
  adjuvant_reel_l?: number | null;
  eau_reel_l?: number | null;
}

interface ProductionBatchListResponsiveProps {
  batches: Batch[];
  onViewDetails: (batch: Batch) => void;
  onNavigateToBc?: (bcId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  'pret_production': { label: 'Prêt', color: 'bg-blue-500', icon: Clock },
  'production': { label: 'En Production', color: 'bg-orange-500', icon: Factory },
  'validation_technique': { label: 'Validation', color: 'bg-purple-500', icon: CheckCircle },
  'en_livraison': { label: 'En Livraison', color: 'bg-yellow-500', icon: Truck },
  'livre': { label: 'Livré', color: 'bg-green-500', icon: CheckCircle },
  'facture': { label: 'Facturé', color: 'bg-gray-500', icon: CheckCircle },
};

export function ProductionBatchListResponsive({
  batches,
  onViewDetails,
  onNavigateToBc
}: ProductionBatchListResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="space-y-3 pb-20">
        {batches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun lot en production</p>
          </div>
        ) : (
          batches.map((batch) => (
            <ProductionBatchCardMobile
              key={batch.bl_id}
              batch={batch}
              onViewDetails={() => onViewDetails(batch)}
              onNavigateToBc={batch.bc_id && onNavigateToBc ? () => onNavigateToBc(batch.bc_id!) : undefined}
            />
          ))
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>BL ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Formule</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Validation</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun lot en production</p>
              </TableCell>
            </TableRow>
          ) : (
            batches.map((batch) => {
              const statusConfig = STATUS_CONFIG[batch.workflow_status || 'production'] || STATUS_CONFIG['production'];
              const StatusIcon = statusConfig.icon;

              return (
                <TableRow key={batch.bl_id}>
                  <TableCell className="font-mono font-semibold">
                    <div className="flex items-center gap-2">
                      {batch.bl_id}
                      {batch.alerte_ecart && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(batch.date_livraison), 'dd/MM/yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>{batch.client_nom || '-'}</TableCell>
                  <TableCell>{batch.formule_nom || '-'}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {batch.volume_m3} m³
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={cn("flex items-center gap-1 w-fit", statusConfig.color, "text-white")}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span className="text-xs">{statusConfig.label}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {batch.validation_technique !== null && (
                      <Badge variant={batch.validation_technique ? "success" : "destructive"}>
                        {batch.validation_technique ? 'Validé' : 'En Attente'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        onClick={() => onViewDetails(batch)}
                        size="sm"
                        variant="default"
                      >
                        Détails
                      </Button>
                      {batch.bc_id && onNavigateToBc && (
                        <Button 
                          onClick={() => onNavigateToBc(batch.bc_id!)}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
