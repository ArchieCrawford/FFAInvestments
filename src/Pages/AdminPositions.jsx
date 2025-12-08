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
    data: positions = [],
    isLoading,
    isError,
    error,
  } = useQuery(['latest_schwab_positions'], fetchLatestPositions)

  const latestDate =
    positions.length > 0 ? positions[0].snapshot_date : null

  const totalMarketValue = positions.reduce((sum, p) => {
    const mv = Number(p.market_value || 0)
    return Number.isFinite(mv) ? sum + mv : sum
  }, 0)

  const handleExportCsv = () => {
    if (!positions || positions.length === 0) return

    const headers = [
      'symbol',
      'description',
      'quantity',
      'market_value',
      'asset_type',
      'account_number',
      'snapshot_date',
    ]

    const rows = positions.map((p) => [
      p.symbol ?? '',
      p.description ?? '',
      p.quantity ?? '',
      p.market_value ?? '',
      p.asset_type ?? '',
      p.account_number ?? '',
      p.snapshot_date ?? '',
    ])

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => {
        const s = String(v ?? '')
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      }).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const datePart = latestDate ? new Date(latestDate).toISOString().split('T')[0] : 'latest'
    a.download = `schwab_positions_${datePart}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Page
      title="Schwab Positions"
      subtitle="Latest holdings across all Schwab accounts."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="text-xs text-muted">Total Market Value</div>
            <div className="text-2xl font-semibold text-default">
              $
              {Number(totalMarketValue).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            {latestDate && (
              <div className="text-xs text-muted mt-1">
                As of {new Date(latestDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {latestDate && (
          <div className="text-xs text-muted">
            As of {new Date(latestDate).toLocaleDateString()}
          </div>
        )}

            <div className="flex justify-end">
              <button
                type="button"
                className="btn-primary-soft text-xs px-3 py-2"
                onClick={handleExportCsv}
                disabled={!positions || positions.length === 0}
              >
                Export CSV
              </button>
            </div>

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
                    <th className="px-4 py-2 text-right font-semibold text-muted">
                      % of Total
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
                      <td className="px-4 py-2 text-right text-default">
                        {totalMarketValue > 0
                          ? `${((Number(p.market_value || 0) / totalMarketValue) * 100).toFixed(2)}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-2 text-default">
                        <span className="badge text-xs">{p.asset_type}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted">
                        {p.account_number || '—'}
                      </td>
                    </tr>
                  ))}
                  {positions.length > 0 && (
                    <tr className="bg-primary-soft/40 border-t border-border">
                      <td className="px-4 py-2 font-semibold text-default" colSpan={3}>
                        Total
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-default">
                        $
                        {Number(totalMarketValue).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-default">
                        100%
                      </td>
                      <td className="px-4 py-2" colSpan={2}></td>
                    </tr>
                  )}
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
