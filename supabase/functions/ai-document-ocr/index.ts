import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OCRResult {
  success: boolean;
  data?: {
    date: string | null;
    supplier: string | null;
    amount: number | null;
    bl_number: string | null;
    items?: Array<{ description: string; quantity?: number; unit?: string }>;
    confidence: number;
    raw_text?: string;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url, document_type } = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ success: false, error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Convert image URL to base64 data URL for AI gateway compatibility
    let imageDataUrl: string;
    try {
      const imageResponse = await fetch(image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      
      const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = btoa(
        new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      imageDataUrl = `data:${contentType};base64,${base64Image}`;
      
      console.log("Image converted to data URL, content-type:", contentType, "size:", imageBuffer.byteLength);
    } catch (fetchError) {
      console.error("Error fetching image:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch image from URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt based on document type
    const docTypeLabel = document_type === 'expense' ? 'facture/reçu' : 'bon de livraison';
    
    const systemPrompt = `Tu es un système OCR expert spécialisé dans l'extraction de données de documents commerciaux marocains (${docTypeLabel}).

INSTRUCTIONS STRICTES:
1. Analyse l'image avec précision
2. Extrait les données suivantes en priorité:
   - DATE: Format YYYY-MM-DD (cherche les dates au format JJ/MM/AAAA, JJ-MM-AAAA, ou écrites)
   - FOURNISSEUR: Nom de l'entreprise/fournisseur (en-tête, tampon, signature)
   - MONTANT_TOTAL: Le montant total TTC en MAD (nombre décimal, sans devise)
   - NUMERO_BL: Numéro du bon de livraison ou de la facture
   - ARTICLES: Liste des articles/lignes avec description et quantité si disponible

3. Évalue ta confiance de 0 à 100 basée sur:
   - Clarté de l'image
   - Lisibilité du texte
   - Cohérence des données extraites

4. Si un champ n'est pas lisible, retourne null pour ce champ
5. Ne jamais inventer de données - sois honnête sur ce que tu peux lire`;

    const userPrompt = `Analyse ce document (${docTypeLabel}) et extrait les informations structurées.

IMPORTANT: Réponds UNIQUEMENT avec l'appel de fonction, pas de texte.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_document_data",
              description: "Extrait les données structurées d'un document commercial",
              parameters: {
                type: "object",
                properties: {
                  date: {
                    type: "string",
                    description: "Date du document au format YYYY-MM-DD, ou null si non lisible",
                  },
                  supplier: {
                    type: "string",
                    description: "Nom du fournisseur/entreprise, ou null si non lisible",
                  },
                  amount: {
                    type: "number",
                    description: "Montant total TTC en MAD (nombre décimal), ou null si non lisible",
                  },
                  bl_number: {
                    type: "string",
                    description: "Numéro du bon de livraison ou facture, ou null si non lisible",
                  },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        quantity: { type: "number" },
                        unit: { type: "string" },
                      },
                      required: ["description"],
                    },
                    description: "Liste des articles/lignes du document",
                  },
                  confidence: {
                    type: "number",
                    description: "Score de confiance de 0 à 100 basé sur la qualité de l'extraction",
                  },
                  raw_text: {
                    type: "string",
                    description: "Texte brut extrait du document pour vérification",
                  },
                },
                required: ["confidence"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_document_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits depleted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Extract the function call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_document_data") {
      throw new Error("Invalid AI response format");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    const result: OCRResult = {
      success: true,
      data: {
        date: extractedData.date || null,
        supplier: extractedData.supplier || null,
        amount: extractedData.amount || null,
        bl_number: extractedData.bl_number || null,
        items: extractedData.items || [],
        confidence: extractedData.confidence || 0,
        raw_text: extractedData.raw_text || undefined,
      },
    };

    console.log("OCR extraction successful:", {
      confidence: result.data?.confidence,
      hasDate: !!result.data?.date,
      hasSupplier: !!result.data?.supplier,
      hasAmount: !!result.data?.amount,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OCR error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown OCR error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
