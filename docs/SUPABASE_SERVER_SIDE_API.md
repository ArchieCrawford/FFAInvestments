# Supabase: Server-side API for Dashboard (Next.js examples)

Summary
--------
This document provides minimal, secure server-side examples (TypeScript + optional JS variants) to read member and account totals from Supabase Postgres for use in a Vercel dashboard. It shows:

- A Next.js API route using the Service Role key (server-only)
- A getServerSideProps snippet that calls that API
- A small client-side fetch example that renders totals
- A fallback SQL query (LEFT JOINs) if the `complete_member_profiles` view is not available
- Notes on RLS, caching, input validation, and a troubleshooting checklist

Assumptions
-----------
- Tables / view exist or equivalent columns are present:
  - view: `complete_member_profiles` (preferred)
  - or tables: `members`, `member_accounts`, `unit_prices`, `transactions`, `ffa_timeline`, `profiles`
- Required environment variables (Vercel/project):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`  (service role key — MUST remain server-side)
  - `NEXT_PUBLIC_API_BASE` (optional client base URL)

Security note
-------------
Use the Service Role key only on server-side code (API routes, getServerSideProps). Never leak it to client bundles, logs, or commit it to git.

TypeScript: Next.js API route (pages/api/dashboard.ts)
---------------------------------------------------
```ts
// pages/api/dashboard.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// TypeScript interfaces
interface MemberRow {
  member_id: string
  email: string
  full_name: string
  membership_status: string | null
  account_status: string | null
  member_account_id: string | null
  current_units: number | null
  total_contributions: number | null
  current_value: number | null
  calculated_current_value: number | null
  return_percentage: number | null
  total_gain_loss: number | null
  latest_portfolio_value: number | null
  unit_price_date: string | null
  last_report_date: string | null
}

