import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useDepenses, Depense } from '@/hooks/useDepenses';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExportButton } from '@/components/documents/ExportButton';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Receipt, 
  Loader2, 
  Trash2, 
  Eye, 
  RefreshCw,
  Wrench,
  Fuel,
  Paperclip,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  'Pièces Rechange': { icon: <Wrench className="h-4 w-4" />, color: 'bg-orange-500/20 text-orange-500' },
  'Carburant': { icon: <Fuel className="h-4 w-4" />, color: 'bg-blue-500/20 text-blue-500' },
  'Bureau': { icon: <Paperclip className="h-4 w-4" />, color: 'bg-purple-500/20 text-purple-500' },
  'Divers': { icon: <Package className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
};

export default function Depenses() {
  const { isCeo } = useAuth();
  const { depenses, stats, loading, refresh, deleteDepense } = useDepenses();
  
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [depenseToDelete, setDepenseToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleView = (depense: Depense) => {
    setSelectedDepense(depense);
    setViewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!depenseToDelete) return;
    setDeleting(true);
    await deleteDepense(depenseToDelete);
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDepenseToDelete(null);
  };

  const getCategoryBadge = (categorie: string) => {
    const config = CATEGORY_CONFIG[categorie] || CATEGORY_CONFIG['Divers'];
    return (
      <Badge variant="outline" className={cn('gap-1', config.color)}>
        {config.icon}
        {categorie}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Gestion des Dépenses</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              Suivi des dépenses avec justificatifs obligatoires
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ExportButton
              data={depenses.map(d => ({
                date: d.date_depense,
                categorie: d.categorie,
                description: d.description || '',
                montant: d.montant,
              }))}
              columns={[
                { key: 'date', label: 'Date' },
                { key: 'categorie', label: 'Catégorie' },
                { key: 'description', label: 'Description' },
                { key: 'montant', label: 'Montant (DH)' },
              ]}
              filename="depenses"
            />
            <Button variant="outline" size="sm" onClick={refresh} className="min-h-[40px]">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            <ExpenseForm onSuccess={refresh} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Dépenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">
                {stats.totalDepenses.toLocaleString('fr-FR')}
                <span className="text-sm font-normal text-muted-foreground ml-1">DH</span>
              </p>
            </CardContent>
          </Card>

          {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
            <Card key={cat}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {config.icon}
                  {cat}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold font-mono">
                  {(stats.byCategorie[cat] || 0).toLocaleString('fr-FR')}
                  <span className="text-xs font-normal text-muted-foreground ml-1">DH</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.countByCategorie[cat] || 0} entrées
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Expenses Table */}
        <div className="card-industrial overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : depenses.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Aucune dépense enregistrée</p>
            </div>
          ) : (
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Reçu</TableHead>
                  {isCeo && <TableHead className="w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {depenses.map((dep) => (
                  <TableRow key={dep.id}>
                    <TableCell>
                      {format(new Date(dep.date_depense), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{getCategoryBadge(dep.categorie)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {dep.description || '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {dep.montant.toLocaleString('fr-FR')} DH
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(dep)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    {isCeo && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDepenseToDelete(dep.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* View Receipt Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Détail de la Dépense
              </DialogTitle>
            </DialogHeader>
            {selectedDepense && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedDepense.date_depense), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Catégorie</p>
                    <div className="mt-1">{getCategoryBadge(selectedDepense.categorie)}</div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Montant</p>
                    <p className="font-bold font-mono text-lg">
                      {selectedDepense.montant.toLocaleString('fr-FR')} DH
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Description</p>
                    <p className="font-medium">{selectedDepense.description || '—'}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Photo du Reçu</p>
                  <img
                    src={selectedDepense.photo_recu_url}
                    alt="Reçu"
                    className="w-full rounded-lg border"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La dépense sera définitivement supprimée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Supprimer'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
