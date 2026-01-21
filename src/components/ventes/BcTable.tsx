import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShoppingCart,
  CheckCircle,
  Truck,
  Lock,
  Loader2,
  Factory,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { BcPdfGenerator } from '@/components/documents/BcPdfGenerator';
import { cn } from '@/lib/utils';

const BC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pret_production: { label: 'Prêt Production', color: 'bg-primary/10 text-primary border-primary/30', icon: <CheckCircle className="h-3 w-3" /> },
  en_production: { label: 'En Production', color: 'bg-warning/10 text-warning border-warning/30', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  termine: { label: 'Terminé', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  livre: { label: 'Livré', color: 'bg-success/10 text-success border-success/30', icon: <Truck className="h-3 w-3" /> },
};

interface BcTableProps {
  bcList: BonCommande[];
  loading: boolean;
  launchingProduction: string | null;
  onLaunchProduction: (bc: BonCommande) => void;
  onCopyBc: (bc: BonCommande) => void;
  onOpenDetail: (bc: BonCommande) => void;
}

export function BcTable({
  bcList,
  loading,
  launchingProduction,
  onLaunchProduction,
  onCopyBc,
  onOpenDetail,
}: BcTableProps) {
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N° BC</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Formule</TableHead>
          <TableHead>Date Livraison</TableHead>
          <TableHead className="text-right">Volume</TableHead>
          <TableHead className="text-right">Total HT</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Prix</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bcList.map((bc) => {
          const statusConfig = BC_STATUS_CONFIG[bc.statut] || BC_STATUS_CONFIG.pret_production;
          return (
            <TableRow 
              key={bc.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onOpenDetail(bc)}
            >
              <TableCell className="font-mono font-medium">{bc.bc_id}</TableCell>
              <TableCell>{bc.client?.nom_client || '—'}</TableCell>
              <TableCell>
                <span className="text-xs">{bc.formule_id}</span>
              </TableCell>
              <TableCell>
                {bc.date_livraison_souhaitee ? (
                  <span className="text-sm">
                    {format(new Date(bc.date_livraison_souhaitee), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                ) : '—'}
              </TableCell>
              <TableCell className="text-right font-mono">{bc.volume_m3} m³</TableCell>
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
                {bc.prix_verrouille ? (
                  <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/30">
                    <Lock className="h-3 w-3" />
                    Verrouillé
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/30">
                    Modifiable
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                      Lancer Production
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCopyBc(bc)}
                    className="gap-1"
                    title="Copier vers nouvelle commande"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
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
