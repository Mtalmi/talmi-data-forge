import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DocumentEmailRequest {
  to: string;
  documentType: "devis" | "bc" | "facture";
  documentId: string;
  clientName: string;
  documentSummary?: string;
}

const getDocumentLabel = (type: string) => {
  switch (type) {
    case "devis":
      return "Devis";
    case "bc":
      return "Bon de Commande";
    case "facture":
      return "Facture";
    default:
      return "Document";
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, documentType, documentId, clientName, documentSummary }: DocumentEmailRequest = await req.json();

    const documentLabel = getDocumentLabel(documentType);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-size: 24px; font-weight: bold; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .document-badge { display: inline-block; background: #f59e0b; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
          .summary-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .cta-button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">TALMI BETON</div>
            <p style="margin: 5px 0 0;">Excellence en Béton Prêt à l'Emploi</p>
          </div>
          <div class="content">
            <h2>Bonjour ${clientName},</h2>
            <p>Veuillez trouver ci-dessous les informations concernant votre ${documentLabel.toLowerCase()}.</p>
            
            <div class="document-badge">${documentLabel} N° ${documentId}</div>
            
            ${documentSummary ? `
            <div class="summary-box">
              <h3 style="margin-top: 0;">Résumé</h3>
              <p>${documentSummary}</p>
            </div>
            ` : ''}
            
            <p>Pour toute question concernant ce document, n'hésitez pas à nous contacter.</p>
            
            <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe Talmi Beton</strong></p>
          </div>
          <div class="footer">
            <p><strong>TALMI BETON SARL</strong></p>
            <p>Zone Industrielle - Casablanca<br>Tél: +212 5XX XXX XXX | Email: contact@talmibeton.ma</p>
            <p style="color: #999; font-size: 10px; margin-top: 15px;">
              Cet email a été envoyé automatiquement. Merci de ne pas répondre directement à ce message.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Talmi Beton <onboarding@resend.dev>",
      to: [to],
      subject: `${documentLabel} N° ${documentId} - Talmi Beton`,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-document-email function:", error);
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
