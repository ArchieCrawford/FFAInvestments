import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import schwabApi from '../services/schwabApi'
import { Page } from '../components/Page'

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
          setError('Missing authorization code in callback URL')
        }
        return
      }

      try {
        await schwabApi.exchangeCodeForTokens(code, state)
        if (!mounted) return
        setStatus('success')
        navigate('/admin/schwab', { replace: true })
      } catch (err) {
        if (!mounted) return
        setStatus('error')

        const payload = err?.response || err?.data || err?.details || {}
        let msg =
          payload?.details?.error_description ||
          payload?.details?.error ||
          payload?.error_description ||
          payload?.error ||
          err?.message ||
          'Backend token exchange failed'

        setError(msg)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [navigate])

  return (
    <Page title="Schwab OAuth Callback" subtitle="Completing secure login with Charles Schwab">
      {status === 'processing' && (
        <div className="card">
          <div className="card-content">
            <p>Completing Schwab login…</p>
          </div>
        </div>
      )}
      {status === 'success' && (
        <div className="card">
          <div className="card-content">
            <p>Success. Redirecting…</p>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="card">
          <div className="card-content">
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
              <strong>Schwab connection failed.</strong>
              <div>{error}</div>
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}