import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuditReportRequest {
  auditId: string;
  auditPeriod: string;
  siloAppLevel: number;
  siloPhysicalLevel: number;
  siloVariance: number;
  siloVariancePct: string;
  cashAppAmount: number;
  cashPhysicalAmount: number;
  cashVariance: number;
  cashVariancePct: string;
  documentChecks: Array<{ bl_id: string; verified: boolean; notes: string }>;
  verifiedCount: number;
  missingCount: number;
  truckChecks: Array<{ id_camion: string; chauffeur: string; app_km: number; physical_km: number; variance: number }>;
  auditorNotes: string;
  submittedAt: string;
}

const getVarianceColor = (pct: number): string => {
  if (Math.abs(pct) <= 2) return '#10b981'; // green
  if (Math.abs(pct) <= 5) return '#f59e0b'; // amber
  return '#ef4444'; // red
};

const getVarianceStatus = (pct: number): string => {
  if (Math.abs(pct) <= 2) return 'OK';
  if (Math.abs(pct) <= 5) return 'Attention';
  return 'CRITIQUE';
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: AuditReportRequest = await req.json();
    
    const siloVariancePctNum = parseFloat(data.siloVariancePct);
    const cashVariancePctNum = parseFloat(data.cashVariancePct);
    
    const submittedDate = new Date(data.submittedAt).toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    // Generate HTML email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; opacity: 0.9; }
    .content { padding: 24px; }
    .section { margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .section h2 { margin: 0 0 12px; font-size: 16px; color: #1e293b; display: flex; align-items: center; gap: 8px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; }
    .value { font-weight: 600; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .table th, .table td { padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0; }
    .table th { background: #f1f5f9; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .verified { color: #16a34a; }
    .missing { color: #dc2626; }
    .footer { padding: 16px 24px; background: #f1f5f9; text-align: center; color: #64748b; font-size: 12px; }
    .notes { background: #fffbeb; border: 1px solid #fcd34d; padding: 12px; border-radius: 8px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Rapport d'Audit Externe</h1>
      <p>Période: ${data.auditPeriod} | ${submittedDate}</p>
    </div>
    
    <div class="content">
      <!-- Silo Verification -->
      <div class="section" style="border-color: #3b82f6;">
        <h2>🏗️ Vérification Silo Ciment</h2>
        <div class="row">
          <span class="label">Niveau Système</span>
          <span class="value">${data.siloAppLevel.toFixed(2)} T</span>
        </div>
        <div class="row">
          <span class="label">Niveau Physique</span>
          <span class="value">${data.siloPhysicalLevel.toFixed(2)} T</span>
        </div>
        <div class="row">
          <span class="label">Écart</span>
          <span class="value" style="color: ${getVarianceColor(siloVariancePctNum)}">
            ${data.siloVariance.toFixed(2)} T (${data.siloVariancePct}%)
          </span>
        </div>
        <div style="text-align: right; margin-top: 8px;">
          <span class="badge ${siloVariancePctNum <= 2 ? 'badge-green' : siloVariancePctNum <= 5 ? 'badge-amber' : 'badge-red'}">
            ${getVarianceStatus(siloVariancePctNum)}
          </span>
        </div>
      </div>

      <!-- Cash Audit -->
      <div class="section" style="border-color: #10b981;">
        <h2>💰 Audit Caisse</h2>
        <div class="row">
          <span class="label">Montant Système</span>
          <span class="value">${data.cashAppAmount.toLocaleString()} DH</span>
        </div>
        <div class="row">
          <span class="label">Montant Physique</span>
          <span class="value">${data.cashPhysicalAmount.toLocaleString()} DH</span>
        </div>
        <div class="row">
          <span class="label">Écart</span>
          <span class="value" style="color: ${getVarianceColor(cashVariancePctNum)}">
            ${data.cashVariance.toLocaleString()} DH (${data.cashVariancePct}%)
          </span>
        </div>
        <div style="text-align: right; margin-top: 8px;">
          <span class="badge ${cashVariancePctNum <= 2 ? 'badge-green' : cashVariancePctNum <= 5 ? 'badge-amber' : 'badge-red'}">
            ${getVarianceStatus(cashVariancePctNum)}
          </span>
        </div>
      </div>

      <!-- Document Check -->
      <div class="section" style="border-color: #f59e0b;">
        <h2>📄 Vérification Documents (${data.verifiedCount}/${data.documentChecks.length})</h2>
        <table class="table">
          <thead>
            <tr>
              <th>BL ID</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${data.documentChecks.map(doc => `
              <tr>
                <td>${doc.bl_id}</td>
                <td class="${doc.verified ? 'verified' : 'missing'}">
                  ${doc.verified ? '✓ Vérifié' : '✗ Manquant'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Truck Check -->
      <div class="section" style="border-color: #8b5cf6;">
        <h2>🚛 Vérification Compteurs</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Camion</th>
              <th>KM Système</th>
              <th>KM Physique</th>
              <th>Écart</th>
            </tr>
          </thead>
          <tbody>
            ${data.truckChecks.map(truck => `
              <tr>
                <td>${truck.id_camion}</td>
                <td>${truck.app_km.toLocaleString()}</td>
                <td>${truck.physical_km.toLocaleString()}</td>
                <td style="color: ${Math.abs(truck.variance) > 100 ? '#dc2626' : '#16a34a'}">
                  ${truck.variance > 0 ? '+' : ''}${truck.variance} km
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${data.auditorNotes ? `
        <div class="notes">
          <strong>📝 Notes de l'Auditeur:</strong>
          <p style="margin: 8px 0 0; white-space: pre-wrap;">${data.auditorNotes}</p>
        </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>Ce rapport a été généré automatiquement par le Portail Audit Externe - Talmi Béton</p>
      <p>ID Audit: ${data.auditId}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email to CEO using fetch (Resend REST API)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Talmi Béton Audit <onboarding@resend.dev>",
        to: ["max.talmi@gmail.com"],
        subject: `🔍 Rapport Audit Externe - ${data.auditPeriod} | Silo: ${getVarianceStatus(siloVariancePctNum)} | Caisse: ${getVarianceStatus(cashVariancePctNum)}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Audit report email sent:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-audit-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);