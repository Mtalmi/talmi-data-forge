import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// French-speaking voice for tutorials - using "Laura" which has great French support
const VOICE_ID = "FGY2WhTYpPnrIDTdsKH5";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    if (!text || text.trim() === "") {
      throw new Error("Text is required");
    }

    console.log("Generating voice for:", text.substring(0, 50) + "...");

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      // ElevenLabs may return 401/403 for free-tier blocks or quota issues.
      // Treat these as a *soft failure* and let the client fall back to browser TTS
      // without surfacing as an app-breaking error.
      const softFailureStatuses = new Set([401, 402, 403, 429]);
      const isSoftFailure = softFailureStatuses.has(response.status);

      if (isSoftFailure) {
        console.warn("ElevenLabs unavailable (soft failure):", response.status, errorText);

        // IMPORTANT: Return a 2xx so the hosting layer doesn't treat it as a runtime error.
        // The client will detect 204 and use browser TTS.
        return new Response(null, {
          status: 204,
          headers: {
            ...corsHeaders,
            "Cache-Control": "no-store",
            "X-TTS-Fallback": "browser",
            "X-TTS-Provider-Status": String(response.status),
          },
        });
      }

      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log("Audio generated successfully, size:", audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Tutorial voice error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
