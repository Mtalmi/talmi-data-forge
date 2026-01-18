import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ZoneLivraison {
  id: string;
  code_zone: string;
  nom_zone: string;
  description: string | null;
  prix_livraison_m3: number;
  actif: boolean;
}

export interface PrestaireTransport {
  id: string;
  code_prestataire: string;
  nom_prestataire: string;
  contact_nom: string | null;
  contact_telephone: string | null;
  tarif_base_m3: number;
  actif: boolean;
  note_service: number | null;
}

export const MODES_PAIEMENT = [
  { value: 'cash', label: 'Espèces' },
  { value: 'virement', label: 'Virement Bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'traite', label: 'Traite' },
  { value: 'credit', label: 'À Crédit' },
] as const;

export type ModePaiement = typeof MODES_PAIEMENT[number]['value'];

export function useZonesLivraison() {
  const [zones, setZones] = useState<ZoneLivraison[]>([]);
  const [prestataires, setPrestataires] = useState<PrestaireTransport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [zonesRes, prestRes] = await Promise.all([
        supabase
          .from('zones_livraison')
          .select('*')
          .eq('actif', true)
          .order('code_zone'),
        supabase
          .from('prestataires_transport')
          .select('*')
          .eq('actif', true)
          .order('nom_prestataire'),
      ]);

      if (zonesRes.error) throw zonesRes.error;
      if (prestRes.error) throw prestRes.error;

      setZones(zonesRes.data || []);
      setPrestataires(prestRes.data || []);
    } catch (error) {
      console.error('Error fetching zones/prestataires:', error);
      toast.error('Erreur lors du chargement des zones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getZoneById = useCallback((id: string) => {
    return zones.find(z => z.id === id);
  }, [zones]);

  const getPrestataireById = useCallback((id: string) => {
    return prestataires.find(p => p.id === id);
  }, [prestataires]);

  const updateZonePrix = async (zoneId: string, newPrix: number) => {
    try {
      const { error } = await supabase
        .from('zones_livraison')
        .update({ prix_livraison_m3: newPrix })
        .eq('id', zoneId);

      if (error) throw error;
      toast.success('Prix de zone mis à jour');
      fetchData();
    } catch (error) {
      console.error('Error updating zone price:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const addPrestataire = async (data: Omit<PrestaireTransport, 'id' | 'actif'>) => {
    try {
      const { error } = await supabase
        .from('prestataires_transport')
        .insert(data);

      if (error) throw error;
      toast.success('Prestataire ajouté');
      fetchData();
    } catch (error) {
      console.error('Error adding prestataire:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  return {
    zones,
    prestataires,
    loading,
    fetchData,
    getZoneById,
    getPrestataireById,
    updateZonePrix,
    addPrestataire,
    modesPaiement: MODES_PAIEMENT,
  };
}
