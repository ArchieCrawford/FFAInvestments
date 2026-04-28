/**
 * Supabase / Postgres database audit.
 *
 * Produces a timestamped report folder under DatabaseAudit/audits/
 * containing:
 *   - report.md              Human-readable summary (tables, columns, FKs, RLS, indexes, sizes)
 *   - schema.json            Machine-readable structural snapshot
 *   - sizes.csv              Row counts + total size per table
 *   - rls.csv                All RLS policies
 *   - indexes.csv            All indexes per table
 *   - foreign-keys.csv       All FK relationships
 *   - data/<table>.json      First N rows for every public table
 *   - focus/<entity>.json    Domain-focused extracts (members, deposits, dues, ledger, …)
 *
 * Connection: reads .env for SUPABASE_DB_PASSWORD / SUPABASE_DB_HOST etc.
 *
 * Usage:
 *   node DatabaseAudit/audit-database.mjs
 *   node DatabaseAudit/audit-database.mjs --rows 100        # rows per table sample
 *   node DatabaseAudit/audit-database.mjs --schema public,storage
 */

import pg from 'pg'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ---- args ----
const argv = process.argv.slice(2)
const arg = (flag, fallback) => {
  const i = argv.indexOf(flag)
  return i >= 0 ? argv[i + 1] : fallback
}
const ROW_SAMPLE = Number(arg('--rows', 50))
const SCHEMAS = arg('--schema', 'public').split(',').map((s) => s.trim()).filter(Boolean)

// ---- connect ----
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

// ---- output dir ----
const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .slice(0, 19)
const OUT = join(__dirname, 'audits', stamp)
mkdirSync(join(OUT, 'data'), { recursive: true })
mkdirSync(join(OUT, 'focus'), { recursive: true })

const writeJson = (name, obj) =>
  writeFileSync(join(OUT, name), JSON.stringify(obj, null, 2))

const writeCsv = (name, rows, columns) => {
  const cols = columns || (rows[0] ? Object.keys(rows[0]) : [])
  const escape = (v) => {
    if (v == null) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    cols.join(','),
    ...rows.map((r) => cols.map((c) => escape(r[c])).join(',')),
  ]
  writeFileSync(join(OUT, name), lines.join('\n'))
}

const md = []
const log = (line = '') => md.push(line)

