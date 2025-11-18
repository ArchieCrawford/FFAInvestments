import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react'

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
      <div className="modern-login-container">
        <div className="login-form-container">
          <div className="login-form-wrapper">
            <div className="error-alert">
              <AlertCircle size={20} />
              <span>You must be logged in to access this page.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin()) {
    return (
      <div className="modern-login-container">
        <div className="login-form-container">
          <div className="login-form-wrapper">
            <div className="error-alert">
              <AlertCircle size={20} />
              <span>Admin access required to view this page.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="modern-login-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-login-container">
      {/* Background Animation */}
      <div className="bg-animation">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
        <div className="bg-shape bg-shape-4"></div>
      </div>

      {/* Left Side - Branding */}
      <div className="login-branding">
        <div className="brand-content">
          <div className="brand-icon">
            <Settings size={48} />
          </div>
          <h1 className="brand-title">
            <span className="gradient-text">Admin</span>
            <span className="text-white"> Settings</span>
          </h1>
          <p className="brand-subtitle">
            Control what members see across the platform
          </p>
          
          <div className="feature-highlights">
            <div className="feature">
              <Settings size={20} />
              <span>Real-time Updates</span>
            </div>
            <div className="feature">
              <Save size={20} />
              <span>Instant Synchronization</span>
            </div>
            <div className="feature">
              <CheckCircle size={20} />
              <span>Global Configuration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Settings Form */}
      <div className="login-form-container">
        <div className="login-form-wrapper" style={{ maxWidth: '600px' }}>
          <div className="form-header">
            <h2>Club Settings</h2>
            <p>Update content that members see on their dashboards</p>
          </div>

          <form onSubmit={handleSave} className="login-form">
            {error && (
              <div className="error-alert">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="error-alert" style={{ 
                background: 'rgba(22,163,74,0.1)', 
                borderColor: 'rgba(22,163,74,0.3)', 
                color: '#bbf7d0' 
              }}>
                <CheckCircle size={20} />
                <span>{success}</span>
              </div>
            )}

            <div className="input-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Club Name
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="club_name"
                  placeholder="FFA Investments"
                  value={form.club_name}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '1rem' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Club Tagline
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="tagline"
                  placeholder="Where futures begin and wealth grows"
                  value={form.tagline}
                  onChange={handleChange}
                  style={{ paddingLeft: '1rem' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Homepage Message
              </label>
              <div className="input-wrapper">
                <textarea
                  name="homepage_message"
                  placeholder="Welcome message that appears on the member homepage"
                  value={form.homepage_message}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    border: '2px solid transparent',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Member Welcome Message
              </label>
              <div className="input-wrapper">
                <textarea
                  name="welcome_message"
                  placeholder="Personal welcome message for returning members"
                  value={form.welcome_message}
                  onChange={handleChange}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    border: '2px solid transparent',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Dues Information
              </label>
              <div className="input-wrapper">
                <textarea
                  name="dues_info"
                  placeholder="Information about membership dues and payment"
                  value={form.dues_info}
                  onChange={handleChange}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    border: '2px solid transparent',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Contact Email
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  name="contact_email"
                  placeholder="admin@ffainvestments.com"
                  value={form.contact_email}
                  onChange={handleChange}
                  style={{ paddingLeft: '1rem' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Meeting Schedule
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="meeting_schedule"
                  placeholder="Weekly meetings every Tuesday at 7:00 PM"
                  value={form.meeting_schedule}
                  onChange={handleChange}
                  style={{ paddingLeft: '1rem' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Current Announcements
              </label>
              <div className="input-wrapper">
                <textarea
                  name="announcements"
                  placeholder="Important announcements for members"
                  value={form.announcements}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    border: '2px solid transparent',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? (
                <>
                  <div className="spinner-inline"></div>
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

          <div className="demo-hint">
            <p>💡 Changes are saved to the database and visible to all members immediately.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
