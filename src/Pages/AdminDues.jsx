import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'

const fetchDuesData = async () => {
  const [{ data: members, error: membersError }, { data: dues, error: duesError }] =
    await Promise.all([
      supabase
        .from('members')
        .select('id, member_name, email, is_active, deleted_at')
        .order('member_name', { ascending: true }),
      supabase.from('member_latest_dues').select('*'),
    ])

  if (membersError) throw membersError
  if (duesError) throw duesError

  const activeMembers = (members || []).filter(
    (m) => m.is_active && !m.deleted_at
  )

  const duesByMemberId = new Map()
  ;(dues || []).forEach((d) => {
    if (d.member_id) {
      duesByMemberId.set(d.member_id, d)
    }
  })

  return activeMembers.map((m) => ({
    ...m,
    dues: duesByMemberId.get(m.id) || null,
  }))
}

const AdminDues = () => {
  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery(['admin_dues'], fetchDuesData)

  return (
    <Page
      title="Member Dues"
      subtitle="Track latest dues, buy-ins, and contributions from the dues table."
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
                            ? `$${Number(d.dues_paid_buyout || 0).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 2 }
                              )}`
                            : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-default">
                          {d
                            ? `$${Number(d.dues_owed_oct_25 || 0).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 2 }
                              )}`
                            : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-default">
                          {d
                            ? `$${Number(d.total_contribution || 0).toLocaleString(
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
