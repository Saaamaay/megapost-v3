import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[DELETE-ACCOUNT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // 1. Cancel all active Stripe subscriptions
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      });

      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
        logStep("Cancelled subscription", { subscriptionId: sub.id });
      }
      logStep("All subscriptions cancelled");
    } else {
      logStep("No Stripe customer found, skipping cancellation");
    }

    // 2. Delete user data from database tables
    const userId = user.id;

    await supabaseClient.from("generated_posts").delete().eq("user_id", userId);
    logStep("Deleted generated_posts");

    await supabaseClient.from("content_pillars").delete().eq("user_id", userId);
    logStep("Deleted content_pillars");

    await supabaseClient.from("voice_profiles").delete().eq("user_id", userId);
    logStep("Deleted voice_profiles");

    // 3. Send deletion confirmation email BEFORE deleting auth user
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      await fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          email: user.email,
          template: "account-deleted",
          data: {},
        }),
      });
      logStep("Deletion confirmation email sent");
    } catch (emailErr) {
      logStep("Failed to send deletion email (non-blocking)", { error: String(emailErr) });
    }

    // 4. Delete the auth user (requires service role)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      logStep("Failed to delete auth user", { error: deleteError.message });
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }
    logStep("Auth user deleted");

    // 5. Record hashed email to prevent trial abuse
    const encoder = new TextEncoder();
    const data = encoder.encode(user.email!.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const emailHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    await supabaseClient.from("deleted_accounts").insert({ email_hash: emailHash });
    logStep("Recorded deleted account hash");

    return new Response(JSON.stringify({ success: true }), {
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
