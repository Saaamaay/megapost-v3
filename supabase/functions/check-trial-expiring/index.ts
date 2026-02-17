import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-TRIAL-EXPIRING] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Cron job started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Trial is 7 days. We want users whose trial expires in ~2 days.
    // That means users created 5 days ago (between 5d 0h and 5d 23h59m ago).
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const fiveDaysAgoEnd = new Date(fiveDaysAgo.getTime() - 24 * 60 * 60 * 1000); // 6 days ago

    // List users from auth using admin API
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersError) throw new Error(`Failed to list users: ${usersError.message}`);

    const usersToNotify = (usersData?.users ?? []).filter((user) => {
      const createdAt = new Date(user.created_at);
      // Created between 5 and 6 days ago (trial expires in ~1-2 days)
      return createdAt <= fiveDaysAgo && createdAt > fiveDaysAgoEnd;
    });

    logStep(`Found ${usersToNotify.length} users with trials expiring in ~2 days`);

    let emailsSent = 0;

    for (const user of usersToNotify) {
      if (!user.email) continue;

      // Check if they already have a paid Stripe subscription
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        const subs = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: "active",
          limit: 1,
        });
        if (subs.data.length > 0) {
          logStep("User already subscribed, skipping", { email: user.email });
          continue;
        }
      }

      // Calculate expiry date
      const expiryDate = new Date(new Date(user.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
      const formattedExpiry = expiryDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      // Send trial expiring email
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const response = await fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          email: user.email,
          template: "trial-expiring",
          data: { expiryDate: formattedExpiry },
        }),
      });

      if (response.ok) {
        emailsSent++;
        logStep("Trial expiring email sent", { email: user.email });
      } else {
        logStep("Failed to send trial email", { email: user.email, status: response.status });
      }
    }

    logStep(`Completed. Sent ${emailsSent} trial expiring emails.`);

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
