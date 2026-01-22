import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, DollarSign, Loader2, Edit, Trash2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Prix {
  matiere_premiere: string;
  prix_unitaire_dh: number;
  unite_mesure: string;
  prix_precedent: number | null;
  date_mise_a_jour: string;
  created_at: string;
}

const MATIERES = ['Ciment', 'Sable', 'Gravier', 'Eau', 'Adjuvant', 'Gasoil'];
const UNITES = ['Tonne', 'Litre', 'm³', 'Kg'];

export default function Prix() {
  const { isCeo } = useAuth();
  const [prix, setPrix] = useState<Prix[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingPrix, setEditingPrix] = useState<Prix | null>(null);

  // Form state
  const [matiere, setMatiere] = useState('');
  const [prixUnitaire, setPrixUnitaire] = useState('');
  const [unite, setUnite] = useState('Tonne');

  useEffect(() => {
    fetchPrix();
  }, []);

  const fetchPrix = async () => {
    try {
      const { data, error } = await supabase
        .from('prix_achat_actuels')
        .select('*')
        .order('matiere_premiere');

      if (error) throw error;
      setPrix(data || []);
    } catch (error) {
      console.error('Error fetching prix:', error);
      toast.error('Erreur lors du chargement des prix');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMatiere('');
    setPrixUnitaire('');
    setUnite('Tonne');
    setEditingPrix(null);
  };

  const handleEdit = (p: Prix) => {
    setEditingPrix(p);
    setMatiere(p.matiere_premiere);
    setPrixUnitaire(p.prix_unitaire_dh.toString());
    setUnite(p.unite_mesure);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!matiere || !prixUnitaire) {
        toast.error('Matière et prix requis');
        setSubmitting(false);
        return;
      }

      const prixValue = parseFloat(prixUnitaire);
      if (prixValue <= 0) {
        toast.error('Le prix doit être positif');
        setSubmitting(false);
        return;
      }

      // Check if matiere exists (upsert)
      const existing = prix.find(p => p.matiere_premiere === matiere);

      if (existing) {
        const { error } = await supabase
          .from('prix_achat_actuels')
          .update({
            prix_precedent: existing.prix_unitaire_dh,
            prix_unitaire_dh: prixValue,
            unite_mesure: unite,
            date_mise_a_jour: new Date().toISOString(),
          })
          .eq('matiere_premiere', matiere);

        if (error) throw error;
        toast.success('Prix mis à jour');
      } else {
        const { error } = await supabase.from('prix_achat_actuels').insert([{
          matiere_premiere: matiere,
          prix_unitaire_dh: prixValue,
          unite_mesure: unite,
          date_mise_a_jour: new Date().toISOString(),
        }]);

        if (error) throw error;
        toast.success('Prix ajouté');
      }

      resetForm();
      setDialogOpen(false);
      fetchPrix();
    } catch (error) {
      console.error('Error saving prix:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (matiere: string) => {
    if (!confirm('Supprimer ce prix ?')) return;

    try {
      const { error } = await supabase
        .from('prix_achat_actuels')
        .delete()
        .eq('matiere_premiere', matiere);

      if (error) throw error;
      toast.success('Prix supprimé');
      fetchPrix();
    } catch (error) {
      console.error('Error deleting prix:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getVariation = (current: number, previous: number | null) => {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prix d'Achat</h1>
            <p className="text-muted-foreground mt-1">
              Gestion des prix des matières premières
            </p>
          </div>
          {isCeo && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Prix
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPrix ? 'Modifier le Prix' : 'Ajouter un Prix'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="form-label-industrial">Matière Première</Label>
                    <Select value={matiere} onValueChange={setMatiere}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MATIERES.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Prix Unitaire (DH)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1200.00"
                        value={prixUnitaire}
                        onChange={(e) => setPrixUnitaire(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Unité</Label>
                      <Select value={unite} onValueChange={setUnite}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITES.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        'Enregistrer'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Table */}
        <div className="card-industrial overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : prix.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Aucun prix enregistré</p>
            </div>
          ) : (
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>Matière</TableHead>
                  <TableHead className="text-right">Prix Actuel</TableHead>
                  <TableHead className="text-right">Prix Précédent</TableHead>
                  <TableHead className="text-right">Variation</TableHead>
                  <TableHead>Mise à jour</TableHead>
                  {isCeo && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {prix.map((p) => {
                  const variation = getVariation(p.prix_unitaire_dh, p.prix_precedent);
                  const hasAlert = variation !== null && Math.abs(variation) > 10;

                  return (
                    <TableRow key={p.matiere_premiere} className={hasAlert ? 'bg-warning/5' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {p.matiere_premiere}
                          {hasAlert && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {p.prix_unitaire_dh.toFixed(2)} DH/{p.unite_mesure}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {p.prix_precedent ? `${p.prix_precedent.toFixed(2)} DH` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {variation !== null ? (
                          <span className={cn(
                            'inline-flex items-center gap-1 font-mono text-sm',
                            variation > 0 ? 'text-destructive' : 'text-success'
                          )}>
                            {variation > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(p.date_mise_a_jour), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      {isCeo && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(p)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(p.matiere_premiere)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
