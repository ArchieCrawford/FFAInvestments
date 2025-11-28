import React from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Page } from '../components/Page'

const AdminDebugAuth = () => {
  const { user, profile, debugInfo } = useAuth()

  return (
    <Page
      title="Admin Auth Debug"
      subtitle="Debug authentication and profile information"
    >
      <div className="space-y-6">
        <div className="card p-6">
          <p className="text-sm font-medium text-default mb-3">Current user (client):</p>
          <pre className="text-sm text-muted bg-surface p-4 rounded-lg overflow-x-auto">{JSON.stringify(user || null, null, 2)}</pre>
        </div>

        <div className="card p-6">
          <p className="text-sm font-medium text-default mb-3">Profile (from Supabase profiles table):</p>
          <pre className="text-sm text-muted bg-surface p-4 rounded-lg overflow-x-auto">{JSON.stringify(profile || null, null, 2)}</pre>
        </div>

        <div className="card p-6">
          <p className="text-sm font-medium text-default mb-3">AuthProvider debugInfo:</p>
          <pre className="text-sm text-muted bg-surface p-4 rounded-lg overflow-x-auto">{JSON.stringify(debugInfo || {}, null, 2)}</pre>
        </div>

        <div className="card p-6 border-l-4 border-primary">
          <p className="text-sm font-medium text-default mb-3">Notes:</p>
          <ul className="list-disc list-inside text-muted space-y-2">
            <li>This page is admin-only and intended for debugging auth/profile issues.</li>
            <li>If <code className="text-primary">profile.role</code> is not <code className="text-primary">'admin'</code> you'll be redirected away from admin routes.</li>
          </ul>
        </div>
      </div>
    </Page>
  )
}

export default AdminDebugAuth
