import 'dotenv/config'
import pg from 'pg'

const c = new pg.Client({
  host: 'db.wynbgrgmrygkodcdumii.supabase.co',
  user: 'postgres',
  database: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})
await c.connect()

const a = await c.query(`
  select month_label, snapshot_date, total_value, unit_value, new_total_val_units
    from monthly_snapshots order by snapshot_date desc limit 5
`)
console.log('--- latest snapshots ---'); console.table(a.rows)

const b = await c.query(`select count(*)::int as n from member_monthly_entries`)
console.log('total entries:', b.rows[0].n)

const d = await c.query(`
  select member_name_raw, current_portfolio, ownership_pct
    from monthly_member_view where month_label = 'Apr 2026'
   order by current_portfolio desc nulls last limit 5
`)
console.log('--- Apr 2026 top 5 ---'); console.table(d.rows)

await c.end()
