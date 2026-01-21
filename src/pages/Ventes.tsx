import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useSalesWorkflow, Devis, BonCommande } from '@/hooks/useSalesWorkflow';
import { useZonesLivraison } from '@/hooks/useZonesLivraison';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, ShoppingCart, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import SmartQuoteCalculator from '@/components/quotes/SmartQuoteCalculator';
import { BcDetailDialog } from '@/components/bons/BcDetailDialog';
import { cn } from '@/lib/utils';

// Refactored components
import { PipelineStats } from '@/components/ventes/PipelineStats';
import { DevisTable } from '@/components/ventes/DevisTable';
import { BcTable } from '@/components/ventes/BcTable';
import { ConvertToBcDialog } from '@/components/ventes/ConvertToBcDialog';
import { DirectOrderDialog } from '@/components/ventes/DirectOrderDialog';

export default function Ventes() {
  const navigate = useNavigate();
  const { devisList, bcList, loading, stats, fetchData, convertToBc, createBlFromBc, createDirectBc } = useSalesWorkflow();
  const { zones, prestataires } = useZonesLivraison();
  
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [launchingProduction, setLaunchingProduction] = useState<string | null>(null);
  
  // BC Detail Dialog State
  const [selectedBc, setSelectedBc] = useState<BonCommande | null>(null);
  const [bcDetailOpen, setBcDetailOpen] = useState(false);
  
  // Direct Order Dialog State
  const [directOrderOpen, setDirectOrderOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [clients, setClients] = useState<{client_id: string; nom_client: string; adresse: string | null; telephone: string | null}[]>([]);
  const [formules, setFormules] = useState<{formule_id: string; designation: string; cut_dh_m3: number | null}[]>([]);
  
  // Direct Order Form State
  const [orderClientId, setOrderClientId] = useState('');
  const [orderFormuleId, setOrderFormuleId] = useState('');
  const [orderVolume, setOrderVolume] = useState('');
  const [orderPrix, setOrderPrix] = useState('');
  
  // Shared form state
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [deliveryTime, setDeliveryTime] = useState('08:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactChantier, setContactChantier] = useState('');
  const [telephoneChantier, setTelephoneChantier] = useState('');
  const [referenceClient, setReferenceClient] = useState('');
  const [conditionsAcces, setConditionsAcces] = useState('');
  const [pompeRequise, setPompeRequise] = useState(false);
  const [typePompe, setTypePompe] = useState('');
  const [notes, setNotes] = useState('');
  
  // Zone and Payment Mode state
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [modePaiement, setModePaiement] = useState('virement');
  const [selectedPrestataireId, setSelectedPrestataireId] = useState('');
  
  // Auto-launch production toggle
  const [autoLaunchProduction, setAutoLaunchProduction] = useState(true);

  // Fetch clients and formules for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      const [clientsRes, formulesRes] = await Promise.all([
        supabase.from('clients').select('client_id, nom_client, adresse, telephone').order('nom_client'),
        supabase.from('formules_theoriques').select('formule_id, designation, cut_dh_m3').order('formule_id'),
      ]);
      if (clientsRes.data) setClients(clientsRes.data);
      if (formulesRes.data) setFormules(formulesRes.data);
    };
    fetchDropdownData();
  }, []);

  const resetFormState = () => {
    setDeliveryDate(undefined);
    setDeliveryTime('08:00');
    setDeliveryAddress('');
    setContactChantier('');
    setTelephoneChantier('');
    setReferenceClient('');
    setConditionsAcces('');
    setPompeRequise(false);
    setTypePompe('');
    setNotes('');
    setOrderClientId('');
    setOrderFormuleId('');
    setOrderVolume('');
    setOrderPrix('');
    setSelectedZoneId('');
    setModePaiement('virement');
    setSelectedPrestataireId('');
    setAutoLaunchProduction(true);
  };

  // Get selected zone pricing
  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const prixLivraison = selectedZone?.prix_livraison_m3 || 0;

  const handleConvertToBc = async () => {
    if (!selectedDevis) return;
    
    setConverting(true);
    await convertToBc(selectedDevis, {
      date_livraison_souhaitee: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : undefined,
      heure_livraison_souhaitee: deliveryTime || undefined,
      adresse_livraison: deliveryAddress || undefined,
      contact_chantier: contactChantier || undefined,
      telephone_chantier: telephoneChantier || undefined,
      reference_client: referenceClient || undefined,
      conditions_acces: conditionsAcces || undefined,
      pompe_requise: pompeRequise,
      type_pompe: typePompe || undefined,
      notes: notes || undefined,
      zone_livraison_id: selectedZoneId || undefined,
      mode_paiement: modePaiement,
      prix_livraison_m3: prixLivraison,
      prestataire_id: selectedPrestataireId || undefined,
    });
    setConverting(false);
    setConvertDialogOpen(false);
    setSelectedDevis(null);
    resetFormState();
  };

  const openConvertDialog = (devis: Devis) => {
    resetFormState();
    setSelectedDevis(devis);
    setDeliveryAddress(devis.client?.adresse || '');
    setConvertDialogOpen(true);
  };

  // Handle launching production from BC
  const handleLaunchProduction = async (bc: BonCommande) => {
    setLaunchingProduction(bc.bc_id);
    const blId = await createBlFromBc(bc);
    setLaunchingProduction(null);
    
    if (blId) {
      navigate('/planning');
    }
  };

  // Handle opening BC detail dialog
  const handleOpenBcDetail = (bc: BonCommande) => {
    setSelectedBc(bc);
    setBcDetailOpen(true);
  };

  // Handle adding delivery from BC detail dialog
  const handleAddDeliveryFromDialog = async (bc: BonCommande) => {
    setBcDetailOpen(false);
    await handleLaunchProduction(bc);
  };

  // Handle copying a BC to a new order
  const handleCopyBc = (bc: BonCommande) => {
    resetFormState();
    setOrderClientId(bc.client_id);
    setOrderFormuleId(bc.formule_id);
    setOrderVolume(bc.volume_m3.toString());
    setOrderPrix(bc.prix_vente_m3.toString());
    if (bc.date_livraison_souhaitee) {
      setDeliveryDate(new Date(bc.date_livraison_souhaitee));
    }
    if (bc.heure_livraison_souhaitee) {
      setDeliveryTime(bc.heure_livraison_souhaitee);
    }
    setDeliveryAddress(bc.adresse_livraison || bc.client?.adresse || '');
    setContactChantier(bc.contact_chantier || '');
    setTelephoneChantier(bc.telephone_chantier || '');
    setReferenceClient(bc.reference_client || '');
    setConditionsAcces(bc.conditions_acces || '');
    setPompeRequise(bc.pompe_requise || false);
    setTypePompe(bc.type_pompe || '');
    setNotes(bc.notes || '');
    setDirectOrderOpen(true);
  };

  // Handle direct order creation
  const handleCreateDirectOrder = async () => {
    if (!orderClientId || !orderFormuleId || !orderVolume || !orderPrix || !deliveryDate) {
      return;
    }

    setCreatingOrder(true);
    const bc = await createDirectBc({
      client_id: orderClientId,
      formule_id: orderFormuleId,
      volume_m3: parseFloat(orderVolume),
      prix_vente_m3: parseFloat(orderPrix),
      date_livraison_souhaitee: format(deliveryDate, 'yyyy-MM-dd'),
      heure_livraison_souhaitee: deliveryTime || undefined,
      adresse_livraison: deliveryAddress || undefined,
      contact_chantier: contactChantier || undefined,
      telephone_chantier: telephoneChantier || undefined,
      reference_client: referenceClient || undefined,
      conditions_acces: conditionsAcces || undefined,
      pompe_requise: pompeRequise,
      type_pompe: typePompe || undefined,
      notes: notes || undefined,
      zone_livraison_id: selectedZoneId || undefined,
      mode_paiement: modePaiement,
      prix_livraison_m3: prixLivraison,
      prestataire_id: selectedPrestataireId || undefined,
    });
    
    if (bc) {
      if (autoLaunchProduction) {
        const blId = await createBlFromBc(bc);
        setCreatingOrder(false);
        setDirectOrderOpen(false);
        resetFormState();
        if (blId) {
          const deliveryDateStr = format(deliveryDate, 'yyyy-MM-dd');
          navigate(`/planning?date=${deliveryDateStr}`);
        }
      } else {
        setCreatingOrder(false);
        setDirectOrderOpen(false);
        resetFormState();
      }
    } else {
      setCreatingOrder(false);
    }
  };

  // Auto-fill client address when client is selected
  const handleClientSelect = (clientId: string) => {
    setOrderClientId(clientId);
    const client = clients.find(c => c.client_id === clientId);
    if (client) {
      setDeliveryAddress(client.adresse || '');
      setTelephoneChantier(client.telephone || '');
    }
  };

  const handleCancelDirectOrder = () => {
    setDirectOrderOpen(false);
    resetFormState();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline Commercial</h1>
            <p className="text-muted-foreground">
              Gestion des devis et bons de commande
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={() => setDirectOrderOpen(true)}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Nouvelle Commande
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Actualiser
            </Button>
            <SmartQuoteCalculator />
          </div>
        </div>

        {/* Stats & Pipeline Visualization */}
        <PipelineStats stats={stats} />

        {/* Tabs for Devis and BC */}
        <Tabs defaultValue="devis" className="space-y-4">
          <TabsList>
            <TabsTrigger value="devis" className="gap-2">
              <FileText className="h-4 w-4" />
              Devis ({devisList.length})
            </TabsTrigger>
            <TabsTrigger value="bc" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Bons de Commande ({bcList.length})
            </TabsTrigger>
          </TabsList>

          {/* Devis Tab */}
          <TabsContent value="devis">
            <Card>
              <CardContent className="pt-6">
                <DevisTable
                  devisList={devisList}
                  loading={loading}
                  onConvert={openConvertDialog}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* BC Tab */}
          <TabsContent value="bc">
            <Card>
              <CardContent className="pt-6">
                <BcTable
                  bcList={bcList}
                  loading={loading}
                  launchingProduction={launchingProduction}
                  onLaunchProduction={handleLaunchProduction}
                  onCopyBc={handleCopyBc}
                  onOpenDetail={handleOpenBcDetail}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Convert to BC Dialog */}
      <ConvertToBcDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        selectedDevis={selectedDevis}
        converting={converting}
        onConvert={handleConvertToBc}
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

      {/* Direct Order Dialog */}
      <DirectOrderDialog
        open={directOrderOpen}
        onOpenChange={setDirectOrderOpen}
        creatingOrder={creatingOrder}
        onCreateOrder={handleCreateDirectOrder}
        onCancel={handleCancelDirectOrder}
        orderClientId={orderClientId}
        onClientSelect={handleClientSelect}
        orderFormuleId={orderFormuleId}
        setOrderFormuleId={setOrderFormuleId}
        orderVolume={orderVolume}
        setOrderVolume={setOrderVolume}
        orderPrix={orderPrix}
        setOrderPrix={setOrderPrix}
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
        autoLaunchProduction={autoLaunchProduction}
        setAutoLaunchProduction={setAutoLaunchProduction}
        clients={clients}
        formules={formules}
        zones={zones}
        prestataires={prestataires}
      />

      {/* BC Detail Dialog */}
      <BcDetailDialog
        bc={selectedBc}
        open={bcDetailOpen}
        onOpenChange={setBcDetailOpen}
        onAddDelivery={handleAddDeliveryFromDialog}
        onGenerateInvoice={async (bcId: string) => bcId}
        onRefresh={fetchData}
      />
    </MainLayout>
  );
}
