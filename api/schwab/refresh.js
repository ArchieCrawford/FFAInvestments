function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
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
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  let body
  try {
    body = await parseBody(req)
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }

  const refreshToken = body?.refresh_token
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' })
  }

  const params = new URLSearchParams()
  params.set('grant_type', 'refresh_token')
  params.set('refresh_token', refreshToken)

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
      return res.status(response.status).json({ error: 'Schwab token refresh failed', details: data })
    }
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected server error' })
  }
}
