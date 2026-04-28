import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'

const fmtMoney = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const fmtDate = (d) => {
  if (!d) return '—'
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return d
  }
}

const fetchDeposits = async () => {
  const { data, error } = await supabase
    .from('deposits')
    .select(
      'id, sender_name, amount, confirmation_number, deposit_date, deposit_at, source, notes, member_id, members:member_id ( id, member_name, email )'
    )
    .order('deposit_date', { ascending: false })

  if (error) throw error
  return data || []
}

export default function AdminDeposits() {
  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery(['admin_deposits'], fetchDeposits)

  const [search, setSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState('all')

  const memberOptions = useMemo(() => {
    const set = new Map()
    for (const r of rows) {
      const label = r.members?.member_name || r.sender_name
      if (label && !set.has(label)) set.set(label, label)
    }
    return ['all', ...Array.from(set.keys()).sort()]
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const name = r.members?.member_name || r.sender_name || ''
      if (memberFilter !== 'all' && name !== memberFilter) return false
      if (!q) return true
      return (
        name.toLowerCase().includes(q) ||
        String(r.confirmation_number || '').toLowerCase().includes(q) ||
        String(r.amount || '').includes(q)
      )
    })
  }, [rows, search, memberFilter])

  const totals = useMemo(() => {
    const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0)
    const byMember = new Map()
    for (const r of filtered) {
      const key = r.members?.member_name || r.sender_name || '—'
      byMember.set(key, (byMember.get(key) || 0) + Number(r.amount || 0))
    }
    return { total, count: filtered.length, byMember }
  }, [filtered])

  return (
    <Page
      title="Deposits"
      subtitle="Zelle and wire deposits received from members."
      actions={
        <button
          type="button"
          className="btn-primary-soft"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      }
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="card p-4 text-sm text-muted">Loading deposits…</div>
        )}

        {isError && (
          <div className="card p-4 text-sm text-default border border-border bg-primary-soft">
            Error loading deposits: {error?.message || 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card p-4">
                <div className="text-xs text-muted">Total deposits</div>
                <div className="text-2xl font-semibold text-default">
                  {fmtMoney(totals.total)}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-muted">Number of deposits</div>
                <div className="text-2xl font-semibold text-default">
                  {totals.count}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-muted">Unique senders</div>
                <div className="text-2xl font-semibold text-default">
                  {totals.byMember.size}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="card p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, confirmation #, amount…"
                className="input flex-1"
              />
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="input sm:w-64"
              >
                {memberOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'all' ? 'All members' : opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Deposits table */}
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <div className="text-sm font-semibold text-default">
                  Deposit history
                </div>
                <div className="text-xs text-muted">
                  Showing {filtered.length} of {rows.length} deposits
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left font-semibold text-muted">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-muted">
                        Sender
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-muted">
                        Member
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-muted">
                        Amount
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-muted">
                        Confirmation #
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-muted">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-muted"
                        >
                          No deposits match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-border/60"
                        >
                          <td className="px-4 py-2 text-default whitespace-nowrap">
                            {fmtDate(r.deposit_date)}
                          </td>
                          <td className="px-4 py-2 text-default">
                            {r.sender_name}
                          </td>
                          <td className="px-4 py-2 text-default">
                            {r.members?.member_name || (
                              <span className="text-muted italic">
                                Unmatched
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-default whitespace-nowrap">
                            {fmtMoney(r.amount)}
                          </td>
                          <td className="px-4 py-2 text-muted font-mono">
                            {r.confirmation_number || '—'}
                          </td>
                          <td className="px-4 py-2 text-muted capitalize">
                            {r.source || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filtered.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-border">
                        <td
                          colSpan={3}
                          className="px-4 py-2 text-right font-semibold text-muted"
                        >
                          Total
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-default">
                          {fmtMoney(totals.total)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Per-member breakdown */}
            {totals.byMember.size > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-sm font-semibold text-default">
                    Total by member
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-semibold text-muted">
                          Member / Sender
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-muted">
                          Total Deposited
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(totals.byMember.entries())
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, total]) => (
                          <tr key={name} className="border-b border-border/60">
                            <td className="px-4 py-2 text-default">{name}</td>
                            <td className="px-4 py-2 text-right text-default">
                              {fmtMoney(total)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  )
}
