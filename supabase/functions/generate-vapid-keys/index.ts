const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Generate VAPID keys using Web Crypto API.
 * Returns { publicKey, privateKey } in base64url format.
 * Call once, then store as secrets.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate ECDSA P-256 key pair (used for VAPID)
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

    // Public key: uncompressed point (0x04 || x || y)
    const x = base64urlToUint8Array(publicJwk.x!);
    const y = base64urlToUint8Array(publicJwk.y!);
    const uncompressed = new Uint8Array(65);
    uncompressed[0] = 0x04;
    uncompressed.set(x, 1);
    uncompressed.set(y, 33);
    const publicKeyBase64url = uint8ArrayToBase64url(uncompressed);

    // Private key: just the d parameter
    const privateKeyBase64url = privateJwk.d!;

    return new Response(
      JSON.stringify({
        publicKey: publicKeyBase64url,
        privateKey: privateKeyBase64url,
        instructions: [
          "1. Copy publicKey → add as VAPID_PUBLIC_KEY secret",
          "2. Copy privateKey → add as VAPID_PRIVATE_KEY secret",
          "3. Delete this edge function after use",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  const binary = String.fromCharCode(...arr);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
