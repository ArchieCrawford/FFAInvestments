import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  BarChart,  Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'

const fmt$ = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`

const fmt$short = (n) => {
  const v = Number(n || 0)
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

const fmtPct = (n) => `${(Number(n || 0) * 100).toFixed(2)}%`

const ASSET_KEYS = [
  ['stock_value',       'Stocks',      '#3b82f6'],
  ['cash_credit_union', 'Cash (CU)',   '#10b981'],
  ['cash_schwab',       'Cash (Schwab)', '#06b6d4'],
  ['mm_schwab',         'MM (Schwab)', '#8b5cf6'],
  ['gold_schwab',       'Gold',        '#f59e0b'],
  ['other_value',       'Other',       '#6b7280'],
]

const fetchSnapshots = async () => {
  const { data, error } = await supabase
    .from('monthly_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: true })
  if (error) throw error
  return data || []
}

const fetchMemberSeries = async (memberId) => {
  if (!memberId) return []
  const { data, error } = await supabase
    .from('monthly_member_view')
    .select('snapshot_date, month_label, current_portfolio, ownership_pct, new_val_unit_total, total_contribution')
    .eq('member_id', memberId)
    .order('snapshot_date', { ascending: true })
  if (error) throw error
  return data || []
}

const ChartCard = ({ title, subtitle, children, height = 260 }) => (
  <div className="card p-4">
    <div className="mb-3">
      <div className="font-semibold text-default">{title}</div>
      {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
    </div>
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  </div>
)

// =============================================================================
// CLUB-WIDE charts (admin dashboard, unit price page)
// =============================================================================

export function ClubGrowthCharts({ compact = false }) {
  const { data: snaps = [], isLoading, error } = useQuery(
    ['monthly_snapshots_for_charts'],
    fetchSnapshots
  )

  const series = useMemo(
    () =>
      snaps.map((s) => ({
        month: s.month_label,
        date: s.snapshot_date,
        total_value: Number(s.total_value || 0),
        unit_value: Number(s.unit_value || 0),
        units: Number(s.new_total_val_units || 0),
        stock_value:        Number(s.stock_value || 0),
        cash_credit_union:  Number(s.cash_credit_union || 0),
        cash_schwab:        Number(s.cash_schwab || 0),
        mm_schwab:          Number(s.mm_schwab || 0),
        gold_schwab:        Number(s.gold_schwab || 0),
        other_value:        Number(s.other_value || 0),
      })),
    [snaps]
  )

  const stats = useMemo(() => {
    if (series.length === 0) return null
    const first = series[0]
    const last = series[series.length - 1]
    const totalGrowth = first.total_value > 0
      ? (last.total_value - first.total_value) / first.total_value
      : 0
    const unitGrowth = first.unit_value > 0
      ? (last.unit_value - first.unit_value) / first.unit_value
      : 0
    return {
      first, last,
      totalGrowth,
      unitGrowth,
      months: series.length,
    }
  }, [series])

  if (error) {
    return (
      <div className="card p-4 border border-red-500/30 bg-red-500/5 text-sm">
        <div className="font-semibold text-red-500">Failed to load history</div>
        <div className="text-muted">{error.message}</div>
      </div>
    )
  }
  if (isLoading) {
    return <div className="card p-4 text-sm text-muted">Loading history…</div>
  }
  if (series.length === 0) {
    return (
      <div className="card p-4 text-sm text-muted">
        No monthly history yet. Add a snapshot in <a className="underline" href="/admin/history">/admin/history</a>.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label={`Total Value (${stats.last.month})`} value={fmt$(stats.last.total_value)} />
          <Stat
            label={`Growth since ${stats.first.month}`}
            value={fmtPct(stats.totalGrowth)}
            color={stats.totalGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}
          />
          <Stat label="Unit Value (latest)" value={fmt$(stats.last.unit_value)} />
          <Stat
            label="Unit Value Growth"
            value={fmtPct(stats.unitGrowth)}
            color={stats.unitGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}
          />
        </div>
      )}

      <ChartCard
        title="Club Total Value Over Time"
        subtitle={`${series.length} months · from ${series[0].month} to ${series[series.length - 1].month}`}
        height={compact ? 220 : 300}
      >
        <AreaChart data={series} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="totalValGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={fmt$short} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => fmt$(v)} />
          <Area type="monotone" dataKey="total_value" name="Total Value"
            stroke="#3b82f6" strokeWidth={2} fill="url(#totalValGrad)" />
        </AreaChart>
      </ChartCard>

      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Unit Value Over Time" subtitle="Total Value ÷ Total Units">
            <LineChart data={series} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${Number(v).toFixed(2)}`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `$${Number(v).toFixed(4)}`} />
              <Line type="monotone" dataKey="unit_value" name="Unit Value"
                stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Asset Breakdown Over Time" subtitle="Stacked by source">
            <BarChart data={series} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmt$short} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt$(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {ASSET_KEYS.map(([k, label, color]) => (
                <Bar key={k} dataKey={k} stackId="a" name={label} fill={color} />
              ))}
            </BarChart>
          </ChartCard>
        </div>
      )}

      {!compact && (
        <ChartCard title="Total Val. Units Over Time" subtitle="Total units outstanding">
          <LineChart data={series} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="units" name="Units" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>
      )}
    </div>
  )
}

