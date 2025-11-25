import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import schwabApi from '../services/schwabApi'

export default function SchwabCallback() {
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    const run = async () => {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')

      if (!code) {
        if (mounted) {
          setStatus('error')
          setError('Missing authorization code in URL')
        }
        return
      }

      try {
        await schwabApi.exchangeCodeForTokens(code, state)
        if (mounted) {
          setStatus('success')
          navigate('/admin/schwab', { replace: true })
        }
      } catch (err) {
        let msg = err?.response?.error_description ||
                  err?.details?.error_description ||
                  err?.details ||
                  err?.message ||
                  'Unknown backend error'

        if (mounted) {
          setStatus('error')
          setError(msg)
        }
      }
    }

    run()
    return () => { mounted = false }
  }, [navigate])

  return (
    <div className="app-page">
      {status === 'processing' && <p>Completing Schwab login…</p>}
      {status === 'success' && <p>Success. Redirecting…</p>}
      {status === 'error' && (
        <div className="app-alert app-alert-destructive">
          <h3>Schwab Login Failed</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}