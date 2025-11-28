import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { AlertCircle, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Page } from '../../components/Page'

const DuesTracker = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])
  const [filterName, setFilterName] = useState('')
  const [filterRange, setFilterRange] = useState('12') // 'all' or number of months
  const [valuationHistory, setValuationHistory] = useState([])
  const [valuationLoading, setValuationLoading] = useState(true)
  const [valuationError, setValuationError] = useState(null)

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

  const fetchValuationHistory = useCallback(async () => {
    setValuationLoading(true)
    setValuationError(null)
    try {
      const { data, error } = await supabase
        .from('org_balance_history')
        .select(`
          balance_date,
          total_value
        `)
        .order('balance_date', { ascending: true })
      if (error) throw error
      setValuationHistory(data || [])
    } catch (err) {
      setValuationHistory([])
      setValuationError(err.message || 'Unable to load valuation history')
    } finally {
      setValuationLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  useEffect(() => {
    fetchValuationHistory()
  }, [fetchValuationHistory])

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

  const totalPortfolioValue = useMemo(
    () => visibleRows.reduce((s, r) => s + (Number(r.portfolio_value) || 0), 0),
    [visibleRows]
  )

  const totalPortfolioDisplay = useMemo(
    () => `$${currencyFormatter.format(totalPortfolioValue)}`,
    [currencyFormatter, totalPortfolioValue]
  )

  const valuationChartData = useMemo(() => {
    return valuationHistory.map((entry) => ({
      date: entry.balance_date
        ? new Date(entry.balance_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Unknown',
      total_value: Number(entry.total_value) || 0,
    }))
  }, [valuationHistory])

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
    <Page 
      title="Member Dues / Contributions" 
      subtitle="Contributions and valuation rows from ffa_timeline"
      actions={
        <button className="btn-primary-soft border border-border text-sm px-3 py-1 rounded-full">
          <Download size={16} />
          Export
        </button>
      }
    >
      <div className="space-y-6">
        <div className="card">

        <div className="flex flex-wrap gap-3 items-end mt-4">
          <div style={{ minWidth: 220 }}>
            <label className="text-muted text-sm" htmlFor="dues-name-filter">Member name</label>
            <input
              id="dues-name-filter"
              className="input"
              placeholder="Search by member"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-muted text-sm" htmlFor="dues-range-filter">Date range</label>
            <select
              id="dues-range-filter"
              value={filterRange}
              onChange={(e) => setFilterRange(e.target.value)}
              className="input"
            >
              <option value="12">Last 12 months</option>
              <option value="6">Last 6 months</option>
              <option value="3">Last 3 months</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="text-xs text-muted">Rows: {visibleRows.length}</div>
          <div className="text-xs text-muted ml-auto flex flex-col sm:flex-row sm:items-center sm:gap-4 text-right">
            <span>Total contribution: {totalContributionsDisplay}</span>
            <span>Total portfolio value: {totalPortfolioDisplay}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <p className="text-xl font-semibold text-default">Club valuation trend</p>
        </div>
        <div className="card-content">
          {valuationLoading ? (
            <div className="py-8 text-center text-muted">Loading valuation history…</div>
          ) : valuationError ? (
            <div className="text-red-400 flex items-center gap-3 flex-wrap">
              <span>{valuationError}</span>
              <button className="btn-primary-soft border border-border text-xs px-2 py-1" onClick={fetchValuationHistory}>
                Retry
              </button>
            </div>
          ) : valuationChartData.length === 0 ? (
            <p className="text-muted">No valuation history available.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={valuationChartData}>
                  <CartesianGrid stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis
                    stroke="#94a3b8"
                    tickFormatter={(value) =>
                      `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    }
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value) =>
                      `$${Number(value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                  />
                  <Line type="monotone" dataKey="total_value" stroke="#48b0f7" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="card">
          <div className="card-header">
            <p className="text-xl font-semibold text-default">Unable to load dues</p>
          </div>
          <div className="card-content flex flex-wrap gap-3 items-center text-muted">
            <AlertCircle size={18} className="text-red-400" />
            <span>{error}</span>
            <button className="btn-primary-soft border border-border text-sm px-3 py-1" onClick={fetchRows}>Retry</button>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-header">
          <p className="text-xl font-semibold text-default">Dues / Contributions by Member & Month</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-surface/80">
          <div className="max-h-[70vh] overflow-y-auto border-t border-slate-800">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner-page" />
              </div>
            ) : (
              <table className="w-full border-collapse min-w-full" style={{ width: '100%' }}>
                <thead className="sticky top-0 z-10 bg-surface">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted sm:px-6">Member</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted sm:px-6">Period</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted sm:px-6">Contribution</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted sm:px-6">Portfolio Value</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted sm:px-6">Ownership %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {noVisibleRows ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted sm:px-6">
                        No dues records for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row) => {
                      const safeKey = row.id || `${row.member_name || 'unknown'}-${row.report_month || row.report_date || 'unknown'}`
                      return (
                        <tr key={safeKey} className="hover:bg-surface/80">
                          <td className="px-4 py-2 text-sm text-slate-100 sm:px-6">{row.member_name || 'Unknown'}</td>
                          <td className="px-4 py-2 text-sm text-muted sm:px-6">{formatPeriod(row)}</td>
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
    </Page>
  )
}

export default DuesTracker
