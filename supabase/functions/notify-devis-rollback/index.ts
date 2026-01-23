import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RollbackNotificationRequest {
  devis_id: string;
  creator_id: string;
  client_name: string | null;
  rollback_by_name: string;
  rollback_by_role: string;
  reason: string | null;
}

async function getCreatorEmail(supabase: any, creatorId: string): Promise<{ email: string | null; name: string | null }> {
  // First try to get from auth.users metadata
  const { data: user } = await supabase.auth.admin.getUserById(creatorId);
  
  if (user?.user) {
    return {
      email: user.user.email,
      name: user.user.user_metadata?.full_name || user.user.email?.split('@')[0] || null,
    };
  }
  
  // Fallback to profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('user_id', creatorId)
    .single();
  
  return {
    email: profile?.email || null,
    name: profile?.full_name || null,
  };
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

    const body: RollbackNotificationRequest = await req.json();
    const { devis_id, creator_id, client_name, rollback_by_name, rollback_by_role, reason } = body;

    if (!devis_id || !creator_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: devis_id and creator_id" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get creator's email and name
    const creator = await getCreatorEmail(supabase, creator_id);

    if (!creator.email) {
      console.log(`No email found for creator ${creator_id}`);
      return new Response(
        JSON.stringify({ success: true, email_sent: false, reason: "No email found for creator" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const timestamp = new Date().toLocaleString('fr-FR', {
      timeZone: 'Africa/Casablanca',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const roleLabel = rollback_by_role === 'ceo' ? 'CEO' : 
                      rollback_by_role === 'superviseur' ? 'Superviseur' : 
                      rollback_by_role;

    const subject = `[Talmi Béton] Action Requise : Devis ${devis_id} déverrouillé`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
          .info-grid { display: grid; gap: 10px; margin-bottom: 20px; }
          .info-item { background: #f9fafb; padding: 10px; border-radius: 4px; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .value { font-weight: 600; color: #111; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🔓 Devis Déverrouillé</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">Action requise de votre part</p>
          </div>
          
          <div class="content">
            <p>Bonjour${creator.name ? ' ' + creator.name : ''},</p>
            
            <div class="alert-box">
              <strong>⚠️ Votre devis a été remis en brouillon</strong><br>
              <span style="font-size: 14px;">
                Votre devis ${client_name ? `pour le client <strong>${client_name}</strong>` : `<strong>#${devis_id}</strong>`} 
                a été déverrouillé par ${rollback_by_name} (${roleLabel}).
              </span>
            </div>
            
            ${reason ? `
            <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <strong style="color: #dc2626;">📝 Motif du déverrouillage :</strong>
              <p style="margin: 10px 0 0; font-style: italic; color: #7f1d1d; font-size: 15px;">
                "${reason}"
              </p>
            </div>
            ` : ''}
            
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Numéro de Devis</div>
                <div class="value" style="font-family: monospace;">📄 ${devis_id}</div>
              </div>
              ${client_name ? `
              <div class="info-item">
                <div class="label">Client</div>
                <div class="value">👤 ${client_name}</div>
              </div>
              ` : ''}
              <div class="info-item">
                <div class="label">Déverrouillé par</div>
                <div class="value">🔑 ${rollback_by_name} (${roleLabel})</div>
              </div>
              <div class="info-item">
                <div class="label">Date & Heure</div>
                <div class="value">📅 ${timestamp}</div>
              </div>
            </div>
            
            <p style="margin-bottom: 20px;">
              Veuillez consulter les modifications nécessaires avant de le soumettre à nouveau pour validation.
            </p>
            
            <a href="https://talmi-data-forge.lovable.app/ventes" class="button">
              Voir le Devis →
            </a>
            
            <div class="footer">
              <p>Cet email est envoyé automatiquement par le système de gestion de Talmi Béton.</p>
              <p>Pour toute question, contactez votre responsable.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Talmi Béton <onboarding@resend.dev>",
      to: [creator.email],
      subject,
      html,
    });

    console.log("Rollback notification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_sent: true, 
        sent_to: creator.email,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in notify-devis-rollback:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
