import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if Karim already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === "karim.talmi@talmi-beton.ma");

    if (existingUser) {
      // Just ensure role is set
      await supabaseAdmin.from("user_roles_v2").upsert({
        user_id: existingUser.id,
        role: "superviseur",
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ 
        status: "already_exists", 
        user_id: existingUser.id,
        email: "karim.talmi@talmi-beton.ma"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create Karim Talmi as Superviseur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: "karim.talmi@talmi-beton.ma",
      password: "TalmiKarim2024!",
      email_confirm: true,
      user_metadata: { full_name: "Karim Talmi" },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const userId = authData.user.id;

    // Update profile
    await supabaseAdmin.from("profiles").upsert({
      user_id: userId,
      full_name: "Karim Talmi",
      email: "karim.talmi@talmi-beton.ma",
    });

    // Assign superviseur role
    await supabaseAdmin.from("user_roles_v2").insert({
      user_id: userId,
      role: "superviseur",
    });

    return new Response(JSON.stringify({ 
      status: "created",
      user_id: userId,
      email: "karim.talmi@talmi-beton.ma",
      password: "TalmiKarim2024!",
      role: "superviseur"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
