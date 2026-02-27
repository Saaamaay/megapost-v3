import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[POST-TO-LINKEDIN] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

async function refreshAccessToken(
  serviceClient: any,
  connection: any,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  if (!connection.refresh_token) return null;

  logStep("Refreshing access token");
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    logStep("Token refresh failed", { status: res.status });
    return null;
  }

  const data = await res.json();
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  const newRefreshExpiresAt = data.refresh_token_expires_in
    ? new Date(Date.now() + data.refresh_token_expires_in * 1000).toISOString()
    : connection.refresh_token_expires_at;

  await serviceClient
    .from("linkedin_connections")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? connection.refresh_token,
      token_expires_at: newExpiresAt,
      refresh_token_expires_at: newRefreshExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", connection.user_id);

  logStep("Token refreshed successfully");
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const clientId = Deno.env.get("LINKEDIN_CLIENT_ID");
    const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("LinkedIn credentials not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const { postId, content, imageBase64 } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ error: "Missing content" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Enforce LinkedIn's 3000 char limit
    if (content.length > 3000) {
      return new Response(JSON.stringify({ error: "Content exceeds LinkedIn's 3000 character limit" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Fetch LinkedIn connection
    const { data: connection, error: connError } = await serviceClient
      .from("linkedin_connections")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (connError || !connection) {
      logStep("No LinkedIn connection found");
      return new Response(JSON.stringify({ error: "linkedin_not_connected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check token expiry and refresh if needed
    let accessToken = connection.access_token;
    const tokenExpired = connection.token_expires_at && new Date(connection.token_expires_at) < new Date();

    if (tokenExpired) {
      logStep("Token expired, attempting refresh");
      const refreshed = await refreshAccessToken(serviceClient, connection, clientId, clientSecret);
      if (!refreshed) {
        logStep("Refresh failed, reconnect required");
        return new Response(JSON.stringify({ error: "linkedin_reconnect_required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      accessToken = refreshed;
    }

    const authorUrn = `urn:li:person:${connection.linkedin_person_id}`;
    const linkedinHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202401",
      "X-Restli-Protocol-Version": "2.0.0",
    };

    let imageUrn: string | null = null;

    // Image upload (3-step process) if imageBase64 provided
    if (imageBase64) {
      logStep("Starting image upload");

      // Validate image size (rough base64 size check — base64 is ~4/3 of binary)
      const estimatedBytes = (imageBase64.length * 3) / 4;
      if (estimatedBytes > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "Image exceeds 10MB limit" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Step 1: Initialize upload
      const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
        method: "POST",
        headers: linkedinHeaders,
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: authorUrn,
          },
        }),
      });

      if (!initRes.ok) {
        const errBody = await initRes.text();
        logStep("Image init failed", { status: initRes.status, body: errBody });
        throw new Error("Failed to initialize LinkedIn image upload");
      }

      const initData = await initRes.json();
      const uploadUrl = initData.value.uploadUrl;
      imageUrn = initData.value.image;
      logStep("Image upload initialized", { imageUrn });

      // Step 2: Upload binary image
      // Strip data URL prefix if present
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/octet-stream",
        },
        body: bytes,
      });

      if (!uploadRes.ok) {
        const errBody = await uploadRes.text();
        logStep("Image upload failed", { status: uploadRes.status, body: errBody });
        throw new Error("Failed to upload image to LinkedIn");
      }

      logStep("Image uploaded successfully");
    }

    // Create the post
    logStep("Creating LinkedIn post", { hasImage: !!imageUrn });

    const postBody: any = {
      author: authorUrn,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
    };

    if (imageUrn) {
      postBody.content = {
        media: {
          id: imageUrn,
        },
      };
    }

    const postRes = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: linkedinHeaders,
      body: JSON.stringify(postBody),
    });

    if (!postRes.ok) {
      const errBody = await postRes.text();
      logStep("Post creation failed", { status: postRes.status, body: errBody });

      if (postRes.status === 429) {
        return new Response(JSON.stringify({ error: "LinkedIn rate limit reached. Please try again later." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        });
      }

      throw new Error("Failed to publish post to LinkedIn");
    }

    // Extract post URL from response header
    const postHeader = postRes.headers.get("x-restli-id") || postRes.headers.get("x-linkedin-id");
    const postUrl = postHeader
      ? `https://www.linkedin.com/feed/update/${postHeader}/`
      : `https://www.linkedin.com/in/${connection.linkedin_person_id}/recent-activity/`;

    logStep("Post published", { postUrl });

    // Update generated_posts with share info
    if (postId) {
      const { error: updateError } = await serviceClient
        .from("generated_posts")
        .update({
          linkedin_post_url: postUrl,
          linkedin_shared_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .eq("user_id", userId);

      if (updateError) {
        logStep("Failed to update generated_posts", { error: updateError.message });
      } else {
        logStep("generated_posts updated with share info");
      }
    }

    return new Response(JSON.stringify({ success: true, postUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
