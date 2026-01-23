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
const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || 'https://ffainvestments.onrender.com').replace(/\/$/, '')
const PROD_HOST = 'www.ffainvestments.com'
const PROD_REDIRECTS = [
  'https://www.ffainvestments.com/callback',
  'https://www.ffainvestments.com/admin/schwab/callback'
]

function backend(path) {
  return BACKEND_BASE + path
}

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
    const envRedirectUri = (import.meta.env.VITE_SCHWAB_REDIRECT_URI || import.meta.env.REACT_APP_SCHWAB_REDIRECT_URI || '').trim()
    // Use relative path for Vercel serverless functions (deployed together)
    this.backendBase = BACKEND_BASE
    console.log('🔧 SchwabApiService backend base URL:', this.backendBase)
    // Optional comma-separated list of allowed redirect URIs for validation
    this.allowedRedirectsRaw = (import.meta.env.VITE_SCHWAB_ALLOWED_REDIRECTS || '').trim()
    const envAllowedRedirects = this.allowedRedirectsRaw
      ? this.allowedRedirectsRaw.split(',').map(u => u.trim()).filter(Boolean)
      : []
    const isProdHost = this._isProdHost()
    const fallbackRedirect = envRedirectUri || envAllowedRedirects[0] || (isProdHost ? PROD_REDIRECTS[0] : '')
    this.allowedRedirects = isProdHost
      ? PROD_REDIRECTS
      : envAllowedRedirects.length
        ? envAllowedRedirects
        : (fallbackRedirect ? [fallbackRedirect] : [])
    this.redirectUri = isProdHost
      ? (PROD_REDIRECTS.includes(fallbackRedirect) ? fallbackRedirect : PROD_REDIRECTS[0])
      : fallbackRedirect
    
    // Token storage keys
    this.tokenStorageKey = 'schwab_tokens'
    this.stateStorageKey = 'schwab_oauth_state'
    this.redirectStorageKey = 'schwab_oauth_redirect'
    
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
    if (this.redirectUri) {
      this._validateRedirectUri()
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  async getAuthorizationUrl() {
    // Generate Schwab OAuth authorization URL (frontend-only step; no secret needed)
    // Adds: cryptographically secure state, scope parameter, smart redirect selection, detailed logging.
    try {
      if (typeof window === 'undefined') {
        throw new SchwabAPIError('Schwab OAuth requires a browser context', 400)
      }

      const origin = window.location.origin.toLowerCase()
      const matchingRedirects = this.allowedRedirects.filter(r => {
        try {
          return new URL(r).origin.toLowerCase() === origin
        } catch {
          return false
        }
      })

      if (!matchingRedirects.length) {
        throw new SchwabAPIError(`Schwab OAuth is only enabled on ${PROD_HOST}.`, 400)
      }

      let chosenRedirect = this.redirectUri
      if (!matchingRedirects.includes(chosenRedirect)) {
        const adminRedirect = matchingRedirects.find(r => r.includes('/admin/schwab/callback'))
        const defaultRedirect = matchingRedirects.find(
          r => r.endsWith('/callback') && !r.includes('/admin/')
        )
        if (window.location.pathname.startsWith('/admin') && adminRedirect) {
          chosenRedirect = adminRedirect
        } else {
          chosenRedirect = defaultRedirect || matchingRedirects[0]
        }
      }

      // Generate cryptographically secure state (32 bytes base64url)
      let state
      try {
        const bytes = new Uint8Array(32)
        crypto.getRandomValues(bytes)
        state = Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('')
      } catch (_) {
        // Fallback if crypto not available
        state = this._generateState()
      }
      localStorage.setItem(this.stateStorageKey, state)
      localStorage.setItem(this.redirectStorageKey, chosenRedirect)

      // Scope: allow override via env (VITE_SCHWAB_SCOPE); default to readonly like reference implementation
      const scope = (import.meta.env.VITE_SCHWAB_SCOPE || 'readonly').trim()

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: chosenRedirect,
        scope,
        state
      })

      const authUrl = `${this.authURL}?${params.toString()}`
      console.log('[Schwab OAuth] Generated authorization URL', {
        authUrlPreview: authUrl.split('?')[0] + '?…',
        clientIdPrefix: this.clientId ? this.clientId.substring(0,8) : 'missing',
        redirectUsed: chosenRedirect,
        scope,
        statePrefix: state.substring(0,8) + '…',
        allowedRedirects: this.allowedRedirects
      })
      return authUrl
    } catch (e) {
      console.error('[Schwab OAuth] getAuthorizationUrl failed:', e)
      throw e
    }
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
   * @deprecated Use getPositionsForAccount() instead to avoid 400 errors with account-specific endpoints
   */
  async getAccountDetails(accountNumber) {
    if (!accountNumber) {
      throw new SchwabAPIError('Account number is required')
    }
    
    console.log('⚠️ [DEPRECATED] Using getAccountDetails - consider using getPositionsForAccount() instead')
    console.log('📋 Fetching account details for:', accountNumber)
    console.log('📋 Building endpoint: /trader/v1/accounts/' + encodeURIComponent(accountNumber) + '?fields=positions')
    await this._enforceRateLimit()
    
    try {
      const path = `/trader/v1/accounts/${encodeURIComponent(accountNumber)}?fields=positions`
      const response = await this._makeAuthenticatedRequest(path)
      console.log('✅ Account details retrieved for:', accountNumber)
      return response.data
    } catch (error) {
      const status = error.response?.status || error.status || null
      const errorData = error.response?.data || null
      console.error('❌ Failed to fetch account details with account-specific endpoint:', {
        accountNumber,
        endpoint: `/trader/v1/accounts/${encodeURIComponent(accountNumber)}?fields=positions`,
        status,
        message: error.message,
        responseData: errorData,
        hint: 'Try using getPositionsForAccount() instead'
      })
      throw new SchwabAPIError(
        `Failed to fetch account details for ${accountNumber}: ${error.message}`,
        status,
        error.response
      )
    }
  }

  /**
   * Get positions for a specific account by fetching all accounts and filtering
   * This avoids 400 errors from the /accounts/{accountNumber} endpoint
   * 
   * @param {string} accountNumber - The account number to get positions for
   * @returns {Promise<Object|null>} Account object with positions, or null if not found
   */
  async getPositionsForAccount(accountNumber) {
    if (!accountNumber) {
      throw new SchwabAPIError('Account number is required')
    }
    
    console.log('🔍 Fetching positions for account:', accountNumber)
    await this._enforceRateLimit()
    
    try {
      // Fetch all accounts with positions field
      const path = '/trader/v1/accounts?fields=positions'
      console.log('📞 Calling:', path)
      const response = await this._makeAuthenticatedRequest(path)
      
      // Handle different response formats
      const payload = response.data
      const accounts = Array.isArray(payload) ? payload : Array.isArray(payload?.accounts) ? payload.accounts : []
      
      console.log(`✅ Retrieved ${accounts.length} accounts, searching for account ${accountNumber}`)
      
      // Find the matching account by accountNumber
      const targetAccount = accounts.find(acc => {
        const accNum = acc.securitiesAccount?.accountNumber ?? acc.accountNumber ?? acc.accountId
        return accNum === accountNumber || String(accNum) === String(accountNumber)
      })
      
      if (targetAccount) {
        const positions = targetAccount.securitiesAccount?.positions || []
        console.log(`✅ Found account ${accountNumber} with ${positions.length} positions`)
        return targetAccount
      } else {
        console.warn(`⚠️ Account ${accountNumber} not found in response. Available accounts:`, 
          accounts.map(a => a.securitiesAccount?.accountNumber ?? a.accountNumber ?? 'unknown'))
        return null
      }
    } catch (error) {
      const status = error.response?.status || error.status || null
      const errorData = error.response?.data || null
      console.error('❌ Failed to fetch positions for account:', {
        accountNumber,
        endpoint: '/trader/v1/accounts?fields=positions',
        status,
        message: error.message,
        responseData: errorData
      })
      throw new SchwabAPIError(
        `Failed to fetch positions for account ${accountNumber}: ${error.message}`,
        status,
        error.response
      )
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
      // Treat as still logically authenticated if refresh token exists;
      // the first real API call will trigger a refresh.
      if (tokens.refresh_token) {
        return true
      }
      return false
    }
    
    return true
  }

  /**
   * Detailed auth status snapshot (non-breaking addition)
   */
  getAuthStatus() {
    const t = this._getStoredTokens()
    if (!t) return { authenticated: false, reason: 'no_tokens' }
    const expired = t.expires_at ? Date.now() > t.expires_at : false
    return {
      authenticated: !!t.access_token && (!expired || !!t.refresh_token),
      expired,
      has_access_token: !!t.access_token,
      has_refresh_token: !!t.refresh_token,
      expires_at: t.expires_at || null,
      seconds_to_expiry: t.expires_at ? Math.round((t.expires_at - Date.now()) / 1000) : null
    }
  }

  /**
   * Logout - clear stored tokens
   */
  logout() {
    console.log('🚪 Logging out of Schwab')
    localStorage.removeItem(this.tokenStorageKey)
    localStorage.removeItem(this.stateStorageKey)
    localStorage.removeItem(this.redirectStorageKey)
  }

  /**
   * Exchange authorization code for tokens with state validation
   * Public method for OAuth callback handling
   */
  async exchangeCodeForTokens(code, state) {
    console.log('🔄 Backend exchangeCodeForTokens invoked')
    const storedState = localStorage.getItem(this.stateStorageKey)
    if (!storedState || storedState !== state) {
      throw new SchwabAPIError('Invalid OAuth state parameter - possible CSRF attempt', 400)
    }
    if (!code) throw new SchwabAPIError('Authorization code is required', 400)
    try {
      const storedRedirect = localStorage.getItem(this.redirectStorageKey)
      const redirectUri = storedRedirect && this.allowedRedirects.includes(storedRedirect)
        ? storedRedirect
        : this.redirectUri

      if (!redirectUri) {
        throw new SchwabAPIError('Missing redirect URI for token exchange', 400)
      }

      const resp = await fetch(`${this.backendBase}/api/schwab/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state, redirect_uri: redirectUri })
      })

      const data = await this._parseJsonResponse(resp)

      if (!resp.ok) {
        console.error('Schwab backend /api/schwab/exchange failed:', {
          status: resp.status,
          body: data
        })
        // data is the { error, details } object from the backend
        throw new SchwabAPIError(
          'Backend token exchange failed',
          resp.status,
          data
        )
      }
      if (!data || typeof data !== 'object' || !data.access_token) {
        throw new SchwabAPIError('Token exchange response was empty or invalid', resp.status, data)
      }
      localStorage.removeItem(this.stateStorageKey)
      localStorage.removeItem(this.redirectStorageKey)
      this._storeTokens(data)
      const persisted = this._getStoredTokens()
      console.log('🔍 Token persistence check (backend):', {
        stored: !!persisted,
        accessTokenPresent: !!persisted?.access_token,
        expiresAt: persisted?.expires_at,
        refreshTokenPresent: !!persisted?.refresh_token,
      })
      return data
    } catch (e) {
      console.error('❌ Backend exchange error:', e)
      throw e
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

  _isProdHost() {
    if (typeof window === 'undefined') return false
    return window.location.host === PROD_HOST
  }

  async _exchangeCodeForTokens() {
    throw new SchwabAPIError('Direct code exchange disabled; use backend /api/schwab/exchange')
  }

  async _refreshTokens() {
    const tokens = this._getStoredTokens()
    if (!tokens || !tokens.refresh_token) throw new SchwabAPIError('No refresh token available')
    console.log('🔄 Backend refreshing Schwab access token')
    try {
      const resp = await fetch(`${this.backendBase}/api/schwab/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh_token })
      })
      const data = await this._parseJsonResponse(resp)
      if (!resp.ok) throw new SchwabAPIError('Backend refresh failed', resp.status, data)
      if (!data || typeof data !== 'object' || !data.access_token) {
        throw new SchwabAPIError('Refresh response missing tokens', resp.status, data)
      }
      this._storeTokens(data)
      console.log('✅ Schwab tokens refreshed (backend)')
      return data
    } catch (error) {
      console.error('❌ Token refresh failed (backend):', error)
      this.logout()
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
      
      // Log detailed error information for debugging
      const status = error.response?.status || null
      const errorData = error.response?.data || null
      if (status === 400) {
        console.error('🚫 HTTP 400 Bad Request:', {
          url,
          status,
          statusText: error.response?.statusText,
          errorData,
          headers: error.response?.headers
        })
      }
      
      // Wrap other errors so caller gets consistent SchwabAPIError with full error context
      const errorMessage = errorData?.message || error.message || 'Schwab request failed'
      throw new SchwabAPIError(errorMessage, status, error.response)
    }
  }

  async _parseJsonResponse(response) {
    let text
    try {
      text = await response.text()
    } catch (err) {
      console.error('❌ Failed to read backend response body:', err)
      throw new SchwabAPIError('Failed to read backend response', response.status || null)
    }

    if (!text) {
      return null
    }

    try {
      return JSON.parse(text)
    } catch (err) {
      console.warn('⚠️ Backend response was not valid JSON. Returning raw body.', {
        status: response.status,
        bodyPreview: text.slice(0, 200)
      })
      return { rawBody: text }
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

  /**
   * Validate redirect URI against allowed list & HTTPS requirements.
   */
  _validateRedirectUri() {
    if (!this.redirectUri) {
      console.warn('⚠️ redirectUri not configured; Schwab OAuth disabled for this host.')
      return
    }

    try {
      const uri = new URL(this.redirectUri)
      const isHttps = uri.protocol === 'https:'
      const inAllowedList = this.allowedRedirects.length
        ? this.allowedRedirects.includes(this.redirectUri)
        : false
      if (!isHttps) {
        console.warn('⚠️ Redirect URI is not HTTPS. Schwab requires HTTPS callback URLs.')
      }
      if (!inAllowedList) {
        console.warn('⚠️ redirectUri not found in allowed list. allowedRedirects:', this.allowedRedirects)
      }
      if (this.allowedRedirects.length > 1 && !inAllowedList) {
        console.warn('⚠️ Multiple redirect URIs registered; ensure the one used matches exactly (scheme, host, path, trailing slash).')
      }
      console.log('✅ Redirect URI validation snapshot:', { isHttps, inAllowedList, redirectUri: this.redirectUri })
    } catch (e) {
      console.error('❌ Invalid redirectUri format:', this.redirectUri, e.message)
    }
  }
}

// Export singleton instance
const schwabApiInstance = new SchwabApiService()

// Named exports (for backward compatibility)
export const schwabApi = schwabApiInstance
export { SchwabAPIError }

// Default export (for current component usage)
export default schwabApiInstance
