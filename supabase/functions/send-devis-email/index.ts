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
  include_cgv?: boolean;
  full_cgv?: boolean;
}

// CGV Content - Short Version (7 Golden Rules)
const CGV_SHORT_HTML = `
  <div style="margin-top: 40px; padding: 25px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #f59e0b;">
    <h3 style="color: #333; margin: 0 0 20px 0; font-size: 16px; text-align: center;">
      📋 CONDITIONS GÉNÉRALES DE VENTE
    </h3>
    <p style="text-align: center; color: #666; font-style: italic; margin-bottom: 20px; font-size: 13px;">
      Les 7 Règles d'Or
    </p>
    <ol style="color: #555; font-size: 12px; line-height: 1.8; padding-left: 20px; margin: 0;">
      <li style="margin-bottom: 10px;">
        <strong style="color: #333;">Validité:</strong> Devis valable 30 jours.
      </li>
      <li style="margin-bottom: 10px;">
        <strong style="color: #333;">Accès:</strong> Le client garantit un accès sécurisé pour nos camions.
      </li>
      <li style="margin-bottom: 10px;">
        <strong style="color: #333;">Attente:</strong> 30 min gratuites, puis facturation des frais d'attente au-delà.
      </li>
      <li style="margin-bottom: 10px;">
        <strong style="color: #333;">Qualité:</strong> Responsabilité limitée à la livraison à la goulotte.
      </li>
      <li style="margin-bottom: 10px;">
        <strong style="color: #333;">Eau:</strong> Toute adjonction d'eau sur site annule la garantie de résistance.
      </li>
      <li style="margin-bottom: 10px;">
        <strong style="color: #333;">Paiement:</strong> Paiement selon les délais convenus; pénalités en cas de retard (Loi 32-10).
      </li>
      <li style="margin-bottom: 10px;">
        <strong style="color: #333;">Litiges:</strong> Compétence exclusive des tribunaux de Casablanca.
      </li>
    </ol>
  </div>
`;

