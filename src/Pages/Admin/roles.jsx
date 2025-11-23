import React, { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/AdminGuard'
import { getMemberAccounts } from '../../lib/ffaApi'

const AdminRoles = () => {
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
            <p className="heading-lg">Member Overview</p>
            <p className="text-muted">Simplified view of account activity</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Active</th>
                  <th>Units</th>
                  <th>Ownership %</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((m) => (
                  <tr key={m.id}>
                    <td>{m.member_name}</td>
                    <td>{m.email || '—'}</td>
                    <td>{m.is_active ? 'Yes' : 'No'}</td>
                    <td>{Number(m.current_units || 0).toFixed(4)}</td>
                    <td>{Number(m.ownership_percentage || 0).toFixed(2)}%</td>
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

export default AdminRoles
