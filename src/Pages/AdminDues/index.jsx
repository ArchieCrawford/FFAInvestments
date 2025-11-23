import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { AlertCircle, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const DuesTracker = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])
  const [filterName, setFilterName] = useState('')
  const [filterRange, setFilterRange] = useState('12') // 'all' or number of months

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from('ffa_timeline').select('*')

      if (filterName && filterName.trim() !== '') {
        query = query.ilike('member_name', `%${filterName.trim()}%`)
      }

      if (filterRange && filterRange !== 'all') {
        const months = Number(filterRange) || 12
        const from = new Date()
        from.setMonth(from.getMonth() - months)
        const iso = from.toISOString().split('T')[0]
        query = query.gte('report_date', iso)
      }

      query = query.order('report_date', { ascending: false })

      const { data, error } = await query

      if (error) {
        setError(error.message)
        setRows([])
        return
      }

      setRows(data || [])
    } catch (err) {
      setError(err.message || String(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [filterName, filterRange])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const visibleRows = useMemo(() => {
    const nameFilter = filterName.trim().toLowerCase()
    return rows.filter((r) => {
      if (nameFilter && !(r.member_name || '').toLowerCase().includes(nameFilter)) return false
      if (filterRange !== 'all') {
        const months = Number(filterRange)
        if (!isNaN(months) && r.report_date) {
          const d = new Date(r.report_date)
          const from = new Date()
          from.setMonth(from.getMonth() - months)
          if (d < from) return false
        }
      }
      return true
    })
  }, [rows, filterName, filterRange])

  const totalPaymentsCollected = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.total_contribution) || 0), 0),
    [rows]
  )

  return (
    <div className="app-content">
      <div className="app-card">
        <div className="app-card-header">
          <div>
            <p className="app-heading-lg">Member Dues / Contributions</p>
            <p className="app-text-muted">Contributions and valuation rows from <code>ffa_timeline</code></p>
          </div>
          <button className="app-btn app-btn-outline app-btn-sm app-btn-pill">
            <Download size={16} />
            Export
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-end mt-4">
          <div style={{ minWidth: 220 }}>
            <label className="app-text-muted text-sm" htmlFor="dues-name-filter">Member name</label>
            <input
              id="dues-name-filter"
              className="app-input"
              placeholder="Search by member"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>
          <div>
            <label className="app-text-muted text-sm" htmlFor="dues-range-filter">Date range</label>
            <select
              id="dues-range-filter"
              value={filterRange}
              onChange={(e) => setFilterRange(e.target.value)}
              className="app-input"
            >
              <option value="12">Last 12 months</option>
              <option value="6">Last 6 months</option>
              <option value="3">Last 3 months</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="text-xs text-slate-400">Rows: {visibleRows.length}</div>
          <div className="text-xs text-slate-400 ml-auto">
            Total contribution: ${totalPaymentsCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {error ? (
        <div className="app-card">
          <div className="app-card-header">
            <p className="app-heading-md">Unable to load dues</p>
          </div>
          <div className="app-card-content flex flex-wrap gap-3 items-center text-slate-200">
            <AlertCircle size={18} className="text-red-400" />
            <span>{error}</span>
            <button className="app-btn app-btn-outline app-btn-sm" onClick={fetchRows}>Retry</button>
          </div>
        </div>
      ) : null}

      <div className="app-card">
        <div className="app-card-header">
          <p className="app-heading-md">Dues / Contributions by Member & Month</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="max-h-[70vh] overflow-y-auto border-t border-slate-800">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner-page" />
              </div>
            ) : (
              <table className="app-table min-w-full" style={{ width: '100%' }}>
                <thead className="sticky top-0 z-10 bg-slate-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6">Member</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6">Period</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6">Contribution</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6">Portfolio Value</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6">Ownership %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {visibleRows.map((row) => {
                    const safeKey = row.id || `${row.member_name || 'unknown'}-${row.report_month || row.report_date || 'unknown'}`

                    const totalContribution = Number(row.total_contribution)
                    const contributionDisplay = !Number.isNaN(totalContribution)
                      ? `$${totalContribution.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '—'

                    const portfolioValueNum = Number(row.portfolio_value)
                    const portfolioDisplay = !Number.isNaN(portfolioValueNum)
                      ? `$${portfolioValueNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '—'

                    const ownershipPct = Number(row.ownership_pct)
                    const ownershipDisplay = !Number.isNaN(ownershipPct)
                      ? `${(ownershipPct * 100).toFixed(3)}%`
                      : '—'

                    const period = row.report_month || (row.report_date ? new Date(row.report_date).toLocaleDateString() : '')

                    return (
                      <tr key={safeKey} className="hover:bg-slate-900/80">
                        <td className="px-4 py-2 text-sm text-slate-100 sm:px-6">{row.member_name || 'Unknown'}</td>
                        <td className="px-4 py-2 text-sm text-slate-200 sm:px-6">{period}</td>
                        <td className="px-4 py-2 text-right text-sm tabular-nums text-slate-100 sm:px-6">{contributionDisplay}</td>
                        <td className="px-4 py-2 text-right text-sm tabular-nums text-slate-100 sm:px-6">{portfolioDisplay}</td>
                        <td className="px-4 py-2 text-right text-sm tabular-nums text-slate-100 sm:px-6">{ownershipDisplay}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DuesTracker