interface ApiResponse {
  success: boolean
  page: number
  pageSize: number
  total: number
  rows: MemberRow[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse | { error: string }>) {
  try {
    // Input validation & defaults
    const page = Math.max(1, Number(req.query.page || 1))
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 25)))
    const offset = (page - 1) * pageSize
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const membership_status = typeof req.query.membership_status === 'string' ? req.query.membership_status : undefined
    const sort = req.query.sort === 'calculated_current_value' ? 'calculated_current_value' : 'calculated_current_value'

    // Use the prebuilt view if present
    const base = supabase.from('complete_member_profiles')

    // Build query
    let query = base.select(`member_id,email,full_name,membership_status,account_status,member_account_id,current_units,total_contributions,current_value,calculated_current_value,return_percentage,total_gain_loss,latest_portfolio_value,unit_price_date,last_report_date`, { count: 'exact' })

    if (search) {
      // safe parameterized filtering via ilike
      query = query.ilike('full_name', `%${search}%`).or(`email.ilike.%${search}%`)
    }

    if (membership_status) {
      query = query.eq('membership_status', membership_status)
    }

    query = query.order(sort, { ascending: false }).range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Supabase query error:', error.message)
      return res.status(500).json({ error: 'Internal server error' })
    }

    // Cache control for serverless responses: short TTL with stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')

    return res.status(200).json({ success: true, page, pageSize, total: count ?? 0, rows: data as MemberRow[] })
  } catch (err) {
    console.error('Unexpected API error')
    return res.status(500).json({ error: 'Unexpected server error' })
  }
}
```

Notes about the API route
- Uses `createClient` with the SERVICE_ROLE key so Row-Level Security (RLS) is bypassed for server-side aggregates. This is safe server-side only.
- Uses parameterized supabase-js helpers (select, ilike, eq, order, range). Do not build raw SQL with string concatenation.
- Sets a Cache-Control header appropriate for Vercel serverless responses.

getServerSideProps example (pages/admin/dashboard.tsx)
---------------------------------------------------
```ts
// pages/admin/dashboard.tsx (excerpt)
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const params = new URLSearchParams({ page: '1', pageSize: '25' })
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || ''
  const res = await fetch(`${apiBase}/api/dashboard?${params.toString()}`, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) {
    return { notFound: true }
  }
  const data = await res.json()
  return { props: { dashboardData: data } }
}
```

Client-side example (plain JS, fetch + render small totals)
--------------------------------------------------------
```js
// client/dashboardClient.js
async function fetchDashboard(page = 1, pageSize = 25, search = '') {
  const params = new URLSearchParams({ page, pageSize, search })
  const res = await fetch(`/api/dashboard?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to load dashboard')
  return res.json()
}

// render example (top-level totals)
async function renderTotals() {
  const data = await fetchDashboard(1, 10)
  const totalMembers = data.total
  const sumValue = data.rows.reduce((s, r) => s + (r.calculated_current_value || 0), 0)
  console.log('Total members on page:', totalMembers)
  console.log('Sum calculated_current_value (page):', sumValue)
  // Render top 10
  data.rows.slice(0, 10).forEach(r => console.log(r.full_name, r.calculated_current_value))
}
```

Plain JavaScript API route variant (pages/api/dashboard.js)
---------------------------------------------------------
```js
// pages/api/dashboard.js
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

module.exports = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1))
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 25)))
    const offset = (page - 1) * pageSize

    const query = supabase.from('complete_member_profiles')
      .select('member_id,email,full_name,membership_status,member_account_id,calculated_current_value', { count: 'exact' })
      .order('calculated_current_value', { ascending: false })
      .range(offset, offset + pageSize - 1)

    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: 'Internal server error' })
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.status(200).json({ success: true, page, pageSize, total: count || 0, rows: data })
  } catch (e) {
    res.status(500).json({ error: 'Unexpected server error' })
  }
}
```

If the `complete_member_profiles` view is not available — SQL fallback
--------------------------------------------------------------------
Use this as a starting raw SQL (server-side only). Prefer adding a view in the DB for performance.

```sql
SELECT
  m.id AS member_id,
  ma.email,
  ma.member_name AS full_name,
  p.membership_status,
  ma.id AS member_account_id,
  up.current_units,
  COALESCE(SUM(t.amount),0) AS total_contributions,
  up.price * COALESCE(up.current_units,0) AS current_value,
  (up.price * COALESCE(up.current_units,0)) AS calculated_current_value,
  /* other aggregates as needed */
FROM members m
LEFT JOIN member_accounts ma ON ma.member_id = m.id
LEFT JOIN LATERAL (
  SELECT price, price_date, units AS current_units
  FROM unit_prices
  WHERE unit_prices.member_account_id = ma.id
  ORDER BY price_date DESC
  LIMIT 1
) up ON true
LEFT JOIN transactions t ON t.member_account_id = ma.id
LEFT JOIN profiles p ON p.id = m.profile_id
GROUP BY m.id, ma.id, up.price, up.price_date, up.current_units, ma.member_name, ma.email, p.membership_status
ORDER BY calculated_current_value DESC
LIMIT $1 OFFSET $2;
```

Performance notes
-----------------
- Large LEFT JOINs and LATERAL queries can be slow on big data sets. Add indexes on: `member_accounts.id`, `member_accounts.email`, `member_accounts.member_name`, `unit_prices.member_account_id`, and `transactions.member_account_id`.
- Consider creating a materialized view that pre-aggregates calculated_current_value and refresh it on a schedule.

RLS note
--------
- This code uses the SERVICE_ROLE key so RLS is bypassed for server-side queries. If you must use the ANON key in server code (not recommended), you must ensure the user is authenticated and RLS policies allow the needed SELECTs. Typically you would:
  1. Require a logged-in user (validate cookie/token server-side)
  2. Use the anon key and let RLS enforce row visibility
  3. Or create a Postgres function exposed via RPC that encapsulates safe aggregates

Troubleshooting checklist (quick)
--------------------------------
1. RLS blocking: Temporarily test server-side with SERVICE_ROLE key to confirm data is reachable.
2. Env vars: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in Vercel; check for typos.
3. Missing view: Run `SELECT to_regclass('public.complete_member_profiles');` to see if view exists.
4. Column mismatches: Run a sample limited query: `SELECT * FROM complete_member_profiles LIMIT 1;`

Quick SQL checks (run in psql or Supabase SQL editor)
---------------------------------------------------
-- 1) Count members
SELECT COUNT(*) FROM members;

-- 2) Check view exists
SELECT to_regclass('public.complete_member_profiles');

-- 3) Show sample rows and columns
SELECT member_id, full_name, calculated_current_value FROM complete_member_profiles LIMIT 5;

-- 4) Ensure indexes (example)
CREATE INDEX IF NOT EXISTS idx_member_account_email ON member_accounts(email);

Final notes
-----------
Add this file to your `/docs` folder (done). If you want, I can also:

- Add a runnable example in `examples/nextjs-dashboard/` (minimal Next.js app) that you can deploy to Vercel.
- Implement a serverless function in this repo under `/api/examples/` but I will NOT add service role keys to the code — you'll set env vars in Vercel.

If you'd like the runnable example or the API stub added to the repository, tell me and I'll create it and run a local smoke test.
