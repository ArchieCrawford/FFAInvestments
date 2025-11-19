import React from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

const AdminDebugAuth = () => {
  const { user, profile, debugInfo } = useAuth()

  return (
    <div className="app-page">
      <div className="card">
        <div className="card-header">
          <p className="heading-md">Admin Auth Debug</p>
        </div>

        <div style={{ padding: '1rem', display: 'grid', gap: '1rem' }}>
          <div>
            <p className="text-muted">Current user (client):</p>
            <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 8 }}>{JSON.stringify(user || null, null, 2)}</pre>
          </div>

          <div>
            <p className="text-muted">Profile (from Supabase profiles table):</p>
            <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 8 }}>{JSON.stringify(profile || null, null, 2)}</pre>
          </div>

          <div>
            <p className="text-muted">AuthProvider debugInfo:</p>
            <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 8 }}>{JSON.stringify(debugInfo || {}, null, 2)}</pre>
          </div>

          <div>
            <p className="text-muted">Notes:</p>
            <ul>
              <li>This page is admin-only and intended for debugging auth/profile issues.</li>
              <li>If <code>profile.role</code> is not <code>'admin'</code> you'll be redirected away from admin routes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDebugAuth
