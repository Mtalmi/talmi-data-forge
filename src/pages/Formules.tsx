import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useFinancialCalculations } from '@/hooks/useFinancialCalculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, FlaskConical, AlertCircle, Loader2, Edit, Trash2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const formuleSchema = z.object({
  formule_id: z.string().min(1, 'ID requis'),
  designation: z.string().min(1, 'Désignation requise'),
  ciment_kg_m3: z.number().min(251, 'Ciment: 251-599 kg/m³').max(599, 'Ciment: 251-599 kg/m³'),
  eau_l_m3: z.number().min(121, 'Eau: 121-219 L/m³').max(219, 'Eau: 121-219 L/m³'),
  adjuvant_l_m3: z.number().min(0, 'Adjuvant >= 0'),
  sable_kg_m3: z.number().min(0).optional(),
  gravier_kg_m3: z.number().min(0).optional(),
  sable_m3: z.number().min(0).optional(),
  gravette_m3: z.number().min(0).optional(),
});

interface Formule {
  formule_id: string;
  designation: string;
  ciment_kg_m3: number;
  eau_l_m3: number;
  adjuvant_l_m3: number;
  sable_kg_m3: number | null;
  gravier_kg_m3: number | null;
  sable_m3: number | null;
  gravette_m3: number | null;
  created_at: string;
}

