import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientTrackingHeader } from '@/components/client-portal/ClientTrackingHeader';
import { ClientStatusStepper } from '@/components/client-portal/ClientStatusStepper';
import { ClientLiveMap } from '@/components/client-portal/ClientLiveMap';
import { ClientQualityProof } from '@/components/client-portal/ClientQualityProof';
import { ClientReceptionConfirm } from '@/components/client-portal/ClientReceptionConfirm';
import { ClientDeliveryCard } from '@/components/client-portal/ClientDeliveryCard';
import { Package, AlertTriangle, Loader2 } from 'lucide-react';

interface TrackingData {
  bc_id: string;
  nom_client: string;
  formule_designation: string;
  bc_volume: number;
  bc_statut: string;
  date_livraison_souhaitee: string | null;
  heure_livraison_souhaitee: string | null;
  adresse_livraison: string | null;
  zone_nom: string | null;
  bc_confirmed_at: string | null;
  bc_confirmed_by: string | null;
}

interface DeliveryData {
  bl_id: string;
  bc_id: string;
  workflow_status: string;
  volume_m3: number;
  date_livraison: string;
  heure_prevue: string | null;
  heure_depart_centrale: string | null;
  heure_arrivee_chantier: string | null;
  camion_assigne: string | null;
  toupie_assignee: string | null;
  chauffeur_nom: string | null;
  truck_driver: string | null;
  driver_phone: string | null;
  nom_zone: string | null;
  photo_slump_url: string | null;
  photo_texture_url: string | null;
  quality_approved: boolean | null;
  quality_approved_by: string | null;
  affaissement_mm: number | null;
  affaissement_conforme: boolean | null;
  client_confirmed_at: string | null;
  client_confirmed_by_name: string | null;
  tracking_token: string | null;
}

