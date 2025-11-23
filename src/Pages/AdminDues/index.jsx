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
      let query = supabase.from('ffa_timeline').select(`
        id,
        member_name,
        report_month,
        report_date,
        portfolio_value,
        total_units,
        total_contribution,
        ownership_pct,
        portfolio_growth,
        portfolio_growth_amount
      `)

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

        query = query.order('report_date', { ascending: true })

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

  const filteredRows = useMemo(() => {
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

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )

  const visibleRows = filteredRows

  const totalPaymentsCollected = useMemo(
    () => visibleRows.reduce((s, r) => s + (Number(r.total_contribution) || 0), 0),
    [visibleRows]
  )

  const totalContributionsDisplay = useMemo(
    () => `$${currencyFormatter.format(totalPaymentsCollected)}`,
    [currencyFormatter, totalPaymentsCollected]
  )

  const formatCurrency = useCallback(
    (value) => {
      const num = Number(value)
      if (Number.isNaN(num)) return '—'
      return `$${currencyFormatter.format(num)}`
    },
    [currencyFormatter]
  )

  const formatPercent = useCallback((value) => {
    const num = Number(value)
    if (Number.isNaN(num)) return '—'
    return `${(num * 100).toFixed(3)}%`
  }, [])

  const formatPeriod = useCallback((row) => {
    if (row.report_month) return row.report_month
    if (row.report_date) {
      const d = new Date(row.report_date)
      if (!Number.isNaN(d.getTime())) return d.toLocaleDateString()
    }
    return ''
  }, [])

  const noVisibleRows = !loading && !error && visibleRows.length === 0


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
          <div className="text-xs text-slate-400 ml-auto">Total contribution: {totalContributionsDisplay}</div>
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
                  {noVisibleRows ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500 sm:px-6">
                        No dues records for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row) => {
                      const safeKey = row.id || `${row.member_name || 'unknown'}-${row.report_month || row.report_date || 'unknown'}`
                      return (
                        <tr key={safeKey} className="hover:bg-slate-900/80">
                          <td className="px-4 py-2 text-sm text-slate-100 sm:px-6">{row.member_name || 'Unknown'}</td>
                          <td className="px-4 py-2 text-sm text-slate-200 sm:px-6">{formatPeriod(row)}</td>
                          <td className="px-4 py-2 text-right text-sm tabular-nums text-slate-100 sm:px-6">{formatCurrency(row.total_contribution)}</td>
                          <td className="px-4 py-2 text-right text-sm tabular-nums text-slate-100 sm:px-6">{formatCurrency(row.portfolio_value)}</td>
                          <td className="px-4 py-2 text-right text-sm tabular-nums text-slate-100 sm:px-6">{formatPercent(row.ownership_pct)}</td>
                        </tr>
                      )
                    })
                  )}
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
