import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { Page } from '../components/Page'

const DEFAULT_SETTINGS = {
  dues_info: 'Membership dues are $50 per month. Payment options available through the portal.',
  contact_email: 'Familyfa1995@gmail.com',
  meeting_schedule: 'Last Saturday of the month on Zoom at 9:00 AM EST'
}

const LEGACY_SETTINGS = {
  dues_info: 'Membership dues are $50 per semester. Payment options available through the portal.',
  contact_email: 'admin@ffainvestments.com',
  meeting_schedule: 'Weekly meetings every Tuesday at 7:00 PM in Room 205'
}

const AdminSettings = () => {
  const { user, profile, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settingsId, setSettingsId] = useState(null)
  const [form, setForm] = useState({
    club_name: '',
    tagline: '',
    homepage_message: '',
    welcome_message: '',
    dues_info: '',
    contact_email: '',
    meeting_schedule: '',
    announcements: ''
  })

  useEffect(() => {
    if (user && profile) {
      fetchSettings()
    }
  }, [user, profile])

  const fetchSettings = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase
        .from('club_settings')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (error) {
        setError(error.message)
      } else if (data) {
        setSettingsId(data.id)
        const normalizedDues =
          (!data.dues_info || data.dues_info === LEGACY_SETTINGS.dues_info)
            ? DEFAULT_SETTINGS.dues_info
            : data.dues_info

        const normalizedEmail =
          (!data.contact_email || data.contact_email.toLowerCase() === LEGACY_SETTINGS.contact_email.toLowerCase())
            ? DEFAULT_SETTINGS.contact_email
            : data.contact_email

        const normalizedMeeting =
          (!data.meeting_schedule || data.meeting_schedule === LEGACY_SETTINGS.meeting_schedule)
            ? DEFAULT_SETTINGS.meeting_schedule
            : data.meeting_schedule

        setForm({
          club_name: data.club_name || '',
          tagline: data.tagline || '',
          homepage_message: data.homepage_message || '',
          welcome_message: data.welcome_message || '',
          dues_info: normalizedDues,
          contact_email: normalizedEmail,
          meeting_schedule: normalizedMeeting,
          announcements: data.announcements || ''
        })
      }
    } catch (err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      club_name: form.club_name,
      tagline: form.tagline,
      homepage_message: form.homepage_message,
      welcome_message: form.welcome_message,
      dues_info: form.dues_info || DEFAULT_SETTINGS.dues_info,
      contact_email: form.contact_email || DEFAULT_SETTINGS.contact_email,
      meeting_schedule: form.meeting_schedule || DEFAULT_SETTINGS.meeting_schedule,
      announcements: form.announcements,
      updated_at: new Date().toISOString()
    }

    try {
      let response
      if (settingsId) {
        response = await supabase
          .from('club_settings')
          .update(payload)
          .eq('id', settingsId)
          .select()
          .maybeSingle()
      } else {
        response = await supabase
          .from('club_settings')
          .insert(payload)
          .select()
          .maybeSingle()
      }

      const { data, error } = response

      if (error) {
        setError(error.message)
      } else if (data) {
        setSettingsId(data.id)
        setSuccess('Settings saved successfully! Members will see these changes immediately.')
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err) {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <Page title="Admin Settings">
        <div className="card p-6 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400" />
            <span className="text-red-400">You must be logged in to access this page.</span>
          </div>
        </div>
      </Page>
    )
  }

  if (!isAdmin()) {
    return (
      <Page title="Admin Settings">
        <div className="card p-6 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400" />
            <span className="text-red-400">Admin access required to view this page.</span>
          </div>
        </div>
      </Page>
    )
  }

  if (loading) {
    return (
      <Page title="Admin Settings">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted mt-4">Loading settings...</p>
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page
      title="Admin Settings"
      subtitle="Control what members see across the platform"
    >
      <div className="card p-8 max-w-4xl mx-auto">

        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="card p-4 border-l-4 border-red-500 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {success && (
            <div className="card p-4 border-l-4 border-green-500 bg-green-500/10 flex items-center gap-3">
              <CheckCircle size={20} className="text-green-500" />
              <span className="text-green-600">{success}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-default mb-2">
              Club Name
            </label>
            <input
              type="text"
              name="club_name"
              placeholder="FFA Investments"
              value={form.club_name}
              onChange={handleChange}
              required
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-default mb-2">
              Club Tagline
            </label>
            <input
              type="text"
              name="tagline"
              placeholder="Where futures begin and wealth grows"
              value={form.tagline}
              onChange={handleChange}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-default mb-2">
              Homepage Message
            </label>
            <textarea
              name="homepage_message"
              placeholder="Welcome message that appears on the member homepage"
              value={form.homepage_message}
              onChange={handleChange}
              rows={3}
              className="input w-full resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-default mb-2">
              Member Welcome Message
            </label>
            <textarea
              name="welcome_message"
              placeholder="Personal welcome message for returning members"
              value={form.welcome_message}
              onChange={handleChange}
              rows={2}
              className="input w-full resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-default mb-2">
              Dues Information
            </label>
            <textarea
              name="dues_info"
              placeholder="Information about membership dues and payment"
              value={form.dues_info}
              onChange={handleChange}
              rows={2}
              className="input w-full resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-default mb-2">
              Contact Email
            </label>
            <input
              type="email"
              name="contact_email"
              placeholder="admin@ffainvestments.com"
              value={form.contact_email}
              onChange={handleChange}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-default mb-2">
              Meeting Schedule
            </label>
            <input
              type="text"
              name="meeting_schedule"
              placeholder="Weekly meetings every Tuesday at 7:00 PM"
              value={form.meeting_schedule}
              onChange={handleChange}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-default mb-2">
              Current Announcements
            </label>
            <textarea
              name="announcements"
              placeholder="Important announcements for members"
              value={form.announcements}
              onChange={handleChange}
              rows={3}
              className="input w-full resize-y"
            />
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={saving}>
            {saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 card bg-primary/10 border-l-4 border-primary">
          <p className="text-sm text-default">💡 Changes are saved to the database and visible to all members immediately.</p>
        </div>
      </div>
    </Page>
  )
}

export default AdminSettings
