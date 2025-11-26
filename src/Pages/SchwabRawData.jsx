import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import schwabApi, { SchwabAPIError } from '../services/schwabApi'
import { format } from 'date-fns'
import { useCurrentMember } from '@/lib/authHooks'

const SchwabRawData = () => {
  const { member, loading: memberLoading } = useCurrentMember();
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState('')
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [apiResponse, setApiResponse] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [accountList, setAccountList] = useState([])
  const [selectedAccountNumber, setSelectedAccountNumber] = useState('')
  
  const navigate = useNavigate()

  const predefinedEndpoints = [
    {
      label: 'Account List',
      value: '/trader/v1/accounts',
      description: 'Get all account numbers and basic info'
    },
    {
      label: 'All Accounts with Positions',
      value: '/trader/v1/accounts?fields=positions',
      description: 'Get all accounts with detailed positions (RECOMMENDED)'
    },
    {
      label: 'Account Details (with positions) - Legacy',
      value: '/trader/v1/accounts/{accountNumber}?fields=positions',
      description: '⚠️ May return 400 error - use "All Accounts with Positions" instead'
    },
    {
      label: 'Market Hours',
      value: '/marketdata/v1/markets?markets=equity,option,bond,forex',
      description: 'Get market hours for different markets'
    },
    {
      label: 'Quote (AAPL)',
      value: '/marketdata/v1/quotes?symbols=AAPL',
      description: 'Get real-time quote for Apple stock'
    },
    {
      label: 'Option Chain (SPY)',
      value: '/marketdata/v1/chains?symbol=SPY&contractType=ALL&includeQuotes=true',
      description: 'Get option chain for SPY'
    },
    {
      label: 'Price History (MSFT)',
      value: '/marketdata/v1/pricehistory?symbol=MSFT&periodType=month&period=1&frequencyType=daily',
      description: 'Get 1-month daily price history for Microsoft'
    }
  ]

  // Protected route - redirect to login if not authenticated
  useEffect(() => {
    if (!memberLoading && !member) {
      navigate('/login', { replace: true });
    }
  }, [memberLoading, member, navigate]);

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('schwab_api_history')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Failed to parse API history:', e)
      }
    }
  }, [])

  const handleApiCall = async () => {
    let endpoint = selectedEndpoint || customEndpoint
    if (!endpoint.trim()) {
      setError('Please select or enter an API endpoint')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      // If endpoint contains {accountNumber}, replace with account_hash for Trader API
      if (endpoint.includes('{accountNumber}')) {
        let acctNum = selectedAccountNumber
        let acctHash = ''
        
        // If no account selected yet, try to load from accountList or fetch accounts
        if (!acctNum) {
          if (accountList.length > 0) {
            acctNum = accountList[0].accountNumber
            acctHash = accountList[0].accountHash
            setSelectedAccountNumber(acctNum)
          } else {
            // Fetch accounts if not loaded
            console.log('🔍 [SchwabRawData] No account number available, fetching accounts...')
            const accountsResp = await schwabApi.getRawApiData('/trader/v1/accounts')
            const accounts = extractAccountList(accountsResp.data)
            setAccountList(accounts)
            acctNum = accounts.length > 0 ? accounts[0].accountNumber : ''
            acctHash = accounts.length > 0 ? accounts[0].accountHash : ''
            if (acctNum) {
              setSelectedAccountNumber(acctNum)
            }
          }
        } else {
          // Find the account hash for the selected account number
          const selectedAccount = accountList.find(a => a.accountNumber === acctNum)
          acctHash = selectedAccount?.accountHash || ''
        }
        
        if (!acctNum) {
          setError('No account number available. Please fetch Account List first.')
          setIsLoading(false)
          return
        }
        
        // Use account_hash for Trader API endpoints (it's what Schwab expects)
        const traderAccountId = acctHash || acctNum
        endpoint = endpoint.replace('{accountNumber}', encodeURIComponent(traderAccountId))
        console.log(`📞 [SchwabRawData] Calling endpoint with Trader account ID`)
        console.log(`📞 [SchwabRawData]   - Display account_number: ${acctNum}`)
        console.log(`📞 [SchwabRawData]   - Trader account_hash: ${acctHash}`)
        console.log(`📞 [SchwabRawData]   - Using in URL: ${traderAccountId}`)
        console.log(`📞 [SchwabRawData] Final endpoint:`, endpoint)
      } else {
        console.log(`📞 [SchwabRawData] Calling endpoint:`, endpoint)
      }

      const response = await schwabApi.getRawApiData(endpoint)
      console.log('✅ [SchwabRawData] API response received:', {
        status: response.status,
        endpoint: response.endpoint,
        dataSize: JSON.stringify(response.data).length
      })
      setApiResponse(response)

      // If Account List endpoint, extract and save account numbers
      if (endpoint.includes('/trader/v1/accounts') && !endpoint.includes('?fields=positions')) {
        const accounts = extractAccountList(response.data)
        console.log(`📋 [SchwabRawData] Extracted ${accounts.length} accounts`)
        setAccountList(accounts)
        // Auto-select first account if none selected
        if (accounts.length > 0 && !selectedAccountNumber) {
          setSelectedAccountNumber(accounts[0].accountNumber)
          console.log(`🎯 [SchwabRawData] Auto-selected account: ${accounts[0].accountNumber}`)
        }
      }

      // Add to history
      const newHistoryItem = {
        id: Date.now(),
        endpoint,
        timestamp: response.timestamp,
        status: response.status,
        success: true
      }

      const updatedHistory = [newHistoryItem, ...history.slice(0, 9)] // Keep last 10
      setHistory(updatedHistory)
      localStorage.setItem('schwab_api_history', JSON.stringify(updatedHistory))

    } catch (error) {
      console.error('❌ API call failed:', error)
      setError(error.message || 'API call failed')

      // Add failed call to history
      const newHistoryItem = {
        id: Date.now(),
        endpoint,
        timestamp: new Date().toISOString(),
        status: error.status || 'Error',
        success: false,
        error: error.message
      }

      const updatedHistory = [newHistoryItem, ...history.slice(0, 9)]
      setHistory(updatedHistory)
      localStorage.setItem('schwab_api_history', JSON.stringify(updatedHistory))

    } finally {
      setIsLoading(false)
    }
  }

  const downloadResponse = () => {
    if (!apiResponse) return
    
    const dataStr = JSON.stringify(apiResponse, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `schwab-api-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Helper to extract account list from Schwab API response
  const extractAccountList = (data) => {
    if (!data) return [];
    // Schwab returns array directly or {accounts: [...]}
    const accountsArray = Array.isArray(data) ? data : data.accounts;
    if (!Array.isArray(accountsArray)) return [];
    
    return accountsArray.map(acc => {
      const sa = acc.securitiesAccount || {};
      return {
        accountNumber: sa.accountNumber || acc.accountNumber || acc.accountId || '',
        accountHash: acc.hashValue || '',
        accountType: sa.accountType || acc.accountType || '',
        accountId: acc.accountId || '',
        displayName: sa.displayName || sa.accountName || '',
        status: sa.status || '',
        raw: acc
      };
    });
  }

  const formatJson = (obj) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch (e) {
      return String(obj)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const rerunFromHistory = (historyItem) => {
    if (predefinedEndpoints.find(ep => ep.value === historyItem.endpoint)) {
      setSelectedEndpoint(historyItem.endpoint)
      setCustomEndpoint('')
    } else {
      setSelectedEndpoint('')
      setCustomEndpoint(historyItem.endpoint)
    }
    
    // Auto-run the API call
    setTimeout(() => handleApiCall(), 100)
  }

  // Protected route checks
  if (memberLoading) {
    return <div className="app-card">Loading...</div>;
  }

  if (!member) {
    return null;
  }

  return (
  <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schwab Raw API Data</h1>
              <p className="text-gray-600 mt-2">
                Test Schwab API endpoints and view raw responses for debugging
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/schwab')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back to Schwab
            </button>
          </div>
        </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - API Call Interface */}
          <div className="lg:col-span-1 space-y-6">
            {/* Account Selector */}
            {accountList.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Account</h3>
                <select
                  value={selectedAccountNumber}
                  onChange={(e) => {
                    setSelectedAccountNumber(e.target.value)
                    console.log('🎯 [SchwabRawData] Account selected:', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {accountList.map((acc) => (
                    <option key={acc.accountNumber} value={acc.accountNumber}>
                      {acc.accountNumber} - {acc.accountType} {acc.displayName ? `(${acc.displayName})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  This account will be used for endpoints with {'{accountNumber}'}
                </p>
              </div>
            )}
            
            {/* Account List Export Section */}
            {accountList.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account List</h3>
                <div className="mb-2 text-xs text-gray-600">{accountList.length} account(s) loaded</div>
                <div className="flex gap-2 mb-2">
                  <button
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    onClick={() => {
                      const dataStr = JSON.stringify(accountList, null, 2);
                      const blob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `schwab-accounts-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                  >💾 Export JSON</button>
                  <button
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    onClick={() => {
                      // Convert to CSV
                      const header = ['accountNumber','accountType','accountId','displayName','status'];
                      const rows = accountList.map(acc => header.map(h => `"${(acc[h]||'').toString().replace(/"/g,'""')}"`).join(','));
                      const csv = [header.join(','), ...rows].join('\r\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `schwab-accounts-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                  >📤 Export CSV</button>
                </div>
                <div className="overflow-x-auto text-xs">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Account #</th>
                        <th>Type</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountList.map((acc, idx) => (
                        <tr key={idx}>
                          <td>{acc.accountNumber}</td>
                          <td>{acc.accountType}</td>
                          <td>{acc.accountId}</td>
                          <td>{acc.displayName}</td>
                          <td>{acc.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Predefined Endpoints */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Predefined Endpoints</h3>
              <div className="space-y-2">
                {predefinedEndpoints.map((endpoint) => (
                  <label key={endpoint.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="endpoint"
                      value={endpoint.value}
                      checked={selectedEndpoint === endpoint.value}
                      onChange={(e) => {
                        setSelectedEndpoint(e.target.value)
                        setCustomEndpoint('')
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{endpoint.label}</div>
                      <div className="text-xs text-gray-500">{endpoint.description}</div>
                      <div className="text-xs text-blue-600 font-mono">{endpoint.value}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Endpoint */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Endpoint</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Endpoint Path
                  </label>
                  <input
                    type="text"
                    value={customEndpoint}
                    onChange={(e) => {
                      setCustomEndpoint(e.target.value)
                      setSelectedEndpoint('')
                    }}
                    placeholder="/trader/v1/accounts or /marketdata/v1/quotes?symbols=AAPL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  <p>• Use full path including query parameters</p>
                  <p>• {"{accountNumber}"} will be replaced with your first account</p>
                  <p>• Base URL (api.schwab.com) is automatically added</p>
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleApiCall}
              disabled={
                isLoading || 
                (!selectedEndpoint && !customEndpoint.trim()) ||
                ((selectedEndpoint || customEndpoint).includes('{accountNumber}') && !selectedAccountNumber && accountList.length === 0)
              }
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">🔄</span>
                  Calling API...
                </>
              ) : (
                'Execute API Call'
              )}
            </button>
            
            {/* Warning when account number needed but not available */}
            {((selectedEndpoint || customEndpoint).includes('{accountNumber}') && !selectedAccountNumber && accountList.length === 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                ⚠️ Please fetch Account List first to get account numbers
              </div>
            )}

          </div>

          {/* Right Panel - Response and History */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <div>
                    <h4 className="text-red-800 font-semibold">API Error</h4>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* API Response */}
            {apiResponse && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">API Response</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(formatJson(apiResponse))}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={downloadResponse}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      💾 Download
                    </button>
                  </div>
                </div>
                
                {/* Response Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600">Endpoint</p>
                    <p className="text-sm font-mono text-gray-900 break-all">{apiResponse.endpoint}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Status</p>
                    <p className="text-sm font-semibold text-green-600">{apiResponse.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Timestamp</p>
                    <p className="text-sm text-gray-900">
                      {format(new Date(apiResponse.timestamp), 'HH:mm:ss')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Size</p>
                    <p className="text-sm text-gray-900">
                      {(JSON.stringify(apiResponse.data).length / 1024).toFixed(1)}KB
                    </p>
                  </div>
                </div>

                {/* Response Data */}
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto max-h-96">
                    {formatJson(apiResponse.data)}
                  </pre>
                </div>
              </div>
            )}

            {/* Call History */}
            {history.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent API Calls</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg ${item.success ? '✅' : '❌'}`}></span>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.endpoint}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{format(new Date(item.timestamp), 'MMM dd, HH:mm:ss')}</span>
                          <span className={item.success ? 'text-green-600' : 'text-red-600'}>
                            {item.status}
                          </span>
                        </div>
                        {!item.success && item.error && (
                          <p className="text-xs text-red-600 mt-1 truncate">{item.error}</p>
                        )}
                      </div>
                      <button
                        onClick={() => rerunFromHistory(item)}
                        className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Re-run
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Data State */}
            {!apiResponse && !isLoading && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No API Response</h3>
                <p className="text-gray-600">
                  Select an endpoint and click "Execute API Call" to see the raw response data.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}

export default SchwabRawData