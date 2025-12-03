import { v4 } from "npm:uuid@9.0.0";

type MemberInput = {
  member_id: string;
  email: string;
};

type RequestBody = {
  members?: MemberInput[];
  create_missing?: boolean;
};

Deno.serve(async (req: Request) => {
  const url = Deno.env.get("PROJECT_URL");
  const serviceRole = Deno.env.get("SERVICE_ROLE_KEY");

  if (!url || !serviceRole) {
    return new Response(
      JSON.stringify({
        error: "Missing PROJECT_URL or SERVICE_ROLE_KEY",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: RequestBody | null = null;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const members = Array.isArray(body?.members) ? body!.members! : [];
  const createMissing = !!body?.create_missing;

  const results: Array<Record<string, unknown>> = [];

  for (const m of members) {
    const memberId = m?.member_id ?? null;
    const emailRaw = m?.email ?? "";
    const email = emailRaw.toLowerCase().trim();

    if (!memberId || !email) {
      results.push({
        member_id: memberId,
        email: emailRaw,
        error: "missing_member_id_or_email",
      });
      continue;
    }

    let user: any = null;

    const lookupRes = await fetch(
      `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${serviceRole}`,
          apikey: serviceRole,
        },
      }
    );

    if (lookupRes.ok) {
      const payload = await lookupRes.json();
      if (Array.isArray(payload) && payload.length > 0) {
        user = payload[0];
      } else if (!Array.isArray(payload) && payload?.id) {
        user = payload;
      }
    } else if (lookupRes.status !== 404) {
      results.push({
        member_id: memberId,
        email,
        error: "lookup_failed",
        status: lookupRes.status,
      });
      continue;
    }

    if (!user && createMissing) {
      const password = v4();
      const createRes = await fetch(`${url}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRole}`,
          apikey: serviceRole,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
        }),
      });

      if (!createRes.ok) {
        results.push({
          member_id: memberId,
          email,
          error: "create_failed",
          status: createRes.status,
        });
        continue;
      }

      user = await createRes.json();
    }

    const authUserId = user?.id ?? null;

    const upsertBody = {
      member_id: memberId,
      auth_user_id: authUserId,
      email,
      status: authUserId ? "linked" : "not_found",
    };

    const upsertRes = await fetch(`${url}/rest/v1/member_to_auth?select=member_id`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRole}`,
        apikey: serviceRole,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(upsertBody),
    });

    if (!upsertRes.ok) {
      results.push({
        member_id: memberId,
        email,
        auth_user_id: authUserId,
        error: "upsert_failed",
        status: upsertRes.status,
      });
      continue;
    }

    results.push({
      member_id: memberId,
      email,
      auth_user_id: authUserId,
      upsert: true,
    });
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
