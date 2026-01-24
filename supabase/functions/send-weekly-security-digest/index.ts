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

interface RlsPolicy {
  tablename: string;
  policyname: string;
  cmd: string;
  roles: string;
  qual: string | null;
}

interface SecurityFunction {
  name: string;
  type: string;
  securityType: string;
}

// Security triggers with descriptions
const SECURITY_TRIGGERS = [
  { name: 'prevent_devis_self_approval', table: 'devis', event: 'BEFORE UPDATE', description: 'ANTI-FRAUDE: Bloque l\'auto-validation des devis' },
  { name: 'enforce_devis_approval_permission', table: 'devis', event: 'BEFORE UPDATE', description: 'Vérifie les rôles autorisés avant approbation' },
  { name: 'prevent_approved_devis_modification', table: 'devis', event: 'BEFORE UPDATE', description: 'IMMUTABILITÉ: Verrouille les devis après validation' },
  { name: 'enforce_monthly_cap_atomic', table: 'expenses_controlled', event: 'BEFORE INSERT', description: 'PLAFOND: Bloque les dépenses Level 1 au-delà de 15,000 MAD/mois' },
  { name: 'enforce_expense_evidence', table: 'expenses_controlled', event: 'BEFORE INSERT', description: 'PREUVE: Exige photo du justificatif obligatoire' },
  { name: 'enforce_expense_approval_chain', table: 'expenses_controlled', event: 'BEFORE UPDATE', description: 'Validation hiérarchique Level 1 → 2 → 3' },
  { name: 'enforce_stock_photo_requirement', table: 'stock_receptions_pending', event: 'BEFORE INSERT', description: 'QC: Exige photo du matériau' },
  { name: 'enforce_audit_immutability', table: 'audit_superviseur', event: 'BEFORE UPDATE/DELETE', description: 'BLACK BOX: Empêche modification/suppression des logs' },
];

