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
  PORT = 4000
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

if (!SCHWAB_CLIENT_ID || !SCHWAB_CLIENT_SECRET || !SCHWAB_REDIRECT_URI) {
  throw new Error('Missing Schwab OAuth environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const app = express()

app.use(cors())
app.use(express.json())

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
  const { code, state } = req.query
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' })
  }

  try {
    const tokenResponse = await fetch(SCHWAB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${SCHWAB_CLIENT_ID}:${SCHWAB_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SCHWAB_REDIRECT_URI
      }).toString()
    })

    const tokenBody = await tokenResponse.json().catch(() => null)
    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({ error: 'Token exchange failed', details: tokenBody })
    }

    const insertPayload = {
      access_token: tokenBody.access_token,
      refresh_token: tokenBody.refresh_token,
      expires_in: tokenBody.expires_in,
      scope: tokenBody.scope,
      token_type: tokenBody.token_type,
      received_at: new Date().toISOString(),
      state: state || null
    }

    const { error } = await supabase.from('schwab_tokens').insert([insertPayload])
    if (error) {
      return res.status(500).json({ error: 'Failed to store tokens', details: error.message })
    }

    return res.json({ success: true, message: 'Tokens stored successfully' })
  } catch (err) {
    return res.status(500).json({ error: 'Unexpected server error', details: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`)
})
