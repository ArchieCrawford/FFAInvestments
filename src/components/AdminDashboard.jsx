import React from 'react'
import { useDashboard } from '../lib/queries'
import { Page } from '../components/Page'

export default function AdminDashboard() {
  const { data, isLoading, error } = useDashboard()

  if (isLoading) {
    return (
      <Page title="Admin Dashboard" subtitle="Club overview and quick actions">
        <div className="text-center py-12 text-muted">Loading dashboard...</div>
      </Page>
    )
  }

  if (error) {
    return (
      <Page title="Admin Dashboard" subtitle="Club overview and quick actions">
        <div className="card p-6 bg-red-50 border-red-200">
          <div className="text-red-800">Error loading dashboard: {error.message}</div>
        </div>
      </Page>
    )
  }

  const org = data?.org_balance || {}
  const stats = data?.member_stats || {}
  const nav = data?.unit_valuation || {}

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)

  return (
    <Page 
      title="Admin Dashboard"
      subtitle="Club overview and quick actions"
    >
      <div className="grid gap-6 md:grid-cols-4 grid-cols-1">
        <div className="card p-6 bg-primary-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Assets Under Management</p>
              <p className="text-3xl font-bold text-default mt-2">
                {formatCurrency(org.total_value)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Members</p>
              <p className="text-3xl font-bold text-default mt-2">{stats.member_count ?? '—'}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Units</p>
              <p className="text-3xl font-bold text-default mt-2">
                {stats.total_member_units?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? '—'}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Unit Price</p>
              <p className="text-3xl font-bold text-default mt-2">
                {formatCurrency(nav.unit_value)}
                <span className="badge ml-2 text-xs">Current</span>
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
      </div>
    </Page>
  )
}
