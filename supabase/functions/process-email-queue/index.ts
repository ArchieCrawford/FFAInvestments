/// <reference path="./types.d.ts" />
import { serve } from "https://deno.land/std@0.224.0/http/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY") ?? "";
const sendgridFrom = Deno.env.get("SENDGRID_FROM") ?? "";
const cronSecret = Deno.env.get("CRON_SECRET") ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

if (!sendgridApiKey || !sendgridFrom) {
  throw new Error("SENDGRID_API_KEY and SENDGRID_FROM must be set");
}

if (!cronSecret) {
  throw new Error("CRON_SECRET must be set");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function sendWithSendgrid(item: any) {
  const body = {
    personalizations: [
      {
        to: [
          {
            email: item.to_email,
            name: item.to_name ?? undefined
          }
        ]
      }
    ],
    from: {
      email: sendgridFrom
    },
    subject: item.subject,
    content: [
      item.html_body
        ? { type: "text/html", value: item.html_body }
        : { type: "text/plain", value: item.text_body ?? "" }
    ]
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendgridApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${text}`);
  }
}

// Explicitly type the request to avoid implicit any warnings in local TS analysis
serve(async (req: EdgeFunctionRequest) => {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: queue, error } = await supabase
    .from("email_queue")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  if (!queue || queue.length === 0) {
    return new Response(
      JSON.stringify({ processed: 0, sent: 0, failed: 0 }),
      { headers: { "content-type": "application/json" } }
    );
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    const now = new Date().toISOString();

    await supabase
      .from("email_queue")
      .update({
        status: "sending",
        attempts: (item.attempts ?? 0) + 1,
        last_attempt_at: now
      })
      .eq("id", item.id);

    try {
      await sendWithSendgrid(item);

      await supabase
        .from("email_queue")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_error: null
        })
        .eq("id", item.id);

      sentCount += 1;
    } catch (e) {
      await supabase
        .from("email_queue")
        .update({
          status: "failed",
          last_error: String(e),
          last_attempt_at: new Date().toISOString()
        })
        .eq("id", item.id);

      failedCount += 1;
    }
  }

  return new Response(
    JSON.stringify({
      processed: queue.length,
      sent: sentCount,
      failed: failedCount
    }),
    { headers: { "content-type": "application/json" } }
  );
});
