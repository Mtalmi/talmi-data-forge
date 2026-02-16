import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Demo account credentials — read-only interactive sandbox
const DEMO_EMAIL = "demo@talmi-beton.ma";
const DEMO_PASSWORD = "DemoTbos2026!Sandbox";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if demo user exists, create if not
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const demoUser = existingUsers?.users?.find((u: any) => u.email === DEMO_EMAIL);

    if (!demoUser) {
      // Create demo user
      const { error: createError } = await adminClient.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Utilisateur Démo", demo_account: true },
      });

      if (createError) {
        console.error("Error creating demo user:", createError);
        return new Response(JSON.stringify({ error: "Failed to create demo account" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      // Create profile for demo user
      const { data: newUser } = await adminClient.auth.admin.listUsers();
      const createdUser = newUser?.users?.find((u: any) => u.email === DEMO_EMAIL);
      if (createdUser) {
        await adminClient.from("user_profiles").upsert({
          id: createdUser.id,
          full_name: "Utilisateur Démo",
          email: DEMO_EMAIL,
          role: "commercial",
        } as any);
      }
    }

    // Sign in as demo user using anon client
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

    if (signInError) {
      return new Response(JSON.stringify({ error: "Demo login failed: " + signInError.message }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      access_token: signInData.session?.access_token,
      refresh_token: signInData.session?.refresh_token,
      expires_in: signInData.session?.expires_in,
      user: {
        id: signInData.user?.id,
        email: signInData.user?.email,
        full_name: "Utilisateur Démo",
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Demo login error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
