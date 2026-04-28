import React, { useMemo, useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

const num = (v) => {
  if (v == null || v === '') return 0
  const n = Number(String(v).replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const ASSET_FIELDS = [
  ['stock_value',       'Stock Value'],
  ['cash_credit_union', 'Cash (Credit Union)'],
  ['cash_schwab',       'Cash (Charles Schwab)'],
  ['mm_schwab',         'MM (Charles Schwab)'],
  ['gold_schwab',       'Gold (Charles Schwab)'],
  ['other_value',       'Other'],
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const todayMonthLabel = () => {
  const d = new Date()
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
const todayDateInput = () => {
  const d = new Date()
  return `${d.getFullYear()}-01-01`.replace(/-01-01$/, `-${String(d.getMonth()+1).padStart(2,'0')}-01`)
}

export default function MonthlySnapshotForm({ snapshot, onClose, onSaved }) {
  const isEdit = !!snapshot
  const qc = useQueryClient()

  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [previousMode, setPreviousMode] = useState(isEdit ? 'manual' : 'auto')

  const [snap, setSnap] = useState(() => ({
    month_label:        snapshot?.month_label   || todayMonthLabel(),
    snapshot_date:      snapshot?.snapshot_date?.slice(0,10) || todayDateInput(),
    stock_value:        snapshot?.stock_value        || '',
    cash_credit_union:  snapshot?.cash_credit_union  || '',
    cash_schwab:        snapshot?.cash_schwab        || '',
    mm_schwab:          snapshot?.mm_schwab          || '',
    gold_schwab:        snapshot?.gold_schwab        || '',
    other_value:        snapshot?.other_value        || '',
    new_total_val_units:snapshot?.new_total_val_units|| '',
  }))

  // Load members list (for new entries) + existing entries (for edit)
  const { data: members = [] } = useQuery(['members_for_snapshot'], async () => {
    const { data, error } = await supabase
      .from('members')
      .select('id, member_name, email, is_active, deleted_at')
      .order('member_name')
    if (error) throw error
    return (data || []).filter((m) => m.is_active && !m.deleted_at)
  })

  const { data: existingEntries = [] } = useQuery(
    ['snapshot_entries', snapshot?.id],
    async () => {
      if (!snapshot?.id) return []
      const { data, error } = await supabase
        .from('member_monthly_entries')
        .select('*')
        .eq('snapshot_id', snapshot.id)
      if (error) throw error
      return data || []
    },
    { enabled: !!snapshot?.id }
  )

  // Auto-suggest "previous units" from latest snapshot for new month creation
  const { data: latestPrev } = useQuery(
    ['latest_prev_for_form'],
    async () => {
      if (isEdit) return null
      const { data: snaps } = await supabase
        .from('monthly_snapshots')
        .select('id, snapshot_date')
        .order('snapshot_date', { ascending: false })
        .limit(1)
      if (!snaps?.[0]) return null
      const { data: ents } = await supabase
        .from('member_monthly_entries')
        .select('member_id, member_name_raw, new_val_unit_total, total_contribution')
        .eq('snapshot_id', snaps[0].id)
      return { snapshot: snaps[0], entries: ents || [] }
    },
    { enabled: !isEdit }
  )

  // Build editable rows: one per active member; pre-fill if editing or
  // pulling forward from previous month
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (rows.length > 0) return
    if (isEdit && existingEntries.length > 0) {
      const byId = new Map()
      const byName = new Map()
      for (const e of existingEntries) {
        if (e.member_id) byId.set(e.member_id, e)
        else byName.set(e.member_name_raw.toLowerCase(), e)
      }
      const seedFromMembers = members.map((m) => {
        const e = byId.get(m.id)
        return {
          member_id: m.id,
          member_name_raw: e?.member_name_raw || m.member_name,
          dues_paid_buyout:   e?.dues_paid_buyout   ?? '',
          dues_owed:          e?.dues_owed          ?? '',
          total_contribution: e?.total_contribution ?? '',
          previous_val_units: e?.previous_val_units ?? '',
          val_units_added:    e?.val_units_added    ?? 0,
        }
      })
      // Add raw-only entries (no matching member)
      const orphanRows = [...byName.values()].map((e) => ({
        member_id: null,
        member_name_raw: e.member_name_raw,
        dues_paid_buyout:   e.dues_paid_buyout,
        dues_owed:          e.dues_owed,
        total_contribution: e.total_contribution,
        previous_val_units: e.previous_val_units,
        val_units_added:    e.val_units_added,
      }))
      setRows([...seedFromMembers, ...orphanRows])
    } else if (!isEdit && members.length > 0) {
      // Pre-fill from previous month's "new_val_unit_total" + last contribution
      const prevById = new Map()
      const prevByName = new Map()
      if (previousMode === 'auto' && latestPrev) {
        for (const e of latestPrev.entries) {
          if (e.member_id) prevById.set(e.member_id, e)
          else prevByName.set(e.member_name_raw.toLowerCase(), e)
        }
      }
      setRows(
        members.map((m) => {
          const p = prevById.get(m.id) || prevByName.get(m.member_name.toLowerCase())
          return {
            member_id: m.id,
            member_name_raw: m.member_name,
            dues_paid_buyout: '',
            dues_owed: '',
            total_contribution: p?.total_contribution ?? '',
            previous_val_units: p?.new_val_unit_total ?? '',
            val_units_added: 0,
          }
        })
      )
    }
  }, [isEdit, existingEntries, members, latestPrev, previousMode, rows.length])

  const updateRow = (i, field, value) => {
    setRows((prev) => {
      const next = prev.slice()
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  // Live derived previews (matches DB calc)
  const previews = useMemo(() => {
    const totalAssets =
      num(snap.stock_value) + num(snap.cash_credit_union) + num(snap.cash_schwab) +
      num(snap.mm_schwab) + num(snap.gold_schwab) + num(snap.other_value)
    const units = num(snap.new_total_val_units)
    const unitValue = units > 0 ? totalAssets / units : 0
    const memberRows = rows.map((r) => {
      const newUnits = num(r.previous_val_units) + num(r.val_units_added)
      const portfolio = newUnits * unitValue
      const pct = totalAssets > 0 ? portfolio / totalAssets : 0
      return { ...r, _new_units: newUnits, _portfolio: portfolio, _pct: pct }
    })
    const sumUnits     = memberRows.reduce((s, r) => s + r._new_units, 0)
    const sumPortfolio = memberRows.reduce((s, r) => s + r._portfolio, 0)
    return { totalAssets, unitValue, memberRows, sumUnits, sumPortfolio }
  }, [snap, rows])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const payload = {
        month_label:         snap.month_label.trim(),
        snapshot_date:       snap.snapshot_date,
        stock_value:         num(snap.stock_value),
        cash_credit_union:   num(snap.cash_credit_union),
        cash_schwab:         num(snap.cash_schwab),
        mm_schwab:           num(snap.mm_schwab),
        gold_schwab:         num(snap.gold_schwab),
        other_value:         num(snap.other_value),
        new_total_val_units: num(snap.new_total_val_units),
      }

      let snapshotId = snapshot?.id
      if (isEdit) {
        const { error } = await supabase
          .from('monthly_snapshots')
          .update(payload)
          .eq('id', snapshotId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('monthly_snapshots')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        snapshotId = data.id
      }

      // Replace entries (idempotent)
      const { error: delErr } = await supabase
        .from('member_monthly_entries')
        .delete()
        .eq('snapshot_id', snapshotId)
      if (delErr) throw delErr

      const entryRows = rows
        .map((r) => ({
          snapshot_id: snapshotId,
          member_id: r.member_id,
          member_name_raw: r.member_name_raw,
          dues_paid_buyout:   num(r.dues_paid_buyout),
          dues_owed:          num(r.dues_owed),
          total_contribution: num(r.total_contribution),
          previous_val_units: num(r.previous_val_units),
          val_units_added:    num(r.val_units_added),
        }))
        .filter((r) => r.member_name_raw && r.member_name_raw.trim())

      if (entryRows.length > 0) {
        const { error: insErr } = await supabase
          .from('member_monthly_entries')
          .insert(entryRows)
        if (insErr) throw insErr
      }

      qc.invalidateQueries({ queryKey: ['monthly_snapshots'] })
      qc.invalidateQueries({ queryKey: ['monthly_entries'] })
      onSaved?.(snapshotId)
      onClose?.()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const fmt$ = (n) =>
    `$${Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    })}`

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <form
        onSubmit={submit}
        className="card w-full max-w-6xl my-8 p-6 bg-default text-default"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">
              {isEdit ? `Edit ${snapshot.month_label}` : 'New Monthly Snapshot'}
            </h2>
            <p className="text-sm text-muted">
              Enter inputs only — total value, unit value, current portfolio, and % are computed by the database.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-default text-2xl leading-none">×</button>
        </div>

        {error && (
          <div className="card p-3 mb-4 border border-red-500/30 bg-red-500/5 text-sm">
            <div className="font-semibold text-red-500">Save failed</div>
            <div className="text-muted">{error}</div>
          </div>
        )}

        {/* Month header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="text-xs uppercase text-muted">Month label</span>
            <input
              className="input w-full"
              value={snap.month_label}
              onChange={(e) => setSnap({ ...snap, month_label: e.target.value })}
              placeholder="e.g. May 2026"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted">Snapshot date</span>
            <input
              className="input w-full"
              type="date"
              value={snap.snapshot_date}
              onChange={(e) => setSnap({ ...snap, snapshot_date: e.target.value })}
              required
            />
          </label>
        </div>

        {/* Asset inputs + computed total */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {ASSET_FIELDS.map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-xs uppercase text-muted">{label}</span>
              <input
                className="input w-full text-right"
                inputMode="decimal"
                value={snap[key]}
                onChange={(e) => setSnap({ ...snap, [key]: e.target.value })}
                placeholder="0.00"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-xs uppercase text-muted">New Total Val. Units</span>
            <input
              className="input w-full text-right"
              inputMode="decimal"
              value={snap.new_total_val_units}
              onChange={(e) => setSnap({ ...snap, new_total_val_units: e.target.value })}
              placeholder="auto: sum below"
            />
          </label>
          <button
            type="button"
            onClick={() => setSnap({ ...snap, new_total_val_units: previews.sumUnits.toFixed(6) })}
            className="self-end px-3 py-2 rounded bg-primary-soft text-default text-sm hover:opacity-90"
            title="Use Σ(new_val_unit_total) from members below"
          >
            ⇐ Use Σ from members
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
          <div className="card p-3">
            <div className="text-xs uppercase text-muted">Total Value (computed)</div>
            <div className="text-lg font-semibold">{fmt$(previews.totalAssets)}</div>
          </div>
          <div className="card p-3">
            <div className="text-xs uppercase text-muted">Unit Value (computed)</div>
            <div className="text-lg font-semibold">{fmt$(previews.unitValue)}</div>
          </div>
          <div className="card p-3">
            <div className="text-xs uppercase text-muted">Σ Member Portfolio</div>
            <div className="text-lg font-semibold">{fmt$(previews.sumPortfolio)}</div>
          </div>
        </div>

        {!isEdit && (
          <div className="mb-3 text-sm text-muted">
            Previous units pulled from latest snapshot.{' '}
            <button
              type="button"
              className="underline"
              onClick={() => { setPreviousMode((m) => m === 'auto' ? 'manual' : 'auto'); setRows([]) }}
            >
              {previousMode === 'auto' ? 'Clear and enter manually' : 'Pull from previous month'}
            </button>
          </div>
        )}

        {/* Member inputs */}
        <div className="card p-0 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary-soft/50 text-muted">
                <tr>
                  <th className="text-left px-2 py-2">Member</th>
                  <th className="text-right px-2 py-2">Dues Paid + Buyout</th>
                  <th className="text-right px-2 py-2">Dues Owed</th>
                  <th className="text-right px-2 py-2">Total Contribution</th>
                  <th className="text-right px-2 py-2">Prev Units</th>
                  <th className="text-right px-2 py-2">Units Added</th>
                  <th className="text-right px-2 py-2">New Units (calc)</th>
                  <th className="text-right px-2 py-2">Portfolio (calc)</th>
                  <th className="text-right px-2 py-2">% (calc)</th>
                </tr>
              </thead>
              <tbody>
                {previews.memberRows.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1">
                      <input
                        className="input w-full"
                        value={r.member_name_raw}
                        onChange={(e) => updateRow(i, 'member_name_raw', e.target.value)}
                      />
                    </td>
                    {['dues_paid_buyout', 'dues_owed', 'total_contribution', 'previous_val_units', 'val_units_added'].map((f) => (
                      <td key={f} className="px-1 py-1">
                        <input
                          className="input w-full text-right"
                          inputMode="decimal"
                          value={r[f] ?? ''}
                          onChange={(e) => updateRow(i, f, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 text-right">{r._new_units.toFixed(4)}</td>
                    <td className="px-2 py-1 text-right">{fmt$(r._portfolio)}</td>
                    <td className="px-2 py-1 text-right">{(r._pct * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 border-t border-border flex justify-between items-center">
            <button
              type="button"
              onClick={() => setRows((r) => [...r, {
                member_id: null, member_name_raw: '',
                dues_paid_buyout: '', dues_owed: '', total_contribution: '',
                previous_val_units: '', val_units_added: 0,
              }])}
              className="text-sm text-default hover:underline"
            >
              + Add row (raw name)
            </button>
            <div className="text-sm text-muted">
              Σ Units: <span className="text-default font-medium">{previews.sumUnits.toFixed(4)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-primary-soft text-default">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-primary-soft text-default font-semibold disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create snapshot'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers exported for AdminHistory page

export const exportSnapshotXlsx = (snapshot, entries) => {
  const wb = XLSX.utils.book_new()

  const summary = [
    ['Stock Value:',          Number(snapshot.stock_value)],
    ['Cash (Credit Union):',  Number(snapshot.cash_credit_union)],
    ['Cash (Charles Schwab)', Number(snapshot.cash_schwab)],
    ['MM (Charles Schwab)',   Number(snapshot.mm_schwab)],
    ['Gold (Charles Schwab)', Number(snapshot.gold_schwab)],
    ['Other:',                Number(snapshot.other_value)],
    ['Total Value',           Number(snapshot.total_value)],
    ['New Total Val. Units',  Number(snapshot.new_total_val_units)],
    ['New Unit Value:',       Number(snapshot.unit_value)],
    [],
    [],
    ['Member', '', 'Dues Paid + Buyout', 'Dues Owed', 'Total Contribution',
      'Previous Val. Units', 'Val. Units Added', 'New Val Unit Total',
      'Current Portfolio', '%'],
  ]

  for (const e of entries) {
    summary.push([
      e.member_name || e.member_name_raw,
      '',
      Number(e.dues_paid_buyout || 0),
      Number(e.dues_owed || 0),
      Number(e.total_contribution || 0),
      Number(e.previous_val_units || 0),
      Number(e.val_units_added || 0),
      Number(e.new_val_unit_total || 0),
      Number(e.current_portfolio || 0),
      Number(e.ownership_pct || 0),
    ])
  }

  const ws = XLSX.utils.aoa_to_sheet(summary)
  ws['!cols'] = [{ wch: 26 }, { wch: 4 }, { wch: 18 }, { wch: 14 }, { wch: 18 },
                 { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, ws, snapshot.month_label.slice(0, 31))

  XLSX.writeFile(wb, `${snapshot.month_label.replace(/\s+/g, '-')}.xlsx`)
}

export const exportAllSnapshotsXlsx = async (snapshots) => {
  const wb = XLSX.utils.book_new()
  for (const s of snapshots) {
    const { data, error } = await supabase
      .from('monthly_member_view')
      .select('*')
      .eq('snapshot_id', s.id)
      .order('current_portfolio', { ascending: false })
    if (error) throw error
    const rows = [
      ['Stock Value:',          Number(s.stock_value)],
      ['Cash (Credit Union):',  Number(s.cash_credit_union)],
      ['Cash (Charles Schwab)', Number(s.cash_schwab)],
      ['MM (Charles Schwab)',   Number(s.mm_schwab)],
      ['Gold (Charles Schwab)', Number(s.gold_schwab)],
      ['Other:',                Number(s.other_value)],
      ['Total Value',           Number(s.total_value)],
      ['New Total Val. Units',  Number(s.new_total_val_units)],
      ['New Unit Value:',       Number(s.unit_value)],
      [],
      [],
      ['Member', '', 'Dues Paid + Buyout', 'Dues Owed', 'Total Contribution',
        'Previous Val. Units', 'Val. Units Added', 'New Val Unit Total',
        'Current Portfolio', '%'],
      ...(data || []).map((e) => [
        e.member_name || e.member_name_raw, '',
        Number(e.dues_paid_buyout), Number(e.dues_owed),
        Number(e.total_contribution), Number(e.previous_val_units),
        Number(e.val_units_added), Number(e.new_val_unit_total),
        Number(e.current_portfolio), Number(e.ownership_pct),
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 26 }, { wch: 4 }, { wch: 18 }, { wch: 14 }, { wch: 18 },
                   { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 8 }]
    XLSX.utils.book_append_sheet(wb, ws, s.month_label.slice(0, 31))
  }
  XLSX.writeFile(wb, 'ffa-history.xlsx')
}
