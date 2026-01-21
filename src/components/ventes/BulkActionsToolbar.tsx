import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import {
  CheckSquare,
  XCircle,
  Download,
  Trash2,
  ChevronDown,
  Mail,
  FileSpreadsheet,
} from 'lucide-react';
import { Devis, BonCommande } from '@/hooks/useSalesWorkflow';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BulkActionsToolbarProps {
  selectedCount: number;
  type: 'devis' | 'bc';
  onMarkRefused?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  onExportCSV?: () => void;
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  type,
  onMarkRefused,
  onCancel,
  onExportCSV,
  onClearSelection,
}: BulkActionsToolbarProps) {
  const [confirmAction, setConfirmAction] = useState<'refuse' | 'cancel' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedCount === 0) return null;

  const handleConfirmAction = async () => {
    setIsProcessing(true);
    try {
      if (confirmAction === 'refuse' && onMarkRefused) {
        await onMarkRefused();
        toast.success(`${selectedCount} élément(s) marqué(s) comme refusé(s)`);
      } else if (confirmAction === 'cancel' && onCancel) {
        await onCancel();
        toast.success(`${selectedCount} élément(s) annulé(s)`);
      }
      onClearSelection();
    } catch (error) {
      toast.error('Erreur lors de l\'action');
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-in slide-in-from-top-2">
        <Badge variant="secondary" className="gap-1">
          <CheckSquare className="h-3 w-3" />
          {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
        </Badge>

        <div className="flex items-center gap-2 ml-auto">
          {/* Export CSV */}
          {onExportCSV && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCSV}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exporter CSV
            </Button>
          )}

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {type === 'devis' && onMarkRefused && (
                <DropdownMenuItem 
                  onClick={() => setConfirmAction('refuse')}
                  className="gap-2 text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Marquer comme Refusé
                </DropdownMenuItem>
              )}
              {type === 'bc' && onCancel && (
                <DropdownMenuItem 
                  onClick={() => setConfirmAction('cancel')}
                  className="gap-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Annuler les BC
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Désélectionner
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'refuse' 
                ? 'Marquer comme Refusé?' 
                : 'Annuler les éléments sélectionnés?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'refuse' 
                ? `Vous êtes sur le point de marquer ${selectedCount} devis comme refusé(s). Cette action est réversible.`
                : `Vous êtes sur le point d'annuler ${selectedCount} bon(s) de commande. Cette action est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'En cours...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// CSV Export utilities
export function exportDevisToCSV(devisList: Devis[], selectedIds: string[]) {
  const selected = devisList.filter(d => selectedIds.includes(d.id));
  
  const headers = ['N° Devis', 'Client', 'Formule', 'Volume (m³)', 'Prix/m³', 'Total HT', 'Statut', 'Date Création'];
  const rows = selected.map(d => [
    d.devis_id,
    d.client?.nom_client || '',
    d.formule_id,
    d.volume_m3.toString(),
    d.prix_vente_m3.toString(),
    d.total_ht.toString(),
    d.statut,
    format(new Date(d.created_at), 'dd/MM/yyyy'),
  ]);

  downloadCSV([headers, ...rows], `devis_export_${format(new Date(), 'yyyyMMdd')}.csv`);
}

export function exportBcToCSV(bcList: BonCommande[], selectedIds: string[]) {
  const selected = bcList.filter(bc => selectedIds.includes(bc.id));
  
  const headers = ['N° BC', 'Client', 'Formule', 'Volume (m³)', 'Total HT', 'Date Livraison', 'Statut'];
  const rows = selected.map(bc => [
    bc.bc_id,
    bc.client?.nom_client || '',
    bc.formule_id,
    bc.volume_m3.toString(),
    bc.total_ht.toString(),
    bc.date_livraison_souhaitee ? format(new Date(bc.date_livraison_souhaitee), 'dd/MM/yyyy') : '',
    bc.statut,
  ]);

  downloadCSV([headers, ...rows], `bc_export_${format(new Date(), 'yyyyMMdd')}.csv`);
}

function downloadCSV(data: string[][], filename: string) {
  const csvContent = data.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success(`Fichier ${filename} téléchargé`);
}
