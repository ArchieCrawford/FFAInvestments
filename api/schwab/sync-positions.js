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

function resolveSymbol(pos, fallbackIndex) {
  const instrument = pos?.instrument || {}
  const raw =
    instrument.symbol ||
    instrument.cusip ||
    instrument.description ||
    pos?.symbol ||
    null
  if (!raw) return null
  const cleaned = String(raw).trim()
  return cleaned.length > 0 ? cleaned : `UNKNOWN_${fallbackIndex}`
}

function mapPositionsRows({ accountNumber, asOfDate, snapshotDate, positions }) {
  const rows = []
  const skipped = []
  const list = positions || []

  list.forEach((pos, idx) => {
    const instrument = pos.instrument || {}
    const symbol = resolveSymbol(pos, idx)
    if (!symbol) {
      skipped.push({ index: idx, reason: 'missing_symbol' })
      return
    }

    const longQty = pos.longQuantity ?? null
    const shortQty = pos.shortQuantity ?? null
    const quantity =
      pos.quantity ??
      (Number.isFinite(Number(longQty)) || Number.isFinite(Number(shortQty))
        ? Number(longQty || 0) - Number(shortQty || 0)
        : null)
    const avgPrice = pos.averagePrice ?? null
    const marketValue = pos.marketValue ?? null
    const dayPl = pos.currentDayProfitLoss ?? null
    const dayPlPct = pos.currentDayProfitLossPercentage ?? null
    const costBasis = pos.costBasis ?? pos.averagePrice ?? null

    rows.push({
      account_number: accountNumber,
      as_of_date: asOfDate,
      snapshot_date: snapshotDate,
      balance_date: asOfDate,
      symbol,
      cusip: instrument.cusip || null,
      description: instrument.description || null,
      asset_type: instrument.assetType || instrument.type || null,
      quantity,
      long_quantity: longQty,
      short_quantity: shortQty,
      market_value: marketValue,
      average_price: avgPrice,
      current_day_profit_loss: dayPl,
      current_day_profit_loss_pct: dayPlPct,
      current_day_pl: dayPl,
      current_day_pl_pct: dayPlPct,
      cost_basis: costBasis,
      raw_json: pos,
    })
  })

  return { rows, skipped }
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

  const syncStartedAt = new Date().toISOString()
  const asOfDate = syncStartedAt.slice(0, 10)

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
  const errors = []
  let totalInserted = 0
  let accountsSynced = 0

  for (const acct of accounts) {
    const accountNumber = normalizeAccountNumber(acct)
    if (!accountNumber) {
      errors.push({ accountNumber: null, error: 'Missing accountNumber in Schwab payload' })
      perAccount.push({
        accountNumber: null,
        positions_count: 0,
        status: 'error',
        error: 'Missing accountNumber in Schwab payload',
      })
      continue
    }

    try {
      const positions = acct?.securitiesAccount?.positions || []
      const { rows, skipped } = mapPositionsRows({
        accountNumber,
        asOfDate,
        snapshotDate: syncStartedAt,
        positions,
      })

      const { data: existingRows, error: existingError } = await supabase
        .from('schwab_positions')
        .select('*')
        .eq('account_number', accountNumber)
        .eq('as_of_date', asOfDate)

      if (existingError) {
        errors.push({ accountNumber, error: `Failed to read existing rows: ${existingError.message}` })
      }

      const { error: deleteError } = await supabase
        .from('schwab_positions')
        .delete()
        .eq('account_number', accountNumber)
        .eq('as_of_date', asOfDate)

      if (deleteError) {
        errors.push({ accountNumber, error: `Failed deleting existing positions: ${deleteError.message}` })
        perAccount.push({
          accountNumber,
          positions_count: 0,
          status: 'error',
          error: deleteError.message,
        })
        continue
      }

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from('schwab_positions').insert(rows)
        if (insertError) {
          const restoreRows = (existingRows || []).map((row) => {
            const { id, created_at, ...rest } = row
            return rest
          })
          if (restoreRows.length > 0) {
            await supabase.from('schwab_positions').insert(restoreRows)
          }
          errors.push({ accountNumber, error: `Failed inserting positions: ${insertError.message}` })
          perAccount.push({
            accountNumber,
            positions_count: 0,
            status: 'error',
            error: insertError.message,
          })
          continue
        }

        totalInserted += rows.length
      }

      accountsSynced += 1
      perAccount.push({
        accountNumber,
        positions_count: rows.length,
        positions_received: positions.length,
        skipped_positions: skipped.length,
        status: 'ok',
      })
    } catch (error) {
      errors.push({ accountNumber, error: error.message || String(error) })
      perAccount.push({
        accountNumber,
        positions_count: 0,
        status: 'error',
        error: error.message || String(error),
      })
    }
  }

  return res.status(200).json({
    ok: errors.length === 0,
    as_of_date: asOfDate,
    last_sync_at: syncStartedAt,
    accounts_count: accounts.length,
    accounts_synced: accountsSynced,
    positions_written: totalInserted,
    per_account: perAccount,
    errors,
  })
}
