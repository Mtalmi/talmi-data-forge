import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Package } from 'lucide-react';
import { Fournisseur } from '@/hooks/useFournisseurs';
import { format } from 'date-fns';

interface LigneAchatForm {
  id: string;
  materiau: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  montant_ligne: number;
}

interface PurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fournisseurs: Fournisseur[];
  onSubmit: (
    achat: { numero_achat: string; fournisseur_id: string; date_livraison_prevue?: string; notes?: string },
    lignes: { materiau: string; quantite: number; unite: string; prix_unitaire: number; montant_ligne: number }[]
  ) => Promise<boolean>;
}

const MATERIAUX = [
  { value: 'Ciment', unite: 'T' },
  { value: 'Sable', unite: 'm³' },
  { value: 'Gravette', unite: 'm³' },
  { value: 'Gravier', unite: 'm³' },
  { value: 'Adjuvant', unite: 'L' },
  { value: 'Eau', unite: 'm³' },
  { value: 'Autre', unite: 'Unité' },
];

export default function PurchaseOrderForm({ open, onOpenChange, fournisseurs, onSubmit }: PurchaseOrderFormProps) {
  const [formData, setFormData] = useState({
    numero_achat: `ACH-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
    fournisseur_id: '',
    date_livraison_prevue: '',
    notes: '',
  });

  const [lignes, setLignes] = useState<LigneAchatForm[]>([
    { id: crypto.randomUUID(), materiau: '', quantite: 0, unite: 'T', prix_unitaire: 0, montant_ligne: 0 }
  ]);

  const [submitting, setSubmitting] = useState(false);

  const handleAddLigne = () => {
    setLignes([
      ...lignes,
      { id: crypto.randomUUID(), materiau: '', quantite: 0, unite: 'T', prix_unitaire: 0, montant_ligne: 0 }
    ]);
  };

  const handleRemoveLigne = (id: string) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter(l => l.id !== id));
    }
  };

  const handleLigneChange = (id: string, field: keyof LigneAchatForm, value: string | number) => {
    setLignes(lignes.map(l => {
      if (l.id !== id) return l;
      
      const updated = { ...l, [field]: value };
      
      // Auto-set unite when materiau changes
      if (field === 'materiau') {
        const mat = MATERIAUX.find(m => m.value === value);
        if (mat) updated.unite = mat.unite;
      }
      
      // Recalculate montant_ligne
      if (field === 'quantite' || field === 'prix_unitaire') {
        updated.montant_ligne = updated.quantite * updated.prix_unitaire;
      }
      
      return updated;
    }));
  };

  const totalHT = lignes.reduce((sum, l) => sum + l.montant_ligne, 0);
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;

  const handleSubmit = async () => {
    if (!formData.fournisseur_id) return;
    if (lignes.every(l => !l.materiau || l.quantite <= 0)) return;

    setSubmitting(true);
    const validLignes = lignes
      .filter(l => l.materiau && l.quantite > 0)
      .map(({ id, ...rest }) => rest);

    const success = await onSubmit(formData, validLignes);
    
    if (success) {
      // Reset form
      setFormData({
        numero_achat: `ACH-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        fournisseur_id: '',
        date_livraison_prevue: '',
        notes: '',
      });
      setLignes([{ id: crypto.randomUUID(), materiau: '', quantite: 0, unite: 'T', prix_unitaire: 0, montant_ligne: 0 }]);
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  const formatCurrency = (val: number) => val.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DH';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nouvelle Commande d'Achat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>N° Commande</Label>
              <Input
                value={formData.numero_achat}
                onChange={(e) => setFormData({ ...formData, numero_achat: e.target.value })}
                className="font-mono"
              />
            </div>
            
            <div>
              <Label>Fournisseur *</Label>
              <Select
                value={formData.fournisseur_id}
                onValueChange={(v) => setFormData({ ...formData, fournisseur_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {fournisseurs.filter(f => f.actif).map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nom_fournisseur} ({f.code_fournisseur})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Date de livraison souhaitée</Label>
              <Input
                type="date"
                value={formData.date_livraison_prevue}
                onChange={(e) => setFormData({ ...formData, date_livraison_prevue: e.target.value })}
              />
            </div>
          </div>

          {/* Line Items */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Lignes de commande</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLigne}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter ligne
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Matériau</TableHead>
                    <TableHead className="w-[100px]">Quantité</TableHead>
                    <TableHead className="w-[80px]">Unité</TableHead>
                    <TableHead className="w-[120px]">Prix unitaire</TableHead>
                    <TableHead className="w-[120px] text-right">Montant</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((ligne, index) => (
                    <TableRow key={ligne.id}>
                      <TableCell>
                        <Select
                          value={ligne.materiau}
                          onValueChange={(v) => handleLigneChange(ligne.id, 'materiau', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                          <SelectContent>
                            {MATERIAUX.map(m => (
                              <SelectItem key={m.value} value={m.value}>{m.value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ligne.quantite || ''}
                          onChange={(e) => handleLigneChange(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={ligne.unite}
                          onValueChange={(v) => handleLigneChange(ligne.id, 'unite', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="T">T</SelectItem>
                            <SelectItem value="m³">m³</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="Unité">Unité</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ligne.prix_unitaire || ''}
                          onChange={(e) => handleLigneChange(ligne.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(ligne.montant_ligne)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLigne(ligne.id)}
                          disabled={lignes.length === 1}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total HT</span>
                    <span className="font-medium">{formatCurrency(totalHT)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA (20%)</span>
                    <span>{formatCurrency(tva)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatCurrency(totalTTC)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <Label>Notes / Instructions</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instructions de livraison, références, etc."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !formData.fournisseur_id || lignes.every(l => !l.materiau)}
            >
              {submitting ? 'Création...' : 'Créer la commande'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
