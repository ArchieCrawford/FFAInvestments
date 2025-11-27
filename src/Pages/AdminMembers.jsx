import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, DollarSign, Target } from 'lucide-react'
import AppLayout from '../components/AppLayout'

const MEMBER_ACCOUNT_FIELDS = `
  id,
  member_name,
  email,
  current_units,
  total_contributions,
  current_value,
  ownership_percentage,
  is_active
`

const AdminMembers = () => {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('member_accounts')
          .select(MEMBER_ACCOUNT_FIELDS)
          .order('member_name', { ascending: true })
        if (error) throw error
        if (mounted) setAccounts(data || [])
      } catch (err) {
        if (mounted) {
          setAccounts([])
          setError(err.message || 'Unable to load member accounts')
        }
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
      <AppLayout>
        <div className="fullscreen-center">
          <div className="spinner-page" />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="app-page">
          <div className="card">
            <div className="card-header">
              <p className="text-xl font-semibold text-default">Member Accounts</p>
            </div>
            <div className="card-content text-red-300">{error}</div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="app-page">
      <div className="card">
        <div className="card-header">
          <div>
            <p className="text-2xl font-bold text-default">Member Accounts</p>
            <p className="text-muted">Overview of current balances and contributions</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex-1" style={{ minWidth: 220 }}>
            <label className="text-muted text-sm">Search members</label>
            <input
              className="input"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-muted text-sm">Status</label>
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card text-center">
          <div>
            <p className="text-muted">Total Members</p>
            <p className="text-2xl font-bold text-default">{accounts.length}</p>
          </div>
          <Users size={32} />
        </div>
        <div className="card text-center">
          <div>
            <p className="text-muted">Active Accounts</p>
            <p className="text-2xl font-bold text-default">{accounts.filter((a) => a.is_active).length}</p>
          </div>
          <Target size={32} />
        </div>
        <div className="card text-center">
          <div>
            <p className="text-muted">Total Contributions</p>
            <p className="text-2xl font-bold text-default">${totals.contributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <DollarSign size={32} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <p className="text-xl font-semibold text-default">Member Detail</p>
        </div>
        <div className="card-content" style={{ overflowX: 'auto' }}>
          <table className="w-full border-collapse min-w-full">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th className="text-right">Current Value</th>
                <th className="text-right">Total Contributions</th>
                <th className="text-right">Units</th>
                <th className="text-right">Ownership %</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.member_name}</td>
                  <td>{account.email || '—'}</td>
                  <td className="text-right">
                    ${Number(account.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right">
                    ${Number(account.total_contributions || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right">{Number(account.current_units || 0).toFixed(4)}</td>
                  <td className="text-right">{Number(account.ownership_percentage || 0).toFixed(2)}%</td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${account.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-muted'}`}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {account.email ? (
                      <a className="btn-primary-soft border border-border text-sm px-3 py-1" href={`mailto:${account.email}`}>
                        Email
                      </a>
                    ) : (
                      <span className="text-muted text-sm">No email</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </AppLayout>
  )
}

export default AdminMembers
