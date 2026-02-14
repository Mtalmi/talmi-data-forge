import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Truck,
  Package,
  Calendar as CalendarIcon,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MidnightJustificationDialog, useNightModeCheck } from '@/components/security/MidnightJustificationDialog';

interface Camion {
  id: string;
  id_camion: string;
  chauffeur: string | null;
  capacite_m3: number;
  statut: string;
}

interface AddDeliveryDialogProps {
  bc: BonCommande | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDelivery: (bc: BonCommande, volume: number) => Promise<string | null>;
  onRefresh: () => void;
}

export function AddDeliveryDialog({
  bc,
  open,
  onOpenChange,
  onCreateDelivery,
  onRefresh,
}: AddDeliveryDialogProps) {
  const [deliveryVolume, setDeliveryVolume] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(new Date());
  const [deliveryTime, setDeliveryTime] = useState('08:00');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [camions, setCamions] = useState<Camion[]>([]);
  const [creating, setCreating] = useState(false);
  const [loadingTrucks, setLoadingTrucks] = useState(false);
  const isNightMode = useNightModeCheck();
  const [midnightOpen, setMidnightOpen] = useState(false);

  // Fetch available trucks
  useEffect(() => {
    if (open) {
      fetchAvailableTrucks();
      // Set default volume to min of remaining or 8m³
      if (bc) {
        const remaining = bc.volume_m3 - (bc.volume_livre || 0);
        setDeliveryVolume(Math.min(remaining, 8).toString());
      }
    }
  }, [open, bc]);

  const fetchAvailableTrucks = async () => {
    setLoadingTrucks(true);
    try {
      const { data, error } = await supabase
        .from('flotte')
        .select('id, id_camion, chauffeur, capacite_m3, statut')
        .eq('statut', 'Disponible')
        .order('id_camion');

      if (error) throw error;
      setCamions(data || []);
    } catch (error) {
      console.error('Error fetching trucks:', error);
    } finally {
      setLoadingTrucks(false);
    }
  };

  if (!bc) return null;

  // Calculate stats
  const volumeTotal = bc.volume_m3;
  const volumeLivre = bc.volume_livre || 0;
  const volumeRestant = volumeTotal - volumeLivre;
  const progressPercent = (volumeLivre / volumeTotal) * 100;
  const nbLivraisons = bc.nb_livraisons || 0;

  // Validate volume
  const volume = parseFloat(deliveryVolume) || 0;
  const isVolumeValid = volume > 0 && volume <= volumeRestant;
  const selectedTruckData = camions.find(c => c.id_camion === selectedTruck);
  const isTruckOverloaded = selectedTruckData && volume > selectedTruckData.capacite_m3;
  const isLastDelivery = volume >= volumeRestant;

  const executeCreate = async () => {
    if (!isVolumeValid || !deliveryDate) return;

    setCreating(true);
    try {
      const blId = await onCreateDelivery(bc, volume);
      if (blId) {
        onRefresh();
        onOpenChange(false);
        setDeliveryVolume('');
        setSelectedTruck('');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreate = async () => {
    if (!isVolumeValid || !deliveryDate) return;
    
    if (isNightMode) {
      setMidnightOpen(true);
      return;
    }
    
    await executeCreate();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Nouvelle Livraison
          </DialogTitle>
          <DialogDescription>
            Commande {bc.bc_id} • {bc.client?.nom_client || bc.client_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Progress Summary */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progression commande</span>
                <span className="font-mono font-semibold">{progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-lg font-bold text-primary">{volumeLivre.toFixed(1)}</p>
                  <p className="text-muted-foreground">m³ livrés</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-warning">{volumeRestant.toFixed(1)}</p>
                  <p className="text-muted-foreground">m³ restants</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{nbLivraisons}</p>
                  <p className="text-muted-foreground">livraison(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Volume */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Volume à livrer (m³)
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={deliveryVolume}
                onChange={(e) => setDeliveryVolume(e.target.value)}
                placeholder={`Max ${volumeRestant.toFixed(1)} m³`}
                className={cn(
                  "text-lg font-mono",
                  !isVolumeValid && deliveryVolume && "border-destructive"
                )}
                min={0.5}
                max={volumeRestant}
                step={0.5}
              />
              {isLastDelivery && isVolumeValid && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
              )}
            </div>
            {!isVolumeValid && deliveryVolume && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Volume invalide. Maximum: {volumeRestant.toFixed(1)} m³
              </p>
            )}
            {isLastDelivery && isVolumeValid && (
              <p className="text-xs text-success flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Cette livraison complètera la commande!
              </p>
            )}
            
            {/* Quick volume buttons */}
            <div className="flex gap-2 pt-1">
              {[6, 8, 10, 12].map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant={parseFloat(deliveryVolume) === v ? "default" : "outline"}
                  size="sm"
                  className="flex-1 font-mono"
                  onClick={() => setDeliveryVolume(Math.min(v, volumeRestant).toString())}
                  disabled={v > volumeRestant}
                >
                  {v}m³
                </Button>
              ))}
              <Button
                type="button"
                variant={parseFloat(deliveryVolume) === volumeRestant ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setDeliveryVolume(volumeRestant.toString())}
              >
                Tout
              </Button>
            </div>
          </div>

          {/* Delivery Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deliveryDate && "text-muted-foreground"
                    )}
                  >
                    {deliveryDate ? (
                      format(deliveryDate, 'dd MMM yyyy', { locale: fr })
                    ) : (
                      <span>Sélectionner</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deliveryDate}
                    onSelect={setDeliveryDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Heure
              </Label>
              <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* DEMO: 24/24h operations - all hours available */}
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                      {hour.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Truck Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Toupie (optionnel)
            </Label>
            <Select value={selectedTruck} onValueChange={(val) => setSelectedTruck(val === 'none' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder={loadingTrucks ? "Chargement..." : "Assigner une toupie"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Non assigné</SelectItem>
                {camions.map((camion) => (
                  <SelectItem key={camion.id} value={camion.id_camion}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="font-mono">{camion.id_camion}</span>
                      <span className="text-muted-foreground text-xs">
                        {camion.capacite_m3}m³ • {camion.chauffeur || 'Sans chauffeur'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isTruckOverloaded && (
              <p className="text-xs text-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Attention: Volume dépasse la capacité du camion ({selectedTruckData?.capacite_m3}m³)
              </p>
            )}
          </div>

          {/* Summary */}
          {isVolumeValid && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Livraison #</p>
                    <p className="font-semibold">{nbLivraisons + 1}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Volume</p>
                    <p className="font-mono font-semibold">{volume.toFixed(1)} m³</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Montant HT</p>
                    <p className="font-mono font-semibold text-primary">
                      {(volume * bc.prix_vente_m3).toLocaleString()} DH
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Après livraison</p>
                    <p className="font-mono">
                      {(volumeLivre + volume).toFixed(1)} / {volumeTotal} m³
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isVolumeValid || !deliveryDate || creating}
            className="gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4" />
                Créer BL ({volume.toFixed(1)} m³)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <MidnightJustificationDialog
        open={midnightOpen}
        onOpenChange={setMidnightOpen}
        actionLabel={`Créer BL (${volume.toFixed(1)} m³) — Urgence`}
        loading={creating}
        onConfirm={async () => {
          setMidnightOpen(false);
          await executeCreate();
        }}
      />
    </>
  );
}
