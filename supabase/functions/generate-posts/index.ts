import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ToneScales {
  casualProfessional: number;
  funnySincere: number;
  personalFormal: number;
  groundedInspiring: number;
}

interface VoiceProfile {
  business: string;
  businessLocation: string;
  employeeCount: string;
  businessType: string;
  toneScales: ToneScales;
  samplePost: string;
}


interface RequestBody {
  platforms: string[];
  description: string;
  voiceProfile: VoiceProfile;
  imageBase64?: string;
  useSmartFormats?: boolean;
}

// Format definitions per platform
const platformFormats: Record<string, { name: string; description: string }[]> = {
  linkedin: [
    { name: "carousel", description: "Numbered slides (1/, 2/, etc.) for educational or step-by-step content" },
    { name: "story_post", description: "Personal story with a business lesson" },
    { name: "insight", description: "Industry insight or hot take with reflection" },
    { name: "standard", description: "Regular professional post" },
  ],
  instagram: [
    { name: "carousel", description: "Slide-by-slide caption (Slide 1:, Slide 2:, etc.) for tips or tutorials" },
    { name: "reel_script", description: "Hook + quick talking points for a short video" },
    { name: "caption", description: "Standard photo caption with hashtags" },
  ],
  twitter: [
    { name: "thread", description: "Multi-tweet thread (1/, 2/, etc.) for detailed breakdowns" },
    { name: "hook_tweet", description: "Single punchy tweet with a strong hook" },
    { name: "standard", description: "Regular tweet under 280 chars" },
  ],
  facebook: [
    { name: "story_post", description: "Conversational story that invites engagement" },
    { name: "question_post", description: "Post centered around asking the community a question" },
    { name: "standard", description: "Regular community-focused update" },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platforms, description, voiceProfile, imageBase64, useSmartFormats = true }: RequestBody = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user's performance data to improve generation - PLATFORM SPECIFIC
    const platformPerformance: Record<string, string> = {};
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: authHeader } }
        });

        // Fetch recent rated posts for learning - get more to have enough per platform
        const { data: ratedPosts } = await supabase
          .from("generated_posts")
          .select("content, rating, is_viral, platform")
          .not("rating", "is", null)
          .order("created_at", { ascending: false })
          .limit(50);

        if (ratedPosts && ratedPosts.length > 0) {
          // Build platform-specific performance context
          for (const platform of platforms) {
            const platformPosts = ratedPosts.filter(p => p.platform === platform);
            
            if (platformPosts.length === 0) continue;
            
            let context = "";
            
            const nailedIt = platformPosts
              .filter(p => p.rating === "nailed_it")
              .slice(0, 3)
              .map(p => p.content.substring(0, 200));
            
            const notMyVoice = platformPosts
              .filter(p => p.rating === "not_my_voice")
              .slice(0, 2)
              .map(p => p.content.substring(0, 150));
            
            const viral = platformPosts
              .filter(p => p.is_viral)
              .slice(0, 2)
              .map(p => p.content.substring(0, 200));
            
            if (nailedIt.length > 0) {
              context += `\n  ✓ STYLE TO EMULATE (these nailed your voice):\n${nailedIt.map(c => `    "${c}..."`).join("\n")}`;
            }
            if (notMyVoice.length > 0) {
              context += `\n  ✗ STYLE TO AVOID (these missed the mark):\n${notMyVoice.map(c => `    "${c}..."`).join("\n")}`;
            }
            if (viral.length > 0) {
              context += `\n  ⭐ HIGH PERFORMERS (learn from these hooks):\n${viral.map(c => `    "${c}..."`).join("\n")}`;
            }
            
            if (context) {
              platformPerformance[platform] = context;
            }
          }
        }
        
        console.log("Platform-specific performance loaded for:", Object.keys(platformPerformance).join(", ") || "none");
      } catch (dbError) {
        console.error("Failed to fetch performance data:", dbError);
        // Continue without performance data
      }
    }
    
    const hasPerformanceData = Object.keys(platformPerformance).length > 0;

    const platformDescriptions: Record<string, string> = {
      linkedin: "Professional, warm, subtly personal. Focus on industry insight, the story behind the work, thoughtful reflection. Use 1-2 emojis max. Include a call to engagement at the end.",
      instagram: "Visual-first, breezy, emoji-friendly. Short caption (2-4 sentences) that complements the image. Use relevant hashtags (5-8). Keep it punchy and authentic.",
      facebook: "Conversational, community-oriented. Invites engagement, feels like talking to neighbors. Medium length. Ask a question to encourage comments.",
      twitter: "Punchy, concise. One sharp thought, maybe a hook. Under 280 characters. Can include 1-2 hashtags max."
    };

    // Build format instructions based on mode
    let formatInstructions = "";
    if (useSmartFormats) {
      formatInstructions = `\n\nFORMAT SELECTION - CRITICAL:
Analyze the CONTENT TYPE and pick the format that best communicates it. Don't default to complex formats.

Available formats:
${platforms.map(p => {
  const formats = platformFormats[p] || [];
  return `${p.toUpperCase()}:\n${formats.map(f => `  - "${f.name}": ${f.description}`).join("\n")}`;
}).join("\n\n")}

FORMAT MATCHING GUIDE:
📢 ANNOUNCEMENTS (new hire, news, updates, launches) → "standard" - simple, direct, celebratory
📚 EDUCATIONAL (how-to, tips, lessons, guides) → "carousel" or "thread" - needs structure
📖 STORIES (personal experiences, journey, behind-scenes) → "story_post" - narrative arc
💡 INSIGHTS (opinions, hot takes, reflections) → "insight" or "hook_tweet" - provocative hook
❓ ENGAGEMENT (polls, discussions, community) → "question_post" - invites response

CRITICAL: A team announcement or new hire post is NOT a carousel. It's a simple celebratory update - use "standard".
Carousels are for content that has MULTIPLE DISTINCT POINTS that need separate slides.`;
    }

    // Helper to describe tone scales
    const describeTone = (scale: number, left: string, right: string) => {
      if (scale <= 2) return left;
      if (scale >= 4) return right;
      return `balanced ${left.toLowerCase()}/${right.toLowerCase()}`;
    };

    const toneDescription = [
      describeTone(voiceProfile.toneScales.casualProfessional, "Casual", "Professional"),
      describeTone(voiceProfile.toneScales.funnySincere, "Funny", "Sincere"),
      describeTone(voiceProfile.toneScales.personalFormal, "Personal", "Formal"),
      describeTone(voiceProfile.toneScales.groundedInspiring, "Down-to-earth", "Inspiring"),
    ].join(", ");

    // Build platform-specific performance section
    let performanceSection = "";
    if (hasPerformanceData) {
      performanceSection = `\n\nPLATFORM-SPECIFIC LEARNING (use to match tone/style, NOT to limit format choices):
${Object.entries(platformPerformance).map(([platform, context]) => 
  `\n${platform.toUpperCase()}:${context}`
).join("\n")}

IMPORTANT: This learning is about VOICE and STYLE, not format. Still pick the best format for the current content - don't just repeat the same format because it worked before.`;
    }

    const systemPrompt = `You are an expert social media copywriter. Your job is to create platform-specific posts that sound authentic to the user's voice.

USER'S VOICE PROFILE:
- Business: ${voiceProfile.business}
${voiceProfile.businessLocation ? `- Location: ${voiceProfile.businessLocation}` : ""}
${voiceProfile.businessType ? `- Business type: ${voiceProfile.businessType}` : ""}
${voiceProfile.employeeCount ? `- Team size: ${voiceProfile.employeeCount}` : ""}
- Tone: ${toneDescription}
${voiceProfile.samplePost ? `- Example of their writing style: "${voiceProfile.samplePost}"` : ""}
${performanceSection}
${formatInstructions}

IMPORTANT RULES:
1. Write in the user's authentic voice based on their profile
2. Each platform post should be unique and optimized for that platform
3. Never use generic AI-sounding phrases
4. Make posts feel personal and genuine
5. Adapt length and style for each platform
${hasPerformanceData ? "6. Learn tone/hooks from past successes on EACH platform, but vary your format choices based on the current content" : ""}
${useSmartFormats ? `${hasPerformanceData ? "7" : "6"}. Pick the most suitable format for THIS content - don't default to the same format every time` : ""}

