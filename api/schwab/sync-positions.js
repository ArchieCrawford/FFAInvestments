function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function parseBody(req) {
  if (req.body) return req.body
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
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

function isTokenExpired(record) {
  const expiresIn = Number(record?.expires_in || 0)
  if (!expiresIn) return true
  const receivedAt = record?.received_at ? Date.parse(record.received_at) : NaN
  if (!Number.isFinite(receivedAt)) return true

  // Refresh a bit early to avoid edge timing issues
  const skewMs = 60_000
  const expiryMs = receivedAt + expiresIn * 1000 - skewMs
  return Date.now() >= expiryMs
}

function buildBasicAuth(clientId, clientSecret) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
}

function normalizeAccountsPayload(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.accounts)) return payload.accounts
  return []
}

function normalizeAccountNumber(account) {
  return (
    account?.securitiesAccount?.accountNumber ??
    account?.accountNumber ??
    account?.accountId ??
    null
  )
}

function mapPositionsRows({ accountNumber, asOfDate, positions }) {
  const rows = []
  for (const pos of positions || []) {
    const instrument = pos.instrument || {}
    const longQty = pos.longQuantity ?? null
    const shortQty = pos.shortQuantity ?? null

    if (longQty !== null && Number(longQty) !== 0) {
      rows.push({
        account_number: accountNumber,
        as_of_date: asOfDate,
        symbol: instrument.symbol || null,
        description: instrument.description || null,
        asset_type: instrument.assetType || instrument.type || null,
        quantity: longQty,
        price: pos.averagePrice ?? null,
        market_value: pos.marketValue ?? null,
        cost_basis: pos.averagePrice ?? null,
        side: 'LONG',
        raw_json: pos,
      })
    }

    if (shortQty !== null && Number(shortQty) !== 0) {
      rows.push({
        account_number: accountNumber,
        as_of_date: asOfDate,
        symbol: instrument.symbol || null,
        description: instrument.description || null,
        asset_type: instrument.assetType || instrument.type || null,
        quantity: shortQty,
        price: pos.averagePrice ?? null,
        market_value: pos.marketValue ?? null,
        cost_basis: pos.averagePrice ?? null,
        side: 'SHORT',
        raw_json: pos,
      })
    }

    if ((longQty === null || Number(longQty) === 0) && (shortQty === null || Number(shortQty) === 0)) {
      rows.push({
        account_number: accountNumber,
        as_of_date: asOfDate,
        symbol: instrument.symbol || null,
        description: instrument.description || null,
        asset_type: instrument.assetType || instrument.type || null,
        quantity: pos.quantity ?? null,
        price: pos.averagePrice ?? null,
        market_value: pos.marketValue ?? null,
        cost_basis: pos.averagePrice ?? null,
        side: null,
        raw_json: pos,
      })
    }
  }
  return rows
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

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const clientId = process.env.SCHWAB_CLIENT_ID
  const clientSecret = process.env.SCHWAB_CLIENT_SECRET

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing Supabase service role env' })
  }

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Server misconfigured: missing Schwab client env' })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let body = {}
  try {
    body = await parseBody(req)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }

  const asOfDate = (body?.date || new Date().toISOString().slice(0, 10))

  // 1) Load latest stored Schwab tokens
  const { data: tokenRow, error: tokenError } = await supabase
    .from('schwab_tokens')
    .select('access_token, refresh_token, expires_in, received_at, token_type')
    .order('received_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (tokenError) {
    return res.status(500).json({ error: 'Failed to load Schwab tokens', details: tokenError.message })
  }

  if (!tokenRow?.access_token) {
    return res.status(401).json({ error: 'No Schwab token available. Reconnect Schwab first.' })
  }

  let accessToken = tokenRow.access_token

  // 2) Refresh token if expired
  if (isTokenExpired(tokenRow)) {
    if (!tokenRow.refresh_token) {
      return res.status(401).json({ error: 'Schwab token expired and no refresh token available. Reconnect Schwab.' })
    }

    const params = new URLSearchParams()
    params.set('grant_type', 'refresh_token')
    params.set('refresh_token', tokenRow.refresh_token)

    const refreshResp = await fetch('https://api.schwab.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: buildBasicAuth(clientId, clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const refreshJson = await refreshResp.json().catch(() => null)
    if (!refreshResp.ok) {
      return res.status(refreshResp.status).json({
        error: 'Schwab token refresh failed',
        details: refreshJson,
      })
    }

    accessToken = refreshJson?.access_token
    if (!accessToken) {
      return res.status(500).json({ error: 'Schwab token refresh returned no access_token' })
    }

    // Persist refreshed tokens (best-effort)
    await supabase.from('schwab_tokens').insert([
      {
        access_token: refreshJson.access_token || null,
        refresh_token: refreshJson.refresh_token || tokenRow.refresh_token || null,
        expires_in: refreshJson.expires_in || null,
        scope: refreshJson.scope || null,
        token_type: refreshJson.token_type || null,
        received_at: new Date().toISOString(),
        state: null,
      },
    ])
  }

  // 3) Fetch accounts with positions in a single call
  const accountsResp = await fetch('https://api.schwab.com/trader/v1/accounts?fields=positions', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  const accountsJson = await accountsResp.json().catch(() => null)
  if (!accountsResp.ok) {
    return res.status(accountsResp.status).json({ error: 'Failed to fetch Schwab accounts', details: accountsJson })
  }

  const accounts = normalizeAccountsPayload(accountsJson)

  // 4) Write positions into Supabase (new schema)
  const perAccount = []
  let totalInserted = 0

  for (const acct of accounts) {
    const accountNumber = normalizeAccountNumber(acct)
    if (!accountNumber) continue

    const positions = acct?.securitiesAccount?.positions || []
    const rows = mapPositionsRows({ accountNumber, asOfDate, positions })

    const { error: deleteError } = await supabase
      .from('schwab_positions')
      .delete()
      .eq('account_number', accountNumber)
      .eq('as_of_date', asOfDate)

    if (deleteError) {
      return res.status(500).json({ error: 'Failed deleting existing positions', details: deleteError.message })
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('schwab_positions').insert(rows)
      if (insertError) {
        return res.status(500).json({ error: 'Failed inserting positions', details: insertError.message })
      }
      totalInserted += rows.length
    }

    perAccount.push({ accountNumber, positions_count: rows.length })
  }

  return res.status(200).json({
    ok: true,
    as_of_date: asOfDate,
    accounts_count: accounts.length,
    accounts_synced: perAccount.length,
    total_positions_rows: totalInserted,
    per_account: perAccount,
  })
}
