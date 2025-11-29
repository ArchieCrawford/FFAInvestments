import { useDashboard, useCurrentMemberAccount, useUnitPriceHistory } from './lib/queries'

export default function DebugDataProbe() {
  const dashboard = useDashboard()
  const currentMember = useCurrentMemberAccount()
  const unitPriceHistory = useUnitPriceHistory()

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h2>Dashboard</h2>
      {dashboard.isLoading && <pre>Loading...</pre>}
      {dashboard.error && <pre>Error: {dashboard.error.message}</pre>}
      {dashboard.data && (
        <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4 }}>
          {JSON.stringify(dashboard.data, null, 2)}
        </pre>
      )}

      <hr style={{ margin: '30px 0' }} />

      <h2>Current Member Account</h2>
      {currentMember.isLoading && <pre>Loading...</pre>}
      {currentMember.error && <pre>Error: {currentMember.error.message}</pre>}
      {currentMember.data && (
        <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4 }}>
          {JSON.stringify(currentMember.data, null, 2)}
        </pre>
      )}

      <hr style={{ margin: '30px 0' }} />

      <h2>Unit Price History</h2>
      {unitPriceHistory.isLoading && <pre>Loading...</pre>}
      {unitPriceHistory.error && <pre>Error: {unitPriceHistory.error.message}</pre>}
      {unitPriceHistory.data && (
        <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4 }}>
          {JSON.stringify(unitPriceHistory.data, null, 2)}
        </pre>
      )}
    </div>
  )
}
