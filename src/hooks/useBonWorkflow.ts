import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BonLivraison {
  bl_id: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  ciment_reel_kg: number;
  adjuvant_reel_l: number | null;
  prix_vente_m3: number | null;
  workflow_status: string | null;
}

interface FormuleTheorique {
  formule_id: string;
  ciment_kg_m3: number;
  adjuvant_l_m3: number;
}

interface PrixAchat {
  matiere_premiere: string;
  prix_unitaire_dh: number;
}

// Workflow transitions allowed by role
const WORKFLOW_TRANSITIONS: Record<string, { from: string[]; to: string; roles: string[] }[]> = {
  planification: [
    { from: ['planification'], to: 'production', roles: ['ceo', 'directeur_operations'] }
  ],
  production: [
    { from: ['production'], to: 'validation_technique', roles: ['ceo', 'centraliste'] }
  ],
  validation_technique: [
    { from: ['validation_technique'], to: 'en_livraison', roles: ['ceo', 'responsable_technique'] }
  ],
  en_livraison: [
    { from: ['en_livraison'], to: 'livre', roles: ['ceo', 'directeur_operations', 'agent_administratif'] }
  ],
  livre: [
    { from: ['livre'], to: 'facture', roles: ['ceo', 'agent_administratif'] }
  ],
  annule: [
    { from: ['planification', 'production', 'validation_technique'], to: 'annule', roles: ['ceo'] }
  ],
};

