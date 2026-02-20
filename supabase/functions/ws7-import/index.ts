import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CSVRow {
  BatchNumber: string;
  DateTime: string;
  Client: string;
  Formula: string;
  Cement: string;
  Sand: string;
  Gravel: string;
  Water: string;
  Additives: string;
  TotalVolume: string;
  Operator: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });
      rows.push(row);
    }
  }
  return { headers, rows };
}

function validateRow(row: Record<string, string>, index: number): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const required = ["BatchNumber", "DateTime", "Client", "Formula", "Cement", "Sand", "Gravel", "Water", "Additives", "TotalVolume", "Operator"];

  for (const field of required) {
    if (!row[field]?.trim()) {
      errors.push({ row: index, field, message: `${field} is required` });
    }
  }

  const numerics = ["Cement", "Sand", "Gravel", "Water", "Additives", "TotalVolume"];
  for (const field of numerics) {
    if (row[field] && isNaN(parseFloat(row[field]))) {
      errors.push({ row: index, field, message: `${field} must be a number` });
    }
  }

  // Validate DateTime
  if (row["DateTime"] && isNaN(new Date(row["DateTime"]).getTime())) {
    errors.push({ row: index, field: "DateTime", message: "Invalid datetime format" });
  }

  return { valid: errors.length === 0, errors };
}

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

