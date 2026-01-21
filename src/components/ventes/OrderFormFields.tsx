import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarIcon,
  Clock,
  MapPin,
  User,
  Phone,
  Truck,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MODES_PAIEMENT } from '@/hooks/useZonesLivraison';

interface Zone {
  id: string;
  code_zone: string;
  nom_zone: string;
  prix_livraison_m3: number;
}

interface Prestataire {
  id: string;
  nom_prestataire: string;
  tarif_base_m3: number;
}

interface OrderFormFieldsProps {
  // Delivery Date/Time
  deliveryDate: Date | undefined;
  setDeliveryDate: (date: Date | undefined) => void;
  deliveryTime: string;
  setDeliveryTime: (time: string) => void;
  
  // Address & Contact
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  contactChantier: string;
  setContactChantier: (contact: string) => void;
  telephoneChantier: string;
  setTelephoneChantier: (phone: string) => void;
  
  // Reference & Conditions
  referenceClient: string;
  setReferenceClient: (ref: string) => void;
  conditionsAcces: string;
  setConditionsAcces: (conditions: string) => void;
  
  // Pump Options
  pompeRequise: boolean;
  setPompeRequise: (required: boolean) => void;
  typePompe: string;
  setTypePompe: (type: string) => void;
  
  // Notes
  notes: string;
  setNotes: (notes: string) => void;
  
  // Zone & Payment
  selectedZoneId: string;
  setSelectedZoneId: (zoneId: string) => void;
  modePaiement: string;
  setModePaiement: (mode: string) => void;
  selectedPrestataireId: string;
  setSelectedPrestataireId: (id: string) => void;
  
  // Data
  zones: Zone[];
  prestataires: Prestataire[];
  
  // Display options
  showZoneSection?: boolean;
  addressAsTextarea?: boolean;
}

// DEMO: 24/24h operations - all hours available
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const PUMP_TYPES = [
  { value: 'pompe_automotrice', label: 'Pompe automotrice' },
  { value: 'pompe_stationnaire', label: 'Pompe stationnaire' },
  { value: 'pompe_bras', label: 'Pompe à bras (36m)' },
  { value: 'pompe_bras_xl', label: 'Pompe à bras (42m+)' },
];

export function OrderFormFields({
  deliveryDate,
  setDeliveryDate,
  deliveryTime,
  setDeliveryTime,
  deliveryAddress,
  setDeliveryAddress,
  contactChantier,
  setContactChantier,
  telephoneChantier,
  setTelephoneChantier,
  referenceClient,
  setReferenceClient,
  conditionsAcces,
  setConditionsAcces,
  pompeRequise,
  setPompeRequise,
  typePompe,
  setTypePompe,
  notes,
  setNotes,
  selectedZoneId,
  setSelectedZoneId,
  modePaiement,
  setModePaiement,
  selectedPrestataireId,
  setSelectedPrestataireId,
  zones,
  prestataires,
  showZoneSection = true,
  addressAsTextarea = false,
}: OrderFormFieldsProps) {
  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const prixLivraison = selectedZone?.prix_livraison_m3 || 0;

  return (
    <div className="space-y-6">
      {/* Delivery Section */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <Truck className="h-4 w-4" />
          Informations de Livraison
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Date de livraison *
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
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? format(deliveryDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  disabled={(date) => {
                    // DEMO: Allow Jan 21, 2026 for testing purposes
                    const demoDate = new Date(2026, 0, 21); // Jan 21, 2026
                    const isDemo = date.toDateString() === demoDate.toDateString();
                    if (isDemo) return false;
                    return date < new Date();
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Heure souhaitée
            </Label>
            <Select value={deliveryTime} onValueChange={setDeliveryTime}>
              <SelectTrigger>
                <SelectValue placeholder="Heure" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(time => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className={cn("space-y-2", !addressAsTextarea && "md:col-span-2")}>
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Adresse {addressAsTextarea ? 'du chantier *' : 'de livraison'}
            </Label>
            {addressAsTextarea ? (
              <Textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Adresse complète du chantier..."
                rows={2}
              />
            ) : (
              <Input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Adresse complète du chantier"
              />
            )}
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Contact chantier
            </Label>
            <Input
              value={contactChantier}
              onChange={(e) => setContactChantier(e.target.value)}
              placeholder="Nom du responsable"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Téléphone
            </Label>
            <Input
              value={telephoneChantier}
              onChange={(e) => setTelephoneChantier(e.target.value)}
              placeholder="06 XX XX XX XX"
            />
          </div>
        </div>
      </div>

      {/* Zone & Payment Section */}
      {showZoneSection && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Zone & Paiement
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Zone de Livraison *
              </Label>
              <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      Zone {zone.code_zone} - {zone.nom_zone} ({zone.prix_livraison_m3} DH/m³)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Mode de Paiement
              </Label>
              <Select value={modePaiement} onValueChange={setModePaiement}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES_PAIEMENT.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Prestataire Transport
              </Label>
              <Select value={selectedPrestataireId} onValueChange={setSelectedPrestataireId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un prestataire" />
                </SelectTrigger>
                <SelectContent>
                  {prestataires.map((prest) => (
                    <SelectItem key={prest.id} value={prest.id}>
                      {prest.nom_prestataire} ({prest.tarif_base_m3} DH/m³)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedZone && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-xs text-muted-foreground">Coût Livraison</div>
                <div className="text-lg font-bold font-mono text-primary">
                  +{prixLivraison} DH/m³
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Options */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Référence client</Label>
            <Input
              value={referenceClient}
              onChange={(e) => setReferenceClient(e.target.value)}
              placeholder="N° commande client"
            />
          </div>
          <div className="space-y-2">
            <Label>Conditions d'accès</Label>
            <Input
              value={conditionsAcces}
              onChange={(e) => setConditionsAcces(e.target.value)}
              placeholder="Étroit, pente, etc."
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <Label>Pompe requise</Label>
            <p className="text-xs text-muted-foreground">Service de pompage béton</p>
          </div>
          <Switch
            checked={pompeRequise}
            onCheckedChange={setPompeRequise}
          />
        </div>

        {pompeRequise && (
          <Select value={typePompe} onValueChange={setTypePompe}>
            <SelectTrigger>
              <SelectValue placeholder="Type de pompe" />
            </SelectTrigger>
            <SelectContent>
              {PUMP_TYPES.map((pump) => (
                <SelectItem key={pump.value} value={pump.value}>
                  {pump.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="space-y-2">
          <Label>Notes / Instructions</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions particulières..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
