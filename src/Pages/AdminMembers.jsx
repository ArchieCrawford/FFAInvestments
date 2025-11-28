import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, DollarSign, Target } from 'lucide-react'
import { Page } from '../components/Page'

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
      <Page title="Member Accounts">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted mt-4">Loading member accounts...</p>
          </div>
        </div>
      </Page>
    )
  }

  if (error) {
    return (
      <Page title="Member Accounts">
        <div className="card p-6 border-l-4 border-red-500">
          <p className="text-red-400">{error}</p>
        </div>
      </Page>
    )
  }

  return (
    <Page
      title="Member Accounts"
      subtitle="Overview of current balances and contributions"
    >
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1" style={{ minWidth: 220 }}>
              <label className="block text-sm font-medium text-default mb-2">Search members</label>
              <input
                className="input w-full"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-default mb-2">Status</label>
              <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Total Members</p>
                <p className="text-3xl font-bold text-default">{accounts.length}</p>
              </div>
              <Users size={32} className="text-primary" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Active Accounts</p>
                <p className="text-3xl font-bold text-default">{accounts.filter((a) => a.is_active).length}</p>
              </div>
              <Target size={32} className="text-primary" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Total Contributions</p>
                <p className="text-3xl font-bold text-default">${totals.contributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <DollarSign size={32} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-semibold text-default">Member Detail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Current Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Total Contributions</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Units</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Ownership %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-surface">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-default">{account.member_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{account.email || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-default text-right">
                      ${Number(account.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-default text-right">
                      ${Number(account.total_contributions || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-default text-right">{Number(account.current_units || 0).toFixed(4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-default text-right">{Number(account.ownership_percentage || 0).toFixed(2)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${account.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-muted'}`}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {account.email ? (
                        <a className="text-primary hover:text-primary/80" href={`mailto:${account.email}`}>
                          Email
                        </a>
                      ) : (
                        <span className="text-muted">No email</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Page>
  )
}

export default AdminMembers
