import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QualityAlertData {
  test_id: string;
  bl_id: string;
  formule_id: string;
  test_type: '7j' | '28j';
  resistance_value: number;
  target_value: number;
  client_id?: string;
}

async function sendQualityAlertEmail(
  data: QualityAlertData,
  recipientEmail: string
): Promise<void> {
  const deficitPct = ((data.target_value - data.resistance_value) / data.target_value * 100).toFixed(1);
  const testLabel = data.test_type === '7j' ? '7 Jours' : '28 Jours';
  const urgencyColor = '#dc2626';

  const subject = `🚨 ALERTE QUALITÉ CRITIQUE - Résistance ${testLabel} Insuffisante - BL ${data.bl_id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, ${urgencyColor} 0%, #991b1b 100%); color: white; padding: 25px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .alert-banner { background: #fef2f2; border: 2px solid ${urgencyColor}; padding: 20px; margin: 20px; border-radius: 12px; text-align: center; }
        .alert-banner h2 { color: ${urgencyColor}; margin: 0 0 10px; font-size: 22px; }
        .content { padding: 20px; }
        .test-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${urgencyColor}; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .info-item { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
        .info-value { font-size: 20px; font-weight: 700; color: #111; }
        .comparison { display: flex; justify-content: center; align-items: center; gap: 20px; padding: 20px; background: #fef2f2; border-radius: 12px; margin: 20px 0; }
        .value-box { text-align: center; padding: 15px 25px; border-radius: 8px; }
        .value-box.actual { background: ${urgencyColor}; color: white; }
        .value-box.target { background: #16a34a; color: white; }
        .value-box .label { font-size: 11px; text-transform: uppercase; opacity: 0.9; }
        .value-box .value { font-size: 28px; font-weight: 700; }
        .action-section { background: #eff6ff; border: 1px solid #3b82f6; border-radius: 12px; padding: 20px; margin-top: 20px; }
        .action-section h3 { color: #1d4ed8; margin: 0 0 15px; }
        .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏭 TALMI BÉTON - ALERTE QUALITÉ</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Laboratoire & Contrôle Qualité</p>
        </div>
        
        <div class="alert-banner">
          <h2>🚨 RÉSISTANCE ${testLabel.toUpperCase()} INSUFFISANTE</h2>
          <p style="margin: 0; font-size: 16px;">
            Le test de résistance est <strong>${deficitPct}% en dessous</strong> de la cible
          </p>
        </div>
        
        <div class="content">
          <div class="test-card">
            <h3 style="margin: 0 0 15px; color: #111;">📋 Détails du Test</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">N° Bon de Livraison</div>
                <div class="info-value" style="font-family: monospace;">${data.bl_id}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Formule</div>
                <div class="info-value" style="font-family: monospace;">${data.formule_id}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Client</div>
                <div class="info-value">${data.client_id || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Type de Test</div>
                <div class="info-value">Résistance ${testLabel}</div>
              </div>
            </div>
          </div>
          
          <h3 style="text-align: center; margin: 25px 0 15px;">Comparaison des Valeurs</h3>
          <div class="comparison">
            <div class="value-box actual">
              <div class="label">Mesuré</div>
              <div class="value">${data.resistance_value} MPa</div>
            </div>
            <div style="font-size: 24px; color: #6b7280;">→</div>
            <div class="value-box target">
              <div class="label">Cible Minimum</div>
              <div class="value">${data.target_value} MPa</div>
            </div>
          </div>
          <p style="text-align: center; color: ${urgencyColor}; font-weight: 600; font-size: 18px;">
            Déficit: -${deficitPct}%
          </p>
          
          <div class="action-section">
            <h3>⚠️ Actions Immédiates Requises</h3>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Vérifier la formule de béton et les dosages</li>
              <li>Examiner les conditions de stockage des éprouvettes</li>
              <li>Contacter le client pour discussion préventive</li>
              <li>Préparer un rapport d'analyse qualité</li>
              <li>Envisager des tests complémentaires si nécessaire</li>
            </ol>
            <a href="https://talmi-data-forge.lovable.app/laboratoire" class="btn">
              Accéder au Laboratoire →
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>⏰ Alerte générée automatiquement</strong></p>
          <p>Système de Contrôle Qualité - Talmi Béton</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Talmi Béton <onboarding@resend.dev>",
    to: [recipientEmail],
    subject,
    html,
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));

    // Validate required fields
    if (!body.test_id || !body.bl_id || !body.resistance_value || !body.target_value) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: test_id, bl_id, resistance_value, target_value' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get CEO email
    const { data: ceoUser } = await supabase
      .from('user_roles_v2')
      .select('user_id')
      .eq('role', 'ceo')
      .limit(1)
      .maybeSingle();

    let ceoEmail = 'max.talmi@gmail.com';
    if (ceoUser?.user_id) {
      const { data: ceoProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', ceoUser.user_id)
        .maybeSingle();
      
      if (ceoProfile?.email) {
        ceoEmail = ceoProfile.email;
      }
    }

    // Get client info if available
    let clientId: string | undefined;
    const { data: bl } = await supabase
      .from('bons_livraison_reels')
      .select('client_id')
      .eq('bl_id', body.bl_id)
      .maybeSingle();
    
    if (bl?.client_id) {
      clientId = bl.client_id;
    }

    const alertData: QualityAlertData = {
      test_id: body.test_id,
      bl_id: body.bl_id,
      formule_id: body.formule_id || 'N/A',
      test_type: body.test_type || '7j',
      resistance_value: body.resistance_value,
      target_value: body.target_value,
      client_id: clientId,
    };

    // Send email to CEO
    await sendQualityAlertEmail(alertData, ceoEmail);

    // Also send to Responsable Technique if exists
    const { data: techUser } = await supabase
      .from('user_roles_v2')
      .select('user_id')
      .eq('role', 'responsable_technique')
      .limit(1)
      .maybeSingle();

    if (techUser?.user_id) {
      const { data: techProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', techUser.user_id)
        .maybeSingle();
      
      if (techProfile?.email && techProfile.email !== ceoEmail) {
        await sendQualityAlertEmail(alertData, techProfile.email);
      }
    }

    return new Response(JSON.stringify({ success: true, sent_to: ceoEmail }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error in notify-quality-alert:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
