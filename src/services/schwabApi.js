/**
 * Charles Schwab API Integration Service
 * 
 * This service handles:
 * - OAuth 2.0 authentication flow
 * - Account data retrieval
 * - Market data access
 * - Trading API calls
 * - Error handling and rate limiting
 * - Token management and refresh
 */

import axios from 'axios'

class SchwabAPIError extends Error {
  constructor(message, status = null, response = null) {
    super(message)
    this.name = 'SchwabAPIError'
    this.status = status
    this.response = response
  }
}

class SchwabApiService {
  constructor() {
    this.baseURL = 'https://api.schwab.com'
    this.tokenURL = 'https://api.schwab.com/v1/oauth/token'
    this.authURL = 'https://api.schwab.com/v1/oauth/authorize'
    
    // Rate limiting
    this.lastRequestTime = 0
    this.rateLimit = 500 // 500ms between requests (120 calls/minute)
    
    // Configuration from environment variables (updated for Vite)
    this.clientId = import.meta.env.VITE_SCHWAB_CLIENT_ID?.replace(/['"]/g, '') || import.meta.env.REACT_APP_SCHWAB_CLIENT_ID?.replace(/['"]/g, '')
    this.clientSecret = import.meta.env.VITE_SCHWAB_CLIENT_SECRET?.replace(/['"]/g, '') || import.meta.env.REACT_APP_SCHWAB_CLIENT_SECRET?.replace(/['"]/g, '')
    this.redirectUri = import.meta.env.VITE_SCHWAB_REDIRECT_URI || import.meta.env.REACT_APP_SCHWAB_REDIRECT_URI || 'https://localhost:3001/admin/schwab/callback'
    
    // Token storage keys
    this.tokenStorageKey = 'schwab_tokens'
    this.stateStorageKey = 'schwab_oauth_state'
    
    // Enhanced state management for security
    this.stateCache = new Map()
    this.stateCacheTTL = 600000 // 10 minutes
    
    console.log('🔧 SchwabApiService initialized:', {
      clientId: this.clientId ? '✅ Set' : '❌ Missing',
      redirectUri: this.redirectUri,
      rawClientId: this.clientId,
      envViteClient: import.meta.env.VITE_SCHWAB_CLIENT_ID,
      envReactClient: import.meta.env.REACT_APP_SCHWAB_CLIENT_ID
    })

    if (!this.clientId) {
      console.warn('⚠️ Schwab clientId missing. OAuth will fail until VITE_SCHWAB_CLIENT_ID is set.')
    }
    if (this.clientSecret) {
      console.warn('🔐 Schwab clientSecret is present in frontend env. For production, move secret exchange server-side.')
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl() {
    const state = this._generateState()
    localStorage.setItem(this.stateStorageKey, state)
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'readonly',
      state: state
    })
    
    const authUrl = `${this.authURL}?${params.toString()}`
    console.log('🔑 Generated Schwab auth URL:', authUrl)
    return authUrl
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code, state, receivedState) {
    console.log('🔄 Handling Schwab OAuth callback')
    
    // Validate state parameter
    const storedState = localStorage.getItem(this.stateStorageKey)
    if (!storedState || storedState !== receivedState) {
      throw new SchwabAPIError('Invalid state parameter - possible CSRF attack')
    }
    
    try {
      const tokens = await this._exchangeCodeForTokens(code)
      this._storeTokens(tokens)
      localStorage.removeItem(this.stateStorageKey)
      
      console.log('✅ Schwab tokens obtained and stored')
      return tokens
    } catch (error) {
      console.error('❌ Token exchange failed:', error)
      throw new SchwabAPIError(`Token exchange failed: ${error.message}`)
    }
  }

  /**
   * Get account information
   */
  async getAccounts() {
    console.log('📊 Fetching Schwab accounts')
    await this._enforceRateLimit()
    
    try {
      const response = await this._makeAuthenticatedRequest('/trader/v1/accounts')
      // Some APIs return { accounts: [...] }
      const payload = response.data
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.accounts) ? payload.accounts : []
      console.log('✅ Accounts retrieved:', list.length, 'accounts')
      return list
    } catch (error) {
      const status = error.response?.status || error.status || null
      console.error('❌ Failed to fetch accounts:', { message: error.message, status })
      throw new SchwabAPIError(`Failed to fetch accounts: ${error.message}`, status, error.response)
    }
  }

  /**
   * Get detailed account information by account number
   */
  async getAccountDetails(accountNumber) {
    console.log('📋 Fetching account details for:', accountNumber)
    await this._enforceRateLimit()
    
    try {
      const response = await this._makeAuthenticatedRequest(
        `/trader/v1/accounts/${accountNumber}?fields=positions`
      )
      console.log('✅ Account details retrieved for:', accountNumber)
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch account details:', error)
      throw new SchwabAPIError(`Failed to fetch account details: ${error.message}`)
    }
  }

  /**
   * Get market data for symbols
   */
  async getQuotes(symbols) {
    console.log('📈 Fetching quotes for symbols:', symbols)
    await this._enforceRateLimit()
    
    const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols
    
    try {
      const response = await this._makeAuthenticatedRequest(
        `/marketdata/v1/quotes?symbols=${encodeURIComponent(symbolsParam)}`
      )
      console.log('✅ Quotes retrieved for:', symbols)
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch quotes:', error)
      throw new SchwabAPIError(`Failed to fetch quotes: ${error.message}`)
    }
  }

  /**
   * Get historical price data
   */
  async getPriceHistory(symbol, params = {}) {
    console.log('📊 Fetching price history for:', symbol)
    await this._enforceRateLimit()
    
    const queryParams = new URLSearchParams({
      symbol: symbol,
      periodType: params.periodType || 'year',
      period: params.period || '1',
      frequencyType: params.frequencyType || 'daily',
      frequency: params.frequency || '1',
      ...params
    })
    
    try {
      const response = await this._makeAuthenticatedRequest(
        `/marketdata/v1/pricehistory?${queryParams.toString()}`
      )
      console.log('✅ Price history retrieved for:', symbol)
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch price history:', error)
      throw new SchwabAPIError(`Failed to fetch price history: ${error.message}`)
    }
  }

  /**
   * Get account transactions
   */
  async getTransactions(accountNumber, params = {}) {
    console.log('💰 Fetching transactions for account:', accountNumber)
    await this._enforceRateLimit()
    
    const queryParams = new URLSearchParams({
      startDate: params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: params.endDate || new Date().toISOString().split('T')[0],
      ...params
    })
    
    try {
      const response = await this._makeAuthenticatedRequest(
        `/trader/v1/accounts/${accountNumber}/transactions?${queryParams.toString()}`
      )
      console.log('✅ Transactions retrieved for:', accountNumber)
      return response.data || []
    } catch (error) {
      console.error('❌ Failed to fetch transactions:', error)
      throw new SchwabAPIError(`Failed to fetch transactions: ${error.message}`)
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const tokens = this._getStoredTokens()
    if (!tokens || !tokens.access_token) {
      // If we have a refresh token we can attempt refresh lazily
      return false
    }
    
    // Check if token is expired
    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      console.log('🕐 Schwab access token expired')
      return false
    }
    
    return true
  }

  /**
   * Logout - clear stored tokens
   */
  logout() {
    console.log('🚪 Logging out of Schwab')
    localStorage.removeItem(this.tokenStorageKey)
    localStorage.removeItem(this.stateStorageKey)
  }

  /**
   * Exchange authorization code for tokens with state validation
   * Public method for OAuth callback handling
   */
  async exchangeCodeForTokens(code, state) {
    console.log('🔄 Exchanging code for tokens with state validation:', {
      code: code ? '✅ Present' : '❌ Missing',
      state: state ? `✅ ${state.substring(0, 8)}...` : '❌ Missing'
    })

    // Validate state parameter (CSRF protection)
    const storedState = localStorage.getItem(this.stateStorageKey)
    if (!storedState || storedState !== state) {
      throw new SchwabAPIError('Invalid OAuth state parameter - possible CSRF attempt', 400)
    }

    if (!code) {
      throw new SchwabAPIError('Authorization code is required', 400)
    }

    try {
      const tokens = await this._exchangeCodeForTokens(code)
      
      // Clear used state
      localStorage.removeItem(this.stateStorageKey)
      
      console.log('✅ Successfully exchanged code for tokens; storing tokens in localStorage')
      this._storeTokens(tokens)
      // Extra diagnostic: verify persistence
      const persisted = this._getStoredTokens()
      console.log('🔍 Token persistence check:', {
        stored: !!persisted,
        accessTokenPresent: !!persisted?.access_token,
        expiresAt: persisted?.expires_at,
        refreshTokenPresent: !!persisted?.refresh_token,
      })
      return tokens
    } catch (error) {
      console.error('❌ Failed to exchange code for tokens:', error)
      throw error
    }
  }

  /**
   * Get raw API response for debugging
   */
  async getRawApiData(endpoint) {
    console.log('🔧 Fetching raw API data from:', endpoint)
    await this._enforceRateLimit()
    
    try {
      const response = await this._makeAuthenticatedRequest(endpoint)
      return {
        endpoint,
        timestamp: new Date().toISOString(),
        status: response.status,
        headers: response.headers,
        data: response.data
      }
    } catch (error) {
      console.error('❌ Raw API request failed:', error)
      throw new SchwabAPIError(`Raw API request failed: ${error.message}`)
    }
  }

  // Private methods
  
  _generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  async _exchangeCodeForTokens(code) {
    const auth = btoa(`${this.clientId}:${this.clientSecret}`)
    
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri
    })

    const response = await axios.post(this.tokenURL, data, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const tokens = response.data
    tokens.expires_at = Date.now() + (tokens.expires_in * 1000)
    
    return tokens
  }

  async _refreshTokens() {
    const tokens = this._getStoredTokens()
    if (!tokens || !tokens.refresh_token) {
      throw new SchwabAPIError('No refresh token available')
    }

    console.log('🔄 Refreshing Schwab access token')
    
    const auth = btoa(`${this.clientId}:${this.clientSecret}`)
    
    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token
    })

    try {
      const response = await axios.post(this.tokenURL, data, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const newTokens = response.data
      newTokens.expires_at = Date.now() + (newTokens.expires_in * 1000)
      
      this._storeTokens(newTokens)
      console.log('✅ Schwab tokens refreshed')
      
      return newTokens
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      this.logout() // Clear invalid tokens
      throw new SchwabAPIError('Token refresh failed - please login again')
    }
  }

  async _makeAuthenticatedRequest(endpoint) {
    let tokens = this._getStoredTokens()
    
    if (!tokens || !tokens.access_token) {
      throw new SchwabAPIError('No access token available - please login')
    }

    // Check if token needs refresh
    if (tokens.expires_at && Date.now() > (tokens.expires_at - 60000)) { // Refresh 1 minute early
      tokens = await this._refreshTokens()
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json'
        },
        timeout: 30000
      })
      
