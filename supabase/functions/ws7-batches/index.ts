import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const linkStatus = url.searchParams.get("link_status");
    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("ws7_batches")
      .select("*", { count: "exact" })
      .order("batch_datetime", { ascending: false })
      .range(offset, offset + limit - 1);

    if (linkStatus) {
      query = query.eq("link_status", linkStatus);
    }
    if (dateFrom) {
      query = query.gte("batch_datetime", dateFrom);
    }
    if (dateTo) {
      query = query.lte("batch_datetime", dateTo + "T23:59:59");
    }

    const { data: batches, error, count } = await query;

    if (error) throw error;

    // Fetch linked BL details for linked batches
    const linkedBlIds = (batches || [])
      .filter((b: any) => b.linked_bl_id)
      .map((b: any) => b.linked_bl_id);

    let blDetails: Record<string, any> = {};
    if (linkedBlIds.length > 0) {
      const { data: bls } = await supabase
        .from("bons_livraison_reels")
        .select("bl_id, client_id, formule_id, volume_m3, date_livraison, statut_paiement, camion_assigne, chauffeur_nom")
        .in("bl_id", linkedBlIds);

      if (bls) {
        for (const bl of bls) {
          blDetails[bl.bl_id] = bl;
        }
      }
    }

    const enrichedBatches = (batches || []).map((batch: any) => ({
      ...batch,
      linked_bl: batch.linked_bl_id ? blDetails[batch.linked_bl_id] || null : null,
    }));

    return new Response(JSON.stringify({
      data: enrichedBatches,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
