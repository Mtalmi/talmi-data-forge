import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range (last 24 hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch audit logs from the last 24 hours
    const { data: auditLogs, error: logsError } = await supabase
      .from("audit_superviseur")
      .select("*")
      .gte("created_at", yesterday.toISOString())
      .order("created_at", { ascending: false });

    if (logsError) {
      throw new Error(`Failed to fetch audit logs: ${logsError.message}`);
    }

    const logs = (auditLogs || []) as AuditLog[];

    // Categorize events
    const rollbacks = logs.filter((l) => l.action === "ROLLBACK_APPROVAL");
    const blockedActions = logs.filter((l) => l.action === "ACCESS_DENIED");
    const stockEvents = logs.filter((l) => l.action === "STOCK_FINALIZED");
    const approvals = logs.filter((l) => l.action === "APPROVE_DEVIS");

    // Calculate daily risk indicator
    const riskScore = rollbacks.length * 10 + blockedActions.length * 5;
    const riskLevel = riskScore >= 20 ? "ALERTE" : riskScore >= 5 ? "ATTENTION" : "NORMAL";
    const riskColor = riskScore >= 20 ? "#dc2626" : riskScore >= 5 ? "#f59e0b" : "#10b981";
    const riskEmoji = riskScore >= 20 ? "🚨" : riskScore >= 5 ? "⚠️" : "✅";

    // Format date
    const reportDate = now.toLocaleDateString("fr-FR", { dateStyle: "full" });
    const periodStart = yesterday.toLocaleTimeString("fr-FR", { timeStyle: "short" });
    const periodEnd = now.toLocaleTimeString("fr-FR", { timeStyle: "short" });

    // Build event summary list
    const buildEventRow = (log: AuditLog, color: string) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
          ${new Date(log.created_at).toLocaleTimeString("fr-FR", { timeStyle: "short" })}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
            ${log.action.replace(/_/g, " ")}
          </span>
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
          ${log.user_name || "Inconnu"}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-family: monospace; color: #64748b;">
          ${log.record_id || "-"}
        </td>
      </tr>
    `;

    const criticalEvents = [...rollbacks, ...blockedActions];
    const eventRows = criticalEvents.length > 0
      ? criticalEvents.slice(0, 15).map((log) => {
          const color = log.action === "ROLLBACK_APPROVAL" ? "#dc2626" : "#f59e0b";
          return buildEventRow(log, color);
        }).join("")
      : `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #10b981; font-size: 14px;">
          ${riskEmoji} Aucun incident critique dans les dernières 24h
        </td></tr>`;

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Résumé Sécurité Quotidien</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.5; color: #1a1a1a; margin: 0; padding: 0; background: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a5f, #0f172a); color: white; padding: 25px 20px; text-align: center;">
            <h1 style="margin: 0 0 5px; font-size: 20px;">🔐 RÉSUMÉ SÉCURITÉ QUOTIDIEN</h1>
            <p style="margin: 0; opacity: 0.8; font-size: 13px;">${reportDate}</p>
            <p style="margin: 8px 0 0; opacity: 0.7; font-size: 11px;">Période: ${periodStart} → ${periodEnd}</p>
          </div>
          
          <!-- Risk Banner -->
          <div style="background: ${riskColor}10; border-bottom: 3px solid ${riskColor}; padding: 20px; text-align: center;">
            <div style="font-size: 36px; margin-bottom: 5px;">${riskEmoji}</div>
            <div style="font-size: 14px; font-weight: 700; color: ${riskColor}; letter-spacing: 1px;">
              STATUT: ${riskLevel}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">
              Score de risque: ${riskScore} points
            </div>
          </div>
          
          <!-- Quick Stats -->
          <div style="display: flex; padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <div style="flex: 1; text-align: center; border-right: 1px solid #e2e8f0;">
              <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${rollbacks.length}</div>
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Rollbacks</div>
            </div>
            <div style="flex: 1; text-align: center; border-right: 1px solid #e2e8f0;">
              <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${blockedActions.length}</div>
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Bloqués</div>
            </div>
            <div style="flex: 1; text-align: center; border-right: 1px solid #e2e8f0;">
              <div style="font-size: 24px; font-weight: 700; color: #10b981;">${approvals.length}</div>
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Approuvés</div>
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${logs.length}</div>
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Total</div>
            </div>
          </div>
          
          <!-- Events Table -->
          <div style="padding: 20px;">
            <h2 style="font-size: 14px; color: #1e3a5f; margin: 0 0 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">
              📋 Événements Critiques (24h)
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 10px 12px; text-align: left; font-size: 10px; color: #64748b; text-transform: uppercase;">Heure</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 10px; color: #64748b; text-transform: uppercase;">Type</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 10px; color: #64748b; text-transform: uppercase;">Utilisateur</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 10px; color: #64748b; text-transform: uppercase;">Réf.</th>
                </tr>
              </thead>
              <tbody>
                ${eventRows}
              </tbody>
            </table>
          </div>
          
          <!-- CTA -->
          <div style="padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <a href="${Deno.env.get("APP_URL") || "https://talmi-data-forge.lovable.app"}/securite" 
               style="display: inline-block; background: #1e3a5f; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">
              Ouvrir le War Room →
            </a>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 15px; text-align: center; font-size: 10px; color: #94a3b8;">
            <p style="margin: 0;"><strong>TALMI BETON</strong> • Système de Sécurité</p>
            <p style="margin: 5px 0 0;">Ce résumé est envoyé quotidiennement à 07h00.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Fetch recipients with daily or both frequency
    const { data: recipientsData, error: recipientsError } = await supabase
      .from("security_digest_recipients")
      .select("email, name")
      .eq("is_active", true)
      .in("frequency", ["daily", "both"]);

    if (recipientsError) {
      console.warn("Failed to fetch recipients:", recipientsError.message);
    }

    const recipients = (recipientsData && recipientsData.length > 0)
      ? recipientsData.map(r => r.email)
      : [Deno.env.get("CEO_EMAIL") || "ceo@talmibeton.ma"];

    // Skip if no critical events and risk is normal (optional: always send)
    const shouldSend = true; // Always send daily summary

    if (!shouldSend || recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No recipients or no events" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending daily digest to ${recipients.length} recipient(s)`);

    const emailResponse = await resend.emails.send({
      from: "Talmi Beton Security <onboarding@resend.dev>",
      to: recipients,
      subject: `${riskEmoji} Sécurité ${now.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} - ${riskLevel} (${logs.length} événements)`,
      html,
    });

    console.log("Daily security digest sent:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          date: reportDate,
          riskScore,
          riskLevel,
          rollbacks: rollbacks.length,
          blockedActions: blockedActions.length,
          totalEvents: logs.length,
          recipientCount: recipients.length,
        },
        email: emailResponse,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-daily-security-digest:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
