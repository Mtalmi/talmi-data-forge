import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const N8N_WEBHOOK_URL = Deno.env.get('N8N_WHATSAPP_WEBHOOK_URL');
    if (!N8N_WEBHOOK_URL) {
      console.error('N8N_WHATSAPP_WEBHOOK_URL secret not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json();

    // Payload: either called directly with alert data, or via database webhook
    const alert = body.record || body;

    const payload = {
      type: 'tbos_alert',
      alert_id: alert.id,
      titre: alert.titre,
      message: alert.message,
      niveau: alert.niveau,
      type_alerte: alert.type_alerte,
      destinataire_role: alert.destinataire_role,
      reference_id: alert.reference_id,
      reference_table: alert.reference_table,
      created_at: alert.created_at,
    };

    console.log('Forwarding alert to n8n:', payload.alert_id, payload.niveau);

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      const errText = await n8nResponse.text();
      console.error(`n8n webhook failed [${n8nResponse.status}]:`, errText);
      return new Response(
        JSON.stringify({ success: false, error: `n8n returned ${n8nResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Consume response
    await n8nResponse.text();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in notify-whatsapp-n8n:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