export default function ClientTracking() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryData | null>(null);

  const fetchTrackingData = useCallback(async () => {
    if (!token) {
      setError('Lien de suivi invalide');
      setLoading(false);
      return;
    }

    try {
      // Fetch BC tracking data
      const { data: bcData, error: bcError } = await supabase
        .from('bons_commande')
        .select(`
          bc_id,
          statut,
          volume_m3,
          date_livraison_souhaitee,
          heure_livraison_souhaitee,
          adresse_livraison,
          client_confirmed_at,
          client_confirmed_by_name,
          clients (nom_client),
          formules_theoriques (designation),
          zones_livraison (nom_zone)
        `)
        .eq('tracking_token', token)
        .eq('tracking_enabled', true)
        .maybeSingle();

      if (bcError) throw bcError;
      
      if (!bcData) {
        setError('Commande introuvable ou suivi désactivé');
        setLoading(false);
        return;
      }

      setTrackingData({
        bc_id: bcData.bc_id,
        nom_client: (bcData.clients as any)?.nom_client || 'Client',
        formule_designation: (bcData.formules_theoriques as any)?.designation || 'Béton',
        bc_volume: bcData.volume_m3,
        bc_statut: bcData.statut,
        date_livraison_souhaitee: bcData.date_livraison_souhaitee,
        heure_livraison_souhaitee: bcData.heure_livraison_souhaitee,
        adresse_livraison: bcData.adresse_livraison,
        zone_nom: (bcData.zones_livraison as any)?.nom_zone || null,
        bc_confirmed_at: bcData.client_confirmed_at,
        bc_confirmed_by: bcData.client_confirmed_by_name,
      });

      // Fetch associated deliveries
      const { data: blsData, error: blsError } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id,
          bc_id,
          workflow_status,
          volume_m3,
          date_livraison,
          heure_prevue,
          heure_depart_centrale,
          heure_arrivee_chantier,
          camion_assigne,
          toupie_assignee,
          chauffeur_nom,
          affaissement_mm,
          affaissement_conforme,
          client_confirmed_at,
          client_confirmed_by_name,
          tracking_token,
          flotte:camion_assigne (chauffeur, telephone_chauffeur),
          zones_livraison (nom_zone),
          controles_depart (
            photo_slump_url,
            photo_texture_url,
            affaissement_conforme,
            valide_par_name
          )
        `)
        .eq('bc_id', bcData.bc_id)
        .order('created_at', { ascending: true });

      if (blsError) throw blsError;

      const mappedDeliveries: DeliveryData[] = (blsData || []).map((bl: any) => ({
        bl_id: bl.bl_id,
        bc_id: bl.bc_id,
        workflow_status: bl.workflow_status || 'planification',
        volume_m3: bl.volume_m3,
        date_livraison: bl.date_livraison,
        heure_prevue: bl.heure_prevue,
        heure_depart_centrale: bl.heure_depart_centrale,
        heure_arrivee_chantier: bl.heure_arrivee_chantier,
        camion_assigne: bl.camion_assigne,
        toupie_assignee: bl.toupie_assignee,
        chauffeur_nom: bl.chauffeur_nom,
        truck_driver: bl.flotte?.chauffeur || null,
        driver_phone: bl.flotte?.telephone_chauffeur || null,
        nom_zone: bl.zones_livraison?.nom_zone || null,
        photo_slump_url: bl.controles_depart?.[0]?.photo_slump_url || null,
        photo_texture_url: bl.controles_depart?.[0]?.photo_texture_url || null,
        quality_approved: bl.controles_depart?.[0]?.affaissement_conforme || null,
        quality_approved_by: bl.controles_depart?.[0]?.valide_par_name || null,
        affaissement_mm: bl.affaissement_mm,
        affaissement_conforme: bl.affaissement_conforme,
        client_confirmed_at: bl.client_confirmed_at,
        client_confirmed_by_name: bl.client_confirmed_by_name,
        tracking_token: bl.tracking_token,
      }));

      setDeliveries(mappedDeliveries);
      if (mappedDeliveries.length > 0) {
        // Select the most relevant delivery (in progress or latest)
        const activeDelivery = mappedDeliveries.find(d => 
          ['production', 'validation_technique', 'en_livraison'].includes(d.workflow_status)
        ) || mappedDeliveries[mappedDeliveries.length - 1];
        setSelectedDelivery(activeDelivery);
      }

    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTrackingData();

    // Set up realtime subscription
    const channel = supabase
      .channel(`client-tracking-${token}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bons_livraison_reels' },
        () => fetchTrackingData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bons_commande' },
        () => fetchTrackingData()
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTrackingData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchTrackingData, token]);

  const handleConfirmReception = async (deliveryToken: string, name: string) => {
    await supabase
      .from('bons_livraison_reels')
      .update({
        client_confirmed_at: new Date().toISOString(),
        client_confirmed_by_name: name,
        workflow_status: 'livre',
      })
      .eq('tracking_token', deliveryToken);

    fetchTrackingData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto" />
          <p className="text-amber-500/80 text-sm">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-white">Suivi Indisponible</h1>
          <p className="text-gray-400">{error || 'Le lien de suivi est invalide ou a expiré.'}</p>
        </div>
      </div>
    );
  }

  const isEnRoute = selectedDelivery?.workflow_status === 'en_livraison';
  const hasQualityProof = selectedDelivery?.photo_slump_url || selectedDelivery?.photo_texture_url;
  const canConfirm = selectedDelivery && 
    ['en_livraison', 'livre'].includes(selectedDelivery.workflow_status) && 
    !selectedDelivery.client_confirmed_at;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Obsidian & Gold Theme Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <ClientTrackingHeader 
          bcId={trackingData.bc_id}
          clientName={trackingData.nom_client}
          formuleDesignation={trackingData.formule_designation}
          volume={trackingData.bc_volume}
          deliveryDate={trackingData.date_livraison_souhaitee}
          deliveryTime={trackingData.heure_livraison_souhaitee}
          address={trackingData.adresse_livraison}
          zone={trackingData.zone_nom}
        />

        {/* Deliveries List */}
        {deliveries.length > 1 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-amber-500/80 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Livraisons ({deliveries.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {deliveries.map((delivery) => (
                <ClientDeliveryCard
                  key={delivery.bl_id}
                  delivery={delivery}
                  isSelected={selectedDelivery?.bl_id === delivery.bl_id}
                  onSelect={() => setSelectedDelivery(delivery)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Selected Delivery Details */}
        {selectedDelivery && (
          <>
            {/* Status Stepper */}
            <ClientStatusStepper 
              status={selectedDelivery.workflow_status}
              departureTime={selectedDelivery.heure_depart_centrale}
              arrivalTime={selectedDelivery.heure_arrivee_chantier}
              confirmedAt={selectedDelivery.client_confirmed_at}
            />

            {/* Live Map (only when en route) */}
            {isEnRoute && (
              <ClientLiveMap
                truckId={selectedDelivery.camion_assigne || selectedDelivery.toupie_assignee}
                driverName={selectedDelivery.truck_driver || selectedDelivery.chauffeur_nom}
                driverPhone={selectedDelivery.driver_phone}
                zoneName={selectedDelivery.nom_zone}
              />
            )}

            {/* Quality Proof */}
            {hasQualityProof && (
              <ClientQualityProof
                slumpPhotoUrl={selectedDelivery.photo_slump_url}
                texturePhotoUrl={selectedDelivery.photo_texture_url}
                affaissement={selectedDelivery.affaissement_mm}
                isConforming={selectedDelivery.quality_approved || selectedDelivery.affaissement_conforme}
                approvedBy={selectedDelivery.quality_approved_by}
              />
            )}

            {/* Digital Handover */}
            {canConfirm && selectedDelivery.tracking_token && (
              <ClientReceptionConfirm
                deliveryToken={selectedDelivery.tracking_token}
                blId={selectedDelivery.bl_id}
                onConfirm={handleConfirmReception}
              />
            )}

            {/* Already Confirmed Badge */}
            {selectedDelivery.client_confirmed_at && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Réception Confirmée</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Par {selectedDelivery.client_confirmed_by_name} • {new Date(selectedDelivery.client_confirmed_at).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center pt-8 pb-4 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-1 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-500">TALMI BETON</span>
            <div className="h-1 w-1 rounded-full bg-amber-500" />
          </div>
          <p className="text-[10px] text-gray-600">
            Suivi en temps réel • Mise à jour automatique
          </p>
        </div>
      </div>
    </div>
  );
}
