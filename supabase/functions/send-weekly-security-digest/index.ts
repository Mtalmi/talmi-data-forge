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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch audit logs from the last 7 days
    const { data: auditLogs, error: logsError } = await supabase
      .from("audit_superviseur")
      .select("*")
      .gte("created_at", sevenDaysAgo.toISOString())
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
    const priceChanges = logs.filter((l) => l.action === "PRICE_CHANGE");

    // Calculate anomaly score (higher = more concerning)
    const anomalyScore = rollbacks.length * 10 + blockedActions.length * 5 + priceChanges.length * 2;
    const riskLevel = anomalyScore >= 50 ? "CRITIQUE" : anomalyScore >= 20 ? "ÉLEVÉ" : anomalyScore >= 5 ? "MODÉRÉ" : "FAIBLE";
    const riskColor = anomalyScore >= 50 ? "#dc2626" : anomalyScore >= 20 ? "#f59e0b" : anomalyScore >= 5 ? "#3b82f6" : "#10b981";

    // Format dates
    const periodStart = sevenDaysAgo.toLocaleDateString("fr-FR", { dateStyle: "long" });
    const periodEnd = now.toLocaleDateString("fr-FR", { dateStyle: "long" });
    const generatedAt = now.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });

    // Build rollback details table rows
    const rollbackRows = rollbacks.length > 0
      ? rollbacks.slice(0, 10).map((r) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>${r.user_name || "Inconnu"}</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${r.record_id || "-"}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-style: italic; color: #dc2626;">"${(r.changes as any)?.reason || "Non spécifié"}"</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #10b981;">✓ Aucun rollback cette semaine</td></tr>`;

    // Build blocked actions table rows
    const blockedRows = blockedActions.length > 0
      ? blockedActions.slice(0, 10).map((b) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(b.created_at).toLocaleDateString("fr-FR")}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>${b.user_name || "Inconnu"}</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${b.table_name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${(b.changes as any)?.attempted_action || "Accès non autorisé"}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #10b981;">✓ Aucune violation de sécurité</td></tr>`;

    // Top actors this week
    const userActionCounts: Record<string, number> = {};
    logs.forEach((l) => {
      const name = l.user_name || "Inconnu";
      userActionCounts[name] = (userActionCounts[name] || 0) + 1;
    });
    const topActors = Object.entries(userActionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Digest Sécurité Hebdomadaire</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f4f4f4; }
          .container { max-width: 700px; margin: 0 auto; }
          .header { 
            background: linear-gradient(135deg, #1e3a5f, #0f172a); 
            color: white; 
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 { margin: 0 0 10px; font-size: 28px; }
          .header p { margin: 0; opacity: 0.8; font-size: 14px; }
          .period-badge {
            display: inline-block;
            background: rgba(255,255,255,0.15);
            padding: 8px 20px;
            border-radius: 30px;
            font-size: 12px;
            margin-top: 15px;
          }
          .content { background: white; padding: 30px; }
          .risk-banner {
            background: ${riskColor}15;
            border: 2px solid ${riskColor};
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin-bottom: 30px;
          }
          .risk-score {
            font-size: 48px;
            font-weight: bold;
            color: ${riskColor};
          }
          .risk-label {
            font-size: 14px;
            color: ${riskColor};
            font-weight: 600;
            letter-spacing: 2px;
            margin-top: 5px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .metric-card {
            background: #f8fafc;
            border-radius: 10px;
            padding: 20px 15px;
            text-align: center;
          }
          .metric-value {
            font-size: 32px;
            font-weight: bold;
          }
          .metric-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 5px;
          }
          .section { margin-bottom: 30px; }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #1e3a5f;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { 
            background: #f1f5f9; 
            padding: 12px; 
            text-align: left;
            font-weight: 600;
            color: #475569;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .actor-bar {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
          }
          .actor-name {
            width: 120px;
            font-weight: 500;
            font-size: 13px;
          }
          .actor-bar-fill {
            height: 20px;
            background: linear-gradient(90deg, #3b82f6, #60a5fa);
            border-radius: 4px;
            min-width: 20px;
          }
          .actor-count {
            margin-left: 10px;
            font-size: 12px;
            color: #64748b;
          }
          .footer {
            background: #f8fafc;
            padding: 25px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
          }
          .cta-button {
            display: inline-block;
            background: #1e3a5f;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 DIGEST SÉCURITÉ HEBDOMADAIRE</h1>
            <p>Synthèse des événements de sécurité de la semaine</p>
            <div class="period-badge">
              📅 ${periodStart} → ${periodEnd}
            </div>
          </div>
          
          <div class="content">
            <!-- Risk Score Banner -->
            <div class="risk-banner">
              <div class="risk-score">${anomalyScore}</div>
              <div class="risk-label">NIVEAU DE RISQUE: ${riskLevel}</div>
            </div>
            
            <!-- Key Metrics -->
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value" style="color: #dc2626;">${rollbacks.length}</div>
                <div class="metric-label">Rollbacks</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: #f59e0b;">${blockedActions.length}</div>
                <div class="metric-label">Bloqués</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: #10b981;">${approvals.length}</div>
                <div class="metric-label">Approbations</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: #3b82f6;">${logs.length}</div>
                <div class="metric-label">Total Actions</div>
              </div>
            </div>
            
            <!-- Rollbacks Section -->
            <div class="section">
              <div class="section-title">🚨 ÉVÉNEMENTS ROLLBACK (${rollbacks.length})</div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Utilisateur</th>
                    <th>Document</th>
                    <th>Motif</th>
                  </tr>
                </thead>
                <tbody>
                  ${rollbackRows}
                </tbody>
              </table>
            </div>
            
            <!-- Blocked Actions Section -->
            <div class="section">
              <div class="section-title">🚫 VIOLATIONS DE SÉCURITÉ (${blockedActions.length})</div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Utilisateur</th>
                    <th>Table Cible</th>
                    <th>Action Tentée</th>
                  </tr>
                </thead>
                <tbody>
                  ${blockedRows}
                </tbody>
              </table>
            </div>
            
            <!-- Top Actors -->
            <div class="section">
              <div class="section-title">👥 UTILISATEURS LES PLUS ACTIFS</div>
              ${topActors.map(([name, count], i) => {
                const maxCount = topActors[0][1] as number;
                const width = Math.max(20, (count as number / maxCount) * 200);
                return `
                  <div class="actor-bar">
                    <div class="actor-name">${i + 1}. ${name}</div>
                    <div class="actor-bar-fill" style="width: ${width}px;"></div>
                    <div class="actor-count">${count} actions</div>
                  </div>
                `;
              }).join("")}
            </div>
            
            <!-- CTA -->
            <div style="text-align: center;">
              <p>Pour consulter l'historique complet et les détails forensiques:</p>
              <a href="${Deno.env.get("APP_URL") || "https://talmi-data-forge.lovable.app"}/securite" class="cta-button">
                Ouvrir le War Room →
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>TALMI BETON SARL</strong> • Système de Gestion Industrielle</p>
            <p>Digest généré automatiquement le ${generatedAt}</p>
            <p style="margin-top: 10px; color: #94a3b8;">
              Ce rapport est envoyé chaque lundi à 08h00. Pour modifier les paramètres, contactez l'administrateur.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // CEO email
    const ceoEmail = Deno.env.get("CEO_EMAIL") || "ceo@talmibeton.ma";

    const emailResponse = await resend.emails.send({
      from: "Talmi Beton Security <onboarding@resend.dev>",
      to: [ceoEmail],
      subject: `🔒 Digest Sécurité Semaine ${now.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} - Score: ${anomalyScore} (${riskLevel})`,
      html,
    });

    console.log("Weekly security digest sent:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          period: { start: periodStart, end: periodEnd },
          anomalyScore,
          riskLevel,
          rollbacks: rollbacks.length,
          blockedActions: blockedActions.length,
          totalEvents: logs.length,
        },
        email: emailResponse,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-security-digest:", error);
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
