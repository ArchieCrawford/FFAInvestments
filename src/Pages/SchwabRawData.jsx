import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import schwabApi, { SchwabAPIError } from '../services/schwabApi'
import { format } from 'date-fns'

const SchwabRawData = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState('')
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [apiResponse, setApiResponse] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  
  const navigate = useNavigate()

  const predefinedEndpoints = [
    {
      label: 'Account List',
      value: '/trader/v1/accounts',
      description: 'Get all account numbers and basic info'
    },
    {
      label: 'Account Details (with positions)',
      value: '/trader/v1/accounts/{accountNumber}?fields=positions',
      description: 'Get detailed account info including positions'
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

  useEffect(() => {
    if (!schwabApi.isAuthenticated()) {
      navigate('/admin/schwab')
    }
    
    // Load history from localStorage
    const savedHistory = localStorage.getItem('schwab_api_history')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Failed to parse API history:', e)
      }
    }
  }, [navigate])

  const handleApiCall = async () => {
    const endpoint = selectedEndpoint || customEndpoint
    if (!endpoint.trim()) {
      setError('Please select or enter an API endpoint')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      
      const response = await schwabApi.getRawApiData(endpoint)
      setApiResponse(response)
      
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
              disabled={isLoading || (!selectedEndpoint && !customEndpoint.trim())}
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