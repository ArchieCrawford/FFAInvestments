import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

const SupabaseLogin = () => {
  const { user, signIn, signUp, signInWithMagicLink, loading, error, clearError, debugInfo } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin', 'signup', 'magic'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const location = useLocation()

  // Log component state for debugging
  useEffect(() => {
    console.log('🔧 SupabaseLogin: Component state:', {
      mode,
      hasUser: !!user,
      loading,
      error: error || 'none',
      formError: formError || 'none',
      isSubmitting
    })
  }, [mode, user, loading, error, formError, isSubmitting])

  // Show debug info if there are repeated errors
  useEffect(() => {
    if (error || formError) {
      const timer = setTimeout(() => {
        setShowDebugInfo(true)
        console.log('🐛 SupabaseLogin: Showing debug info due to persistent errors')
      }, 10000) // Show debug after 10 seconds of errors
      
      return () => clearTimeout(timer)
    } else {
      setShowDebugInfo(false)
    }
  }, [error, formError])

  // Redirect if already logged in
  if (user) {
    console.log('✅ SupabaseLogin: User authenticated, redirecting')
    const from = location.state?.from?.pathname || '/admin/dashboard' // Default to admin dashboard
    return <Navigate to={from} replace />
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
    clearError()
  }

  const validateForm = () => {
    console.log('🔍 SupabaseLogin: Validating form for mode:', mode)
    
    if (!formData.email) {
      setFormError('Email is required')
      return false
    }
    
    if (!formData.email.includes('@')) {
      setFormError('Please enter a valid email address')
      return false
    }
    
    if (mode === 'signin' && !formData.password) {
      setFormError('Password is required')
      return false
    }
    
    if (mode === 'signup') {
      if (!formData.password) {
        setFormError('Password is required')
        return false
      }
      if (formData.password.length < 6) {
        setFormError('Password must be at least 6 characters')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match')
        return false
      }
    }
    
    console.log('✅ SupabaseLogin: Form validation passed')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('🚀 SupabaseLogin: Form submitted for mode:', mode)
    
    if (!validateForm()) {
      console.log('❌ SupabaseLogin: Form validation failed')
      return
    }
    
    setIsSubmitting(true)
    setFormError('')
    
    try {
      let result
      
      if (mode === 'signin') {
        console.log('🔑 SupabaseLogin: Attempting sign in')
        result = await signIn(formData.email, formData.password)
      } else if (mode === 'signup') {
        console.log('📝 SupabaseLogin: Attempting sign up')
        result = await signUp(formData.email, formData.password, formData.displayName)
        if (result.data && !result.error) {
          setFormError('Account created! Please check your email to verify your account.')
          setMode('signin')
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '', displayName: '' }))
        }
      } else if (mode === 'magic') {
        console.log('🔗 SupabaseLogin: Attempting magic link')
        result = await signInWithMagicLink(formData.email)
        if (result.data && !result.error) {
          setFormError('Magic link sent! Please check your email.')
        }
      }
      
      if (result?.error) {
        const errorMessage = result.error.userFriendlyMessage || result.error.message || 'Authentication failed'
        console.error('❌ SupabaseLogin: Authentication failed:', errorMessage)
        setFormError(errorMessage)
        
        // Special handling for specific errors
        if (errorMessage.includes('Invalid login credentials')) {
          setFormError('Invalid email or password. Please double-check your credentials.')
        } else if (errorMessage.includes('Email not confirmed')) {
          setFormError('Please check your email and click the verification link before signing in.')
        }
      } else if (result?.data && mode === 'signin') {
        console.log('✅ SupabaseLogin: Authentication successful')
      }
    } catch (err) {
      console.error('❌ SupabaseLogin: Unexpected error:', err)
      setFormError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickLogin = async (email, password) => {
    console.log('⚡ SupabaseLogin: Quick login attempt for:', email)
    setIsSubmitting(true)
    setFormError('')
    
    const result = await signIn(email, password)
    if (result?.error) {
      const errorMessage = result.error.userFriendlyMessage || result.error.message || 'Quick login failed'
      console.error('❌ SupabaseLogin: Quick login failed:', errorMessage)
      setFormError(errorMessage)
    }
    setIsSubmitting(false)
  }

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo)
    console.log('🐛 SupabaseLogin: Debug info toggled:', !showDebugInfo)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            FFA Investment Club
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create a new account'}
            {mode === 'magic' && 'Sign in with magic link'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg" onSubmit={handleSubmit}>
          {/* Mode Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'signin' 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'signup' 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'magic' 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Error Display */}
          {(error || formError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <div className="font-medium mb-1">Authentication Error</div>
              <div className="text-sm">{formError || error}</div>
              
              {/* Debug toggle button */}
              <button
                type="button"
                onClick={toggleDebugInfo}
                className="mt-2 text-xs text-red-600 underline hover:text-red-800"
              >
                {showDebugInfo ? 'Hide' : 'Show'} Debug Info
              </button>
            </div>
          )}

          {/* Debug Information */}
          {showDebugInfo && debugInfo && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs">
              <div className="font-medium text-yellow-800 mb-2">Debug Information</div>
              <pre className="text-yellow-700 whitespace-pre-wrap overflow-auto max-h-32">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
              <div className="mt-2 text-yellow-600">
                If you continue having issues, please share this information with support.
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Display Name (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Your name"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            {/* Password (not for magic link) */}
            {mode !== 'magic' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            )}

            {/* Confirm Password (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm password"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Please wait...
                </span>
              ) : (
                <>
                  {mode === 'signin' && 'Sign in'}
                  {mode === 'signup' && 'Create account'}
                  {mode === 'magic' && 'Send magic link'}
                </>
              )}
            </button>
          </div>

          {/* Quick Login Buttons */}
          {mode === 'signin' && (
            <div className="space-y-2">
              <div className="text-center text-sm text-gray-600 mb-2">Quick login for testing:</div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin('admin@ffa.com', 'admin123')}
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                >
                  Admin Login
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('archie.crawford1@gmail.com', 'archie123')}
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                >
                  Archie's Account
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default SupabaseLogin