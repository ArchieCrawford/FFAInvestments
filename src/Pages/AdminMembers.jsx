import React, { useEffect, useMemo, useState } from 'react'
import { getMemberAccounts } from '../lib/ffaApi'
import { Users, DollarSign, Target } from 'lucide-react'

const AdminMembers = () => {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const rows = await getMemberAccounts()
        if (mounted) {
          setAccounts(rows)
          setError(null)
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Unable to load member accounts')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return accounts.filter((account) => {
      const matchesTerm =
        !term ||
        account.member_name.toLowerCase().includes(term) ||
        (account.email || '').toLowerCase().includes(term)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && account.is_active) ||
        (statusFilter === 'inactive' && !account.is_active)
      return matchesTerm && matchesStatus
    })
  }, [accounts, searchTerm, statusFilter])

  const totals = useMemo(() => {
    return filteredAccounts.reduce(
      (acc, account) => {
        return {
          contributions: acc.contributions + Number(account.total_contributions || 0),
          value: acc.value + Number(account.current_value || 0),
          units: acc.units + Number(account.current_units || 0),
        }
      },
      { contributions: 0, value: 0, units: 0 }
    )
  }, [filteredAccounts])

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
        <div className="app-card">
          <div className="app-card-header">
            <p className="app-heading-md">Member Accounts</p>
          </div>
          <div className="app-card-content text-red-300">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <div className="app-card">
        <div className="app-card-header">
          <div>
            <p className="app-heading-lg">Member Accounts</p>
            <p className="app-text-muted">Overview of current balances and contributions</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex-1" style={{ minWidth: 220 }}>
            <label className="app-text-muted text-sm">Search members</label>
            <input
              className="app-input"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="app-text-muted text-sm">Status</label>
            <select className="app-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="app-card app-card-stat">
          <div>
            <p className="app-text-muted">Total Members</p>
            <p className="app-heading-lg">{accounts.length}</p>
          </div>
          <Users size={32} />
        </div>
        <div className="app-card app-card-stat">
          <div>
            <p className="app-text-muted">Active Accounts</p>
            <p className="app-heading-lg">{accounts.filter((a) => a.is_active).length}</p>
          </div>
          <Target size={32} />
        </div>
        <div className="app-card app-card-stat">
          <div>
            <p className="app-text-muted">Total Contributions</p>
            <p className="app-heading-lg">${totals.contributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <DollarSign size={32} />
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <p className="app-heading-md">Member Detail</p>
        </div>
        <div className="app-card-content" style={{ overflowX: 'auto' }}>
          <table className="app-table min-w-full">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th className="text-right">Units</th>
                <th className="text-right">Total Contributions</th>
                <th className="text-right">Current Value</th>
                <th className="text-right">Ownership %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.member_name}</td>
                  <td>{account.email || '—'}</td>
                  <td className="text-right">{Number(account.current_units || 0).toFixed(4)}</td>
                  <td className="text-right">
                    ${Number(account.total_contributions || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right">
                    ${Number(account.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right">{Number(account.ownership_percentage || 0).toFixed(2)}%</td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${account.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-200'}`}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminMembers
