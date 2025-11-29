import { useCurrentMemberAccount, useMemberTimelineByName } from '../lib/queries'

export default function MemberDashboard_Debug() {
  const { data: account, isLoading: accountLoading, error: accountError } = useCurrentMemberAccount()
  
  const { data: timeline, isLoading: timelineLoading, error: timelineError } = useMemberTimelineByName(
    account?.member_name || null,
    { enabled: !!account?.member_name }
  )

  if (accountLoading || timelineLoading) {
    return <div style={{ padding: 20 }}>Loading...</div>
  }

  if (accountError) {
    return <div style={{ padding: 20 }}>Error loading account: {accountError.message}</div>
  }

  if (timelineError) {
    return <div style={{ padding: 20 }}>Error loading timeline: {timelineError.message}</div>
  }

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h2>Account Data:</h2>
      <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, overflow: 'auto' }}>
        {JSON.stringify(account, null, 2)}
      </pre>

      <h2 style={{ marginTop: 30 }}>Timeline Data:</h2>
      <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, overflow: 'auto' }}>
        {JSON.stringify(timeline, null, 2)}
      </pre>
    </div>
  )
}
