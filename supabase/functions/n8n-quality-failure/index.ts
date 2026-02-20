import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * n8n Webhook: Quality Failure Agent
 * n8n calls this endpoint when a quality test fails.
 * TBOS stores the AI analysis in quality_failure_tickets and alertes_systeme.
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

    // n8n sends back the AI analysis result after processing
    const {
      batch_id,
      plant_name,
      mix_type,
      slump,
      slump_target,
      temperature,
      air_content,
      ai_analysis,
      severity = 'high',
      hold_decision = false,
    } = body;

    // 1. Store quality failure ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('quality_failure_tickets')
      .insert({
        batch_id,
        plant_name: plant_name || 'Atlas Concrete Morocco',
        mix_type,
        slump_value: slump,
        slump_target,
        temperature,
        air_content,
        severity,
        ai_analysis,
        hold_decision,
        status: 'open',
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Failed to insert quality ticket:', ticketError);
    }

    // 2. Create system alert
    const niveau = severity === 'critical' ? 'critique' : severity === 'high' ? 'haute' : 'moyenne';
    await supabase.from('alertes_systeme').insert({
      titre: `🧪 Échec Qualité — Batch ${batch_id} — ${mix_type}`,
      message: ai_analysis
        ? ai_analysis.slice(0, 500)
        : `Échec de contrôle qualité sur batch ${batch_id}. Affaissement: ${slump}mm (cible: ${slump_target}mm).`,
      niveau,
      type_alerte: 'qualite',
      destinataire_role: 'superviseur',
      reference_id: ticket?.id || null,
      reference_table: 'quality_failure_tickets',
    });

    console.log(`Quality failure ticket created for batch ${batch_id}, severity: ${severity}`);

    return new Response(
      JSON.stringify({ success: true, ticket_id: ticket?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('n8n-quality-failure error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
