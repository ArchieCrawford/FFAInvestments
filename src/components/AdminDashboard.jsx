
import React from 'react'
import { useDashboard } from '../lib/queries'

export default function AdminDashboard() {
  const { data, isLoading, error } = useDashboard()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  const org = data?.org_balance || {}
  const stats = data?.member_stats || {}
  const nav = data?.unit_valuation || {}

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-4 grid-cols-1">
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Assets Under Management</div>
          <div className="text-2xl font-bold">${org.total_value?.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '—'}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Total Members</div>
          <div className="text-2xl font-bold">{stats.member_count ?? '—'}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Total Units</div>
          <div className="text-2xl font-bold">{stats.total_member_units?.toLocaleString('en-US', { minimumFractionDigits: 4 }) ?? '—'}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Unit Price</div>
          <div className="text-2xl font-bold">${nav.unit_value?.toLocaleString('en-US', { minimumFractionDigits: 4 }) ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}
