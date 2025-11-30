import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentMember } from '@/lib/authHooks'
import { Page } from '@/components/Page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, User } from 'lucide-react'

/**
 * MemberAccounts Page
 * 
 * Placeholder page that redirects users to their main dashboard
 * where all account information is displayed.
 */
export default function MemberAccounts() {
  const navigate = useNavigate()
  const { member, loading } = useCurrentMember()

  if (loading) {
    return (
      <Page title="My Accounts">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-muted mt-4">Loading...</p>
          </div>
        </div>
      </Page>
    )
  }

  if (!member) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <Page title="My Accounts" subtitle="View your investment account details">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted">
            Your account information, portfolio value, positions, and investment
            history are all available on your main dashboard.
          </p>
          <Button 
            onClick={() => navigate('/member/dashboard')}
            className="w-full sm:w-auto"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </Page>
  )
}
