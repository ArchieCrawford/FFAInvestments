import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const PAGE_SIZE = Number(process.env.SUPABASE_PAGE_SIZE || 1000);
const OUTPUT_DIR = process.env.SUPABASE_BACKUP_DIR || path.join(process.cwd(), 'supabase', 'backups');

const envTables = (process.env.SUPABASE_TABLES || '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

const argTables = (() => {
  const index = process.argv.indexOf('--tables');
  if (index === -1) return [];
  return process.argv
    .slice(index + 1)
    .join(' ')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
})();

const TABLES = [...new Set([...envTables, ...argTables])];

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_URL).');
  process.exit(1);
}

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. This must be a service role key.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ensureOutputDir = () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
};

const fetchAllRows = async (table) => {
  let from = 0;
  let rows = [];
  for (;;) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`${table}: ${error.message}`);

    rows = rows.concat(data || []);
    from += PAGE_SIZE;

    const total = count ?? rows.length;
    if (rows.length >= total || (data || []).length < PAGE_SIZE) break;
  }
  return rows;
};

const fetchFrom = async (fullTableName) => {
  return supabase.from(fullTableName).select('schemaname,tablename');
};

const fetchTableList = async () => {
  if (TABLES.length > 0) return TABLES;

  const allowedSchemas = ['public', 'auth', 'storage'];
  let data;
  let error;

  // Try pg_catalog.pg_tables first, then information_schema.tables as a fallback.
  ({ data, error } = await fetchFrom('pg_catalog.pg_tables'));
  if (error || !data) {
    ({ data, error } = await fetchFrom('information_schema.tables'));
  }

  if (error) {
    throw new Error(`Failed to fetch table list: ${error.message}`);
  }

  const tables = (data || [])
    .filter((t) => allowedSchemas.includes(t.schemaname))
    .map((t) => (t.schemaname === 'public' ? t.tablename : `${t.schemaname}.${t.tablename}`));

  if (tables.length === 0) {
    throw new Error('No tables found to export. Set SUPABASE_TABLES or check permissions.');
  }

  return tables;
};

const writeJson = async (table, rows) => {
  const filepath = path.join(OUTPUT_DIR, `${table}.json`);
  await fs.promises.writeFile(filepath, JSON.stringify(rows, null, 2));
  return filepath;
};

const main = async () => {
  ensureOutputDir();
  const summary = [];

  const tables = await fetchTableList();

  for (const table of tables) {
    console.log(`Exporting ${table}...`);
    const rows = await fetchAllRows(table);
    const filepath = await writeJson(table, rows);
    summary.push({ table, rows: rows.length, filepath });
    console.log(`Saved ${rows.length} rows to ${filepath}`);
  }

  console.log('\nExport summary:');
  for (const item of summary) {
    console.log(`${item.table}: ${item.rows} rows -> ${item.filepath}`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
