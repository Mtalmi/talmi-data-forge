import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DevisEmailRequest {
  to_email: string;
  to_name: string;
  devis_id: string;
  formule_id: string;
  formule_designation: string;
  volume_m3: number;
  prix_vente_m3: number;
  total_ht: number;
  total_ttc: number;
  date_expiration: string | null;
  client_name: string;
  client_address: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: DevisEmailRequest = await req.json();
    console.log("Sending devis email to:", data.to_email);

    const validityText = data.date_expiration 
      ? `Ce devis est valide jusqu'au ${new Date(data.date_expiration).toLocaleDateString('fr-FR')}.`
      : 'Ce devis est valide pour une durée de 30 jours.';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header { 
            background: linear-gradient(135deg, #f59e0b, #d97706); 
            padding: 30px; 
            border-radius: 10px 10px 0 0; 
            text-align: center; 
          }
          .header h1 { 
            color: white; 
            margin: 0; 
            font-size: 24px; 
          }
          .header p { 
            color: rgba(255,255,255,0.9); 
            margin: 5px 0 0; 
            font-size: 14px; 
          }
          .content { 
            background: #f9fafb; 
            padding: 30px; 
            border: 1px solid #e5e7eb; 
            border-top: none; 
          }
          .devis-box { 
            background: white; 
            border-radius: 10px; 
            padding: 20px; 
            margin: 20px 0; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
          }
          .devis-id { 
            font-size: 20px; 
            font-weight: bold; 
            color: #f59e0b; 
            margin-bottom: 15px; 
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #f3f4f6; 
          }
          .detail-label { 
            color: #6b7280; 
          }
          .detail-value { 
            font-weight: 600; 
          }
          .total { 
            background: #fef3c7; 
            padding: 15px; 
            border-radius: 8px; 
            margin-top: 15px; 
            text-align: center; 
          }
          .total-amount { 
            font-size: 28px; 
            font-weight: bold; 
            color: #f59e0b; 
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #6b7280; 
            font-size: 12px; 
          }
          .cta-button { 
            display: inline-block; 
            background: #f59e0b; 
            color: white; 
            padding: 12px 30px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: 600; 
            margin: 20px 0; 
          }
          .validity { 
            background: #fee2e2; 
            color: #dc2626; 
            padding: 10px; 
            border-radius: 6px; 
            font-size: 13px; 
            text-align: center; 
            margin-top: 15px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TALMI BETON</h1>
          <p>Excellence en Béton Prêt à l'Emploi</p>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${data.to_name}</strong>,</p>
          
          <p>Suite à votre demande, veuillez trouver ci-dessous votre devis pour la fourniture de béton prêt à l'emploi.</p>
          
          <div class="devis-box">
            <div class="devis-id">${data.devis_id}</div>
            
            <div class="detail-row">
              <span class="detail-label">Formule</span>
              <span class="detail-value">${data.formule_id} - ${data.formule_designation}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Volume</span>
              <span class="detail-value">${data.volume_m3} m³</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Prix unitaire</span>
              <span class="detail-value">${data.prix_vente_m3.toLocaleString('fr-FR')} DH/m³</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Total HT</span>
              <span class="detail-value">${data.total_ht.toLocaleString('fr-FR')} DH</span>
            </div>
            
            <div class="total">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">TOTAL TTC</div>
              <div class="total-amount">${data.total_ttc.toLocaleString('fr-FR')} DH</div>
            </div>
            
            <div class="validity">
              ⏰ ${validityText}
            </div>
          </div>
          
          <p>Pour accepter ce devis ou pour toute question, n'hésitez pas à nous contacter.</p>
          
          <p style="margin-top: 20px;">Cordialement,<br><strong>L'équipe TALMI BETON</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>TALMI BETON SARL</strong></p>
          <p>Zone Industrielle - Casablanca</p>
          <p>Tél: +212 5XX XXX XXX | Email: contact@talmibeton.ma</p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "TALMI BETON <onboarding@resend.dev>",
      to: [data.to_email],
      subject: `Devis ${data.devis_id} - TALMI BETON`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending devis email:", error);
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
