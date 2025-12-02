import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, User, Link as LinkIcon } from 'lucide-react'

function getClaimErrorMessage(error) {
  const raw = error?.message || ''
  const lower = raw.toLowerCase()

  if (lower.includes('already claimed')) {
    return 'This member is already claimed. Please contact an admin if this is unexpected.'
  }

  if (lower.includes('not found')) {
    return 'We could not find the member associated with this claim link.'
  }

  if (lower.includes('must be signed in')) {
    return 'You need to be signed in before you can claim your account.'
  }

  return raw || 'Failed to claim account.'
}

/**
 * ClaimAccount Component
 *
 * Allows authenticated users to claim their member account by linking
 * their auth user ID to a specific member record in the members table.
 *
 * Flow:
 * 1. Reads memberId from query string (?memberId=...)
 * 2. Requires login (Prompts to log in if not authenticated)
 * 3. If member is unclaimed, lets the user claim it
 * 4. On success, redirects to member dashboard
 */
export default function ClaimAccount() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Support both memberId and legacy member_id params
  const memberId = searchParams.get('memberId') || searchParams.get('member_id') || null

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
        .select('*')
        .eq('id', memberId)
        .maybeSingle()
      if (fetchError) throw fetchError
      return data
    },
    { enabled: !!memberId }
  )

  const claimMutation = useMutation(
    async () => {
      const { data, error: rpcError } = await supabase.rpc(
        'claim_member_for_current_user',
        { p_member_id: memberId }
      )
      if (rpcError) throw rpcError
      return data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['claim_member', memberId])
        queryClient.invalidateQueries(['member_record'])
        navigate('/member/dashboard')
      },
    }
  )

  if (!memberId) {
    return (
      <Page title="Claim Account" subtitle="Invalid Request">
        <div className="card p-4 text-sm text-muted">
          No member ID provided. Please use a valid claim link.
        </div>
      </Page>
    )
  }

  if (!user) {
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
              return to this link to finish claiming.
            </p>
            <Button
              onClick={() => navigate(`/login?memberId=${memberId}`)}
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
                Logged in as: {user.email}
              </div>

              {member.auth_user_id && member.auth_user_id !== user.id && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This member record is already claimed by another user. Reach out to an
                    admin if you believe this is an error.
                  </AlertDescription>
                </Alert>
              )}

              {member.auth_user_id === user.id && (
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
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isLoading}
                >
                  {claimMutation.isLoading ? 'Claiming…' : 'Claim this account'}
                </Button>
              )}

              {member.auth_user_id === user.id && (
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/member/dashboard')}>
                  Go to dashboard
                </Button>
              )}

              {claimMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {getClaimErrorMessage(claimMutation.error)}
                  </AlertDescription>
                </Alert>
              )}

              {claimMutation.isSuccess && !member.auth_user_id && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Account claimed successfully! Redirecting…
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Page>
  )
}
