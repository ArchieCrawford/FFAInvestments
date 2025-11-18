import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Home, Mail, Calendar, DollarSign, Bell, TrendingUp, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MemberHome = () => {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(null)
  const navigate = useNavigate()

  const DEFAULTS = {
    meeting_schedule: 'Last Saturday of the month on Zoom at 9:00 AM EST',
    contact_email: 'Familyfa1995@gmail.com',
    dues_info: 'Membership dues are $50 per month. Payment options available through the portal.'
  }

  const LEGACY = {
    meeting_schedule: 'Weekly meetings every Tuesday at 7:00 PM in Room 205',
    contact_email: 'admin@ffainvestments.com',
    dues_info: 'Membership dues are $50 per semester. Payment options available through the portal.'
  }

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase
        .from('club_settings')
        .select('club_name, tagline, homepage_message, welcome_message, dues_info, contact_email, meeting_schedule, announcements')
        .limit(1)
        .maybeSingle()

      if (error) {
        setError(error.message)
      } else {
        const normalizedMeeting =
          (!data?.meeting_schedule || data?.meeting_schedule === LEGACY.meeting_schedule)
            ? DEFAULTS.meeting_schedule
            : data.meeting_schedule

        const normalizedEmail =
          (!data?.contact_email || data?.contact_email.toLowerCase() === LEGACY.contact_email.toLowerCase())
            ? DEFAULTS.contact_email
            : data.contact_email

        const normalizedDues =
          (!data?.dues_info || data?.dues_info === LEGACY.dues_info)
            ? DEFAULTS.dues_info
            : data.dues_info

        setSettings({
          club_name: data?.club_name || 'FFA Investments',
          tagline: data?.tagline || 'Where futures begin and wealth grows',
          homepage_message: data?.homepage_message || 'Welcome to the FFA Investments member portal.',
          welcome_message: data?.welcome_message || 'Welcome back!',
          dues_info: normalizedDues,
          contact_email: normalizedEmail,
          meeting_schedule: normalizedMeeting,
          announcements: data?.announcements || ''
        })
      }
    } catch (err) {
      setError('Failed to load dashboard information')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="modern-login-container">
        <div className="login-form-container">
          <div className="login-form-wrapper">
            <div className="error-alert">
              <span>Please log in to view your dashboard.</span>
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
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="modern-login-container">
        <div className="login-form-container">
          <div className="login-form-wrapper">
            <div className="error-alert">
              <span>{error}</span>
            </div>
          </div>
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

      {/* Left Side - Club Info */}
      <div className="login-branding">
        <div className="brand-content">
          <div className="brand-icon">
            <TrendingUp size={48} />
            <DollarSign size={32} className="dollar-overlay" />
          </div>
          <h1 className="brand-title">
            <span className="gradient-text">{settings?.club_name || 'FFA Investments'}</span>
          </h1>
          {settings?.tagline && (
            <p className="brand-subtitle">{settings.tagline}</p>
          )}
          
          {settings?.homepage_message && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
                {settings.homepage_message}
              </p>
            </div>
          )}

          <div className="feature-highlights" style={{ marginTop: '2rem' }}>
            {settings?.meeting_schedule && (
              <div className="feature">
                <Calendar size={20} />
                <span>{settings.meeting_schedule}</span>
              </div>
            )}
            {settings?.contact_email && (
              <div className="feature">
                <Mail size={20} />
                <span>{settings.contact_email}</span>
              </div>
            )}
            {settings?.dues_info && (
              <div className="feature">
                <DollarSign size={20} />
                <span>{settings.dues_info}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Member Dashboard */}
      <div className="login-form-container">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2>Member Home</h2>
            <p>Welcome back, {profile?.display_name || user.email}</p>
          </div>

          {settings?.welcome_message && (
            <div className="demo-hint" style={{ marginBottom: '2rem' }}>
              <p>{settings.welcome_message}</p>
            </div>
          )}

          {settings?.announcements && (
            <div className="error-alert" style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderColor: 'rgba(59, 130, 246, 0.3)', 
              color: '#93c5fd',
              marginBottom: '2rem'
            }}>
              <Bell size={20} />
              <div>
                <strong>Announcement:</strong>
                <p style={{ margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>{settings.announcements}</p>
              </div>
            </div>
          )}

          {/* Member Actions */}
          <div className="login-form">
            <div className="demo-users">
              <p className="demo-label">Quick Actions:</p>
              <div className="demo-buttons" style={{ flexDirection: 'column', gap: '1rem' }}>
                <button
                  type="button"
                  className="demo-btn bg-gradient-to-r from-blue-400 to-cyan-400"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                  onClick={() => navigate('/member/dashboard')}
                >
                  <TrendingUp size={16} />
                  <span>View Portfolio</span>
                </button>
                <button
                  type="button"
                  className="demo-btn bg-gradient-to-r from-green-400 to-emerald-400"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                  onClick={() => navigate('/member/contribute')}
                >
                  <DollarSign size={16} />
                  <span>Investment Tracker</span>
                </button>
                <button
                  type="button"
                  className="demo-btn bg-gradient-to-r from-purple-400 to-pink-400"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                  onClick={() => navigate('/member/directory')}
                >
                  <User size={16} />
                  <span>Profile Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Member Status */}
          <div style={{ 
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>
              Your Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                <strong>Role:</strong> {profile?.role || 'Member'}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                <strong>Email:</strong> {user.email}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                <strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberHome
