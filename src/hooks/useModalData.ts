import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMoroccoToday } from '@/utils/timezone';

interface DropdownOption { value: string; label: string; [key: string]: any; }

async function queryTable(table: string, select: string, filters?: Record<string, any>, order?: string, limit?: number) {
  let q = (supabase as any).from(table).select(select);
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      if (Array.isArray(v)) q = q.in(k, v);
      else q = q.eq(k, v);
    }
  }
  if (order) q = q.order(order, { ascending: order !== 'created_at' });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) console.error(`Query ${table} error:`, error);
  return (data || []) as any[];
}

export function useClients() {
  const [clients, setClients] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await queryTable('clients', 'client_id, nom_client, segment, score_sante', { statut: 'actif' }, 'nom_client');
      setClients(data.map(c => ({
        value: c.client_id,
        label: c.nom_client,
        segment: c.segment,
        score: c.score_sante,
      })));
      setLoading(false);
    })();
  }, []);

  return { clients, loading };
}

export function useDeliveredBons() {
  const [bons, setBons] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('bons_livraison_reels')
        .select('bl_id, client_id, volume_m3, prix_vente_m3, formule_id, date_livraison, facture_generee')
        .in('workflow_status', ['livre', 'validation_technique'])
        .order('date_livraison', { ascending: false })
        .limit(50);

      const rows = (data || []) as any[];
      const available = rows.filter((b: any) => !b.facture_generee);
      const clientIds = [...new Set(available.map((b: any) => b.client_id))];
      
      let clientMap: Record<string, string> = {};
      if (clientIds.length > 0) {
        const clientRows = await queryTable('clients', 'client_id, nom_client');
        clientRows.forEach(c => { clientMap[c.client_id] = c.nom_client; });
      }

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
      setLoading(false);
    })();
  }, []);

  return { bons, loading };
}

export function useTodayBatches() {
  const [batches, setBatches] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = getMoroccoToday();
      const { data } = await (supabase as any)
        .from('production_batches')
        .select('batch_number, formule, volume_m3, status, bl_id')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(20);

      let rows = (data || []) as any[];
      if (rows.length === 0) {
        const { data: recent } = await (supabase as any)
          .from('production_batches')
          .select('batch_number, formule, volume_m3, status, bl_id')
          .order('created_at', { ascending: false })
          .limit(10);
        rows = (recent || []) as any[];
      }

      setBatches(rows.map((b: any) => ({
        value: `BN-${String(b.batch_number).padStart(4, '0')}`,
        label: `BN-${String(b.batch_number).padStart(4, '0')} — ${b.formule || 'F-B25'} · ${b.volume_m3}m³`,
        formule: b.formule || 'F-B25',
        blId: b.bl_id || `BL-2603-${String(b.batch_number).slice(-3)}`,
      })));
      setLoading(false);
    })();
  }, []);

  return { batches, loading };
}
