/**
 * Import monthly snapshot tabs from final-history.xlsx into Supabase.
 *
 * Each Excel sheet (e.g. "Apr 2026") becomes one row in `monthly_snapshots`
 * plus N rows in `member_monthly_entries`.  Computed columns/views handle
 * total_value, unit_value, current_portfolio, ownership_pct.
 *
 * Usage:
 *   node scripts/import-monthly-history.mjs                      # default file
 *   node scripts/import-monthly-history.mjs path/to/file.xlsx
 *   node scripts/import-monthly-history.mjs --sheet "Apr 2026"  # single sheet
 *   node scripts/import-monthly-history.mjs --dry-run           # parse only
 */

import pg from 'pg'
import XLSX from 'xlsx'
import 'dotenv/config'
import { resolve } from 'node:path'

const argv = process.argv.slice(2)
const arg = (flag) => {
  const i = argv.indexOf(flag)
  return i >= 0 ? argv[i + 1] : null
}
const DRY_RUN = argv.includes('--dry-run')
const ONE_SHEET = arg('--sheet')
const positional = argv.filter((a) => !a.startsWith('--'))
const FILE = resolve(positional[0] || 'final-history.xlsx')

// ---------- helpers --------------------------------------------------------

const parseNum = (v) => {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return v
  let s = String(v).trim()
  if (!s) return 0
  // Negative parens: (1,234.50)
  let neg = false
  if (/^\(.*\)$/.test(s)) {
    neg = true
    s = s.slice(1, -1)
  }
  s = s.replace(/[$,\s]/g, '').replace(/[\r\n]/g, '')
  if (s.endsWith('%')) s = s.slice(0, -1)
  if (s === '' || s === '-') return 0
  const n = Number(s)
  if (!Number.isFinite(n)) return 0
  return neg ? -n : n
}

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
}

const parseSheetName = (name) => {
  // "Apr 2026", "Sept 2025", "Jan 2026"
  const m = name.trim().match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (!m) return null
  const monthIdx = MONTHS[m[1].toLowerCase()]
  if (monthIdx == null) return null
  const year = Number(m[2])
  const date = new Date(Date.UTC(year, monthIdx, 1))
  const iso = date.toISOString().slice(0, 10)
  return { month_label: name.trim(), snapshot_date: iso }
}

// ---------- name matching (mirrors import-deposits.mjs) -------------------

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v'])

const nameTokens = (raw) => {
  if (!raw) return []
  let s = String(raw).trim().toLowerCase()
  if (s.includes(',')) {
    const [last, rest] = s.split(',', 2)
    s = `${rest.trim()} ${last.trim()}`
  }
  return s
    .replace(/[.]/g, '')
    .split(/\s+/)
    .filter((t) => t && !SUFFIXES.has(t))
}

const matchMember = (rawName, members) => {
  const tokens = nameTokens(rawName)
  if (tokens.length === 0) return null
  let best = null
  let bestScore = 0
  for (const m of members) {
    const mt = nameTokens(m.member_name)
    if (mt.length === 0) continue
    const last = mt[mt.length - 1]
    const first = mt[0]
    if (!tokens.includes(last) || !tokens.includes(first)) continue
    const overlap = tokens.filter((t) => mt.includes(t)).length
    if (overlap > bestScore) {
      bestScore = overlap
      best = m
    }
  }
  return best
}

// ---------- sheet parsing --------------------------------------------------

const HEADER_TOKENS = ['member', 'dues paid', 'dues owed', 'contribution']

const isHeaderRow = (row) => {
  const joined = row.map((c) => String(c || '').toLowerCase()).join(' ')
  return HEADER_TOKENS.every((t) => joined.includes(t))
}

const extractAssetTotals = (rows) => {
  // Walk top of sheet collecting "<label>: <value>" pairs until we hit the
  // member header.  Some sheets put a 2nd block of the same data starting at
  // column 12; we only care about the canonical first columns.
  const out = {
    stock_value: 0,
    cash_credit_union: 0,
    cash_schwab: 0,
    mm_schwab: 0,
    gold_schwab: 0,
    other_value: 0,
    new_total_val_units: 0,
  }
  for (const row of rows) {
    if (!row || row.length === 0) continue
    if (isHeaderRow(row)) break
    const label = String(row[0] || '').toLowerCase()
    const value = parseNum(row[1])
    if (!label) continue
    if (label.includes('stock value') || label.includes('total stock value')) out.stock_value = value
    else if (label.includes('credit union')) out.cash_credit_union = value
    else if (label.includes('cash (charles schwab)')) out.cash_schwab = value
    else if (label.includes('mm (charles schwab)') || label.includes('money market')) out.mm_schwab = value
    else if (label.includes('gold')) out.gold_schwab = value
    else if (label.includes('s.t. account')) out.other_value = value     // older sheets
    else if (label.includes('new total val. units')) {
      // sometimes appears twice — keep the smaller "units" value (4-5 digits),
      // not the dollar-style entry like "$988,428.57"
      const candidate = value
      if (candidate > 0 && candidate < 1_000_000 && (out.new_total_val_units === 0 || candidate < out.new_total_val_units || out.new_total_val_units > 1_000_000)) {
        out.new_total_val_units = candidate
      }
    }
  }
  return out
}

