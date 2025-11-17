import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Sparkles, TrendingUp, DollarSign } from 'lucide-react'
import './ModernLogin.css'

const BackgroundAnimation = () => (
  <div className="app-bg-animation">
    <div className="app-bg-shape app-bg-shape-1"></div>
    <div className="app-bg-shape app-bg-shape-2"></div>
    <div className="app-bg-shape app-bg-shape-3"></div>
    <div className="app-bg-shape app-bg-shape-4"></div>
  </div>
)

const ModernLogin = () => {
  const { user, signIn, signUp, loading, error, clearError } = useAuth()
  const [mode, setMode] = useState('signin')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (error) {
      setFormError(error)
      setIsSubmitting(false)
    }
  }, [error])

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
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
            setFormError('⚠️ Account creation is temporarily unavailable. Please try the demo users below or contact support.')
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

  const demoUsers = [
    { email: 'admin@ffainvestments.com', role: 'Admin', color: 'from-purple-400 to-pink-400' },
    { email: 'member@ffainvestments.com', role: 'Member', color: 'from-blue-400 to-cyan-400' },
    { email: 'demo@ffainvestments.com', role: 'Demo', color: 'from-green-400 to-emerald-400' }
  ]

  const fillDemoLogin = (email) => {
    setFormData({ ...formData, email, password: 'demo123456' })
  }

  if (loading) {
    return (
      <div className="app-shell modern-login">
        <BackgroundAnimation />
        <div className="fullscreen-center">
          <div className="loading-spinner">
            <div className="spinner-page"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell modern-login">
      <BackgroundAnimation />

      {/* Left Side - Branding */}
      <div className="login-branding">
        <div className="brand-content">
          <div className="brand-icon">
            <TrendingUp size={48} />
            <DollarSign size={32} className="dollar-overlay" />
          </div>
          <h1 className="brand-title">
            <span className="gradient-text">FFA</span>
            <span className="text-white"> Investments</span>
          </h1>
          <p className="brand-subtitle">
            Where futures begin and wealth grows
          </p>
          
          <div className="feature-highlights">
            <div className="feature">
              <Sparkles size={20} />
              <span>Smart Investment Tracking</span>
            </div>
            <div className="feature">
              <TrendingUp size={20} />
              <span>Real-time Portfolio Analytics</span>
            </div>
            <div className="feature">
              <DollarSign size={20} />
              <span>Member Dues Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-container">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Enter your credentials to access your account</p>
          </div>

          {/* Demo Users */}
          <div className="demo-users">
            <p className="demo-label">Quick Demo Access:</p>
            <div className="demo-buttons">
              {demoUsers.map((user, index) => (
                <button
                  key={index}
                  type="button"
                  className={`btn btn-pill demo-btn bg-gradient-to-r ${user.color}`}
                  onClick={() => fillDemoLogin(user.email)}
                >
                  <User size={16} />
                  <span>{user.role}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {formError && (
              <div className="error-alert">
                <span>{formError}</span>
              </div>
            )}

            {mode === 'signup' && (
              <div className="input-group">
                <div className="input-wrapper">
                  <User size={20} className="input-icon" />
                  <input
                    type="text"
                    name="displayName"
                    placeholder="Display Name"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="input-group">
                <div className="input-wrapper">
                  <Lock size={20} className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={mode === 'signup'}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary btn-pill submit-btn ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-inline"></div>
                  <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          <div className="form-footer">
            <button
              type="button"
              className="mode-toggle"
              onClick={handleToggleMode}
            >
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <span className="toggle-link">
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </span>
            </button>
          </div>

          {/* Password hint for demo users */}
          <div className="demo-hint">
            <p>💡 Demo password: <code>demo123456</code></p>
            <p className="test-info">🧪 Sign-up requires email confirmation. Demo users are pre-configured for immediate access.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModernLogin
