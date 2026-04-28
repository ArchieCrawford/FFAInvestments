/**
 * Apply a SQL migration file to Supabase Postgres directly.
 *
 * Usage:
 *   node scripts/apply-sql.mjs database/migrations/2026-04-27_add_deposits_table.sql
 *
 * Reads connection info from env:
 *   SUPABASE_DB_HOST (default db.<ref>.supabase.co)
 *   SUPABASE_DB_PASSWORD
 *   SUPABASE_DB_USER (default postgres)
 *   SUPABASE_DB_NAME (default postgres)
 *   SUPABASE_DB_PORT (default 5432)
 */
import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import 'dotenv/config'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/apply-sql.mjs <path-to-sql>')
  process.exit(1)
}

const sql = readFileSync(resolve(file), 'utf-8')

const password = process.env.SUPABASE_DB_PASSWORD
if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD in env')
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

try {
  await client.connect()
  console.log(`Applying ${file}…`)
  await client.query(sql)
  console.log('OK')
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
