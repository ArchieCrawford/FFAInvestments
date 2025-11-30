// src/Pages/AdminDashboard_Hero.jsx

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const fetchClubGrowth = async () => {
  const { data, error } = await supabase
    .from('club_growth_over_time')
    .select('*')
    .order('report_month', { ascending: true })

  if (error) throw error

  return data.map(row => ({
    ...row,
    report_month: row.report_month,
  }))
}

const fetchMemberSnapshots = async () => {
  const { data, error } = await supabase
    .from('member_growth_over_time')
    .select('*')

  if (error) throw error

  const latestByMember = new Map()

  for (const row of data) {
    const key = row.member_id || row.member_name
    const existing = latestByMember.get(key)
    if (!existing || row.report_month > existing.report_month) {
      latestByMember.set(key, row)
    }
  }

  return Array.from(latestByMember.values())
}

const AdminDashboard_Hero = () => {
  const {
    data: clubData,
    isLoading: clubLoading,
    isError: clubError,
  } = useQuery(['club_growth'], fetchClubGrowth)

  const {
    data: memberSnapshots,
    isLoading: membersLoading,
    isError: membersError,
  } = useQuery(['member_latest_snapshots'], fetchMemberSnapshots)

  if (clubLoading || membersLoading) {
    return (
      <div className="p-8">
        <div className="text-lg font-semibold">Loading dashboard…</div>
      </div>
    )
  }

  if (clubError || membersError) {
    return (
      <div className="p-8">
        <div className="text-lg font-semibold text-red-600">
          Error loading dashboard.
        </div>
      </div>
    )
  }

  const latest = clubData[clubData.length - 1]

  const totalMembers = memberSnapshots.length
  const totalAUM = latest?.portfolio_total_value || 0
  const latestGrowthAmount = latest?.growth_amount || 0
  const latestGrowthPct = latest?.growth_pct || 0
  const unitPrice = latest?.unit_value || 0

  const topMembers = [...memberSnapshots]
    .sort((a, b) => (b.portfolio_value || 0) - (a.portfolio_value || 0))
    .slice(0, 5)

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            FFA Hero Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Overview of the club and growth over time.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">
            Assets Under Management
          </div>
          <div className="mt-2 text-2xl font-bold">
            ${totalAUM.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Unit price: ${unitPrice.toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">
            Members
          </div>
          <div className="mt-2 text-2xl font-bold">
            {totalMembers}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            With current valuation history
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">
            Latest Growth
          </div>
          <div className="mt-2 text-2xl font-bold">
            {latestGrowthAmount >= 0 ? '+' : '-'}$
            {Math.abs(latestGrowthAmount).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
          <div
            className={
              'mt-1 text-xs ' +
              (latestGrowthPct >= 0 ? 'text-emerald-600' : 'text-red-600')
            }
          >
            {latestGrowthPct >= 0 ? '▲' : '▼'}{' '}
            {(latestGrowthPct * 100).toFixed(2)}% vs last meeting
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">
            Total Units Outstanding
          </div>
          <div className="mt-2 text-2xl font-bold">
            {latest?.total_units_outstanding?.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            }) || '0'}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Based on latest meeting report
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">
              Club Value Over Time
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={clubData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="report_month"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      year: '2-digit',
                    })
                  }
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    `$${(value / 1000).toFixed(0)}k`
                  }
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'portfolio_total_value') {
                      return [
                        `$${Number(value).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}`,
                        'Total Value',
                      ]
                    }
                    if (name === 'growth_pct') {
                      return [
                        `${(Number(value) * 100).toFixed(2)}%`,
                        'Growth %',
                      ]
                    }
                    return [value, name]
                  }}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })
                  }
                />
                <Line
                  type="monotone"
                  dataKey="portfolio_total_value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name="Total Value"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">
            Top Members by Portfolio
          </div>
          <div className="space-y-2">
            {topMembers.map((m) => (
              <div
                key={m.member_id || m.member_name}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
              >
                <div>
                  <div className="text-xs font-medium">
                    {m.member_name}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {(m.ownership_pct_of_club * 100).toFixed(2)}% of club
                  </div>
                </div>
                <div className="text-xs font-semibold">
                  $
                  {Number(m.portfolio_value || 0).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
            {!topMembers.length && (
              <div className="text-xs text-gray-500">
                No member data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard_Hero
