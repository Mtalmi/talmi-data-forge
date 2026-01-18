import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { startOfMonth, endOfMonth, subMonths, format } from "https://esm.sh/date-fns@3.6.0";
import { fr } from "https://esm.sh/date-fns@3.6.0/locale";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MonthlyReportData {
  totalCA: number;
  totalMarge: number;
  avgMargePct: number;
  totalVolume: number;
  totalDepenses: number;
  profitNet: number;
  nbClients: number;
  nbLivraisons: number;
  topClients: { nom_client: string; marge_brute: number; marge_pct: number }[];
  topFormulas: { designation: string; volume: number; marge_brute: number }[];
  monthLabel: string;
}

async function fetchMonthlyData(supabase: any): Promise<MonthlyReportData> {
  const now = new Date();
  const lastMonth = subMonths(now, 1);
  const startDate = startOfMonth(lastMonth);
  const endDate = endOfMonth(lastMonth);
  const monthLabel = format(lastMonth, 'MMMM yyyy', { locale: fr });

  // Fetch factures for last month
  const { data: factures } = await supabase
    .from('factures')
    .select('client_id, formule_id, volume_m3, total_ht, cur_reel, marge_brute_dh')
    .gte('date_facture', format(startDate, 'yyyy-MM-dd'))
    .lte('date_facture', format(endDate, 'yyyy-MM-dd'));

  // Fetch clients
  const { data: clients } = await supabase
    .from('clients')
    .select('client_id, nom_client');

  // Fetch formulas
  const { data: formulas } = await supabase
    .from('formules_theoriques')
    .select('formule_id, designation');

  // Fetch depenses
  const { data: depenses } = await supabase
    .from('depenses')
    .select('montant')
    .gte('date_depense', format(startDate, 'yyyy-MM-dd'))
    .lte('date_depense', format(endDate, 'yyyy-MM-dd'));

  const clientsMap = new Map(clients?.map((c: any) => [c.client_id, c.nom_client]) || []);
  const formulasMap = new Map(formulas?.map((f: any) => [f.formule_id, f.designation]) || []);

  // Calculate totals
  const totalCA = factures?.reduce((s: number, f: any) => s + (f.total_ht || 0), 0) || 0;
  const totalCout = factures?.reduce((s: number, f: any) => s + ((f.cur_reel || 0) * (f.volume_m3 || 0)), 0) || 0;
  const totalMarge = totalCA - totalCout;
  const totalVolume = factures?.reduce((s: number, f: any) => s + (f.volume_m3 || 0), 0) || 0;
  const totalDepenses = depenses?.reduce((s: number, d: any) => s + (d.montant || 0), 0) || 0;

  // Calculate client stats
  const clientStats = new Map<string, { ca: number; cout: number; count: number }>();
  factures?.forEach((f: any) => {
    const existing = clientStats.get(f.client_id) || { ca: 0, cout: 0, count: 0 };
    existing.ca += f.total_ht || 0;
    existing.cout += (f.cur_reel || 0) * (f.volume_m3 || 0);
    existing.count += 1;
    clientStats.set(f.client_id, existing);
  });

  const topClients: { nom_client: string; marge_brute: number; marge_pct: number }[] = Array.from(clientStats.entries())
    .map(([client_id, stats]) => ({
      nom_client: String(clientsMap.get(client_id) || client_id),
      marge_brute: Math.round(stats.ca - stats.cout),
      marge_pct: stats.ca > 0 ? Math.round(((stats.ca - stats.cout) / stats.ca) * 100) : 0,
    }))
    .sort((a, b) => b.marge_brute - a.marge_brute)
    .slice(0, 5);

  // Calculate formula stats
  const formulaStats = new Map<string, { volume: number; ca: number; cout: number }>();
  factures?.forEach((f: any) => {
    const existing = formulaStats.get(f.formule_id) || { volume: 0, ca: 0, cout: 0 };
    existing.volume += f.volume_m3 || 0;
    existing.ca += f.total_ht || 0;
    existing.cout += (f.cur_reel || 0) * (f.volume_m3 || 0);
    formulaStats.set(f.formule_id, existing);
  });

  const topFormulas: { designation: string; volume: number; marge_brute: number }[] = Array.from(formulaStats.entries())
    .map(([formule_id, stats]) => ({
      designation: String(formulasMap.get(formule_id) || formule_id),
      volume: Math.round(stats.volume * 10) / 10,
      marge_brute: Math.round(stats.ca - stats.cout),
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  // Get unique clients
  const uniqueClients = new Set(factures?.map((f: any) => f.client_id) || []);

  return {
    totalCA: Math.round(totalCA),
    totalMarge: Math.round(totalMarge),
    avgMargePct: totalCA > 0 ? Math.round((totalMarge / totalCA) * 100) : 0,
    totalVolume: Math.round(totalVolume * 10) / 10,
    totalDepenses: Math.round(totalDepenses),
    profitNet: Math.round(totalMarge - totalDepenses),
    nbClients: uniqueClients.size,
    nbLivraisons: factures?.length || 0,
    topClients,
    topFormulas,
    monthLabel,
  };
}

function generateEmailHtml(data: MonthlyReportData): string {
  const formatCurrency = (val: number) => val.toLocaleString('fr-FR') + ' DH';

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rapport Mensuel - ${data.monthLabel}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">📊 Rapport Mensuel</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px; text-transform: capitalize;">${data.monthLabel}</p>
        </div>

        <!-- KPI Summary -->
        <div style="padding: 30px;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
            📈 Indicateurs Clés
          </h2>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #0284c7;">
              <p style="color: #64748b; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Chiffre d'Affaires</p>
              <p style="color: #0284c7; margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">${formatCurrency(data.totalCA)}</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #16a34a;">
              <p style="color: #64748b; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Marge Brute</p>
              <p style="color: #16a34a; margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">${formatCurrency(data.totalMarge)}</p>
              <p style="color: #16a34a; margin: 5px 0 0 0; font-size: 14px;">(${data.avgMargePct}%)</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #ca8a04;">
              <p style="color: #64748b; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Volume Total</p>
              <p style="color: #ca8a04; margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">${data.totalVolume} m³</p>
            </div>
            
            <div style="background: linear-gradient(135deg, ${data.profitNet >= 0 ? '#f0fdf4' : '#fef2f2'} 0%, ${data.profitNet >= 0 ? '#dcfce7' : '#fee2e2'} 100%); padding: 20px; border-radius: 12px; border-left: 4px solid ${data.profitNet >= 0 ? '#16a34a' : '#dc2626'};">
              <p style="color: #64748b; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Profit Net</p>
              <p style="color: ${data.profitNet >= 0 ? '#16a34a' : '#dc2626'}; margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">${formatCurrency(data.profitNet)}</p>
            </div>
          </div>

          <!-- Activity Stats -->
          <div style="margin-top: 20px; background: #f8fafc; padding: 15px 20px; border-radius: 12px; display: flex; justify-content: space-around;">
            <div style="text-align: center;">
              <p style="color: #64748b; margin: 0; font-size: 12px;">Livraisons</p>
              <p style="color: #1e293b; margin: 5px 0 0 0; font-size: 20px; font-weight: 700;">${data.nbLivraisons}</p>
            </div>
            <div style="text-align: center;">
              <p style="color: #64748b; margin: 0; font-size: 12px;">Clients Actifs</p>
              <p style="color: #1e293b; margin: 5px 0 0 0; font-size: 20px; font-weight: 700;">${data.nbClients}</p>
            </div>
            <div style="text-align: center;">
              <p style="color: #64748b; margin: 0; font-size: 12px;">Dépenses</p>
              <p style="color: #dc2626; margin: 5px 0 0 0; font-size: 20px; font-weight: 700;">${formatCurrency(data.totalDepenses)}</p>
            </div>
          </div>
        </div>

        <!-- Top Clients -->
        <div style="padding: 0 30px 30px;">
          <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">
            🏆 Top 5 Clients par Marge
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 10px; text-align: left; font-size: 12px; color: #64748b; border-radius: 8px 0 0 8px;">Client</th>
                <th style="padding: 10px; text-align: right; font-size: 12px; color: #64748b;">Marge</th>
                <th style="padding: 10px; text-align: right; font-size: 12px; color: #64748b; border-radius: 0 8px 8px 0;">%</th>
              </tr>
            </thead>
            <tbody>
              ${data.topClients.map((client, idx) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px 10px; font-size: 14px; color: #1e293b;">
                    <span style="display: inline-block; width: 24px; height: 24px; background: ${idx === 0 ? '#fbbf24' : idx === 1 ? '#9ca3af' : idx === 2 ? '#b45309' : '#e2e8f0'}; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; color: ${idx < 3 ? 'white' : '#64748b'}; margin-right: 8px;">${idx + 1}</span>
                    ${client.nom_client}
                  </td>
                  <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #16a34a; font-weight: 600;">${formatCurrency(client.marge_brute)}</td>
                  <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #64748b;">${client.marge_pct}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Top Formulas -->
        <div style="padding: 0 30px 30px;">
          <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">
            🧪 Top 5 Formules par Volume
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 10px; text-align: left; font-size: 12px; color: #64748b; border-radius: 8px 0 0 8px;">Formule</th>
                <th style="padding: 10px; text-align: right; font-size: 12px; color: #64748b;">Volume</th>
                <th style="padding: 10px; text-align: right; font-size: 12px; color: #64748b; border-radius: 0 8px 8px 0;">Marge</th>
              </tr>
            </thead>
            <tbody>
              ${data.topFormulas.map((formula, idx) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px 10px; font-size: 14px; color: #1e293b;">
                    <span style="display: inline-block; width: 24px; height: 24px; background: #3b82f6; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; color: white; margin-right: 8px;">${idx + 1}</span>
                    ${formula.designation}
                  </td>
                  <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #ca8a04; font-weight: 600;">${formula.volume} m³</td>
                  <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #16a34a;">${formatCurrency(formula.marge_brute)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #64748b; margin: 0; font-size: 12px;">
            Ce rapport a été généré automatiquement par BetonFlow ERP
          </p>
          <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 11px;">
            © ${new Date().getFullYear()} BetonFlow - Centrale à Béton
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting monthly report generation...");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for optional CEO email override
    let ceoEmail = "ceo@betonflow.ma"; // Default CEO email
    try {
      const body = await req.json();
      if (body.ceoEmail) {
        ceoEmail = body.ceoEmail;
      }
    } catch {
      // No body provided, use default
    }

    // Fetch monthly data
    console.log("Fetching monthly data...");
    const reportData = await fetchMonthlyData(supabase);
    console.log("Data fetched:", reportData);

    // Generate email HTML
    const emailHtml = generateEmailHtml(reportData);

    // Send email
    console.log(`Sending email to ${ceoEmail}...`);
    const emailResponse = await resend.emails.send({
      from: "BetonFlow ERP <onboarding@resend.dev>",
      to: [ceoEmail],
      subject: `📊 Rapport Mensuel BetonFlow - ${reportData.monthLabel}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Rapport mensuel envoyé à ${ceoEmail}`,
        data: {
          monthLabel: reportData.monthLabel,
          totalCA: reportData.totalCA,
          profitNet: reportData.profitNet,
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-monthly-report function:", error);
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
