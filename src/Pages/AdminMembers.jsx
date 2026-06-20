import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'
import { useAuth } from '@/contexts/AuthContext'

const normalizeName = (v) =>
  String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ')

const fetchAdminMembers = async () => {
  const [overviewResult, duesResult, depositsResult] = await Promise.all([
    supabase
      .from('admin_members_overview')
      .select('*')
      .order('member_name', { ascending: true }),
    supabase.from('member_latest_dues').select('*'),
    supabase.from('deposits').select('member_id, sender_name, amount'),
  ])

  const { data, error } = overviewResult
  const { data: dues, error: duesError } = duesResult
  const { data: deposits, error: depositsError } = depositsResult

  if (error) throw error
  if (duesError) throw duesError
  if (depositsError) throw depositsError

  const duesByMemberId = new Map()
  ;(dues || []).forEach((d) => {
    if (d.member_id) duesByMemberId.set(d.member_id, d)
  })

  const depositsByMemberId = new Map()
  const depositsByName = new Map()
  ;(deposits || []).forEach((dep) => {
    const amount = Number(dep.amount || 0)
    if (dep.member_id) {
      depositsByMemberId.set(dep.member_id, (depositsByMemberId.get(dep.member_id) || 0) + amount)
    }
    const senderKey = normalizeName(dep.sender_name)
    if (senderKey) {
      depositsByName.set(senderKey, (depositsByName.get(senderKey) || 0) + amount)
    }
  })

  return (data || []).map((row) => {
    const liveDues = duesByMemberId.get(row.id)
    const baseContribution = Number(liveDues?.total_contribution ?? row.total_contribution ?? 0)
    const depositTotal =
      depositsByMemberId.get(row.id) ||
      depositsByName.get(normalizeName(row.member_name)) ||
      0

    return {
      ...row,
      live_total_contribution: baseContribution + depositTotal,
      live_deposits_total: depositTotal,
    }
  })
}

const AdminMembers = () => {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin'
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ member_name: '', email: '' })

  const {
    data: members = [],
    isLoading,
    isError,
    error,
  } = useQuery(['admin_members'], fetchAdminMembers)

  const maxOwnership = useMemo(() => {
    return members.reduce((max, m) => {
      const v = m.ownership_pct_of_club ?? 0
      return v > max ? v : max
    }, 0)
  }, [members])

  const totals = useMemo(() => {
    return members.reduce(
      (acc, m) => {
        acc.value += Number(m.portfolio_value || 0)
        acc.units += Number(m.total_units || 0)
        acc.contribution += Number(m.live_total_contribution ?? m.total_contribution ?? 0)
        acc.ownership += Number(m.ownership_pct_of_club || 0)
        return acc
      },
      { value: 0, units: 0, contribution: 0, ownership: 0 }
    )
  }, [members])

  const updateMemberMutation = useMutation(
    async ({ id, member_name, email }) => {
      const { error: updateError } = await supabase
        .from('members')
        .update({ member_name, email })
        .eq('id', id)
      if (updateError) throw updateError
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin_members'])
        setEditingId(null)
      },
    }
  )

  const softDeleteMemberMutation = useMutation(
    async (id) => {
      const { error: deleteError } = await supabase
        .from('members')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (deleteError) throw deleteError
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin_members'])
      },
    }
  )

  const startEditing = (member) => {
    if (!canEdit) return

    setEditingId(member.id)
    setForm({
      member_name: member.member_name || '',
      email: member.email || '',
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setForm({ member_name: '', email: '' })
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = (id) => {
    if (!canEdit) return

    updateMemberMutation.mutate({
      id,
      member_name: form.member_name,
      email: form.email,
    })
  }

  const handleSoftDelete = (member) => {
    if (!canEdit) return

    if (
      window.confirm(
        `This will deactivate ${member.member_name} and hide them from member lists. Continue?`
      )
    ) {
      softDeleteMemberMutation.mutate(member.id)
    }
  }

  return (
    <Page
      title="Members"
      subtitle="Manage member profiles and see their latest units, value, and ownership."
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="card p-4 text-sm text-muted">
            Loading members…
          </div>
        )}

        {isError && (
          <div className="card p-4 text-sm text-default border border-border bg-primary-soft">
            Error loading members: {error?.message || 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-default">
                  Member roster
                </div>
                <div className="text-xs text-muted">
                  {members.length} member{members.length === 1 ? '' : 's'} in the system.
                </div>
              </div>
              <div className="hidden sm:block text-xs text-muted">
                Ownership bars are scaled to the largest holder.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted">
                      Email
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
                      Latest Value
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
                      Units
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
                      Contribution
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
                      Ownership
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const isEditing = editingId === m.id
                    const ownershipPct = m.ownership_pct_of_club
                    const ownershipRatio =
                      maxOwnership > 0 && ownershipPct != null
                        ? ownershipPct / maxOwnership
                        : 0

                    return (
                      <tr key={m.id} className="border-b border-border/60">
                        <td className="px-4 py-2">
                          {isEditing ? (
                            <input
                              className="input w-full text-xs"
                              value={form.member_name}
                              onChange={(e) =>
                                handleChange('member_name', e.target.value)
                              }
                            />
                          ) : (
                            <span className="text-default text-sm">
                              {m.member_name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {isEditing ? (
                            <input
                              className="input w-full text-xs"
                              value={form.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                            />
                          ) : (
                            <span className="text-default text-sm">
                              {m.email || '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {m.portfolio_value != null ? (
                            <span className="text-default text-sm">
                              $
                              {Number(m.portfolio_value).toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          ) : (
                            <span className="text-muted text-xs">No data</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {m.total_units != null ? (
                            <span className="text-default text-sm">
                              {Number(m.total_units).toLocaleString(undefined, {
                                maximumFractionDigits: 4,
                              })}
                            </span>
                          ) : (
                            <span className="text-muted text-xs">No data</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="text-default text-sm">
                            ${Number(m.live_total_contribution ?? m.total_contribution ?? 0).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 2 }
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {ownershipPct != null ? (
                            <div className="inline-flex flex-col items-end gap-1">
                              <span className="text-xs text-default">
                                {(ownershipPct * 100).toFixed(2)}%
                              </span>
                              <div className="h-1.5 w-24 bg-border/50 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{
                                    width: `${Math.max(
                                      4,
                                      Math.min(100, ownershipRatio * 100)
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                          {canEdit ? (
                            isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-primary px-3 py-1 text-xs"
                                  onClick={() => handleSave(m.id)}
                                  disabled={updateMemberMutation.isLoading}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="btn-primary-soft px-3 py-1 text-xs"
                                  onClick={cancelEditing}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn-primary-soft px-3 py-1 text-xs"
                                  onClick={() => startEditing(m)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-primary px-3 py-1 text-xs"
                                  onClick={() => handleSoftDelete(m)}
                                  disabled={softDeleteMemberMutation.isLoading}
                                >
                                  Deactivate
                                </button>
                              </>
                            )
                          ) : (
                            <span className="text-muted text-xs">View only</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-primary-soft/30 font-semibold text-default">
                    <td className="px-4 py-2" colSpan={2}>
                      Totals
                    </td>
                    <td className="px-4 py-2 text-right">
                      ${totals.value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {totals.units.toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}
                    </td>
                    <td className="px-4 py-2 text-right">
                      ${totals.contribution.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {(totals.ownership * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}

export default AdminMembers
