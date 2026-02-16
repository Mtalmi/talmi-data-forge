import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const n8nWebhookUrl = Deno.env.get("N8N_ORCHESTRATOR_WEBHOOK_URL");

  if (!n8nWebhookUrl) {
    return new Response(
      JSON.stringify({ error: "N8N_ORCHESTRATOR_WEBHOOK_URL not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const {
      task_type,     // e.g. "compliance", "quality", "security", "maintenance", "supply_chain", "marketing"
      payload,       // data to send to n8n
      triggered_by,  // user name or "system"
      severity = "medium",
    } = body;

    if (!task_type || !payload) {
      return new Response(
        JSON.stringify({ error: "task_type and payload are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const runId = crypto.randomUUID();

    // 1. Insert pending record
    const { error: dbError } = await supabase
      .from("n8n_workflow_results")
      .insert({
        workflow_run_id: runId,
        agent_type: task_type,
        status: "pending",
        request_payload: payload,
        severity,
        triggered_by: triggered_by || "system",
      });

    if (dbError) {
      console.error("DB insert error:", dbError);
      throw new Error("Failed to create workflow record");
    }

    // 2. Forward to n8n Master Orchestrator
    const n8nPayload = {
      run_id: runId,
      task_type,
      payload,
      severity,
      triggered_by: triggered_by || "system",
      callback_url: `${supabaseUrl}/functions/v1/n8n-orchestrator`,
      timestamp: new Date().toISOString(),
    };

    const n8nResp = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResp.ok) {
      const errText = await n8nResp.text();
      console.error("n8n error:", n8nResp.status, errText);

      await supabase
        .from("n8n_workflow_results")
        .update({ status: "failed", response_payload: { error: errText } })
        .eq("workflow_run_id", runId);

      throw new Error(`n8n responded with ${n8nResp.status}`);
    }

    // 3. Update status to processing
    await supabase
      .from("n8n_workflow_results")
      .update({ status: "processing" })
      .eq("workflow_run_id", runId);

    // 4. Check if n8n returned a synchronous response
    let n8nResult = null;
    try {
      n8nResult = await n8nResp.json();
    } catch {
      // n8n may return empty body for async workflows
    }

    if (n8nResult && (n8nResult.result || n8nResult.status === "completed")) {
      await supabase
        .from("n8n_workflow_results")
        .update({
          status: "completed",
          response_payload: n8nResult,
          completed_at: new Date().toISOString(),
        })
        .eq("workflow_run_id", runId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        status: n8nResult?.status === "completed" ? "completed" : "processing",
        result: n8nResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("n8n-orchestrator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
