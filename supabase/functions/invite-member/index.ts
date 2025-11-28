import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { member_id } = await req.json()

    if (!member_id) {
      return new Response(JSON.stringify({ error: "member_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("id", member_id)
      .single()

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: "Member not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    const toEmail = member.preferred_email || member.email

    if (!toEmail || toEmail.trim() === "") {
      return new Response(JSON.stringify({ error: "Member has no email on file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const claimUrl = `https://www.ffainvestments.com/auth/claim?member_id=${member_id}`

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50;">Welcome to FFA Investments</h2>
    <p>Hello ${member.member_name},</p>
    <p>You have an investment account with <strong>Family, Friends, and Associates Investments</strong>.</p>
    <p>To claim your account and access your investment information, please click the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${claimUrl}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Claim Your Account</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #3498db;">${claimUrl}</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="font-size: 12px; color: #777;">If you did not expect this email, please disregard it.</p>
  </div>
</body>
</html>
`

    const textBody = `Hello ${member.member_name},

You have an investment account with Family, Friends, and Associates Investments.

To claim your account and access your investment information, please visit:

${claimUrl}

If you did not expect this email, please disregard it.

---
FFA Investments
`

    const { error: queueError } = await supabase
      .from("email_queue")
      .insert({
        to_email: toEmail.trim(),
        from_email: "no-reply@ffainvestments.com",
        subject: "Claim your FFA Investments account",
        html_body: htmlBody,
        text_body: textBody,
        status: "queued",
        attempts: 0,
      })

    if (queueError) {
      return new Response(JSON.stringify({ error: "Failed to queue email", details: queueError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        queued: true,
        member_id: member_id,
        to_email: toEmail.trim(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
