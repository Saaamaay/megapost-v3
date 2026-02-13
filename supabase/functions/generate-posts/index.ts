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
  brandBeliefs?: string[];
}



interface RequestBody {
  platforms: string[];
  description: string;
  voiceProfile: VoiceProfile;
  voiceProfileId?: string;
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
  tiktok: [
    { name: "hook_script", description: "Strong hook in first 3 seconds + talking points for short video" },
    { name: "trend_take", description: "Commentary on a trend or challenge, relatable and punchy" },
    { name: "story_time", description: "Story-style script with dramatic pacing for engagement" },
    { name: "standard", description: "Quick, casual video caption with trending hashtags" },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platforms, description, voiceProfile, voiceProfileId, imageBase64, useSmartFormats = true }: RequestBody = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
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

        // Fetch recent rated posts for learning - filter by voice profile for isolation
        let postsQuery = supabase
          .from("generated_posts")
          .select("content, rating, is_viral, platform")
          .not("rating", "is", null)
          .order("created_at", { ascending: false })
          .limit(50);
        
        // Filter by voice profile if provided
        if (voiceProfileId) {
          postsQuery = postsQuery.eq("voice_profile_id", voiceProfileId);
        }
        
        const { data: ratedPosts } = await postsQuery;

        if (ratedPosts && ratedPosts.length > 0) {
          // Build platform-specific performance context
          // Extract ONLY structural patterns (hooks, rhythm, formatting) - NOT topics
          for (const platform of platforms) {
            const platformPosts = ratedPosts.filter(p => p.platform === platform);
            
            if (platformPosts.length === 0) continue;
            
            let context = "";
            
            // Analyze structural patterns from high performers
            const nailedIt = platformPosts
              .filter(p => p.rating === "nailed_it")
              .slice(0, 3);
            
            const notMyVoice = platformPosts
              .filter(p => p.rating === "not_my_voice")
              .slice(0, 2);
            
            const viral = platformPosts
              .filter(p => p.is_viral)
              .slice(0, 2);
            
            // Extract structural patterns, not content
            if (nailedIt.length > 0) {
              context += `\n  ✓ STRUCTURAL PATTERNS THAT WORK (analyze hook style, rhythm, formatting—ignore topics):`;
              nailedIt.forEach(p => {
                const firstLine = p.content.split('\n')[0].substring(0, 80);
                const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(p.content);
                const lineCount = p.content.split('\n').filter((l: string) => l.trim()).length;
                context += `\n    Hook: "${firstLine}..." | Lines: ${lineCount} | Emojis: ${hasEmoji ? 'yes' : 'no'}`;
              });
            }
            if (notMyVoice.length > 0) {
              context += `\n  ✗ PATTERNS TO AVOID:`;
              notMyVoice.forEach(p => {
                const firstLine = p.content.split('\n')[0].substring(0, 60);
                context += `\n    Missed: "${firstLine}..."`;
              });
            }
            if (viral.length > 0) {
              context += `\n  ⭐ HIGH-PERFORMER HOOKS (study the opening style):`;
              viral.forEach(p => {
                const firstLine = p.content.split('\n')[0].substring(0, 100);
                context += `\n    "${firstLine}"`;
              });
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
      twitter: "Punchy, concise. One sharp thought, maybe a hook. Under 280 characters. Can include 1-2 hashtags max.",
      tiktok: "Gen-Z energy, ultra-casual, trend-aware. Hook in first line. Use trending sounds references, relatable humor. Short sentences, conversational. Include 3-5 trending hashtags. Script-style for video content."
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
      performanceSection = `
═══════════════════════════════════════════════════════
STYLE PATTERNS FROM PAST PERFORMANCE
═══════════════════════════════════════════════════════
${Object.entries(platformPerformance).map(([platform, context]) => 
  `${platform.toUpperCase()}:${context}`
).join("\n\n")}

NOTE: These patterns are about STRUCTURE and STYLE (hooks, length, formatting)—not topics to repeat.`;
    }

    // Infer perspective from employee count and business type
    const isPersonalBrand = 
      voiceProfile.employeeCount === "1" || 
      voiceProfile.employeeCount === "Just me" ||
      voiceProfile.businessType?.toLowerCase().includes("consultant") ||
      voiceProfile.businessType?.toLowerCase().includes("freelancer") ||
      voiceProfile.businessType?.toLowerCase().includes("coach") ||
      voiceProfile.businessType?.toLowerCase().includes("creator");
    
    const perspectiveGuidance = isPersonalBrand 
      ? 'Personal brand detected → Use "I", "me", "my"'
      : 'Company brand detected → Use "We", "our", "the team"';

    // Build brand beliefs section
    const beliefsSection = voiceProfile.brandBeliefs?.filter(b => b?.trim()).length 
      ? `
═══════════════════════════════════════════════════════
BRAND BELIEFS (what makes this brand distinctive)
═══════════════════════════════════════════════════════
${voiceProfile.brandBeliefs.filter(b => b?.trim()).map((belief, i) => `${i + 1}. We believe ${belief}`).join("\n")}

These beliefs should subtly influence the perspective and opinions in posts.
They make content feel opinionated and authentic, not generic.
Don't quote beliefs directly—let them flavor the voice.`
      : "";

    const systemPrompt = `You are an expert social media copywriter.

═══════════════════════════════════════════════════════
AUTHOR BACKGROUND (for your understanding, NOT for inclusion)
═══════════════════════════════════════════════════════
- Business: ${voiceProfile.business}
${voiceProfile.businessLocation ? `- Location: ${voiceProfile.businessLocation}` : ""}
${voiceProfile.businessType ? `- Type: ${voiceProfile.businessType}` : ""}
${voiceProfile.employeeCount ? `- Team size: ${voiceProfile.employeeCount}` : ""}

This tells you WHO you are writing for. 
It is NOT a list of topics to mention in posts.
${beliefsSection}

═══════════════════════════════════════════════════════
VOICE & STYLE (always apply)
═══════════════════════════════════════════════════════
- Tone: ${toneDescription}
${voiceProfile.samplePost ? `- Writing style example: "${voiceProfile.samplePost}"` : ""}

═══════════════════════════════════════════════════════
VOICE & STYLE (always apply)
═══════════════════════════════════════════════════════
- Tone: ${toneDescription}
${voiceProfile.samplePost ? `- Writing style example: "${voiceProfile.samplePost}"` : ""}

Match their energy, sentence rhythm, and personality. 
Don't copy the example verbatim—capture the feel.
${performanceSection}

═══════════════════════════════════════════════════════
THE CORE RULE
═══════════════════════════════════════════════════════
The user's message defines the topic completely.

Before mentioning ANY business details (products, services, industry specifics), ask yourself:
→ "Did they bring this up, or would it feel shoehorned?"

If the answer is "shoehorned" → LEAVE IT OUT. 
Write about what THEY wrote about, in their voice.

Examples:
- Input: "Had coffee with a friend from Netflix" → Write about the coffee/conversation/Netflix. Do NOT pivot to their business.
- Input: "Just shipped a major update to our platform" → Business context IS relevant here. Use it.

═══════════════════════════════════════════════════════
PERSPECTIVE
═══════════════════════════════════════════════════════
${perspectiveGuidance}
${formatInstructions}

═══════════════════════════════════════════════════════
IMPORTANT RULES
═══════════════════════════════════════════════════════
1. Write in the user's authentic voice
2. Each platform post should be unique
3. Never use generic AI-sounding phrases
4. Make posts feel personal and genuine
5. Adapt length and style for each platform
6. Learn structure/hooks from past performance patterns
${useSmartFormats ? "7. Pick the most suitable format for THIS content" : ""}

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

    console.log("Calling Google Gemini API for platforms:", platforms);

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
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
