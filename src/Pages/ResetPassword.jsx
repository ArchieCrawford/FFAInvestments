import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  useEffect(() => {
    // Some providers include a code in the URL; exchange to populate session if needed
    const init = async () => {
      setLoading(true)
      try {
        // Attempt to exchange any code present in the URL for a session (handles Supabase recovery redirect)
        const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (exchangeErr) {
          // If exchange fails, it's okay — user may still be able to reset using the provided recovery token
          console.warn('Exchange error (may be expected):', exchangeErr.message)
        }
      } catch (err) {
        console.warn('Unexpected exchange error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setProcessing(true)
    try {
      const { data, error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) {
        setError(updateErr.message || 'Unable to update password')
      } else {
        setSuccess('Password updated. Redirecting to login...')
        // Clear any existing session and redirect to login
        try { await signOut() } catch (e) { /* ignore */ }
        setTimeout(() => navigate('/login'), 1200)
      }
    } catch (err) {
      setError(err.message || 'Unexpected error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="fullscreen-center"><div className="spinner-page" /></div>
  )

  return (
    <div className="app-page">
      <div className="app-card">
        <div className="app-card-header">
          <p className="app-heading-lg">Reset Password</p>
          <p className="app-text-muted">Set a new password for your account</p>
        </div>
        <div className="app-card-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="app-alert app-alert-destructive">{error}</div>}
            {success && <div className="app-text-success">{success}</div>}
            <div className="input-group">
              <div className="input-wrapper">
                <input className="app-input" type="password" name="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <div className="input-wrapper">
                <input className="app-input" type="password" name="confirm" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="app-btn app-btn-primary app-btn-pill" type="submit" disabled={processing}>
                {processing ? 'Updating…' : 'Set new password'}
              </button>
              <button type="button" className="app-btn app-btn-outline app-btn-pill" onClick={() => navigate('/login')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
