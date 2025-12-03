import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Page } from '../../components/Page'

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
]

const SettingsPage = () => {
  const { user, profile, setProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    display_name: '',
    timezone: '',
    default_landing_page: '',
  })
  const [message, setMessage] = useState(null)

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        timezone: profile.timezone || 'UTC',
        default_landing_page: profile.default_landing_page || '/member/home',
      })
    }
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setMessage(null)
    try {
      const updates = {
        id: user.id,
        display_name: form.display_name,
        timezone: form.timezone,
        default_landing_page: form.default_landing_page,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates)
        .select()
        .single()
      if (error) throw error
      setMessage({ type: 'success', text: 'Settings saved.' })
      if (setProfile) setProfile(data)
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Unable to save settings.',
      })
    }
    setLoading(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!user) return
    setPasswordLoading(true)
    setPasswordMessage(null)

    const { current_password, new_password, confirm_password } = passwordForm

    if (!new_password || new_password.length < 8) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be at least 8 characters.',
      })
      setPasswordLoading(false)
      return
    }

    if (new_password !== confirm_password) {
      setPasswordMessage({
        type: 'error',
        text: 'New password and confirmation do not match.',
      })
      setPasswordLoading(false)
      return
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setPasswordMessage({
          type: 'error',
          text: 'You must be logged in to change your password.',
        })
        setPasswordLoading(false)
        return
      }

      if (current_password) {
        const { data: reauthData, error: reauthError } =
          await supabase.auth.signInWithPassword({
            email: session.user.email,
            password: current_password,
          })

        if (reauthError || !reauthData.session) {
          setPasswordMessage({
            type: 'error',
            text: 'Current password is incorrect.',
          })
          setPasswordLoading(false)
          return
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: new_password,
      })

      if (updateError) {
        setPasswordMessage({
          type: 'error',
          text: updateError.message,
        })
      } else {
        setPasswordMessage({
          type: 'success',
          text: 'Password updated successfully.',
        })
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
        })
      }
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err.message || 'Unable to update password.',
      })
    }

    setPasswordLoading(false)
  }

  return (
    <Page title="Settings" subtitle="Manage your profile and preferences">
      <div className="card">
        <form onSubmit={handleSave}>
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <p className="text-xl font-semibold text-default">Profile</p>
              <label className="form-label">Display name</label>
              <input
                className="input"
                value={form.display_name}
                onChange={(e) =>
                  setForm({ ...form, display_name: e.target.value })
                }
              />

              <label className="form-label">Timezone</label>
              <select
                className="input"
                value={form.timezone}
                onChange={(e) =>
                  setForm({ ...form, timezone: e.target.value })
                }
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>

              <label className="form-label">Default landing page</label>
              <select
                className="input"
                value={form.default_landing_page}
                onChange={(e) =>
                  setForm({ ...form, default_landing_page: e.target.value })
                }
              >
                <option value="/member/accounts">Member Dashboard</option>
                <option value="/admin/unit-price">Unit Price History</option>
                <option value="/education/catalog">Education Catalog</option>
              </select>

              <div style={{ marginTop: '1rem' }}>
                <button
                  className="btn-primary rounded-full"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <p className="text-xl font-semibold text-default">Notifications</p>
              <label className="form-label">
                Email me when a new contribution is recorded
              </label>
              <input
                type="checkbox"
                checked={profile?.notify_on_contribution}
                onChange={() => {}}
              />

              <label className="form-label">
                Email me when a monthly statement is available
              </label>
              <input
                type="checkbox"
                checked={profile?.notify_on_statement}
                onChange={() => {}}
              />

              <label className="form-label">
                Email me about new education content
              </label>
              <input
                type="checkbox"
                checked={profile?.notify_on_education}
                onChange={() => {}}
              />

              <hr style={{ margin: '1.5rem 0' }} />

              <form onSubmit={handlePasswordChange}>
                <p className="text-xl font-semibold text-default">
                  Change Password
                </p>

                <label className="form-label">Current password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      current_password: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                />

                <label className="form-label">New password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      new_password: e.target.value,
                    })
                  }
                  placeholder="New password"
                />

                <label className="form-label">Confirm new password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirm_password: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                />

                {passwordMessage && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      color:
                        passwordMessage.type === 'error'
                          ? '#fecaca'
                          : '#bbf7d0',
                    }}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <div style={{ marginTop: '1rem' }}>
                  <button
                    type="submit"
                    className="btn-primary rounded-full"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </form>

        {message && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <p
              style={{
                color: message.type === 'error' ? '#fecaca' : '#bbf7d0',
              }}
            >
              {message.text}
            </p>
          </div>
        )}
      </div>
    </Page>
  )
}

export default SettingsPage
