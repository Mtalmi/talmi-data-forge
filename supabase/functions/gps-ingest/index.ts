import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface GPSPayload {
  device_id: string;       // Maps to id_camion in flotte
  latitude: number;
  longitude: number;
  speed?: number;          // km/h
  heading?: number;        // degrees 0-360
  fuel_level?: number;     // percentage 0-100
  altitude?: number;       // meters
  accuracy?: number;       // meters
  timestamp?: string;      // ISO 8601 format
}

interface BatchPayload {
  positions: GPSPayload[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key (simple bearer token check)
    const authHeader = req.headers.get('x-api-key') || req.headers.get('authorization');
    const expectedKey = Deno.env.get('GPS_TRACKER_API_KEY');
    
    if (expectedKey && authHeader !== `Bearer ${expectedKey}` && authHeader !== expectedKey) {
      console.error('Invalid API key provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for GPS ingestion
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    
    // Support both single position and batch payloads
    const positions: GPSPayload[] = Array.isArray(body.positions) 
      ? body.positions 
      : [body];

    if (positions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'No positions provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and transform positions
    const validPositions = positions
      .filter(pos => {
        if (!pos.device_id || typeof pos.latitude !== 'number' || typeof pos.longitude !== 'number') {
          console.warn('Invalid position data:', pos);
          return false;
        }
        // Validate coordinate ranges
        if (pos.latitude < -90 || pos.latitude > 90 || pos.longitude < -180 || pos.longitude > 180) {
          console.warn('Coordinates out of range:', pos);
          return false;
        }
        return true;
      })
      .map(pos => ({
        id_camion: pos.device_id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed_kmh: pos.speed ?? 0,
        heading: pos.heading ?? 0,
        fuel_level_pct: pos.fuel_level,
        altitude_m: pos.altitude,
        accuracy_m: pos.accuracy,
        recorded_at: pos.timestamp ? new Date(pos.timestamp).toISOString() : new Date().toISOString(),
      }));

    if (validPositions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'No valid positions after validation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify all trucks exist
    const truckIds = [...new Set(validPositions.map(p => p.id_camion))];
    const { data: existingTrucks, error: truckError } = await supabase
      .from('flotte')
      .select('id_camion')
      .in('id_camion', truckIds);

    if (truckError) {
      console.error('Error checking trucks:', truckError);
      return new Response(
        JSON.stringify({ error: 'Database Error', message: 'Failed to verify trucks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validTruckIds = new Set((existingTrucks || []).map(t => t.id_camion));
    const finalPositions = validPositions.filter(p => validTruckIds.has(p.id_camion));

    if (finalPositions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'No matching trucks found',
          unknown_devices: truckIds.filter(id => !validTruckIds.has(id))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert GPS positions (triggers will handle fleet updates and geofence checks)
    const { data: insertedData, error: insertError } = await supabase
      .from('gps_positions')
      .insert(finalPositions)
      .select('id, id_camion');

    if (insertError) {
      console.error('Error inserting GPS positions:', insertError);
      return new Response(
        JSON.stringify({ error: 'Database Error', message: 'Failed to insert positions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully ingested ${finalPositions.length} GPS positions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Ingested ${finalPositions.length} position(s)`,
        positions_received: positions.length,
        positions_valid: validPositions.length,
        positions_ingested: finalPositions.length,
        skipped_devices: truckIds.filter(id => !validTruckIds.has(id)),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('GPS Ingest Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
