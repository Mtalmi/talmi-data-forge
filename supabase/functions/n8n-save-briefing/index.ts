import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * n8n Webhook: AI Briefing Receiver
 * Used by Workflow 1 (Morning Brief) and Workflow 5 (End-of-Day Report).
 * n8n calls this to save AI-generated briefings to TBOS database.
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
      type = 'morning_briefing', // 'morning_briefing' | 'end_of_day_report'
      content,
      date,
      plant_name = 'Atlas Concrete Morocco',
    } = body;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data, error } = await supabase
      .from('ai_briefings')
      .insert({
        date: date || new Date().toISOString().split('T')[0],
        type,
        content,
        plant_name,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Briefing saved: ${type} for ${date || 'today'}`);

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('n8n-save-briefing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
