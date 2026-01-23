import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RollbackAlertRequest {
  devisId: string;
  userName: string;
  userRole: string;
  reason: string;
  rollbackNumber: number;
  timestamp: string;
  tableName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      devisId,
      userName,
      userRole,
      reason,
      rollbackNumber,
      timestamp,
      tableName,
    }: RollbackAlertRequest = await req.json();

    // CEO email - in production, this should be fetched from profiles/settings
    const ceoEmail = Deno.env.get("CEO_EMAIL") || "ceo@talmibeton.ma";

    const formattedDate = new Date(timestamp).toLocaleString("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; }
          .alert-header { 
            background: linear-gradient(135deg, #dc2626, #991b1b); 
            color: white; 
            padding: 30px; 
            text-align: center;
          }
          .alert-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 20px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 15px;
          }
          .alert-header h1 { 
            margin: 10px 0 5px; 
            font-size: 26px;
          }
          .alert-header p { margin: 0; opacity: 0.9; font-size: 14px; }
          .content { 
            background: white; 
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .detail-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 12px;
            margin: 20px 0;
          }
          .detail-label {
            font-weight: 600;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            font-weight: 500;
            color: #1a1a1a;
          }
          .reason-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 4px solid #dc2626;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .reason-box h3 {
            margin: 0 0 10px;
            color: #dc2626;
            font-size: 14px;
          }
          .reason-box p {
            margin: 0;
            font-style: italic;
            color: #7f1d1d;
            font-size: 15px;
          }
          .rollback-badge {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 13px;
          }
          .footer { 
            text-align: center; 
            padding: 25px;
            font-size: 11px; 
            color: #666;
            background: #f9fafb;
          }
          .timestamp {
            font-family: monospace;
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
          }
          .action-note {
            background: #fefce8;
            border: 1px solid #fef08a;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert-header">
            <div class="alert-badge">🚨 ALERTE SÉCURITÉ</div>
            <h1>ROLLBACK DEVIS DÉTECTÉ</h1>
            <p>Action de haute priorité nécessitant votre attention</p>
          </div>
          
          <div class="content">
            <p>Madame, Monsieur le CEO,</p>
            <p>Une action de <strong>rollback (annulation d'approbation)</strong> vient d'être exécutée sur le système. Voici les détails :</p>
            
            <div class="detail-grid">
              <div class="detail-label">Document</div>
              <div class="detail-value"><span class="rollback-badge">DEVIS ${devisId}</span></div>
              
              <div class="detail-label">Exécuté par</div>
              <div class="detail-value"><strong>${userName}</strong> (${userRole.toUpperCase()})</div>
              
              <div class="detail-label">Table</div>
              <div class="detail-value">${tableName}</div>
              
              <div class="detail-label">Rollback N°</div>
              <div class="detail-value">#${rollbackNumber}</div>
              
              <div class="detail-label">Date/Heure</div>
              <div class="detail-value"><span class="timestamp">${formattedDate}</span></div>
            </div>
            
            <div class="reason-box">
              <h3>📝 MOTIF DÉCLARÉ</h3>
              <p>"${reason}"</p>
            </div>
            
            <div class="action-note">
              <strong>⚠️ Note :</strong> Cette action a été journalisée dans l'audit forensique. 
              Consultez le <em>Tableau de Bord Sécurité</em> pour plus de détails et l'historique complet.
            </div>
          </div>
          
          <div class="footer">
            <p><strong>TALMI BETON SARL</strong> • Système de Gestion Industrielle</p>
            <p>Cet email est généré automatiquement par le module de sécurité.<br>
            Ne pas répondre à ce message.</p>
            <p style="color: #999; margin-top: 10px;">
              Hash: ${crypto.randomUUID().substring(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Talmi Beton Security <onboarding@resend.dev>",
      to: [ceoEmail],
      subject: `🚨 ALERTE: Rollback Devis ${devisId} - Action ${userName}`,
      html,
    });

    console.log("Rollback alert email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-rollback-alert function:", error);
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