export default function Formules() {
  const { isCeo, isDirecteurOperations, canEditFormules } = useAuth();
  const { calculateCUT, fetchPrices } = useFinancialCalculations();
  // Directeur Opérations can VIEW formules but not EDIT
  const canManageFormules = canEditFormules && !isDirecteurOperations;
  const [formules, setFormules] = useState<Formule[]>([]);
  const [formuleCuts, setFormuleCuts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingFormule, setEditingFormule] = useState<Formule | null>(null);

  // Form state
  const [formuleId, setFormuleId] = useState('');
  const [designation, setDesignation] = useState('');
  const [ciment, setCiment] = useState('');
  const [eau, setEau] = useState('');
  const [adjuvant, setAdjuvant] = useState('0');
  const [sable, setSable] = useState('');
  const [sableM3, setSableM3] = useState('');
  const [gravier, setGravier] = useState('');
  const [gravetteM3, setGravetteM3] = useState('');

  useEffect(() => {
    fetchFormules();
  }, []);

  const fetchFormules = async () => {
    try {
      const { data, error } = await supabase
        .from('formules_theoriques')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFormules(data || []);
      
      // Calculate CUT for each formula
      if (data && data.length > 0) {
        await fetchPrices();
        const cuts: Record<string, number> = {};
        for (const f of data) {
          const cut = await calculateCUT(f);
          cuts[f.formule_id] = cut;
        }
        setFormuleCuts(cuts);
      }
    } catch (error) {
      console.error('Error fetching formules:', error);
      toast.error('Erreur lors du chargement des formules');
    } finally {
      setLoading(false);
    }
  };

  const calculateRatioEC = () => {
    const c = parseFloat(ciment) || 0;
    const e = parseFloat(eau) || 0;
    if (c === 0) return 0;
    return e / c;
  };

  const resetForm = () => {
    setFormuleId('');
    setDesignation('');
    setCiment('');
    setEau('');
    setAdjuvant('0');
    setSable('');
    setGravier('');
    setErrors({});
    setEditingFormule(null);
  };

  const handleEdit = (f: Formule) => {
    setEditingFormule(f);
    setFormuleId(f.formule_id);
    setDesignation(f.designation);
    setCiment(f.ciment_kg_m3.toString());
    setEau(f.eau_l_m3.toString());
    setAdjuvant(f.adjuvant_l_m3.toString());
    setSable(f.sable_kg_m3?.toString() || '');
    setGravier(f.gravier_kg_m3?.toString() || '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const data = {
        formule_id: formuleId,
        designation,
        ciment_kg_m3: parseFloat(ciment),
        eau_l_m3: parseFloat(eau),
        adjuvant_l_m3: parseFloat(adjuvant) || 0,
        sable_kg_m3: sable ? parseFloat(sable) : undefined,
        gravier_kg_m3: gravier ? parseFloat(gravier) : undefined,
      };

      const validation = formuleSchema.safeParse(data);
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setSubmitting(false);
        return;
      }

      // Check E/C ratio
      const ratio = calculateRatioEC();
      if (ratio >= 0.65) {
        setErrors({ eau_l_m3: 'Ratio E/C doit être < 0.65' });
        setSubmitting(false);
        return;
      }

      if (editingFormule) {
        // Update existing formule
        const { error } = await supabase
          .from('formules_theoriques')
          .update({
            designation: data.designation,
            ciment_kg_m3: data.ciment_kg_m3,
            eau_l_m3: data.eau_l_m3,
            adjuvant_l_m3: data.adjuvant_l_m3,
            sable_kg_m3: data.sable_kg_m3 || null,
            gravier_kg_m3: data.gravier_kg_m3 || null,
          })
          .eq('formule_id', editingFormule.formule_id);

        if (error) throw error;
        toast.success('Formule mise à jour');
      } else {
        // Insert new formule
        const { error } = await supabase.from('formules_theoriques').insert([{
          formule_id: data.formule_id,
          designation: data.designation,
          ciment_kg_m3: data.ciment_kg_m3,
          eau_l_m3: data.eau_l_m3,
          adjuvant_l_m3: data.adjuvant_l_m3,
          sable_kg_m3: data.sable_kg_m3 || null,
          gravier_kg_m3: data.gravier_kg_m3 || null,
        }]);

        if (error) {
          if (error.code === '23505') {
            setErrors({ formule_id: 'Cette formule existe déjà' });
          } else {
            throw error;
          }
          setSubmitting(false);
          return;
        }
        toast.success('Formule créée avec succès');
      }
      resetForm();
      setDialogOpen(false);
      fetchFormules();
    } catch (error) {
      console.error('Error creating formule:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette formule ?')) return;

    try {
      const { error } = await supabase
        .from('formules_theoriques')
        .delete()
        .eq('formule_id', id);

      if (error) throw error;
      toast.success('Formule supprimée');
      fetchFormules();
    } catch (error) {
      console.error('Error deleting formule:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const ratioEC = calculateRatioEC();
  const ratioValid = ratioEC > 0 && ratioEC < 0.65;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Formules Théoriques</h1>
            <p className="text-muted-foreground mt-1">
              Gestion des formules de béton • Référence qualité
            </p>
          </div>
          {canManageFormules && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Formule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingFormule ? 'Modifier la Formule' : 'Créer une Formule'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">ID Formule</Label>
                      <Input
                        placeholder="C25/30-S4-G8"
                        value={formuleId}
                        onChange={(e) => setFormuleId(e.target.value)}
                        className={errors.formule_id ? 'border-destructive' : ''}
                      />
                      {errors.formule_id && (
                        <p className="text-xs text-destructive">{errors.formule_id}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Désignation</Label>
                      <Input
                        placeholder="Béton standard"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className={errors.designation ? 'border-destructive' : ''}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Ciment (kg/m³)</Label>
                      <Input
                        type="number"
                        placeholder="350"
                        value={ciment}
                        onChange={(e) => setCiment(e.target.value)}
                        className={errors.ciment_kg_m3 ? 'border-destructive' : ''}
                      />
                      <p className="text-xs text-muted-foreground">251-599</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Eau (L/m³)</Label>
                      <Input
                        type="number"
                        placeholder="180"
                        value={eau}
                        onChange={(e) => setEau(e.target.value)}
                        className={errors.eau_l_m3 ? 'border-destructive' : ''}
                      />
                      <p className="text-xs text-muted-foreground">121-219</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Adjuvant (L/m³)</Label>
                      <Input
                        type="number"
                        placeholder="2"
                        value={adjuvant}
                        onChange={(e) => setAdjuvant(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* E/C Ratio Display */}
                  {ciment && eau && (
                    <div className={`p-3 rounded-lg border ${ratioValid ? 'border-success/50 bg-success/10' : 'border-destructive/50 bg-destructive/10'}`}>
                      <div className="flex items-center gap-2">
                        {!ratioValid && <AlertCircle className="h-4 w-4 text-destructive" />}
                        <span className="text-sm font-medium">
                          Ratio E/C: {ratioEC.toFixed(3)}
                        </span>
                        <span className={`text-xs ${ratioValid ? 'text-success' : 'text-destructive'}`}>
                          {ratioValid ? '✓ Conforme' : '✗ Doit être < 0.65'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Sable (kg/m³)</Label>
                      <Input
                        type="number"
                        placeholder="800"
                        value={sable}
                        onChange={(e) => setSable(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Gravier (kg/m³)</Label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={gravier}
                        onChange={(e) => setGravier(e.target.value)}
                      />
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
                          Création...
                        </>
                      ) : (
                        'Créer'
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
          ) : formules.length === 0 ? (
            <div className="p-8 text-center">
              <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Aucune formule enregistrée</p>
            </div>
          ) : (
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>ID Formule</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="text-right">Ciment</TableHead>
                  <TableHead className="text-right">Eau</TableHead>
                  <TableHead className="text-right">Ratio E/C</TableHead>
                  <TableHead className="text-right">Adjuvant</TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Calculator className="h-3 w-3" />
                      CUT
                    </span>
                  </TableHead>
                  {canManageFormules && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {formules.map((f) => (
                  <TableRow key={f.formule_id}>
                    <TableCell className="font-mono font-medium">{f.formule_id}</TableCell>
                    <TableCell>{f.designation}</TableCell>
                    <TableCell className="text-right">{f.ciment_kg_m3} kg/m³</TableCell>
                    <TableCell className="text-right">{f.eau_l_m3} L/m³</TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-success">
                        {(f.eau_l_m3 / f.ciment_kg_m3).toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{f.adjuvant_l_m3} L/m³</TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono font-semibold text-primary">
                        {formuleCuts[f.formule_id] ? `${formuleCuts[f.formule_id].toFixed(2)} DH` : '—'}
                      </span>
                    </TableCell>
                    {canManageFormules && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(f)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(f.formule_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
