import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Page } from '@/components/Page'

const fetchLoginLogs = async () => {
  const { data, error } = await supabase
    .from('member_login_logs')
    .select(
      'id, login_timestamp, email, was_successful, failure_reason, ip_address, city, region, country, is_active_member, member_account_id'
    )
    .order('login_timestamp', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}
const { error: logErr } = await supabase
  .from('member_login_logs')
  .insert({
    member_id,
    email,
    event_type: 'login_success',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  })

if (logErr) {
  console.error('[login log insert failed]', logErr)
}

const AdminLoginActivity = () => {
  const [emailFilter, setEmailFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('all') // all | success | failed

  const {
    data: logs = [],
    isLoading,
    isError,
    error,
  } = useQuery(['login_activity_logs'], fetchLoginLogs)

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const emailMatch = emailFilter
        ? (log.email || '').toLowerCase().includes(emailFilter.toLowerCase())
        : true
      const resultMatch =
        resultFilter === 'all'
          ? true
          : resultFilter === 'success'
          ? log.was_successful
          : !log.was_successful
      return emailMatch && resultMatch
    })
  }, [logs, emailFilter, resultFilter])

  const totalCount = filteredLogs.length
  const successCount = filteredLogs.filter((l) => l.was_successful).length
  const failedCount = filteredLogs.filter((l) => !l.was_successful).length

  return (
    <Page
      title="Login Activity"
      subtitle="Recent member login attempts with success/failure details."
    >
      <div className="space-y-4">
        <div className="card p-4 flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted">Total loaded</span>
              <span className="text-lg font-semibold text-default">{totalCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Success</span>
              <span className="text-lg font-semibold text-default">{successCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Failed</span>
              <span className="text-lg font-semibold text-default">{failedCount}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <input
                type="text"
                className="input w-full"
                placeholder="Filter by email"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {['all', 'success', 'failed'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`btn-primary-soft px-3 py-2 text-sm ${
                    resultFilter === opt ? 'bg-primary text-white' : ''
                  }`}
                  onClick={() => setResultFilter(opt)}
                >
                  {opt === 'all' ? 'All' : opt === 'success' ? 'Success' : 'Failed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="card p-4 text-sm text-muted">Loading login activity…</div>
        )}

        {isError && (
          <div className="card p-4 text-sm text-default border border-border bg-primary-soft">
            Error loading login logs: {error?.message || 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left font-semibold text-muted">Time</th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">Email</th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">Result</th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">Reason</th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">IP</th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">Location</th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">Active?</th>
                    <th className="px-4 py-2 text-left font-semibold text-muted">Member Account ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/60">
                      <td className="px-4 py-2 text-default">
                        {log.login_timestamp
                          ? new Date(log.login_timestamp).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-4 py-2 text-default">{log.email || '—'}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`badge px-2 py-1 text-xs ${
                            log.was_successful ? 'bg-primary-soft' : ''
                          }`}
                        >
                          {log.was_successful ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-default">
                        {log.failure_reason || '—'}
                      </td>
                      <td className="px-4 py-2 text-default">{log.ip_address || '—'}</td>
                      <td className="px-4 py-2 text-default">
                        {[log.city, log.region, log.country].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-2 text-default">
                        {log.is_active_member === true
                          ? 'Yes'
                          : log.is_active_member === false
                          ? 'No'
                          : 'Unknown'}
                      </td>
                      <td className="px-4 py-2 text-default">
                        <span className="font-mono text-xs">
                          {log.member_account_id || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-center text-muted" colSpan={8}>
                        No login activity matches your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}

export default AdminLoginActivity
