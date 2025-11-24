// Vercel Serverless Function: Generate Schwab OAuth Authorization URL
import crypto from 'crypto'

const CLIENT_ID = process.env.SCHWAB_CLIENT_ID
const REDIRECT_URI = process.env.SCHWAB_REDIRECT_URI

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || 'https://ffainvestments.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!CLIENT_ID || !REDIRECT_URI) {
    console.error('Missing Schwab OAuth env vars')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const state = crypto.randomBytes(16).toString('hex')
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      state
    })
    const url = `https://api.schwab.com/v1/oauth/authorize?${params.toString()}`
    
    console.log('Generated Schwab auth URL with state:', state)
    
    return res.status(200).json({ url, state })
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return res.status(500).json({ error: 'Failed to generate authorization URL' })
  }
}
