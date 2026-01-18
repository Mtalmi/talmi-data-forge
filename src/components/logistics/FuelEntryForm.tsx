import { useState } from 'react';
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
import { Fuel, Loader2 } from 'lucide-react';

interface Vehicule {
  id_camion: string;
  type: string;
  km_compteur: number | null;
}

interface FuelEntryFormProps {
  vehicules: Vehicule[];
  onSubmit: (
    idCamion: string,
    litres: number,
    kmCompteur: number,
    coutTotal?: number,
    station?: string
  ) => Promise<boolean>;
}

export function FuelEntryForm({ vehicules, onSubmit }: FuelEntryFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [idCamion, setIdCamion] = useState('');
  const [litres, setLitres] = useState('');
  const [kmCompteur, setKmCompteur] = useState('');
  const [coutTotal, setCoutTotal] = useState('');
  const [station, setStation] = useState('');

  const resetForm = () => {
    setIdCamion('');
    setLitres('');
    setKmCompteur('');
    setCoutTotal('');
    setStation('');
  };

  const selectedVehicule = vehicules.find(v => v.id_camion === idCamion);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const success = await onSubmit(
      idCamion,
      parseFloat(litres),
      parseFloat(kmCompteur),
      coutTotal ? parseFloat(coutTotal) : undefined,
      station || undefined
    );

    if (success) {
      resetForm();
      setOpen(false);
    }
    
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Fuel className="h-4 w-4" />
          Relevé Carburant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            Suivi Carburant
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="form-label-industrial">Véhicule</Label>
            <Select value={idCamion} onValueChange={(val) => {
              setIdCamion(val);
              const v = vehicules.find(x => x.id_camion === val);
              if (v?.km_compteur) {
                setKmCompteur('');
              }
            }} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le véhicule..." />
              </SelectTrigger>
              <SelectContent>
                {vehicules.map((v) => (
                  <SelectItem key={v.id_camion} value={v.id_camion}>
                    {v.id_camion} ({v.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedVehicule && (
            <div className="text-xs text-muted-foreground">
              Dernier relevé: {selectedVehicule.km_compteur?.toLocaleString() || 0} km
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="form-label-industrial">Litres</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={litres}
                onChange={(e) => setLitres(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="form-label-industrial">Compteur KM</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={kmCompteur}
                onChange={(e) => setKmCompteur(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="form-label-industrial">Coût Total (DH)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={coutTotal}
                onChange={(e) => setCoutTotal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="form-label-industrial">Station</Label>
              <Input
                placeholder="Nom station"
                value={station}
                onChange={(e) => setStation(e.target.value)}
              />
            </div>
          </div>

          {selectedVehicule && kmCompteur && litres && selectedVehicule.km_compteur && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Distance parcourue:</span>
                <span className="font-mono font-semibold">
                  {(parseFloat(kmCompteur) - (selectedVehicule.km_compteur || 0)).toLocaleString()} km
                </span>
              </div>
              {(parseFloat(kmCompteur) - (selectedVehicule.km_compteur || 0)) > 0 && (
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Consommation estimée:</span>
                  <span className="font-mono font-semibold text-primary">
                    {((parseFloat(litres) / (parseFloat(kmCompteur) - (selectedVehicule.km_compteur || 0))) * 100).toFixed(1)} L/100km
                  </span>
                </div>
              )}
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
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