      return response
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔄 Access token invalid, attempting refresh')
        tokens = await this._refreshTokens()
        
        // Retry with new token
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Accept': 'application/json'
          },
          timeout: 30000
        })
        
        return response
      }
      
      // Wrap other errors so caller gets consistent SchwabAPIError
      const status = error.response?.status || null
      throw new SchwabAPIError(error.message || 'Schwab request failed', status, error.response)
    }
  }

  async _enforceRateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.rateLimit) {
      const delay = this.rateLimit - timeSinceLastRequest
      console.log(`⏱️ Rate limiting: waiting ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    this.lastRequestTime = Date.now()
  }

  _storeTokens(tokens) {
    // Normalize token shape
    if (!tokens.expires_at && tokens.expires_in) {
      tokens.expires_at = Date.now() + tokens.expires_in * 1000
    }
    localStorage.setItem(this.tokenStorageKey, JSON.stringify(tokens))
  }

  _getStoredTokens() {
    try {
      const stored = localStorage.getItem(this.tokenStorageKey)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('❌ Failed to parse stored tokens:', error)
      this.logout()
      return null
    }
  }

  /**
   * Validate stored token structure for debugging
   */
  validateStoredTokens() {
    const t = this._getStoredTokens()
    if (!t) {
      console.log('🔍 validateStoredTokens: no tokens stored')
      return null
    }
    const info = {
      access_token_present: !!t.access_token,
      refresh_token_present: !!t.refresh_token,
      expires_at: t.expires_at,
      expires_in_seconds: t.expires_at ? Math.round((t.expires_at - Date.now()) / 1000) : null,
      expired: t.expires_at ? Date.now() > t.expires_at : null
    }
    console.log('🔍 validateStoredTokens:', info)
    return info
  }
}

// Export singleton instance
const schwabApiInstance = new SchwabApiService()

// Named exports (for backward compatibility)
export const schwabApi = schwabApiInstance
export { SchwabAPIError }

// Default export (for current component usage)
export default schwabApiInstance