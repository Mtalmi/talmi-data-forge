import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tables that trigger email notifications
const SENSITIVE_TABLES = ['prix_achat_actuels', 'clients', 'factures', 'bons_livraison_reels'];

const TABLE_LABELS: Record<string, string> = {
  prix_achat_actuels: '💰 Prix d\'achat',
  clients: '👥 Clients',
  factures: '📄 Factures',
  bons_livraison_reels: '🚚 Bons de Livraison',
  bons_commande: '📋 Bons de Commande',
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: '➕ Création',
  UPDATE: '✏️ Modification',
  DELETE: '🗑️ Suppression',
};

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

function formatChanges(log: AuditLog): string {
  if (!log.changes && !log.old_data && !log.new_data) {
    return '<p style="color: #666;">Pas de détails disponibles</p>';
  }

  let html = '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
  html += '<tr style="background: #f5f5f5;"><th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Champ</th><th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Ancienne valeur</th><th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nouvelle valeur</th></tr>';

  const keys = log.changes 
    ? Object.keys(log.changes).filter(k => !['updated_at', 'created_at'].includes(k))
    : [];

  if (keys.length === 0 && log.action === 'INSERT' && log.new_data) {
    // For inserts, show key fields from new data
    const importantFields = ['nom_client', 'matiere_premiere', 'prix_unitaire_dh', 'montant', 'volume_m3', 'prix_vente_m3'];
    Object.keys(log.new_data)
      .filter(k => importantFields.includes(k) || (!k.includes('_at') && !k.includes('id')))
      .slice(0, 10)
      .forEach(key => {
        html += `<tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: 500;">${key}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #999;">—</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #16a34a; font-weight: 500;">${String(log.new_data?.[key] ?? '')}</td>
        </tr>`;
      });
  } else {
    keys.forEach(key => {
      const oldVal = log.old_data?.[key];
      const newVal = log.new_data?.[key];
      html += `<tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: 500;">${key}</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: #dc2626; text-decoration: line-through;">${oldVal !== undefined ? String(oldVal) : '—'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: #16a34a; font-weight: 500;">${newVal !== undefined ? String(newVal) : '—'}</td>
      </tr>`;
    });
  }

  html += '</table>';
  return html;
}

async function sendAuditEmail(log: AuditLog, ceoEmail: string): Promise<void> {
  const tableLabel = TABLE_LABELS[log.table_name] || log.table_name;
  const actionLabel = ACTION_LABELS[log.action] || log.action;
  const timestamp = new Date(log.created_at).toLocaleString('fr-FR', { 
    timeZone: 'Africa/Casablanca',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const subject = `🔔 AUDIT: ${log.user_name || 'Superviseur'} - ${actionLabel} sur ${tableLabel}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .info-grid { display: grid; gap: 10px; margin-bottom: 20px; }
        .info-item { background: #f9fafb; padding: 10px; border-radius: 4px; }
        .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .value { font-weight: 600; color: #111; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">🛡️ Alerte Audit Superviseur</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">Action détectée sur des données sensibles</p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <strong>⚠️ Action requérant votre attention</strong><br>
            <span style="font-size: 14px;">Une modification a été effectuée par le Superviseur sur des données sensibles.</span>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Utilisateur</div>
              <div class="value">👤 ${log.user_name || 'Superviseur'}</div>
            </div>
            <div class="info-item">
              <div class="label">Action</div>
              <div class="value">${actionLabel}</div>
            </div>
            <div class="info-item">
              <div class="label">Table</div>
              <div class="value">${tableLabel}</div>
            </div>
            <div class="info-item">
              <div class="label">ID Enregistrement</div>
              <div class="value" style="font-family: monospace;">${log.record_id || '—'}</div>
            </div>
            <div class="info-item">
              <div class="label">Date & Heure</div>
              <div class="value">📅 ${timestamp}</div>
            </div>
          </div>
          
          <h3 style="margin-bottom: 10px;">📋 Détails des modifications</h3>
          ${formatChanges(log)}
          
          <div style="margin-top: 20px;">
            <a href="https://talmi-data-forge.lovable.app/audit-superviseur" 
               style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Voir le Journal d'Audit Complet →
            </a>
          </div>
          
          <div class="footer">
            <p>Cet email est envoyé automatiquement par le système d'audit de Talmi Béton.</p>
            <p>Pour toute question, contactez l'administrateur système.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Talmi Béton <onboarding@resend.dev>",
    to: [ceoEmail],
    subject,
    html,
  });
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get CEO email from profiles
    const { data: ceoProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', (
        await supabase
          .from('user_roles_v2')
          .select('user_id')
          .eq('role', 'ceo')
          .single()
      ).data?.user_id)
      .single();

    const ceoEmail = ceoProfile?.email || 'max.talmi@gmail.com';

    // Check if called with specific audit log
    const body = await req.json().catch(() => ({}));
    
    if (body.audit_id) {
      // Single notification for specific audit
      const { data: log } = await supabase
        .from('audit_superviseur')
        .select('*')
        .eq('id', body.audit_id)
        .single();

      if (log && SENSITIVE_TABLES.includes(log.table_name)) {
        await sendAuditEmail(log as AuditLog, ceoEmail);
        
        await supabase
          .from('audit_superviseur')
          .update({ notified: true, notified_at: new Date().toISOString() })
          .eq('id', body.audit_id);

        return new Response(JSON.stringify({ success: true, sent: 1 }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Process all unnotified sensitive audits
    const { data: pendingAudits } = await supabase
      .from('audit_superviseur')
      .select('*')
      .eq('notified', false)
      .in('table_name', SENSITIVE_TABLES)
      .order('created_at', { ascending: true })
      .limit(10);

    if (!pendingAudits || pendingAudits.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No pending audits' }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let sentCount = 0;
    for (const log of pendingAudits) {
      try {
        await sendAuditEmail(log as AuditLog, ceoEmail);
        
        await supabase
          .from('audit_superviseur')
          .update({ notified: true, notified_at: new Date().toISOString() })
          .eq('id', log.id);
        
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send email for audit ${log.id}:`, emailError);
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in notify-ceo-audit:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);