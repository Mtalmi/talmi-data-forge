import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeeklyData {
  startDate: string;
  endDate: string;
  totalVolume: number;
  totalCA: number;
  totalCashCollected: number;
  totalCredit: number;
  deliveryCount: number;
  invoiceCount: number;
  unbilledCount: number;
  unbilledAmount: number;
  avgMargin: number;
  topClients: { name: string; volume: number; ca: number }[];
  topFormulas: { formule: string; volume: number }[];
  expenseTotal: number;
  profitEstimate: number;
}

interface TrendData {
  volumeChange: number;
  caChange: number;
  deliveryChange: number;
  marginChange: number;
}

function formatNumber(num: number): string {
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getWeekDates(weeksAgo: number = 0): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday - (weeksAgo * 7));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

async function fetchWeeklyData(supabase: any, startDate: string, endDate: string): Promise<WeeklyData> {
  // Fetch BLs for the week
  const { data: bls, error: blError } = await supabase
    .from('bons_livraison_reels')
    .select(`
      bl_id, client_id, formule_id, volume_m3, prix_vente_m3,
      mode_paiement, statut_paiement, workflow_status, facture_generee,
      marge_brute_pct, cur_reel
    `)
    .gte('date_livraison', startDate)
    .lte('date_livraison', endDate)
    .in('workflow_status', ['livre', 'facture']);

  if (blError) throw blError;
  const entries = bls || [];

  // Fetch client names
  const clientIds = [...new Set(entries.map((e: any) => e.client_id))];
  const { data: clients } = await supabase
    .from('clients')
    .select('client_id, nom_client')
    .in('client_id', clientIds);

  const clientMap = new Map((clients || []).map((c: any) => [c.client_id, c.nom_client]));

  // Calculate totals
  const totalVolume = entries.reduce((sum: number, e: any) => sum + (e.volume_m3 || 0), 0);
  const totalCA = entries.reduce((sum: number, e: any) => sum + ((e.volume_m3 || 0) * (e.prix_vente_m3 || 0)), 0);

  const cashEntries = entries.filter((e: any) => e.mode_paiement === 'especes' && e.statut_paiement === 'Payé');
  const totalCashCollected = cashEntries.reduce((sum: number, e: any) => sum + ((e.volume_m3 || 0) * (e.prix_vente_m3 || 0)), 0);

  const creditEntries = entries.filter((e: any) => e.mode_paiement !== 'especes');
  const totalCredit = creditEntries.reduce((sum: number, e: any) => sum + ((e.volume_m3 || 0) * (e.prix_vente_m3 || 0)), 0);

  const unbilledEntries = entries.filter((e: any) => e.workflow_status === 'livre' && !e.facture_generee);
  const unbilledAmount = unbilledEntries.reduce((sum: number, e: any) => sum + ((e.volume_m3 || 0) * (e.prix_vente_m3 || 0)), 0);

  const marginsWithValue = entries.filter((e: any) => e.marge_brute_pct != null);
  const avgMargin = marginsWithValue.length > 0 
    ? marginsWithValue.reduce((sum: number, e: any) => sum + e.marge_brute_pct, 0) / marginsWithValue.length 
    : 0;

  // Top clients by volume
  const clientVolumes: Record<string, { volume: number; ca: number }> = {};
  entries.forEach((e: any) => {
    const name = clientMap.get(e.client_id) || e.client_id;
    if (!clientVolumes[name]) clientVolumes[name] = { volume: 0, ca: 0 };
    clientVolumes[name].volume += e.volume_m3 || 0;
    clientVolumes[name].ca += (e.volume_m3 || 0) * (e.prix_vente_m3 || 0);
  });
  const topClients = Object.entries(clientVolumes)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  // Top formulas
  const formulaVolumes: Record<string, number> = {};
  entries.forEach((e: any) => {
    formulaVolumes[e.formule_id] = (formulaVolumes[e.formule_id] || 0) + (e.volume_m3 || 0);
  });
  const topFormulas = Object.entries(formulaVolumes)
    .map(([formule, volume]) => ({ formule, volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  // Fetch invoices
  const { data: invoices } = await supabase
    .from('factures')
    .select('facture_id')
    .gte('date_facture', startDate)
    .lte('date_facture', endDate);

  // Fetch expenses
  const { data: expenses } = await supabase
    .from('depenses')
    .select('montant')
    .gte('date_depense', startDate)
    .lte('date_depense', endDate);

  const expenseTotal = (expenses || []).reduce((sum: number, e: any) => sum + (e.montant || 0), 0);

  // Estimate profit (CA - expenses - estimated costs)
  const totalCost = entries.reduce((sum: number, e: any) => sum + ((e.cur_reel || 0) * (e.volume_m3 || 0)), 0);
  const profitEstimate = totalCA - totalCost - expenseTotal;

  return {
    startDate,
    endDate,
    totalVolume,
    totalCA,
    totalCashCollected,
    totalCredit,
    deliveryCount: entries.length,
    invoiceCount: (invoices || []).length,
    unbilledCount: unbilledEntries.length,
    unbilledAmount,
    avgMargin,
    topClients,
    topFormulas,
    expenseTotal,
    profitEstimate,
  };
}

function calculateTrends(thisWeek: WeeklyData, lastWeek: WeeklyData): TrendData {
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    volumeChange: calcChange(thisWeek.totalVolume, lastWeek.totalVolume),
    caChange: calcChange(thisWeek.totalCA, lastWeek.totalCA),
    deliveryChange: calcChange(thisWeek.deliveryCount, lastWeek.deliveryCount),
    marginChange: thisWeek.avgMargin - lastWeek.avgMargin,
  };
}

function getTrendIcon(change: number): string {
  if (change > 5) return '📈';
  if (change < -5) return '📉';
  return '➡️';
}

function getTrendColor(change: number, inverse: boolean = false): string {
  const isPositive = inverse ? change < 0 : change > 0;
  if (Math.abs(change) < 2) return '#6b7280';
  return isPositive ? '#16a34a' : '#dc2626';
}

function generateEmailHtml(thisWeek: WeeklyData, lastWeek: WeeklyData, trends: TrendData): string {
  const clientRows = thisWeek.topClients.map(c => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${c.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(c.volume)} m³</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(c.ca)} DH</td>
    </tr>
  `).join('');

  const formulaRows = thisWeek.topFormulas.map(f => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${f.formule}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(f.volume)} m³</td>
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
        .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 26px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 25px; }
        .date-range { text-align: center; background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
        .stat-card { background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; position: relative; }
        .stat-value { font-size: 24px; font-weight: 700; color: #111; }
        .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-top: 5px; }
        .stat-trend { font-size: 12px; margin-top: 8px; padding: 4px 8px; border-radius: 12px; display: inline-block; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { background: #f3f4f6; padding: 12px 10px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; }
        .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
        .alert-box.success { background: #dcfce7; border-color: #86efac; }
        .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .comparison-card { background: #f9fafb; border-radius: 12px; padding: 20px; }
        .comparison-card h4 { margin: 0 0 15px; font-size: 14px; color: #6b7280; }
        .vs-badge { display: inline-block; background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin: 0 10px; }
        .profit-box { background: ${thisWeek.profitEstimate >= 0 ? '#dcfce7' : '#fee2e2'}; border: 2px solid ${thisWeek.profitEstimate >= 0 ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px; }
        .profit-value { font-size: 32px; font-weight: 700; color: ${thisWeek.profitEstimate >= 0 ? '#16a34a' : '#dc2626'}; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        .btn { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Rapport Hebdomadaire</h1>
          <p>Synthèse de la semaine avec comparatif</p>
        </div>
        
        <div class="content">
          <div class="date-range">
            <strong>${formatDate(thisWeek.startDate)}</strong> → <strong>${formatDate(thisWeek.endDate)}</strong>
          </div>

          <!-- Profit Summary -->
          <div class="profit-box">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">PROFIT ESTIMÉ DE LA SEMAINE</div>
            <div class="profit-value">${thisWeek.profitEstimate >= 0 ? '+' : ''}${formatNumber(thisWeek.profitEstimate)} DH</div>
            <div style="margin-top: 15px; font-size: 13px; color: #6b7280;">
              CA: ${formatNumber(thisWeek.totalCA)} DH | Dépenses: ${formatNumber(thisWeek.expenseTotal)} DH
            </div>
          </div>

          <!-- KPIs with Trends -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${formatNumber(thisWeek.totalVolume)} m³</div>
              <div class="stat-label">Volume Total</div>
              <div class="stat-trend" style="background: ${getTrendColor(trends.volumeChange)}20; color: ${getTrendColor(trends.volumeChange)};">
                ${getTrendIcon(trends.volumeChange)} ${trends.volumeChange >= 0 ? '+' : ''}${trends.volumeChange.toFixed(1)}%
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${formatNumber(thisWeek.totalCA)} DH</div>
              <div class="stat-label">Chiffre d'Affaires</div>
              <div class="stat-trend" style="background: ${getTrendColor(trends.caChange)}20; color: ${getTrendColor(trends.caChange)};">
                ${getTrendIcon(trends.caChange)} ${trends.caChange >= 0 ? '+' : ''}${trends.caChange.toFixed(1)}%
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${thisWeek.deliveryCount}</div>
              <div class="stat-label">Livraisons</div>
              <div class="stat-trend" style="background: ${getTrendColor(trends.deliveryChange)}20; color: ${getTrendColor(trends.deliveryChange)};">
                ${getTrendIcon(trends.deliveryChange)} ${trends.deliveryChange >= 0 ? '+' : ''}${trends.deliveryChange.toFixed(1)}%
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${thisWeek.avgMargin.toFixed(1)}%</div>
              <div class="stat-label">Marge Moyenne</div>
              <div class="stat-trend" style="background: ${getTrendColor(trends.marginChange)}20; color: ${getTrendColor(trends.marginChange)};">
                ${getTrendIcon(trends.marginChange)} ${trends.marginChange >= 0 ? '+' : ''}${trends.marginChange.toFixed(1)}pts
              </div>
            </div>
          </div>

          <!-- Week Comparison -->
          <div class="comparison-grid">
            <div class="comparison-card">
              <h4>💰 Cette Semaine</h4>
              <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Cash encaissé</span>
                  <strong style="color: #16a34a;">${formatNumber(thisWeek.totalCashCollected)} DH</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Crédit émis</span>
                  <strong style="color: #3b82f6;">${formatNumber(thisWeek.totalCredit)} DH</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Factures émises</span>
                  <strong>${thisWeek.invoiceCount}</strong>
                </div>
              </div>
            </div>
            <div class="comparison-card">
              <h4>📅 Semaine Précédente</h4>
              <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Volume</span>
                  <strong>${formatNumber(lastWeek.totalVolume)} m³</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>CA</span>
                  <strong>${formatNumber(lastWeek.totalCA)} DH</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Livraisons</span>
                  <strong>${lastWeek.deliveryCount}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Unbilled Alert -->
          ${thisWeek.unbilledCount > 0 ? `
          <div class="alert-box">
            <h3 style="margin: 0 0 10px; color: #dc2626;">⚠️ ${thisWeek.unbilledCount} BL(s) Non Facturés</h3>
            <p style="margin: 0; color: #7f1d1d;">Montant à risque: <strong>${formatNumber(thisWeek.unbilledAmount)} DH</strong></p>
            <a href="https://talmi-data-forge.lovable.app/ventes" class="btn" style="background: #dc2626;">Générer les Factures →</a>
          </div>
          ` : `
          <div class="alert-box success">
            <p style="margin: 0; color: #166534;"><strong>✅ Tous les BLs ont été facturés cette semaine!</strong></p>
          </div>
          `}

          <!-- Top Clients -->
          <div class="section">
            <div class="section-title">🏆 Top 5 Clients</div>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th style="text-align: right;">Volume</th>
                  <th style="text-align: right;">CA</th>
                </tr>
              </thead>
              <tbody>
                ${clientRows || '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #6b7280;">Aucune donnée</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Top Formulas -->
          <div class="section">
            <div class="section-title">🧪 Formules les Plus Utilisées</div>
            <table>
              <thead>
                <tr>
                  <th>Formule</th>
                  <th style="text-align: right;">Volume</th>
                </tr>
              </thead>
              <tbody>
                ${formulaRows || '<tr><td colspan="2" style="text-align: center; padding: 20px; color: #6b7280;">Aucune donnée</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Quick Links -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://talmi-data-forge.lovable.app/dashboard" class="btn">
              Voir le Dashboard →
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>🏭 TALMI BÉTON - Rapport Hebdomadaire Automatique</strong></p>
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

    // Parse request body for manual trigger
    const body = await req.json().catch(() => ({}));
    const isManual = !!body.manual;

    console.log(`Generating weekly report (manual: ${isManual})`);

    // Get this week and last week dates (for automated runs on Monday, "this week" = last week)
    const thisWeekDates = getWeekDates(1); // Last week (the week that just ended)
    const lastWeekDates = getWeekDates(2); // Week before that

    // If manual, allow override
    const targetDates = body.weekStart && body.weekEnd 
      ? { start: body.weekStart, end: body.weekEnd }
      : thisWeekDates;

    console.log(`Reporting period: ${targetDates.start} to ${targetDates.end}`);

    // Fetch data for both weeks
    const thisWeekData = await fetchWeeklyData(supabase, targetDates.start, targetDates.end);
    const lastWeekData = await fetchWeeklyData(supabase, lastWeekDates.start, lastWeekDates.end);

    // Calculate trends
    const trends = calculateTrends(thisWeekData, lastWeekData);

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

    // Generate and send email
    const html = generateEmailHtml(thisWeekData, lastWeekData, trends);
    const subject = `📊 Rapport Hebdomadaire | ${formatNumber(thisWeekData.totalVolume)}m³ | ${formatNumber(thisWeekData.totalCA)} DH | ${trends.caChange >= 0 ? '📈' : '📉'} ${trends.caChange.toFixed(0)}%`;

    const emailResponse = await resend.emails.send({
      from: "Talmi Béton <onboarding@resend.dev>",
      to: [ceoEmail],
      subject,
      html,
    });

    console.log("Weekly report email sent:", emailResponse);

    // Log the report generation
    await supabase.from('alertes_systeme').insert({
      type_alerte: 'rapport_hebdomadaire',
      niveau: 'info',
      titre: `Rapport Hebdomadaire - ${targetDates.start} à ${targetDates.end}`,
      message: `Rapport envoyé: ${thisWeekData.deliveryCount} livraisons, ${formatNumber(thisWeekData.totalVolume)}m³, ${formatNumber(thisWeekData.totalCA)} DH. Tendance CA: ${trends.caChange >= 0 ? '+' : ''}${trends.caChange.toFixed(1)}%`,
      destinataire_role: 'ceo',
    });

    return new Response(JSON.stringify({ 
      success: true, 
      sent_to: ceoEmail,
      period: `${targetDates.start} to ${targetDates.end}`,
      summary: {
        volume: thisWeekData.totalVolume,
        ca: thisWeekData.totalCA,
        deliveries: thisWeekData.deliveryCount,
        profit: thisWeekData.profitEstimate,
        trends: {
          volume: `${trends.volumeChange >= 0 ? '+' : ''}${trends.volumeChange.toFixed(1)}%`,
          ca: `${trends.caChange >= 0 ? '+' : ''}${trends.caChange.toFixed(1)}%`,
        }
      }
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error in send-weekly-report:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
