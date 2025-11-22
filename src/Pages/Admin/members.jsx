import React, { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/AdminGuard'
import { getMembers } from '../../lib/ffaApi'

const AdminMembers = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const rows = await getMembers()
        if (mounted) setMembers(rows || [])
      } catch (err) {
        console.error('Failed to load members', err)
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
            <p className="heading-lg">Members</p>
            <p className="text-muted">All registered members</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.member_name}</td>
                    <td>{m.email}</td>
                    <td>{m.role}</td>
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
