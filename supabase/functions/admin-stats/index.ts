import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[ADMIN-STATS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const userId = claimsData.claims.sub as string;
    logStep("User authenticated", { userId });

    // Check admin role using service client
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);

    if (!roleData || roleData.length === 0) {
      logStep("Not admin", { userId });
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Admin verified");

    // Gather stats
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // 1. Get all users
    const { data: usersData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    const allUsers = usersData?.users ?? [];
    const totalUsers = allUsers.length;
    logStep("Total users", { totalUsers });

    // 2. Trial vs paid breakdown
    const now = new Date();
    const trialDays = 7;
    let trialActive = 0;
    let trialExpired = 0;
    let paidUsers = 0;
    const userDetails: any[] = [];

    // Batch check Stripe for all users with emails
    for (const user of allUsers) {
      if (!user.email) continue;

      const createdAt = new Date(user.created_at);
      const trialEnd = new Date(createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const isTrialActive = now < trialEnd;

      let hasSubscription = false;
      let subscriptionTier: string | null = null;
      let subscriptionInterval: string | null = null;

      try {
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
          const subs = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: "active",
            limit: 1,
          });
          if (subs.data.length > 0) {
            hasSubscription = true;
            const priceProduct = subs.data[0].items.data[0]?.price?.product as string;
            const interval = subs.data[0].items.data[0]?.price?.recurring?.interval;
            subscriptionInterval = interval ?? null;
            // Map product to tier name
            if (priceProduct === "prod_TzAkS4YF3ZUnGT") subscriptionTier = "Standard";
            else if (priceProduct === "prod_TzAkwUTiWivISB") subscriptionTier = "Premium";
            else if (priceProduct === "prod_TzAkNtJcIQ8H9q") subscriptionTier = "Professional";
            else subscriptionTier = "Unknown";
          }
        }
      } catch (e) {
        // Skip Stripe errors for individual users
      }

      if (hasSubscription) {
        paidUsers++;
      } else if (isTrialActive) {
        trialActive++;
      } else {
        trialExpired++;
      }

      userDetails.push({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        trial_ends: trialEnd.toISOString(),
        is_trial_active: isTrialActive && !hasSubscription,
        has_subscription: hasSubscription,
        subscription_tier: subscriptionTier,
        subscription_interval: subscriptionInterval,
        generation_count: 0, // will be filled below
      });
    }

    // 2.5 Per-user generation counts (distinct generation_ids per user)
    const { data: userGenData } = await serviceClient
      .from("generated_posts")
      .select("user_id, generation_id");

    const userGenMap = new Map<string, Set<string>>();
    const userNoGenIdCount = new Map<string, number>();
    for (const row of userGenData ?? []) {
      if (row.generation_id) {
        if (!userGenMap.has(row.user_id)) userGenMap.set(row.user_id, new Set());
        userGenMap.get(row.user_id)!.add(row.generation_id);
      } else {
        userNoGenIdCount.set(row.user_id, (userNoGenIdCount.get(row.user_id) ?? 0) + 1);
      }
    }
    for (const ud of userDetails) {
      ud.generation_count = (userGenMap.get(ud.id)?.size ?? 0) + (userNoGenIdCount.get(ud.id) ?? 0);
    }

    // 3. Generations per day (last 30 days) — count distinct generation_ids
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: postsData } = await serviceClient
      .from("generated_posts")
      .select("created_at, generation_id")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true });

    const postsByDay: Record<string, number> = {};
    const seenGenerations = new Set<string>();
    for (const post of postsData ?? []) {
      const day = post.created_at.substring(0, 10);
      const gid = post.generation_id;
      if (gid && seenGenerations.has(gid)) continue;
      if (gid) seenGenerations.add(gid);
      postsByDay[day] = (postsByDay[day] ?? 0) + 1;
    }

    // 4. Total generations (distinct generation_ids + rows without one)
    const { data: allGenData } = await serviceClient
      .from("generated_posts")
      .select("generation_id");

    const allGens = new Set<string>();
    let noGenIdCount = 0;
    for (const row of allGenData ?? []) {
      if (row.generation_id) allGens.add(row.generation_id);
      else noGenIdCount++;
    }
    const totalPosts = allGens.size + noGenIdCount;

    // 5. Conversion rate
    const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : "0";

    const stats = {
      totalUsers,
      trialActive,
      trialExpired,
      paidUsers,
      conversionRate,
      totalPosts: totalPosts ?? 0,
      postsByDay,
      users: userDetails.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    };

    logStep("Stats compiled", { totalUsers, paidUsers, trialActive, trialExpired });

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
