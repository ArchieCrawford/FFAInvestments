import crypto from 'crypto'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function parseAllowed(values) {
  if (!values) return []
  return values.split(',').map(value => value.trim()).filter(Boolean)
}

function selectRedirect(preferred, allowed, fallback) {
  if (preferred && allowed.includes(preferred)) return preferred
  if (allowed.includes(fallback)) return fallback
  return fallback
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const clientId = process.env.SCHWAB_CLIENT_ID
  const clientSecret = process.env.SCHWAB_CLIENT_SECRET
  const defaultRedirect = process.env.SCHWAB_REDIRECT_URI
  if (!clientId || !clientSecret || !defaultRedirect) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const allowedRedirects = parseAllowed(process.env.SCHWAB_REDIRECT_URI_ALLOWED)
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`)
  const queryState = req.query?.state || url.searchParams.get('state')
  const state = queryState || crypto.randomBytes(16).toString('hex')
  const preferredRedirect = url.searchParams.get('redirect_uri')
  const redirectUri = selectRedirect(preferredRedirect, allowedRedirects, defaultRedirect)

  const params = new URLSearchParams()
  params.set('response_type', 'code')
  params.set('client_id', clientId)
  params.set('redirect_uri', redirectUri)
  params.set('scope', 'read')
  params.set('state', state)

  return res.status(200).json({ url: `https://api.schwab.com/v1/oauth/authorize?${params.toString()}`, state, redirect_uri: redirectUri })
}
