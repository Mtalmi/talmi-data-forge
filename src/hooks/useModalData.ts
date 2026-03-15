import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DropdownOption { value: string; label: string; [key: string]: any; }

export function useClients() {
  const [clients, setClients] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase
        .from('clients')
        .select('client_id, nom_client, segment, score_sante')
        .eq('statut', 'actif')
        .order('nom_client') as any);
      if (data) {
        setClients(data.map((c: any) => ({
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
        .limit(50) as any;

      if (data) {
        const available = (data as any[]).filter((b: any) => !b.facture_generee);
        const clientIds = [...new Set(available.map((b: any) => b.client_id))];
        const { data: clientRows } = await supabase
          .from('clients')
          .select('client_id, nom_client')
          .in('client_id', clientIds.length > 0 ? clientIds : ['__none__']) as any;
        
        const clientMap: Record<string, string> = {};
        (clientRows as any[] || []).forEach((c: any) => { clientMap[c.client_id] = c.nom_client; });

        setBons(available.map((b: any) => ({
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
        .select('batch_number, formule, volume_m3, status, bl_id')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(20) as any;

      const rows = (data as any[] || []);
      if (rows.length > 0) {
        setBatches(rows.map((b: any) => ({
          value: `BN-${String(b.batch_number).padStart(4, '0')}`,
          label: `BN-${String(b.batch_number).padStart(4, '0')} — ${b.formule || 'F-B25'} · ${b.volume_m3}m³`,
          formule: b.formule || 'F-B25',
          blId: b.bl_id || `BL-2603-${String(b.batch_number).slice(-3)}`,
        })));
      } else {
        // Fallback to recent batches
        const { data: recent } = await supabase
          .from('production_batches')
          .select('batch_number, formule, volume_m3, status, bl_id')
          .order('created_at', { ascending: false })
          .limit(10) as any;
        if (recent) {
          setBatches((recent as any[]).map((b: any) => ({
            value: `BN-${String(b.batch_number).padStart(4, '0')}`,
            label: `BN-${String(b.batch_number).padStart(4, '0')} — ${b.formule || 'F-B25'} · ${b.volume_m3}m³`,
            formule: b.formule || 'F-B25',
            blId: b.bl_id || `BL-2603-${String(b.batch_number).slice(-3)}`,
          })));
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { batches, loading };
}