async function autoLinkBatch(
  supabase: ReturnType<typeof createClient>,
  batch: { client_name: string; batch_datetime: string; formula: string; total_volume_m3: number }
): Promise<{ linked_bl_id: string | null; link_confidence: number; link_status: string; candidates: LinkCandidate[] }> {
  const batchTime = new Date(batch.batch_datetime.replace(" ", "T"));
  const twoHoursBefore = new Date(batchTime.getTime() - 2 * 60 * 60 * 1000);
  const twoHoursAfter = new Date(batchTime.getTime() + 2 * 60 * 60 * 1000);
  const batchDate = batchTime.toISOString().split("T")[0];

  // Query BLs on same day with client info
  const { data: bls } = await supabase
    .from("bons_livraison_reels")
    .select("bl_id, client_id, formule_id, volume_m3, date_livraison, heure_depart_centrale, heure_prevue, created_at, clients!inner(nom)")
    .eq("date_livraison", batchDate)
    .limit(100);

  if (!bls || bls.length === 0) {
    return { linked_bl_id: null, link_confidence: 0, link_status: "no_match", candidates: [] };
  }

  const candidates: LinkCandidate[] = [];

  for (const bl of bls) {
    const scores = { date: 0, client: 0, volume: 0, formula: 0 };

    // --- Date/time match: 25 points ---
    // Use heure_depart_centrale or heure_prevue or created_at for time comparison
    const blTimeStr = (bl as any).heure_depart_centrale || (bl as any).heure_prevue || null;
    if (blTimeStr) {
      const blFullTime = new Date(`${batchDate}T${blTimeStr}`);
      if (!isNaN(blFullTime.getTime()) && blFullTime >= twoHoursBefore && blFullTime <= twoHoursAfter) {
        // Closer = more points
        const diffMs = Math.abs(batchTime.getTime() - blFullTime.getTime());
        const diffMinutes = diffMs / 60000;
        if (diffMinutes <= 30) scores.date = 25;
        else if (diffMinutes <= 60) scores.date = 20;
        else scores.date = 15;
      }
    } else {
      // Same day but no time info — partial credit
      scores.date = 10;
    }

    // --- Client match: 35 points ---
    const clientName = (bl as any).clients?.nom || "";
    if (clientName && batch.client_name) {
      const exactNorm = (s: string) => s.toLowerCase().trim();
      if (exactNorm(clientName) === exactNorm(batch.client_name)) {
        scores.client = 35;
      } else if (fuzzyMatch(clientName, batch.client_name)) {
        scores.client = 25;
      }
    }

    // --- Volume match: 25 points ---
    if (batch.total_volume_m3 > 0 && bl.volume_m3 > 0) {
      const pctDiff = Math.abs(bl.volume_m3 - batch.total_volume_m3) / batch.total_volume_m3;
      if (pctDiff <= 0.02) scores.volume = 25;
      else if (pctDiff <= 0.05) scores.volume = 20;
      else if (pctDiff <= 0.10) scores.volume = 15;
    }

    // --- Formula match: 15 points ---
    const blFormula = (bl.formule_id || "").toLowerCase();
    const batchFormula = batch.formula.toLowerCase();
    if (blFormula === batchFormula || blFormula.includes(batchFormula) || batchFormula.includes(blFormula)) {
      scores.formula = 15;
    }

    const confidence = scores.date + scores.client + scores.volume + scores.formula;
    candidates.push({ bl_id: bl.bl_id, confidence, scores });
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0];

  if (!best || best.confidence < 70) {
    return { linked_bl_id: null, link_confidence: best?.confidence || 0, link_status: "no_match", candidates: candidates.slice(0, 5) };
  }

  if (best.confidence >= 90) {
    return { linked_bl_id: best.bl_id, link_confidence: best.confidence, link_status: "auto_linked", candidates: candidates.slice(0, 5) };
  }

  // 70-89: pending manual review
  return { linked_bl_id: best.bl_id, link_confidence: best.confidence, link_status: "pending", candidates: candidates.slice(0, 5) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      ).auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id || null;
    }

    const contentType = req.headers.get("content-type") || "";
    let csvText = "";
    let filename = "upload.csv";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      csvText = await file.text();
      filename = file.name;
    } else {
      const body = await req.json();
      csvText = body.csv_content || "";
      filename = body.filename || "upload.csv";
    }

    if (!csvText.trim()) {
      return new Response(JSON.stringify({ error: "Empty CSV content" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rows } = parseCSV(csvText);
    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "No valid rows found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let successCount = 0;
    let failedCount = 0;
    let linkedCount = 0;
    const allErrors: ValidationError[] = [];
    const insertedIds: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const { valid, errors } = validateRow(row, i + 1);

      if (!valid) {
        failedCount++;
        allErrors.push(...errors);
        continue;
      }

      const batchData = {
        batch_number: row.BatchNumber,
        batch_datetime: row.DateTime.replace(" ", "T"),
        client_name: row.Client,
        formula: row.Formula,
        cement_kg: parseFloat(row.Cement),
        sand_kg: parseFloat(row.Sand),
        gravel_kg: parseFloat(row.Gravel),
        water_liters: parseFloat(row.Water),
        additives_liters: parseFloat(row.Additives),
        total_volume_m3: parseFloat(row.TotalVolume),
        operator_name: row.Operator,
        raw_data: row,
      };

      // Auto-link
      const linkResult = await autoLinkBatch(supabase, batchData);

      const { data, error } = await supabase.from("ws7_batches").insert({
        ...batchData,
        linked_bl_id: linkResult.linked_bl_id,
        link_confidence: linkResult.link_confidence,
        link_status: linkResult.link_status,
      }).select("id").single();

      if (error) {
        failedCount++;
        allErrors.push({ row: i + 1, field: "database", message: error.message });
      } else {
        successCount++;
        insertedIds.push(data.id);
        if (linkResult.link_status === "auto_linked") linkedCount++;
      }
    }

    // Log the import
    await supabase.from("ws7_import_log").insert({
      filename,
      rows_imported: successCount,
      rows_failed: failedCount,
      errors: allErrors.length > 0 ? allErrors : null,
      imported_by: userId,
    });

    return new Response(JSON.stringify({
      success: true,
      summary: {
        total_rows: rows.length,
        imported: successCount,
        failed: failedCount,
        auto_linked: linkedCount,
        pending_link: successCount - linkedCount,
      },
      inserted_ids: insertedIds,
      errors: allErrors,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