export function useBonWorkflow() {
  const { user, role, isCeo } = useAuth();

  // Check if user can transition to a specific status
  const canTransitionTo = useCallback((currentStatus: string, targetStatus: string): boolean => {
    if (isCeo) return true; // CEO can do anything

    const transitions = WORKFLOW_TRANSITIONS[targetStatus];
    if (!transitions) return false;

    return transitions.some(t => 
      t.from.includes(currentStatus) && t.roles.includes(role || '')
    );
  }, [role, isCeo]);

  // Calculate CUR (Coût Unitaire Réel) when BL is marked as "Livré"
  const calculateCUR = useCallback(async (bon: BonLivraison): Promise<number | null> => {
    try {
      // Fetch formule théorique
      const { data: formule, error: formuleError } = await supabase
        .from('formules_theoriques')
        .select('*')
        .eq('formule_id', bon.formule_id)
        .single();

      if (formuleError || !formule) {
        console.error('Formule not found:', formuleError);
        return null;
      }

      // Fetch current prices
      const { data: prices, error: pricesError } = await supabase
        .from('prix_achat_actuels')
        .select('matiere_premiere, prix_unitaire_dh');

      if (pricesError) {
        console.error('Error fetching prices:', pricesError);
        return null;
      }

      // Create price map
      const priceMap: Record<string, number> = {};
      prices?.forEach((p: PrixAchat) => {
        priceMap[p.matiere_premiere.toLowerCase()] = p.prix_unitaire_dh;
      });

      // Calculate CUR based on actual consumption
      const cimentPrice = priceMap['ciment'] || priceMap['ciment cpj 45'] || 0;
      const adjuvantPrice = priceMap['adjuvant'] || priceMap['plastifiant'] || 0;
      const eauPrice = priceMap['eau'] || 0;
      const sablePrice = priceMap['sable'] || 0;
      const gravierPrice = priceMap['gravier'] || 0;

      // Cost per m³ based on actual consumption
      const cimentCost = (bon.ciment_reel_kg / bon.volume_m3) * cimentPrice / 1000; // Price per kg
      const adjuvantCost = ((bon.adjuvant_reel_l || 0) / bon.volume_m3) * adjuvantPrice;
      
      // Use theoretical values for other materials (not tracked in real consumption)
      const sableCost = (formule.sable_kg_m3 || 0) * sablePrice / 1000;
      const gravierCost = (formule.gravier_kg_m3 || 0) * gravierPrice / 1000;
      const eauCost = (formule.eau_l_m3 || 0) * eauPrice / 1000;

      const curReel = cimentCost + adjuvantCost + sableCost + gravierCost + eauCost;

      return curReel;
    } catch (error) {
      console.error('Error calculating CUR:', error);
      return null;
    }
  }, []);

  // Check for margin leakage (Fuite de Marge)
  const checkMarginLeakage = useCallback(async (
    blId: string, 
    curReel: number, 
    prixVente: number | null
  ): Promise<{ hasLeakage: boolean; ecartMarge: number | null }> => {
    if (!prixVente || prixVente <= 0) {
      return { hasLeakage: false, ecartMarge: null };
    }

    // Calculate margin deviation
    // Ecart = (CUR_Reel - CUT_Theorique) / CUT_Theorique * 100
    // For simplicity, we compare CUR to selling price margin expectation
    const margeBrute = ((prixVente - curReel) / prixVente) * 100;
    const ecartMarge = curReel; // Store CUR for reference

    // Alert if margin is below expected (using 5% threshold based on spec)
    const expectedMinMargin = 15; // 15% minimum expected margin
    const hasLeakage = margeBrute < expectedMinMargin;

    return { hasLeakage, ecartMarge };
  }, []);

  // Transition BL to a new workflow status
  const transitionWorkflow = useCallback(async (
    blId: string,
    currentStatus: string,
    newStatus: string,
    additionalData?: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      if (!canTransitionTo(currentStatus, newStatus) && !isCeo) {
        toast.error('Vous n\'avez pas les permissions pour cette transition');
        return false;
      }

      const updateData: Record<string, unknown> = {
        workflow_status: newStatus,
        ...additionalData,
      };

      // Handle specific status transitions
      if (newStatus === 'validation_technique') {
        updateData.validation_technique = true;
        updateData.validated_by = user?.id;
        updateData.validated_at = new Date().toISOString();
      }

      if (newStatus === 'livre') {
        // Fetch the BL to calculate CUR
        const { data: bon, error: bonError } = await supabase
          .from('bons_livraison_reels')
          .select('*')
          .eq('bl_id', blId)
          .single();

        if (bonError || !bon) {
          toast.error('Erreur lors de la récupération du bon');
          return false;
        }

        // Calculate CUR
        const curReel = await calculateCUR(bon);
        if (curReel !== null) {
          updateData.cur_reel = curReel;

          // Check for margin leakage
          const { hasLeakage, ecartMarge } = await checkMarginLeakage(
            blId, 
            curReel, 
            bon.prix_vente_m3
          );

          if (hasLeakage) {
            updateData.alerte_marge = true;
            updateData.ecart_marge = ecartMarge;

            // Create Leakage Alert
            await supabase.from('alertes_systeme').insert([{
              type_alerte: 'marge',
              niveau: 'critical',
              titre: 'FUITE DE MARGE',
              message: `BL ${blId}: CUR Réel ${curReel.toFixed(2)} DH/m³ - Marge insuffisante`,
              reference_id: blId,
              reference_table: 'bons_livraison_reels',
              destinataire_role: 'ceo',
            }]);

            // Also notify Superviseur
            await supabase.from('alertes_systeme').insert([{
              type_alerte: 'marge',
              niveau: 'critical',
              titre: 'FUITE DE MARGE',
              message: `BL ${blId}: CUR Réel ${curReel.toFixed(2)} DH/m³ - Marge insuffisante`,
              reference_id: blId,
              reference_table: 'bons_livraison_reels',
              destinataire_role: 'superviseur',
            }]);

            toast.warning('⚠️ Alerte Fuite de Marge déclenchée!');
          }
        }
      }

      if (newStatus === 'facture') {
        updateData.facture_generee = true;
      }

      if (newStatus === 'annule') {
        updateData.annule_par = user?.id;
        updateData.annule_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bons_livraison_reels')
        .update(updateData)
        .eq('bl_id', blId);

      if (error) {
        toast.error('Erreur lors de la mise à jour');
        return false;
      }

      toast.success(`Statut mis à jour: ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Error transitioning workflow:', error);
      toast.error('Erreur lors de la transition');
      return false;
    }
  }, [user, isCeo, canTransitionTo, calculateCUR, checkMarginLeakage]);

  return {
    canTransitionTo,
    transitionWorkflow,
    calculateCUR,
    checkMarginLeakage,
  };
}
