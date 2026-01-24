import { useState } from 'react';
import { useFleetMaintenance, ServiceRecord } from '@/hooks/useFleetMaintenance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  CheckCircle2,
  Droplets,
  CircleDot,
  FileCheck,
  Wrench,
  Settings,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface ServiceEntryFormProps {
  vehicleId: string;
  currentKm: number;
  onSuccess?: () => void;
}

const SERVICE_TYPES = [
  { value: 'vidange', label: 'Vidange (Huile)', icon: Droplets, color: 'text-blue-500' },
  { value: 'visite_technique', label: 'Visite Technique', icon: FileCheck, color: 'text-primary' },
  { value: 'pneumatiques', label: 'Pneumatiques', icon: CircleDot, color: 'text-gray-600' },
  { value: 'reparation', label: 'Réparation', icon: Wrench, color: 'text-orange-500' },
  { value: 'autre', label: 'Autre', icon: Settings, color: 'text-muted-foreground' },
] as const;

export function ServiceEntryForm({ vehicleId, currentKm, onSuccess }: ServiceEntryFormProps) {
  const { addServiceRecord, uploadServicePhoto } = useFleetMaintenance();
  const [loading, setLoading] = useState(false);
  const [uploadingFacture, setUploadingFacture] = useState(false);
  const [uploadingPieces, setUploadingPieces] = useState(false);

  const [formData, setFormData] = useState({
    service_type: '' as ServiceRecord['service_type'] | '',
    km_at_service: currentKm,
    description: '',
    cout_pieces: 0,
    cout_main_oeuvre: 0,
    prestataire: '',
    photo_facture_url: '',
    photo_pieces_url: '',
  });

  const handlePhotoUpload = async (file: File, type: 'facture' | 'pieces') => {
    if (type === 'facture') setUploadingFacture(true);
    else setUploadingPieces(true);

    const url = await uploadServicePhoto(file, type);
    
    if (url) {
      setFormData(prev => ({
        ...prev,
        [type === 'facture' ? 'photo_facture_url' : 'photo_pieces_url']: url,
      }));
      toast.success('Photo uploadée');
    }

    if (type === 'facture') setUploadingFacture(false);
    else setUploadingPieces(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.service_type) {
      toast.error('Veuillez sélectionner un type de service');
      return;
    }

    if (!formData.photo_facture_url) {
      toast.error('La photo de la facture est obligatoire');
      return;
    }

    setLoading(true);

    const success = await addServiceRecord(
      vehicleId,
      formData.service_type as ServiceRecord['service_type'],
      formData.km_at_service,
      {
        description: formData.description,
        cout_pieces: formData.cout_pieces,
        cout_main_oeuvre: formData.cout_main_oeuvre,
        prestataire: formData.prestataire,
        photo_facture_url: formData.photo_facture_url,
        photo_pieces_url: formData.photo_pieces_url,
      }
    );

    setLoading(false);

    if (success) {
      onSuccess?.();
    }
  };

  const totalCost = formData.cout_pieces + formData.cout_main_oeuvre;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Type */}
      <div className="space-y-2">
        <Label>Type de Service *</Label>
        <Select 
          value={formData.service_type} 
          onValueChange={(v) => setFormData(prev => ({ ...prev, service_type: v as ServiceRecord['service_type'] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner le type de service" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className={`h-4 w-4 ${type.color}`} />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Odometer at Service */}
      <div className="space-y-2">
        <Label>Kilométrage au Service *</Label>
        <Input
          type="number"
          value={formData.km_at_service}
          onChange={(e) => setFormData(prev => ({ ...prev, km_at_service: Number(e.target.value) }))}
          min={0}
        />
        <p className="text-xs text-muted-foreground">
          Compteur actuel: {currentKm.toLocaleString('fr-FR')} km
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description du Travail</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Décrivez les travaux effectués..."
          rows={3}
        />
      </div>

      {/* Costs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Coût Pièces (DH)</Label>
          <Input
            type="number"
            value={formData.cout_pieces}
            onChange={(e) => setFormData(prev => ({ ...prev, cout_pieces: Number(e.target.value) }))}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label>Main d'Oeuvre (DH)</Label>
          <Input
            type="number"
            value={formData.cout_main_oeuvre}
            onChange={(e) => setFormData(prev => ({ ...prev, cout_main_oeuvre: Number(e.target.value) }))}
            min={0}
          />
        </div>
      </div>

      {totalCost > 0 && (
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Coût Total</span>
            <span className="text-lg font-bold">{totalCost.toLocaleString('fr-FR')} DH</span>
          </div>
        </div>
      )}

      {/* Prestataire */}
      <div className="space-y-2">
        <Label>Prestataire / Garage</Label>
        <Input
          value={formData.prestataire}
          onChange={(e) => setFormData(prev => ({ ...prev, prestataire: e.target.value }))}
          placeholder="Nom du garage ou mécanicien"
        />
      </div>

      {/* Photo Upload - Facture */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Photo Facture * 
          <span className="text-xs text-muted-foreground">(Obligatoire)</span>
        </Label>
        <div className="flex items-center gap-3">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'facture')}
            className="flex-1"
          />
          {uploadingFacture && <RefreshCw className="h-4 w-4 animate-spin" />}
          {formData.photo_facture_url && (
            <Badge className="bg-success/20 text-success">
              <ImageIcon className="h-3 w-3 mr-1" /> OK
            </Badge>
          )}
        </div>
      </div>

      {/* Photo Upload - Pieces */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Photo Pièces Neuves
          <span className="text-xs text-muted-foreground">(Optionnel)</span>
        </Label>
        <div className="flex items-center gap-3">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'pieces')}
            className="flex-1"
          />
          {uploadingPieces && <RefreshCw className="h-4 w-4 animate-spin" />}
          {formData.photo_pieces_url && (
            <Badge className="bg-success/20 text-success">
              <ImageIcon className="h-3 w-3 mr-1" /> OK
            </Badge>
          )}
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4 mr-2" />
        )}
        Enregistrer & Réinitialiser Compteur
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        L'enregistrement de ce service réinitialisera automatiquement le compteur de maintenance correspondant.
      </p>
    </form>
  );
}
