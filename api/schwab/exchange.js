function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function parseAllowed(values, fallback) {
  const target = values || fallback || ''
  return target.split(',').map(value => value.trim()).filter(Boolean)
}

async function parseBody(req) {
  if (req.body) return req.body
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function buildAuthHeader(clientId, clientSecret) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const clientId = process.env.SCHWAB_CLIENT_ID
  const clientSecret = process.env.SCHWAB_CLIENT_SECRET
  const defaultRedirect = process.env.SCHWAB_REDIRECT_URI
  if (!clientId || !clientSecret || !defaultRedirect) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  let body
  try {
    body = await parseBody(req)
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }

  const code = body?.code
  const requestedRedirect = body?.redirect_uri
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' })
  }

  const allowedRedirects = parseAllowed(process.env.SCHWAB_REDIRECT_URI_ALLOWED, defaultRedirect)
  const redirectUri = requestedRedirect && allowedRedirects.includes(requestedRedirect)
    ? requestedRedirect
    : defaultRedirect

  const params = new URLSearchParams()
  params.set('grant_type', 'authorization_code')
  params.set('code', code)
  params.set('redirect_uri', redirectUri)

  try {
    const response = await fetch('https://api.schwab.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(clientId, clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Schwab token exchange failed', details: data })
    }
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected server error' })
  }
}
