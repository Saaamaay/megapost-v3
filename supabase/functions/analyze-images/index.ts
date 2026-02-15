import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, platforms } = await req.json();

    if (!images || !Array.isArray(images) || images.length < 2) {
      return new Response(
        JSON.stringify({ error: "Please upload at least 2 images to rank." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (images.length > 5) {
      return new Response(
        JSON.stringify({ error: "Maximum 5 images allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const platformContext = platforms?.length
      ? `The posts will be shared on: ${platforms.join(", ")}.`
      : "The posts will be shared on social media.";

    const userContent: any[] = [
      {
        type: "text",
        text: `I'm uploading ${images.length} photos for a social media post. ${platformContext}

Rank these photos from best to worst for social media engagement. Consider:
- Visual impact and composition
- Lighting quality
- Subject clarity and focus
- Emotional appeal / storytelling potential
- How well it would stop someone scrolling

For each photo, provide:
- rank (1 = best)
- score (1-10)
- A brief, specific reason why it ranked where it did (15-25 words)

Return ONLY valid JSON in this exact format:
{
  "rankings": [
    {"index": 0, "rank": 1, "score": 9, "reason": "Strong composition with natural lighting that draws the eye immediately"},
    {"index": 1, "rank": 2, "score": 7, "reason": "Good subject but slightly overexposed background reduces impact"}
  ]
}

The "index" corresponds to the order the images were provided (0-indexed).`,
      },
    ];

    // Add each image
    images.forEach((imageBase64: string) => {
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64 },
      });
    });

    console.log(`Analyzing ${images.length} images for social media ranking`);

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are a professional social media photographer and visual content strategist. You evaluate photos for their social media potential with specific, actionable feedback. Return only valid JSON.",
            },
            { role: "user", content: userContent },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const result = JSON.parse(cleanedContent);

    console.log("Image ranking complete:", result.rankings?.length, "images ranked");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-images error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to analyze images" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
