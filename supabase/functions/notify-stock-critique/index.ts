import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StockAlert {
  id: string;
  type_alerte: string;
  niveau: string;
  titre: string;
  message: string;
  reference_id: string | null;
  reference_table: string | null;
  created_at: string;
}

interface StockInfo {
  materiau: string;
  quantite_actuelle: number;
  seuil_alerte: number;
  unite: string;
}

async function sendCriticalStockEmail(
  alert: StockAlert, 
  stockInfo: StockInfo | null,
  recipientEmail: string
): Promise<void> {
  const timestamp = new Date(alert.created_at).toLocaleString('fr-FR', { 
    timeZone: 'Africa/Casablanca',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const percentRemaining = stockInfo 
    ? Math.round((stockInfo.quantite_actuelle / stockInfo.seuil_alerte) * 100) 
    : 0;
  
  const urgencyColor = alert.niveau === 'critical' ? '#dc2626' : '#f59e0b';
  const urgencyLabel = alert.niveau === 'critical' ? '🚨 CRITIQUE' : '⚠️ ATTENTION';

  const subject = `${urgencyLabel} Stock Critique - ${stockInfo?.materiau || 'Matériau'} - Commande Requise`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, ${urgencyColor} 0%, #991b1b 100%); color: white; padding: 25px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
        .alert-banner { background: #fef2f2; border: 2px solid ${urgencyColor}; padding: 20px; margin: 20px; border-radius: 12px; text-align: center; }
        .alert-banner h2 { color: ${urgencyColor}; margin: 0 0 10px; font-size: 24px; }
        .content { padding: 20px; }
        .stock-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .stock-gauge { height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; margin: 15px 0; }
        .stock-gauge-fill { height: 100%; background: ${urgencyColor}; transition: width 0.3s; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .info-item { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
        .info-value { font-size: 20px; font-weight: 700; color: #111; }
        .action-section { background: #eff6ff; border: 1px solid #3b82f6; border-radius: 12px; padding: 20px; margin-top: 20px; }
        .action-section h3 { color: #1d4ed8; margin: 0 0 10px; }
        .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏭 TALMI BÉTON</h1>
          <p>Système d'Alerte Stock</p>
        </div>
        
        <div class="alert-banner">
          <h2>${urgencyLabel} - COMMANDE CRITIQUE REQUISE</h2>
          <p style="margin: 0; font-size: 18px;">Le stock de <strong>${stockInfo?.materiau || 'matériau'}</strong> est en dessous du seuil d'alerte</p>
        </div>
        
        <div class="content">
          <div class="stock-card">
            <h3 style="margin: 0 0 15px; color: #111;">📦 État du Stock</h3>
            
            <div class="stock-gauge">
              <div class="stock-gauge-fill" style="width: ${Math.min(percentRemaining, 100)}%;"></div>
            </div>
            <p style="text-align: center; font-weight: 600; color: ${urgencyColor}; margin: 0;">
              ${percentRemaining}% du seuil d'alerte
            </p>
            
            <div class="info-grid" style="margin-top: 20px;">
              <div class="info-item">
                <div class="info-label">Quantité Actuelle</div>
                <div class="info-value" style="color: ${urgencyColor};">
                  ${stockInfo?.quantite_actuelle?.toFixed(1) || '0'} ${stockInfo?.unite || ''}
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Seuil d'Alerte</div>
                <div class="info-value">${stockInfo?.seuil_alerte?.toFixed(1) || '0'} ${stockInfo?.unite || ''}</div>
              </div>
            </div>
          </div>
          
          <div class="action-section">
            <h3>📋 Actions Requises</h3>
            <ol style="margin: 10px 0 0; padding-left: 20px;">
              <li>Contacter le fournisseur principal immédiatement</li>
              <li>Passer une commande de réapprovisionnement</li>
              <li>Vérifier les délais de livraison</li>
              <li>Évaluer l'impact sur la production en cours</li>
            </ol>
            <a href="https://talmi-data-forge.lovable.app/fournisseurs" class="btn">
              Accéder aux Fournisseurs →
            </a>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>📅 Date de l'alerte:</strong> ${timestamp}<br>
              <strong>🔔 Niveau:</strong> ${alert.niveau === 'critical' ? 'Critique' : 'Avertissement'}
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>Cet email est envoyé automatiquement par le système de gestion des stocks de Talmi Béton.</p>
          <p>En cas de question, contactez le Directeur des Opérations.</p>
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));

    // Get procurement manager email (fallback to CEO)
    // Try to find user with directeur_operations role first (handles procurement)
    const { data: procurementUser } = await supabase
      .from('user_roles_v2')
      .select('user_id')
      .eq('role', 'directeur_operations')
      .limit(1)
      .maybeSingle();

    let recipientEmail = 'max.talmi@gmail.com'; // Default fallback

    if (procurementUser?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', procurementUser.user_id)
        .maybeSingle();
      
      if (profile?.email) {
        recipientEmail = profile.email;
      }
    }

    // Also always CC the CEO
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

    // If specific alert ID provided
    if (body.alert_id) {
      const { data: alert } = await supabase
        .from('alertes_systeme')
        .select('*')
        .eq('id', body.alert_id)
        .single();

      if (alert && alert.type_alerte === 'stock_critique') {
        // Get stock info
        let stockInfo: StockInfo | null = null;
        if (alert.reference_id && alert.reference_table === 'stocks') {
          const { data: stock } = await supabase
            .from('stocks')
            .select('materiau, quantite_actuelle, seuil_alerte, unite')
            .eq('id', alert.reference_id)
            .maybeSingle();
          
          stockInfo = stock as StockInfo;
        }

        // Send to both procurement and CEO
        const recipients = new Set([recipientEmail, ceoEmail]);
        for (const email of recipients) {
          await sendCriticalStockEmail(alert as StockAlert, stockInfo, email);
        }

        // Mark alert as notified
        await supabase
          .from('alertes_systeme')
          .update({ lu: true, lu_at: new Date().toISOString() })
          .eq('id', body.alert_id);

        return new Response(JSON.stringify({ success: true, sent: recipients.size }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Process all unread critical stock alerts
    const { data: pendingAlerts } = await supabase
      .from('alertes_systeme')
      .select('*')
      .eq('type_alerte', 'stock_critique')
      .eq('lu', false)
      .order('created_at', { ascending: true })
      .limit(10);

    if (!pendingAlerts || pendingAlerts.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No pending stock alerts' }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let sentCount = 0;
    for (const alert of pendingAlerts) {
      try {
        // Get stock info
        let stockInfo: StockInfo | null = null;
        if (alert.reference_id && alert.reference_table === 'stocks') {
          const { data: stock } = await supabase
            .from('stocks')
            .select('materiau, quantite_actuelle, seuil_alerte, unite')
            .eq('id', alert.reference_id)
            .maybeSingle();
          
          stockInfo = stock as StockInfo;
        }

        // Send to both procurement and CEO
        const recipients = new Set([recipientEmail, ceoEmail]);
        for (const email of recipients) {
          await sendCriticalStockEmail(alert as StockAlert, stockInfo, email);
        }

        // Mark as read
        await supabase
          .from('alertes_systeme')
          .update({ lu: true, lu_at: new Date().toISOString() })
          .eq('id', alert.id);

        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send stock alert email for ${alert.id}:`, emailError);
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error in notify-stock-critique:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
