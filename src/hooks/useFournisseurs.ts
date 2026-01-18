import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Fournisseur {
  id: string;
  code_fournisseur: string;
  nom_fournisseur: string;
  contact_nom: string | null;
  contact_telephone: string | null;
  contact_email: string | null;
  adresse: string | null;
  ville: string | null;
  conditions_paiement: string | null;
  delai_livraison_jours: number | null;
  note_qualite: number | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Achat {
  id: string;
  numero_achat: string;
  fournisseur_id: string;
  fournisseur?: Fournisseur;
  date_commande: string;
  date_livraison_prevue: string | null;
  date_livraison_reelle: string | null;
  statut: string;
  montant_ht: number;
  tva_pct: number;
  montant_ttc: number | null;
  notes: string | null;
  lignes?: LigneAchat[];
  created_at: string;
}

export interface LigneAchat {
  id: string;
  achat_id: string;
  materiau: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  montant_ligne: number;
}

export interface FactureFournisseur {
  id: string;
  numero_facture: string;
  fournisseur_id: string;
  fournisseur?: Fournisseur;
  achat_id: string | null;
  date_facture: string;
  date_echeance: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  montant_paye: number;
  statut: string;
  created_at: string;
}

export interface AlerteReapprovisionnement {
  id: string;
  materiau: string;
  seuil_alerte: number;
  quantite_reorder: number;
  fournisseur_prefere_id: string | null;
  fournisseur?: Fournisseur;
  delai_commande_jours: number;
  actif: boolean;
  derniere_alerte: string | null;
}

export function useFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [achats, setAchats] = useState<Achat[]>([]);
  const [facturesFournisseur, setFacturesFournisseur] = useState<FactureFournisseur[]>([]);
  const [alertesReappro, setAlertesReappro] = useState<AlerteReapprovisionnement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch suppliers
      const { data: fournisseursData, error: fournisseursError } = await supabase
        .from('fournisseurs')
        .select('*')
        .order('nom_fournisseur');

      if (fournisseursError) throw fournisseursError;
      setFournisseurs(fournisseursData || []);

      // Fetch purchases with supplier info
      const { data: achatsData, error: achatsError } = await supabase
        .from('achats')
        .select('*, fournisseurs(*)')
        .order('date_commande', { ascending: false });

      if (achatsError) throw achatsError;
      
      const achatsWithFournisseur = (achatsData || []).map(a => ({
        ...a,
        fournisseur: a.fournisseurs as Fournisseur,
      }));
      setAchats(achatsWithFournisseur);

      // Fetch supplier invoices
      const { data: facturesData, error: facturesError } = await supabase
        .from('factures_fournisseur')
        .select('*, fournisseurs(*)')
        .order('date_echeance', { ascending: true });

      if (facturesError) throw facturesError;
      
      const facturesWithFournisseur = (facturesData || []).map(f => ({
        ...f,
        fournisseur: f.fournisseurs as Fournisseur,
      }));
      setFacturesFournisseur(facturesWithFournisseur);

      // Fetch reorder alerts
      const { data: alertesData, error: alertesError } = await supabase
        .from('alertes_reapprovisionnement')
        .select('*, fournisseurs(*)')
        .order('materiau');

      if (alertesError) throw alertesError;
      
      const alertesWithFournisseur = (alertesData || []).map(a => ({
        ...a,
        fournisseur: a.fournisseurs as Fournisseur,
      }));
      setAlertesReappro(alertesWithFournisseur);

    } catch (error) {
      console.error('Error fetching supplier data:', error);
      toast.error('Erreur lors du chargement des données fournisseurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createFournisseur = async (data: {
    code_fournisseur: string;
    nom_fournisseur: string;
    contact_nom?: string;
    contact_telephone?: string;
    contact_email?: string;
    ville?: string;
    conditions_paiement?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('fournisseurs')
        .insert([data]);

      if (error) throw error;
      toast.success('Fournisseur créé avec succès');
      fetchAll();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
      return false;
    }
  };

  const createAchat = async (
    achat: { numero_achat: string; fournisseur_id: string; date_livraison_prevue?: string; notes?: string },
    lignes: { materiau: string; quantite: number; unite: string; prix_unitaire: number; montant_ligne: number }[]
  ) => {
    try {
      // Calculate total
      const montantHt = lignes.reduce((sum, l) => sum + (l.montant_ligne || 0), 0);
      
      const { data: achatData, error: achatError } = await supabase
        .from('achats')
        .insert([{ ...achat, montant_ht: montantHt }])
        .select()
        .single();

      if (achatError) throw achatError;

      // Insert lines
      if (lignes.length > 0) {
        const lignesWithAchatId = lignes.map(l => ({
          ...l,
          achat_id: achatData.id,
        }));

        const { error: lignesError } = await supabase
          .from('lignes_achat')
          .insert(lignesWithAchatId);

        if (lignesError) throw lignesError;
      }

      toast.success('Commande créée avec succès');
      fetchAll();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
      return false;
    }
  };

  const updateAchatStatus = async (id: string, statut: Achat['statut'], dateLivraisonReelle?: string) => {
    try {
      const updateData: any = { statut };
      if (dateLivraisonReelle) {
        updateData.date_livraison_reelle = dateLivraisonReelle;
      }

      const { error } = await supabase
        .from('achats')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Statut mis à jour');
      fetchAll();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
      return false;
    }
  };

  const createFactureFournisseur = async (data: {
    numero_facture: string;
    fournisseur_id: string;
    achat_id?: string;
    date_echeance: string;
    montant_ht: number;
    tva: number;
    montant_ttc: number;
  }) => {
    try {
      const { error } = await supabase
        .from('factures_fournisseur')
        .insert([data]);

      if (error) throw error;
      toast.success('Facture enregistrée');
      fetchAll();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
      return false;
    }
  };

  const recordPayment = async (factureId: string, fournisseurId: string, montant: number, modePaiement: string, reference?: string) => {
    try {
      // Insert payment
      const { error: paymentError } = await supabase
        .from('paiements_fournisseur')
        .insert([{
          facture_id: factureId,
          fournisseur_id: fournisseurId,
          montant,
          mode_paiement: modePaiement,
          reference_paiement: reference,
        }]);

      if (paymentError) throw paymentError;

      // Update invoice
      const { data: facture } = await supabase
        .from('factures_fournisseur')
        .select('montant_paye, montant_ttc')
        .eq('id', factureId)
        .single();

      if (facture) {
        const nouveauMontantPaye = (facture.montant_paye || 0) + montant;
        const statut = nouveauMontantPaye >= facture.montant_ttc ? 'payee' : 'partiel';

        await supabase
          .from('factures_fournisseur')
          .update({ montant_paye: nouveauMontantPaye, statut })
          .eq('id', factureId);
      }

      toast.success('Paiement enregistré');
      fetchAll();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du paiement');
      return false;
    }
  };

  // Calculate summary stats
  const stats = {
    totalFournisseurs: fournisseurs.filter(f => f.actif).length,
    commandesEnCours: achats.filter(a => ['en_attente', 'confirmee', 'en_transit'].includes(a.statut)).length,
    montantCommandesEnCours: achats
      .filter(a => ['en_attente', 'confirmee', 'en_transit'].includes(a.statut))
      .reduce((sum, a) => sum + (a.montant_ttc || 0), 0),
    facturesEnAttente: facturesFournisseur.filter(f => f.statut !== 'payee').length,
    montantDu: facturesFournisseur
      .filter(f => f.statut !== 'payee')
      .reduce((sum, f) => sum + (f.montant_ttc - (f.montant_paye || 0)), 0),
    facturesEnRetard: facturesFournisseur.filter(f => {
      if (f.statut === 'payee') return false;
      return new Date(f.date_echeance) < new Date();
    }).length,
  };

  return {
    fournisseurs,
    achats,
    facturesFournisseur,
    alertesReappro,
    loading,
    stats,
    refresh: fetchAll,
    createFournisseur,
    createAchat,
    updateAchatStatus,
    createFactureFournisseur,
    recordPayment,
  };
}
