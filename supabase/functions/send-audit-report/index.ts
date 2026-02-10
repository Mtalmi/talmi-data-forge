import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SiloCheck {
  silo_id: string;
  materiau: string;
  niveau_app: number;
  niveau_physique: number;
  variance: number;
  variance_pct: number;
}

interface DocumentCheck {
  bl_id: string;
  statut_document: 'present' | 'manquant';
  signature_conforme: boolean;
}

interface TruckCheck {
  id_camion: string;
  chauffeur: string;
  km_app: number;
  km_reel: number;
  variance: number;
  anomaly: boolean;
}

interface AuditReportRequest {
  auditId: string;
  auditPeriod: string;
  siloChecks: SiloCheck[];
  maxSiloVariance: number;
  cashAppAmount: number;
  cashPhysicalAmount: number;
  cashVariance: number;
  cashVariancePct: string;
  cashComment: string;
  documentChecks: DocumentCheck[];
  verifiedCount: number;
  missingCount: number;
  truckChecks: TruckCheck[];
  truckAnomalyDetected: boolean;
  auditorNotes: string;
  complianceScore: number;
  submittedAt: string;
}

const getVarianceColor = (pct: number): string => {
  if (Math.abs(pct) <= 2) return '#10b981';
  if (Math.abs(pct) <= 5) return '#f59e0b';
  return '#ef4444';
};

const getVarianceStatus = (pct: number): string => {
  if (Math.abs(pct) <= 2) return 'OK';
  if (Math.abs(pct) <= 5) return 'Attention';
  return 'CRITIQUE';
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
};

