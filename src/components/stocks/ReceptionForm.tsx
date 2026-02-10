import { useState, useRef } from 'react';
import { useAIDataGuard } from '@/hooks/useAIDataGuard';
import { AIDataGuardBadge } from '@/components/ai/AIDataGuardBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PackagePlus, Loader2, Camera, Upload, X, CheckCircle, Moon, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { compressImage } from '@/lib/imageCompression';
import { cn } from '@/lib/utils';
import { isCurrentlyOffHours, getCasablancaHour } from '@/lib/timezone';

// Minimum justification length for off-hours transactions (Titanium Shield)
const MIN_JUSTIFICATION_LENGTH = 20;

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
    notes?: string,
    photoUrl?: string
  ) => Promise<boolean>;
  onRefresh?: () => void;
}

export function ReceptionForm({ stocks, onSubmit, onRefresh }: ReceptionFormProps) {
  const { isCeo, isSuperviseur, isAgentAdministratif } = useAuth();
  const { validate: aiValidate, isValidating: aiValidating, lastResult: aiResult } = useAIDataGuard();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [materiau, setMateriau] = useState('');
  const [quantite, setQuantite] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [numeroBl, setNumeroBl] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Off-hours justification (Midnight Alert Protocol)
  const [justificationUrgence, setJustificationUrgence] = useState('');
  const [isOffHoursMode] = useState(() => isCurrentlyOffHours());
  const [currentCasablancaHour] = useState(() => getCasablancaHour());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agent Admin MUST upload photo, CEO/Superviseur can skip
  const requiresPhoto = isAgentAdministratif && !isCeo && !isSuperviseur;

  const resetForm = () => {
    setMateriau('');
    setQuantite('');
    setFournisseur('');
    setNumeroBl('');
    setNotes('');
    setPhotoUrl(null);
    setPhotoPreview(null);
    setJustificationUrgence('');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      
      // Compress image for faster upload on mobile
      const compressedFile = await compressImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
      
      // Upload to Supabase storage
      const fileName = `reception_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(`receptions/${fileName}`, compressedFile);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(`receptions/${fileName}`);
      
      setPhotoUrl(urlData.publicUrl);
      toast.success('Photo du BL téléchargée');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erreur lors du téléchargement de la photo');
    } finally {
      setUploadingPhoto(false);
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
    
    // Validation: Agent Admin must have photo
    if (requiresPhoto && !photoUrl) {
      toast.error('Photo du BL fournisseur obligatoire');
      return;
    }

    // Off-hours justification check (Midnight Alert Protocol)
    if (isOffHoursMode) {
      if (!justificationUrgence.trim()) {
        toast.error('Justification d\'urgence obligatoire pour les transactions nocturnes');
        return;
      }
      if (justificationUrgence.trim().length < MIN_JUSTIFICATION_LENGTH) {
        toast.error(`Justification trop courte (minimum ${MIN_JUSTIFICATION_LENGTH} caractères)`);
        return;
      }
    }
    
    // AI Guard validation
    const aiCheck = await aiValidate({
      context: 'stock_reception',
      fields: { materiau, quantite: parseFloat(quantite), fournisseur, numero_bl: numeroBl },
    });
    if (!aiCheck.valid && aiCheck.errors.length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      // Build notes with urgency justification if in off-hours mode
      const finalNotes = isOffHoursMode && justificationUrgence.trim()
        ? `[URGENCE: ${justificationUrgence.trim()}]${notes ? ' | ' + notes : ''}`
        : notes || null;

      // Use secure RPC function
      const { data, error } = await supabase.rpc('secure_add_reception', {
        p_materiau: materiau,
        p_quantite: parseFloat(quantite),
        p_fournisseur: fournisseur,
        p_numero_bl: numeroBl,
        p_photo_bl_url: photoUrl || null,
        p_notes: finalNotes
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        toast.error(result.error || 'Erreur lors de la réception');
        return;
      }

      toast.success(result.message || 'Réception enregistrée');
      resetForm();
      setOpen(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error adding reception:', error);
      toast.error('Erreur lors de l\'ajout de la réception');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStock = stocks.find(s => s.materiau === materiau);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 min-h-[44px]">
          <PackagePlus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle Réception</span>
          <span className="sm:hidden">Réception</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              <SelectTrigger className="min-h-[48px]">
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
                className="min-h-[48px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="form-label-industrial">N° BL Fournisseur</Label>
              <Input
                placeholder="BL-2024-001"
                value={numeroBl}
                onChange={(e) => setNumeroBl(e.target.value)}
                required
                className="min-h-[48px]"
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
              className="min-h-[48px]"
            />
          </div>

          {/* Photo Upload Section - Preuve Obligatoire */}
          <div className="space-y-2">
            <Label className="form-label-industrial flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <span className="font-semibold">Preuve Obligatoire</span>
              {requiresPhoto && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  REQUIS
                </Badge>
              )}
            </Label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            
            {photoPreview ? (
              <div className="relative rounded-lg border-2 border-success bg-success/10 p-2">
                <img 
                  src={photoPreview} 
                  alt="BL Preview" 
                  className="w-full h-32 object-cover rounded"
                />
                <div className="absolute top-1 right-1 flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={handleRemovePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-success text-sm font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  Preuve Validée
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full min-h-[64px] border-dashed transition-all",
                  requiresPhoto 
                    ? "border-destructive/50 hover:border-destructive hover:bg-destructive/5" 
                    : "border-border"
                )}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className={cn(
                      "h-6 w-6 mb-1",
                      requiresPhoto ? "text-destructive" : "text-muted-foreground"
                    )} />
                    <span className="text-sm">📸 Photographier le BL</span>
                    {requiresPhoto && (
                      <span className="text-xs text-destructive font-bold mt-1">
                        ⚠️ PREUVE OBLIGATOIRE
                      </span>
                    )}
                  </div>
                )}
              </Button>
            )}
          </div>

          {/* Off-Hours Justification - MANDATORY during 18h-00h */}
          {isOffHoursMode && (
            <Card className="border-destructive bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <Moon className="h-4 w-4" />
                  Justification d'Urgence
                  <Badge variant="destructive" className="text-[10px] animate-pulse">
                    🚨 OBLIGATOIRE
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Alert className="border-destructive/50 bg-destructive/10">
                  <Clock className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive text-xs">
                    <strong>MODE NUIT ACTIF ({currentCasablancaHour}h 🇲🇦)</strong> - 
                    Expliquez pourquoi vous enregistrez cette réception après 18h.
                  </AlertDescription>
                </Alert>
                <Textarea
                  placeholder="Raison de cette réception nocturne... (minimum 20 caractères)"
                  value={justificationUrgence}
                  onChange={(e) => setJustificationUrgence(e.target.value)}
                  rows={3}
                  className={cn(
                    "border-destructive/50",
                    justificationUrgence.trim().length >= MIN_JUSTIFICATION_LENGTH && "border-success"
                  )}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(
                    justificationUrgence.trim().length >= MIN_JUSTIFICATION_LENGTH 
                      ? "text-success" 
                      : "text-destructive"
                  )}>
                    {justificationUrgence.trim().length}/{MIN_JUSTIFICATION_LENGTH} caractères minimum
                  </span>
                  {justificationUrgence.trim().length >= MIN_JUSTIFICATION_LENGTH && (
                    <Badge className="bg-success text-[10px] gap-1">
                      <CheckCircle className="h-2.5 w-2.5" />
                      Validé
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* AI Guard Status */}
          <AIDataGuardBadge isValidating={aiValidating} result={aiResult} className="mb-2" />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="min-h-[44px]">
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={
                submitting || 
                uploadingPhoto || 
                (requiresPhoto && !photoUrl) ||
                (isOffHoursMode && justificationUrgence.trim().length < MIN_JUSTIFICATION_LENGTH)
              }
              className={cn(
                "min-h-[44px]",
                isOffHoursMode && justificationUrgence.trim().length < MIN_JUSTIFICATION_LENGTH && "opacity-50"
              )}
            >
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