// Role permission matrix
const ROLE_MATRIX = [
  { role: 'CEO', devis: 'CRUD + Approve + Rollback', formules: 'CRUD', expenses: 'All Levels + Override', audit: 'Read All + Export', stocks: 'Full + Adjust' },
  { role: 'Superviseur', devis: 'CRUD + Approve + Rollback', formules: 'CRUD', expenses: 'Level 2 + Override', audit: 'Read All', stocks: 'Full + Adjust' },
  { role: 'Agent Administratif', devis: 'CRU + Approve (not own)', formules: 'Read Only', expenses: 'Level 1 Create', audit: 'Own Logs', stocks: 'Finalize Reception' },
  { role: 'Directeur Opérations', devis: 'Read Only*', formules: 'Read Only', expenses: 'View Only', audit: 'Own Logs', stocks: 'Read Only' },
  { role: 'Responsable Technique', devis: 'Technical Approval', formules: 'Read (dosages)', expenses: 'View Only', audit: 'Own Logs', stocks: 'Quality Control' },
  { role: 'Centraliste', devis: 'None', formules: 'Read (production)', expenses: 'None', audit: 'None', stocks: 'Production Entry' },
  { role: 'Auditeur', devis: 'Read Only', formules: 'Read Only', expenses: 'Read Only', audit: 'Read All', stocks: 'Read Only' },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Fetch RLS policies
    const { data: policiesData } = await supabase.rpc("get_rls_policies_for_report");
    const policies = (policiesData || []) as RlsPolicy[];

    // Fetch security functions
    const { data: functionsData } = await supabase.rpc("get_security_functions_for_report");
    const securityFunctions = (functionsData || []) as SecurityFunction[];

    const logs = (auditLogs || []) as AuditLog[];

    // Categorize events
    const rollbacks = logs.filter((l) => l.action === "ROLLBACK_APPROVAL");
    const blockedActions = logs.filter((l) => l.action === "ACCESS_DENIED" || l.action === "LIMIT_EXCEEDED");
    const stockEvents = logs.filter((l) => l.action === "STOCK_FINALIZED");
    const approvals = logs.filter((l) => l.action === "APPROVE_DEVIS");
    const priceChanges = logs.filter((l) => l.action === "PRICE_CHANGE");

    // Calculate anomaly score
    const anomalyScore = rollbacks.length * 10 + blockedActions.length * 5 + priceChanges.length * 2;
    const riskLevel = anomalyScore >= 50 ? "CRITIQUE" : anomalyScore >= 20 ? "ÉLEVÉ" : anomalyScore >= 5 ? "MODÉRÉ" : "FAIBLE";
    const riskColor = anomalyScore >= 50 ? "#dc2626" : anomalyScore >= 20 ? "#f59e0b" : anomalyScore >= 5 ? "#3b82f6" : "#10b981";

    // Format dates
    const periodStart = sevenDaysAgo.toLocaleDateString("fr-FR", { dateStyle: "long" });
    const periodEnd = now.toLocaleDateString("fr-FR", { dateStyle: "long" });
    const generatedAt = now.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });
    const reportId = `SEC-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${now.getTime().toString(36).toUpperCase()}`;

    // Group policies by critical tables
    const criticalTables = ['devis', 'formules_theoriques', 'audit_superviseur', 'expenses_controlled', 'stocks', 'bons_commande'];
    const groupedPolicies: Record<string, RlsPolicy[]> = {};
    policies.forEach(p => {
      if (criticalTables.includes(p.tablename)) {
        if (!groupedPolicies[p.tablename]) groupedPolicies[p.tablename] = [];
        groupedPolicies[p.tablename].push(p);
      }
    });

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
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${(b.changes as any)?.attempted_action || b.action}</td>
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

    // Build RLS policies section
    const rlsPoliciesHtml = Object.entries(groupedPolicies).slice(0, 6).map(([table, tablePolicies]) => `
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 13px; color: #1e3a5f; margin: 0 0 8px; padding: 6px 10px; background: #f1f5f9; border-left: 3px solid #d4af37; border-radius: 4px;">${table}</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 8px; text-align: left; font-size: 10px; color: #64748b;">Politique</th>
              <th style="padding: 8px; text-align: left; font-size: 10px; color: #64748b;">Opération</th>
              <th style="padding: 8px; text-align: left; font-size: 10px; color: #64748b;">Condition</th>
            </tr>
          </thead>
          <tbody>
            ${tablePolicies.slice(0, 5).map(p => `
              <tr>
                <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;"><code style="font-size: 10px; background: #e0e7ff; padding: 2px 6px; border-radius: 3px; color: #3730a3;">${p.policyname}</code></td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;"><span style="padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; ${p.cmd === 'SELECT' ? 'background: #dbeafe; color: #1d4ed8;' : p.cmd === 'INSERT' ? 'background: #d1fae5; color: #059669;' : p.cmd === 'DELETE' ? 'background: #fee2e2; color: #dc2626;' : 'background: #fef3c7; color: #d97706;'}">${p.cmd}</span></td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; color: #64748b;">${p.qual ? p.qual.substring(0, 60) + (p.qual.length > 60 ? '...' : '') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    // Build triggers section
    const triggersHtml = SECURITY_TRIGGERS.map(t => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;"><code style="font-size: 10px; background: #fef3c7; padding: 2px 6px; border-radius: 3px; color: #b45309;">${t.name}</code></td>
        <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;"><span style="font-size: 10px; background: #f1f5f9; padding: 2px 6px; border-radius: 3px;">${t.table}</span></td>
        <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 11px;">${t.description}</td>
      </tr>
    `).join('');

    // Build role matrix
    const roleMatrixHtml = ROLE_MATRIX.map(r => `
      <tr>
        <td style="padding: 8px; font-weight: 700; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">${r.role}</td>
        <td style="padding: 8px; text-align: center; font-size: 10px; border-bottom: 1px solid #e2e8f0; ${r.devis.includes('CRUD') ? 'background: #d1fae5; color: #059669;' : r.devis === 'None' ? 'background: #fee2e2; color: #dc2626;' : 'background: #fef3c7; color: #b45309;'}">${r.devis}</td>
        <td style="padding: 8px; text-align: center; font-size: 10px; border-bottom: 1px solid #e2e8f0; ${r.expenses.includes('All') ? 'background: #d1fae5; color: #059669;' : r.expenses === 'None' ? 'background: #fee2e2; color: #dc2626;' : 'background: #fef3c7; color: #b45309;'}">${r.expenses}</td>
        <td style="padding: 8px; text-align: center; font-size: 10px; border-bottom: 1px solid #e2e8f0; ${r.audit.includes('Read All') ? 'background: #dbeafe; color: #1d4ed8;' : r.audit === 'None' ? 'background: #fee2e2; color: #dc2626;' : 'background: #f1f5f9; color: #64748b;'}">${r.audit}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Rapport de Conformité Sécurité Hebdomadaire - TALMI BETON</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f4f4f4;">
        <div style="max-width: 800px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0 0 10px; font-size: 26px;">🔒 RAPPORT DE CONFORMITÉ SÉCURITÉ</h1>
            <p style="margin: 0; opacity: 0.8; font-size: 14px;">Synthèse hebdomadaire pour auditeurs externes</p>
            <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 8px 20px; border-radius: 30px; font-size: 12px; margin-top: 15px;">
              📅 ${periodStart} → ${periodEnd}
            </div>
            <div style="margin-top: 15px;">
              <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 9px; font-weight: 700; background: #d4af37; color: #0f172a; margin-right: 8px;">OFFICIEL</span>
              <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 9px; font-weight: 700; background: rgba(255,255,255,0.2); color: white;">ID: ${reportId}</span>
            </div>
          </div>
          
          <div style="background: white; padding: 30px;">
            <!-- Risk Score Banner -->
            <div style="background: ${riskColor}15; border: 2px solid ${riskColor}; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
              <div style="font-size: 48px; font-weight: bold; color: ${riskColor};">${anomalyScore}</div>
              <div style="font-size: 14px; color: ${riskColor}; font-weight: 600; letter-spacing: 2px; margin-top: 5px;">NIVEAU DE RISQUE: ${riskLevel}</div>
            </div>
            
            <!-- Key Metrics -->
            <table style="width: 100%; margin-bottom: 30px;">
              <tr>
                <td style="width: 25%; background: #f8fafc; border-radius: 10px; padding: 20px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${rollbacks.length}</div>
                  <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 5px;">Rollbacks</div>
                </td>
                <td style="width: 25%; background: #f8fafc; border-radius: 10px; padding: 20px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${blockedActions.length}</div>
                  <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 5px;">Bloqués</div>
                </td>
                <td style="width: 25%; background: #f8fafc; border-radius: 10px; padding: 20px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #10b981;">${approvals.length}</div>
                  <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 5px;">Approbations</div>
                </td>
                <td style="width: 25%; background: #f8fafc; border-radius: 10px; padding: 20px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${policies.length}</div>
                  <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 5px;">Politiques RLS</div>
                </td>
              </tr>
            </table>
            
            <!-- Rollbacks Section -->
            <div style="margin-bottom: 30px;">
              <div style="font-size: 16px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">
                🚨 ÉVÉNEMENTS ROLLBACK (${rollbacks.length})
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 11px;">Date</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 11px;">Utilisateur</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 11px;">Document</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 11px;">Motif</th>
                  </tr>
                </thead>
                <tbody>${rollbackRows}</tbody>
              </table>
            </div>
            
            <!-- Blocked Actions Section -->
            <div style="margin-bottom: 30px;">
              <div style="font-size: 16px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">
                🚫 VIOLATIONS DE SÉCURITÉ (${blockedActions.length})
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 11px;">Date</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 11px;">Utilisateur</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 11px;">Table Cible</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 11px;">Action Tentée</th>
                  </tr>
                </thead>
                <tbody>${blockedRows}</tbody>
              </table>
            </div>

            <!-- RLS Policies Section -->
            <div style="margin-bottom: 30px; page-break-before: always;">
              <div style="font-size: 16px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">
                🛡️ POLITIQUES RLS ACTIVES (Tables Critiques)
              </div>
              ${rlsPoliciesHtml}
            </div>

            <!-- Security Triggers Section -->
            <div style="margin-bottom: 30px;">
              <div style="font-size: 16px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">
                ⚡ TRIGGERS DE SÉCURITÉ (${SECURITY_TRIGGERS.length} Anti-Fraude)
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="padding: 10px; text-align: left; font-weight: 600; color: #475569; font-size: 10px;">Trigger</th>
                    <th style="padding: 10px; text-align: left; font-weight: 600; color: #475569; font-size: 10px;">Table</th>
                    <th style="padding: 10px; text-align: left; font-weight: 600; color: #475569; font-size: 10px;">Description</th>
                  </tr>
                </thead>
                <tbody>${triggersHtml}</tbody>
              </table>
            </div>

            <!-- Role Permission Matrix -->
            <div style="margin-bottom: 30px;">
              <div style="font-size: 16px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">
                👥 MATRICE DES PERMISSIONS PAR RÔLE
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                  <tr style="background: #0f172a; color: white;">
                    <th style="padding: 10px; text-align: left; font-size: 10px;">Rôle</th>
                    <th style="padding: 10px; text-align: center; font-size: 10px;">Devis</th>
                    <th style="padding: 10px; text-align: center; font-size: 10px;">Dépenses</th>
                    <th style="padding: 10px; text-align: center; font-size: 10px;">Audit</th>
                  </tr>
                </thead>
                <tbody>${roleMatrixHtml}</tbody>
              </table>
            </div>

            <!-- Top Actors -->
            <div style="margin-bottom: 30px;">
              <div style="font-size: 16px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">
                👥 UTILISATEURS LES PLUS ACTIFS
              </div>
              ${topActors.map(([name, count], i) => {
                const maxCount = (topActors[0]?.[1] as number) || 1;
                const width = Math.max(30, ((count as number) / maxCount) * 250);
                return `
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <div style="width: 130px; font-weight: 500; font-size: 13px;">${i + 1}. ${name}</div>
                    <div style="height: 22px; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 4px; width: ${width}px;"></div>
                    <div style="margin-left: 10px; font-size: 12px; color: #64748b;">${count} actions</div>
                  </div>
                `;
              }).join("")}
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; padding: 20px 0;">
              <p style="margin: 0 0 15px; color: #64748b;">Pour consulter l'historique complet et télécharger le PDF:</p>
              <a href="${Deno.env.get("APP_URL") || "https://talmi-data-forge.lovable.app"}/securite" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ouvrir le Security Dashboard →
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 25px; text-align: center; font-size: 11px; color: #64748b;">
            <p style="margin: 0;"><strong>TALMI BETON SARL</strong> • Système de Gestion Industrielle</p>
            <p style="margin: 8px 0 0;">Rapport généré automatiquement le ${generatedAt}</p>
            <p style="margin: 10px 0 0; color: #94a3b8;">
              Ce rapport est envoyé chaque lundi à 08h00 (UTC+1 Casablanca).
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Fetch recipients from database
    const { data: recipientsData, error: recipientsError } = await supabase
      .from("security_digest_recipients")
      .select("email, name, frequency")
      .eq("is_active", true);

    if (recipientsError) {
      console.warn("Failed to fetch recipients, using fallback:", recipientsError.message);
    }

    // Filter for weekly recipients (frequency = 'weekly' or 'both')
    const weeklyRecipients = (recipientsData || [])
      .filter((r: any) => r.frequency === 'weekly' || r.frequency === 'both')
      .map((r: any) => r.email);

    // Build recipient list (fallback to CEO_EMAIL if no recipients configured)
    const recipients = weeklyRecipients.length > 0
      ? weeklyRecipients
      : [Deno.env.get("CEO_EMAIL") || "ceo@talmibeton.ma"];

    console.log(`Sending weekly security compliance report to ${recipients.length} recipient(s):`, recipients);

    const emailResponse = await resend.emails.send({
      from: "Talmi Beton Security <onboarding@resend.dev>",
      to: recipients,
      subject: `🔒 Rapport Conformité Sécurité Hebdo - ${now.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} - Score: ${anomalyScore} (${riskLevel})`,
      html,
    });

    console.log("Weekly security compliance report sent:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          reportId,
          period: { start: periodStart, end: periodEnd },
          anomalyScore,
          riskLevel,
          rollbacks: rollbacks.length,
          blockedActions: blockedActions.length,
          totalEvents: logs.length,
          rlsPoliciesCount: policies.length,
          triggersCount: SECURITY_TRIGGERS.length,
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
