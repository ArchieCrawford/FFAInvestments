// Legacy: client-side mock for member dues data moved to legacy folder on 2025-11-21
// Kept for historical/reference purposes only — the runtime now queries `ffa_timeline`.

// Lightweight client-side mock for member dues data.
// This module intentionally returns a shaped object that matches what
// AdminDues expects (summary + members array) so the UI can render
// even when a server-side import pipeline isn't available.

const realMemberData = [
  { member_name: 'Burrell, Felecia', payment_status: 'Credit Balance', latest_amount_owed: -230, total_payments: 5000, total_contribution: 29189.3 },
  { member_name: 'Kirby, Phillip J. Jr.', payment_status: 'Owes Money', latest_amount_owed: 100, total_payments: 1300, total_contribution: 22109.3 },
  { member_name: 'Mauney, Larry', payment_status: 'Credit Balance', latest_amount_owed: -6050, total_payments: 0, total_contribution: 33709.3 },
  { member_name: 'Sharpe, Tim', payment_status: 'Owes Money', latest_amount_owed: 1000, total_payments: 0, total_contribution: 19671.3 },
  { member_name: 'Cheatham, Davy', payment_status: 'Credit Balance', latest_amount_owed: -1210, total_payments: 400, total_contribution: 20797.3 },
  { member_name: 'Crawford, Archie', payment_status: 'Current', latest_amount_owed: 0, total_payments: 12000, total_contribution: 35000 },
  { member_name: 'Davis, Michael', payment_status: 'Current', latest_amount_owed: 0, total_payments: 8500, total_contribution: 28500 },
  { member_name: 'Johnson, Sarah', payment_status: 'Owes Money', latest_amount_owed: 150, total_payments: 7200, total_contribution: 24800 },
  { member_name: 'Williams, Robert', payment_status: 'Credit Balance', latest_amount_owed: -450, total_payments: 9800, total_contribution: 31200 }
]

export async function readMemberDuesFromExcel() {
  try {
    // Build members array in the shape AdminDues expects
    const months = ['Nov 2025', 'Oct 2025', 'Sep 2025', 'Aug 2025', 'Jul 2025', 'Jun 2025']

    const members = realMemberData.map(m => {
      // Map payment_status strings to internal status codes
      let status = 'current'
      if (m.payment_status === 'Owes Money') status = 'owes_money'
      if (m.payment_status === 'Credit Balance') status = 'overpaid'

      // Simulate monthly details array for each member
      const monthly_details = months.map(month => {
        const base = 100
        let paid = base
        let owed = 0
        if (m.payment_status === 'Owes Money') {
          paid = Math.random() > 0.5 ? base * 0.5 : 0
          owed = base - paid
        } else if (m.payment_status === 'Credit Balance') {
          paid = base + Math.round(Math.random() * 50)
          owed = base - paid
        }
        return {
          month,
          payment: paid,
          owed,
          dues_paid_formatted: `$${paid.toFixed(2)}`,
          dues_owed_formatted: owed > 0 ? `$${owed.toFixed(2)}` : owed < 0 ? `($${Math.abs(owed).toFixed(2)})` : '$0.00'
        }
      })

      return {
        member_name: m.member_name,
        latest_status: status,
        amount_owed: m.latest_amount_owed,
        total_payments: m.total_payments,
        total_contribution: m.total_contribution,
        monthly_details
      }
    })

    const totalMembers = members.length
    const totalPaymentsCollected = members.reduce((s, m) => s + (m.total_payments || 0), 0)
    const membersWithOverpayments = members.filter(m => m.latest_status === 'overpaid').length
    const membersOwingMoney = members.filter(m => m.latest_status === 'owes_money').length

    return {
      success: true,
      summary: {
        total_members: totalMembers,
        real_members: totalMembers,
        total_payments_collected: totalPaymentsCollected,
        members_with_overpayments: membersWithOverpayments,
        members_owing_money: membersOwingMoney
      },
      members,
      months_processed: months,
      processing_date: new Date().toISOString(),
      data_source: 'Mocked client-side Excel data'
    }
  } catch (error) {
    return { success: false, error: error?.message || String(error) }
  }
}

export default { readMemberDuesFromExcel }
