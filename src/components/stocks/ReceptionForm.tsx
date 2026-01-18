import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { PackagePlus, Loader2 } from 'lucide-react';

interface Stock {
  materiau: string;
  unite: string;
  quantite_actuelle: number;
}

interface ReceptionFormProps {
  stocks: Stock[];
  onSubmit: (
    materiau: string,
    quantite: number,
    fournisseur: string,
    numeroBl: string,
    notes?: string
  ) => Promise<boolean>;
}

export function ReceptionForm({ stocks, onSubmit }: ReceptionFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [materiau, setMateriau] = useState('');
  const [quantite, setQuantite] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [numeroBl, setNumeroBl] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setMateriau('');
    setQuantite('');
    setFournisseur('');
    setNumeroBl('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const success = await onSubmit(
      materiau,
      parseFloat(quantite),
      fournisseur,
      numeroBl,
      notes || undefined
    );

    if (success) {
      resetForm();
      setOpen(false);
    }
    
    setSubmitting(false);
  };

  const selectedStock = stocks.find(s => s.materiau === materiau);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PackagePlus className="h-4 w-4" />
          Nouvelle Réception
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            Réception de Matières Premières
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="form-label-industrial">Matériau</Label>
            <Select value={materiau} onValueChange={setMateriau} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le matériau..." />
              </SelectTrigger>
              <SelectContent>
                {stocks.map((s) => (
                  <SelectItem key={s.materiau} value={s.materiau}>
                    {s.materiau} ({s.unite})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="form-label-industrial">
                Quantité {selectedStock ? `(${selectedStock.unite})` : ''}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="form-label-industrial">N° BL Fournisseur</Label>
              <Input
                placeholder="BL-2024-001"
                value={numeroBl}
                onChange={(e) => setNumeroBl(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="form-label-industrial">Fournisseur</Label>
            <Input
              placeholder="Nom du fournisseur"
              value={fournisseur}
              onChange={(e) => setFournisseur(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="form-label-industrial">Notes (optionnel)</Label>
            <Textarea
              placeholder="Remarques sur la livraison..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {selectedStock && quantite && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Stock actuel:</span>
                <span className="font-mono font-semibold">
                  {selectedStock.quantite_actuelle.toLocaleString()} {selectedStock.unite}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-muted-foreground">Après réception:</span>
                <span className="font-mono font-semibold text-success">
                  {(selectedStock.quantite_actuelle + parseFloat(quantite || '0')).toLocaleString()} {selectedStock.unite}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer la Réception'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
