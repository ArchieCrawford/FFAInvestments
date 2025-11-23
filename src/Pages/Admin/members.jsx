import React, { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/AdminGuard'
import { getMemberAccounts } from '../../lib/ffaApi'

const AdminMembers = () => {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const rows = await getMemberAccounts()
        if (mounted) setAccounts(rows)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <div className="fullscreen-center"><div className="spinner-page" /></div>

  return (
    <AdminGuard>
      <div className="app-page">
        <div className="card">
          <div className="card-header">
            <p className="heading-lg">Member Accounts</p>
            <p className="text-muted">Data pulled from member_accounts</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Units</th>
                  <th>Contributions</th>
                  <th>Value</th>
                  <th>Ownership %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((m) => (
                  <tr key={m.id}>
                    <td>{m.member_name}</td>
                    <td>{m.email || '—'}</td>
                    <td>{Number(m.current_units || 0).toFixed(4)}</td>
                    <td>${Number(m.total_contributions || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${Number(m.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>{Number(m.ownership_percentage || 0).toFixed(2)}%</td>
                    <td>{m.is_active ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}

export default AdminMembers
