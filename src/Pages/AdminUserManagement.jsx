import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'
import { useAuth } from '@/contexts/AuthContext'

const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('members')
    .select('id, member_name, email, role, status, is_active, deleted_at')
    .order('member_name', { ascending: true })

  if (error) throw error
  return (data || []).filter((m) => !m.deleted_at)
}

const AdminUserManagement = () => {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin'

  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery(['admin_users'], fetchUsers)

  const updateUserMutation = useMutation(
    async ({ id, role, is_active }) => {
      const { error: updateError } = await supabase
        .from('members')
        .update({ role, is_active })
        .eq('id', id)
      if (updateError) throw updateError
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin_users'])
      },
    }
  )

  const handleRoleChange = (user, newRole) => {
    if (!canEdit) return

    updateUserMutation.mutate({
      id: user.id,
      role: newRole,
      is_active: user.is_active,
    })
  }

  const handleActiveToggle = (user, isActive) => {
    if (!canEdit) return

    updateUserMutation.mutate({
      id: user.id,
      role: user.role,
      is_active: isActive,
    })
  }

  return (
    <Page
      title="User Management"
      subtitle="Control member roles and account status."
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="card p-4 text-sm text-muted">Loading users…</div>
        )}

        {isError && (
          <div className="card p-4 text-sm text-default border border-border bg-primary-soft">
            Error loading users: {error?.message || 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-default">
                  Member accounts
                </div>
                <div className="text-xs text-muted">
                  Toggle admin privileges and enable/disable access.
                </div>
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
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted">
                      Role
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-muted">
                      Active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/60">
                      <td className="px-4 py-2">
                        <div className="text-sm text-default">{u.member_name}</div>
                        {u.status && (
                          <div className="text-xs text-muted">Status: {u.status}</div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm text-default">{u.email}</div>
                      </td>
                      <td className="px-4 py-2">
                        {canEdit ? (
                          <select
                            className="input text-xs"
                            value={u.role || 'member'}
                            onChange={(e) =>
                              handleRoleChange(u, e.target.value)
                            }
                            disabled={updateUserMutation.isLoading}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="badge px-3 py-1 text-xs bg-primary-soft">
                            {u.role || 'member'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {canEdit ? (
                          <button
                            type="button"
                            className={
                              'badge px-3 py-1 text-xs ' +
                              (u.is_active ? 'bg-primary-soft' : '')
                            }
                            onClick={() => handleActiveToggle(u, !u.is_active)}
                            disabled={updateUserMutation.isLoading}
                          >
                            {u.is_active ? 'Enabled' : 'Disabled'}
                          </button>
                        ) : (
                          <span className={'badge px-3 py-1 text-xs ' + (u.is_active ? 'bg-primary-soft' : '')}>
                            {u.is_active ? 'Enabled' : 'Disabled'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}

export default AdminUserManagement
