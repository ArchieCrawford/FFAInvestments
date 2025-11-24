import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import schwabApi, { SchwabAPIError } from '../services/schwabApi'
import AppLayout from '../components/AppLayout'
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
      const status = schwabApi.getAuthStatus?.() || { authenticated: false }
      console.log('AdminSchwab: auth status snapshot:', status)
      const authed = status.authenticated
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
        id: a.accountId ?? a.account_id ?? a.accountNumber ?? a.account_number ?? a.hashValue ?? a.id ?? 'unknown',
        type: a.type ?? a.accountType ?? 'Investment Account',
        isActive: a.isActive ?? a.active ?? true,
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
      const authUrl = await Promise.resolve(schwabApi.getAuthorizationUrl())
      console.log('Redirecting to Schwab auth URL:', authUrl)
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
    <AppLayout>
      <div className="app-page">
      {/* Optional debug panel (?debug=1) */}
      {(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('debug') === '1') {
          const tokenRaw = localStorage.getItem('schwab_tokens') || ''
          const status = schwabApi.getAuthStatus?.()
          return (
            <div className="app-card app-mb-lg" style={{ border: '1px dashed var(--app-border-muted)' }}>
              <div className="app-card-header">
                <h6 className="app-card-title" style={{ display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-bug" style={{ marginRight: '0.5rem' }}></i>
                  Schwab Debug Panel
                </h6>
              </div>
              <div className="app-card-content" style={{ fontSize: '0.75rem' }}>
                <div><strong>Auth Status:</strong> {status ? JSON.stringify(status) : 'n/a'}</div>
                <div style={{ marginTop: '0.5rem' }}><strong>Token (truncated):</strong> {tokenRaw.slice(0, 160)}{tokenRaw.length > 160 ? '…' : ''}</div>
                <div style={{ marginTop: '0.5rem' }}><strong>Accounts loaded:</strong> {accounts.length}</div>
                <div style={{ marginTop: '0.5rem' }}><strong>Error:</strong> {error || 'none'}</div>
                <p style={{ marginTop: '0.5rem' }}>Remove <code>?debug=1</code> from URL to hide.</p>
              </div>
            </div>
          )
        }
        return null
      })()}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2>
          <i className="fas fa-university" style={{ marginRight: '0.5rem' }}></i>
          Charles Schwab Integration
        </h2>
        
        {isAuthenticated && (
          <button 
            className="app-btn app-btn-outline app-btn-danger"
            onClick={handleDisconnect}
          >
            <i className="fas fa-unlink" style={{ marginRight: '0.5rem' }}></i>
            Disconnect
          </button>
        )}
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <div className={`app-alert ${isAuthenticated ? 'app-alert-success' : ''}`}>
          <i className={`fas ${isAuthenticated ? 'fa-check-circle' : 'fa-info-circle'}`} style={{ marginRight: '0.75rem' }}></i>
          <div>
            <strong>Status:</strong> {isAuthenticated ? 'Connected to Charles Schwab' : 'Not connected to Charles Schwab'}
            {isAuthenticated && accounts.length > 0 && (
              <div className="mt-1">
                <small>Found {accounts.length} account{accounts.length !== 1 ? 's' : ''}</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <div className="app-alert app-alert-destructive">
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
        </div>
      )}

      {/* Account Information */}
        {isAuthenticated && accounts.length > 0 && (
        <div className="mb-4">
          <div className="app-card">
            <div className="app-card-header">
              <h5 className="app-card-title">
                <i className="fas fa-wallet" style={{ marginRight: '0.5rem' }}></i>
                Connected Accounts
              </h5>
            </div>
            <div className="app-card-content">
              <div className="grid gap-3 md:grid-cols-2">
                {accounts.map(acc => (
                  <div key={acc.id} className="app-card">
                    <div className="app-card-content">
                      <h6 className="app-heading-md">{acc.type}</h6>
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
          <div className="app-card">
            <div className="app-card-header">
              <h5 className="app-card-title">
                <i className="fas fa-tools" style={{ marginRight: '0.5rem' }}></i>
                Charles Schwab Features
              </h5>
            </div>
            <div className="app-card-content">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="app-card h-100">
                  <div className="app-card-content text-center">
                    <i className="fas fa-chart-pie fa-3x mb-3"></i>
                    <h5 className="app-heading-md">Account Insights</h5>
                    <p>View portfolio analytics, performance metrics, and export data to Excel.</p>
                    <div style={{ marginTop: 24 }}>
                      <SchwabInsights />
                    </div>
                  </div>
                </div>
                <div className="app-card h-100">
                  <div className="app-card-content text-center">
                    <i className="fas fa-code fa-3x mb-3"></i>
                    <h5 className="app-heading-md">Raw Data Viewer</h5>
                    <p>Debug API calls, test endpoints, and view raw response data.</p>
                    <button 
                      className="app-btn app-btn-outline"
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
        <div className="app-card">
          <div className="app-card-header">
            <h5 className="app-card-title">
              <i className="fas fa-link" style={{ marginRight: '0.5rem' }}></i>
              Connect to Charles Schwab
            </h5>
          </div>
          <div className="app-card-content">
            <div className="text-center">
              <i className="fas fa-university fa-4x mb-4"></i>
              <h4>Connect Your Charles Schwab Account</h4>
              <p className="lead mb-4">
                Securely connect to Charles Schwab to access account data, portfolio insights, and trading information.
              </p>
              
              <button 
                className="app-btn app-btn-primary app-btn-lg"
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
              
              <p className="app-text-muted mt-3">
                <small>You'll be redirected to Charles Schwab for secure authentication</small>
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  )
}

export default AdminSchwab
