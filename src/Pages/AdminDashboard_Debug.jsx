import { useDashboard } from '../lib/queries'

export default function AdminDashboard_Debug() {
  const { data, error, isLoading } = useDashboard()
  
  if (isLoading) return <pre>Loading...</pre>
  if (error) return <pre>Error: {error.message}</pre>
  
  return (
    <pre style={{ padding: 20, fontFamily: 'monospace' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
