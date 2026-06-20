import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'

const normalizeName = (v) =>
  String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ')

const fetchDuesData = async () => {
  const [
    { data: members, error: membersError },
    { data: dues, error: duesError },
    { data: deposits, error: depositsError },
  ] =
    await Promise.all([
      supabase
        .from('members')
        .select('id, member_name, email, is_active, deleted_at')
        .order('member_name', { ascending: true }),
      supabase.from('member_latest_dues').select('*'),
      supabase.from('deposits').select('member_id, sender_name, amount'),
    ])

  if (membersError) throw membersError
  if (duesError) throw duesError
  if (depositsError) throw depositsError

  const activeMembers = (members || []).filter(
    (m) => m.is_active && !m.deleted_at
  )

  const duesByMemberId = new Map()
  ;(dues || []).forEach((d) => {
    if (d.member_id) {
      duesByMemberId.set(d.member_id, d)
    }
  })

  const depositsByMemberId = new Map()
  const depositsBySenderName = new Map()
  ;(deposits || []).forEach((dep) => {
    const amt = Number(dep.amount || 0)
    if (dep.member_id) {
      depositsByMemberId.set(dep.member_id, (depositsByMemberId.get(dep.member_id) || 0) + amt)
    }
    const senderKey = normalizeName(dep.sender_name)
    if (senderKey) {
      depositsBySenderName.set(senderKey, (depositsBySenderName.get(senderKey) || 0) + amt)
    }
  })

  return activeMembers.map((m) => {
    const d = duesByMemberId.get(m.id) || null
    const basePaid = Number(d?.dues_paid_buyout || 0)
    const baseOwed = Number(d?.dues_owed_oct_25 || 0)
    const baseContribution = Number(d?.total_contribution || 0)
    const memberDeposits =
      (depositsByMemberId.get(m.id) || 0) ||
      (depositsBySenderName.get(normalizeName(m.member_name)) || 0)

    return {
      ...m,
      dues: d,
      live_dues_paid_buyout: basePaid + memberDeposits,
      live_dues_owed: baseOwed - memberDeposits,
      live_total_contribution: baseContribution + memberDeposits,
      live_deposits_total: memberDeposits,
    }
  })
}

const AdminDues = () => {
  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery(['admin_dues'], fetchDuesData, {
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  })

  return (
    <Page
      title="Member Dues"
      subtitle="Live dues and contributions using latest dues snapshot + cumulative deposits."
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="card p-4 text-sm text-muted">
            Loading dues data…
          </div>
        )}

        {isError && (
          <div className="card p-4 text-sm text-default border border-border bg-primary-soft">
            Error loading dues: {error?.message || 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-default">
                  Latest dues per member
                </div>
                <div className="text-xs text-muted">
                  Showing the latest entry from member_dues for each active member.
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left font-semibold text-muted">
                      Member
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">
                      Email
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-muted">
                      Dues Paid + Buyout
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-muted">
                      Dues Owed (Oct 25)
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-muted">
                      Total Contribution
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const d = row.dues
                    return (
                      <tr key={row.id} className="border-b border-border/60">
                        <td className="px-4 py-2 text-default">
                          {row.member_name}
                        </td>
                        <td className="px-4 py-2 text-default">
                          {row.email || '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-default">
                          {d
                            ? `$${Number(row.live_dues_paid_buyout || 0).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 2 }
                              )}`
                            : '—'}
                        </td>
                        <td className={`px-4 py-2 text-right ${Number(row.live_dues_owed || 0) < 0 ? 'text-green-500' : Number(row.live_dues_owed || 0) > 0 ? 'text-red-500' : 'text-default'}`}>
                          {d
                            ? `$${Number(row.live_dues_owed || 0).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 2 }
                              )}`
                            : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-default">
                          {d
                            ? `$${Number(row.live_total_contribution || 0).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 2 }
                              )}`
                            : '—'}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted">
                          {d?.dues_recorded_at
                            ? new Date(d.dues_recorded_at).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}

export default AdminDues
