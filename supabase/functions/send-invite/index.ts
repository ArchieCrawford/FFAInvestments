import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const sendgridKey = Deno.env.get("SENDGRID_API_KEY")

    if (!supabaseUrl || !serviceKey || !sendgridKey) {
      return new Response(JSON.stringify({ error: "Missing environment configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    let parsed: { member_id?: string } = {}
    try {
      parsed = await req.json()
    } catch (_err) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { member_id } = parsed

    if (!member_id) {
      return new Response(JSON.stringify({ error: "member_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, full_name, member_name, email, claim_token")
      .eq("id", member_id)
      .single()

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: "Member not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    const memberName = member.full_name || member.member_name || "Member"
    const claimToken = member.claim_token || null
    const claim_link = claimToken
      ? `https://www.ffainvestments.com/claim/${claimToken}`
      : `https://www.ffainvestments.com/claim-account?memberId=${member.id}`

    const textBody =
`Hi ${memberName},

You’re listed as a member of the Family, Friends, and Associates investment club.
We’ve set up a new online portal where you can:

• View your units and portfolio value
• See meeting reports and unit price history
• Update your contact information
• Read member education content

To claim your online account, click this secure link:
${claim_link}

This link is unique to you. After you click it, you’ll be asked to:
1) Confirm your email
2) Create a password
3) Review your member details

If you believe you received this message in error, please ignore it.

Thanks,
FFA Investments Admin`

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Claim your FFA Investments partner account</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin:0; padding:0; background-color:#f3f4f6; font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#111827; }
    .wrapper { width:100%; table-layout:fixed; background-color:#f3f4f6; padding:24px 0; }
    .main { background-color:#ffffff; max-width:600px; margin:0 auto; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb; }
    .header { background:linear-gradient(135deg,#0f172a,#1f2937); padding:24px; text-align:center; color:#f9fafb; }
    .header-title { font-size:20px; font-weight:600; margin:0 0 4px 0; }
    .header-subtitle { font-size:13px; margin:0; color:#9ca3af; }
    .content { padding:24px 24px 12px 24px; font-size:15px; line-height:1.6; }
    .button-container { text-align:center; padding:16px 24px 32px 24px; }
    .button { display:inline-block; padding:12px 28px; border-radius:999px; background-color:#2563eb; color:#ffffff !important; text-decoration:none; font-weight:600; font-size:14px; }
    .button:hover { background-color:#1d4ed8; }
    .link-fallback { font-size:12px; color:#6b7280; padding:0 24px 24px 24px; word-break:break-all; }
    .footer { max-width:600px; margin:12px auto 0 auto; text-align:center; font-size:11px; color:#9ca3af; }
  </style>
</head>
<body>
  <table role="presentation" class="wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" class="main" cellpadding="0" cellspacing="0">
          <tr>
            <td class="header">
              <p class="header-title">FFA Investments</p>
              <p class="header-subtitle">Family, Friends, and Associates Investment Club</p>
            </td>
          </tr>
          <tr>
            <td class="content">
              <p>Hi ${memberName},</p>
              <p>
                You’re listed as a member of the Family, Friends, and Associates investment club.
                We’ve set up a new online portal where you can:
              </p>
              <ul>
                <li>View your units and portfolio value</li>
                <li>See meeting reports and unit price history</li>
                <li>Update your contact information</li>
                <li>Read member education content</li>
              </ul>
              <p>
                To claim your online account, click this secure link:
              </p>
            </td>
          </tr>
          <tr>
            <td class="button-container">
              <a href="${claim_link}" class="button" target="_blank" rel="noopener">
                Claim your account
              </a>
            </td>
          </tr>
          <tr>
            <td class="content">
              <p>
                This link is unique to you. After you click it, you’ll be asked to:
              </p>
              <ol>
                <li>Confirm your email</li>
                <li>Create a password</li>
                <li>Review your member details</li>
              </ol>
              <p>
                If you believe you received this message in error, please ignore it.
              </p>
              <p>Thanks,<br />FFA Investments Admin</p>
            </td>
          </tr>
          <tr>
            <td class="link-fallback">
              If the button above doesn’t work, copy and paste this link into your browser:<br />
              ${claim_link}
            </td>
          </tr>
        </table>
        <div class="footer">
          You are receiving this email because you are listed as a member of the FFA Investments club.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`

    const body = {
      personalizations: [
        {
          to: [{ email: member.email }],
          subject: "Claim your FFA Investments partner account",
        },
      ],
      from: { email: "admin@ffainvestments.com", name: "FFA Investments" },
      content: [
        { type: "text/plain", value: textBody },
        { type: "text/html", value: htmlBody },
      ],
    }

    const sg = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const responseText = await sg.text()
    const status = sg.status === 202 ? "sent" : "error"

    await supabase.from("member_invite_logs").insert({
      member_id: member.id,
      email: member.email,
      claim_link,
      status,
      http_status: sg.status,
      error_message: status === "error" ? responseText.slice(0, 500) : null,
    })

    return new Response(JSON.stringify({ status, http_status: sg.status }), {
      status: sg.status === 202 ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    })
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
