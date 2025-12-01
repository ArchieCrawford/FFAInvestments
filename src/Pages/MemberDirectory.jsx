import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'

const fetchDirectoryData = async () => {
  const [{ data: members, error: membersError }, { data: snapshots, error: snapsError }] =
    await Promise.all([
      supabase
        .from('members')
        .select('id, member_name, email, is_active, deleted_at')
        .order('member_name', { ascending: true }),
      supabase.from('member_latest_snapshot').select('*'),
    ])

  if (membersError) throw membersError
  if (snapsError) throw snapsError

  const activeMembers = (members || []).filter(
    (m) => m.is_active && !m.deleted_at
  )

  const snapshotByMemberId = new Map()
  ;(snapshots || []).forEach((snap) => {
    if (snap.member_id) {
      snapshotByMemberId.set(snap.member_id, snap)
    }
  })

  return activeMembers.map((m) => ({
    ...m,
    snapshot: snapshotByMemberId.get(m.id) || null,
  }))
}

const MemberDirectory = () => {
  const {
    data: directory = [],
    isLoading,
    isError,
    error,
  } = useQuery(['member_directory'], fetchDirectoryData)

  return (
    <Page
      title="Member Directory"
      subtitle="See who’s in FFA and their current share of the club."
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="card p-4 text-sm text-muted">Loading directory…</div>
        )}

        {isError && (
          <div className="card p-4 text-sm text-default border border-border bg-primary-soft">
            Error loading directory: {error?.message || 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-default">
                  Active members
                </div>
                <div className="text-xs text-muted">
                  {directory.length} member{directory.length === 1 ? '' : 's'} listed.
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/60">
              {directory.map((m) => {
                const snap = m.snapshot
                const ownershipPct = snap?.ownership_pct_of_club
                return (
                  <div
                    key={m.id}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-default">
                        {m.member_name}
                      </div>
                      <div className="text-xs text-muted">
                        {m.email || 'No email on file'}
                      </div>
                    </div>
                    <div className="text-right">
                      {snap ? (
                        <>
                          <div className="text-xs text-default">
                            Value:{' '}
                            <span className="font-semibold">
                              $
                              {Number(snap.portfolio_value || 0).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 2 }
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-muted">
                            Ownership:{' '}
                            {ownershipPct != null
                              ? `${(ownershipPct * 100).toFixed(2)}%`
                              : '—'}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-muted">
                          No valuation history yet
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}

export default MemberDirectory
