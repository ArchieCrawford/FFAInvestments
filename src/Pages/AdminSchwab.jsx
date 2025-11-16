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
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-university me-2 text-primary"></i>
          Charles Schwab Integration
        </h2>
        
        {isAuthenticated && (
          <button 
            className="btn btn-outline-danger"
            onClick={handleDisconnect}
          >
            <i className="fas fa-unlink me-2"></i>
            Disconnect
          </button>
        )}
      </div>

      {/* Connection Status */}
      <div className="row mb-4">
        <div className="col-12">
          <div className={`alert ${isAuthenticated ? 'alert-success' : 'alert-info'} d-flex align-items-center`}>
            <i className={`fas ${isAuthenticated ? 'fa-check-circle' : 'fa-info-circle'} me-3`}></i>
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
      </div>

      {error && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Account Information */}
      {isAuthenticated && accounts.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-wallet me-2"></i>
                  Connected Accounts
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {accounts.map((account, index) => (
                    <div key={index} className="col-md-6 mb-3">
                      <div className="card border-left-primary">
                        <div className="card-body">
                          <h6 className="card-title">{account.type || 'Investment Account'}</h6>
                          <p className="card-text">
                            <strong>Account ID:</strong> {account.accountId || 'N/A'}<br />
                            <strong>Status:</strong> {account.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Navigation */}
      {isAuthenticated && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-tools me-2"></i>
                  Charles Schwab Features
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="card h-100 border-left-success">
                      <div className="card-body text-center">
                        <i className="fas fa-chart-pie fa-3x text-success mb-3"></i>
                        <h5 className="card-title">Account Insights</h5>
                        <p className="card-text">View portfolio analytics, performance metrics, and export data to Excel.</p>
                        <button 
                          className="btn btn-success"
                          onClick={() => navigate('/admin/schwab/insights')}
                        >
                          <i className="fas fa-chart-line me-2"></i>
                          View Insights
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="card h-100 border-left-info">
                      <div className="card-body text-center">
                        <i className="fas fa-code fa-3x text-info mb-3"></i>
                        <h5 className="card-title">Raw Data Viewer</h5>
                        <p className="card-text">Debug API calls, test endpoints, and view raw response data.</p>
                        <button 
                          className="btn btn-info"
                          onClick={() => navigate('/admin/schwab/raw-data')}
                        >
                          <i className="fas fa-database me-2"></i>
                          View Raw Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Setup */}
      {!isAuthenticated && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-link me-2"></i>
                  Connect to Charles Schwab
                </h5>
              </div>
              <div className="card-body">
                <div className="text-center">
                  <i className="fas fa-university fa-4x text-primary mb-4"></i>
                  <h4>Connect Your Charles Schwab Account</h4>
                  <p className="lead mb-4">
                    Securely connect to Charles Schwab to access account data, portfolio insights, and trading information.
                  </p>
                  
                  <div className="alert alert-info text-start mb-4">
                    <h6><i className="fas fa-info-circle me-2"></i>What you'll get:</h6>
                    <ul className="mb-0">
                      <li>Real-time account balances and positions</li>
                      <li>Portfolio analytics and performance metrics</li>
                      <li>Export account data to Excel</li>
                      <li>Debug and test API endpoints</li>
                    </ul>
                  </div>

                  <div className="alert alert-warning text-start mb-4">
                    <h6><i className="fas fa-shield-alt me-2"></i>Security:</h6>
                    <ul className="mb-0">
                      <li>Uses secure OAuth 2.0 authentication</li>
                      <li>No passwords stored in this application</li>
                      <li>Read-only access to your Schwab data</li>
                      <li>You can disconnect at any time</li>
                    </ul>
                  </div>

                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={handleConnect}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-external-link-alt me-2"></i>
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
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSchwab