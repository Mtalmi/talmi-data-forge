import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/ui/time-picker';
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
import { cn } from '@/lib/utils';
import { MODES_PAIEMENT } from '@/hooks/useZonesLivraison';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

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
  deliveryDate: Date | undefined;
  setDeliveryDate: (date: Date | undefined) => void;
  deliveryTime: string;
  setDeliveryTime: (time: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  contactChantier: string;
  setContactChantier: (contact: string) => void;
  telephoneChantier: string;
  setTelephoneChantier: (phone: string) => void;
  referenceClient: string;
  setReferenceClient: (ref: string) => void;
  conditionsAcces: string;
  setConditionsAcces: (conditions: string) => void;
  pompeRequise: boolean;
  setPompeRequise: (required: boolean) => void;
  typePompe: string;
  setTypePompe: (type: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  selectedZoneId: string;
  setSelectedZoneId: (zoneId: string) => void;
  modePaiement: string;
  setModePaiement: (mode: string) => void;
  selectedPrestataireId: string;
  setSelectedPrestataireId: (id: string) => void;
  zones: Zone[];
  prestataires: Prestataire[];
  showZoneSection?: boolean;
  addressAsTextarea?: boolean;
}

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
  const { t, lang } = useI18n();
  const o = t.orderForm;
  const dateLocale = getDateLocale(lang);
  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const prixLivraison = selectedZone?.prix_livraison_m3 || 0;

  const PUMP_TYPES = [
    { value: 'pompe_automotrice', label: o.pumpAutomotrice },
    { value: 'pompe_stationnaire', label: o.pumpStationnaire },
    { value: 'pompe_bras', label: o.pumpBras36 },
    { value: 'pompe_bras_xl', label: o.pumpBrasXL },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <Truck className="h-4 w-4" />
          {o.deliveryInfo}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {o.deliveryDate} *
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
                  {deliveryDate ? format(deliveryDate, "PPP", { locale: dateLocale || undefined }) : o.selectDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {o.preferredTime}
            </Label>
            <TimePicker
              value={deliveryTime}
              onChange={setDeliveryTime}
              placeholder={o.selectTime}
            />
          </div>

          <div className={cn("space-y-2", !addressAsTextarea && "md:col-span-2")}>
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {addressAsTextarea ? `${o.siteAddress} *` : o.deliveryAddress}
            </Label>
            {addressAsTextarea ? (
              <Textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={`${o.fullSiteAddress}...`}
                rows={2}
              />
            ) : (
              <Input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={o.fullSiteAddress}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {o.siteContact}
            </Label>
            <Input
              value={contactChantier}
              onChange={(e) => setContactChantier(e.target.value)}
              placeholder={o.managerName}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {o.phone}
            </Label>
            <Input
              value={telephoneChantier}
              onChange={(e) => setTelephoneChantier(e.target.value)}
              placeholder="06 XX XX XX XX"
            />
          </div>
        </div>
      </div>

      {showZoneSection && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {o.zonePayment}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {o.deliveryZone} *
              </Label>
              <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                <SelectTrigger>
                  <SelectValue placeholder={o.selectZone} />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {o.deliveryZone.split(' ')[0]} {zone.code_zone} - {zone.nom_zone} ({zone.prix_livraison_m3} DH/m³)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                {o.paymentMode}
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
                {o.transportContractor}
              </Label>
              <Select value={selectedPrestataireId} onValueChange={setSelectedPrestataireId}>
                <SelectTrigger>
                  <SelectValue placeholder={o.selectContractor} />
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
                <div className="text-xs text-muted-foreground">{o.deliveryCost}</div>
                <div className="text-lg font-bold font-mono text-primary">
                  +{prixLivraison} DH/m³
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{o.clientReference}</Label>
            <Input
              value={referenceClient}
              onChange={(e) => setReferenceClient(e.target.value)}
              placeholder={o.clientOrderNum}
            />
          </div>
          <div className="space-y-2">
            <Label>{o.accessConditions}</Label>
            <Input
              value={conditionsAcces}
              onChange={(e) => setConditionsAcces(e.target.value)}
              placeholder={o.narrowSlopePlaceholder}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <Label>{o.pumpRequired}</Label>
            <p className="text-xs text-muted-foreground">{o.pumpService}</p>
          </div>
          <Switch
            checked={pompeRequise}
            onCheckedChange={setPompeRequise}
          />
        </div>

        {pompeRequise && (
          <Select value={typePompe} onValueChange={setTypePompe}>
            <SelectTrigger>
              <SelectValue placeholder={o.pumpType} />
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
          <Label>{o.notesInstructions}</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={o.specialInstructions}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