// CGV Content - Full Version (5 Articles)
const CGV_FULL_HTML = `
  <div style="margin-top: 40px; padding: 25px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #f59e0b;">
    <h3 style="color: #333; margin: 0 0 25px 0; font-size: 16px; text-align: center; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
      📋 CONDITIONS GÉNÉRALES DE VENTE
    </h3>
    
    <div style="margin-bottom: 20px;">
      <h4 style="color: #f59e0b; font-size: 13px; margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        Article 1 - Commande
      </h4>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        1.1. Toute commande implique l'acceptation sans réserve des présentes conditions générales de vente.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        1.2. Les commandes doivent être passées au minimum 24 heures avant la date de livraison souhaitée.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        1.3. Toute modification ou annulation de commande doit être notifiée au moins 24 heures avant la livraison prévue. En cas de non-respect, 50% du montant de la commande sera facturé.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0; text-align: justify;">
        1.4. La quantité minimale par livraison est de 2 m³.
      </p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h4 style="color: #f59e0b; font-size: 13px; margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        Article 2 - Livraison
      </h4>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        2.1. La livraison est gratuite dans un rayon de 20 km. Au-delà, un supplément de 5 DH/m³/km sera appliqué.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        2.2. Le client garantit un accès libre et sécurisé au chantier pour nos véhicules de livraison.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        2.3. Les 30 premières minutes d'attente sur site sont gratuites. Au-delà, des frais d'immobilisation de 100 DH par tranche de 15 minutes seront appliqués.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        2.4. Le client doit s'assurer de la présence d'une personne habilitée pour réceptionner la livraison.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0; text-align: justify;">
        2.5. TALMI BETON décline toute responsabilité en cas d'accident survenant sur le chantier du fait de conditions d'accès inadaptées.
      </p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h4 style="color: #f59e0b; font-size: 13px; margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        Article 3 - Qualité
      </h4>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        3.1. Le béton livré est conforme aux normes marocaines NM 10.1.008 en vigueur.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        3.2. La responsabilité de TALMI BETON est limitée à la livraison du béton à la goulotte du camion malaxeur.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        <strong>3.3. IMPORTANT:</strong> Toute adjonction d'eau sur site par le client ou ses préposés annule automatiquement la garantie de résistance du béton.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        3.4. Les échantillons de contrôle doivent être prélevés à la goulotte en présence du chauffeur.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0; text-align: justify;">
        3.5. Toute réclamation relative à la qualité doit être formulée par écrit dans les 48 heures suivant la livraison.
      </p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h4 style="color: #f59e0b; font-size: 13px; margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        Article 4 - Paiement
      </h4>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        4.1. Les paiements doivent être effectués selon les délais convenus sur le bon de commande.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        4.2. Conformément à la loi 32-10 relative aux délais de paiement, tout retard de paiement entraînera:
      </p>
      <ul style="color: #555; font-size: 11px; line-height: 1.6; margin: 5px 0; padding-left: 20px;">
        <li>Des pénalités de retard au taux de 1,5% par mois de retard</li>
        <li>Une indemnité forfaitaire pour frais de recouvrement</li>
      </ul>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        4.3. TALMI BETON se réserve le droit de suspendre toute livraison en cas de dépassement de l'encours autorisé.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0; text-align: justify;">
        4.4. Les factures sont payables par virement bancaire ou chèque certifié.
      </p>
    </div>
    
    <div>
      <h4 style="color: #f59e0b; font-size: 13px; margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        Article 5 - Juridiction
      </h4>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0 0 5px 0; text-align: justify;">
        5.1. Les présentes conditions sont soumises au droit marocain.
      </p>
      <p style="color: #555; font-size: 11px; line-height: 1.6; margin: 0; text-align: justify;">
        5.2. En cas de litige relatif à l'interprétation ou l'exécution des présentes, et à défaut de règlement amiable, compétence exclusive est attribuée aux tribunaux de Casablanca.
      </p>
    </div>
  </div>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: DevisEmailRequest = await req.json();
    console.log("Sending devis email to:", data.to_email);
    console.log("Include CGV:", data.include_cgv, "Full CGV:", data.full_cgv);

    const validityText = data.date_expiration 
      ? `Ce devis est valide jusqu'au ${new Date(data.date_expiration).toLocaleDateString('fr-FR')}.`
      : 'Ce devis est valide pour une durée de 30 jours.';

    // Determine which CGV to include
    let cgvHtml = '';
    if (data.include_cgv !== false) { // Default to true if not specified
      cgvHtml = data.full_cgv ? CGV_FULL_HTML : CGV_SHORT_HTML;
    }

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
            max-width: 650px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f5f5f5;
          }
          .email-container {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #f59e0b, #d97706); 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 { 
            color: white; 
            margin: 0; 
            font-size: 28px; 
            letter-spacing: 2px;
          }
          .header p { 
            color: rgba(255,255,255,0.9); 
            margin: 5px 0 0; 
            font-size: 14px; 
          }
          .content { 
            padding: 30px; 
          }
          .devis-box { 
            background: #fefce8; 
            border-radius: 10px; 
            padding: 25px; 
            margin: 25px 0; 
            border: 1px solid #fde68a;
          }
          .devis-id { 
            font-size: 22px; 
            font-weight: bold; 
            color: #f59e0b; 
            margin-bottom: 20px;
            text-align: center;
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 12px 0; 
            border-bottom: 1px solid #fef3c7; 
          }
          .detail-row:last-of-type {
            border-bottom: none;
          }
          .detail-label { 
            color: #6b7280; 
            font-size: 14px;
          }
          .detail-value { 
            font-weight: 600; 
            font-size: 14px;
            color: #333;
          }
          .total { 
            background: #f59e0b; 
            padding: 20px; 
            border-radius: 8px; 
            margin-top: 20px; 
            text-align: center; 
          }
          .total-label {
            font-size: 12px; 
            color: rgba(255,255,255,0.9); 
            margin-bottom: 5px;
          }
          .total-amount { 
            font-size: 32px; 
            font-weight: bold; 
            color: white; 
          }
          .validity { 
            background: #fef2f2; 
            color: #dc2626; 
            padding: 12px; 
            border-radius: 6px; 
            font-size: 13px; 
            text-align: center; 
            margin-top: 20px;
            border: 1px solid #fecaca;
          }
          .footer { 
            text-align: center; 
            padding: 25px; 
            background: #f9fafb;
            color: #6b7280; 
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
          }
          .footer strong {
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>TALMI BETON</h1>
            <p>Excellence en Béton Prêt à l'Emploi</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">Bonjour <strong>${data.to_name}</strong>,</p>
            
            <p>Suite à votre demande, veuillez trouver ci-dessous votre devis pour la fourniture de béton prêt à l'emploi.</p>
            
            <div class="devis-box">
              <div class="devis-id">📋 ${data.devis_id}</div>
              
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
                <div class="total-label">TOTAL TTC (TVA 20%)</div>
                <div class="total-amount">${data.total_ttc.toLocaleString('fr-FR')} DH</div>
              </div>
              
              <div class="validity">
                ⏰ ${validityText}
              </div>
            </div>
            
            <p>Pour accepter ce devis ou pour toute question, n'hésitez pas à nous contacter par téléphone ou par email.</p>
            
            <p style="margin-top: 25px;">Cordialement,<br><strong>L'équipe TALMI BETON</strong></p>
            
            ${cgvHtml}
          </div>
          
          <div class="footer">
            <p><strong>TALMI BETON SARL</strong></p>
            <p>Zone Industrielle - Casablanca</p>
            <p>Tél: +212 5XX XXX XXX | Email: contact@talmibeton.ma</p>
          </div>
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
