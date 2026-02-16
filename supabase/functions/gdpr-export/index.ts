import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    // Collect all user data across tables
    const exportData: Record<string, unknown> = {
      export_date: new Date().toISOString(),
      user_id: userId,
      email: userEmail,
    };

    // Profile data
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    exportData.profile = profile;

    // Audit logs created by user
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("action_type, table_name, description, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    exportData.audit_logs = auditLogs;

    // Approval actions by user
    const { data: approvals } = await supabase
      .from("approbations_ceo")
      .select("type_approbation, statut, montant, demande_at, approuve_at")
      .eq("demande_par", userId)
      .limit(200);
    exportData.approval_requests = approvals;

    // Training progress
    const { data: training } = await supabase
      .from("user_training_progress")
      .select("*")
      .eq("user_id", userId);
    exportData.training_progress = training;

    // Certifications
    const { data: certs } = await supabase
      .from("user_certifications")
      .select("*")
      .eq("user_id", userId);
    exportData.certifications = certs;

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gdpr-export-${userId}.json"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
