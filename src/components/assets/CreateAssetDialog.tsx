import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { 
  useFixedAssets, 
  CreateAssetInput, 
  AssetCategory, 
  DepreciationMethod,
  CATEGORY_LABELS,
  CATEGORY_USEFUL_LIFE,
  DEPRECIATION_METHOD_LABELS 
} from '@/hooks/useFixedAssets';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Supplier {
  id: string;
  nom_fournisseur: string;
}

export function CreateAssetDialog({ open, onOpenChange }: CreateAssetDialogProps) {
  const { createAsset, checkDuplicate } = useFixedAssets();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateAssetInput>>({
    category: 'equipements',
    description: '',
    serial_number: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    purchase_price: 0,
    location: 'Centrale',
    useful_life_months: 84,
    depreciation_method: 'linear',
    residual_value: 0,
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase
        .from('fournisseurs')
        .select('id, nom_fournisseur')
        .order('nom_fournisseur');
      setSuppliers((data || []) as Supplier[]);
    };
    if (open) fetchSuppliers();
  }, [open]);

  useEffect(() => {
    // Update useful life when category changes
    if (formData.category) {
      setFormData(prev => ({
        ...prev,
        useful_life_months: CATEGORY_USEFUL_LIFE[prev.category as AssetCategory],
      }));
    }
  }, [formData.category]);

  const handleCheckDuplicate = async () => {
    if (!formData.purchase_date || !formData.purchase_price || !formData.category) return;
    
    const result = await checkDuplicate(
      formData.serial_number || null,
      formData.purchase_date,
      formData.supplier_id || null,
      formData.purchase_price,
      formData.category as AssetCategory
    );

    if (result.isDuplicate) {
      setDuplicateWarning(
        result.matchType === 'serial_number'
          ? `Attention: Un actif avec ce numéro de série existe déjà (${result.duplicateAssetId})`
          : `Attention: Un actif similaire existe déjà (${result.duplicateAssetId})`
      );
    } else {
      setDuplicateWarning(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(handleCheckDuplicate, 500);
    return () => clearTimeout(timer);
  }, [formData.serial_number, formData.purchase_date, formData.supplier_id, formData.purchase_price, formData.category]);

  const calculateMonthlyDepreciation = () => {
    if (!formData.purchase_price || !formData.useful_life_months) return 0;
    return ((formData.purchase_price - (formData.residual_value || 0)) / formData.useful_life_months).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.purchase_price || !formData.purchase_date) {
      return;
    }

    setLoading(true);
    try {
      const result = await createAsset(formData as CreateAssetInput);
      if (result) {
        onOpenChange(false);
        setFormData({
          category: 'equipements',
          description: '',
          serial_number: '',
          purchase_date: format(new Date(), 'yyyy-MM-dd'),
          purchase_price: 0,
          location: 'Centrale',
          useful_life_months: 84,
          depreciation_method: 'linear',
          residual_value: 0,
        });
        setDuplicateWarning(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nouvelle Immobilisation
          </DialogTitle>
          <DialogDescription>
            Enregistrez un nouvel actif avec calcul automatique de l'amortissement
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {duplicateWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{duplicateWarning}</AlertDescription>
            </Alert>
          )}

          {/* Category & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as AssetCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Méthode d'Amortissement</Label>
              <Select
                value={formData.depreciation_method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, depreciation_method: value as DepreciationMethod }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEPRECIATION_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description détaillée de l'actif..."
              required
            />
          </div>

          {/* Serial & Barcode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numéro de Série</Label>
              <Input
                value={formData.serial_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                placeholder="SN-123456"
              />
            </div>

            <div className="space-y-2">
              <Label>Code-barres</Label>
              <Input
                value={formData.barcode || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="1234567890"
              />
            </div>
          </div>

          {/* Purchase Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date d'Acquisition *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.purchase_date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.purchase_date
                      ? format(new Date(formData.purchase_date), 'P', { locale: fr })
                      : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.purchase_date ? new Date(formData.purchase_date) : undefined}
                    onSelect={(date) => setFormData(prev => ({ 
                      ...prev, 
                      purchase_date: date ? format(date, 'yyyy-MM-dd') : '' 
                    }))}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Prix d'Acquisition (DH) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.purchase_price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fournisseur</Label>
              <Select
                value={formData.supplier_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nom_fournisseur}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location & Responsible */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emplacement *</Label>
              <Input
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Centrale, Bureau, Entrepôt..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Responsable</Label>
              <Input
                value={formData.responsible_person || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, responsible_person: e.target.value }))}
                placeholder="Nom du responsable"
              />
            </div>
          </div>

          {/* Depreciation Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Durée de Vie (mois)</Label>
              <Input
                type="number"
                min="1"
                value={formData.useful_life_months || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, useful_life_months: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Valeur Résiduelle (DH)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.residual_value || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, residual_value: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Amort. Mensuel (DH)</Label>
              <Input
                value={calculateMonthlyDepreciation()}
                disabled
                className="bg-muted font-mono"
              />
            </div>
          </div>

          {/* Warranty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fin de Garantie</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.warranty_end_date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.warranty_end_date
                      ? format(new Date(formData.warranty_end_date), 'P', { locale: fr })
                      : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.warranty_end_date ? new Date(formData.warranty_end_date) : undefined}
                    onSelect={(date) => setFormData(prev => ({ 
                      ...prev, 
                      warranty_end_date: date ? format(date, 'yyyy-MM-dd') : undefined 
                    }))}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>N° Facture</Label>
              <Input
                value={formData.invoice_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                placeholder="FAC-2025-001"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !!duplicateWarning}>
              {loading ? 'Enregistrement...' : 'Créer l\'Immobilisation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
