import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  CheckCircle,
  Lock,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { OrderFormFields } from './OrderFormFields';
import { useI18n } from '@/i18n/I18nContext';

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

interface ConvertToBcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDevis: Devis | null;
  converting: boolean;
  onConvert: () => void;
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
}

export function ConvertToBcDialog({
  open,
  onOpenChange,
  selectedDevis,
  converting,
  onConvert,
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
}: ConvertToBcDialogProps) {
  const { t } = useI18n();
  const cb = t.convertBc;
  const c = t.common;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileCheck className="h-6 w-6 text-primary" />
            {cb.createOfficialBc}
          </DialogTitle>
        </DialogHeader>
        
        {selectedDevis && (
          <div className="space-y-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {cb.quoteSourceSummary}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">{cb.quoteNumber}</p>
                    <p className="font-mono font-semibold">{selectedDevis.devis_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{c.client}</p>
                    <p className="font-semibold">{selectedDevis.client?.nom_client}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{c.formula}</p>
                    <p className="font-mono text-sm">{selectedDevis.formule_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{c.volume}</p>
                    <p className="font-semibold">{selectedDevis.volume_m3} m³</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{c.price}/m³</p>
                    <p className="font-mono">{selectedDevis.prix_vente_m3.toLocaleString()} DH</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{c.totalHT}</p>
                    <p className="font-mono font-bold text-primary text-lg">
                      {selectedDevis.total_ht.toLocaleString()} DH
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
              addressAsTextarea
            />

            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive flex items-center gap-2 font-medium">
                <Lock className="h-4 w-4" />
                {cb.priceLockWarning}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {cb.priceLockDesc.replace('{price}', selectedDevis.prix_vente_m3.toLocaleString())}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {c.cancel}
          </Button>
          <Button 
            onClick={onConvert} 
            disabled={converting || !deliveryDate} 
            className="gap-2"
            size="lg"
          >
            {converting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {cb.validateBc}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
