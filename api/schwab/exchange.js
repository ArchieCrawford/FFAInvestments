// Vercel Serverless Function: Exchange Schwab OAuth Code for Tokens
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || 'https://ffainvestments.com')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, redirect_uri: requestedRedirect } = req.body || {}

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' })
  }

  const CLIENT_ID = process.env.SCHWAB_CLIENT_ID
  const CLIENT_SECRET = process.env.SCHWAB_CLIENT_SECRET
  const DEFAULT_REDIRECT = process.env.SCHWAB_REDIRECT_URI
  const ALLOWED_REDIRECTS = (process.env.SCHWAB_REDIRECT_URI_ALLOWED || process.env.SCHWAB_REDIRECT_URI || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (!CLIENT_ID || !CLIENT_SECRET || !DEFAULT_REDIRECT) {
    console.error('Missing Schwab OAuth env vars')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const redirectUri = ALLOWED_REDIRECTS.includes(requestedRedirect)
    ? requestedRedirect
    : DEFAULT_REDIRECT

  if (requestedRedirect && !ALLOWED_REDIRECTS.includes(requestedRedirect)) {
    console.warn('Requested redirect URI not in allowed list, falling back to default', {
      requestedRedirect,
      allowed: ALLOWED_REDIRECTS
    })
  }

  try {
    const tokenURL = 'https://api.schwab.com/v1/oauth/token'
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })

    const response = await fetch(tokenURL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Schwab token exchange failed:', data)
      return res.status(response.status).json({ 
        error: data.error || 'Token exchange failed',
        error_description: data.error_description 
      })
    }

    console.log('Successfully exchanged code for tokens')
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error exchanging code:', error)
    return res.status(500).json({ error: 'Failed to exchange authorization code' })
  }
}