const Stat = ({ label, value, color }) => (
  <div className="card p-3">
    <div className="text-xs uppercase text-muted">{label}</div>
    <div className={`text-xl font-semibold ${color || 'text-default'}`}>{value}</div>
  </div>
)

// =============================================================================
// MEMBER charts (member dashboard)
// =============================================================================

export function MemberGrowthCharts({ memberId }) {
  const { data: rows = [], isLoading, error } = useQuery(
    ['member_history_charts', memberId],
    () => fetchMemberSeries(memberId),
    { enabled: !!memberId }
  )

  const series = useMemo(
    () =>
      rows.map((r) => ({
        month: r.month_label,
        date: r.snapshot_date,
        portfolio: Number(r.current_portfolio || 0),
        contribution: Number(r.total_contribution || 0),
        units: Number(r.new_val_unit_total || 0),
        ownership: Number(r.ownership_pct || 0),
      })),
    [rows]
  )

  const stats = useMemo(() => {
    if (series.length === 0) return null
    const first = series[0]
    const last = series[series.length - 1]
    const gain = last.portfolio - last.contribution
    const gainPct = last.contribution > 0 ? gain / last.contribution : 0
    const portfolioGrowth = first.portfolio > 0
      ? (last.portfolio - first.portfolio) / first.portfolio
      : 0
    return { first, last, gain, gainPct, portfolioGrowth }
  }, [series])

  if (!memberId) return null
  if (error) {
    return (
      <div className="card p-4 border border-red-500/30 bg-red-500/5 text-sm">
        <div className="font-semibold text-red-500">Failed to load your history</div>
        <div className="text-muted">{error.message}</div>
      </div>
    )
  }
  if (isLoading) return <div className="card p-4 text-sm text-muted">Loading your history…</div>
  if (series.length === 0) {
    return <div className="card p-4 text-sm text-muted">No history yet for this account.</div>
  }

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Current Portfolio" value={fmt$(stats.last.portfolio)} />
          <Stat label="Total Contributed" value={fmt$(stats.last.contribution)} />
          <Stat
            label="Unrealized Gain"
            value={`${fmt$(stats.gain)} (${fmtPct(stats.gainPct)})`}
            color={stats.gain >= 0 ? 'text-emerald-500' : 'text-red-500'}
          />
          <Stat label="Ownership %" value={fmtPct(stats.last.ownership)} />
        </div>
      )}

      <ChartCard
        title="My Portfolio Value Over Time"
        subtitle={`${series.length} months · contribution overlay`}
        height={300}
      >
        <AreaChart data={series} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="memPortGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={fmt$short} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => fmt$(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="portfolio" name="Portfolio" stroke="#10b981" strokeWidth={2} fill="url(#memPortGrad)" />
          <Line type="monotone" dataKey="contribution" name="Contribution" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </AreaChart>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="My Ownership %" subtitle="Share of club">
          <LineChart data={series} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${(v * 100).toFixed(2)}%`} />
            <Line type="monotone" dataKey="ownership" name="Ownership" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title="My Val. Units">
          <LineChart data={series} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="units" name="Units" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>
      </div>
    </div>
  )
}