Return a JSON object with this structure:
{
  "posts": { "platform": "post content..." },
  "formats": { "platform": "format_name" }
}
${useSmartFormats ? "Include the format you chose for each platform in the formats object." : "Use 'standard' for all formats."}
ONLY return valid JSON, no markdown, no explanation.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Create posts for these platforms: ${platforms.join(", ")}

Platform guidelines:
${platforms.map(p => `- ${p}: ${platformDescriptions[p] || "Professional and engaging"}`).join("\n")}

Content to share: ${description}

Return JSON like: {"posts": {"linkedin": "post content...", "instagram": "post content..."}, "formats": {"linkedin": "carousel", "instagram": "caption"}}`
      }
    ];

    // Add image if provided
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageBase64
        }
      });
      userContent[0].text = `Look at this image and ${userContent[0].text}. Reference what you see in the image to make posts more specific and engaging.`;
    }

    console.log("Calling Lovable AI Gateway for platforms:", platforms);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
      }),
    });

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
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response received:", content?.substring(0, 100));

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let result: { posts?: Record<string, string>; formats?: Record<string, string> } | Record<string, string>;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      result = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("Failed to parse AI response");
    }

    // Handle both old format (direct posts) and new format (posts + formats)
    const posts = (result as any).posts || result;
    const formats = (result as any).formats || {};

    console.log("Generated formats:", formats);

    return new Response(JSON.stringify({ posts, formats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-posts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
