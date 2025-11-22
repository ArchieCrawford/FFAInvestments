import React, { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/AdminGuard'
import { getOrgBalanceHistory } from '../../lib/ffaApi'

const AdminValuations = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const data = await getOrgBalanceHistory()
        if (mounted) setRows(data || [])
      } catch (err) {
        console.error('Failed to load org balances', err)
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
            <p className="heading-lg">Valuations / Org Balance History</p>
            <p className="text-muted">Historical portfolio and organization balances</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Portfolio Value</th>
                  <th>Total Units</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id || r.date}>
                    <td>{r.date || r.balance_date || r.report_date}</td>
                    <td>{r.total_value ?? r.portfolio_value}</td>
                    <td>{r.total_units}</td>
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

export default AdminValuations
