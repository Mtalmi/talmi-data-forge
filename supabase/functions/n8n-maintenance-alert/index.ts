import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * n8n Webhook: Predictive Maintenance Agent
 * n8n calls this every 4h with AI-analyzed equipment predictions.
 * Creates maintenance work orders and alerts in TBOS.
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
      equipment_id,
      equipment_name,
      plant_name,
      risk_level = 'medium',
      failure_type,
      predicted_failure_days,
      confidence_percent,
      recommended_action,
      parts_needed = [],
      estimated_repair_cost,
      warning_signs = [],
      ai_analysis,
    } = body;

    // 1. Create maintenance work order
    const { data: order, error: orderError } = await supabase
      .from('maintenance_orders')
      .insert({
        equipment_id,
        equipment_name: equipment_name || equipment_id,
        plant_name: plant_name || 'Atlas Concrete Morocco',
        risk_level,
        failure_type,
        predicted_failure_days,
        confidence_percent,
        recommended_action,
        parts_needed: Array.isArray(parts_needed) ? parts_needed : [parts_needed],
        estimated_cost: estimated_repair_cost || 0,
        ai_generated: true,
        ai_analysis,
        warning_signs: Array.isArray(warning_signs) ? warning_signs : [warning_signs],
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) console.error('Maintenance order insert error:', orderError);

    // 2. Create alert for critical/high risk
    if (risk_level === 'critical' || risk_level === 'high') {
      const niveau = risk_level === 'critical' ? 'critique' : 'haute';
      await supabase.from('alertes_systeme').insert({
        titre: `🔧 Alerte Maintenance — ${equipment_name || equipment_id} [${risk_level.toUpperCase()}]`,
        message: `Défaillance prévue dans ${predicted_failure_days} jours (confiance: ${confidence_percent}%). Type: ${failure_type}. Action: ${recommended_action}`,
        niveau,
        type_alerte: 'maintenance',
        destinataire_role: 'resp_technique',
        reference_id: order?.id || null,
        reference_table: 'maintenance_orders',
      });
    }

    console.log(`Maintenance order created for ${equipment_name}, risk: ${risk_level}`);

    return new Response(
      JSON.stringify({ success: true, order_id: order?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('n8n-maintenance-alert error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
