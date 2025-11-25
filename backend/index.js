import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SCHWAB_CLIENT_ID,
  SCHWAB_CLIENT_SECRET,
  SCHWAB_REDIRECT_URI,
  SCHWAB_AUTH_URL = 'https://api.schwab.com/v1/oauth/authorize',
  SCHWAB_TOKEN_URL = 'https://api.schwab.com/v1/oauth/token',
  SCHWAB_REDIRECT_URI_ALLOWED,
  PORT = 4000
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

if (!SCHWAB_CLIENT_ID || !SCHWAB_CLIENT_SECRET || !SCHWAB_REDIRECT_URI) {
  throw new Error('Missing Schwab OAuth environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const allowedRedirects = (SCHWAB_REDIRECT_URI_ALLOWED || SCHWAB_REDIRECT_URI)
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)

const app = express()

app.use(cors())
app.use(express.json())

function resolveRedirectUri(preferred) {
  if (preferred && allowedRedirects.includes(preferred)) {
    return preferred
  }
  return SCHWAB_REDIRECT_URI
}

function buildAuthHeader() {
  return `Basic ${Buffer.from(`${SCHWAB_CLIENT_ID}:${SCHWAB_CLIENT_SECRET}`).toString('base64')}`
}

async function requestToken(params) {
  const response = await fetch(SCHWAB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(params).toString()
  })

  const text = await response.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch (_) {
    data = null
  }

  if (!response.ok) {
    const error = new Error('Schwab token request failed')
    error.status = response.status
    error.response = data || text
    throw error
  }

  return data
}

async function persistTokens(tokens, state) {
  if (!tokens) return
  const record = {
    access_token: tokens.access_token || null,
    refresh_token: tokens.refresh_token || null,
    expires_in: tokens.expires_in || null,
    scope: tokens.scope || null,
    token_type: tokens.token_type || null,
    received_at: new Date().toISOString(),
    state: state || null
  }

  const { error } = await supabase.from('schwab_tokens').insert([record])
  if (error) {
    throw new Error(`Failed to store tokens: ${error.message}`)
  }
}

function normalizeTokens(tokens) {
  if (!tokens) return tokens
  if (!tokens.expires_at && tokens.expires_in) {
    tokens.expires_at = Date.now() + tokens.expires_in * 1000
  }
  return tokens
}

function handleTokenError(res, error) {
  const status = error?.status || 500
  const details = error?.response || error?.message || 'Unknown error'
  return res.status(status).json({ error: 'Schwab token request failed', details })
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/schwab/auth', (req, res) => {
  const state = req.query.state || crypto.randomUUID()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SCHWAB_CLIENT_ID,
    redirect_uri: SCHWAB_REDIRECT_URI,
    scope: 'read',
    state
  })

  res.redirect(`${SCHWAB_AUTH_URL}?${params.toString()}`)
})

app.get('/api/schwab/callback', async (req, res) => {
  const { code, state, redirect_uri: redirectQuery } = req.query
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' })
  }

  const redirectUri = resolveRedirectUri(redirectQuery)

  try {
    const tokens = await requestToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })

    await persistTokens(tokens, state)
    return res.json({ success: true, message: 'Tokens stored successfully' })
  } catch (err) {
    return handleTokenError(res, err)
  }
})

app.post('/api/schwab/exchange', async (req, res) => {
  const { code, redirect_uri: preferredRedirect, state } = req.body || {}
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' })
  }

  const redirectUri = resolveRedirectUri(preferredRedirect)

  try {
    const tokens = await requestToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })

    await persistTokens(tokens, state)
    return res.json(normalizeTokens(tokens))
  } catch (err) {
    return handleTokenError(res, err)
  }
})

app.post('/api/schwab/refresh', async (req, res) => {
  const { refresh_token: refreshToken } = req.body || {}
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' })
  }

  try {
    const tokens = await requestToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })

    await persistTokens(tokens)
    return res.json(normalizeTokens(tokens))
  } catch (err) {
    return handleTokenError(res, err)
  }
})

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`)
})
