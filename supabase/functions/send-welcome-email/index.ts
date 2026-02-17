import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // This is triggered by the auth webhook when a user confirms their email
    // The payload contains the user record
    const { type, record, old_record } = payload;

    // Only send welcome email when email gets confirmed
    // Check: user's email_confirmed_at changed from null to a value
    if (type !== "UPDATE") {
      return new Response(JSON.stringify({ message: "Not an update event" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailConfirmedNow = record?.email_confirmed_at;
    const emailConfirmedBefore = old_record?.email_confirmed_at;

    // Only trigger when email_confirmed_at transitions from null to a timestamp
    if (!emailConfirmedNow || emailConfirmedBefore) {
      return new Response(
        JSON.stringify({ message: "Email not newly confirmed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userEmail = record.email;
    if (!userEmail) {
      return new Response(JSON.stringify({ error: "No email found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send welcome email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MegaPost <hello@megapost.ai>",
        to: [userEmail],
        subject: "Welcome to MegaPost! 🚀",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Welcome to MegaPost! 🎉</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#1a1a2e;font-size:16px;line-height:1.6;">
                Hey there! 👋
              </p>
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
                Your account is all set up and ready to go. MegaPost helps you create engaging social media content that sounds exactly like you — powered by AI that learns your unique voice.
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
                Here's how to get started:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background:#f3f4f6;border-radius:12px;margin-bottom:8px;">
                    <p style="margin:0;color:#1a1a2e;font-size:15px;"><strong>1.</strong> Set up your voice profile — tell us about your business and tone</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#f3f4f6;border-radius:12px;">
                    <p style="margin:0;color:#1a1a2e;font-size:15px;"><strong>2.</strong> Choose your platforms — LinkedIn, X, Instagram & more</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#f3f4f6;border-radius:12px;">
                    <p style="margin:0;color:#1a1a2e;font-size:15px;"><strong>3.</strong> Generate posts that sound like you in seconds</p>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="https://megapost.ai" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:600;">
                      Get Started →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.5;">
                If you have any questions, just reply to this email — we'd love to hear from you!
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">
                © ${new Date().getFullYear()} MegaPost · <a href="https://megapost.ai/privacy" style="color:#6366f1;text-decoration:none;">Privacy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend error:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Welcome email sent to:", userEmail);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
