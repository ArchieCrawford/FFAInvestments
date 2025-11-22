import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentMember } from '../lib/authHooks'

export function AdminGuard({ children }) {
  const navigate = useNavigate()
  const { member, loading } = useCurrentMember()

  React.useEffect(() => {
    if (!loading) {
      if (!member) {
        navigate('/login', { replace: true })
      } else if (member.role !== 'admin') {
        navigate('/', { replace: true })
      }
    }
  }, [loading, member, navigate])

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner-page" />
        <p style={{ marginTop: 12, color: '#cbd5e1' }}>Checking access…</p>
      </div>
    )
  }

  // If not returned earlier, member exists and is admin
  return <>{children}</>
}

export default AdminGuard
