import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * n8n Webhook: Smart Reorder Agent
 * n8n calls this when material stock drops below threshold.
 * Creates a purchase order and system alert in TBOS.
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
      material_name,
      current_stock_tons,
      daily_consumption_tons,
      days_remaining,
      recommended_order_tons,
      urgency = 'this_week',
      estimated_cost,
      reason,
      supplier_email,
    } = body;

    // 1. Create AI-generated purchase order
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        material_name,
        quantity_tons: recommended_order_tons,
        estimated_cost: estimated_cost || 0,
        current_stock_tons: current_stock_tons || 0,
        daily_consumption_tons: daily_consumption_tons || 0,
        days_remaining: days_remaining || 0,
        urgency,
        status: 'pending_approval',
        ai_generated: true,
        ai_reasoning: reason,
        supplier_email,
      })
      .select()
      .single();

    if (poError) console.error('PO insert error:', poError);

    // 2. Create system alert
    const niveau = urgency === 'immediate' ? 'critique' : urgency === 'this_week' ? 'haute' : 'moyenne';
    await supabase.from('alertes_systeme').insert({
      titre: `📦 Réapprovisionnement requis — ${material_name}`,
      message: `Stock ${material_name}: ${current_stock_tons}t (${days_remaining} jours restants). Commande recommandée: ${recommended_order_tons}t. ${reason || ''}`,
      niveau,
      type_alerte: 'stock',
      destinataire_role: 'superviseur',
      reference_id: po?.id || null,
      reference_table: 'purchase_orders',
    });

    console.log(`Purchase order created for ${material_name}, urgency: ${urgency}`);

    return new Response(
      JSON.stringify({ success: true, po_id: po?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('n8n-inventory-alert error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
