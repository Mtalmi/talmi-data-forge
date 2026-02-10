import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LinkCandidate {
  bl_id: string;
  confidence: number;
  scores: { date: number; client: number; volume: number; formula: number };
}

function fuzzyMatch(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = normalize(a);
  const nb = normalize(b);
  return na.includes(nb) || nb.includes(na);
}

async function autoLinkBatchToBL(
  supabase: ReturnType<typeof createClient>,
  batchId: string
): Promise<{ linked: boolean; confidence: number; bl_id?: string; candidates: LinkCandidate[] }> {
  // 1. Get batch data
  const { data: batch, error: batchErr } = await supabase
    .from("ws7_batches")
    .select("*")
    .eq("id", batchId)
    .single();

  if (batchErr || !batch) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  const batchTime = new Date(batch.batch_datetime);
  const twoHoursBefore = new Date(batchTime.getTime() - 2 * 60 * 60 * 1000);
  const twoHoursAfter = new Date(batchTime.getTime() + 2 * 60 * 60 * 1000);
  const batchDate = batchTime.toISOString().split("T")[0];

  // 2. Find candidate BLs on same day
  const { data: bls } = await supabase
    .from("bons_livraison_reels")
    .select("bl_id, client_id, formule_id, volume_m3, date_livraison, heure_depart_centrale, heure_prevue, created_at, clients!inner(nom)")
    .eq("date_livraison", batchDate)
    .limit(100);

  if (!bls || bls.length === 0) {
    // Update batch as no_match
    await supabase.from("ws7_batches").update({
      link_status: "no_match", link_confidence: 0, linked_bl_id: null,
    }).eq("id", batchId);

    return { linked: false, confidence: 0, candidates: [] };
  }

  const candidates: LinkCandidate[] = [];

  for (const bl of bls) {
    const scores = { date: 0, client: 0, volume: 0, formula: 0 };

    // Date/time match: 25 points (±2 hours)
    const blTimeStr = (bl as any).heure_depart_centrale || (bl as any).heure_prevue || null;
    if (blTimeStr) {
      const blFullTime = new Date(`${batchDate}T${blTimeStr}`);
      if (!isNaN(blFullTime.getTime()) && blFullTime >= twoHoursBefore && blFullTime <= twoHoursAfter) {
        const diffMinutes = Math.abs(batchTime.getTime() - blFullTime.getTime()) / 60000;
        if (diffMinutes <= 30) scores.date = 25;
        else if (diffMinutes <= 60) scores.date = 20;
        else scores.date = 15;
      }
    } else {
      scores.date = 10; // Same day, no time info
    }

    // Client match: 35 points (fuzzy, case-insensitive)
    const clientName = (bl as any).clients?.nom || "";
    if (clientName && batch.client_name) {
      const exactNorm = (s: string) => s.toLowerCase().trim();
      if (exactNorm(clientName) === exactNorm(batch.client_name)) {
        scores.client = 35;
      } else if (fuzzyMatch(clientName, batch.client_name)) {
        scores.client = 25;
      }
    }

    // Volume match: 25 points (±10%)
    if (batch.total_volume_m3 > 0 && bl.volume_m3 > 0) {
      const pctDiff = Math.abs(bl.volume_m3 - batch.total_volume_m3) / batch.total_volume_m3;
      if (pctDiff <= 0.02) scores.volume = 25;
      else if (pctDiff <= 0.05) scores.volume = 20;
      else if (pctDiff <= 0.10) scores.volume = 15;
    }

    // Formula match: 15 points
    const blFormula = (bl.formule_id || "").toLowerCase();
    const batchFormula = batch.formula.toLowerCase();
    if (blFormula === batchFormula || blFormula.includes(batchFormula) || batchFormula.includes(blFormula)) {
      scores.formula = 15;
    }

    const confidence = scores.date + scores.client + scores.volume + scores.formula;
    candidates.push({ bl_id: bl.bl_id, confidence, scores });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0];

  // 4/5/6. Apply thresholds and update batch
  if (best && best.confidence >= 90) {
    await supabase.from("ws7_batches").update({
      linked_bl_id: best.bl_id,
      link_confidence: best.confidence,
      link_status: "auto_linked",
    }).eq("id", batchId);

    return { linked: true, confidence: best.confidence, bl_id: best.bl_id, candidates: candidates.slice(0, 5) };
  }

  if (best && best.confidence >= 70) {
    await supabase.from("ws7_batches").update({
      linked_bl_id: best.bl_id,
      link_confidence: best.confidence,
      link_status: "pending", // Flag for manual review
    }).eq("id", batchId);

    return { linked: false, confidence: best.confidence, bl_id: best.bl_id, candidates: candidates.slice(0, 5) };
  }

  await supabase.from("ws7_batches").update({
    link_status: "no_match",
    link_confidence: best?.confidence || 0,
    linked_bl_id: null,
  }).eq("id", batchId);

  return { linked: false, confidence: best?.confidence || 0, candidates: candidates.slice(0, 5) };
}

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

    const { batch_id } = await req.json();

    if (!batch_id) {
      return new Response(JSON.stringify({ error: "batch_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await autoLinkBatchToBL(supabase, batch_id);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
