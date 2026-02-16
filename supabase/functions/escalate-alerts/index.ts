import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Fetch active escalation configs
    const { data: configs, error: configErr } = await supabase
      .from("escalation_config")
      .select("*")
      .eq("is_active", true);

    if (configErr) throw configErr;
    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active escalation configs" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalEscalated = 0;

    for (const config of configs) {
      const delayMinutes = config.escalation_delay_minutes;
      const maxLevel = config.max_escalation_level;
      const targets: string[] = config.escalation_targets || ["ceo"];
      const cutoff = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();

      // 2. Find unread alerts of this niveau that haven't been fully escalated
      // and were created/last escalated more than delay_minutes ago
      const { data: alerts, error: alertErr } = await supabase
        .from("alertes_systeme")
        .select("*")
        .eq("niveau", config.niveau)
        .eq("lu", false)
        .lt("escalation_level", maxLevel)
        .or(`escalated_at.is.null,escalated_at.lt.${cutoff}`)
        .lt("created_at", cutoff)
        .limit(50);

      if (alertErr) {
        console.error(`Error fetching alerts for ${config.niveau}:`, alertErr);
        continue;
      }

      if (!alerts || alerts.length === 0) continue;

      for (const alert of alerts) {
        const newLevel = (alert.escalation_level || 0) + 1;
        const targetRole = targets[Math.min(newLevel - 1, targets.length - 1)];
        const now = new Date().toISOString();

        // Build escalation history entry
        const historyEntry = {
          level: newLevel,
          escalated_at: now,
          from_role: alert.destinataire_role || "system",
          to_role: targetRole,
          delay_minutes: delayMinutes,
        };

        const existingHistory = Array.isArray(alert.escalation_history)
          ? alert.escalation_history
          : [];

        // 3. Update the alert with new escalation level
        const { error: updateErr } = await supabase
          .from("alertes_systeme")
          .update({
            escalation_level: newLevel,
            escalated_at: now,
            original_destinataire_role:
              alert.original_destinataire_role || alert.destinataire_role,
            destinataire_role: targetRole,
            escalation_history: [...existingHistory, historyEntry],
          })
          .eq("id", alert.id);

        if (updateErr) {
          console.error(`Error escalating alert ${alert.id}:`, updateErr);
          continue;
        }

        // 4. Create a new escalation notification for the target
        const levelEmoji = newLevel >= 3 ? "🚨" : newLevel >= 2 ? "⚠️" : "🔔";
        await supabase.from("alertes_systeme").insert({
          type_alerte: "escalation",
          niveau: "critical",
          titre: `${levelEmoji} ESCALADE Niveau ${newLevel}: ${alert.titre}`,
          message: `Alerte non traitée depuis ${delayMinutes * newLevel} min. Origine: ${alert.original_destinataire_role || alert.destinataire_role || "système"}. ${alert.message}`,
          reference_id: alert.id,
          reference_table: "alertes_systeme",
          destinataire_role: targetRole,
          dismissible: false,
        });

        // 5. Log to audit
        await supabase.from("audit_superviseur").insert({
          action: "ALERT_ESCALATED",
          table_name: "alertes_systeme",
          record_id: alert.id,
          user_id: "system-escalation",
          user_name: "Auto-Escalation",
          new_data: {
            alert_id: alert.id,
            new_level: newLevel,
            target_role: targetRole,
            original_titre: alert.titre,
            delay_minutes: delayMinutes,
          },
        });

        totalEscalated++;
      }
    }

    console.log(`[escalate-alerts] Escalated ${totalEscalated} alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        escalated: totalEscalated,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[escalate-alerts] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