// ---- main ----
async function main() {
  console.log('Connecting…')
  await client.connect()

  const dbInfo = await client.query(
    `select current_database() as db, current_user as usr, version() as version, now() as now`
  )
  const { db, usr, version, now } = dbInfo.rows[0]

  log(`# Database Audit`)
  log()
  log(`- **Database**: \`${db}\``)
  log(`- **Connected as**: \`${usr}\``)
  log(`- **Server time**: ${new Date(now).toISOString()}`)
  log(`- **Postgres**: ${version.split(',')[0]}`)
  log(`- **Schemas audited**: ${SCHEMAS.map((s) => `\`${s}\``).join(', ')}`)
  log(`- **Row sample size**: ${ROW_SAMPLE} rows/table`)
  log(`- **Generated**: ${stamp}`)
  log()

  // ---- Tables + sizes ----
  console.log('Collecting table sizes…')
  const sizes = await client.query(
    `select n.nspname as schema,
            c.relname as table_name,
            c.reltuples::bigint as estimated_rows,
            pg_total_relation_size(c.oid) as total_bytes,
            pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
            pg_size_pretty(pg_relation_size(c.oid)) as table_size,
            pg_size_pretty(pg_indexes_size(c.oid)) as index_size,
            obj_description(c.oid) as comment
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where c.relkind = 'r'
        and n.nspname = any($1::text[])
      order by pg_total_relation_size(c.oid) desc`,
    [SCHEMAS]
  )
  writeCsv('sizes.csv', sizes.rows)

  log(`## Table sizes`)
  log()
  log(`| Schema | Table | Est. Rows | Total | Table | Indexes |`)
  log(`|---|---|---:|---:|---:|---:|`)
  for (const r of sizes.rows) {
    log(
      `| ${r.schema} | \`${r.table_name}\` | ${Number(r.estimated_rows).toLocaleString()} | ${r.total_size} | ${r.table_size} | ${r.index_size} |`
    )
  }
  log()

  // ---- Exact row counts (public only, can be slow on huge tables) ----
  console.log('Counting rows (exact)…')
  const exactCounts = []
  for (const r of sizes.rows.filter((s) => s.schema === 'public')) {
    try {
      const { rows } = await client.query(
        `select count(*)::bigint as n from "${r.schema}"."${r.table_name}"`
      )
      exactCounts.push({ schema: r.schema, table: r.table_name, rows: Number(rows[0].n) })
    } catch (e) {
      exactCounts.push({ schema: r.schema, table: r.table_name, rows: null, error: e.message })
    }
  }
  writeCsv('row-counts.csv', exactCounts)

  log(`## Exact row counts (public schema)`)
  log()
  log(`| Table | Rows |`)
  log(`|---|---:|`)
  for (const c of exactCounts.sort((a, b) => (b.rows || 0) - (a.rows || 0))) {
    log(`| \`${c.table}\` | ${c.rows == null ? `error: ${c.error}` : c.rows.toLocaleString()} |`)
  }
  log()

  // ---- Columns ----
  console.log('Collecting columns…')
  const columns = await client.query(
    `select table_schema, table_name, column_name, ordinal_position,
            data_type, is_nullable, column_default,
            character_maximum_length, numeric_precision, numeric_scale
       from information_schema.columns
      where table_schema = any($1::text[])
      order by table_schema, table_name, ordinal_position`,
    [SCHEMAS]
  )

  // ---- Primary keys ----
  const pks = await client.query(
    `select tc.table_schema, tc.table_name,
            array_agg(kcu.column_name order by kcu.ordinal_position) as pk_columns
       from information_schema.table_constraints tc
       join information_schema.key_column_usage kcu
         on tc.constraint_name = kcu.constraint_name
        and tc.table_schema = kcu.table_schema
      where tc.constraint_type = 'PRIMARY KEY'
        and tc.table_schema = any($1::text[])
      group by tc.table_schema, tc.table_name`,
    [SCHEMAS]
  )
  const pkMap = new Map(pks.rows.map((r) => [`${r.table_schema}.${r.table_name}`, r.pk_columns]))

  // ---- Foreign keys ----
  console.log('Collecting foreign keys…')
  const fks = await client.query(
    `select tc.table_schema as schema,
            tc.table_name,
            kcu.column_name,
            ccu.table_schema as ref_schema,
            ccu.table_name as ref_table,
            ccu.column_name as ref_column,
            tc.constraint_name
       from information_schema.table_constraints tc
       join information_schema.key_column_usage kcu
         on tc.constraint_name = kcu.constraint_name
        and tc.table_schema = kcu.table_schema
       join information_schema.constraint_column_usage ccu
         on ccu.constraint_name = tc.constraint_name
        and ccu.table_schema = tc.table_schema
      where tc.constraint_type = 'FOREIGN KEY'
        and tc.table_schema = any($1::text[])
      order by tc.table_schema, tc.table_name`,
    [SCHEMAS]
  )
  writeCsv('foreign-keys.csv', fks.rows)

  // ---- Indexes ----
  console.log('Collecting indexes…')
  const indexes = await client.query(
    `select schemaname as schema, tablename as table_name,
            indexname as index_name, indexdef
       from pg_indexes
      where schemaname = any($1::text[])
      order by schemaname, tablename, indexname`,
    [SCHEMAS]
  )
  writeCsv('indexes.csv', indexes.rows)

  // ---- RLS policies ----
  console.log('Collecting RLS policies…')
  const rls = await client.query(
    `select n.nspname as schema, c.relname as table_name, c.relrowsecurity as rls_enabled
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where c.relkind = 'r' and n.nspname = any($1::text[])
      order by n.nspname, c.relname`,
    [SCHEMAS]
  )
  const rlsMap = new Map(rls.rows.map((r) => [`${r.schema}.${r.table_name}`, r.rls_enabled]))

  const policies = await client.query(
    `select schemaname as schema, tablename as table_name, policyname as policy,
            permissive, roles, cmd, qual, with_check
       from pg_policies
      where schemaname = any($1::text[])
      order by schemaname, tablename, policyname`,
    [SCHEMAS]
  )
  writeCsv('rls.csv', policies.rows)

  // ---- Views ----
  const views = await client.query(
    `select table_schema, table_name, view_definition
       from information_schema.views
      where table_schema = any($1::text[])
      order by table_schema, table_name`,
    [SCHEMAS]
  )

  // ---- Functions ----
  const fns = await client.query(
    `select n.nspname as schema, p.proname as name,
            pg_get_function_identity_arguments(p.oid) as args,
            pg_get_function_result(p.oid) as returns,
            l.lanname as language
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       join pg_language l on l.oid = p.prolang
      where n.nspname = any($1::text[])
      order by n.nspname, p.proname`,
    [SCHEMAS]
  )

  // ---- Tables markdown details ----
  log(`## Schema details`)
  log()
  const colByTable = new Map()
  for (const c of columns.rows) {
    const k = `${c.table_schema}.${c.table_name}`
    if (!colByTable.has(k)) colByTable.set(k, [])
    colByTable.get(k).push(c)
  }
  const fkByTable = new Map()
  for (const f of fks.rows) {
    const k = `${f.schema}.${f.table_name}`
    if (!fkByTable.has(k)) fkByTable.set(k, [])
    fkByTable.get(k).push(f)
  }
  const polByTable = new Map()
  for (const p of policies.rows) {
    const k = `${p.schema}.${p.table_name}`
    if (!polByTable.has(k)) polByTable.set(k, [])
    polByTable.get(k).push(p)
  }

  for (const t of sizes.rows) {
    const key = `${t.schema}.${t.table_name}`
    log(`### \`${key}\``)
    if (t.comment) log(`> ${t.comment}`)
    log()
    log(`- **Rows (est.)**: ${Number(t.estimated_rows).toLocaleString()} • **Total size**: ${t.total_size}`)
    const pk = pkMap.get(key)
    if (pk) {
      const pkList = Array.isArray(pk) ? pk : [pk]
      log(`- **Primary key**: \`${pkList.join(', ')}\``)
    }
    log(`- **RLS enabled**: ${rlsMap.get(key) ? '✅ yes' : '❌ no'}`)
    log()
    const cols = colByTable.get(key) || []
    if (cols.length) {
      log(`| Column | Type | Nullable | Default |`)
      log(`|---|---|---|---|`)
      for (const c of cols) {
        const t2 =
          c.character_maximum_length
            ? `${c.data_type}(${c.character_maximum_length})`
            : c.numeric_precision
              ? `${c.data_type}(${c.numeric_precision},${c.numeric_scale ?? 0})`
              : c.data_type
        log(
          `| \`${c.column_name}\` | ${t2} | ${c.is_nullable} | ${c.column_default ? `\`${c.column_default}\`` : ''} |`
        )
      }
      log()
    }
    const fkRows = fkByTable.get(key) || []
    if (fkRows.length) {
      log(`**Foreign keys**`)
      for (const f of fkRows) {
        log(
          `- \`${f.column_name}\` → \`${f.ref_schema}.${f.ref_table}.${f.ref_column}\` _(constraint \`${f.constraint_name}\`)_`
        )
      }
      log()
    }
    const polRows = polByTable.get(key) || []
    if (polRows.length) {
      log(`**RLS policies**`)
      for (const p of polRows) {
        log(`- \`${p.policy}\` (${p.cmd}) — using: \`${p.qual ?? '—'}\` ${p.with_check ? `with check: \`${p.with_check}\`` : ''}`)
      }
      log()
    }
  }

  // ---- Views section ----
  if (views.rows.length) {
    log(`## Views`)
    log()
    for (const v of views.rows) {
      log(`### \`${v.table_schema}.${v.table_name}\``)
      log('```sql')
      log(v.view_definition?.trim() || '')
      log('```')
      log()
    }
  }

  // ---- Functions ----
  if (fns.rows.length) {
    log(`## Functions`)
    log()
    log(`| Schema | Name | Args | Returns | Lang |`)
    log(`|---|---|---|---|---|`)
    for (const f of fns.rows) {
      log(`| ${f.schema} | \`${f.name}\` | ${f.args || ''} | ${f.returns} | ${f.language} |`)
    }
    log()
  }

  // ---- Per-table sample dumps ----
  console.log(`Sampling up to ${ROW_SAMPLE} rows per public table…`)
  for (const t of sizes.rows.filter((s) => s.schema === 'public')) {
    try {
      const { rows } = await client.query(
        `select * from "${t.schema}"."${t.table_name}" limit $1`,
        [ROW_SAMPLE]
      )
      writeJson(`data/${t.table_name}.json`, rows)
    } catch (e) {
      writeJson(`data/${t.table_name}.json`, { error: e.message })
    }
  }

  // ---- Domain-focused extracts ----
  console.log('Building domain-focused extracts…')
  const focus = {}

  // Members snapshot
  try {
    const r = await client.query(
      `select id, member_name, email, role, is_active, deleted_at, auth_user_id, created_at
         from public.members order by member_name`
    )
    focus.members = r.rows
    writeJson('focus/members.json', r.rows)
  } catch (e) {
    focus.members_error = e.message
  }

  // Deposits totals by member
  try {
    const r = await client.query(
      `select coalesce(m.member_name, d.sender_name) as member,
              count(*) as deposit_count,
              sum(d.amount)::numeric(14,2) as total_amount,
              min(d.deposit_date) as first_deposit,
              max(d.deposit_date) as last_deposit
         from public.deposits d
    left join public.members m on m.id = d.member_id
        group by coalesce(m.member_name, d.sender_name)
        order by total_amount desc nulls last`
    )
    focus.deposits_by_member = r.rows
    writeJson('focus/deposits-by-member.json', r.rows)
    writeCsv('focus/deposits-by-member.csv', r.rows)
  } catch (e) {
    focus.deposits_error = e.message
  }

  // Deposits raw recent
  try {
    const r = await client.query(
      `select d.deposit_date, d.sender_name, m.member_name as matched_member,
              d.amount, d.confirmation_number, d.source
         from public.deposits d
    left join public.members m on m.id = d.member_id
        order by d.deposit_date desc, d.amount desc`
    )
    writeJson('focus/deposits-recent.json', r.rows)
    writeCsv('focus/deposits-recent.csv', r.rows)
  } catch (e) { /* table may not exist */ }

  // Latest dues per member if view exists
  try {
    const r = await client.query(`select * from public.member_latest_dues`)
    writeJson('focus/dues-latest.json', r.rows)
    writeCsv('focus/dues-latest.csv', r.rows)
  } catch (e) { /* view may not exist */ }

  // Auth users count vs members linked
  try {
    const r = await client.query(`
      select (select count(*) from auth.users) as auth_users,
             (select count(*) from public.members where auth_user_id is not null) as linked_members,
             (select count(*) from public.members where auth_user_id is null) as unlinked_members
    `)
    focus.auth_summary = r.rows[0]
  } catch (e) { /* may not have auth read perm */ }

  // ---- Domain summary section ----
  log(`## Domain summary`)
  log()
  if (focus.auth_summary) {
    const a = focus.auth_summary
    log(`- **auth.users**: ${a.auth_users}`)
    log(`- **members linked to auth user**: ${a.linked_members}`)
    log(`- **members unlinked**: ${a.unlinked_members}`)
    log()
  }
  if (focus.members) {
    log(`### Members (${focus.members.length})`)
    log()
    log(`| Name | Email | Role | Active | Auth linked |`)
    log(`|---|---|---|---|---|`)
    for (const m of focus.members) {
      log(
        `| ${m.member_name || '—'} | ${m.email || '—'} | ${m.role || '—'} | ${m.is_active ? '✅' : '—'} | ${m.auth_user_id ? '✅' : '—'} |`
      )
    }
    log()
  }
  if (focus.deposits_by_member) {
    log(`### Deposits totals`)
    log()
    log(`| Member | Deposits | Total | First | Last |`)
    log(`|---|---:|---:|---|---|`)
    for (const d of focus.deposits_by_member) {
      log(
        `| ${d.member} | ${d.deposit_count} | $${Number(d.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} | ${d.first_deposit} | ${d.last_deposit} |`
      )
    }
    log()
  }

  // ---- machine-readable schema dump ----
  writeJson('schema.json', {
    generated_at: new Date().toISOString(),
    schemas: SCHEMAS,
    tables: sizes.rows,
    columns: columns.rows,
    primary_keys: pks.rows,
    foreign_keys: fks.rows,
    indexes: indexes.rows,
    rls: rls.rows,
    policies: policies.rows,
    views: views.rows,
    functions: fns.rows,
    focus,
  })

  writeFileSync(join(OUT, 'report.md'), md.join('\n'))
  console.log(`\n✓ Audit complete: ${OUT}`)
}

main()
  .catch((err) => {
    console.error('Audit failed:', err)
    process.exitCode = 1
  })
  .finally(() => client.end())
