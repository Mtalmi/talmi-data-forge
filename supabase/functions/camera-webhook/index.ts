import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret
    const webhookSecret = Deno.env.get('CAMERA_WEBHOOK_SECRET');
    const incomingSecret = req.headers.get('x-webhook-secret');
    
    if (webhookSecret && incomingSecret !== webhookSecret) {
      console.error('Invalid webhook secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    console.log('Camera webhook received:', JSON.stringify(body));

    // Normalize event from various camera formats (Hikvision ISAPI, Dahua, ONVIF, generic)
    const event = normalizeEvent(body);

    // Insert camera event
    const { data: eventData, error: eventError } = await supabase
      .from('camera_events')
      .insert({
        camera_id: event.camera_id || null,
        event_type: event.event_type,
        severity: event.severity,
        description: event.description,
        details: event.details,
        snapshot_url: event.snapshot_url,
        plate_number: event.plate_number,
        zone: event.zone,
      })
      .select()
      .single();

    if (eventError) {
      console.error('Failed to insert camera event:', eventError);
      throw eventError;
    }

    // Auto-actions based on event type
    const autoActions: string[] = [];

    // ANPR: Match plate to fleet vehicle
    if (event.event_type === 'anpr' && event.plate_number) {
      const { data: vehicle } = await supabase
        .from('flotte')
        .select('id_camion, immatriculation')
        .eq('immatriculation', event.plate_number)
        .maybeSingle();

      if (vehicle) {
        await supabase
          .from('camera_events')
          .update({ matched_vehicle_id: vehicle.id_camion })
          .eq('id', eventData.id);

        // Find today's active BL for this vehicle
        const today = new Date().toISOString().split('T')[0];
        const { data: activeBL } = await supabase
          .from('bons_livraison_reels')
          .select('bl_id, workflow_status')
          .eq('camion_assigne', vehicle.id_camion)
          .eq('date_livraison', today)
          .in('workflow_status', ['production', 'en_livraison'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeBL) {
          // Auto-update BL timestamps based on zone
          const updateField = event.zone === 'fleet' 
            ? (event.details?.direction === 'exit' ? 'heure_depart_reelle' : 'heure_retour_centrale')
            : null;

          if (updateField) {
            const now = new Date().toTimeString().slice(0, 5);
            await supabase
              .from('bons_livraison_reels')
              .update({ [updateField]: now })
              .eq('bl_id', activeBL.bl_id);
            
            autoActions.push(`BL ${activeBL.bl_id}: ${updateField} = ${now}`);
          }

          await supabase
            .from('camera_events')
            .update({ matched_bl_id: activeBL.bl_id })
            .eq('id', eventData.id);
        }
      }
    }

    // PPE Violation: Create system alert
    if (event.event_type === 'ppe_violation' && event.severity === 'critical') {
      await supabase.from('alertes_systeme').insert({
        type_alerte: 'securite_camera',
        niveau: 'critical',
        titre: '⚠️ Violation EPI détectée',
        message: event.description,
        reference_id: eventData.id,
        reference_table: 'camera_events',
        dismissible: false,
      });
      autoActions.push('System alert created for PPE violation');
    }

    // Intrusion Detection: Trigger critical alert
    if (event.event_type === 'intrusion') {
      await supabase.from('alertes_systeme').insert({
        type_alerte: 'securite_camera',
        niveau: 'critical',
        titre: '🚨 Intrusion détectée',
        message: `${event.description} — Zone: ${event.zone || 'inconnue'}`,
        reference_id: eventData.id,
        reference_table: 'camera_events',
        dismissible: false,
      });
      autoActions.push('Critical intrusion alert created');
    }

    // Update auto_action_taken
    if (autoActions.length > 0) {
      await supabase
        .from('camera_events')
        .update({ auto_action_taken: autoActions.join('; ') })
        .eq('id', eventData.id);
    }

    return new Response(
      JSON.stringify({ success: true, event_id: eventData.id, auto_actions: autoActions }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Camera webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface NormalizedEvent {
  camera_id?: string;
  event_type: string;
  severity: string;
  description: string;
  details: Record<string, unknown>;
  snapshot_url?: string;
  plate_number?: string;
  zone?: string;
}

function normalizeEvent(body: Record<string, unknown>): NormalizedEvent {
  // Hikvision ISAPI format
  if (body.EventNotificationAlert || body.eventType) {
    const alert = (body.EventNotificationAlert || body) as Record<string, unknown>;
    const eventType = mapHikvisionEventType(String(alert.eventType || ''));
    return {
      camera_id: String(alert.channelID || alert.camera_id || ''),
      event_type: eventType.type,
      severity: eventType.severity,
      description: String(alert.eventDescription || alert.eventType || 'Hikvision event'),
      details: { raw: alert, source: 'hikvision' },
      snapshot_url: alert.pictureURL ? String(alert.pictureURL) : undefined,
      plate_number: alert.ANPR ? String((alert.ANPR as Record<string, unknown>).licensePlate || '') : undefined,
      zone: String(alert.zone || ''),
    };
  }

  // Generic / custom format
  return {
    camera_id: body.camera_id ? String(body.camera_id) : undefined,
    event_type: String(body.event_type || 'unknown'),
    severity: String(body.severity || 'info'),
    description: String(body.description || 'Camera event'),
    details: (body.details as Record<string, unknown>) || { raw: body },
    snapshot_url: body.snapshot_url ? String(body.snapshot_url) : undefined,
    plate_number: body.plate_number ? String(body.plate_number) : undefined,
    zone: body.zone ? String(body.zone) : undefined,
  };
}

function mapHikvisionEventType(type: string): { type: string; severity: string } {
  const mapping: Record<string, { type: string; severity: string }> = {
    ANPR: { type: 'anpr', severity: 'info' },
    linedetection: { type: 'line_crossing', severity: 'warning' },
    fielddetection: { type: 'intrusion', severity: 'critical' },
    regionEntrance: { type: 'zone_entry', severity: 'info' },
    regionExiting: { type: 'zone_exit', severity: 'info' },
    loitering: { type: 'loitering', severity: 'warning' },
    shelterAlarm: { type: 'ppe_violation', severity: 'critical' },
    unattendedBaggage: { type: 'unattended_object', severity: 'warning' },
    attendedBaggage: { type: 'object_removal', severity: 'warning' },
    VMD: { type: 'motion', severity: 'info' },
  };
  return mapping[type] || { type: type.toLowerCase(), severity: 'info' };
}
