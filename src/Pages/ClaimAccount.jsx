import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, User, Link as LinkIcon } from 'lucide-react'

/**
 * ClaimAccount Component
 * 
 * Allows authenticated users to claim their member account by linking
 * their auth user ID to a specific member record in the members table.
 * 
 * Flow:
 * 1. Reads member_id from query string (?member_id=123)
 * 2. Checks if user is authenticated
 * 3. If not authenticated: shows login prompt with redirect
 * 4. If authenticated: shows claim button
 * 5. On claim: calls RPC function claim_member_account
 * 6. On success: redirects to member dashboard
 */
export default function ClaimAccount() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Get member_id from query string
  const memberId = searchParams.get('member_id')
  
  // State management
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // idle | claiming | success | error
  const [errorMessage, setErrorMessage] = useState('')

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        setSession(sessionData?.session || null)
      } catch (err) {
        console.error('[ClaimAccount] Error checking session:', err)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  /**
   * Handle the account claim action
   * Calls the Supabase RPC function to link the auth user to the member
   */
  const handleClaim = async () => {
    if (!memberId) {
      setStatus('error')
      setErrorMessage('No member ID provided')
      return
    }

    setStatus('claiming')
    setErrorMessage('')

    try {
      // Call the RPC function to claim the account
      const { data, error } = await supabase.rpc('claim_member_account', {
        _member_id: parseInt(memberId, 10)
      })

      if (error) throw error

      // Success - redirect to dashboard after brief delay
      setStatus('success')
      setTimeout(() => {
        navigate('/member/dashboard')
      }, 1500)
    } catch (err) {
      console.error('[ClaimAccount] Claim failed:', err)
      setStatus('error')
      setErrorMessage(err.message || 'Failed to claim account. Please try again.')
    }
  }

  // Loading state
  if (loading) {
    return (
      <Page title="Claim Account" subtitle="Loading...">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted">Checking authentication...</p>
          </CardContent>
        </Card>
      </Page>
    )
  }

  // Missing member_id in query string
  if (!memberId) {
    return (
      <Page title="Claim Account" subtitle="Invalid Request">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No member ID provided. Please use a valid claim link.
          </AlertDescription>
        </Alert>
      </Page>
    )
  }

  // User is NOT logged in - show login prompt
  if (!session) {
    return (
      <Page title="Claim Your Account" subtitle="Authentication Required">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Login Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted">
              You need to log in to claim your member account. After logging in,
              you'll be able to link your account and access your dashboard.
            </p>
            <Button 
              onClick={() => navigate(`/login?member_id=${memberId}`)}
              className="w-full"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Page>
    )
  }

  // User IS logged in - show claim interface
  return (
    <Page title="Claim Your Account" subtitle="Link your member profile">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Claim Member Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error state */}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Success state */}
          {status === 'success' && (
            <Alert className="border-emerald-500 bg-emerald-50">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900">
                Account claimed successfully! Redirecting to your dashboard...
              </AlertDescription>
            </Alert>
          )}

          {/* Idle state - show claim button */}
          {status === 'idle' && (
            <>
              <p className="text-muted">
                Click below to claim your member account (ID: {memberId}) and link it
                to your login. This will grant you access to your portfolio dashboard.
              </p>
              <Button 
                onClick={handleClaim}
                className="w-full"
                size="lg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Claim My Account
              </Button>
            </>
          )}

          {/* Claiming state - show loading button */}
          {status === 'claiming' && (
            <Button 
              disabled
              className="w-full"
              size="lg"
            >
              Claiming Account...
            </Button>
          )}
        </CardContent>
      </Card>
    </Page>
  )
}
