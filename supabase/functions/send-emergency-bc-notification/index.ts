import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  approval_id: string;
  notification_type: "PRODUCTION_TEAM" | "RESP_TECHNIQUE" | "BOTH";
  bc_id: string;
  recipient_emails?: string[];
}

interface ProductionNotificationData {
  bc_id: string;
  bc_approved_by: string;
  bc_approved_at: string;
  material_type: string;
  material_name: string;
  quantity: number;
  quantity_unit: string;
  delivery_date: string;
  delivery_time_window: string;
  delivery_address: string;
  emergency_reason: string;
  receiving_instructions: {
    unloading_location: string;
    storage_location: string;
    receiving_contact: string;
    special_handling: string;
    documentation_required: string[];
    inspection_by: string;
  };
  crew_alert: {
    crew_size_needed: number;
    estimated_unloading_time_minutes: number;
    equipment_needed: string[];
  };
  action_items: Array<{
    action: string;
    assigned_to: string;
  }>;
}

interface QCNotificationData {
  bc_id: string;
  bc_approved_by: string;
  bc_approved_at: string;
  material_type: string;
  material_name: string;
  quantity: number;
  quantity_unit: string;
  quality_grade: string;
  delivery_date: string;
  delivery_time_window: string;
  emergency_reason: string;
  quality_requirements: {
    specifications: Record<string, any>;
  };
  quality_check_instructions: {
    inspection_urgency: string;
    checks_required: Array<{
      check_name: string;
      description: string;
      estimated_time_minutes: number;
    }>;
    total_estimated_inspection_time_minutes: number;
  };
  documentation_required: Array<{
    doc_name: string;
    required: boolean;
  }>;
  decision_options: Array<{
    decision: string;
    description: string;
  }>;
  time_pressure: string;
}

