// src/Pages/MemberDashboard.jsx

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

const fetchMemberHistory = async ({ memberId, memberName }) => {
  let query = supabase
    .from('member_growth_over_time')
    .select('*')
    .order('report_month', { ascending: true })

  if (memberId) {
    query = query.eq('member_id', memberId)
  } else {
    query = query.eq('member_name', memberName)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

const MemberDashboard = ({ memberId, memberName }) => {
  const {
    data: history,
    isLoading,
    isError,
  } = useQuery(
    ['member_growth', memberId || memberName],
    () => fetchMemberHistory({ memberId, memberName }),
    { enabled: Boolean(memberId || memberName) }
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-sm font-semibold">Loading your dashboard…</div>
      </div>
    )
  }

  if (isError || !history || history.length === 0) {
    return (
      <div className="p-6">
        <div className="text-sm font-semibold">
          No valuation history available yet.
        </div>
      </div>
    )
  }

  const latest = history[history.length - 1]

  const totalValue = latest.portfolio_value || 0
  const totalUnits = latest.total_units || 0
  const totalContribution = latest.total_contribution || 0
  const growthAmount = latest.growth_amount || 0
  const growthPct = latest.growth_pct || 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {latest.member_name}
        </h1>
        <p className="text-xs text-gray-500">
          This is your personal FFA dashboard, built from the same meeting
          reports as the club dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-[11px] font-medium text-gray-500">
            Your Portfolio Value
          </div>
          <div className="mt-1 text-xl font-bold">
            ${Number(totalValue).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-[11px] font-medium text-gray-500">
            Units Owned
          </div>
          <div className="mt-1 text-xl font-bold">
            {Number(totalUnits).toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-[11px] font-medium text-gray-500">
            Total Contributed
          </div>
          <div className="mt-1 text-xl font-bold">
            ${Number(totalContribution).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-[11px] font-medium text-gray-500">
            Latest Change
          </div>
          <div className="mt-1 text-xl font-bold">
            {growthAmount >= 0 ? '+' : '-'}$
            {Math.abs(growthAmount).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
          <div
            className={
              'mt-1 text-[11px] ' +
              (growthPct >= 0 ? 'text-emerald-600' : 'text-red-600')
            }
          >
            {growthPct >= 0 ? '▲' : '▼'}{' '}
            {(growthPct * 100).toFixed(2)}% vs last meeting
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold">
          Your Portfolio Over Time
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
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
                  if (name === 'portfolio_value') {
                    return [
                      `$${Number(value).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}`,
                      'Portfolio',
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
                dataKey="portfolio_value"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                name="Portfolio"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default MemberDashboard
