import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OverduePayment {
  bl_id: string;
  client_id: string;
  client_nom: string;
  client_email: string;
  date_livraison: string;
  volume_m3: number;
  prix_vente_m3: number;
  prix_livraison_m3: number;
  delai_paiement_jours: number;
  facture_id: string | null;
  days_overdue: number;
  total_ht: number;
  date_echeance: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Starting automated payment reminder process...");

    // Fetch unpaid deliveries
    const { data: bons, error: bonsError } = await supabase
      .from("bons_livraison_reels")
      .select(`
        bl_id,
        client_id,
        date_livraison,
        volume_m3,
        prix_vente_m3,
        prix_livraison_m3,
        statut_paiement,
        facture_id
      `)
      .neq("statut_paiement", "Payé");

    if (bonsError) {
      console.error("Error fetching bons:", bonsError);
      throw bonsError;
    }

    console.log(`Found ${bons?.length || 0} unpaid deliveries`);

    // Fetch clients with email
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("client_id, nom_client, delai_paiement_jours, email");

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
      throw clientsError;
    }

    const clientMap = new Map(clients?.map((c) => [c.client_id, c]));
    const today = new Date();

    // Calculate overdue payments in 31-60 day bucket
    const overduePayments: OverduePayment[] = [];

    for (const bon of bons || []) {
      const client = clientMap.get(bon.client_id);
      if (!client || !client.email) continue;

      const deliveryDate = new Date(bon.date_livraison);
      const delaiJours = client.delai_paiement_jours || 30;
      const dueDate = new Date(deliveryDate);
      dueDate.setDate(dueDate.getDate() + delaiJours);

      const diffTime = today.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Only include payments in 31-60 day bucket
      if (daysOverdue >= 31 && daysOverdue <= 60) {
        const prixVente = bon.prix_vente_m3 || 0;
        const prixLivraison = bon.prix_livraison_m3 || 0;
        const totalHT = bon.volume_m3 * (prixVente + prixLivraison);

        overduePayments.push({
          bl_id: bon.bl_id,
          client_id: bon.client_id,
          client_nom: client.nom_client,
          client_email: client.email,
          date_livraison: bon.date_livraison,
          volume_m3: bon.volume_m3,
          prix_vente_m3: prixVente,
          prix_livraison_m3: prixLivraison,
          delai_paiement_jours: delaiJours,
          facture_id: bon.facture_id,
          days_overdue: daysOverdue,
          total_ht: totalHT,
          date_echeance: dueDate.toISOString().split("T")[0],
        });
      }
    }

    console.log(`Found ${overduePayments.length} payments in 31-60 day bucket`);

    // Group by client to send one email per client
    const clientPayments = new Map<string, OverduePayment[]>();
    for (const payment of overduePayments) {
      const existing = clientPayments.get(payment.client_id) || [];
      existing.push(payment);
      clientPayments.set(payment.client_id, existing);
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Send reminders
    for (const [clientId, payments] of clientPayments) {
      const client = payments[0];
      const totalDue = payments.reduce((sum, p) => sum + p.total_ht, 0);
      const avgDaysOverdue = Math.round(
        payments.reduce((sum, p) => sum + p.days_overdue, 0) / payments.length
      );

      const invoiceList = payments
        .map(
          (p) =>
            `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.facture_id || p.bl_id}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(p.date_echeance).toLocaleDateString("fr-FR")}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${p.total_ht.toLocaleString("fr-FR")} DH</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #dc2626;">${p.days_overdue} jours</td>
            </tr>`
        )
        .join("");

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
            .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
            .invoice-table th { background: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .legal { background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 11px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TALMI BETON</div>
              <p style="margin: 5px 0 0;">⚠️ RAPPEL AUTOMATIQUE DE PAIEMENT</p>
            </div>
            <div class="content">
              <h2>Cher(e) ${client.client_nom},</h2>
              
              <div class="warning-badge">⏰ ${avgDaysOverdue} jours de retard en moyenne</div>
              
              <p>Nous nous permettons de vous rappeler que le règlement des factures ci-dessous reste en attente.</p>
              
              <div class="amount-box">
                <p style="margin: 0; color: #666;">Montant total dû</p>
                <div class="amount">${totalDue.toLocaleString("fr-FR")} DH</div>
              </div>
              
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th>N° Facture/BL</th>
                    <th>Échéance</th>
                    <th style="text-align: right;">Montant</th>
                    <th>Retard</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceList}
                </tbody>
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
              <p style="color: #999; font-size: 10px; margin-top: 15px;">
                Cet email a été envoyé automatiquement par notre système de gestion.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "Talmi Beton <onboarding@resend.dev>",
          to: [client.client_email],
          subject: `⚠️ RAPPEL: ${payments.length} facture(s) impayée(s) - ${totalDue.toLocaleString("fr-FR")} DH`,
          html,
        });

        console.log(`Reminder sent to ${client.client_nom} (${client.client_email}):`, emailResponse);
        sentCount++;

        // Log to alerts table
        await supabase.from("alertes").insert({
          type_alerte: "Rappel Paiement Envoyé",
          message: `Rappel automatique envoyé à ${client.client_nom} pour ${payments.length} facture(s) totalisant ${totalDue.toLocaleString("fr-FR")} DH`,
          priorite: "info",
          destinataires: ["accounting", "ceo"],
        });
      } catch (emailError: any) {
        console.error(`Failed to send reminder to ${client.client_nom}:`, emailError);
        failedCount++;
        errors.push(`${client.client_nom}: ${emailError.message}`);
      }
    }

    const summary = {
      processed: overduePayments.length,
      clientsNotified: sentCount,
      failed: failedCount,
      errors,
      timestamp: new Date().toISOString(),
    };

    console.log("Automated reminder process completed:", summary);

    // Create summary alert if any reminders were sent
    if (sentCount > 0) {
      await supabase.from("alertes").insert({
        type_alerte: "Rappels Automatiques",
        message: `${sentCount} client(s) notifié(s) pour ${overduePayments.length} facture(s) en retard (31-60 jours)`,
        priorite: "info",
        destinataires: ["ceo", "accounting"],
      });
    }

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in auto-payment-reminders function:", error);
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
