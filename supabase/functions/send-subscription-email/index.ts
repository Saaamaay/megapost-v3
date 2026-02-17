import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SEND-SUBSCRIPTION-EMAIL] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFFDF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFDF7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          ${content}
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">© ${new Date().getFullYear()} MegaPost · <a href="https://megapost.ai/privacy" style="color:#E89A0C;text-decoration:none;">Privacy</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const templates: Record<string, (data: any) => { subject: string; html: string }> = {
  "subscription-confirmed": (data) => ({
    subject: `You're on the ${data.planName} plan! 🎉`,
    html: emailWrapper(`
      <tr>
        <td style="background:linear-gradient(135deg,#E89A0C,#D97706);padding:40px 40px 32px;text-align:center;">
          <p style="margin:0 0 8px;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600;letter-spacing:1px;">megapost<span style="color:#ffffff;">.ai</span></p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Welcome to ${data.planName}! 🎉</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 20px;color:#1a1a2e;font-size:16px;line-height:1.6;">Hey there! 👋</p>
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">Your <strong>${data.planName}</strong> subscription is now active. Here's what you've unlocked:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:16px;background:#FEF7E8;border-radius:12px;">
                <p style="margin:0 0 8px;color:#1a1a2e;font-size:15px;">✅ Unlimited post generation</p>
                <p style="margin:0 0 8px;color:#1a1a2e;font-size:15px;">✅ ${data.platforms}</p>
                <p style="margin:0 0 8px;color:#1a1a2e;font-size:15px;">✅ ${data.profiles}</p>
                <p style="margin:0;color:#1a1a2e;font-size:15px;">✅ Content pillars</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:8px 0 24px;">
                <a href="https://megapost.ai" style="display:inline-block;background:linear-gradient(135deg,#E89A0C,#D97706);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:600;">Start Creating →</a>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.5;">Your plan renews at ${data.price}/month. You can manage your subscription anytime from your account settings.</p>
        </td>
      </tr>
    `),
  }),

  "subscription-cancelled": (data) => ({
    subject: "Your MegaPost subscription is ending 😢",
    html: emailWrapper(`
      <tr>
        <td style="background:linear-gradient(135deg,#6B7280,#4B5563);padding:40px 40px 32px;text-align:center;">
          <p style="margin:0 0 8px;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600;letter-spacing:1px;">megapost<span style="color:#ffffff;">.ai</span></p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">We're sorry to see you go 😢</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 20px;color:#1a1a2e;font-size:16px;line-height:1.6;">Hey there,</p>
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">Your <strong>${data.planName}</strong> subscription has been cancelled. You'll still have full access until <strong>${data.endDate}</strong>.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:16px;background:#FEF3C7;border-radius:12px;border-left:3px solid #E89A0C;">
                <p style="margin:0;color:#1a1a2e;font-size:15px;">💡 Changed your mind? You can resubscribe anytime from your account settings — no data will be lost.</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:8px 0 24px;">
                <a href="https://megapost.ai" style="display:inline-block;background:linear-gradient(135deg,#E89A0C,#D97706);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:600;">Resubscribe →</a>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.5;">We'd love to hear what we could do better — just reply to this email.</p>
        </td>
      </tr>
    `),
  }),

  "trial-expiring": (data) => ({
    subject: "Your free trial ends in 2 days ⏰",
    html: emailWrapper(`
      <tr>
        <td style="background:linear-gradient(135deg,#E89A0C,#D97706);padding:40px 40px 32px;text-align:center;">
          <p style="margin:0 0 8px;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600;letter-spacing:1px;">megapost<span style="color:#ffffff;">.ai</span></p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Your trial ends in 2 days ⏰</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 20px;color:#1a1a2e;font-size:16px;line-height:1.6;">Hey there! 👋</p>
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">Your MegaPost free trial expires on <strong>${data.expiryDate}</strong>. After that, you'll lose access to post generation.</p>
          <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">Upgrade now to keep creating content that sounds like you:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:16px;background:#FEF7E8;border-radius:12px;">
                <p style="margin:0 0 8px;color:#1a1a2e;font-size:15px;"><strong>Standard</strong> — £10/mo · 1 platform</p>
                <p style="margin:0 0 8px;color:#1a1a2e;font-size:15px;"><strong>Premium</strong> — £20/mo · All platforms ⭐</p>
                <p style="margin:0;color:#1a1a2e;font-size:15px;"><strong>Professional</strong> — £30/mo · 3 profiles</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:8px 0 24px;">
                <a href="https://megapost.ai" style="display:inline-block;background:linear-gradient(135deg,#E89A0C,#D97706);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:600;">Upgrade Now →</a>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.5;">Questions? Just reply to this email.</p>
        </td>
      </tr>
    `),
  }),

  "account-deleted": (data) => ({
    subject: "Your MegaPost account has been deleted",
    html: emailWrapper(`
      <tr>
        <td style="background:linear-gradient(135deg,#6B7280,#4B5563);padding:40px 40px 32px;text-align:center;">
          <p style="margin:0 0 8px;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600;letter-spacing:1px;">megapost<span style="color:#ffffff;">.ai</span></p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Account Deleted</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 20px;color:#1a1a2e;font-size:16px;line-height:1.6;">Hi there,</p>
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">Your MegaPost account and all associated data have been permanently deleted. This includes:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:16px;background:#FEF2F2;border-radius:12px;">
                <p style="margin:0 0 8px;color:#1a1a2e;font-size:15px;">• All business profiles</p>
                <p style="margin:0 0 8px;color:#1a1a2e;font-size:15px;">• All generated posts</p>
                <p style="margin:0 0 8px;color:#1a1a2e;font-size:15px;">• Content pillars</p>
                <p style="margin:0;color:#1a1a2e;font-size:15px;">• Any active subscriptions (cancelled)</p>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">If this was a mistake, you can sign up again at any time — but your previous data cannot be recovered.</p>
          <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.5;">Thank you for trying MegaPost. We wish you all the best! 💛</p>
        </td>
      </tr>
    `),
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, template, data } = await req.json();
    logStep("Received request", { email, template });

    if (!email || !template) {
      return new Response(JSON.stringify({ error: "Missing email or template" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateFn = templates[template];
    if (!templateFn) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { subject, html } = templateFn(data || {});
    logStep("Sending email", { subject });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MegaPost <hello@megapost.ai>",
        to: [email],
        subject,
        html,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      logStep("Resend error", emailResult);
      return new Response(JSON.stringify({ error: "Failed to send email", details: emailResult }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Email sent successfully", { messageId: emailResult.id });

    return new Response(JSON.stringify({ success: true, messageId: emailResult.id }), {
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
