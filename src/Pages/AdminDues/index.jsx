import React, { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, DollarSign, Download, Eye, EyeOff, TrendingUp, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMemo } from 'react'

const DuesTracker = () => {
  const [duesData, setDuesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedMembers, setExpandedMembers] = useState(new Set())
  const [selectedMonths, setSelectedMonths] = useState(12)
  const [rows, setRows] = useState([])
  const [filterName, setFilterName] = useState('')
  const [filterRange, setFilterRange] = useState('12') // 'all' or number of months

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        let query = supabase.from('ffa_timeline').select('*')

        // Server-side member_name filter
        if (filterName && filterName.trim() !== '') {
          query = query.ilike('member_name', `%${filterName.trim()}%`)
        }

        // Server-side date range filter
        if (filterRange && filterRange !== 'all') {
          const months = Number(filterRange) || 12
          const from = new Date()
          from.setMonth(from.getMonth() - months)
          // Use YYYY-MM-DD for date comparison
          const iso = from.toISOString().split('T')[0]
          query = query.gte('report_date', iso)
        }

        query = query.order('report_date', { ascending: false })

        const { data, error } = await query

        if (error) {
          if (!cancelled) setError(error.message)
          return
        }

        if (!cancelled) {
          setRows(data || [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Load immediately and when filters change
    load()
    return () => { cancelled = true }
  }, [selectedMonths, filterName, filterRange])

  const toggleMemberDetails = (name) => {
    const next = new Set(expandedMembers)
    if (next.has(name)) {
      next.delete(name)
    } else {
      next.add(name)
    }
    setExpandedMembers(next)
  }

  const statusBadge = (status) => {
    const map = {
      current: { label: 'Current', color: '#22c55e' },
      overpaid: { label: 'Overpaid', color: '#3b82f6' },
      owes_money: { label: 'Owes Money', color: '#f87171' },
      credit_balance: { label: 'Credit', color: '#fbbf24' }
    }
    return map[status] || { label: 'Current', color: '#94a3b8' }
  }

  const formatAmount = (amount) => {
    if (amount > 0) return { text: `$${amount.toFixed(2)}`, color: '#f87171' }
    if (amount < 0) return { text: `-$${(amount * -1).toFixed(2)}`, color: '#4ade80' }
    return { text: '$0.00', color: '#cbd5f5' }
  }

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner-page" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="app-page">
        <div className="card">
          <div className="card-header">
            <p className="heading-md">Dues Tracker</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={20} style={{ color: '#f87171' }} />
            <p className="text-muted">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Derived visible rows
  const visibleRows = useMemo(() => {
    const nameFilter = filterName.trim().toLowerCase()
    const now = new Date()
    const cutoff = new Date(now)
    cutoff.setMonth(cutoff.getMonth() - 12)

    return rows.filter((r) => {
      if (nameFilter && !(r.member_name || '').toLowerCase().includes(nameFilter)) return false
      if (filterRange !== 'all') {
        // filterRange is months count like '12'
        const months = Number(filterRange)
        if (!isNaN(months) && r.report_date) {
          const d = new Date(r.report_date)
          const from = new Date(now)
          from.setMonth(from.getMonth() - months)
          if (d < from) return false
        }
      }
      return true
    })
  }, [rows, filterName, filterRange])

  const totalPaymentsCollected = rows.reduce((s, r) => s + (Number(r.total_contribution) || 0), 0)

  return (
    <div className="app-page">
      <div className="card">
        <div className="card-header">
          <div>
            <p className="heading-lg">Member Dues / Contributions</p>
            <p className="text-muted">Contributions and valuation rows from <code>ffa_timeline</code></p>
          </div>
          <div className="pill">
            <Download size={16} />
            Export
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: 8 }}>
          <input
            className="input"
            placeholder="Filter by member name"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <select value={filterRange} onChange={(e) => setFilterRange(e.target.value)} className="input">
            <option value="12">Last 12 months</option>
            <option value="6">Last 6 months</option>
            <option value="3">Last 3 months</option>
            <option value="all">All</option>
          </select>
          <div className="text-xs text-slate-400">Total rows: {visibleRows.length}</div>
          <div style={{ marginLeft: 'auto' }} className="text-xs text-slate-400">Total contribution: ${totalPaymentsCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <p className="heading-md">Dues / Contributions by Member & Month</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="max-h-[70vh] overflow-y-auto border-t border-slate-800">
            <table className="min-w-full border-collapse text-sm" style={{ width: '100%' }}>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default DuesTracker