const getScoreGrade = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: AuditReportRequest = await req.json();
    
    // Safe defaults for all array/optional fields
    const siloChecks = data.siloChecks || [];
    const documentChecks = data.documentChecks || [];
    const truckChecks = data.truckChecks || [];
    const complianceScore = data.complianceScore ?? 0;
    const maxSiloVariance = data.maxSiloVariance ?? 0;
    const missingCount = data.missingCount ?? 0;
    const truckAnomalyDetected = data.truckAnomalyDetected ?? false;
    const cashVariancePctNum = parseFloat(data.cashVariancePct || '0');
    const cashAppAmount = data.cashAppAmount ?? 0;
    const cashPhysicalAmount = data.cashPhysicalAmount ?? 0;
    const cashVariance = data.cashVariance ?? 0;
    
    const submittedDate = data.submittedAt 
      ? new Date(data.submittedAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
      : new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });

    // Identify red flags
    const redFlags: string[] = [];
    if (maxSiloVariance > 5) redFlags.push(`Écart silo critique: ${maxSiloVariance.toFixed(1)}%`);
    if (Math.abs(cashVariancePctNum) > 5) redFlags.push(`Écart caisse critique: ${cashVariancePctNum}%`);
    if (missingCount > 0) redFlags.push(`${missingCount} document(s) manquant(s)`);
    if (truckAnomalyDetected) redFlags.push('Anomalie compteur camion détectée');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
    .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 32px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
    .score-badge { background: ${getScoreColor(complianceScore)}; padding: 16px 24px; border-radius: 12px; text-align: center; display: inline-block; }
    .score-value { font-size: 36px; font-weight: 800; line-height: 1; }
    .score-label { font-size: 11px; text-transform: uppercase; opacity: 0.9; margin-top: 4px; }
    .red-flags { background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 16px; margin: 20px; }
    .red-flags h3 { color: #dc2626; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; }
    .red-flags ul { margin: 0; padding-left: 20px; }
    .red-flags li { color: #991b1b; margin-bottom: 6px; font-weight: 500; }
    .content { padding: 24px; }
    .section { margin-bottom: 24px; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 5px solid #3b82f6; }
    .section h2 { margin: 0 0 16px; font-size: 15px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .data-item { text-align: center; padding: 12px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .data-item .label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .data-item .value { font-size: 20px; font-weight: 700; color: #0f172a; }
    .table { width: 100%; border-collapse: collapse; margin-top: 12px; background: white; border-radius: 8px; overflow: hidden; }
    .table th, .table td { padding: 12px; text-align: left; }
    .table th { background: #1e293b; color: white; font-weight: 600; font-size: 11px; text-transform: uppercase; }
    .table td { border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .footer { padding: 20px 24px; background: #f1f5f9; text-align: center; color: #64748b; font-size: 11px; }
    .notes { background: #fefce8; border: 1px solid #fde047; padding: 16px; border-radius: 8px; margin-top: 20px; }
    .notes strong { color: #854d0e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>📋 RAPPORT D'AUDIT</h1>
        <p>Période: ${data.auditPeriod || 'N/A'} | ${submittedDate}</p>
      </div>
      <div class="score-badge">
        <div class="score-value">${complianceScore.toFixed(0)}</div>
        <div class="score-label">Score Compliance (${getScoreGrade(complianceScore)})</div>
      </div>
    </div>
    
    ${redFlags.length > 0 ? `
    <div class="red-flags">
      <h3>🚨 Alertes Critiques</h3>
      <ul>${redFlags.map(flag => `<li>${flag}</li>`).join('')}</ul>
    </div>
    ` : ''}
    
    <div class="content">
      <div class="section" style="border-color: #3b82f6;">
        <h2>🏗️ Section A: Réconciliation Stocks (Silos)</h2>
        ${siloChecks.length > 0 ? `
        <table class="table">
          <thead><tr><th>Matériau</th><th>Niveau App</th><th>Niveau Physique</th><th>Écart</th><th>Statut</th></tr></thead>
          <tbody>
            ${siloChecks.map(silo => `
              <tr>
                <td><strong>${silo.materiau || 'N/A'}</strong></td>
                <td>${(silo.niveau_app ?? 0).toFixed(1)}</td>
                <td>${(silo.niveau_physique ?? 0).toFixed(1)}</td>
                <td style="color: ${getVarianceColor(silo.variance_pct ?? 0)}; font-weight: 600;">
                  ${(silo.variance ?? 0) >= 0 ? '+' : ''}${(silo.variance ?? 0).toFixed(1)} (${(silo.variance_pct ?? 0).toFixed(1)}%)
                </td>
                <td><span class="badge ${Math.abs(silo.variance_pct ?? 0) <= 2 ? 'badge-green' : Math.abs(silo.variance_pct ?? 0) <= 5 ? 'badge-amber' : 'badge-red'}">${getVarianceStatus(silo.variance_pct ?? 0)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p>Aucun contrôle silo soumis.</p>'}
      </div>

      <div class="section" style="border-color: #10b981;">
        <h2>💰 Section B: Audit de Caisse</h2>
        <div class="data-grid">
          <div class="data-item"><div class="label">Solde App</div><div class="value">${cashAppAmount.toLocaleString()} DH</div></div>
          <div class="data-item"><div class="label">Comptage Physique</div><div class="value">${cashPhysicalAmount.toLocaleString()} DH</div></div>
          <div class="data-item"><div class="label">Écart</div><div class="value" style="color: ${getVarianceColor(cashVariancePctNum)}">${cashVariance >= 0 ? '+' : ''}${cashVariance.toLocaleString()} DH</div></div>
        </div>
        ${data.cashComment ? `<div class="notes" style="margin-top: 16px; background: #f0fdf4; border-color: #86efac;"><strong>💬 Commentaire:</strong><p style="margin: 8px 0 0;">${data.cashComment}</p></div>` : ''}
      </div>

      <div class="section" style="border-color: #f59e0b;">
        <h2>📄 Section C: Contrôle Documentaire</h2>
        ${documentChecks.length > 0 ? `
        <table class="table">
          <thead><tr><th>Référence BL</th><th>Statut Document</th><th>Signature Conforme</th><th>Verdict</th></tr></thead>
          <tbody>
            ${documentChecks.map(doc => `
              <tr>
                <td><code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;">${doc.bl_id || 'N/A'}</code></td>
                <td>${doc.statut_document === 'present' ? '✓ Présent' : '✗ Manquant'}</td>
                <td>${doc.signature_conforme ? '✓ Oui' : '✗ Non'}</td>
                <td><span class="badge ${doc.statut_document === 'present' && doc.signature_conforme ? 'badge-green' : 'badge-red'}">${doc.statut_document === 'present' && doc.signature_conforme ? 'CONFORME' : 'NON-CONFORME'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p>Aucun contrôle documentaire soumis.</p>'}
      </div>

      <div class="section" style="border-color: #8b5cf6;">
        <h2>🚛 Section D: Audit Logistique (Compteurs)</h2>
        ${truckChecks.length > 0 ? `
        <table class="table">
          <thead><tr><th>Camion</th><th>Chauffeur</th><th>KM App</th><th>KM Réel</th><th>Écart</th><th>Anomalie</th></tr></thead>
          <tbody>
            ${truckChecks.map(truck => `
              <tr>
                <td><strong>${truck.id_camion || 'N/A'}</strong></td>
                <td>${truck.chauffeur || 'N/A'}</td>
                <td>${(truck.km_app ?? 0).toLocaleString()}</td>
                <td>${(truck.km_reel ?? 0).toLocaleString()}</td>
                <td style="color: ${truck.anomaly ? '#dc2626' : '#16a34a'}; font-weight: 600;">${(truck.variance ?? 0) >= 0 ? '+' : ''}${(truck.variance ?? 0).toLocaleString()} km</td>
                <td><span class="badge ${truck.anomaly ? 'badge-red' : 'badge-green'}">${truck.anomaly ? '⚠️ ANOMALIE' : '✓ OK'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${truckAnomalyDetected ? '<div style="background:#fef2f2; border:2px solid #fecaca; padding:12px; border-radius:8px; margin-top:16px; color:#991b1b; font-weight:600;">⚠️ ALERTE: KM réel inférieur au KM système - Manipulation possible du compteur</div>' : ''}
        ` : '<p>Aucun contrôle logistique soumis.</p>'}
      </div>

      ${data.auditorNotes ? `<div class="notes"><strong>📝 Notes de l'Auditeur:</strong><p style="margin: 8px 0 0; white-space: pre-wrap;">${data.auditorNotes}</p></div>` : ''}
    </div>
    
    <div class="footer">
      <p><strong>Ce rapport est IMMUTABLE et ne peut être modifié.</strong></p>
      <p>Généré automatiquement par le Portail Audit Externe - TBOS (Talmi Béton OS)</p>
      <p>ID Audit: ${data.auditId || 'N/A'}</p>
    </div>
  </div>
</body>
</html>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "TBOS Audit <onboarding@resend.dev>",
        to: ["max.talmi@gmail.com"],
        subject: `🔍 [AUDIT ${data.auditPeriod || 'N/A'}] Score: ${complianceScore.toFixed(0)}% ${redFlags.length > 0 ? '⚠️ ALERTES' : '✓'}`,
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
