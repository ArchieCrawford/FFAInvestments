/**
 * Generate ffa-reports/input/report.csv from live Supabase data.
 *
 * Columns produced (matches what ffa-reports/index.js expects):
 *   member_name, email, portfolio_value, total_units, ownership_pct
 *
 * Data sources (in priority order):
 *   1. public.member_latest_dues  → total_contribution per member
 *   2. public.club_unit_valuations → latest unit price (for total_units)
 *   3. public.schwab_account_snapshots → latest club total value (overrides
 *      sum of contributions if available, then portfolio_value is split by
 *      ownership share)
 *
 * Usage:
 *   node scripts/generate-report-csv.mjs
 *   node scripts/generate-report-csv.mjs --out ffa-reports/input/report.csv
 *   node scripts/generate-report-csv.mjs --active-only
 */

import pg from 'pg'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import 'dotenv/config'

const argv = process.argv.slice(2)
const arg = (flag, fallback) => {
  const i = argv.indexOf(flag)
  return i >= 0 ? argv[i + 1] : fallback
}
const ACTIVE_ONLY = argv.includes('--active-only')
const OUT = resolve(arg('--out', 'ffa-reports/input/report.csv'))

const password = process.env.SUPABASE_DB_PASSWORD
if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD in .env')
  process.exit(1)
}

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST || 'db.wynbgrgmrygkodcdumii.supabase.co',
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  user: process.env.SUPABASE_DB_USER || 'postgres',
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  password,
  ssl: { rejectUnauthorized: false },
})

const csvEscape = (v) => {
  if (v == null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function main() {
  await client.connect()

  // 1) Members + their latest contribution
  const memberRows = await client.query(`
    select m.id, m.member_name, m.email, m.is_active, m.deleted_at,
           coalesce(d.total_contribution, 0)::numeric as total_contribution
      from public.members m
 left join public.member_latest_dues d on d.member_id = m.id
     where ($1 = false or (m.is_active and m.deleted_at is null))
     order by m.member_name
  `, [ACTIVE_ONLY])

  const members = memberRows.rows
  if (members.length === 0) {
    console.error('No members found.')
    process.exit(1)
  }

  // 2) Latest unit price (optional)
  let unitPrice = null
  try {
    const r = await client.query(`
      select unit_value from public.club_unit_valuations
       order by valuation_date desc nulls last, created_at desc nulls last
       limit 1
    `)
    if (r.rows[0]?.unit_value) unitPrice = Number(r.rows[0].unit_value)
  } catch { /* table may not exist or different schema */ }

  // 3) Latest club total value (optional)
  let clubTotalValue = null
  try {
    const r = await client.query(`
      select sum(coalesce(total_value, current_balance, 0))::numeric as total
        from public.schwab_account_snapshots
       where snapshot_date = (select max(snapshot_date) from public.schwab_account_snapshots)
    `)
    if (r.rows[0]?.total) clubTotalValue = Number(r.rows[0].total)
  } catch { /* ignore */ }

  const sumContrib = members.reduce(
    (s, m) => s + Number(m.total_contribution || 0),
    0
  )

  const out = []
  out.push('member_name,email,portfolio_value,total_units,ownership_pct')

  for (const m of members) {
    const contrib = Number(m.total_contribution || 0)
    const ownershipPct = sumContrib > 0 ? (contrib / sumContrib) * 100 : 0

    const portfolioValue =
      clubTotalValue != null && sumContrib > 0
        ? clubTotalValue * (contrib / sumContrib)
        : contrib

    const units = unitPrice && unitPrice > 0 ? portfolioValue / unitPrice : 0

    out.push(
      [
        csvEscape(m.member_name || ''),
        csvEscape(m.email || ''),
        portfolioValue.toFixed(2),
        units.toFixed(4),
        ownershipPct.toFixed(2),
      ].join(',')
    )
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, out.join('\n'))

  console.log(`✓ Wrote ${OUT}`)
  console.log(`  Members:        ${members.length}`)
  console.log(`  Σ contributions: $${sumContrib.toLocaleString()}`)
  console.log(
    `  Club total:     ${clubTotalValue != null ? `$${clubTotalValue.toLocaleString()}` : '(not available — using contributions)'}`
  )
  console.log(
    `  Unit price:     ${unitPrice != null ? `$${unitPrice}` : '(not available — units left as 0)'}`
  )
}

main()
  .catch((err) => {
    console.error('Failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => client.end())
