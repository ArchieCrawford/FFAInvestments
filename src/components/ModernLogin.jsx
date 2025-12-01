import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logMemberLogin, logFailedMemberLogin } from '@/lib/ffaApi'
import { Eye, EyeOff, Mail, Lock, Sparkles, TrendingUp, DollarSign, User } from 'lucide-react'
// Styles centralized in global index.css with semantic theme classes

const ModernLogin = () => {
  const { user, profile, signIn, signUp, loading, error, clearError } = useAuth()
  const [mode, setMode] = useState('signin')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState(null)
  const [forgotSending, setForgotSending] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!error) return

    // Ignore benign "no session" messages from the auth client on initial load
    const isSessionMissing = typeof error === 'string'
      ? error.toLowerCase().includes('session missing')
      : (error.message || '').toLowerCase().includes('session missing')

    // Only show auth errors in the UI if the user attempted to submit the form
    // or if the error is not the benign session-missing message.
    if (attemptedSubmit || !isSessionMissing) {
      setFormError(error)
      setIsSubmitting(false)
    }
  }, [error, attemptedSubmit])

  // Clear errors when switching modes
  const handleToggleMode = () => {
    setMode(prev => (prev === 'signin' ? 'signup' : 'signin'))
    setFormError('')
    clearError()
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: ''
    })
  }

  // Redirect if user is logged in
  if (user) {
    const from = location.state?.from?.pathname
    const defaultDestination = profile?.role === 'member' ? '/member/accounts' : '/admin/dashboard'
    const target = from && from !== '/login' ? from : defaultDestination
    return <Navigate to={target} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)
    setIsSubmitting(true)
    setFormError('')
    clearError()

    // Validation
    if (!formData.email || !formData.password) {
      setFormError('Email and password are required')
      setIsSubmitting(false)
      return
    }

    if (mode === 'signup') {
      if (!formData.displayName) {
        setFormError('Display name is required for signup')
        setIsSubmitting(false)
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match')
        setIsSubmitting(false)
        return
      }
      if (formData.password.length < 8) {
        setFormError('Password must be at least 8 characters long')
        setIsSubmitting(false)
        return
      }
    }

    try {
      if (mode === 'signup') {
        console.log('🔑 Attempting sign up for:', formData.email)
        const result = await signUp(formData.email, formData.password, formData.displayName)
        
          if (result?.error) {
          console.error('❌ Sign up error:', result.error)
          
          // Provide specific error messages for common issues
          if (result.error.message?.includes('Database error')) {
            setFormError('⚠️ Account creation is temporarily unavailable. Please contact support.')
          } else if (result.error.message?.includes('already registered')) {
            setFormError('📧 This email is already registered. Please try signing in instead.')
          } else if (result.error.message?.includes('Invalid email')) {
            setFormError('❌ Please enter a valid email address.')
          } else {
            setFormError(result.error.message || 'Sign up failed. Please try again.')
          }
        } else {
          // Success - show email confirmation message
          setFormError('')
          alert('✅ Account created successfully! Please check your email for a confirmation link before signing in.')
          setMode('signin') // Switch to sign-in mode
          setAttemptedSubmit(false)
        }
      } else {
        console.log('🔑 Attempting sign in for:', formData.email)
        const result = await signIn(formData.email, formData.password)
        
        if (result?.error) {
          console.error('❌ Sign in error:', result.error)
          
          if (result.error.message?.includes('Email not confirmed')) {
            setFormError('📧 Please check your email and click the confirmation link before signing in.')
          } else if (result.error.message?.includes('Invalid login credentials')) {
            setFormError('❌ Invalid email or password. Please check your credentials.')
          } else {
            setFormError(result.error.message || 'Sign in failed. Please try again.')
          }

          // Log failed login (best effort)
          try {
            const userAgent = typeof window !== 'undefined' ? window?.navigator?.userAgent || null : null
            const ip = await fetch('https://api.ipify.org?format=json')
              .then(r => r.json())
              .then(d => d.ip)
              .catch(() => null)
            await logFailedMemberLogin({
              email: formData.email || null,
              failureReason: result.error.message || 'Unknown error',
              ip,
              userAgent,
            })
          } catch (logErr) {
            console.warn('Failed to log failed login', logErr)
          }
        }
        else {
          // successful sign in - clear attempted submit flag
          setAttemptedSubmit(false)

          try {
            const { data: userData } = await supabase.auth.getUser()
            const authedUser = userData?.user
            const userId = authedUser?.id || null
            const email = authedUser?.email || formData.email
            const userAgent = typeof window !== 'undefined' ? window?.navigator?.userAgent || null : null

            const ip = await fetch('https://api.ipify.org?format=json')
              .then(r => r.json())
              .then(d => d.ip)
              .catch(() => null)

            let city = null
            let region = null
            let country = null
            if (ip) {
              try {
                const geo = await fetch(`https://ipapi.co/${ip}/json/`).then(r => r.json())
                city = geo?.city || null
                region = geo?.region || geo?.region_name || geo?.state || null
                country = geo?.country_name || geo?.country || null
              } catch (geoErr) {
                console.warn('Geolocation lookup failed', geoErr)
              }
            }

            let memberAccountId = null
            let isActive = false
            if (email) {
              try {
                const { data: acct, error: acctErr } = await supabase
                  .from('member_accounts')
                  .select('id, is_active')
                  .eq('email', email)
                  .eq('is_active', true)
                  .maybeSingle()
                if (acctErr) throw acctErr
                if (acct) {
                  memberAccountId = acct.id
                  isActive = acct.is_active === true
                }
              } catch (acctLookupErr) {
                console.warn('Member account lookup failed', acctLookupErr)
              }
            }

            try {
              await logMemberLogin({
                userId,
                email,
                ip,
                userAgent,
                isActive,
                memberAccountId,
                city,
                region,
                country,
              })
            } catch (logErr) {
              console.warn('Failed to log member login', logErr)
            }

            if (memberAccountId) {
              try {
                await supabase
                  .from('member_accounts')
                  .update({ last_login_at: new Date().toISOString() })
                  .eq('id', memberAccountId)
              } catch (updateErr) {
                console.warn('Failed to update last_login_at', updateErr)
              }
            }
          } catch (logWrapperErr) {
            console.warn('Login logging skipped due to error', logWrapperErr)
          }
        }
      }
    } catch (err) {
      console.error('💥 Authentication error:', err)
      setFormError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (formError) setFormError('') // Clear errors on typing
  }

  // Demo quick-login removed for production security; use standard sign in instead.

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-white space-y-8">
          <div className="flex items-center gap-4">
            <TrendingUp size={48} />
            <DollarSign size={32} className="opacity-80" />
          </div>
          <h1 className="text-5xl font-bold">
            <span>FFA</span>
            <span className="opacity-90"> Investments</span>
          </h1>
          <p className="text-xl opacity-90">
            Where futures begin and wealth grows
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles size={20} />
              <span>Smart Investment Tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp size={20} />
              <span>Real-time Portfolio Analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign size={20} />
              <span>Member Dues Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-default">Welcome Back</h2>
            <p className="text-muted mt-2">Enter your credentials to access your account</p>
          </div>

          {/* Demo quick-login removed */}

          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <span>{formError}</span>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-default mb-2">Display Name</label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    name="displayName"
                    placeholder="Display Name"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required={mode === 'signup'}
                    className="input w-full pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-default mb-2">Email Address</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input w-full pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-default mb-2">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="input w-full pl-10 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-default"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-default mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={mode === 'signup'}
                    className="input w-full pl-10 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-default"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full rounded-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                </span>
              ) : (
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {mode === 'signin' && (
            <div className="mt-4">
              <button
                type="button"
                className="text-sm text-muted hover:text-default transition-colors"
                onClick={() => setShowForgot(prev => !prev)}
              >
                Forgot password?
              </button>

              {showForgot && (
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="email"
                      name="forgotEmail"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="input w-full pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-primary-soft border border-border flex-1"
                      onClick={async () => {
                        if (forgotSending) return
                        setForgotStatus(null)
                        if (!forgotEmail) {
                          setForgotStatus({ type: 'error', text: 'Please enter your email.' })
                          return
                        }
                        setForgotSending(true)
                        try {
                          const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                            redirectTo: `${window.location.origin}/reset-password`
                          })
                          if (error) {
                            setForgotStatus({ type: 'error', text: error.message })
                          } else {
                            setForgotStatus({ type: 'success', text: 'If that email exists, a reset link was sent.' })
                          }
                        } catch (err) {
                          setForgotStatus({ type: 'error', text: err.message || 'Unable to send reset email.' })
                        } finally {
                          setForgotSending(false)
                        }
                      }}
                      disabled={forgotSending}
                    >
                      {forgotSending ? 'Sending…' : 'Send reset email'}
                    </button>
                    <button 
                      type="button" 
                      className="btn-primary-soft border border-border" 
                      onClick={() => { setShowForgot(false); setForgotEmail(''); setForgotStatus(null) }}
                    >
                      Cancel
                    </button>
                  </div>
                  {forgotStatus && (
                    <div className={forgotStatus.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded' : 'text-green-600 px-4 py-3'}>
                      {forgotStatus.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-6">
            <button
              type="button"
              className="text-sm text-muted hover:text-default transition-colors"
              onClick={handleToggleMode}
            >
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <span className="text-primary font-medium">
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModernLogin
