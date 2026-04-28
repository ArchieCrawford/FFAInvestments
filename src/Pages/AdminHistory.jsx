import React, { useMemo, useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'
import MonthlySnapshotForm, {
  exportSnapshotXlsx,
  exportAllSnapshotsXlsx,
} from './MonthlySnapshotForm.jsx'

const fmtMoney = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const fmtUnits = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })

const fmtPct = (n) =>
  `${(Number(n || 0) * 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`

const fetchSnapshots = async () => {
  const { data, error } = await supabase
    .from('monthly_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
  if (error) throw error
  return data || []
}

const fetchEntries = async (snapshotId) => {
  if (!snapshotId) return []
  const { data, error } = await supabase
    .from('monthly_member_view')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .order('current_portfolio', { ascending: false })
  if (error) throw error
  return data || []
}

const SummaryCard = ({ label, value, sub }) => (
  <div className="card p-4">
    <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    <div className="text-2xl font-semibold text-default mt-1">{value}</div>
    {sub != null && <div className="text-xs text-muted mt-1">{sub}</div>}
  </div>
)

export default function AdminHistory() {
  const qc = useQueryClient()
  const {
    data: snapshots = [],
    isLoading: loadingSnaps,
    error: snapError,
  } = useQuery(['monthly_snapshots'], fetchSnapshots)

  const [activeId, setActiveId]   = useState(null)
  const [formOpen, setFormOpen]   = useState(false)
  const [editingSnap, setEditing] = useState(null)
  const [busy, setBusy]           = useState(false)

  useEffect(() => {
    if (!activeId && snapshots.length > 0) setActiveId(snapshots[0].id)
  }, [snapshots, activeId])

  const active = useMemo(
    () => snapshots.find((s) => s.id === activeId) || null,
    [snapshots, activeId]
  )

  const {
    data: entries = [],
    isLoading: loadingEntries,
  } = useQuery(['monthly_entries', activeId], () => fetchEntries(activeId), {
    enabled: !!activeId,
  })

  const totals = useMemo(() => {
    const t = {
      contribution: 0, dues_paid: 0, dues_owed: 0,
      units: 0, portfolio: 0,
    }
    for (const e of entries) {
      t.contribution += Number(e.total_contribution || 0)
      t.dues_paid    += Number(e.dues_paid_buyout || 0)
      t.dues_owed    += Number(e.dues_owed || 0)
      t.units        += Number(e.new_val_unit_total || 0)
      t.portfolio    += Number(e.current_portfolio || 0)
    }
    return t
  }, [entries])

  return (
    <Page
      title="Monthly History"
      subtitle="Per-month snapshots — calculations run in the database"
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => { setEditing(null); setFormOpen(true) }}
            className="px-3 py-1.5 rounded bg-primary-soft text-default text-sm font-semibold"
          >
            <i className="fas fa-plus mr-1" /> New Snapshot
          </button>
          {active && (
            <button
              onClick={() => { setEditing(active); setFormOpen(true) }}
              className="px-3 py-1.5 rounded bg-primary-soft text-default text-sm"
            >
              <i className="fas fa-pen mr-1" /> Edit
            </button>
          )}
          {active && (
            <button
              onClick={() => exportSnapshotXlsx(active, entries)}
              className="px-3 py-1.5 rounded bg-primary-soft text-default text-sm"
              disabled={!entries.length}
            >
              <i className="fas fa-file-excel mr-1" /> Export tab
            </button>
          )}
          <button
            onClick={async () => {
              setBusy(true)
              try { await exportAllSnapshotsXlsx(snapshots) }
              finally { setBusy(false) }
            }}
            disabled={busy || snapshots.length === 0}
            className="px-3 py-1.5 rounded bg-primary-soft text-default text-sm disabled:opacity-50"
          >
            <i className="fas fa-file-export mr-1" /> Export all
          </button>
          {active && (
            <button
              onClick={async () => {
                if (!window.confirm(`Delete snapshot "${active.month_label}" and all its member entries?`)) return
                const { error } = await supabase.from('monthly_snapshots').delete().eq('id', active.id)
                if (error) { alert(error.message); return }
                setActiveId(null)
                qc.invalidateQueries({ queryKey: ['monthly_snapshots'] })
              }}
              className="px-3 py-1.5 rounded bg-red-500/20 text-red-500 text-sm"
            >
              <i className="fas fa-trash mr-1" /> Delete
            </button>
          )}
        </div>
      }
    >
      {formOpen && (
        <MonthlySnapshotForm
          snapshot={editingSnap}
          onClose={() => setFormOpen(false)}
          onSaved={(id) => { setActiveId(id) }}
        />
      )}
      {snapError && (
        <div className="card p-4 mb-4 border border-red-500/30 bg-red-500/5">
          <div className="font-semibold text-red-500">Failed to load history</div>
          <div className="text-sm text-muted mt-1">{snapError.message}</div>
        </div>
      )}

      {loadingSnaps ? (
        <div className="card p-6 text-muted">Loading snapshots…</div>
      ) : snapshots.length === 0 ? (
        <div className="card p-6 text-muted">
          No snapshots yet. Run{' '}
          <code className="px-1 py-0.5 rounded bg-primary-soft text-default">
            node scripts/import-monthly-history.mjs
          </code>{' '}
          to load <code>final-history.xlsx</code>.
        </div>
      ) : (
        <>
          {/* Tabs (one per month) */}
          <div className="card p-2 mb-4 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {snapshots.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`px-3 py-1.5 rounded text-sm whitespace-nowrap transition ${
                    s.id === activeId
                      ? 'bg-primary-soft text-default font-semibold'
                      : 'text-muted hover:text-default hover:bg-primary-soft/50'
                  }`}
                >
                  {s.month_label}
                </button>
              ))}
            </div>
          </div>

          {active && (
            <>
              {/* Summary cards (the "metrics" block at the top of each tab) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <SummaryCard
                  label="Total Value"
                  value={fmtMoney(active.total_value)}
                  sub={`${active.month_label}`}
                />
                <SummaryCard
                  label="Unit Value"
                  value={fmtMoney(active.unit_value)}
                />
                <SummaryCard
                  label="Total Val. Units"
                  value={fmtUnits(active.new_total_val_units)}
                />
                <SummaryCard
                  label="Members"
                  value={entries.length}
                  sub={`Σ portfolio ${fmtMoney(totals.portfolio)}`}
                />
              </div>

              {/* Asset breakdown */}
              <div className="card p-4 mb-4">
                <div className="font-semibold text-default mb-3">Asset Breakdown</div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                  {[
                    ['Stock Value',     active.stock_value],
                    ['Cash (CU)',       active.cash_credit_union],
                    ['Cash (Schwab)',   active.cash_schwab],
                    ['MM (Schwab)',     active.mm_schwab],
                    ['Gold (Schwab)',   active.gold_schwab],
                    ['Other',           active.other_value],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div className="text-xs text-muted">{label}</div>
                      <div className="font-medium text-default">{fmtMoney(val)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-member table */}
              <div className="card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="font-semibold text-default">Members — {active.month_label}</div>
                  {loadingEntries && <span className="text-xs text-muted">Loading…</span>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-primary-soft/50 text-muted">
                      <tr>
                        <th className="text-left px-4 py-2">Member</th>
                        <th className="text-right px-4 py-2">Dues Paid + Buyout</th>
                        <th className="text-right px-4 py-2">Dues Owed</th>
                        <th className="text-right px-4 py-2">Total Contribution</th>
                        <th className="text-right px-4 py-2">Prev Units</th>
                        <th className="text-right px-4 py-2">Units Added</th>
                        <th className="text-right px-4 py-2">New Val Units</th>
                        <th className="text-right px-4 py-2">Current Portfolio</th>
                        <th className="text-right px-4 py-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => (
                        <tr key={e.entry_id} className="border-t border-border">
                          <td className="px-4 py-2 text-default">
                            {e.member_name || e.member_name_raw}
                            {!e.member_id && (
                              <span className="ml-2 text-xs text-amber-500" title="No matching member record">
                                (raw)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">{fmtMoney(e.dues_paid_buyout)}</td>
                          <td className={`px-4 py-2 text-right ${Number(e.dues_owed) < 0 ? 'text-red-500' : ''}`}>
                            {fmtMoney(e.dues_owed)}
                          </td>
                          <td className="px-4 py-2 text-right">{fmtMoney(e.total_contribution)}</td>
                          <td className="px-4 py-2 text-right">{fmtUnits(e.previous_val_units)}</td>
                          <td className="px-4 py-2 text-right">{fmtUnits(e.val_units_added)}</td>
                          <td className="px-4 py-2 text-right">{fmtUnits(e.new_val_unit_total)}</td>
                          <td className="px-4 py-2 text-right font-medium">{fmtMoney(e.current_portfolio)}</td>
                          <td className="px-4 py-2 text-right">{fmtPct(e.ownership_pct)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-primary-soft/30 font-semibold text-default">
                      <tr className="border-t border-border">
                        <td className="px-4 py-2">Totals</td>
                        <td className="px-4 py-2 text-right">{fmtMoney(totals.dues_paid)}</td>
                        <td className="px-4 py-2 text-right">{fmtMoney(totals.dues_owed)}</td>
                        <td className="px-4 py-2 text-right">{fmtMoney(totals.contribution)}</td>
                        <td className="px-4 py-2 text-right" colSpan={2}></td>
                        <td className="px-4 py-2 text-right">{fmtUnits(totals.units)}</td>
                        <td className="px-4 py-2 text-right">{fmtMoney(totals.portfolio)}</td>
                        <td className="px-4 py-2 text-right">100.00%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Page>
  )
}
