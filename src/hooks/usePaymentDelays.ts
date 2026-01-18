import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addDays, isPast, format } from 'date-fns';
import { toast } from 'sonner';

interface ClientWithDelay {
  client_id: string;
  nom_client: string;
  solde_du: number;
  delai_paiement_jours: number;
  credit_bloque: boolean;
  derniere_commande_at: string | null;
}

interface BonEnAttente {
  bl_id: string;
  client_id: string;
  date_livraison: string;
  volume_m3: number;
  prix_vente_m3: number | null;
  statut_paiement: string;
}

export function usePaymentDelays() {
  // Check all pending payments and update statuses
  const checkPaymentDelays = useCallback(async (): Promise<{
    clientsInDelay: ClientWithDelay[];
    bonsUpdated: number;
  }> => {
    try {
      // Fetch all bons with "En Attente" status
      const { data: pendingBons, error: bonsError } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, client_id, date_livraison, volume_m3, prix_vente_m3, statut_paiement')
        .eq('statut_paiement', 'En Attente');

      if (bonsError) throw bonsError;

      // Fetch all clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('client_id, nom_client, delai_paiement_jours, solde_du, credit_bloque, derniere_commande_at');

      if (clientsError) throw clientsError;

      // Create client lookup
      const clientMap = new Map(clients?.map(c => [c.client_id, c]));

      // Find bons that are overdue
      const today = new Date();
      const overdueBlIds: string[] = [];
      const clientsWithDelays = new Set<string>();

      pendingBons?.forEach((bon: BonEnAttente) => {
        const client = clientMap.get(bon.client_id);
        if (!client) return;

        const deliveryDate = new Date(bon.date_livraison);
        const dueDate = addDays(deliveryDate, client.delai_paiement_jours || 30);

        if (isPast(dueDate)) {
          overdueBlIds.push(bon.bl_id);
          clientsWithDelays.add(bon.client_id);
        }
      });

      // Update overdue bons to "Retard" status
      if (overdueBlIds.length > 0) {
        const { error: updateError } = await supabase
          .from('bons_livraison_reels')
          .update({ statut_paiement: 'Retard' })
          .in('bl_id', overdueBlIds);

        if (updateError) {
          console.error('Error updating overdue bons:', updateError);
        }
      }

      // Get clients that are in delay
      const clientsInDelay = clients?.filter(c => 
        clientsWithDelays.has(c.client_id) || (c.solde_du && c.solde_du > 0)
      ) || [];

      // Create alerts for CEO and Agent Admin
      if (clientsWithDelays.size > 0) {
        for (const clientId of clientsWithDelays) {
          const client = clientMap.get(clientId);
          if (!client) continue;

          // Check if alert already exists today
          const { data: existingAlert } = await supabase
            .from('alertes_systeme')
            .select('id')
            .eq('type_alerte', 'retard_paiement')
            .eq('reference_id', clientId)
            .gte('created_at', format(today, 'yyyy-MM-dd'))
            .maybeSingle();

          if (!existingAlert) {
            // Create alert for CEO
            await supabase.from('alertes_systeme').insert([{
              type_alerte: 'retard_paiement',
              niveau: 'warning',
              titre: 'Retard de Paiement',
              message: `Client ${client.nom_client} (${clientId}) a des paiements en retard`,
              reference_id: clientId,
              reference_table: 'clients',
              destinataire_role: 'ceo',
            }]);

            // Create alert for Agent Admin
            await supabase.from('alertes_systeme').insert([{
              type_alerte: 'retard_paiement',
              niveau: 'warning',
              titre: 'Retard de Paiement',
              message: `Client ${client.nom_client} (${clientId}) a des paiements en retard`,
              reference_id: clientId,
              reference_table: 'clients',
              destinataire_role: 'agent_administratif',
            }]);
          }
        }
      }

      return {
        clientsInDelay: clientsInDelay as ClientWithDelay[],
        bonsUpdated: overdueBlIds.length,
      };
    } catch (error) {
      console.error('Error checking payment delays:', error);
      return { clientsInDelay: [], bonsUpdated: 0 };
    }
  }, []);

  // Block a client from making new orders
  const blockClient = useCallback(async (clientId: string, reason?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ credit_bloque: true })
        .eq('client_id', clientId);

      if (error) throw error;

      // Create alert
      await supabase.from('alertes_systeme').insert([{
        type_alerte: 'client_bloque',
        niveau: 'warning',
        titre: 'Client Bloqué',
        message: `Client ${clientId} a été bloqué${reason ? `: ${reason}` : ''}`,
        reference_id: clientId,
        reference_table: 'clients',
        destinataire_role: 'ceo',
      }]);

      toast.success('Client bloqué avec succès');
      return true;
    } catch (error) {
      console.error('Error blocking client:', error);
      toast.error('Erreur lors du blocage');
      return false;
    }
  }, []);

  // Unblock a client
  const unblockClient = useCallback(async (clientId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ credit_bloque: false })
        .eq('client_id', clientId);

      if (error) throw error;

      toast.success('Client débloqué');
      return true;
    } catch (error) {
      console.error('Error unblocking client:', error);
      toast.error('Erreur lors du déblocage');
      return false;
    }
  }, []);

  // Generate "Mise en Demeure" (formal payment notice)
  const generateMiseEnDemeure = useCallback(async (clientId: string): Promise<{
    success: boolean;
    content?: string;
  }> => {
    try {
      // Fetch client details
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (clientError || !client) {
        toast.error('Client non trouvé');
        return { success: false };
      }

      // Fetch overdue bons
      const { data: overdueBons, error: bonsError } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, date_livraison, volume_m3, prix_vente_m3')
        .eq('client_id', clientId)
        .eq('statut_paiement', 'Retard');

      if (bonsError) throw bonsError;

      // Calculate total amount due
      const totalDue = overdueBons?.reduce((sum, bon) => 
        sum + (bon.volume_m3 * (bon.prix_vente_m3 || 0)), 0) || client.solde_du || 0;

      // Generate formal notice content (Loi 32-10 Morocco)
      const today = format(new Date(), 'dd/MM/yyyy');
      const content = `
MISE EN DEMEURE DE PAIEMENT
(Conformément à la Loi n° 32-10 relative aux délais de paiement)

Date: ${today}

À l'attention de: ${client.nom_client}
${client.adresse || ''}
${client.email || ''}

Objet: Mise en demeure de paiement - Montant: ${totalDue.toLocaleString()} DH

Madame, Monsieur,

Par la présente, nous vous mettons en demeure de régler dans un délai de HUIT (8) jours 
à compter de la réception de ce courrier, la somme de ${totalDue.toLocaleString()} DH 
correspondant aux livraisons impayées suivantes:

${overdueBons?.map(bon => 
  `- BL ${bon.bl_id} du ${format(new Date(bon.date_livraison), 'dd/MM/yyyy')}: ${bon.volume_m3} m³ x ${bon.prix_vente_m3 || 0} DH`
).join('\n') || 'Voir détail des factures jointes'}

Conformément aux dispositions de la Loi n° 32-10 relative aux délais de paiement, 
nous nous réservons le droit d'appliquer des intérêts de retard au taux légal majoré.

À défaut de règlement dans le délai imparti, nous serons contraints d'engager toutes 
les procédures judiciaires nécessaires pour le recouvrement de notre créance.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

TALMI BETON
---
Référence: MED-${clientId}-${format(new Date(), 'yyyyMMdd')}
      `.trim();

      // Log the action
      await supabase.from('alertes_systeme').insert([{
        type_alerte: 'mise_en_demeure',
        niveau: 'info',
        titre: 'Mise en Demeure Générée',
        message: `Mise en demeure générée pour ${client.nom_client} - Montant: ${totalDue.toLocaleString()} DH`,
        reference_id: clientId,
        reference_table: 'clients',
        destinataire_role: 'ceo',
      }]);

      toast.success('Mise en demeure générée');
      return { success: true, content };
    } catch (error) {
      console.error('Error generating mise en demeure:', error);
      toast.error('Erreur lors de la génération');
      return { success: false };
    }
  }, []);

  return {
    checkPaymentDelays,
    blockClient,
    unblockClient,
    generateMiseEnDemeure,
  };
}
