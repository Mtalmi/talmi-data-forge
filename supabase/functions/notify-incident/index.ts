import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IncidentPayload {
  incident_id: string;
  truck_id: string;
  bc_id: string | null;
  bl_id: string | null;
  client_name: string | null;
  incident_type: string;
  description: string;
  volume_perdu: number;
  rescue_truck: string | null;
}

async function sendIncidentEmail(payload: IncidentPayload, ceoEmail: string): Promise<void> {
  const timestamp = new Date().toLocaleString('fr-FR', { 
    timeZone: 'Africa/Casablanca',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const subject = `🚨 INCIDENT CRITIQUE: ${payload.truck_id} - ${payload.incident_type}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .info-grid { display: grid; gap: 10px; margin-bottom: 20px; }
        .info-item { background: #f9fafb; padding: 12px; border-radius: 4px; border-left: 4px solid #dc2626; }
        .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { font-weight: 600; color: #111; font-size: 16px; margin-top: 4px; }
        .volume-lost { background: #fef2f2; border-color: #dc2626; }
        .volume-lost .value { color: #dc2626; }
        .rescue { background: #f0fdf4; border-color: #16a34a; }
        .rescue .value { color: #16a34a; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">🚨 ALERTE INCIDENT FLOTTE</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">Action immédiate requise</p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <strong>⚠️ PANNE EN COURS DE LIVRAISON</strong><br>
            <span style="font-size: 14px;">Un camion a signalé un incident pendant une livraison active.</span>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Camion</div>
              <div class="value" style="font-family: monospace;">🚛 ${payload.truck_id}</div>
            </div>
            
            ${payload.bc_id ? `
            <div class="info-item">
              <div class="label">Bon de Commande</div>
              <div class="value" style="font-family: monospace;">📋 ${payload.bc_id}</div>
            </div>
            ` : ''}
            
            ${payload.bl_id ? `
            <div class="info-item">
              <div class="label">Bon de Livraison</div>
              <div class="value" style="font-family: monospace;">🚚 ${payload.bl_id}</div>
            </div>
            ` : ''}
            
            ${payload.client_name ? `
            <div class="info-item">
              <div class="label">Client</div>
              <div class="value">👤 ${payload.client_name}</div>
            </div>
            ` : ''}
            
            <div class="info-item">
              <div class="label">Type d'Incident</div>
              <div class="value">⚙️ ${payload.incident_type}</div>
            </div>
            
            <div class="info-item">
              <div class="label">Description</div>
              <div class="value">${payload.description}</div>
            </div>
            
            ${payload.volume_perdu > 0 ? `
            <div class="info-item volume-lost">
              <div class="label">Volume Perdu</div>
              <div class="value">❌ ${payload.volume_perdu} m³</div>
            </div>
            ` : ''}
            
            ${payload.rescue_truck ? `
            <div class="info-item rescue">
              <div class="label">Camion de Secours</div>
              <div class="value">🆘 ${payload.rescue_truck} (Réassigné)</div>
            </div>
            ` : ''}
            
            <div class="info-item">
              <div class="label">Date & Heure</div>
              <div class="value">📅 ${timestamp}</div>
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            <a href="https://talmi-data-forge.lovable.app/logistique" 
               style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Voir les Détails de la Flotte →
            </a>
          </div>
          
          <div class="footer">
            <p>Cet email est envoyé automatiquement par le système de gestion de flotte de Talmi Béton.</p>
            <p>Incident ID: ${payload.incident_id}</p>
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

    const body: IncidentPayload = await req.json();

    // Validate required fields
    if (!body.incident_id || !body.truck_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: incident_id, truck_id" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // CEO email is hardcoded as specified
    const ceoEmail = 'max.talmi@gmail.com';

    // Send email
    await sendIncidentEmail(body, ceoEmail);

    // Mark incident as notified
    await supabase
      .from('incidents_flotte')
      .update({ 
        ceo_notified: true, 
        ceo_notified_at: new Date().toISOString() 
      })
      .eq('id', body.incident_id);

    // Also create a system alert for in-app notification
    await supabase
      .from('alertes_systeme')
      .insert({
        type_alerte: 'incident_flotte',
        niveau: 'critical',
        titre: `🚨 INCIDENT: ${body.truck_id} - ${body.incident_type}`,
        message: `${body.description}. BC: ${body.bc_id || 'N/A'}. Volume perdu: ${body.volume_perdu || 0}m³`,
        reference_id: body.incident_id,
        reference_table: 'incidents_flotte',
        destinataire_role: 'ceo',
      });

    return new Response(
      JSON.stringify({ success: true, message: "Incident notification sent to CEO" }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in notify-incident:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
