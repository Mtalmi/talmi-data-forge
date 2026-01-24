import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDepenses } from '@/hooks/useDepenses';
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
import { 
  Plus, 
  Upload, 
  Loader2, 
  Camera, 
  Receipt, 
  X,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'Pièces Rechange', label: 'Pièces Rechange', icon: '🔧' },
  { value: 'Carburant', label: 'Carburant', icon: '⛽' },
  { value: 'Bureau', label: 'Bureau', icon: '📎' },
  { value: 'Divers', label: 'Divers', icon: '📦' },
];

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { isCeo, isAgentAdministratif, isDirecteurOperations } = useAuth();
  const { uploadReceipt, addDepense } = useDepenses();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [dateDepense, setDateDepense] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categorie, setCategorie] = useState('');
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCreate = isCeo || isAgentAdministratif || isDirecteurOperations;

  const resetForm = () => {
    setDateDepense(format(new Date(), 'yyyy-MM-dd'));
    setCategorie('');
    setMontant('');
    setDescription('');
    setPhotoUrl(null);
    setPhotoPreview(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 5MB)');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    setUploading(true);
    const url = await uploadReceipt(file);
    setUploading(false);

    if (url) {
      setPhotoUrl(url);
      toast.success('Photo téléchargée');
    } else {
      toast.error('Erreur lors du téléchargement');
      setPhotoPreview(null);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl) {
      toast.error('Photo du reçu obligatoire');
      return;
    }

    if (!categorie) {
      toast.error('Veuillez sélectionner une catégorie');
      return;
    }

    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      toast.error('Montant invalide');
      return;
    }

    setSubmitting(true);

    const success = await addDepense({
      date_depense: dateDepense,
      categorie,
      montant: montantNum,
      description: description || null,
      photo_recu_url: photoUrl,
    });

    setSubmitting(false);

    if (success) {
      toast.success('Dépense enregistrée');
      setDialogOpen(false);
      resetForm();
      onSuccess?.();
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  if (!canCreate) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => {
      setDialogOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Dépense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Enregistrer une Dépense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Photo Upload - MANDATORY */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Photo du Reçu
              <span className="text-destructive">*</span>
            </Label>
            
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Aperçu du reçu"
                  className="w-full h-40 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
                {photoUrl && !uploading && (
                  <div className="absolute bottom-2 left-2 bg-success/90 text-success-foreground px-2 py-1 rounded text-xs flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Téléchargée
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                  "flex flex-col items-center gap-2"
                )}
              >
                <Camera className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Cliquez pour prendre ou importer une photo
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG (max 5MB)
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {!photoUrl && (
              <div className="flex items-center gap-2 text-xs text-warning">
                <AlertCircle className="h-4 w-4" />
                Photo obligatoire pour valider la dépense
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={dateDepense}
              onChange={(e) => setDateDepense(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              required
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={categorie} onValueChange={setCategorie} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label>Montant (DH)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Textarea
              placeholder="Détails de la dépense..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || uploading || !photoUrl}
              className={cn(
                "transition-all",
                (!photoUrl && !submitting && !uploading) && "opacity-50 cursor-not-allowed"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
