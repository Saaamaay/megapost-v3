import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  businessType: string;
  businessDescription: string;
  existingPillars?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessType, businessDescription, existingPillars = [] } = await req.json() as RequestBody;
    
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const isAddingMore = existingPillars.length > 0;
    const existingContext = isAddingMore 
      ? `\n\nIMPORTANT: The user already has these content pillars. You MUST suggest something COMPLETELY DIFFERENT - do not repeat or rephrase any of these:\n${existingPillars.map(p => `- ${p}`).join('\n')}`
      : '';

    const pillarCount = isAddingMore ? 1 : '3-5';

    const systemPrompt = `You are a social media strategist helping small businesses develop content themes.

Given a business type and description, suggest content pillars (recurring content themes) that would work well for their social media presence.

Each pillar should be:
- Specific to their business type
- Actionable and easy to create content for
- Engaging for their audience
- Something they can post about regularly
- UNIQUE and NOT similar to any existing pillars
${existingContext}

Return a JSON array with exactly ${pillarCount} pillar${isAddingMore ? '' : 's'}. Each pillar should have:
- emoji: A single relevant emoji
- title: Short catchy name (2-4 words) - must be distinctly different from existing pillars
- description: Brief explanation of what content fits this theme (10-15 words)

Example response:
[
  {"emoji": "☕", "title": "Behind the counter", "description": "Your baristas at work, the craft of making great coffee"}
]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "",
        "X-Title": "Content Pillars Generator",
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

    // Parse the JSON response
    let pillars;
    try {
      const parsed = JSON.parse(content);
      // Handle both array and object with pillars key
      pillars = Array.isArray(parsed) ? parsed : parsed.pillars || [];
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse pillar suggestions");
    }

    return new Response(JSON.stringify({ pillars }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating pillars:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
