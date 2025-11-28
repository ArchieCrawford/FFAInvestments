import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Page } from '../components/Page'
import { 
  LayoutDashboard, Users, UserCheck, Upload, Settings, 
  BookOpen, DollarSign, Building2 
} from 'lucide-react'

const AdminPanel = () => {
  const { user, profile, isAdmin } = useAuth()

  if (!user) {
    return (
      <Page title="Admin Panel">
        <div className="card p-6">
          <p className="text-muted">You must be logged in to access admin tools.</p>
        </div>
      </Page>
    )
  }

  if (!isAdmin()) {
    return (
      <Page title="Admin Panel">
        <div className="card p-6 border-l-4 border-red-500">
          <p className="text-default">Admin access required. If you believe this is an error, contact an administrator.</p>
        </div>
      </Page>
    )
  }

  const adminLinks = [
    { to: "/admin/dashboard", label: "Admin Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/admin/users", label: "Manage Users", icon: <Users size={20} /> },
    { to: "/admin/members", label: "Members", icon: <UserCheck size={20} /> },
    { to: "/admin/import", label: "Import Data", icon: <Upload size={20} /> },
    { to: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
    { to: "/admin/ledger", label: "Ledger", icon: <BookOpen size={20} /> },
    { to: "/admin/unit-price", label: "Unit Price", icon: <DollarSign size={20} /> },
    { to: "/admin/schwab", label: "Schwab Integration", icon: <Building2 size={20} /> },
  ]

  return (
    <Page 
      title="Admin Panel"
      subtitle={`Welcome, ${profile?.display_name || user.email}. Use the links below to manage the system.`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="card p-6 hover:bg-primary-soft transition-colors flex items-center gap-4 no-underline"
          >
            <div className="p-3 bg-primary-soft rounded-lg text-primary">
              {link.icon}
            </div>
            <span className="text-lg font-medium text-default">{link.label}</span>
          </Link>
        ))}
      </div>
    </Page>
  )
}

export default AdminPanel
