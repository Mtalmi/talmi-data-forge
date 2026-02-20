import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * n8n Webhook: Delivery Orchestrator Agent
 * n8n calls this when a delivery is created, delayed, or completed.
 * Stores AI route instructions back into the BL record and creates alerts.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = await req.json();
    const {
      event_type,       // 'delivery_created' | 'delivery_delayed' | 'delivery_completed'
      delivery_id,      // bl_id in bons_livraison_reels
      bl_id,
      ai_route_instructions,
      delay_minutes,
      new_eta,
      customer_name,
      ai_delay_message,
    } = body;

    const targetBlId = bl_id || delivery_id;

    if (event_type === 'delivery_created' && ai_route_instructions && targetBlId) {
      // Update BL with AI route instructions (stored in notes for now)
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({
          justification_ecart: ai_route_instructions.slice(0, 1000),
        })
        .eq('bl_id', targetBlId);

      if (error) console.error('BL update error:', error);
    }

    if (event_type === 'delivery_delayed') {
      // Create delay alert
      await supabase.from('alertes_systeme').insert({
        titre: `🚛 Livraison retardée — ${customer_name || 'Client'}`,
        message: ai_delay_message
          ? ai_delay_message
          : `Livraison ${targetBlId} retardée de ${delay_minutes || '?'} min. Nouveau ETA: ${new_eta || 'N/A'}.`,
        niveau: 'haute',
        type_alerte: 'logistique',
        destinataire_role: 'agent_admin',
        reference_id: targetBlId,
        reference_table: 'bons_livraison_reels',
      });
    }

    console.log(`Delivery event processed: ${event_type} for BL ${targetBlId}`);

    return new Response(
      JSON.stringify({ success: true, event_type, bl_id: targetBlId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('n8n-delivery-event error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
