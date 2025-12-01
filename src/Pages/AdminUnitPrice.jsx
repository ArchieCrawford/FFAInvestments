import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'

const fetchUnitPriceHistory = async () => {
  const { data, error } = await supabase
    .from('unit_price_history')
    .select('*')
    .order('report_month', { ascending: true })

  if (error) throw error
  return data || []
}

const AdminUnitPrice = () => {
  const {
    data: history = [],
    isLoading,
    isError,
    error,
  } = useQuery(['unit_price_history'], fetchUnitPriceHistory)

  const latest = history.length > 0 ? history[history.length - 1] : null

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

        {!isLoading && !isError && latest && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="card p-4 space-y-1">
                <div className="text-xs text-muted">Current Unit Price</div>
                <div className="text-2xl font-semibold text-default">
                  ${Number(latest.unit_value || 0).toFixed(2)}
                </div>
                <div className="text-xs text-muted">
                  As of{' '}
                  {new Date(latest.report_month).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <div className="card p-4 space-y-1">
                <div className="text-xs text-muted">Total Portfolio Value</div>
                <div className="text-xl font-semibold text-default">
                  $
                  {Number(latest.portfolio_total_value || 0).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 2 }
                  )}
                </div>
              </div>

              <div className="card p-4 space-y-1">
                <div className="text-xs text-muted">Total Units Outstanding</div>
                <div className="text-xl font-semibold text-default">
                  {Number(latest.total_units_outstanding || 0).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 4 }
                  )}
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="text-sm font-semibold text-default mb-3">
                Unit price history
              </div>
              <div className="text-xs text-muted mb-3">
                Simple history table for now; can be upgraded to a chart.
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
          </>
        )}

        {!isLoading && !isError && !latest && (
          <div className="card p-4 text-sm text-muted">
            No unit price history yet.
          </div>
        )}
      </div>
    </Page>
  )
}

export default AdminUnitPrice
