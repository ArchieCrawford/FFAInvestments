import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'

const AdminPanel = () => {
  const { user, profile, isAdmin } = useAuth()

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h3>Admin Panel</h3>
        <p>You must be logged in to access admin tools.</p>
      </div>
    )
  }

  if (!isAdmin()) {
    return (
      <div style={{ padding: 24 }}>
        <h3>Admin Panel</h3>
        <p>Admin access required. If you believe this is an error, contact an administrator.</p>
      </div>
    )
  }

  return (
    <AppLayout>
      <div style={{ padding: 24 }}>
        <h1>Admin Panel</h1>
        <p>Welcome, {profile?.display_name || user.email}. Use the links below to manage the system.</p>

        <ul>
          <li><Link to="/admin/dashboard">Admin Dashboard</Link></li>
          <li><Link to="/admin/users">Manage Users</Link></li>
          <li><Link to="/admin/members">Members</Link></li>
          <li><Link to="/admin/import">Import Data</Link></li>
          <li><Link to="/admin/settings">Settings</Link></li>
          <li><Link to="/admin/ledger">Ledger</Link></li>
          <li><Link to="/admin/unit-price">Unit Price</Link></li>
          <li><Link to="/admin/schwab">Schwab Integration</Link></li>
        </ul>
      </div>
    </AppLayout>
  )
}

export default AdminPanel