function generateProductionEmailHtml(data: ProductionNotificationData): string {
  const actionItemsHtml = data.action_items?.map(item => 
    `<li style="margin-bottom: 8px;"><strong>${item.action}</strong> - Assigné à: ${item.assigned_to}</li>`
  ).join('') || '';

  const equipmentHtml = data.crew_alert?.equipment_needed?.map(eq => 
    `<span style="display: inline-block; background: #f0f0f0; padding: 4px 8px; margin: 2px; border-radius: 4px;">${eq}</span>`
  ).join('') || '';

  const docsHtml = data.receiving_instructions?.documentation_required?.map(doc =>
    `<li>${doc}</li>`
  ).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 25px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; }
        .header .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; margin-top: 10px; font-size: 12px; }
        .content { background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 25px; }
        .alert-box { background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
        .info-grid { display: grid; gap: 10px; }
        .info-item { background: #f9fafb; padding: 12px; border-radius: 4px; border-left: 4px solid #f59e0b; }
        .info-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-weight: 600; color: #111; font-size: 14px; margin-top: 2px; }
        .action-list { list-style: none; padding: 0; margin: 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 BC URGENCE APPROUVÉ</h1>
          <div class="badge">ÉQUIPE PRODUCTION</div>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <strong>⚠️ MATÉRIAUX ENTRANTS - PRÉPARATION REQUISE</strong><br>
            <span style="font-size: 14px;">Un BC urgence a été approuvé. Préparez la zone de réception immédiatement.</span>
          </div>
          
          <div class="section">
            <div class="section-title">📋 Informations BC</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Numéro BC</div>
                <div class="info-value" style="font-family: monospace;">${data.bc_id}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Approuvé Par</div>
                <div class="info-value">${data.bc_approved_by}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📦 Détails Matériaux</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Type</div>
                <div class="info-value">${data.material_type} - ${data.material_name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Quantité</div>
                <div class="info-value">${data.quantity} ${data.quantity_unit}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🚚 Livraison</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Date</div>
                <div class="info-value">${data.delivery_date}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Créneau Horaire</div>
                <div class="info-value">${data.delivery_time_window}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Adresse</div>
                <div class="info-value">${data.delivery_address}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📍 Instructions de Réception</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Zone de Déchargement</div>
                <div class="info-value">${data.receiving_instructions?.unloading_location || 'Zone principale'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Zone de Stockage</div>
                <div class="info-value">${data.receiving_instructions?.storage_location || 'À définir'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Contact Réception</div>
                <div class="info-value">${data.receiving_instructions?.receiving_contact || 'Resp. Réception'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Inspection Par</div>
                <div class="info-value">${data.receiving_instructions?.inspection_by || 'Resp. Technique'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">👥 Coordination Équipe</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Personnel Requis</div>
                <div class="info-value">${data.crew_alert?.crew_size_needed || 3} personnes</div>
              </div>
              <div class="info-item">
                <div class="info-label">Temps de Déchargement Estimé</div>
                <div class="info-value">${data.crew_alert?.estimated_unloading_time_minutes || 30} minutes</div>
              </div>
              <div class="info-item">
                <div class="info-label">Équipement Nécessaire</div>
                <div class="info-value">${equipmentHtml || 'Chariot élévateur, Transpalette'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📄 Documentation Requise</div>
            <ul style="margin: 0; padding-left: 20px;">
              ${docsHtml || '<li>Bon de Livraison</li><li>Certificat Qualité</li><li>Facture</li>'}
            </ul>
          </div>

          <div class="section">
            <div class="section-title">✅ Actions Requises</div>
            <ul class="action-list">
              ${actionItemsHtml || `
                <li style="margin-bottom: 8px;"><strong>Préparer zone de réception</strong> - Assigné à: Hassan</li>
                <li style="margin-bottom: 8px;"><strong>Alerter équipe pour déchargement</strong> - Assigné à: Chef d'équipe</li>
                <li style="margin-bottom: 8px;"><strong>Coordonner avec Resp. Technique</strong> - Assigné à: Hassan</li>
              `}
            </ul>
          </div>

          <div class="section" style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b;">
            <strong style="color: #92400e;">⚠️ Raison d'Urgence:</strong>
            <p style="margin: 5px 0 0; color: #92400e;">${data.emergency_reason}</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>TALMI BÉTON - Système de Gestion</strong></p>
          <p>Cet email a été envoyé automatiquement suite à l'approbation d'un BC urgence.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateQCEmailHtml(data: QCNotificationData): string {
  const checksHtml = data.quality_check_instructions?.checks_required?.map(check => `
    <div style="background: #f9fafb; padding: 12px; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #3b82f6;">
      <strong>${check.check_name}</strong> (${check.estimated_time_minutes} min)<br>
      <span style="font-size: 13px; color: #6b7280;">${check.description}</span>
    </div>
  `).join('') || '';

  const docsHtml = data.documentation_required?.map(doc => `
    <li>${doc.doc_name} ${doc.required ? '<span style="color: #dc2626;">*</span>' : ''}</li>
  `).join('') || '';

  const decisionsHtml = data.decision_options?.map(opt => `
    <div style="background: #f9fafb; padding: 10px; border-radius: 4px; margin-bottom: 6px;">
      <strong style="color: ${opt.decision === 'APPROVE' ? '#16a34a' : opt.decision === 'REJECT' ? '#dc2626' : '#f59e0b'};">${opt.decision}</strong>
      <span style="font-size: 13px; color: #6b7280;"> - ${opt.description}</span>
    </div>
  `).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; }
        .header .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; margin-top: 10px; font-size: 12px; }
        .content { background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 25px; }
        .alert-box { background: #eff6ff; border: 2px solid #2563eb; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .urgent-box { background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
        .info-grid { display: grid; gap: 10px; }
        .info-item { background: #f9fafb; padding: 12px; border-radius: 4px; border-left: 4px solid #3b82f6; }
        .info-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-weight: 600; color: #111; font-size: 14px; margin-top: 2px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔬 CONTRÔLE QUALITÉ REQUIS</h1>
          <div class="badge">RESP. TECHNIQUE</div>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <strong>📋 BC URGENCE APPROUVÉ - INSPECTION IMMÉDIATE</strong><br>
            <span style="font-size: 14px;">Préparez-vous pour le contrôle qualité dès l'arrivée des matériaux.</span>
          </div>
          
          <div class="urgent-box">
            <strong style="color: #dc2626;">⏱️ ${data.time_pressure || 'Contrôle qualité doit être terminé sous 45 minutes'}</strong>
          </div>
          
          <div class="section">
            <div class="section-title">📋 Informations BC</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Numéro BC</div>
                <div class="info-value" style="font-family: monospace;">${data.bc_id}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Approuvé Par</div>
                <div class="info-value">${data.bc_approved_by}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📦 Spécifications Matériaux</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Type</div>
                <div class="info-value">${data.material_type} - ${data.material_name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Quantité</div>
                <div class="info-value">${data.quantity} ${data.quantity_unit}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Grade Qualité</div>
                <div class="info-value">${data.quality_grade || 'Standard'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🚚 Livraison</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Date</div>
                <div class="info-value">${data.delivery_date}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Créneau Horaire</div>
                <div class="info-value">${data.delivery_time_window}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🔍 Contrôles Requis (${data.quality_check_instructions?.total_estimated_inspection_time_minutes || 40} min total)</div>
            ${checksHtml || `
              <div style="background: #f9fafb; padding: 12px; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #3b82f6;">
                <strong>Inspection Visuelle</strong> (10 min)<br>
                <span style="font-size: 13px; color: #6b7280;">Vérifier absence de contamination et intégrité emballage</span>
              </div>
              <div style="background: #f9fafb; padding: 12px; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #3b82f6;">
                <strong>Test Affaissement</strong> (15 min)<br>
                <span style="font-size: 13px; color: #6b7280;">Mesurer affaissement au cône d'Abrams</span>
              </div>
              <div style="background: #f9fafb; padding: 12px; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #3b82f6;">
                <strong>Vérification Documentation</strong> (10 min)<br>
                <span style="font-size: 13px; color: #6b7280;">Vérifier tous les certificats et documents</span>
              </div>
            `}
          </div>

          <div class="section">
            <div class="section-title">📄 Documentation Requise</div>
            <ul style="margin: 0; padding-left: 20px;">
              ${docsHtml || `
                <li>Bon de Livraison <span style="color: #dc2626;">*</span></li>
                <li>Certificat Qualité Fournisseur <span style="color: #dc2626;">*</span></li>
                <li>Facture <span style="color: #dc2626;">*</span></li>
                <li>Certificat de Lot</li>
              `}
            </ul>
          </div>

          <div class="section">
            <div class="section-title">🎯 Options de Décision</div>
            ${decisionsHtml || `
              <div style="background: #f9fafb; padding: 10px; border-radius: 4px; margin-bottom: 6px;">
                <strong style="color: #16a34a;">APPROVE</strong>
                <span style="font-size: 13px; color: #6b7280;"> - Matériau conforme - libérer pour production</span>
              </div>
              <div style="background: #f9fafb; padding: 10px; border-radius: 4px; margin-bottom: 6px;">
                <strong style="color: #f59e0b;">HOLD_FOR_RETEST</strong>
                <span style="font-size: 13px; color: #6b7280;"> - Retest nécessaire - en attente</span>
              </div>
              <div style="background: #f9fafb; padding: 10px; border-radius: 4px; margin-bottom: 6px;">
                <strong style="color: #dc2626;">REJECT</strong>
                <span style="font-size: 13px; color: #6b7280;"> - Non conforme - retour fournisseur</span>
              </div>
            `}
          </div>

          <div class="section" style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b;">
            <strong style="color: #92400e;">⚠️ Raison d'Urgence:</strong>
            <p style="margin: 5px 0 0; color: #92400e;">${data.emergency_reason}</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>TALMI BÉTON - Système de Gestion</strong></p>
          <p>Cet email a été envoyé automatiquement suite à l'approbation d'un BC urgence.</p>
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

    const body: NotificationRequest = await req.json();
    
    if (!body.approval_id || !body.bc_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: approval_id, bc_id" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get notification data from the database
    const { data: notifications, error: fetchError } = await supabase
      .from('emergency_bc_notifications')
      .select('*')
      .eq('approval_id', body.approval_id);

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      throw fetchError;
    }

    const results: { production?: any; qc?: any } = {};

    // Get CEO email from secrets
    const ceoEmail = Deno.env.get("CEO_EMAIL") || 'max.talmi@gmail.com';

    for (const notification of notifications || []) {
      const payload = notification.data_fields as Record<string, any>;
      
      if (notification.notification_type === 'PRODUCTION_TEAM' && 
          (body.notification_type === 'PRODUCTION_TEAM' || body.notification_type === 'BOTH')) {
        
        const html = generateProductionEmailHtml(payload as ProductionNotificationData);
        
        // Send to CEO and any specified recipients
        const recipients = [ceoEmail, ...(body.recipient_emails || [])].filter(Boolean);
        
        const emailResponse = await resend.emails.send({
          from: "Talmi Béton <onboarding@resend.dev>",
          to: recipients,
          subject: `🚨 BC URGENCE APPROUVÉ: ${body.bc_id} - Équipe Production`,
          html,
        });

        const emailData = emailResponse.data;

        // Update notification as sent
        await supabase
          .from('emergency_bc_notifications')
          .update({ 
            sent: true, 
            sent_at: new Date().toISOString(),
            sent_via: ['email', 'in_app']
          })
          .eq('id', notification.id);

        results.production = { success: true, emailId: emailData?.id || 'sent' };
      }
      
      if (notification.notification_type === 'RESP_TECHNIQUE' && 
          (body.notification_type === 'RESP_TECHNIQUE' || body.notification_type === 'BOTH')) {
        
        const html = generateQCEmailHtml(payload as QCNotificationData);
        
        // Send to CEO and any specified recipients
        const recipients = [ceoEmail, ...(body.recipient_emails || [])].filter(Boolean);
        
        const qcEmailResponse = await resend.emails.send({
          from: "Talmi Béton <onboarding@resend.dev>",
          to: recipients,
          subject: `🔬 CONTRÔLE QUALITÉ REQUIS: ${body.bc_id} - Resp. Technique`,
          html,
        });

        const qcEmailData = qcEmailResponse.data;

        // Update notification as sent
        await supabase
          .from('emergency_bc_notifications')
          .update({ 
            sent: true, 
            sent_at: new Date().toISOString(),
            sent_via: ['email', 'in_app']
          })
          .eq('id', notification.id);

        results.qc = { success: true, emailId: qcEmailData?.id || 'sent' };
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emergency BC notifications sent",
        results 
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-emergency-bc-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
