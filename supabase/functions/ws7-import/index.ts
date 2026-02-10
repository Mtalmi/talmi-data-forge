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

async function autoLinkBatch(
  supabase: ReturnType<typeof createClient>,
  batch: { client_name: string; batch_datetime: string; formula: string; total_volume_m3: number }
): Promise<{ linked_bl_id: string | null; link_confidence: number; link_status: string }> {
  // Find matching BLs by client name, date, and formula
  const batchDate = batch.batch_datetime.split("T")[0] || batch.batch_datetime.split(" ")[0];

  const { data: bls } = await supabase
    .from("bons_livraison_reels")
    .select("bl_id, client_id, formule_id, volume_m3, date_livraison, clients!inner(nom)")
    .eq("date_livraison", batchDate)
    .limit(50);

  if (!bls || bls.length === 0) {
    return { linked_bl_id: null, link_confidence: 0, link_status: "no_match" };
  }

  let bestMatch: { bl_id: string; confidence: number } | null = null;

  for (const bl of bls) {
    let confidence = 0;
    const clientName = (bl as any).clients?.nom || "";

    // Client name match (fuzzy)
    if (clientName.toLowerCase().includes(batch.client_name.toLowerCase()) ||
        batch.client_name.toLowerCase().includes(clientName.toLowerCase())) {
      confidence += 40;
    }

    // Volume match (within 10%)
    const volumeDiff = Math.abs(bl.volume_m3 - batch.total_volume_m3) / batch.total_volume_m3;
    if (volumeDiff <= 0.05) confidence += 30;
    else if (volumeDiff <= 0.1) confidence += 20;
    else if (volumeDiff <= 0.2) confidence += 10;

    // Formula match
    if (bl.formule_id?.toLowerCase().includes(batch.formula.toLowerCase())) {
      confidence += 30;
    }

    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { bl_id: bl.bl_id, confidence };
    }
  }

  if (bestMatch && bestMatch.confidence >= 60) {
    return { linked_bl_id: bestMatch.bl_id, link_confidence: bestMatch.confidence, link_status: "auto_linked" };
  }

  return {
    linked_bl_id: bestMatch?.bl_id || null,
    link_confidence: bestMatch?.confidence || 0,
    link_status: "pending",
  };
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
