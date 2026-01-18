import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentReminderRequest {
  to: string;
  clientName: string;
  factureId: string;
  montantDu: number;
  dateEcheance: string;
  joursRetard: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, clientName, factureId, montantDu, dateEcheance, joursRetard }: PaymentReminderRequest = await req.json();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-size: 24px; font-weight: bold; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .warning-badge { display: inline-block; background: #fef3c7; color: #b45309; padding: 8px 16px; border-radius: 8px; font-weight: bold; margin: 15px 0; border: 1px solid #f59e0b; }
          .amount-box { background: #fee2e2; padding: 20px; border-radius: 8px; border: 2px solid #dc2626; margin: 20px 0; text-align: center; }
          .amount { font-size: 32px; font-weight: bold; color: #dc2626; }
          .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .details-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .details-table td:first-child { color: #666; }
          .details-table td:last-child { font-weight: bold; text-align: right; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .legal { background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 11px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">TALMI BETON</div>
            <p style="margin: 5px 0 0;">⚠️ RAPPEL DE PAIEMENT</p>
          </div>
          <div class="content">
            <h2>Cher(e) ${clientName},</h2>
            
            <div class="warning-badge">⏰ ${joursRetard} jours de retard</div>
            
            <p>Nous nous permettons de vous rappeler que le règlement de la facture ci-dessous reste en attente.</p>
            
            <div class="amount-box">
              <p style="margin: 0; color: #666;">Montant dû</p>
              <div class="amount">${montantDu.toLocaleString('fr-FR')} DH</div>
            </div>
            
            <table class="details-table">
              <tr>
                <td>Numéro de facture</td>
                <td>${factureId}</td>
              </tr>
              <tr>
                <td>Date d'échéance</td>
                <td>${new Date(dateEcheance).toLocaleDateString('fr-FR')}</td>
              </tr>
              <tr>
                <td>Retard</td>
                <td style="color: #dc2626;">${joursRetard} jours</td>
              </tr>
            </table>
            
            <p>Nous vous prions de bien vouloir procéder au règlement dans les plus brefs délais.</p>
            
            <p>Si vous avez déjà effectué ce paiement, veuillez ignorer ce message et nous en excuser.</p>
            
            <div class="legal">
              <strong>Mention légale:</strong> Conformément à la loi marocaine 32-10 relative aux délais de paiement, 
              des pénalités de retard pourront être appliquées. En cas de non-règlement, nous nous réservons le droit 
              de suspendre toute nouvelle livraison et d'engager des poursuites judiciaires.
            </div>
            
            <p style="margin-top: 30px;">Cordialement,<br><strong>Le Service Comptabilité<br>Talmi Beton</strong></p>
          </div>
          <div class="footer">
            <p><strong>TALMI BETON SARL</strong></p>
            <p>Zone Industrielle - Casablanca<br>Tél: +212 5XX XXX XXX | Email: comptabilite@talmibeton.ma</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Talmi Beton <onboarding@resend.dev>",
      to: [to],
      subject: `⚠️ RAPPEL: Facture ${factureId} impayée - ${joursRetard} jours de retard`,
      html,
    });

    console.log("Payment reminder sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-payment-reminder function:", error);
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
