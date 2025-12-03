import { v4 } from "npm:uuid@9.0.0";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Use POST' }), { status: 405 });
    const body = await req.json();
    const members = body.members || [];
    const createMissing = !!body.create_missing;
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE) return new Response(JSON.stringify({ error: 'Missing env SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), { status: 500 });

    const results = [];
    for (const m of members) {
      const email = (m.email || '').toLowerCase().trim();
      if (!email) { results.push({ member_id: m.member_id, error: 'missing email' }); continue; }

      // Lookup user by email
      const lookupRes = await fetch(`${SUPABASE_URL}/admin/v1/users?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${SERVICE_ROLE}` }
      });
      if (!lookupRes.ok) {
        results.push({ member_id: m.member_id, email, error: 'lookup_failed', status: lookupRes.status });
        continue;
      }
      const users = await lookupRes.json();
      let user = Array.isArray(users) ? users[0] : users;

      if (!user && createMissing) {
        // create user
        const password = v4();
        const createRes = await fetch(`${SUPABASE_URL}/admin/v1/users`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, email_confirm: true })
        });
        if (!createRes.ok) { results.push({ member_id: m.member_id, email, error: 'create_failed', status: createRes.status }); continue; }
        user = await createRes.json();
      }

      // Upsert into member_to_auth via REST
      const upsertBody = {
        member_id: m.member_id,
        auth_user_id: user ? user.id : null,
        email,
        status: user ? 'linked' : 'not_found'
      };
      const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/member_to_auth?select=member_id`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(upsertBody)
      });
      if (!upsertRes.ok) { results.push({ member_id: m.member_id, email, error: 'upsert_failed', status: upsertRes.status }); continue; }
      results.push({ member_id: m.member_id, email, auth_user_id: user ? user.id : null, upsert: true });
    }

    return new Response(JSON.stringify({ results }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});