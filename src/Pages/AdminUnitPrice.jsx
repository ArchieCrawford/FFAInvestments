import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'

function formatDateTimeLabel(d) {
  if (!d) return 'Data unavailable'
  const parsed = new Date(d)
  if (Number.isNaN(parsed.getTime())) return 'Data unavailable'
  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const fetchUnitPriceHistory = async () => {
  const { data, error } = await supabase
    .from('unit_price_history')
    .select('*')
    .order('report_month', { ascending: true })

  if (error) throw error
  return data || []
}

const fetchSchwabUnitValue = async () => {
  const { data: accounts, error: accountsError } = await supabase
    .from('member_accounts')
    .select('current_units')
    .eq('is_active', true)
  if (accountsError) throw accountsError

  const totalUnits = (accounts || []).reduce((sum, row) => {
    const v = Number(row.current_units || 0)
    return Number.isFinite(v) ? sum + v : sum
  }, 0)

  const { data: positions, error: positionsError } = await supabase
    .from('latest_schwab_positions')
    .select('market_value, snapshot_date')
  if (positionsError) throw positionsError

  const rows = positions || []
  const positionsCount = rows.length
  let totalMarketValue = 0
  let latestSnapshot = null

  for (const row of rows) {
    const mv = Number(row.market_value || 0)
    if (Number.isFinite(mv)) totalMarketValue += mv
    if (row.snapshot_date) {
      const ts = new Date(row.snapshot_date).getTime()
      if (Number.isFinite(ts) && (!latestSnapshot || ts > latestSnapshot)) {
        latestSnapshot = ts
      }
    }
  }

  const unitValueLive =
    totalUnits > 0 && positionsCount > 0 ? totalMarketValue / totalUnits : null

  return {
    totalUnits,
    totalMarketValue,
    unitValueLive,
    lastSyncAt: latestSnapshot ? new Date(latestSnapshot).toISOString() : null,
    positionsCount,
  }
}

const AdminUnitPrice = () => {
  const {
    data: history = [],
    isLoading,
    isError,
    error,
  } = useQuery(['unit_price_history'], fetchUnitPriceHistory)

  const { data: liveSnapshot } = useQuery(
    ['schwab_unit_value'],
    fetchSchwabUnitValue
  )

  const latest = history.length > 0 ? history[history.length - 1] : null
  const positionsCount = Number(liveSnapshot?.positionsCount || 0)
  const hasLive = positionsCount > 0 && liveSnapshot?.unitValueLive !== null
  const showCards = hasLive || Boolean(latest)
  const latestHistoryLabel = latest
    ? new Date(latest.report_month).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Data unavailable'

  const unitValueDisplay = hasLive
    ? liveSnapshot.unitValueLive
    : latest?.unit_value ?? null
  const portfolioValueDisplay = hasLive
    ? liveSnapshot.totalMarketValue
    : latest?.portfolio_total_value ?? null
  const totalUnitsDisplay = hasLive
    ? liveSnapshot.totalUnits
    : latest?.total_units_outstanding ?? null
  const liveAsOfLabel = liveSnapshot?.lastSyncAt
    ? `As of ${formatDateTimeLabel(liveSnapshot.lastSyncAt)}`
    : 'Data unavailable'

  return (
    <Page
      title="Unit Price"
      subtitle="Track the club unit price and total value over time."
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="card p-4 text-sm text-muted">
            Loading unit price…
          </div>
        )}

        {isError && (
          <div className="card p-4 text-sm text-default border border-border bg-primary-soft">
            Error loading unit price: {error?.message || 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && showCards && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="card p-4 space-y-1">
                <div className="text-xs text-muted">Current Unit Price</div>
                <div className="text-2xl font-semibold text-default">
                  $
                  {unitValueDisplay !== null
                    ? Number(unitValueDisplay || 0).toFixed(2)
                    : '—'}
                </div>
                <div className="text-xs text-muted">
                  {hasLive
                    ? liveAsOfLabel
                    : `Meeting history • ${latestHistoryLabel}`}
                </div>
              </div>

              <div className="card p-4 space-y-1">
                <div className="text-xs text-muted">Total Portfolio Value</div>
                <div className="text-xl font-semibold text-default">
                  $
                  {Number(portfolioValueDisplay || 0).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-muted">
                  {hasLive ? 'Schwab positions value' : 'Meeting history'}
                </div>
              </div>

              <div className="card p-4 space-y-1">
                <div className="text-xs text-muted">Total Units Outstanding</div>
                <div className="text-xl font-semibold text-default">
                  {Number(totalUnitsDisplay || 0).toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
                </div>
                <div className="text-xs text-muted">
                  {hasLive ? 'Active member units' : 'Meeting history'}
                </div>
              </div>
            </div>

            {history.length > 0 ? (
              <div className="card p-4">
                <div className="text-sm font-semibold text-default mb-3">
                  Unit price history
                </div>
                <div className="text-xs text-muted mb-3">
                  Meeting history table for now; can be upgraded to a chart.
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-semibold text-muted">
                          Month
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-muted">
                          Unit Price
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-muted">
                          Total Value
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-muted">
                          Units
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((row) => (
                        <tr
                          key={row.report_month}
                          className="border-b border-border/60"
                        >
                          <td className="px-4 py-2 text-default">
                            {new Date(row.report_month).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2 text-right text-default">
                            ${Number(row.unit_value || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-default">
                            $
                            {Number(row.portfolio_total_value || 0).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 2 }
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-default">
                            {Number(row.total_units_outstanding || 0).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 4 }
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card p-4 text-sm text-muted">
                No unit price history yet.
              </div>
            )}
          </>
        )}

        {!isLoading && !isError && !showCards && (
          <div className="card p-4 text-sm text-muted">
            No unit price history yet.
          </div>
        )}
      </div>
    </Page>
  )
}

export default AdminUnitPrice
