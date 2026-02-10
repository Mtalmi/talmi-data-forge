import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { batch_id, bl_id } = await req.json();

    if (!batch_id || !bl_id) {
      return new Response(JSON.stringify({ error: "batch_id and bl_id are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify batch exists
    const { data: batch, error: batchErr } = await supabase
      .from("ws7_batches")
      .select("id")
      .eq("id", batch_id)
      .single();

    if (batchErr || !batch) {
      return new Response(JSON.stringify({ error: "Batch not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify BL exists
    const { data: bl, error: blErr } = await supabase
      .from("bons_livraison_reels")
      .select("bl_id")
      .eq("bl_id", bl_id)
      .single();

    if (blErr || !bl) {
      return new Response(JSON.stringify({ error: "BL not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update batch with manual link
    const { data: updated, error: updateErr } = await supabase
      .from("ws7_batches")
      .update({
        linked_bl_id: bl_id,
        link_status: "manual_linked",
        link_confidence: 100,
      })
      .eq("id", batch_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, data: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
