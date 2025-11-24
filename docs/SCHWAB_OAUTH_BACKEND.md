# Schwab OAuth Backend Exchange Plan

This document outlines moving the Schwab OAuth code + token exchange off the frontend for security and reliability.

## Why Move Backend
- Client Secret must never be exposed in shipped frontend bundles.
- Easier to rotate secrets and apply monitoring/rate limiting.
- Enables IP allowlisting, audit logging, and centralized error handling.

## Target Flow
1. User clicks "Connect" → browser redirects to Schwab authorize URL (frontend still builds this URL using clientId + redirectUri).
2. Schwab LMS completes CAG and redirects back with `?code=...&session=...&state=...`.
3. Frontend sends `POST /api/schwab/exchange` with `{ code, state }` (no clientSecret).
4. Backend validates `state` (compare to value stored in server cache when URL was generated).
5. Backend calls Schwab token endpoint:
   - `Authorization: Basic base64(clientId:clientSecret)`
   - `Content-Type: application/x-www-form-urlencoded`
   - Body: `grant_type=authorization_code&code=<decoded_code>&redirect_uri=<exact registered redirect>`
6. Backend receives `{ access_token, refresh_token, expires_in, ... }`.
7. Backend responds to frontend with sanitized JSON (omit clientId, clientSecret).
8. Frontend stores tokens in `localStorage` (or secure cookie) and proceeds.

## Backend Endpoint Sketch (Express)
```js
import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'
import crypto from 'crypto'

const app = express()
app.use(cors())
app.use(express.json())

const CLIENT_ID = process.env.SCHWAB_CLIENT_ID
const CLIENT_SECRET = process.env.SCHWAB_CLIENT_SECRET
const REDIRECT_URI = process.env.SCHWAB_REDIRECT_URI

// In-memory state store (replace with Redis for horizontal scaling)
const stateCache = new Map()
const STATE_TTL_MS = 10 * 60 * 1000

app.get('/api/schwab/auth-url', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')
  stateCache.set(state, Date.now() + STATE_TTL_MS)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'readonly',
    state
  })
  res.json({ url: `https://api.schwab.com/v1/oauth/authorize?${params.toString()}`, state })
})

app.post('/api/schwab/exchange', async (req, res) => {
  const { code, state } = req.body || {}
  if (!code || !state) return res.status(400).json({ error: 'Missing code or state' })
  const expiry = stateCache.get(state)
  if (!expiry || expiry < Date.now()) return res.status(400).json({ error: 'Invalid state' })
  stateCache.delete(state)

  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI
  })
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
    if (!resp.ok) return res.status(resp.status).json({ error: data })
    // Normalize expiry
    data.expires_at = Date.now() + (data.expires_in * 1000)
    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: data.expires_at,
      scope: data.scope,
      token_type: data.token_type
    })
  } catch (e) {
    console.error('Token exchange failed:', e)
    res.status(500).json({ error: 'Internal token exchange error' })
  }
})

// Refresh endpoint
app.post('/api/schwab/refresh', async (req, res) => {
  const { refresh_token } = req.body || {}
  if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token' })
  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token
  })
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
    if (!resp.ok) return res.status(resp.status).json({ error: data })
    data.expires_at = Date.now() + (data.expires_in * 1000)
    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: data.expires_at,
      scope: data.scope,
      token_type: data.token_type
    })
  } catch (e) {
    console.error('Refresh failed:', e)
    res.status(500).json({ error: 'Internal refresh error' })
  }
})

app.listen(4001, () => console.log('Schwab OAuth backend running on :4001'))
```

## Frontend Adjustments
- Replace direct `getAuthorizationUrl()` usage with fetch to `/api/schwab/auth-url`.
- Replace `exchangeCodeForTokens(code, state)` with POST `/api/schwab/exchange`.
- Replace refresh logic with POST `/api/schwab/refresh`.

## Security Hardening
- Use Redis/Memcached for state cache in production.
- Add rate limiting (IP based) to exchange and refresh endpoints.
- Log token exchanges (without secrets or full tokens) for audit.
- Configure HTTPS termination.
- Rotate `SCHWAB_CLIENT_SECRET` periodically; monitor token failures.

## Migration Steps
1. Add backend code file (server).  
2. Remove `clientSecret` usage from frontend bundle.  
3. Update environment variables in both frontend and backend (.env).  
4. Adjust `schwabApi.js` to call backend endpoints.  
5. Test end-to-end OAuth flow with debug panel enabled (`?debug=1`).  
6. Validate refresh by forcing expiry (manually adjust `expires_at`).  
7. Deploy backend behind HTTPS; update Schwab Dev Portal redirect if needed.  

## Testing Checklist
- Authorization URL loads LMS.  
- Redirect returns `code` & `state`.  
- Exchange returns both `access_token` & `refresh_token`.  
- Accounts endpoint returns data (or authorized empty array).  
- Refresh works after manually expiring access token.  

## Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 401 immediately after exchange | Wrong redirect URI registered | Ensure exact match (scheme, path) |
| No refresh_token in response | Product / scope mismatch | Confirm product subscription & scope |
| refresh returns 400 | Refresh token expired (7 days) | Re-run full OAuth flow |
| LMS redirect hits 404 | App callback path not served | Add route handler; code will still be in URL |
| State invalid | Double-click or stale state | Regenerate state and retry |
| CORS error | Missing CORS headers on backend | Enable CORS for frontend origin |

## Next Enhancements
- Token encryption at rest (if storing server-side).  
- Account caching layer to reduce API calls.  
- Structured log ingestion (JSON logs) for audits.  
- Automated token refresh scheduler just before expiry (avoid race).  

---
This plan secures your OAuth flow and eliminates frontend exposure of the Schwab Client Secret.
