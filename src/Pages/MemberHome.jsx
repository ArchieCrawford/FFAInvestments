import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Home, Mail, Calendar, DollarSign, Bell, TrendingUp, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'

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
      <Page title="Member Home">
        <div className="card p-6">
          <div className="text-red-400">
            <span>Please log in to view your dashboard.</span>
          </div>
        </div>
      </Page>
    )
  }

  if (loading) {
    return (
      <Page title="Member Home">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted mt-4">Loading dashboard...</p>
          </div>
        </div>
      </Page>
    )
  }

  if (error) {
    return (
      <Page title="Member Home">
        <div className="card p-6">
          <div className="text-red-400">
            <span>{error}</span>
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page 
      title={`Welcome, ${profile?.display_name || user.email}!`}
      subtitle={settings?.tagline || 'FFA Investments Member Portal'}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Club Info */}
        <div className="space-y-6">
          {/* Club Overview */}
          <div className="card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary-soft rounded-full">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-default">{settings?.club_name || 'FFA Investments'}</h2>
                <p className="text-sm text-muted">{settings?.tagline}</p>
              </div>
            </div>
            
            {settings?.homepage_message && (
              <div className="card p-4 bg-surface">
                <p className="text-default leading-relaxed">
                  {settings.homepage_message}
                </p>
              </div>
            )}
          </div>

          {/* Club Details */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-default mb-4">Club Information</h3>
            
            {settings?.meeting_schedule && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-default">Meeting Schedule</p>
                  <p className="text-sm text-muted">{settings.meeting_schedule}</p>
                </div>
              </div>
            )}
            
            {settings?.contact_email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-default">Contact</p>
                  <p className="text-sm text-muted">{settings.contact_email}</p>
                </div>
              </div>
            )}
            
            {settings?.dues_info && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-default">Membership Dues</p>
                  <p className="text-sm text-muted">{settings.dues_info}</p>
                </div>
              </div>
            )}
          </div>

          {/* Member Status */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-default mb-4">Your Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Role</span>
                <span className="text-sm font-medium text-default">{profile?.role || 'Member'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Email</span>
                <span className="text-sm font-medium text-default">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Member Since</span>
                <span className="text-sm font-medium text-default">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Announcements */}
        <div className="space-y-6">
          {/* Announcements */}
          {settings?.announcements && (
            <div className="card p-6 border-l-4 border-primary bg-primary-soft">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-default mb-2">Announcement</p>
                  <p className="text-sm text-default leading-relaxed">{settings.announcements}</p>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Message */}
          {settings?.welcome_message && (
            <div className="card p-6">
              <p className="text-default">{settings.welcome_message}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-default mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                {
                  label: 'View Portfolio',
                  icon: <TrendingUp size={18} />,
                  path: '/member/dashboard',
                  description: 'Check your investment performance'
                },
                {
                  label: 'Investment Tracker',
                  icon: <DollarSign size={18} />,
                  path: '/member/contribute',
                  description: 'Record contributions and withdrawals'
                },
                {
                  label: 'Profile Directory',
                  icon: <User size={18} />,
                  path: '/member/directory',
                  description: 'Connect with other members'
                }
              ].map((action) => (
                <button
                  key={action.path}
                  type="button"
                  className="btn-primary w-full px-4 py-3 rounded-lg flex items-center gap-3 text-left hover:opacity-90 transition-opacity"
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex-shrink-0">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{action.label}</p>
                    <p className="text-xs opacity-90">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Page>
  )
}

export default MemberHome
