import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JournalEntry {
  bl_id: string;
  client_id: string;
  client_name?: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number | null;
  total_ht: number;
  mode_paiement: string | null;
  statut_paiement: string;
  workflow_status: string | null;
  facture_generee: boolean | null;
}

interface DailySummary {
  date: string;
  formattedDate: string;
  totalVolume: number;
  totalCA: number;
  cashCollected: number;
  cashPending: number;
  creditTotal: number;
  deliveryCount: number;
  entries: JournalEntry[];
  unbilledBLs: JournalEntry[];
}

function formatNumber(num: number): string {
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('fr-FR', options);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchDailyData(supabase: any, dateStr: string): Promise<DailySummary> {
  // Fetch all delivered BLs for the date
  const { data: bls, error } = await supabase
    .from('bons_livraison_reels')
    .select(`
      bl_id,
      client_id,
      formule_id,
      volume_m3,
      prix_vente_m3,
      mode_paiement,
      statut_paiement,
      workflow_status,
      facture_generee
    `)
    .eq('date_livraison', dateStr)
    .in('workflow_status', ['livre', 'facture']);

  if (error) {
    console.error('Error fetching BLs:', error);
    throw error;
  }

  const entries: any[] = bls || [];

  // Fetch client names
  const clientIds = [...new Set(entries.map((e: any) => e.client_id))];
  const { data: clients } = await supabase
    .from('clients')
    .select('client_id, nom_client')
    .in('client_id', clientIds);

  const clientMap = new Map((clients || []).map((c: any) => [c.client_id, c.nom_client]));

  // Enrich entries with client names and totals
  const enrichedEntries: JournalEntry[] = entries.map((entry: any) => ({
    ...entry,
    client_name: clientMap.get(entry.client_id) || entry.client_id,
    total_ht: (entry.volume_m3 || 0) * (entry.prix_vente_m3 || 0),
  }));

  // Calculate totals
  const totalVolume = enrichedEntries.reduce((sum, e) => sum + (e.volume_m3 || 0), 0);
  const totalCA = enrichedEntries.reduce((sum, e) => sum + e.total_ht, 0);

  const cashEntries = enrichedEntries.filter(e => e.mode_paiement === 'especes');
  const cashCollected = cashEntries
    .filter(e => e.statut_paiement === 'Payé')
    .reduce((sum, e) => sum + e.total_ht, 0);
  const cashPending = cashEntries
    .filter(e => e.statut_paiement !== 'Payé')
    .reduce((sum, e) => sum + e.total_ht, 0);

  const creditEntries = enrichedEntries.filter(e => e.mode_paiement !== 'especes');
  const creditTotal = creditEntries.reduce((sum, e) => sum + e.total_ht, 0);

  // Find unbilled BLs (Livrée but not Facturée)
  const unbilledBLs = enrichedEntries.filter(e => 
    e.workflow_status === 'livre' && e.facture_generee !== true
  );

  return {
    date: dateStr,
    formattedDate: formatDate(dateStr),
    totalVolume,
    totalCA,
    cashCollected,
    cashPending,
    creditTotal,
    deliveryCount: enrichedEntries.length,
    entries: enrichedEntries,
    unbilledBLs,
  };
}

function generateEmailHtml(summary: DailySummary): string {
  const hasUnbilledBLs = summary.unbilledBLs.length > 0;
  const unbilledTotal = summary.unbilledBLs.reduce((sum, e) => sum + e.total_ht, 0);

  const entriesRows = summary.entries.map(entry => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 13px;">${entry.bl_id}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${entry.client_name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${entry.formule_id}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${entry.volume_m3} m³</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatNumber(entry.total_ht)} DH</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; ${entry.mode_paiement === 'especes' ? 'background: #d1fae5; color: #065f46;' : 'background: #dbeafe; color: #1e40af;'}">
          ${entry.mode_paiement === 'especes' ? '💵 Cash' : '💳 Crédit'}
        </span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; ${entry.statut_paiement === 'Payé' ? 'background: #d1fae5; color: #065f46;' : 'background: #fef3c7; color: #92400e;'}">
          ${entry.statut_paiement === 'Payé' ? '✓ Payé' : '⏳ En Attente'}
        </span>
      </td>
    </tr>
  `).join('');

  const unbilledRows = summary.unbilledBLs.map(entry => `
    <tr style="background: #fef2f2;">
      <td style="padding: 8px; border-bottom: 1px solid #fecaca; font-family: monospace; font-size: 13px;">${entry.bl_id}</td>
      <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${entry.client_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #fecaca; text-align: right;">${entry.volume_m3} m³</td>
      <td style="padding: 8px; border-bottom: 1px solid #fecaca; text-align: right; font-weight: 600;">${formatNumber(entry.total_ht)} DH</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f3f4f6; }
        .container { max-width: 800px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 26px; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 25px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
        .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: 700; color: #111; margin-bottom: 5px; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .stat-card.volume { border-left: 4px solid #3b82f6; }
        .stat-card.cash { border-left: 4px solid #10b981; }
        .stat-card.credit { border-left: 4px solid #8b5cf6; }
        .stat-card.total { border-left: 4px solid #f59e0b; }
        .alert-box { background: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
        .alert-box h3 { color: #dc2626; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
        .section-title { font-size: 18px; font-weight: 600; margin: 25px 0 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { background: #f3f4f6; padding: 12px 10px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #4b5563; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .totals-row { background: #f3f4f6; font-weight: 700; }
        .btn { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Journal Quotidien</h1>
          <p>${summary.formattedDate}</p>
        </div>
        
        <div class="content">
          <!-- KPI Summary -->
          <div class="stats-grid">
            <div class="stat-card volume">
              <div class="stat-value">${formatNumber(summary.totalVolume)} m³</div>
              <div class="stat-label">Volume Coulé</div>
            </div>
            <div class="stat-card cash">
              <div class="stat-value">${formatNumber(summary.cashCollected)} DH</div>
              <div class="stat-label">Cash Encaissé</div>
            </div>
            <div class="stat-card credit">
              <div class="stat-value">${formatNumber(summary.creditTotal)} DH</div>
              <div class="stat-label">Crédit Émis</div>
            </div>
            <div class="stat-card total">
              <div class="stat-value">${formatNumber(summary.totalCA)} DH</div>
              <div class="stat-label">CA Total</div>
            </div>
          </div>
          
          <!-- Unbilled BLs Alert -->
          ${hasUnbilledBLs ? `
          <div class="alert-box">
            <h3>⚠️ ATTENTION: ${summary.unbilledBLs.length} BL(s) Livrés Non Facturés</h3>
            <p style="margin: 0 0 15px; color: #7f1d1d;">
              Montant total à risque: <strong>${formatNumber(unbilledTotal)} DH</strong>
            </p>
            <table style="background: white; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #fecaca;">
                  <th style="padding: 10px;">N° BL</th>
                  <th style="padding: 10px;">Client</th>
                  <th style="padding: 10px; text-align: right;">Volume</th>
                  <th style="padding: 10px; text-align: right;">Montant</th>
                </tr>
              </thead>
              <tbody>
                ${unbilledRows}
              </tbody>
            </table>
            <a href="https://talmi-data-forge.lovable.app/ventes" class="btn" style="background: #dc2626;">
              Générer les Factures →
            </a>
          </div>
          ` : `
          <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 12px; padding: 15px; margin-bottom: 25px; text-align: center;">
            <span style="color: #065f46; font-weight: 600;">✅ Tous les BLs livrés ont été facturés</span>
          </div>
          `}
          
          <!-- Detailed Entries -->
          <h2 class="section-title">📋 Détail des Livraisons (${summary.deliveryCount})</h2>
          ${summary.entries.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>N° BL</th>
                <th>Client</th>
                <th style="text-align: center;">Formule</th>
                <th style="text-align: right;">Volume</th>
                <th style="text-align: right;">Montant HT</th>
                <th style="text-align: center;">Mode</th>
                <th style="text-align: center;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${entriesRows}
              <tr class="totals-row">
                <td colspan="3" style="padding: 12px;">TOTAUX</td>
                <td style="padding: 12px; text-align: right;">${formatNumber(summary.totalVolume)} m³</td>
                <td style="padding: 12px; text-align: right;">${formatNumber(summary.totalCA)} DH</td>
                <td colspan="2" style="padding: 12px; text-align: center; font-size: 12px;">
                  💵 ${formatNumber(summary.cashCollected)} | 💳 ${formatNumber(summary.creditTotal)}
                </td>
              </tr>
            </tbody>
          </table>
          ` : `
          <div style="text-align: center; padding: 30px; color: #6b7280;">
            <p>Aucune livraison terminée pour cette date</p>
          </div>
          `}
          
          <!-- Quick Links -->
          <div style="margin-top: 25px; text-align: center;">
            <a href="https://talmi-data-forge.lovable.app/journal" class="btn">
              Voir le Journal Complet →
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>🏭 TALMI BÉTON - Rapport Automatique</strong></p>
          <p>Généré le ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' })}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional date override
    const body = await req.json().catch(() => ({}));
    
    // Default to yesterday (since this runs at 01:00 AM for previous day)
    let targetDate: Date;
    if (body.date) {
      targetDate = new Date(body.date);
    } else {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
    }
    const dateStr = targetDate.toISOString().split('T')[0];

    console.log(`Generating daily journal report for: ${dateStr}`);

    // Fetch data
    const summary = await fetchDailyData(supabase, dateStr);

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

    // Generate email content
    const html = generateEmailHtml(summary);
    const subject = `📊 Journal Quotidien - ${summary.formattedDate} | ${formatNumber(summary.totalVolume)}m³ | ${formatNumber(summary.totalCA)} DH`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Talmi Béton <onboarding@resend.dev>",
      to: [ceoEmail],
      subject,
      html,
    });

    console.log("Daily journal email sent:", emailResponse);

    // Log the report generation
    await supabase.from('alertes_systeme').insert({
      type_alerte: 'rapport_quotidien',
      niveau: 'info',
      titre: `Journal Quotidien - ${dateStr}`,
      message: `Rapport envoyé: ${summary.deliveryCount} livraisons, ${formatNumber(summary.totalVolume)}m³, ${formatNumber(summary.totalCA)} DH. ${summary.unbilledBLs.length} BL(s) non facturés.`,
      destinataire_role: 'ceo',
    });

    return new Response(JSON.stringify({ 
      success: true, 
      sent_to: ceoEmail,
      date: dateStr,
      summary: {
        deliveries: summary.deliveryCount,
        volume: summary.totalVolume,
        ca: summary.totalCA,
        unbilled: summary.unbilledBLs.length,
      }
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error in send-daily-journal:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
