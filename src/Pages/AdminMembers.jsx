import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../supabase'

const fetchMembers = async () => {
  const { data, error } = await supabase
    .from('admin_members_overview')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) throw error
  return data
}

const AdminMembers = () => {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ full_name: '', email: '' })

  const { data: members, isLoading, isError } = useQuery(['admin_members'], fetchMembers)

  const updateMemberMutation = useMutation(
    async ({ id, full_name, email }) => {
      const { error } = await supabase
        .from('members')
        .update({ full_name, email })
        .eq('id', id)
      if (error) throw error
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin_members'])
        setEditing(null)
      },
    }
  )

  const deleteMemberMutation = useMutation(
    async (id) => {
      const { error } = await supabase
        .from('members')
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin_members'])
      },
    }
  )

  if (isLoading) return <div className="p-6">Loading members…</div>
  if (isError) return <div className="p-6 text-red-600">Error loading members.</div>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Members</h1>

      <table className="min-w-full text-sm border rounded-xl overflow-hidden bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-right">Value</th>
            <th className="px-3 py-2 text-right">Units</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const isEditing = editing === m.id
            return (
              <tr key={m.id} className="border-t">
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      className="w-full border rounded px-2 py-1 text-xs"
                      value={form.full_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, full_name: e.target.value }))
                      }
                    />
                  ) : (
                    m.full_name
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      className="w-full border rounded px-2 py-1 text-xs"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  ) : (
                    m.email
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {m.portfolio_value != null
                    ? `$${Number(m.portfolio_value).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}`
                    : '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  {m.total_units != null
                    ? Number(m.total_units).toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })
                    : '—'}
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        className="text-xs px-2 py-1 rounded bg-emerald-600 text-white"
                        onClick={() =>
                          updateMemberMutation.mutate({
                            id: m.id,
                            full_name: form.full_name,
                            email: form.email,
                          })
                        }
                      >
                        Save
                      </button>
                      <button
                        className="text-xs px-2 py-1 rounded bg-gray-200"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="text-xs px-2 py-1 rounded bg-blue-600 text-white"
                        onClick={() => {
                          setEditing(m.id)
                          setForm({ full_name: m.full_name || '', email: m.email || '' })
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs px-2 py-1 rounded bg-red-600 text-white"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete member ${m.full_name}? This will deactivate them.`
                            )
                          ) {
                            deleteMemberMutation.mutate(m.id)
                          }
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default AdminMembers
