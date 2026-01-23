/**
 * Enhanced Charles Schwab API Service
 * 
 * Production-ready implementation based on existing Flask app
 * Features:
 * - Robust OAuth 2.0 with state validation (CSRF protection)
 * - Automatic token refresh with proper error handling
 * - Rate limiting (120 calls/minute as per Schwab limits)
 * - HTTPS support for production
 * - Session persistence and cleanup
 * - DNS fallback handling
 * - Comprehensive logging and error recovery
 */

import axios from 'axios';
const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || 'https://ffainvestments.onrender.com').replace(/\/$/, '')

class SchwabAPIError extends Error {
  constructor(message, status = null, response = null) {
    super(message);
    this.name = 'SchwabAPIError';
    this.status = status;
    this.response = response;
  }
}

class EnhancedSchwabApiService {
  constructor() {
    // Configuration from environment variables (Vite-compatible)
    this.clientId = import.meta.env.VITE_SCHWAB_CLIENT_ID?.replace(/['"]/g, '') || import.meta.env.REACT_APP_SCHWAB_CLIENT_ID?.replace(/['"]/g, '');
    this.redirectUri = import.meta.env.VITE_SCHWAB_REDIRECT_URI || import.meta.env.REACT_APP_SCHWAB_REDIRECT_URI;
    this.backendBase = BACKEND_BASE;
    
    // API Endpoints
    this.authUrl = 'https://api.schwab.com/v1/oauth/authorize';
    this.tokenUrl = 'https://api.schwab.com/v1/oauth/token';
    this.baseUrl = 'https://api.schwab.com';
    
    // DNS fallback IP (matches Flask implementation)
    this.fallbackIP = '23.55.63.35';
    
    // Rate limiting (120 calls per minute = 500ms between calls)
    this.rateLimitDelay = 500;
    this.lastCallTime = 0;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    
    // Token management
    this.isRefreshing = false;
    this.refreshSubscribers = [];
    this.tokenBuffer = 60; // Refresh tokens 60 seconds before expiry
    
    // State management for OAuth security
    this.stateCache = new Map();
    this.stateCacheTTL = 600000; // 10 minutes
    
    // Storage keys
    this.storageKeys = {
      accessToken: 'schwab_access_token',
      refreshToken: 'schwab_refresh_token',
      tokenObtainedAt: 'schwab_token_obtained_at',
      expiresIn: 'schwab_expires_in',
      oauthState: 'schwab_oauth_state'
    };
    
    this.setupAxiosInstance();
    this.startStateCleanup();
    
    console.log('🔧 Enhanced Schwab API Service initialized:', {
      clientId: this.clientId ? '✅ Set' : '❌ Missing',
      redirectUri: this.redirectUri,
      hasStoredTokens: !!this.getStoredAccessToken()
    });
  }

  /**
   * Setup axios instance with comprehensive error handling and DNS fallback
   */
  setupAxiosInstance() {
    this.api = axios.create({
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'FFA-Investments-React/1.0'
      }
    });

    // Request interceptor
    this.api.interceptors.request.use(async (config) => {
      await this.enforceRateLimit();
      
      // Add authentication for non-token requests
      if (!config.url.includes('/oauth/token')) {
        const token = await this.getValidAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      
      return config;
    });

    // Response interceptor with DNS fallback
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // DNS fallback retry (matches Flask implementation)
        if (this.isDNSError(error) && !originalRequest._dnsRetried) {
          console.warn('DNS resolution failed for api.schwab.com, trying direct IP');
          originalRequest._dnsRetried = true;
          
          const fallbackUrl = originalRequest.url.replace('api.schwab.com', this.fallbackIP);
          const fallbackConfig = {
            ...originalRequest,
            url: fallbackUrl,
            headers: {
              ...originalRequest.headers,
              'Host': 'api.schwab.com'
            },
            // Note: In production, consider certificate validation
            httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false })
          };
          
          try {
            return await axios(fallbackConfig);
          } catch (fallbackError) {
            console.error('Direct IP fallback also failed');
            return Promise.reject(error); // Return original error
          }
        }
        
        // Token refresh for 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.clearAllTokens();
            throw new SchwabAPIError('Authentication failed and token refresh unsuccessful', 401);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if error is DNS-related
   */
  isDNSError(error) {
    const message = error.message?.toLowerCase() || '';
    return message.includes('getaddrinfo') || 
           message.includes('name resolution') ||
           message.includes('dns') ||
           error.code === 'ENOTFOUND';
  }

  /**
   * Generate secure state parameter for OAuth (CSRF protection)
   */
  generateSecureState() {
    const state = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    const timestamp = Date.now();
    this.stateCache.set(state, timestamp);
    
    // Also store in localStorage as backup
    localStorage.setItem(this.storageKeys.oauthState, JSON.stringify({ state, timestamp }));
    
    return state;
  }

  /**
   * Validate OAuth state parameter
   */
  validateState(state) {
    if (!state) return false;
    
    // Check in-memory cache first
    if (this.stateCache.has(state)) {
      const timestamp = this.stateCache.get(state);
      const isValid = (Date.now() - timestamp) < this.stateCacheTTL;
      this.stateCache.delete(state); // Single use
      return isValid;
    }
    
    // Check localStorage backup
    try {
      const stored = localStorage.getItem(this.storageKeys.oauthState);
      if (stored) {
        const { state: storedState, timestamp } = JSON.parse(stored);
        if (storedState === state && (Date.now() - timestamp) < this.stateCacheTTL) {
          localStorage.removeItem(this.storageKeys.oauthState);
          return true;
        }
      }
    } catch (e) {
      console.warn('Error validating state from localStorage:', e);
    }
    
    return false;
  }

  /**
   * Start periodic state cache cleanup
   */
  startStateCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [state, timestamp] of this.stateCache.entries()) {
        if (now - timestamp > this.stateCacheTTL) {
          this.stateCache.delete(state);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Generate OAuth authorization URL with enhanced security
   */
  getAuthorizationUrl(scope = 'readonly') {
    if (!this.clientId || !this.redirectUri) {
      throw new SchwabAPIError('Schwab API configuration incomplete - missing client ID or redirect URI');
    }

    const state = this.generateSecureState();
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scope,
      state: state
    });

    const authUrl = `${this.authUrl}?${params.toString()}`;
    
    console.log('Generated OAuth URL with state validation:', { 
      state: state.substring(0, 8) + '...',
      scope 
    });
    
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens with enhanced error handling
   */
  async exchangeCodeForTokens(code, state) {
    if (!this.validateState(state)) {
      throw new SchwabAPIError('Invalid or expired OAuth state parameter - possible CSRF attempt', 400);
    }

    if (!code) {
      throw new SchwabAPIError('Authorization code is required', 400);
    }
    if (!this.redirectUri) {
      throw new SchwabAPIError('Missing redirect URI for token exchange', 400);
    }

    try {
      console.log('Exchanging authorization code for tokens via backend...');
      const response = await fetch(`${this.backendBase}/api/schwab/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state, redirect_uri: this.redirectUri })
      });

      const tokens = await response.json().catch(() => null);
      if (!response.ok) {
        throw new SchwabAPIError('Backend token exchange failed', response.status, tokens);
      }
      if (!tokens || !tokens.access_token) {
        throw new SchwabAPIError('Token exchange response missing tokens', response.status, tokens);
      }
      this.storeTokens(tokens);
      
      console.log('✅ Successfully obtained and stored tokens:', {
        accessToken: tokens.access_token ? '✅ Received' : '❌ Missing',
        refreshToken: tokens.refresh_token ? '✅ Received' : '❌ Missing',
        expiresIn: tokens.expires_in || 'Unknown'
      });

      return tokens;
      
    } catch (error) {
      if (error instanceof SchwabAPIError) {
        throw error;
      }
      console.error('❌ Token exchange failed:', error?.message || error);
      throw new SchwabAPIError('Failed to exchange authorization code for tokens', error?.status, error);
    }
  }

  /**
   * Store tokens securely in localStorage with metadata
   */
  storeTokens(tokens) {
    const now = Date.now();
    
    if (tokens.access_token) {
      localStorage.setItem(this.storageKeys.accessToken, tokens.access_token);
      localStorage.setItem(this.storageKeys.tokenObtainedAt, now.toString());
      localStorage.setItem(this.storageKeys.expiresIn, (tokens.expires_in || 1800).toString());
    }
    
    if (tokens.refresh_token) {
      localStorage.setItem(this.storageKeys.refreshToken, tokens.refresh_token);
    }
  }

  /**
   * Get stored access token
   */
  getStoredAccessToken() {
    return localStorage.getItem(this.storageKeys.accessToken);
  }

  /**
   * Get stored refresh token
   */
  getStoredRefreshToken() {
    return localStorage.getItem(this.storageKeys.refreshToken);
  }

  /**
   * Check if current access token is expired
   */
  isAccessTokenExpired() {
    const tokenTime = localStorage.getItem(this.storageKeys.tokenObtainedAt);
    const expiresIn = localStorage.getItem(this.storageKeys.expiresIn);
    
    if (!tokenTime || !expiresIn) {
      return true;
    }
    
    const tokenAge = Date.now() - parseInt(tokenTime);
    const expirationTime = (parseInt(expiresIn) - this.tokenBuffer) * 1000; // Convert to ms and add buffer
    
    return tokenAge >= expirationTime;
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken() {
    const token = this.getStoredAccessToken();
    
    if (!token || this.isAccessTokenExpired()) {
      console.log('Access token expired or missing, attempting refresh...');
      return await this.refreshAccessToken();
    }
    
    return token;
  }

  /**
   * Refresh access token using refresh token (matches Flask implementation)
   */
  async refreshAccessToken() {
    const refreshToken = this.getStoredRefreshToken();
    
    if (!refreshToken) {
      console.warn('No refresh token available - user needs to re-authenticate');
      this.clearAllTokens();
      throw new SchwabAPIError('No refresh token available - please login again', 401);
    }

    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      console.log('Refreshing access token via backend...');
      const response = await fetch(`${this.backendBase}/api/schwab/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      const tokens = await response.json().catch(() => null);
      if (!response.ok) {
        throw new SchwabAPIError('Backend refresh failed', response.status, tokens);
      }
      if (!tokens || !tokens.access_token) {
        throw new SchwabAPIError('Refresh response missing tokens', response.status, tokens);
      }
      this.storeTokens(tokens);
      
      const newAccessToken = tokens.access_token;
      
      // Notify all subscribers of successful refresh
      this.refreshSubscribers.forEach(callback => callback(newAccessToken));
      this.refreshSubscribers = [];
      
      console.log('✅ Successfully refreshed access token:', {
        expiresIn: tokens.expires_in || 'Unknown',
        newRefreshToken: tokens.refresh_token ? '✅ New refresh token received' : '📝 Using existing refresh token'
      });

      return newAccessToken;
      
    } catch (error) {
      const status = error?.status || null;
      console.error('❌ Token refresh failed:', error?.message || error);

      // Notify subscribers of failure
      this.refreshSubscribers.forEach(callback => callback(null));
      this.refreshSubscribers = [];

      // Clear invalid tokens
      this.clearAllTokens();

      if (status === 400) {
        throw new SchwabAPIError('Refresh token expired - please login again', 401);
      }

      throw new SchwabAPIError('Failed to refresh access token', status);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Enforce rate limiting (120 calls per minute)
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastCallTime = Date.now();
  }

  /**
   * Clear all stored tokens
   */
  clearAllTokens() {
    Object.values(this.storageKeys).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🧹 Cleared all stored tokens');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getStoredAccessToken();
    return !!(token && !this.isAccessTokenExpired());
  }

  /**
   * Log out user by clearing all tokens
   */
  logout() {
    this.clearAllTokens();
    this.stateCache.clear();
    console.log('👋 User logged out successfully');
  }

  // ======================
  // API METHODS
  // ======================

  /**
   * Get all accounts
   */
  async getAccounts() {
    try {
      const response = await this.api.get('/trader/v1/accounts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      throw new SchwabAPIError('Failed to fetch accounts', error.response?.status);
    }
  }

  /**
   * Get account details with positions
   */
  async getAccountDetails(accountId) {
    try {
      const response = await this.api.get(`/trader/v1/accounts/${accountId}?fields=positions`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch account details for ${accountId}:`, error);
      throw new SchwabAPIError('Failed to fetch account details', error.response?.status);
    }
  }

  /**
   * Get market data quote
   */
  async getQuote(symbol) {
    try {
      const response = await this.api.get(`/marketdata/v1/quotes?symbols=${symbol}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      throw new SchwabAPIError('Failed to fetch quote', error.response?.status);
    }
  }

  /**
   * Get orders for account
   */
  async getOrders(accountId, fromEnteredTime = null, toEnteredTime = null, maxResults = 50) {
    try {
      const params = new URLSearchParams({
        maxResults: maxResults.toString()
      });
      
      if (fromEnteredTime) params.append('fromEnteredTime', fromEnteredTime);
      if (toEnteredTime) params.append('toEnteredTime', toEnteredTime);
      
      const response = await this.api.get(`/trader/v1/accounts/${accountId}/orders?${params}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch orders for ${accountId}:`, error);
      throw new SchwabAPIError('Failed to fetch orders', error.response?.status);
    }
  }

  /**
   * Generic API call method for raw data access
   */
  async makeRawApiCall(endpoint, method = 'GET', data = null, params = null) {
    try {
      const config = {
        method,
        url: endpoint,
        data,
        params
      };
      
      const response = await this.api.request(config);
      return {
        status: response.status,
        headers: response.headers,
        data: response.data
      };
    } catch (error) {
      console.error(`Raw API call failed for ${endpoint}:`, error);
      throw new SchwabAPIError(`Failed to execute ${method} ${endpoint}`, error.response?.status, error.response?.data);
    }
  }
}

// Export singleton instance
const schwabApi = new EnhancedSchwabApiService();
export default schwabApi;
