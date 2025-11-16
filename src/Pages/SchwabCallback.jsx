import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import schwabApi from '../services/schwabApi'

/**
 * Enhanced OAuth Callback Handler for Charles Schwab Integration
 * 
 * Handles the OAuth redirect flow with enhanced security and error handling:
 * - State parameter validation (CSRF protection)
 * - Authorization code exchange with proper error messages
 * - User-friendly status updates and feedback
 * - Automatic redirect with appropriate delays
 * 
 * Compatible with existing Schwab app callback URLs and security measures.
 */
const SchwabCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true)
  const [status, setStatus] = useState('processing') // processing, exchanging, success, error
  const [message, setMessage] = useState('Processing authentication...')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    handleOAuthCallback()
  }, [])

  const handleOAuthCallback = async () => {
    try {
      const urlParams = new URLSearchParams(location.search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')
      const errorParam = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')

      // Handle OAuth errors (user denied access, etc.)
      if (errorParam) {
        console.error('OAuth Error:', errorParam, errorDescription)
        setStatus('error')
        setError(errorDescription || errorParam || 'Authentication was denied or failed')
        setMessage('Authentication failed. You can try again or contact support if the issue persists.')
        
        setTimeout(() => {
          navigate('/admin/schwab', { replace: true })
        }, 5000)
        return
      }

      // Validate required parameters
      if (!code) {
        console.error('No authorization code received')
        setStatus('error')
        setError('No authorization code received from Schwab')
        setMessage('Invalid callback - missing authorization code.')
        
        setTimeout(() => {
          navigate('/admin/schwab', { replace: true })
        }, 3000)
        return
      }

      if (!state) {
        console.error('No state parameter received - possible CSRF attack')
        setStatus('error')
        setError('Security validation failed')
        setMessage('Authentication failed due to security validation. Please try again.')
        
        setTimeout(() => {
          navigate('/admin/schwab', { replace: true })
        }, 3000)
        return
      }

      // Update status for token exchange
      setStatus('exchanging')
      setMessage('Exchanging authorization code for access tokens...')

      console.log('🔄 Processing OAuth callback with enhanced security...', {
        code: code ? '✅ Received' : '❌ Missing',
        state: state ? `✅ ${state.substring(0, 8)}...` : '❌ Missing',
        timestamp: new Date().toISOString()
      })
      
      // Exchange authorization code for tokens with state validation
      const tokens = await schwabApi.exchangeCodeForTokens(code, state)
      
      if (tokens && tokens.access_token) {
        console.log('✅ OAuth flow completed successfully')
        setStatus('success')
        setMessage('Authentication successful! Redirecting to your account overview...')
        
        // Small delay to show success message
        setTimeout(() => {
          navigate('/admin/schwab', { replace: true })
        }, 2000)
      } else {
        throw new Error('Token exchange succeeded but no access token received')
      }
      
    } catch (error) {
      console.error('❌ OAuth callback failed:', error)
      setStatus('error')
      
      // Provide specific error messages based on error type
      if (error.message?.includes('Invalid or expired OAuth state')) {
        setError('Security validation failed - possible CSRF attempt detected')
        setMessage('For security reasons, the authentication was rejected. Please try logging in again.')
      } else if (error.message?.includes('authorization code')) {
        setError('Authorization code expired or invalid')
        setMessage('The authorization code has expired. Please try logging in again.')
      } else if (error.status === 400) {
        setError('Invalid request to Schwab API')
        setMessage('There was a problem with the authentication request. Please try again.')
      } else if (error.status === 401) {
        setError('Authentication credentials invalid')
        setMessage('The authentication credentials are invalid. Please check configuration.')
      } else {
        setError(error.message || 'Unknown authentication error')
        setMessage('Authentication failed due to an unexpected error. Please try again.')
      }
      
      // Redirect after delay
      setTimeout(() => {
        navigate('/admin/schwab', { replace: true })
      }, 5000)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Authorization</h2>
            <p className="text-gray-600 mb-4">
              Please wait while we complete your Charles Schwab authentication...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authorization Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/schwab')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Schwab Integration
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // This shouldn't render, but just in case
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authorization Complete</h2>
          <p className="text-gray-600 mb-4">
            Redirecting you to the Schwab integration page...
          </p>
        </div>
      </div>
    </div>
  )
}

export default SchwabCallback