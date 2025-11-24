// Vercel Serverless Function: Refresh Schwab OAuth Access Token
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

  const { refresh_token } = req.body

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' })
  }

  const CLIENT_ID = process.env.SCHWAB_CLIENT_ID
  const CLIENT_SECRET = process.env.SCHWAB_CLIENT_SECRET

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing Schwab OAuth env vars')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const tokenURL = 'https://api.schwab.com/v1/oauth/token'
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token
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
      console.error('Schwab token refresh failed:', data)
      return res.status(response.status).json({ 
        error: data.error || 'Token refresh failed',
        error_description: data.error_description 
      })
    }

    console.log('Successfully refreshed access token')
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error refreshing token:', error)
    return res.status(500).json({ error: 'Failed to refresh access token' })
  }
}
