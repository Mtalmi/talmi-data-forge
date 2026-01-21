import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Invoice payment reminder
interface PaymentReminderRequest {
  type: 'facture_reminder';
  to: string;
  clientName: string;
  factureId: string;
  montantDu: number;
  dateEcheance: string;
  joursRetard: number;
}

// Devis follow-up reminder
interface DevisReminderRequest {
  type: 'devis_reminder';
  devis_id: string;
  client_id: string;
  custom_message?: string;
}

type ReminderRequest = PaymentReminderRequest | DevisReminderRequest;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ReminderRequest = await req.json();

    // Handle devis reminder
    if (body.type === 'devis_reminder') {
      return await handleDevisReminder(body);
    }

    // Handle facture reminder (legacy format support)
    const { to, clientName, factureId, montantDu, dateEcheance, joursRetard } = body as PaymentReminderRequest;

    const html = generateInvoiceReminderHtml(clientName, factureId, montantDu, dateEcheance, joursRetard);

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

async function handleDevisReminder(request: DevisReminderRequest): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch devis details
  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select('*, client:clients(*)')
    .eq('devis_id', request.devis_id)
    .single();

  if (devisError || !devis) {
    console.error("Devis not found:", devisError);
    return new Response(
      JSON.stringify({ error: "Devis not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const client = devis.client;
  if (!client?.email) {
    console.error("Client email not found");
    return new Response(
      JSON.stringify({ error: "Client email not configured" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const expirationDate = devis.date_expiration 
    ? new Date(devis.date_expiration).toLocaleDateString('fr-FR')
    : 'Non spécifiée';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .logo { font-size: 24px; font-weight: bold; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .quote-box { background: white; padding: 20px; border-radius: 8px; border: 2px solid #3b82f6; margin: 20px 0; }
        .amount { font-size: 28px; font-weight: bold; color: #1e40af; text-align: center; margin: 15px 0; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .details-table td:first-child { color: #666; }
        .details-table td:last-child { font-weight: bold; text-align: right; }
        .cta-button { display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .custom-message { background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TALMI BETON</div>
          <p style="margin: 5px 0 0;">📋 Rappel de Devis</p>
        </div>
        <div class="content">
          <h2>Cher(e) ${client.nom_client},</h2>
          
          <p>Nous revenons vers vous concernant notre devis qui reste en attente de votre validation.</p>
          
          ${request.custom_message ? `
          <div class="custom-message">
            ${request.custom_message}
          </div>
          ` : ''}
          
          <div class="quote-box">
            <table class="details-table">
              <tr>
                <td>Numéro de devis</td>
                <td>${devis.devis_id}</td>
              </tr>
              <tr>
                <td>Formule</td>
                <td>${devis.formule_id}</td>
              </tr>
              <tr>
                <td>Volume</td>
                <td>${devis.volume_m3} m³</td>
              </tr>
              <tr>
                <td>Prix unitaire</td>
                <td>${devis.prix_vente_m3?.toLocaleString('fr-FR') || 'N/A'} DH/m³</td>
              </tr>
            </table>
            
            <div class="amount">
              Total HT: ${devis.total_ht?.toLocaleString('fr-FR')} DH
            </div>
            
            <p style="text-align: center; color: #666; font-size: 14px;">
              Validité: ${expirationDate}
            </p>
          </div>
          
          <p>N'hésitez pas à nous contacter pour toute question ou pour finaliser votre commande.</p>
          
          <p style="text-align: center;">
            <a href="mailto:commercial@talmibeton.ma?subject=Re: Devis ${devis.devis_id}" class="cta-button">
              Répondre à ce devis
            </a>
          </p>
          
          <p style="margin-top: 30px;">Cordialement,<br><strong>L'Équipe Commerciale<br>Talmi Beton</strong></p>
        </div>
        <div class="footer">
          <p><strong>TALMI BETON SARL</strong></p>
          <p>Zone Industrielle - Casablanca<br>Tél: +212 5XX XXX XXX | Email: commercial@talmibeton.ma</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailResponse = await resend.emails.send({
    from: "Talmi Beton <onboarding@resend.dev>",
    to: [client.email],
    subject: `📋 Rappel: Votre devis ${devis.devis_id} est en attente`,
    html,
  });

  console.log("Devis reminder sent successfully:", emailResponse);

  return new Response(JSON.stringify(emailResponse), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function generateInvoiceReminderHtml(
  clientName: string,
  factureId: string,
  montantDu: number,
  dateEcheance: string,
  joursRetard: number
): string {
  return `
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
}

serve(handler);
