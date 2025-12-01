import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import Page from '../components/Page'
import { useAuth } from '../contexts/AuthContext'

const fetchMemberRecord = async (authUserId) => {
  if (!authUserId) return null

  const { data, error } = await supabase
    .from('members')
    .select('id, member_name, email')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) throw error
  return data
}

const fetchMemberLatestSnapshot = async (memberId) => {
  if (!memberId) return null

  const { data, error } = await supabase
    .from('member_latest_snapshot')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle()

  if (error) throw error
  return data
}

const fetchMemberHistory = async (memberId) => {
  if (!memberId) return []

  const { data, error } = await supabase
    .from('member_growth_over_time')
    .select('*')
    .eq('member_id', memberId)
    .order('report_month', { ascending: true })

  if (error) throw error
  return data || []
}

const MemberDashboard = () => {
  const { user } = useAuth()
  const authUserId = user?.id

  const {
    data: member,
    isLoading: memberLoading,
    isError: memberError,
    error: memberErrorObj,
  } = useQuery(['member_record', authUserId], () => fetchMemberRecord(authUserId), {
    enabled: !!authUserId,
  })

  const memberId = member?.id || null

  const {
    data: latestSnapshot,
    isLoading: latestLoading,
    isError: latestError,
    error: latestErrorObj,
  } = useQuery(
    ['member_latest_snapshot', memberId],
    () => fetchMemberLatestSnapshot(memberId),
    {
      enabled: !!memberId,
    }
  )

  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    error: historyErrorObj,
  } = useQuery(['member_history', memberId], () => fetchMemberHistory(memberId), {
    enabled: !!memberId,
  })

  const anyLoading =
    memberLoading || (memberId && (latestLoading || historyLoading))

  const anyError = memberError || latestError || historyError
  const errorMsg =
    memberErrorObj?.message ||
    latestErrorObj?.message ||
    historyErrorObj?.message ||
    'Unknown error'

  if (!authUserId) {
    return (
      <Page
        title="Member Dashboard"
        subtitle="Sign in to view your portfolio."
      >
        <div className="card p-4 text-sm text-muted">
          You need to be signed in to view this page.
        </div>
      </Page>
    )
  }

  if (anyLoading) {
    return (
      <Page
        title="Member Dashboard"
        subtitle="Loading your portfolio…"
      >
        <div className="card p-4 text-sm text-muted">
          Loading your latest balances and history…
        </div>
      </Page>
    )
  }

  if (anyError) {
    return (
      <Page
        title="Member Dashboard"
        subtitle="We ran into a problem loading your data."
      >
        <div className="card p-4 text-sm text-red-500">
          Error: {errorMsg}
        </div>
      </Page>
    )
  }

  if (!member) {
    return (
      <Page
        title="Member Dashboard"
        subtitle="We could not find a member profile linked to your login."
      >
        <div className="card p-4 text-sm text-muted">
          Your login is not currently linked to a member record. Contact an
          admin so they can link your account.
        </div>
      </Page>
    )
  }

  const latest = latestSnapshot
  const historyRows = history || []

  const portfolioValue = latest?.portfolio_value || 0
  const totalUnits = latest?.total_units || 0
  const totalContribution = latest?.total_contribution || 0
  const ownershipPct = latest?.ownership_pct_of_club || 0

  return (
    <Page
      title="Member Dashboard"
      subtitle={`Welcome back, ${member.member_name}`}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card p-4 space-y-1">
            <div className="text-xs text-muted">Portfolio Value</div>
            <div className="text-xl font-semibold text-default">
              $
              {Number(portfolioValue).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="card p-4 space-y-1">
            <div className="text-xs text-muted">Units Owned</div>
            <div className="text-xl font-semibold text-default">
              {Number(totalUnits).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}
            </div>
          </div>

          <div className="card p-4 space-y-1">
            <div className="text-xs text-muted">Total Contributed</div>
            <div className="text-xl font-semibold text-default">
              $
              {Number(totalContribution).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="card p-4 space-y-1">
            <div className="text-xs text-muted">Ownership of Club</div>
            <div className="text-xl font-semibold text-default">
              {(ownershipPct * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm font-semibold text-default mb-3">
            Valuation history
          </div>
          {historyRows.length === 0 ? (
            <div className="text-xs text-muted">
              No valuation history yet for your member record.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left font-semibold text-muted">
                      Month
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-muted">
                      Portfolio Value
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-muted">
                      Units
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-muted">
                      Total Contribution
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row) => (
                    <tr
                      key={row.report_month}
                      className="border-b border-border/60"
                    >
                      <td className="px-4 py-2 text-default">
                        {new Date(row.report_month).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-2 text-right text-default">
                        $
                        {Number(row.portfolio_value || 0).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 2 }
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-default">
                        {Number(row.total_units || 0).toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}
                      </td>
                      <td className="px-4 py-2 text-right text-default">
                        $
                        {Number(row.total_contribution || 0).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 2 }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}

export default MemberDashboard
