import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import schwabApi, { SchwabAPIError } from '../services/schwabApi'

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
  const [connectionStatus, setConnectionStatus] = useState('checking')
  
  const navigate = useNavigate()

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      setIsLoading(true)
      const authenticated = schwabApi.isAuthenticated()
      setIsAuthenticated(authenticated)
      
      if (authenticated) {
        await loadAccounts()
      }
      
      setConnectionStatus('checked')
    } catch (error) {
      console.error('Failed to check Schwab connection:', error)
      setError('Failed to check connection status')
      setIsAuthenticated(false)
      setConnectionStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAccounts = async () => {
    try {
      const accountData = await schwabApi.getAccounts()
      setAccounts(Array.isArray(accountData) ? accountData : [])
    } catch (error) {
      console.error('Failed to load accounts:', error)
      setError('Failed to load account information')
      setIsAuthenticated(false)
    }
  }

  const handleConnect = () => {
    try {
      const authUrl = schwabApi.getAuthorizationUrl()
      window.location.href = authUrl
    } catch (error) {
      console.error('Failed to generate auth URL:', error)
      setError('Failed to initiate connection')
    }
  }

  const handleDisconnect = () => {
    schwabApi.logout()
    setIsAuthenticated(false)
    setAccounts([])
    setError('')
  }

  return (
    <div className="app-page">
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
                {accounts.map((account, index) => (
                  <div key={index} className="app-card">
                    <div className="app-card-content">
                      <h6 className="app-heading-md">{account.type || 'Investment Account'}</h6>
                      <p>
                        <strong>Account ID:</strong> {account.accountId || 'N/A'}<br />
                        <strong>Status:</strong> {account.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Navigation */}
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
                    <button 
                      className="app-btn app-btn-success"
                      onClick={() => navigate('/admin/schwab/insights')}
                    >
                      <i className="fas fa-chart-line" style={{ marginRight: '0.5rem' }}></i>
                      View Insights
                    </button>
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
              
              <div className="app-alert">
                <h6><i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>What you'll get:</h6>
                <ul className="mb-0">
                  <li>Real-time account balances and positions</li>
                  <li>Portfolio analytics and performance metrics</li>
                  <li>Export account data to Excel</li>
                  <li>Debug and test API endpoints</li>
                </ul>
              </div>

              <div className="app-alert">
                <h6><i className="fas fa-shield-alt" style={{ marginRight: '0.5rem' }}></i>Security:</h6>
                <ul className="mb-0">
                  <li>Uses secure OAuth 2.0 authentication</li>
                  <li>No passwords stored in this application</li>
                  <li>Read-only access to your Schwab data</li>
                  <li>You can disconnect at any time</li>
                </ul>
              </div>

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
  )
}

export default AdminSchwab
