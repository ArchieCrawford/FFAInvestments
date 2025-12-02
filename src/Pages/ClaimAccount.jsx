import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, User, Link as LinkIcon, Loader2 } from 'lucide-react'

const redirectDelayMs = 1800

const loginRedirectUrl = (memberId) => {
  if (!memberId) return '/login'
  const claimPath = `/member/claim?memberId=${encodeURIComponent(memberId)}`
  return `/login?redirect=${encodeURIComponent(claimPath)}`
}

const interpretClaimError = (error) => {
  const details = (error?.message || error?.details || '').toLowerCase()

  if (details.includes('already_claimed_by_another')) {
    return {
      state: 'already_claimed_other',
      message:
        'This member account is already claimed by a different user. Please contact an admin if this is unexpected.',
    }
  }

  if (details.includes('already_claimed_by_you')) {
    return {
      state: 'already_claimed_self',
      message: 'Your account is already claimed. You can continue to your dashboard.',
    }
  }

  if (details.includes('member_not_found')) {
    return {
      state: 'not_found',
      message: 'We could not find a member record for this claim link.',
    }
  }

  if (details.includes('not_authenticated')) {
    return {
      state: 'error',
      message: 'You need to log in before claiming your member account.',
    }
  }

  return {
    state: 'error',
    message: error?.message || 'Failed to claim member account.',
  }
}

export default function ClaimAccount() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [authState, setAuthState] = useState({ loading: true, user: null, error: null })
  const [claimState, setClaimState] = useState({ state: 'idle', message: '' })
  const [isClaiming, setIsClaiming] = useState(false)
  const redirectTimerRef = useRef(null)

  // Support both memberId and legacy member_id params
  const memberId = searchParams.get('memberId') || searchParams.get('member_id') || null

  useEffect(() => {
    let isMounted = true
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!isMounted) return
        setAuthState({ loading: false, user: data?.user ?? null, error })
      } catch (error) {
        if (!isMounted) return
        setAuthState({ loading: false, user: null, error })
      }
    }

    fetchUser()

    return () => {
      isMounted = false
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  const {
    data: member,
    isLoading,
    isError,
    error,
  } = useQuery(
    ['claim_member', memberId],
    async () => {
      const { data, error: fetchError } = await supabase
        .from('members')
        .select('id, member_name, full_name, email, auth_user_id')
        .eq('id', memberId)
        .maybeSingle()
      if (fetchError) throw fetchError
      return data
    },
    { enabled: !!memberId }
  )

  const currentUser = authState.user

  const setStatus = (state, message) => {
    setClaimState({ state, message })
  }

  const handleClaim = async () => {
    if (!memberId || !currentUser) return

    // Prevent duplicate work if the member is already linked
    if (member?.auth_user_id === currentUser.id) {
      setStatus(
        'already_claimed_self',
        'Your account is already claimed. You can head directly to your dashboard.'
      )
      return
    }

    if (member?.auth_user_id && member.auth_user_id !== currentUser.id) {
      setStatus(
        'already_claimed_other',
        'This member account is already claimed by another user. Please reach out to an admin if this is unexpected.'
      )
      return
    }

    setIsClaiming(true)
    setStatus('idle', '')

    try {
      const { data, error: rpcError } = await supabase.rpc('claim_member_for_current_user', {
        member_id: memberId,
      })

      if (rpcError) {
        const mapped = interpretClaimError(rpcError)
        setStatus(mapped.state, mapped.message)
        return
      }

      if (data?.success) {
        setStatus('success', 'Your member account has been linked. Redirecting you now…')
        queryClient.invalidateQueries(['claim_member', memberId])
        queryClient.invalidateQueries(['member_record'])
        redirectTimerRef.current = setTimeout(() => {
          navigate('/member/dashboard')
        }, redirectDelayMs)
      } else {
        setStatus('error', 'Unexpected response from the server. Please try again.')
      }
    } catch (err) {
      const mapped = interpretClaimError(err)
      setStatus(mapped.state, mapped.message)
    } finally {
      setIsClaiming(false)
    }
  }

  if (!memberId) {
    return (
      <Page title="Claim Account" subtitle="Invalid Request">
        <div className="card p-4 text-sm text-muted">
          No member ID provided. Please use a valid claim link.
        </div>
      </Page>
    )
  }

  if (authState.loading) {
    return (
      <Page title="Claim Your Account" subtitle="Checking your session">
        <div className="card p-4 text-sm text-muted flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your login status…
        </div>
      </Page>
    )
  }

  if (!currentUser) {
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
              You already have an account in our system. To claim it, first log in or
              use “Forgot password” with the email on file, then come back to this
              link to finish claiming.
            </p>
            <Button
              onClick={() => navigate(loginRedirectUrl(memberId))}
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

  return (
    <Page title="Claim Your Account" subtitle="Link your member profile">
      <div className="space-y-4">
        {isLoading && (
          <div className="card p-4 text-sm text-muted">
            Loading your member record…
          </div>
        )}

        {isError && (
          <div className="card p-4 text-sm text-default border border-border bg-primary-soft">
            Error: {error?.message || 'Unable to load member record.'}
          </div>
        )}

        {!isLoading && !isError && !member && (
          <div className="card p-4 text-sm text-default border border-border bg-primary-soft">
            We couldn’t find this member record. Double-check the link or contact an admin.
          </div>
        )}

        {!isLoading && !isError && member && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {member.member_name || 'Member'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted">
                Logged in as: {currentUser.email}
              </div>

              {member.auth_user_id && member.auth_user_id !== currentUser.id && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This member record is already claimed by another user. Reach out to an
                    admin if you believe this is an error.
                  </AlertDescription>
                </Alert>
              )}

              {member.auth_user_id === currentUser.id && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    You already claimed this member profile. Continue to your dashboard to view
                    your account information.
                  </AlertDescription>
                </Alert>
              )}

              {!member.auth_user_id && (
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  onClick={handleClaim}
                  disabled={isClaiming}
                >
                  {isClaiming ? 'Claiming…' : 'Claim this account'}
                </Button>
              )}

              {member.auth_user_id === currentUser.id && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/member/dashboard')}
                >
                  Go to dashboard
                </Button>
              )}

              {claimState.state !== 'idle' && claimState.message && (
                <Alert variant={claimState.state === 'error' ? 'destructive' : undefined}>
                  {claimState.state === 'success' || claimState.state === 'already_claimed_self' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{claimState.message}</AlertDescription>
                </Alert>
              )}

              {(claimState.state === 'success' || claimState.state === 'already_claimed_self') && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/member/dashboard')}
                >
                  Go to dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Page>
  )
}
