// Schwab OAuth Backend Server
// Provides secure endpoints for OAuth authorization URL generation, code exchange, and token refresh.
// Do NOT expose SCHWAB_CLIENT_SECRET in frontend bundles.

import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'
import crypto from 'crypto'

const PORT = process.env.PORT || 4001
const CLIENT_ID = process.env.SCHWAB_CLIENT_ID
const CLIENT_SECRET = process.env.SCHWAB_CLIENT_SECRET
const REDIRECT_URI = process.env.SCHWAB_REDIRECT_URI // Must match registered Schwab callback exactly (HTTPS)
const ORIGIN = process.env.FRONTEND_ORIGIN || 'https://ffainvestments.com'

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error('Missing required Schwab OAuth env vars. Required: SCHWAB_CLIENT_ID, SCHWAB_CLIENT_SECRET, SCHWAB_REDIRECT_URI')
}

const app = express()
app.use(cors({ origin: ORIGIN, credentials: false }))
app.use(express.json())

// In-memory state cache (replace with Redis for multi-instance)
const stateCache = new Map()
const STATE_TTL_MS = 10 * 60 * 1000

function generateState() {
  return crypto.randomBytes(16).toString('hex')
}

function validateRedirect() {
  try {
    const u = new URL(REDIRECT_URI)
    if (u.protocol !== 'https:') {
      console.warn('Redirect URI is not HTTPS; Schwab requires HTTPS for production')
    }
  } catch (e) {
    console.error('Invalid REDIRECT_URI format:', REDIRECT_URI)
  }
}
validateRedirect()

app.get('/api/schwab/auth-url', (req, res) => {
  const state = generateState()
  stateCache.set(state, Date.now() + STATE_TTL_MS)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'readonly',
    state
  })
  return res.json({ url: `https://api.schwab.com/v1/oauth/authorize?${params.toString()}`, state })
})

app.post('/api/schwab/exchange', async (req, res) => {
  const { code, state } = req.body || {}
  if (!code || !state) return res.status(400).json({ error: 'Missing code or state' })
  const expiry = stateCache.get(state)
  if (!expiry || expiry < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired state' })
  }
  stateCache.delete(state)

  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI })

  try {
    const resp = await fetch('https://api.schwab.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    })
    const data = await resp.json()
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data })
    }
    data.expires_at = Date.now() + (data.expires_in * 1000)
    // Sanitize response (do not include client secret)
    return res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: data.expires_at,
      scope: data.scope,
      token_type: data.token_type
    })
  } catch (e) {
    console.error('Token exchange failed:', e)
    return res.status(500).json({ error: 'Internal token exchange error' })
  }
})

app.post('/api/schwab/refresh', async (req, res) => {
  const { refresh_token } = req.body || {}
  if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token' })
  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token })
  try {
    const resp = await fetch('https://api.schwab.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    })
    const data = await resp.json()
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data })
    }
    data.expires_at = Date.now() + (data.expires_in * 1000)
    return res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: data.expires_at,
      scope: data.scope,
      token_type: data.token_type
    })
  } catch (e) {
    console.error('Refresh failed:', e)
    return res.status(500).json({ error: 'Internal refresh error' })
  }
})

app.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }))

app.listen(PORT, () => {
  console.log(`Schwab OAuth backend listening on port ${PORT}`)
})
