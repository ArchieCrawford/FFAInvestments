/**
 * Import deposits from the fixed CSV into Supabase.
 *
 * Prereqs:
 *   1. Run scripts/fix-deposit-dates.py first (produces Deposits/deposits_fixed.csv)
 *   2. Apply database/migrations/2026-04-27_add_deposits_table.sql
 *   3. Set env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/import-deposits.mjs
 *   node scripts/import-deposits.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CSV_PATH = resolve(ROOT, 'Deposits', 'deposits_fixed.csv')

const dryRun = process.argv.includes('--dry-run')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

function parseAmount(s) {
  if (s == null) return null
  const n = Number(String(s).replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

function normName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv'])

function nameTokens(s) {
  // Handle "Last, First" → "first last"
  let t = normName(s)
  if (t.includes(',')) {
    const [last, rest] = t.split(',', 2).map((x) => x.trim())
    t = `${rest} ${last}`.trim()
  }
  return t
    .replace(/[,]/g, ' ')
    .split(' ')
    .map((x) => x.trim())
    .filter((x) => x && x.length > 1 && !SUFFIXES.has(x))
}

async function loadMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('id, member_name, email')
  if (error) throw error
  return data || []
}

function buildMemberLookup(members) {
  const map = new Map()
  const add = (key, m) => {
    if (!key) return
    const k = normName(key)
    if (k && !map.has(k)) map.set(k, m)
  }
  for (const m of members) {
    add(m.member_name, m)
    if (m.email) add(m.email.split('@')[0], m)
  }
  return map
}

function matchMember(senderName, lookup, members) {
  const norm = normName(senderName)
  if (!norm) return null
  if (lookup.has(norm)) return lookup.get(norm)

  const senderTokens = new Set(nameTokens(senderName))
  if (senderTokens.size === 0) return null

  // Score each member by token overlap; require first + last to overlap.
  let best = null
  let bestScore = 0
  for (const m of members) {
    const mt = nameTokens(m.member_name)
    if (mt.length < 2) continue
    const first = mt[0]
    const last = mt[mt.length - 1]
    if (!senderTokens.has(first) || !senderTokens.has(last)) continue
    const overlap = mt.filter((t) => senderTokens.has(t)).length
    if (overlap > bestScore) {
      bestScore = overlap
      best = m
    }
  }
  return best
}

async function main() {
  console.log(`Reading: ${CSV_PATH}`)
  const csv = readFileSync(CSV_PATH, 'utf-8')
  const { data: rows, errors } = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
  })
  if (errors.length) {
    console.error('CSV parse errors:', errors)
    process.exit(1)
  }
  console.log(`Parsed ${rows.length} CSV rows`)

  const members = await loadMembers()
  console.log(`Loaded ${members.length} members from DB`)
  const lookup = buildMemberLookup(members)

  const records = []
  const unmatched = []
  for (const row of rows) {
    const sender = row['Sender']?.trim()
    const amount = parseAmount(row['Amount'])
    const confirm = String(row['Confirmation #'] || '').trim() || null
    const dateIso = (row['Deposit Date (ISO)'] || row['Date of Deposit'] || '').trim()
    const dtIso = (row['Deposit DateTime (ISO)'] || '').trim() || null

    if (!sender || amount == null || !dateIso) {
      console.warn('Skipping row with missing fields:', row)
      continue
    }

    const member = matchMember(sender, lookup, members)
    if (!member) unmatched.push(sender)

    records.push({
      member_id: member?.id || null,
      sender_name: sender,
      amount,
      confirmation_number: confirm,
      deposit_date: dateIso,
      deposit_at: dtIso,
      source: 'zelle',
    })
  }

  console.log(
    `Prepared ${records.length} deposit records (${
      records.filter((r) => r.member_id).length
    } matched to members, ${unmatched.length} unmatched)`
  )
  if (unmatched.length) {
    console.log('Unmatched senders:', [...new Set(unmatched)])
  }

  if (dryRun) {
    console.log('--dry-run set; not writing to DB')
    console.log(JSON.stringify(records.slice(0, 3), null, 2))
    return
  }

  // Upsert by confirmation_number to allow re-running
  const { data, error } = await supabase
    .from('deposits')
    .upsert(records, { onConflict: 'confirmation_number' })
    .select('id')

  if (error) {
    console.error('Insert error:', error)
    process.exit(1)
  }
  console.log(`Upserted ${data?.length ?? 0} deposit rows`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
