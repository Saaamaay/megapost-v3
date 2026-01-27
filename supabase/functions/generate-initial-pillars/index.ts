import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  businessType: string;
  businessDescription: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessType, businessDescription } = await req.json() as RequestBody;
    
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a social media content strategist helping a founder/business owner develop a balanced content mix.

Given their business type and description, suggest 4-5 content pillars (recurring themes) that create a well-rounded social media presence.

IMPORTANT: Create a BALANCED MIX of pillar types:
- 1-2 Product/Service pillars: Themes directly about what they do/sell
- 1-2 Thought Leadership pillars: Industry insights, trends, opinions, commentary
- 1 Personal/Behind-the-Scenes pillar: Day-to-day life, team culture, founder journey

Each pillar should be:
- Specific enough to inspire content ideas
- Actionable and easy to create content for
- Engaging for their target audience
- Something they can post about regularly

Return a JSON array with 4-5 pillars. Each pillar should have:
- emoji: A single relevant emoji
- title: Short catchy name (2-4 words)
- description: Brief explanation of what content fits this theme (10-15 words)

Example response for a coffee shop:
[
  {"emoji": "☕", "title": "Behind the counter", "description": "Your baristas at work, the craft of making great coffee"},
  {"emoji": "🌿", "title": "Bean origins", "description": "Stories about where your coffee comes from and the farmers"},
  {"emoji": "💭", "title": "Coffee culture takes", "description": "Your opinions on industry trends, brewing methods, coffee myths"},
  {"emoji": "📍", "title": "Local love", "description": "Supporting your neighborhood, collaborations with local businesses"}
]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "",
        "X-Title": "Initial Content Pillars Generator",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Business type: ${businessType}\nBusiness description: ${businessDescription}` }
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
      pillars = Array.isArray(parsed) ? parsed : parsed.pillars || [];
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse pillar suggestions");
    }

    return new Response(JSON.stringify({ pillars }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating initial pillars:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