const extractMemberRows = (rows) => {
  let headerIdx = -1
  for (let i = 0; i < rows.length; i++) {
    if (isHeaderRow(rows[i])) { headerIdx = i; break }
  }
  if (headerIdx < 0) return []
  const out = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue
    const name = String(r[0] || '').trim()
    if (!name) continue
    if (/^grand total/i.test(name)) break
    if (/^(totals?|member|membership)$/i.test(name)) continue
    out.push({
      member_name_raw:    name,
      dues_paid_buyout:   parseNum(r[2]),
      dues_owed:          parseNum(r[3]),
      total_contribution: parseNum(r[4]),
      previous_val_units: parseNum(r[5]),
      val_units_added:    parseNum(r[6]),
    })
  }
  // De-dup: if the same name appears twice (some months list each member in
  // both column-blocks), keep the row with the largest total_contribution.
  const dedup = new Map()
  for (const e of out) {
    const key = e.member_name_raw.toLowerCase()
    const existing = dedup.get(key)
    if (!existing || e.total_contribution > existing.total_contribution) {
      dedup.set(key, e)
    }
  }
  return [...dedup.values()]
}

// ---------- main -----------------------------------------------------------

const password = process.env.SUPABASE_DB_PASSWORD
if (!password && !DRY_RUN) {
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

async function main() {
  console.log(`Reading ${FILE}…`)
  const wb = XLSX.readFile(FILE)

  const sheets = ONE_SHEET ? [ONE_SHEET] : wb.SheetNames
  const parsed = []
  for (const name of sheets) {
    if (!wb.Sheets[name]) {
      console.warn(`  · skipping unknown sheet "${name}"`)
      continue
    }
    const meta = parseSheetName(name)
    if (!meta) {
      console.log(`  · skipping non-month sheet "${name}"`)
      continue
    }
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '' })
    const totals = extractAssetTotals(rows)
    const members = extractMemberRows(rows)
    parsed.push({ ...meta, totals, members })
    console.log(`  · ${name}: ${members.length} members, total_units=${totals.new_total_val_units}`)
  }

  if (DRY_RUN) {
    console.log(JSON.stringify(parsed, null, 2))
    return
  }

  await client.connect()

  // Load existing members for matching
  const { rows: memberList } = await client.query(`
    select id, member_name from public.members
  `)

  let snapInserts = 0
  let entryInserts = 0
  let unmatched = []

  for (const snap of parsed) {
    const ins = await client.query(
      `
      insert into public.monthly_snapshots
        (month_label, snapshot_date, stock_value, cash_credit_union,
         cash_schwab, mm_schwab, gold_schwab, other_value, new_total_val_units)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      on conflict (month_label) do update set
        snapshot_date       = excluded.snapshot_date,
        stock_value         = excluded.stock_value,
        cash_credit_union   = excluded.cash_credit_union,
        cash_schwab         = excluded.cash_schwab,
        mm_schwab           = excluded.mm_schwab,
        gold_schwab         = excluded.gold_schwab,
        other_value         = excluded.other_value,
        new_total_val_units = excluded.new_total_val_units
      returning id
      `,
      [
        snap.month_label, snap.snapshot_date,
        snap.totals.stock_value, snap.totals.cash_credit_union,
        snap.totals.cash_schwab, snap.totals.mm_schwab,
        snap.totals.gold_schwab, snap.totals.other_value,
        snap.totals.new_total_val_units,
      ]
    )
    const snapshotId = ins.rows[0].id
    snapInserts += 1

    // Replace the entries for this snapshot to keep imports idempotent.
    await client.query(`delete from public.member_monthly_entries where snapshot_id = $1`, [snapshotId])

    for (const e of snap.members) {
      const matched = matchMember(e.member_name_raw, memberList)
      if (!matched) unmatched.push(`${snap.month_label} → ${e.member_name_raw}`)
      await client.query(
        `
        insert into public.member_monthly_entries
          (snapshot_id, member_id, member_name_raw,
           dues_paid_buyout, dues_owed, total_contribution,
           previous_val_units, val_units_added)
        values ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          snapshotId,
          matched ? matched.id : null,
          e.member_name_raw,
          e.dues_paid_buyout, e.dues_owed, e.total_contribution,
          e.previous_val_units, e.val_units_added,
        ]
      )
      entryInserts += 1
    }
  }

  console.log(`\n✓ Imported ${snapInserts} snapshots, ${entryInserts} member entries`)
  if (unmatched.length > 0) {
    console.log(`  · ${unmatched.length} entries had no matching member (still saved with raw name):`)
    for (const u of unmatched) console.log(`      - ${u}`)
  }
}

main()
  .catch((err) => {
    console.error('Failed:', err.message)
    console.error(err.stack)
    process.exitCode = 1
  })
  .finally(() => client.end().catch(() => {}))
