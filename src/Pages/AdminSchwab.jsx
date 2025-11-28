import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import schwabApi, { SchwabAPIError } from '../services/schwabApi'
import { Page } from '../components/Page'
import SchwabInsights from './SchwabInsights'

/**
 * Charles Schwab Admin Integration Page
 * 
 * This page is only accessible to admin users and provides:
 * - OAuth connection to Charles Schwab
 * - Account overview and management
 * - Navigation to insights and raw data features
 */
const AdminSchwab = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [accounts, setAccounts] = useState([])
  const mounted = useRef(true)
  
  const navigate = useNavigate()
  const showDebug = new URLSearchParams(window.location.search).get('debug') === '1'

  useEffect(() => {
    mounted.current = true
    ;(async () => {
      await checkConnection()
    })()
    return () => {
      mounted.current = false
    }
  }, [])

  const checkConnection = async () => {
    try {
      setIsLoading(true)
      setError('')
      const raw = localStorage.getItem('schwab_tokens')
      console.log('AdminSchwab: stored schwab_tokens:', raw)
      const status = schwabApi.getAuthStatus?.()
      console.log('AdminSchwab: auth status snapshot:', status)
      const authed = status?.authenticated || !!raw
      if (!mounted.current) return
      setIsAuthenticated(authed)
      if (authed) {
        await loadAccounts()
      }
    } catch (e) {
      console.error('checkConnection failed:', e)
      if (!mounted.current) return
      setError('Failed to check Schwab connection.')
      setIsAuthenticated(false)
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }

  const loadAccounts = async () => {
    try {
      console.log('AdminSchwab: loading accounts…')
      const res = await schwabApi.getAccounts()
      const list = Array.isArray(res) ? res : Array.isArray(res?.accounts) ? res.accounts : []
      const normalized = list.map(a => ({
        id: a.securitiesAccount?.accountNumber ?? a.accountNumber ?? a.accountId ?? a.account_id ?? a.account_number ?? a.hashValue ?? a.id ?? 'unknown',
        type: a.securitiesAccount?.type ?? a.type ?? a.accountType ?? 'Investment Account',
        isActive: a.securitiesAccount?.isActive ?? a.isActive ?? a.active ?? true,
        raw: a
      }))
      if (!mounted.current) return
      setAccounts(normalized)
      console.log('AdminSchwab: loaded accounts:', normalized.length)
    } catch (e) {
      console.error('loadAccounts failed:', e)
      if (e instanceof SchwabAPIError) {
        if (e.status === 401 || e.code === 'invalid_grant' || e.code === 'token_expired') {
          if (mounted.current) {
            setError('Your Schwab session expired. Please reconnect.')
            setIsAuthenticated(false)
            setAccounts([])
          }
          return
        }
        if (mounted.current) {
          setError(`Schwab API error: ${e.message || 'Unable to load accounts.'}`)
        }
      } else {
        if (mounted.current) {
          setError('Failed to load account information.')
        }
      }
    }
  }

  const handleConnect = async () => {
    try {
      setError('')
      setIsLoading(true)
      const authUrl = await schwabApi.getAuthorizationUrl()
      console.log('Redirecting to Schwab auth URL (backend provided):', authUrl)
      window.location.href = authUrl
    } catch (e) {
      console.error('getAuthorizationUrl failed:', e)
      setError('Failed to initiate Schwab connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    try {
      schwabApi.logout?.()
    } catch (e) {
      console.warn('logout warning:', e)
    }
    setIsAuthenticated(false)
    setAccounts([])
    setError('')
  }

  return (
    <Page
      title="Charles Schwab Integration"
      subtitle={isAuthenticated ? `Connected${accounts.length ? ` • ${accounts.length} account${accounts.length !== 1 ? 's' : ''}` : ''}` : 'Not connected'}
      actions={isAuthenticated ? (
        <button 
          className="btn-primary-soft border border-red-500 text-red-500"
          onClick={handleDisconnect}
        >
          <i className="fas fa-unlink" style={{ marginRight: '0.5rem' }}></i>
          Disconnect
        </button>
      ) : null}
    >
      {/* Optional debug panel (?debug=1) */}
      {showDebug && (
        <div className="card mb-8" style={{ border: '1px dashed var(--app-border-muted)' }}>
          <div className="card-header">
            <h6 className="text-lg font-semibold text-default" style={{ display: 'flex', alignItems: 'center' }}>
              <i className="fas fa-bug" style={{ marginRight: '0.5rem' }}></i>
              Schwab Debug Panel
            </h6>
          </div>
          <div className="card-content" style={{ fontSize: '0.75rem' }}>
            <div><strong>Auth Status:</strong> {schwabApi.getAuthStatus ? JSON.stringify(schwabApi.getAuthStatus()) : 'n/a'}</div>
            <div style={{ marginTop: '0.5rem' }}><strong>Token (truncated):</strong> {(localStorage.getItem('schwab_tokens') || '').slice(0, 160)}{(localStorage.getItem('schwab_tokens') || '').length > 160 ? '…' : ''}</div>
            <div style={{ marginTop: '0.5rem' }}><strong>Accounts loaded:</strong> {accounts.length}</div>
            <div style={{ marginTop: '0.5rem' }}><strong>Error:</strong> {error || 'none'}</div>
            <p style={{ marginTop: '0.5rem' }}>Remove <code>?debug=1</code> from URL to hide.</p>
          </div>
        </div>
      )}
      

      {/* Connection Status */}
      <div className="mb-4">
        {isAuthenticated ? (
          <div className="bg-green-500/10 border border-green-500 text-green-600 px-4 py-3 rounded-lg">
            <i className="fas fa-check-circle" style={{ marginRight: '0.75rem' }}></i>
            <strong>Status:</strong> Connected to Charles Schwab
            {accounts.length > 0 && (
              <div className="mt-1 text-sm">Found {accounts.length} account{accounts.length !== 1 ? 's' : ''}</div>
            )}
          </div>
        ) : (
          <div className="bg-primary-soft border border-border text-default px-4 py-3 rounded-lg">
            <i className="fas fa-info-circle" style={{ marginRight: '0.75rem' }}></i>
            <strong>Status:</strong> Not connected to Charles Schwab
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
        </div>
      )}

      {/* Account Information */}
        {isAuthenticated && accounts.length > 0 && (
        <div className="mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="text-lg font-semibold text-default">
                <i className="fas fa-wallet" style={{ marginRight: '0.5rem' }}></i>
                Connected Accounts
              </h5>
            </div>
            <div className="card-content">
              <div className="grid gap-3 md:grid-cols-2">
                {accounts.map(acc => (
                  <div key={acc.id} className="card">
                    <div className="card-content">
                      <h6 className="text-xl font-semibold text-default">{acc.type}</h6>
                      <p>
                        <strong>Account ID:</strong> {acc.id}<br />
                        <strong>Status:</strong> {acc.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Navigation + Insights */}
      {isAuthenticated && (
        <div className="mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="text-lg font-semibold text-default">
                <i className="fas fa-tools" style={{ marginRight: '0.5rem' }}></i>
                Charles Schwab Features
              </h5>
            </div>
            <div className="card-content">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="card h-100">
                  <div className="card-content text-center">
                    <i className="fas fa-chart-pie fa-3x mb-3"></i>
                    <h5 className="text-xl font-semibold text-default">Account Insights</h5>
                    <p>View portfolio analytics, performance metrics, and export data to Excel.</p>
                    <div style={{ marginTop: 24 }}>
                      <SchwabInsights />
                    </div>
                  </div>
                </div>
                <div className="card h-100">
                  <div className="card-content text-center">
                    <i className="fas fa-code fa-3x mb-3"></i>
                    <h5 className="text-xl font-semibold text-default">Raw Data Viewer</h5>
                    <p>Debug API calls, test endpoints, and view raw response data.</p>
                    <button 
                      className="btn-primary-soft border border-border"
                      onClick={() => navigate('/admin/schwab/raw-data')}
                    >
                      <i className="fas fa-database" style={{ marginRight: '0.5rem' }}></i>
                      View Raw Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Setup */}
      {!isAuthenticated && (
        <div className="card">
          <div className="card-header">
            <h5 className="text-lg font-semibold text-default">
              <i className="fas fa-link" style={{ marginRight: '0.5rem' }}></i>
              Connect to Charles Schwab
            </h5>
          </div>
          <div className="card-content">
            <div className="text-center">
              <i className="fas fa-university fa-4x mb-4"></i>
              <h4>Connect Your Charles Schwab Account</h4>
              <p className="lead mb-4">
                Securely connect to Charles Schwab to access account data, portfolio insights, and trading information.
              </p>
              
              <button 
                className="btn-primary text-lg px-8 py-3"
                onClick={handleConnect}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner-inline" style={{ marginRight: '0.5rem' }} role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-external-link-alt" style={{ marginRight: '0.5rem' }}></i>
                    Connect to Charles Schwab
                  </>
                )}
              </button>
              
              <p className="text-muted mt-3">
                <small>You'll be redirected to Charles Schwab for secure authentication</small>
              </p>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export default AdminSchwab
