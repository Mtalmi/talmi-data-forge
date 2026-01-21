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
  FileText,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import DevisPdfGenerator from '@/components/quotes/DevisPdfGenerator';
import { DevisSendDialog } from '@/components/quotes/DevisSendDialog';
import { cn } from '@/lib/utils';

const DEVIS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: { label: 'En Attente', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  accepte: { label: 'Accepté', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  refuse: { label: 'Refusé', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <XCircle className="h-3 w-3" /> },
  converti: { label: 'Converti en BC', color: 'bg-primary/10 text-primary border-primary/30', icon: <ArrowRight className="h-3 w-3" /> },
  expire: { label: 'Expiré', color: 'bg-muted text-muted-foreground border-muted', icon: <AlertTriangle className="h-3 w-3" /> },
};

interface DevisTableProps {
  devisList: Devis[];
  loading: boolean;
  onConvert: (devis: Devis) => void;
}

export function DevisTable({ devisList, loading, onConvert }: DevisTableProps) {
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
        <p className="text-muted-foreground">Aucun devis enregistré</p>
        <p className="text-sm text-muted-foreground mt-1">
          Utilisez le Calculateur de Devis pour créer votre premier devis
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N° Devis</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Formule</TableHead>
          <TableHead className="text-right">Volume</TableHead>
          <TableHead className="text-right">Prix/m³</TableHead>
          <TableHead className="text-right">Total HT</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devisList.map((devis) => {
          const statusConfig = DEVIS_STATUS_CONFIG[devis.statut] || DEVIS_STATUS_CONFIG.en_attente;
          return (
            <TableRow key={devis.id}>
              <TableCell className="font-mono font-medium">{devis.devis_id}</TableCell>
              <TableCell>{devis.client?.nom_client || '—'}</TableCell>
              <TableCell>
                <span className="text-xs">{devis.formule_id}</span>
              </TableCell>
              <TableCell className="text-right font-mono">{devis.volume_m3} m³</TableCell>
              <TableCell className="text-right font-mono">{devis.prix_vente_m3.toLocaleString()} DH</TableCell>
              <TableCell className="text-right font-mono font-medium">
                {devis.total_ht.toLocaleString()} DH
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <DevisSendDialog devis={devis} />
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
