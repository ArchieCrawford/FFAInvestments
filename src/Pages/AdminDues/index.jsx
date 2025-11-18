import React, { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, DollarSign, Download, Eye, EyeOff, TrendingUp, Users } from 'lucide-react'
import { readMemberDuesFromExcel } from '../../utils/memberDuesExcel'

const DuesTracker = () => {
  const [duesData, setDuesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedMembers, setExpandedMembers] = useState(new Set())
  const [selectedMonths, setSelectedMonths] = useState(12)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await readMemberDuesFromExcel()
      if (!result.success) {
        setError(result.error)
      } else {
        setDuesData(result)
        setError(null)
      }
      setLoading(false)
    }
    load()
  }, [selectedMonths])

  const toggleMemberDetails = (name) => {
    const next = new Set(expandedMembers)
    if (next.has(name)) {
      next.delete(name)
    } else {
      next.add(name)
    }
    setExpandedMembers(next)
  }

  const statusBadge = (status) => {
    const map = {
      current: { label: 'Current', color: '#22c55e' },
      overpaid: { label: 'Overpaid', color: '#3b82f6' },
      owes_money: { label: 'Owes Money', color: '#f87171' },
      credit_balance: { label: 'Credit', color: '#fbbf24' }
    }
    return map[status] || { label: 'Current', color: '#94a3b8' }
  }

  const formatAmount = (amount) => {
    if (amount > 0) return { text: `$${amount.toFixed(2)}`, color: '#f87171' }
    if (amount < 0) return { text: `-$${(amount * -1).toFixed(2)}`, color: '#4ade80' }
    return { text: '$0.00', color: '#cbd5f5' }
  }

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner-page" />
      </div>
    )
  }

  if (error || !duesData) {
    return (
      <div className="app-page">
        <div className="card">
          <div className="card-header">
            <p className="heading-md">Dues Tracker</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={20} style={{ color: '#f87171' }} />
            <p className="text-muted">{error || 'Member dues information is currently unavailable.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const summary = [
    { label: 'Total Members', value: duesData.summary.total_members, icon: <Users size={20} /> },
    {
      label: 'Total Payments',
      value: `$${duesData.summary.total_payments_collected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: <DollarSign size={20} />
    },
    {
      label: 'Overpayments',
      value: duesData.summary.members_with_overpayments,
      icon: <TrendingUp size={20} />
    },
    {
      label: 'Members Owing',
      value: duesData.summary.members_owing_money,
      icon: <AlertTriangle size={20} />
    }
  ]

  return (
    <div className="app-page">
      <div className="card">
        <div className="card-header">
          <div>
            <p className="heading-lg">Member Dues Management</p>
            <p className="text-muted">Track payments, overpayments, and outstanding balances</p>
          </div>
          <div className="pill">
            <Download size={16} />
            Export
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[1, 3, 6, 12].map((months) => (
            <button
              key={months}
              className={`btn btn-pill ${selectedMonths === months ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedMonths(months)}
            >
              Last {months} Month{months > 1 && 's'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {summary.map((item) => (
          <div className="card" key={item.label} style={{ padding: '1.5rem' }}>
            <div className="pill">{item.icon}</div>
            <p className="text-muted">{item.label}</p>
            <p className="heading-md">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <p className="heading-md">Member Details</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>Member</th>
                <th>Status</th>
                <th>Amount Owed</th>
                <th>Total Payments</th>
                <th>Total Contribution</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {duesData.members.map((member) => {
                const amount = formatAmount(member.amount_owed)
                const badge = statusBadge(member.latest_status)
                return (
                  <React.Fragment key={member.member_name}>
                    <tr>
                      <td>{member.member_name}</td>
                      <td>
                        <span className="pill" style={{ color: badge.color }}>{badge.label}</span>
                      </td>
                      <td style={{ color: amount.color }}>{amount.text}</td>
                      <td>${member.total_payments.toFixed(2)}</td>
                      <td>${member.total_contribution.toFixed(2)}</td>
                      <td>
                        <button className="btn btn-outline btn-sm btn-pill" onClick={() => toggleMemberDetails(member.member_name)}>
                          {expandedMembers.has(member.member_name) ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </td>
                    </tr>
                    {expandedMembers.has(member.member_name) && (
                      <tr>
                        <td colSpan={6} style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            {member.monthly_details.map((month) => (
                              <div key={month.month} style={{ minWidth: '160px' }}>
                                <p className="text-muted">{month.month}</p>
                                <p style={{ color: month.payment > 0 ? '#4ade80' : '#f87171' }}>
                                  Paid: ${month.payment.toFixed(2)}
                                </p>
                                <p style={{ color: month.owed > 0 ? '#f87171' : '#cbd5f5' }}>
                                  Balance: ${month.owed.toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DuesTracker
