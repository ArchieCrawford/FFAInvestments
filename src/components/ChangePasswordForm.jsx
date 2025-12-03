import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setLoading(true)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setError('You must be logged in to change your password.')
        setLoading(false)
        return
      }

      if (!currentPassword) {
        setError('Please enter your current password.')
        setLoading(false)
        return
      }

      const { data: reauthData, error: reauthError } =
        await supabase.auth.signInWithPassword({
          email: session.user.email,
          password: currentPassword,
        })

      if (reauthError || !reauthData.session) {
        setError('Current password is incorrect.')
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess('Password updated successfully.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xl font-semibold text-default">Change Password</p>

      <div className="space-y-1">
        <label className="form-label">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
        />
        <p className="text-xs text-muted-foreground">
          For extra security, we re-verify your current password before changing it.
        </p>
      </div>

      <div className="space-y-1">
        <label className="form-label">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input"
          placeholder="New password"
        />
      </div>

      <div className="space-y-1">
        <label className="form-label">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
          placeholder="Confirm new password"
        />
      </div>

      {error && (
        <div className="text-sm" style={{ color: '#fecaca' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm" style={{ color: '#bbf7d0' }}>
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary rounded-full"
      >
        {loading ? 'Updating…' : 'Update Password'}
      </button>
    </form>
  )
}

export default ChangePasswordForm
