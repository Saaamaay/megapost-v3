import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  businessType: string;
  businessDescription: string;
  existingPillars: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessType, businessDescription, existingPillars } = await req.json() as RequestBody;
    
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const existingList = existingPillars.map(p => `- ${p}`).join('\n');

    const systemPrompt = `You are a social media content strategist helping a founder/business owner expand their content mix.

They already have these content pillars:
${existingList}

Your task: Suggest ONE new content pillar that is COMPLETELY DIFFERENT from what they already have.

Consider what's MISSING from their current mix:
- If they're heavy on product content → suggest thought leadership or personal content
- If they're heavy on industry takes → suggest behind-the-scenes or product content
- If everything is serious → suggest something lighter/more personal
- If everything is personal → suggest something more professional/educational

The new pillar should:
- Fill a gap in their current content strategy
- NOT overlap with or rephrase any existing pillar
- Be specific enough to inspire content ideas
- Be actionable and easy to create content for

Return a JSON array with exactly 1 pillar:
- emoji: A single relevant emoji (different from what they likely have)
- title: Short catchy name (2-4 words) - must be distinctly different
- description: Brief explanation of what content fits this theme (10-15 words)

Example response:
[
  {"emoji": "🎙️", "title": "Industry hot takes", "description": "Your unfiltered opinions on trends and news in your space"}
]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Business type: ${businessType}\nBusiness description: ${businessDescription}\n\nSuggest ONE new content pillar that fills a gap in their current strategy.` }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    let pillars;
    try {
      const parsed = JSON.parse(content);
      pillars = Array.isArray(parsed) ? parsed : parsed.pillars || parsed.pillar ? [parsed.pillar] : [];
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse pillar suggestion");
    }

    return new Response(JSON.stringify({ pillars }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating single pillar:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
