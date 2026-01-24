import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Page } from '../components/Page'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

function numberOrNull(value) {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function formatCurrencyShort(n) {
  if (n === null || n === undefined) return '—'
  const v = Number(n)
  if (Number.isNaN(v)) return '—'
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}k`
  return `$${v.toFixed(2)}`
}

function formatPercent(n) {
  if (n === null || n === undefined) return '—'
  const v = Number(n)
  if (Number.isNaN(v)) return '—'
  return `${(v * 100).toFixed(1)}%`
}

function formatMonthLabel(d) {
  try {
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
  } catch {
    return d
  }
}

function formatDateTimeLabel(d) {
  if (!d) return 'Data unavailable'
  const parsed = new Date(d)
  if (Number.isNaN(parsed.getTime())) return 'Data unavailable'
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function fetchMeetingReports() {
  const { data, error } = await supabase
    .from('meeting_reports')
    .select('*')
    .order('report_month', { ascending: true })
  if (error) throw error
  return data || []
}

async function fetchLatestMeetingMembers() {
  const { data: latest, error: latestError } = await supabase
    .from('meeting_reports')
    .select('id, report_month, portfolio_total_value, unit_value')
    .order('report_month', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestError) throw latestError
  if (!latest) return { latestMeeting: null, members: [] }

  const { data: members, error: membersError } = await supabase
    .from('meeting_report_members')
    .select('*')
    .eq('meeting_report_id', latest.id)
    .order('ownership_pct_of_club', { ascending: false })

  if (membersError) throw membersError

  return {
    latestMeeting: latest,
    members: members || [],
  }
}

async function fetchSchwabTotals() {
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

  return {
    positionsCount,
    totalUnits,
    totalMarketValue,
    lastSyncAt: latestSnapshot ? new Date(latestSnapshot).toISOString() : null,
  }
}

const AdminDashboard_Hero = () => {
  const {
    data: reports,
    isLoading: reportsLoading,
    error: reportsError,
  } = useQuery({
    queryKey: ['meeting_reports'],
    queryFn: fetchMeetingReports,
  })

  const {
    data: memberData,
    isLoading: membersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ['meeting_report_members_latest'],
    queryFn: fetchLatestMeetingMembers,
  })

  const {
    data: schwabTotals,
    error: schwabTotalsError,
  } = useQuery({
    queryKey: ['schwab_positions_totals'],
    queryFn: fetchSchwabTotals,
  })

  const latestMeeting = memberData?.latestMeeting || null
  const latestMembers = memberData?.members || []
  const totalUnits = numberOrNull(schwabTotals?.totalUnits)
  const totalMarketValue = numberOrNull(schwabTotals?.totalMarketValue)
  const lastSyncAt = schwabTotals?.lastSyncAt || null
  const positionsCount = Number(schwabTotals?.positionsCount || 0)
  const hasSchwabData = positionsCount > 0

  const series = useMemo(() => {
    const rows = reports || []
    return rows.map(r => {
      const monthLabel = formatMonthLabel(r.report_month)
      return {
        month: monthLabel,
        report_month: r.report_month,
        portfolio_total_value: numberOrNull(r.portfolio_total_value),
        stock_value: numberOrNull(r.stock_value),
        cash_credit_union: numberOrNull(r.cash_credit_union),
        cash_schwab: numberOrNull(r.cash_schwab),
        cash_schwab_mm: numberOrNull(r.cash_schwab_mm),
        unit_value: numberOrNull(r.unit_value),
        total_units_outstanding: numberOrNull(r.total_units_outstanding),
        total_dues_paid: numberOrNull(r.total_dues_paid),
        total_dues_owed: numberOrNull(r.total_dues_owed),
        total_member_contribution: numberOrNull(r.total_member_contribution),
        total_member_units_added: numberOrNull(r.total_member_units_added),
      }
    })
  }, [reports])

  const latestReport = useMemo(() => {
    if (!reports || reports.length === 0) return null
    return reports[reports.length - 1]
  }, [reports])

  const unitValue = hasSchwabData && totalUnits && totalUnits > 0 && totalMarketValue !== null
    ? totalMarketValue / totalUnits
    : null
  const fallbackPortfolioValue = numberOrNull(latestReport?.portfolio_total_value)
  const fallbackUnitValue = numberOrNull(latestReport?.unit_value)
  const fallbackUnits = numberOrNull(latestReport?.total_units_outstanding)
  const portfolioValue = hasSchwabData ? totalMarketValue : fallbackPortfolioValue
  const unitValueDisplay = unitValue !== null ? unitValue : fallbackUnitValue

  const overviewCards = [
    {
      label: 'Latest Portfolio Value',
      value: portfolioValue !== null ? formatCurrencyShort(portfolioValue) : '—',
      helper: hasSchwabData
        ? (lastSyncAt ? `As of ${formatDateTimeLabel(lastSyncAt)}` : 'Data unavailable')
        : (fallbackPortfolioValue !== null ? 'Meeting history' : 'Data unavailable'),
    },
    {
      label: 'Current Unit Value',
      value: unitValueDisplay !== null ? `$${Number(unitValueDisplay).toFixed(4)}` : '—',
      helper: hasSchwabData && totalUnits !== null
        ? `${Number(totalUnits).toFixed(2)} units`
        : (fallbackUnits !== null ? `${Number(fallbackUnits).toFixed(2)} units (meeting)` : 'Data unavailable'),
    },
    {
      label: 'Latest Stock vs Cash',
      value: latestReport
        ? `${formatCurrencyShort(latestReport.stock_value)} stock`
        : '—',
      helper: latestReport
        ? `${formatCurrencyShort(
            (latestReport.cash_credit_union || 0) +
              (latestReport.cash_schwab || 0) +
              (latestReport.cash_schwab_mm || 0),
          )} cash`
        : '',
    },
    {
      label: 'Last Meeting Contributions',
      value: latestReport && latestReport.total_member_contribution
        ? formatCurrencyShort(latestReport.total_member_contribution)
        : '—',
      helper:
        latestReport && latestReport.total_dues_paid
          ? `${formatCurrencyShort(latestReport.total_dues_paid)} dues collected`
          : '',
    },
  ]

  const loading = reportsLoading || membersLoading
  const error = reportsError || membersError || schwabTotalsError

  return (
    <Page
      title="Partner Dashboard"
      subtitle="Track how the club and partners have grown over time."
    >
      {error && (
        <div className="card mb-4 bg-primary-soft border border-border text-default p-3 rounded-xl">
          {error.message || String(error)}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-muted text-sm">Loading meeting history…</div>
      ) : !reports || reports.length === 0 ? (
        <div className="py-16 text-center text-muted text-sm">
          No meeting reports found yet. Import or create your first meeting snapshot to see analytics here.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {overviewCards.map(card => (
                <div key={card.label} className="card rounded-xl border border-border bg-surface p-4 flex flex-col gap-1">
                  <div className="text-xs uppercase tracking-wide text-muted">{card.label}</div>
                  <div className="text-2xl font-semibold text-default">{card.value}</div>
                  {card.helper ? (
                    <div className="text-xs text-muted mt-1">{card.helper}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-default">Unit Value Over Time</div>
                  <div className="text-xs text-muted">Meeting history (per-meeting NAV per unit)</div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'unit_value'
                          ? [`$${Number(value).toFixed(4)}`, 'Unit value']
                          : [value, name]
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="unit_value"
                      stroke="rgb(59,130,246)"
                      strokeWidth={2}
                      dot={false}
                      name="Unit value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-default">Portfolio Value Over Time</div>
                  <div className="text-xs text-muted">Meeting history (total club portfolio at each meeting)</div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="portfolioValueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(59,130,246)" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="rgb(59,130,246)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'portfolio_total_value'
                          ? [formatCurrencyShort(value), 'Portfolio value']
                          : [value, name]
                      }
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="portfolio_total_value"
                      stroke="rgb(59,130,246)"
                      strokeWidth={2}
                      fill="url(#portfolioValueGradient)"
                      name="Portfolio value"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-default">Stock vs Cash Breakdown</div>
                  <div className="text-xs text-muted">Meeting history of portfolio mix</div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        [formatCurrencyShort(value), name === 'stock_value' ? 'Stock' : 'Cash']
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="stock_value"
                      stackId="a"
                      fill="rgb(59,130,246)"
                      name="Stock"
                    />
                    <Bar
                      dataKey="cash_credit_union"
                      stackId="a"
                      fill="rgb(16,185,129)"
                      name="Credit union"
                    />
                    <Bar
                      dataKey="cash_schwab"
                      stackId="a"
                      fill="rgb(234,179,8)"
                      name="Schwab cash"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-default">Dues & Contributions</div>
                  <div className="text-xs text-muted">Meeting history of member contributions</div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'total_member_contribution') {
                          return [formatCurrencyShort(value), 'Member contributions']
                        }
                        if (name === 'total_dues_paid') {
                          return [formatCurrencyShort(value), 'Dues paid']
                        }
                        if (name === 'total_dues_owed') {
                          return [formatCurrencyShort(value), 'Dues owed']
                        }
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="total_member_contribution"
                      fill="rgb(59,130,246)"
                      name="Contributions"
                    />
                    <Bar
                      dataKey="total_dues_paid"
                      fill="rgb(16,185,129)"
                      name="Dues paid"
                    />
                    <Bar
                      dataKey="total_dues_owed"
                      fill="rgb(239,68,68)"
                      name="Dues owed"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section>
            <div className="card rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-default">
                    Top Holders at Latest Meeting
                  </div>
                  <div className="text-xs text-muted">
                    {latestMeeting
                      ? `As of ${formatMonthLabel(latestMeeting.report_month)}`
                      : 'No latest meeting found'}
                  </div>
                </div>
              </div>
              {(!latestMembers || latestMembers.length === 0) ? (
                <div className="text-sm text-muted py-4">
                  No member breakdown found for the latest meeting.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted border-b border-border">
                        <th className="text-left py-2 pr-2">Member</th>
                        <th className="text-right py-2 px-2">Units</th>
                        <th className="text-right py-2 px-2">Portfolio</th>
                        <th className="text-right py-2 pl-2">Ownership</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestMembers.slice(0, 10).map(m => (
                        <tr key={m.id} className="border-b border-border/40 last:border-b-0">
                          <td className="py-2 pr-2 text-default">{m.member_name}</td>
                          <td className="py-2 px-2 text-right text-default">
                            {m.total_units ? Number(m.total_units).toFixed(3) : '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-default">
                            {m.portfolio_value ? formatCurrencyShort(m.portfolio_value) : '—'}
                          </td>
                          <td className="py-2 pl-2 text-right text-default">
                            {m.ownership_pct_of_club ? formatPercent(m.ownership_pct_of_club) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </Page>
  )
}

export default AdminDashboard_Hero
