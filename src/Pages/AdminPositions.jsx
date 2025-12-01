import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'

const fetchLatestPositions = async () => {
  const { data, error } = await supabase
    .from('latest_schwab_positions')
    .select('*')
    .order('market_value', { ascending: false })

  if (error) throw error
  return data || []
}

const AdminPositions = () => {
  const {
    data: positions,
    isLoading,
    isError,
    error,
  } = useQuery(['latest_schwab_positions'], fetchLatestPositions)

  const latestDate =
    positions.length > 0 ? positions[0].snapshot_date : null

  return (
    <Page
      title="Schwab Positions"
      subtitle="Latest holdings across all Schwab accounts."
    >
      <div className="space-y-4">
        {latestDate && (
          <div className="text-xs text-muted">
            As of {new Date(latestDate).toLocaleDateString()}
          </div>
        )}

        {isLoading && (
          <div className="card p-4 text-sm text-muted">
            Loading positions…
          </div>
        )}

        {isError && (
          <div className="card p-4 text-sm text-red-500">
            Error loading positions: {error?.message || 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left font-semibold text-muted">
                      Symbol
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-muted">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-muted">
                      Market Value
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">
                      Asset Type
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">
                      Account
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.id} className="border-b border-border/60">
                      <td className="px-4 py-2 font-mono text-default">
                        {p.symbol}
                      </td>
                      <td className="px-4 py-2 text-default">{p.description}</td>
                      <td className="px-4 py-2 text-right text-default">
                        {Number(p.quantity || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-default">
                        $
                        {Number(p.market_value || 0).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2 text-default">
                        <span className="badge text-xs">{p.asset_type}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted">
                        {p.account_number || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}

export default AdminPositions
