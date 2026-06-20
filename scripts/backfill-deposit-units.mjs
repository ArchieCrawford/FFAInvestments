import pg from 'pg'
import 'dotenv/config'

const argv = process.argv.slice(2)
const sinceArg = argv.find((arg) => arg.startsWith('--since='))
const dryRun = argv.includes('--dry-run')

const SINCE_DATE = sinceArg ? sinceArg.split('=')[1] : '2025-12-01'

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

const normalizeName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ')

const round = (value, digits) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

async function main() {
  await client.connect()

  try {
    const snapshotsResult = await client.query(
      `select snapshot_date::date as snapshot_date, unit_value::numeric as unit_value
         from public.monthly_snapshots
        order by snapshot_date asc`
    )
    const snapshots = snapshotsResult.rows.map((row) => ({
      snapshotDate: new Date(row.snapshot_date),
      unitValue: Number(row.unit_value || 0),
    }))

    const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null
    const fallbackUnitValue = latestSnapshot?.unitValue || 0

    const membersResult = await client.query(
      `select id, member_name, email
         from public.members
        order by member_name asc`
    )
    const members = membersResult.rows
    const memberNameToId = new Map(
      members.map((row) => [normalizeName(row.member_name), row.id])
    )

    const depositsResult = await client.query(
      `select id, member_id, sender_name, amount, deposit_date, created_at
         from public.deposits
        where deposit_date >= $1::date
        order by deposit_date asc, created_at asc, id asc`,
      [SINCE_DATE]
    )

    const existingBackfillResult = await client.query(
      `select notes
         from public.member_unit_transactions
        where notes like 'backfill deposit:%'`
    )
    const existingBackfillIds = new Set()
    for (const row of existingBackfillResult.rows) {
      const note = String(row.notes || '')
      const match = note.match(/backfill deposit:([0-9a-f-]+)/i)
      if (match) existingBackfillIds.add(match[1])
    }

    const deposits = depositsResult.rows.filter((row) => {
      const depositId = String(row.id)
      return !existingBackfillIds.has(depositId)
    })

    const backfillRows = []
    const pendingAdjustmentsByMemberId = new Map()
    const skipped = []

    for (const deposit of deposits) {
      const depositDate = new Date(deposit.deposit_date)
      const applicableSnapshot = [...snapshots].reverse().find(
        (snapshot) => snapshot.snapshotDate.getTime() <= depositDate.getTime()
      )
      const unitValue = applicableSnapshot?.unitValue || fallbackUnitValue

      if (!unitValue || unitValue <= 0) {
        skipped.push({ depositId: deposit.id, reason: 'No usable unit value', depositDate: deposit.deposit_date })
        continue
      }

      const amount = Number(deposit.amount || 0)
      if (!Number.isFinite(amount) || amount <= 0) {
        skipped.push({ depositId: deposit.id, reason: 'Invalid amount', depositDate: deposit.deposit_date })
        continue
      }

      const unitsDelta = round(amount / unitValue, 8)
      const memberId = deposit.member_id || memberNameToId.get(normalizeName(deposit.sender_name)) || null

      if (!memberId) {
        skipped.push({ depositId: deposit.id, reason: 'No matching member', depositDate: deposit.deposit_date })
        continue
      }

      backfillRows.push({
        member_id: memberId,
        tx_date: deposit.deposit_date,
        tx_type: 'contribution',
        cash_amount: amount,
        unit_value_at_tx: unitValue,
        units_delta: unitsDelta,
        notes: `backfill deposit:${deposit.id} deposit_date:${deposit.deposit_date} sender:${deposit.sender_name || ''}`,
        created_at: deposit.created_at || new Date().toISOString(),
      })

      const current = pendingAdjustmentsByMemberId.get(memberId) || { amount: 0, units: 0 }
      current.amount += amount
      current.units += unitsDelta
      pendingAdjustmentsByMemberId.set(memberId, current)
    }

    const currentUnitValue = latestSnapshot?.unitValue || fallbackUnitValue

    console.log(JSON.stringify({
      since: SINCE_DATE,
      depositsFound: depositsResult.rows.length,
      backfillRows: backfillRows.length,
      skipped: skipped.length,
      currentUnitValue,
      sample: backfillRows.slice(0, 5),
    }, null, 2))

    if (dryRun) {
      if (skipped.length > 0) {
        console.log('Skipped rows:', JSON.stringify(skipped.slice(0, 10), null, 2))
      }
      return
    }

    await client.query('begin')

    if (backfillRows.length > 0) {
      const insertSql = `
        insert into public.member_unit_transactions
          (member_id, tx_date, tx_type, cash_amount, unit_value_at_tx, units_delta, notes, created_at)
        values
          ${backfillRows
            .map(
              (_, index) =>
                `($${index * 8 + 1}, $${index * 8 + 2}, $${index * 8 + 3}, $${index * 8 + 4}, $${index * 8 + 5}, $${index * 8 + 6}, $${index * 8 + 7}, $${index * 8 + 8})`
            )
            .join(',\n          ')}
      `

      const values = backfillRows.flatMap((row) => [
        row.member_id,
        row.tx_date,
        row.tx_type,
        row.cash_amount,
        row.unit_value_at_tx,
        row.units_delta,
        row.notes,
        row.created_at,
      ])

      await client.query(insertSql, values)
    }

    const appliedBackfillResult = await client.query(
      `select member_id,
              coalesce(sum(cash_amount), 0)::numeric as amount,
              coalesce(sum(units_delta), 0)::numeric as units
         from public.member_unit_transactions
        where notes like 'backfill deposit:%'
          and tx_date >= $1::date
        group by member_id`,
      [SINCE_DATE]
    )

    const appliedAdjustmentsByMemberId = new Map(
      appliedBackfillResult.rows.map((row) => [
        row.member_id,
        {
          amount: Number(row.amount || 0),
          units: Number(row.units || 0),
        },
      ])
    )

    const accountRowsResult = await client.query(
      `select member_id, member_name, email, current_units, total_contributions, current_value, ownership_percentage
         from public.member_accounts
        where is_active = true`
    )
    const accountRowsByMemberId = new Map(
      accountRowsResult.rows.map((row) => [row.member_id, row])
    )

    const targetMemberIds = new Set([
      ...accountRowsByMemberId.keys(),
      ...appliedAdjustmentsByMemberId.keys(),
    ])

    const projectionRows = []
    for (const memberId of targetMemberIds) {
      const member = members.find((row) => row.id === memberId)
      const account = accountRowsByMemberId.get(memberId) || null
      const adjustment = appliedAdjustmentsByMemberId.get(memberId) || { amount: 0, units: 0 }
      const baseUnits = Number(account?.current_units || 0)
      const baseContributions = Number(account?.total_contributions || 0)
      const nextUnits = baseUnits + adjustment.units
      if (!member && !account && adjustment.units === 0 && adjustment.amount === 0) {
        continue
      }
      projectionRows.push({
        member_id: memberId,
        member_name: member?.member_name || account?.member_name || '',
        email: member?.email || account?.email || null,
        current_units: nextUnits,
        total_contributions: baseContributions + adjustment.amount,
      })
    }

    const projectedTotalUnits = projectionRows.reduce(
      (sum, row) => sum + Number(row.current_units || 0),
      0
    )

    console.log(JSON.stringify({
      projectedTotalUnits,
      affectedMembers: projectionRows.length,
    }, null, 2))

    for (const row of projectionRows) {
      const ownership = projectedTotalUnits > 0 ? Number(row.current_units || 0) / projectedTotalUnits : 0
      const currentValue = Number(row.current_units || 0) * currentUnitValue

      await client.query(
        `insert into public.member_accounts
            (member_id, member_name, email, current_units, total_contributions, current_value, ownership_percentage, is_active, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, true, now())
         on conflict (member_id) do update set
            member_name = excluded.member_name,
            email = excluded.email,
            current_units = excluded.current_units,
            total_contributions = excluded.total_contributions,
            current_value = excluded.current_value,
            ownership_percentage = excluded.ownership_percentage,
            is_active = true,
            updated_at = now()`,
        [
          row.member_id,
          row.member_name,
          row.email,
          row.current_units,
          row.total_contributions,
          currentValue,
          ownership,
        ]
      )
    }

    await client.query('commit')

    console.log(`Backfill complete: ${backfillRows.length} rows inserted.`)
    if (skipped.length > 0) {
      console.log(`Skipped ${skipped.length} deposit(s).`)
    }
  } catch (error) {
    await client.query('rollback').catch(() => {})
    throw error
  }
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => client.end())