import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Page } from '../../components/Page'

const timezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'
]

const SettingsPage = () => {
  const { user, profile, setProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ display_name: '', timezone: '', default_landing_page: '' })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        timezone: profile.timezone || 'UTC',
        default_landing_page: profile.default_landing_page || '/member/home'
      })
    }
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      const updates = {
        id: user.id,
        display_name: form.display_name,
        timezone: form.timezone,
        default_landing_page: form.default_landing_page,
        updated_at: new Date().toISOString()
      }
      const { data, error } = await supabase.from('profiles').upsert(updates).select().single()
      if (error) throw error
      setMessage({ type: 'success', text: 'Settings saved.' })
      if (setProfile) setProfile(data)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Unable to save settings.' })
    }
    setLoading(false)
  }

  return (
    <Page title="Settings" subtitle="Manage your profile and preferences">
      <div className="card">
        <form onSubmit={handleSave}>
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <p className="text-xl font-semibold text-default">Profile</p>
              <label className="form-label">Display name</label>
              <input className="input" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} />

              <label className="form-label">Timezone</label>
              <select className="input" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}>
                {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>

              <label className="form-label">Default landing page</label>
              <select className="input" value={form.default_landing_page} onChange={e => setForm({ ...form, default_landing_page: e.target.value })}>
                <option value="/member/accounts">Member Dashboard</option>
                <option value="/admin/unit-price">Unit Price History</option>
                <option value="/education/catalog">Education Catalog</option>
              </select>

              <div style={{ marginTop: '1rem' }}>
                <button className="btn-primary rounded-full" disabled={loading} type="submit">Save</button>
              </div>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <p className="text-xl font-semibold text-default">Notifications</p>
              <label className="form-label">Email me when a new contribution is recorded</label>
              <input type="checkbox" checked={profile?.notify_on_contribution} onChange={() => {}} />

              <label className="form-label">Email me when a monthly statement is available</label>
              <input type="checkbox" checked={profile?.notify_on_statement} onChange={() => {}} />

              <label className="form-label">Email me about new education content</label>
              <input type="checkbox" checked={profile?.notify_on_education} onChange={() => {}} />
            </div>
          </div>
        </form>

        {message && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <p style={{ color: message.type === 'error' ? '#fecaca' : '#bbf7d0' }}>{message.text}</p>
          </div>
        )}
      </div>
    </Page>
  )
}

export default SettingsPage
