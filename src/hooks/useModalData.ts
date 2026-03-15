import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DropdownOption { value: string; label: string; [key: string]: any; }

export function useClients() {
  const [clients, setClients] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('clients')
        .select('client_id, nom_client, segment, score_sante')
        .eq('statut', 'actif')
        .order('nom_client');
      if (data) {
        setClients(data.map(c => ({
          value: c.client_id,
          label: c.nom_client,
          segment: c.segment,
          score: c.score_sante,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { clients, loading };
}

export function useDeliveredBons() {
  const [bons, setBons] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, client_id, volume_m3, prix_vente_m3, formule_id, date_livraison, facture_generee')
        .in('workflow_status', ['livre', 'validation_technique'])
        .order('date_livraison', { ascending: false })
        .limit(50);

      if (data) {
        // Filter out already invoiced
        const available = data.filter(b => !b.facture_generee);
        // Fetch client names
        const clientIds = [...new Set(available.map(b => b.client_id))];
        const { data: clientRows } = await supabase
          .from('clients')
          .select('client_id, nom_client')
          .in('client_id', clientIds.length > 0 ? clientIds : ['__none__']);
        
        const clientMap: Record<string, string> = {};
        clientRows?.forEach(c => { clientMap[c.client_id] = c.nom_client; });

        setBons(available.map(b => ({
          value: b.bl_id,
          label: `${b.bl_id} — ${clientMap[b.client_id] || b.client_id} · ${b.volume_m3}m³`,
          client: clientMap[b.client_id] || b.client_id,
          clientId: b.client_id,
          montant: (b.volume_m3 || 0) * (b.prix_vente_m3 || 850),
          volume: b.volume_m3 || 0,
          prixM3: b.prix_vente_m3 || 850,
          formuleId: b.formule_id,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { bons, loading };
}

export function useTodayBatches() {
  const [batches, setBatches] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('production_batches')
        .select('batch_number, formule_id, volume_m3, status')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setBatches(data.map(b => ({
          value: b.batch_number,
          label: `${b.batch_number} — ${b.formule_id} · ${b.volume_m3}m³`,
          formule: b.formule_id,
          blId: `BL-${today.slice(2, 4)}${today.slice(5, 7)}-${b.batch_number.slice(-3)}`,
        })));
      } else {
        // Fallback to recent batches if none today
        const { data: recent } = await supabase
          .from('production_batches')
          .select('batch_number, formule_id, volume_m3, status')
          .order('created_at', { ascending: false })
          .limit(10);
        if (recent) {
          setBatches(recent.map(b => ({
            value: b.batch_number,
            label: `${b.batch_number} — ${b.formule_id} · ${b.volume_m3}m³`,
            formule: b.formule_id,
            blId: `BL-2603-${b.batch_number.slice(-3)}`,
          })));
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { batches, loading };
}
