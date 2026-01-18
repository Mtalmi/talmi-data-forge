import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface Devis {
  id: string;
  devis_id: string;
  client_id: string | null;
  formule_id: string;
  volume_m3: number;
  distance_km: number;
  cut_per_m3: number;
  fixed_cost_per_m3: number;
  transport_extra_per_m3: number;
  total_cost_per_m3: number;
  margin_pct: number;
  prix_vente_m3: number;
  total_ht: number;
  statut: string;
  validite_jours: number;
  date_expiration: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: { nom_client: string; adresse: string | null };
  formule?: { designation: string };
}

export interface BonCommande {
  id: string;
  bc_id: string;
  devis_id: string | null;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number;
  total_ht: number;
  statut: string;
  date_livraison_souhaitee: string | null;
  heure_livraison_souhaitee: string | null;
  adresse_livraison: string | null;
  contact_chantier: string | null;
  telephone_chantier: string | null;
  reference_client: string | null;
  conditions_acces: string | null;
  pompe_requise: boolean;
  type_pompe: string | null;
  notes: string | null;
  prix_verrouille: boolean;
  created_by: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: { nom_client: string; adresse: string | null; telephone: string | null };
  formule?: { designation: string };
}

export function useSalesWorkflow() {
  const { user } = useAuth();
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [bcList, setBcList] = useState<BonCommande[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [devisRes, bcRes] = await Promise.all([
        supabase
          .from('devis')
          .select(`
            *,
            client:clients(nom_client, adresse),
            formule:formules_theoriques(designation)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('bons_commande')
          .select(`
            *,
            client:clients(nom_client, adresse, telephone),
            formule:formules_theoriques(designation)
          `)
          .order('created_at', { ascending: false }),
      ]);

      if (devisRes.error) throw devisRes.error;
      if (bcRes.error) throw bcRes.error;

      setDevisList(devisRes.data || []);
      setBcList(bcRes.data || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateDevisId = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DEV-${year}${month}-${random}`;
  }, []);

  const generateBcId = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BC-${year}${month}-${random}`;
  }, []);

  const saveDevis = useCallback(async (data: {
    client_id?: string;
    formule_id: string;
    volume_m3: number;
    distance_km: number;
    cut_per_m3: number;
    fixed_cost_per_m3: number;
    transport_extra_per_m3: number;
    total_cost_per_m3: number;
    margin_pct: number;
    prix_vente_m3: number;
    total_ht: number;
    notes?: string;
  }) => {
    try {
      const devis_id = generateDevisId();
      const date_expiration = new Date();
      date_expiration.setDate(date_expiration.getDate() + 30);

      const { data: newDevis, error } = await supabase
        .from('devis')
        .insert({
          devis_id,
          client_id: data.client_id || null,
          formule_id: data.formule_id,
          volume_m3: data.volume_m3,
          distance_km: data.distance_km,
          cut_per_m3: data.cut_per_m3,
          fixed_cost_per_m3: data.fixed_cost_per_m3,
          transport_extra_per_m3: data.transport_extra_per_m3,
          total_cost_per_m3: data.total_cost_per_m3,
          margin_pct: data.margin_pct,
          prix_vente_m3: data.prix_vente_m3,
          total_ht: data.total_ht,
          statut: 'en_attente',
          validite_jours: 30,
          date_expiration: date_expiration.toISOString().split('T')[0],
          notes: data.notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchData();
      toast.success(`Devis ${devis_id} enregistré`);
      return newDevis;
    } catch (error) {
      console.error('Error saving devis:', error);
      toast.error('Erreur lors de l\'enregistrement du devis');
      return null;
    }
  }, [user, generateDevisId, fetchData]);

  const convertToBc = useCallback(async (devis: Devis, deliveryData?: {
    date_livraison_souhaitee?: string;
    heure_livraison_souhaitee?: string;
    adresse_livraison?: string;
    contact_chantier?: string;
    telephone_chantier?: string;
    reference_client?: string;
    conditions_acces?: string;
    pompe_requise?: boolean;
    type_pompe?: string;
    notes?: string;
    zone_livraison_id?: string;
    mode_paiement?: string;
    prix_livraison_m3?: number;
    prestataire_id?: string;
  }) => {
    try {
      if (!devis.client_id) {
        toast.error('Un client doit être associé au devis avant la conversion');
        return null;
      }

      const bc_id = generateBcId();

      // Create BC with all professional details
      const { data: newBc, error: bcError } = await supabase
        .from('bons_commande')
        .insert({
          bc_id,
          devis_id: devis.devis_id,
          client_id: devis.client_id,
          formule_id: devis.formule_id,
          volume_m3: devis.volume_m3,
          prix_vente_m3: devis.prix_vente_m3,
          total_ht: devis.total_ht,
          statut: 'pret_production',
          date_livraison_souhaitee: deliveryData?.date_livraison_souhaitee || null,
          heure_livraison_souhaitee: deliveryData?.heure_livraison_souhaitee || null,
          adresse_livraison: deliveryData?.adresse_livraison || devis.client?.adresse || null,
          contact_chantier: deliveryData?.contact_chantier || null,
          telephone_chantier: deliveryData?.telephone_chantier || null,
          reference_client: deliveryData?.reference_client || null,
          conditions_acces: deliveryData?.conditions_acces || null,
          pompe_requise: deliveryData?.pompe_requise || false,
          type_pompe: deliveryData?.type_pompe || null,
          notes: deliveryData?.notes || null,
          zone_livraison_id: deliveryData?.zone_livraison_id || null,
          mode_paiement: deliveryData?.mode_paiement || 'virement',
          prix_livraison_m3: deliveryData?.prix_livraison_m3 || 0,
          prestataire_id: deliveryData?.prestataire_id || null,
          prix_verrouille: true,
          created_by: user?.id,
          validated_by: user?.id,
          validated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (bcError) throw bcError;

      // Update Devis status
      const { error: updateError } = await supabase
        .from('devis')
        .update({ statut: 'converti' })
        .eq('devis_id', devis.devis_id);

      if (updateError) throw updateError;

      await fetchData();
      toast.success(`Bon de Commande ${bc_id} créé - Prix verrouillé`);
      return newBc;
    } catch (error) {
      console.error('Error converting to BC:', error);
      toast.error('Erreur lors de la conversion en BC');
      return null;
    }
  }, [user, generateBcId, fetchData]);

  const updateDevisStatus = useCallback(async (devisId: string, statut: string) => {
    try {
      const { error } = await supabase
        .from('devis')
        .update({ statut })
        .eq('devis_id', devisId);

      if (error) throw error;

      await fetchData();
      toast.success('Statut mis à jour');
    } catch (error) {
      console.error('Error updating devis status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [fetchData]);

  const updateBcStatus = useCallback(async (bcId: string, statut: string) => {
    try {
      const { error } = await supabase
        .from('bons_commande')
        .update({ statut })
        .eq('bc_id', bcId);

      if (error) throw error;

      await fetchData();
      toast.success('Statut BC mis à jour');
    } catch (error) {
      console.error('Error updating BC status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [fetchData]);

  // Create BL from BC - The missing link!
  const createBlFromBc = useCallback(async (bc: BonCommande): Promise<string | null> => {
    try {
      // Generate BL ID
      const today = new Date();
      const dateStr = format(today, 'yyMMdd');
      
      // Get count for today to generate sequence
      const { count } = await supabase
        .from('bons_livraison_reels')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', format(today, 'yyyy-MM-dd'))
        .lt('created_at', format(new Date(today.getTime() + 86400000), 'yyyy-MM-dd'));
      
      const sequence = ((count || 0) + 1).toString().padStart(4, '0');
      const blId = `TB-${dateStr}-${sequence}`;

      // Get formule to get theoretical values for initial ciment
      const { data: formule } = await supabase
        .from('formules_theoriques')
        .select('ciment_kg_m3')
        .eq('formule_id', bc.formule_id)
        .single();

      const cimentReel = formule ? formule.ciment_kg_m3 * bc.volume_m3 : bc.volume_m3 * 350; // Default 350kg/m³

      // Create the BL entry
      const { error: blError } = await supabase
        .from('bons_livraison_reels')
        .insert({
          bl_id: blId,
          client_id: bc.client_id,
          formule_id: bc.formule_id,
          volume_m3: bc.volume_m3,
          ciment_reel_kg: cimentReel,
          prix_vente_m3: bc.prix_vente_m3,
          date_livraison: bc.date_livraison_souhaitee || format(today, 'yyyy-MM-dd'),
          heure_prevue: bc.heure_livraison_souhaitee || null,
          workflow_status: 'planification',
          statut_paiement: 'En Attente',
          created_by: user?.id,
        });

      if (blError) throw blError;

      // Update BC status to en_production
      const { error: bcError } = await supabase
        .from('bons_commande')
        .update({ statut: 'en_production' })
        .eq('bc_id', bc.bc_id);

      if (bcError) throw bcError;

      await fetchData();
      toast.success(`BL ${blId} créé - Prêt pour planification`);
      return blId;
    } catch (error) {
      console.error('Error creating BL from BC:', error);
      toast.error('Erreur lors de la création du BL');
      return null;
    }
  }, [user, fetchData]);

  // Create Direct BC (without Devis) - Quick Order
  const createDirectBc = useCallback(async (data: {
    client_id: string;
    formule_id: string;
    volume_m3: number;
    prix_vente_m3: number;
    date_livraison_souhaitee: string;
    heure_livraison_souhaitee?: string;
    adresse_livraison?: string;
    contact_chantier?: string;
    telephone_chantier?: string;
    reference_client?: string;
    conditions_acces?: string;
    pompe_requise?: boolean;
    type_pompe?: string;
    notes?: string;
    zone_livraison_id?: string;
    mode_paiement?: string;
    prix_livraison_m3?: number;
    prestataire_id?: string;
  }): Promise<BonCommande | null> => {
    try {
      const bc_id = generateBcId();
      const total_ht = data.prix_vente_m3 * data.volume_m3;

      const { data: newBc, error } = await supabase
        .from('bons_commande')
        .insert({
          bc_id,
          client_id: data.client_id,
          formule_id: data.formule_id,
          volume_m3: data.volume_m3,
          prix_vente_m3: data.prix_vente_m3,
          total_ht,
          statut: 'pret_production',
          date_livraison_souhaitee: data.date_livraison_souhaitee,
          heure_livraison_souhaitee: data.heure_livraison_souhaitee || null,
          adresse_livraison: data.adresse_livraison || null,
          contact_chantier: data.contact_chantier || null,
          telephone_chantier: data.telephone_chantier || null,
          reference_client: data.reference_client || null,
          conditions_acces: data.conditions_acces || null,
          pompe_requise: data.pompe_requise || false,
          type_pompe: data.type_pompe || null,
          notes: data.notes || null,
          zone_livraison_id: data.zone_livraison_id || null,
          mode_paiement: data.mode_paiement || 'virement',
          prix_livraison_m3: data.prix_livraison_m3 || 0,
          prestataire_id: data.prestataire_id || null,
          prix_verrouille: true,
          created_by: user?.id,
          validated_by: user?.id,
          validated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await fetchData();
      toast.success(`Commande ${bc_id} créée avec succès!`);
      return newBc;
    } catch (error) {
      console.error('Error creating direct BC:', error);
      toast.error('Erreur lors de la création de la commande');
      return null;
    }
  }, [user, generateBcId, fetchData]);

  // Stats
  const stats = {
    devisEnAttente: devisList.filter(d => d.statut === 'en_attente').length,
    devisAcceptes: devisList.filter(d => d.statut === 'accepte').length,
    devisConverti: devisList.filter(d => d.statut === 'converti').length,
    devisRefuses: devisList.filter(d => d.statut === 'refuse').length,
    bcPretProduction: bcList.filter(bc => bc.statut === 'pret_production').length,
    bcEnProduction: bcList.filter(bc => bc.statut === 'en_production').length,
    bcLivre: bcList.filter(bc => bc.statut === 'livre').length,
    totalDevisHT: devisList
      .filter(d => d.statut === 'en_attente')
      .reduce((sum, d) => sum + (d.total_ht || 0), 0),
    totalBcHT: bcList.reduce((sum, bc) => sum + (bc.total_ht || 0), 0),
  };

  return {
    devisList,
    bcList,
    loading,
    stats,
    fetchData,
    saveDevis,
    convertToBc,
    createBlFromBc,
    createDirectBc,
    updateDevisStatus,
    updateBcStatus,
  };
}
