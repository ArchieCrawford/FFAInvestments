import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getMemberTimeline } from '../lib/ffaApi'
import { Page } from '../components/Page'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
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

function formatDateLabel(d) {
  try {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

async function fetchSelfMemberData() {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  const user = authData?.user
  if (!user) throw new Error('No authenticated user')

  const { data: account, error: accountError } = await supabase
    .from('member_accounts')
    .select('*')
    .eq('email', user.email)
    .eq('is_active', true)
    .maybeSingle()
  if (accountError) throw accountError
  if (!account) throw new Error('No member account found for this login')

  const timeline = await getMemberTimeline(account.member_id)

  const { data: meetingRows, error: meetingError } = await supabase
    .from('meeting_report_members')
    .select('*, meeting_reports(report_month, unit_value)')
    .eq('member_name', account.member_name)
    .order('created_at', { ascending: true })
  if (meetingError) throw meetingError

  return {
    account,
    timeline: timeline || [],
    meetingRows: meetingRows || [],
  }
}

const MemberDashboardNew = () => {
  const { profile } = useAuth()

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['member_dashboard_self'],
    queryFn: fetchSelfMemberData,
    enabled: !!profile,
  })

  const account = data?.account || null
  const timeline = data?.timeline || []
  const meetingRows = data?.meetingRows || []

  const latestTimeline = timeline.length > 0 ? timeline[timeline.length - 1] : null

  const chartTimeline = useMemo(
    () =>
      (timeline || []).map(row => ({
        report_date: row.report_date,
        label: formatDateLabel(row.report_date),
        portfolio_value: numberOrNull(row.portfolio_value),
        total_units: numberOrNull(row.total_units),
        total_contribution: numberOrNull(row.total_contribution),
        growth_amount: numberOrNull(row.growth_amount),
        growth_pct: numberOrNull(row.growth_pct),
      })),
    [timeline],
  )

  const meetingSeries = useMemo(
    () =>
      (meetingRows || []).map(row => ({
        id: row.id,
        label: row.meeting_reports?.report_month
          ? formatDateLabel(row.meeting_reports.report_month)
          : '',
        report_month: row.meeting_reports?.report_month || null,
        dues_paid_buyout: numberOrNull(row.dues_paid_buyout),
        dues_owed: numberOrNull(row.dues_owed),
        total_contribution: numberOrNull(row.total_contribution),
        previous_units: numberOrNull(row.previous_units),
        units_added: numberOrNull(row.units_added),
        total_units: numberOrNull(row.total_units),
        portfolio_value: numberOrNull(row.portfolio_value),
        ownership_pct_of_club: numberOrNull(row.ownership_pct_of_club),
      })),
    [meetingRows],
  )

  const latestMeeting = meetingSeries.length > 0 ? meetingSeries[meetingSeries.length - 1] : null

  const overviewCards = [
    {
      label: 'Current Portfolio Value',
      value: latestTimeline
        ? formatCurrencyShort(latestTimeline.portfolio_value)
        : account
        ? formatCurrencyShort(account.current_value)
        : '—',
      helper: latestTimeline ? formatDateLabel(latestTimeline.report_date) : '',
    },
    {
      label: 'Units Owned',
      value: latestTimeline
        ? Number(latestTimeline.total_units || 0).toFixed(3)
        : account
        ? Number(account.current_units || 0).toFixed(3)
        : '—',
      helper: latestMeeting && latestMeeting.units_added
        ? `+${Number(latestMeeting.units_added).toFixed(3)} last meeting`
        : '',
    },
    {
      label: 'Ownership in Club',
      value: latestMeeting && latestMeeting.ownership_pct_of_club
        ? formatPercent(latestMeeting.ownership_pct_of_club)
        : account && account.ownership_percentage
        ? formatPercent(account.ownership_percentage)
        : '—',
      helper: latestMeeting
        ? `As of ${latestMeeting.label || 'latest meeting'}`
        : '',
    },
    {
      label: 'Total Contributed',
      value: latestTimeline && latestTimeline.total_contribution
        ? formatCurrencyShort(latestTimeline.total_contribution)
        : account
        ? formatCurrencyShort(account.total_contributions)
        : '—',
      helper: latestMeeting && latestMeeting.dues_owed
        ? `${formatCurrencyShort(latestMeeting.dues_owed)} dues outstanding last meeting`
        : '',
    },
  ]

  return (
    <Page
      title="My Dashboard"
      subtitle="See how your ownership in the club has grown over time."
    >
      {error && (
        <div className="card mb-4 bg-primary-soft border border-border text-default p-3 rounded-xl">
          {error.message || String(error)}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-muted text-sm">Loading your dashboard…</div>
      ) : !account ? (
        <div className="py-16 text-center text-muted text-sm">
          No member account is linked to this login yet.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {overviewCards.map(card => (
                <div
                  key={card.label}
                  className="card rounded-xl border border-border bg-surface p-4 flex flex-col gap-1"
                >
                  <div className="text-xs uppercase tracking-wide text-muted">
                    {card.label}
                  </div>
                  <div className="text-2xl font-semibold text-default">
                    {card.value}
                  </div>
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
                  <div className="text-sm font-medium text-default">Portfolio Value Over Time</div>
                  <div className="text-xs text-muted">
                    Monthly snapshots of your account value
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartTimeline}>
                    <defs>
                      <linearGradient id="memberPortfolioGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(59,130,246)" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="rgb(59,130,246)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'portfolio_value'
                          ? [formatCurrencyShort(value), 'Portfolio value']
                          : [value, name]
                      }
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="portfolio_value"
                      stroke="rgb(59,130,246)"
                      strokeWidth={2}
                      fill="url(#memberPortfolioGradient)"
                      name="Portfolio value"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-default">Units & Growth</div>
                  <div className="text-xs text-muted">
                    Units owned and investment growth over time
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartTimeline}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'total_units') {
                          return [Number(value).toFixed(3), 'Total units']
                        }
                        if (name === 'growth_amount') {
                          return [formatCurrencyShort(value), 'Growth amount']
                        }
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total_units"
                      stroke="rgb(16,185,129)"
                      strokeWidth={2}
                      dot={false}
                      name="Total units"
                    />
                    <Line
                      type="monotone"
                      dataKey="growth_amount"
                      stroke="rgb(234,179,8)"
                      strokeWidth={2}
                      dot={false}
                      name="Growth amount"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-default">
                    Dues & Contributions By Meeting
                  </div>
                  <div className="text-xs text-muted">
                    What you paid, owed, and added at each meeting
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={meetingSeries}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'total_contribution') {
                          return [formatCurrencyShort(value), 'Total contribution']
                        }
                        if (name === 'dues_paid_buyout') {
                          return [formatCurrencyShort(value), 'Dues paid']
                        }
                        if (name === 'dues_owed') {
                          return [formatCurrencyShort(value), 'Dues owed']
                        }
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="total_contribution"
                      fill="rgb(59,130,246)"
                      name="Contribution"
                    />
                    <Bar
                      dataKey="dues_paid_buyout"
                      fill="rgb(16,185,129)"
                      name="Dues paid"
                    />
                    <Bar
                      dataKey="dues_owed"
                      fill="rgb(239,68,68)"
                      name="Dues owed"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-default">
                    Meeting Snapshot Details
                  </div>
                  <div className="text-xs text-muted">
                    Your units, value, and ownership per meeting
                  </div>
                </div>
              </div>
              {meetingSeries.length === 0 ? (
                <div className="text-sm text-muted py-4">
                  No meeting snapshots imported yet for your account.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted border-b border-border">
                        <th className="text-left py-2 pr-2">Meeting</th>
                        <th className="text-right py-2 px-2">Units</th>
                        <th className="text-right py-2 px-2">Value</th>
                        <th className="text-right py-2 px-2">Units Added</th>
                        <th className="text-right py-2 pl-2">Ownership</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meetingSeries.map(row => (
                        <tr key={row.id} className="border-b border-border/40 last:border-b-0">
                          <td className="py-2 pr-2 text-default">
                            {row.label || '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-default">
                            {row.total_units !== null
                              ? Number(row.total_units).toFixed(3)
                              : '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-default">
                            {row.portfolio_value !== null
                              ? formatCurrencyShort(row.portfolio_value)
                              : '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-default">
                            {row.units_added !== null
                              ? Number(row.units_added).toFixed(3)
                              : '—'}
                          </td>
                          <td className="py-2 pl-2 text-right text-default">
                            {row.ownership_pct_of_club !== null
                              ? formatPercent(row.ownership_pct_of_club)
                              : '—'}
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

export default MemberDashboardNew
