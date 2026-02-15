import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  CheckCircle,
  Lock,
  Loader2,
  Building2,
  Package,
  Factory,
} from 'lucide-react';
import { OrderFormFields } from './OrderFormFields';
import { QuickClientCreate } from './QuickClientCreate';
import { useI18n } from '@/i18n/I18nContext';

interface Client {
  client_id: string;
  nom_client: string;
  adresse: string | null;
  telephone: string | null;
}

interface Formule {
  formule_id: string;
  designation: string;
  cut_dh_m3: number | null;
}

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

interface DirectOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatingOrder: boolean;
  onCreateOrder: () => void;
  onCancel: () => void;
  onClientCreated?: (clientId: string, clientName: string) => void;
  
  // Client & Product
  orderClientId: string;
  onClientSelect: (clientId: string) => void;
  orderFormuleId: string;
  setOrderFormuleId: (formuleId: string) => void;
  orderVolume: string;
  setOrderVolume: (volume: string) => void;
  orderPrix: string;
  setOrderPrix: (prix: string) => void;
  
  // Form state
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
  
  // Auto-launch
  autoLaunchProduction: boolean;
  setAutoLaunchProduction: (auto: boolean) => void;
  
  // Data
  clients: Client[];
  formules: Formule[];
  zones: Zone[];
  prestataires: Prestataire[];
}

export function DirectOrderDialog({
  open,
  onOpenChange,
  creatingOrder,
  onCreateOrder,
  onCancel,
  onClientCreated,
  orderClientId,
  onClientSelect,
  orderFormuleId,
  setOrderFormuleId,
  orderVolume,
  setOrderVolume,
  orderPrix,
  setOrderPrix,
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
  autoLaunchProduction,
  setAutoLaunchProduction,
  clients,
  formules,
  zones,
  prestataires,
}: DirectOrderDialogProps) {
  const { t } = useI18n();
  const d = t.directOrder;
  const c = t.common;
  const isFormValid = orderClientId && orderFormuleId && orderVolume && orderPrix && deliveryDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-6 w-6 text-primary" />
            {d.newDirectOrder}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Client & Product Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {c.client} *
              </Label>
              <div className="flex gap-2">
                <Select value={orderClientId} onValueChange={onClientSelect}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={d.selectClient} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.client_id} value={client.client_id}>
                        {client.nom_client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <QuickClientCreate
                  onClientCreated={(clientId, clientName) => {
                    onClientCreated?.(clientId, clientName);
                    onClientSelect(clientId);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                {d.concreteFormula} *
              </Label>
              <Select value={orderFormuleId} onValueChange={setOrderFormuleId}>
                <SelectTrigger>
                  <SelectValue placeholder={d.selectFormula} />
                </SelectTrigger>
                <SelectContent>
                  {formules.map((formule) => (
                    <SelectItem key={formule.formule_id} value={formule.formule_id}>
                      {formule.formule_id} - {formule.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Volume & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{d.volumeM3} *</Label>
              <Input
                type="number"
                step="0.5"
                min="1"
                max="100"
                value={orderVolume}
                onChange={(e) => setOrderVolume(e.target.value)}
                placeholder="Ex: 8"
              />
            </div>
            <div className="space-y-2">
              <Label>{d.sellingPrice} *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={orderPrix}
                onChange={(e) => setOrderPrix(e.target.value)}
                placeholder="Ex: 850"
              />
            </div>
          </div>

          {/* Calculated Total */}
          {orderVolume && orderPrix && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.totalHT}</span>
                <span className="text-2xl font-bold text-primary font-mono">
                  {(parseFloat(orderVolume) * parseFloat(orderPrix)).toLocaleString()} DH
                </span>
              </div>
            </div>
          )}

          {/* Order Form Fields */}
          <OrderFormFields
            deliveryDate={deliveryDate}
            setDeliveryDate={setDeliveryDate}
            deliveryTime={deliveryTime}
            setDeliveryTime={setDeliveryTime}
            deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress}
            contactChantier={contactChantier}
            setContactChantier={setContactChantier}
            telephoneChantier={telephoneChantier}
            setTelephoneChantier={setTelephoneChantier}
            referenceClient={referenceClient}
            setReferenceClient={setReferenceClient}
            conditionsAcces={conditionsAcces}
            setConditionsAcces={setConditionsAcces}
            pompeRequise={pompeRequise}
            setPompeRequise={setPompeRequise}
            typePompe={typePompe}
            setTypePompe={setTypePompe}
            notes={notes}
            setNotes={setNotes}
            selectedZoneId={selectedZoneId}
            setSelectedZoneId={setSelectedZoneId}
            modePaiement={modePaiement}
            setModePaiement={setModePaiement}
            selectedPrestataireId={selectedPrestataireId}
            setSelectedPrestataireId={setSelectedPrestataireId}
            zones={zones}
            prestataires={prestataires}
          />

          {/* Auto-Launch Production Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-primary/5">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-primary" />
                <Label className="font-medium text-primary">{d.autoLaunchProduction}</Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {d.autoLaunchDesc}
              </p>
            </div>
            <Switch
              checked={autoLaunchProduction}
              onCheckedChange={setAutoLaunchProduction}
            />
          </div>

          {/* Price Lock Warning */}
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-sm text-warning flex items-center gap-2 font-medium">
              <Lock className="h-4 w-4" />
              {d.priceLocked}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {d.priceLockedDesc}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            {c.cancel}
          </Button>
          <Button 
            onClick={onCreateOrder} 
            disabled={creatingOrder || !isFormValid} 
            className="gap-2"
            size="lg"
          >
            {creatingOrder ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : autoLaunchProduction ? (
              <Factory className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {autoLaunchProduction ? d.createAndLaunch : d.createOrder}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
