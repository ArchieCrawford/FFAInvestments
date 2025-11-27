import React, { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/AdminGuard'
import { getDashboard } from '../../lib/ffaApi'

const AdminIndex = () => {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const data = await getDashboard(new Date().toISOString())
        if (mounted) setDashboard(data)
      } catch (err) {
        console.error('Failed to load dashboard', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="fullscreen-center"><div className="spinner-page" /></div>

  return (
    <AdminGuard>
      <div className="app-page">
        <div className="card">
          <div className="card-header">
            <p className="heading-lg">Admin Dashboard</p>
            <p className="text-muted">Overview of club metrics</p>
          </div>
          <div className="grid-3" style={{ gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <p className="text-muted">Total Portfolio Value</p>
              <p className="heading-md">{dashboard?.total_portfolio_value ?? '—'}</p>
            </div>
            <div className="card" style={{ padding: '1rem' }}>
              <p className="text-muted">Current Unit Price</p>
              <p className="heading-md">{dashboard?.unit_price ?? '—'}</p>
            </div>
            <div className="card" style={{ padding: '1rem' }}>
              <p className="text-muted">Member Count</p>
              <p className="heading-md">{dashboard?.member_count ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <p className="heading-md">Member Accounts</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Position</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.member_accounts?.map((a) => (
                  <tr key={a.member_id}>
                    <td>{a.member_name}</td>
                    <td>{a.account_value}</td>
                    <td>{a.units}</td>
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

export default AdminIndex
