import ExcelJS from 'exceljs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

function monthLabel(dateString) {
  const d = new Date(dateString)
  const month = d.toLocaleString('en-US', { month: 'short' })
  const year = d.getFullYear()
  return `${month} ${year}`
}

async function fetchMeetings() {
  const { data, error } = await supabase
    .from('meeting_reports')
    .select('*')
    .order('report_month', { ascending: true })
  if (error) throw error
  return data
}

async function fetchMembersForMeeting(meetingId) {
  const { data, error } = await supabase
    .from('meeting_report_members')
    .select('*')
    .eq('meeting_report_id', meetingId)
    .order('member_name', { ascending: true })
  if (error) throw error
  return data
}

function addTopBlock(ws, meeting) {
  ws.getCell('A1').value = 'Stock Value:'
  ws.getCell('B1').value = meeting.stock_value

  ws.getCell('A2').value = 'Cash (Credit Union):'
  ws.getCell('B2').value = meeting.cash_credit_union

  ws.getCell('A3').value = 'Cash (Charles Schwab)'
  ws.getCell('B3').value = meeting.cash_schwab

  ws.getCell('A4').value = 'MM (Charles Schwab)'
  ws.getCell('B4').value = meeting.cash_schwab_mm

  ws.getCell('A5').value = 'Total Value'
  ws.getCell('B5').value = meeting.cash_total_value

  ws.getCell('A6').value = 'New Total Val. Units'
  ws.getCell('B6').value = meeting.portfolio_total_value

  ws.getCell('A7').value = 'New Total Val. Units'
  ws.getCell('B7').value = meeting.total_units_outstanding

  ws.getCell('A8').value = 'New Unit Value:'
  ws.getCell('B8').value = meeting.unit_value
}

function addMemberTable(ws, members, meeting) {
  const headerRowIndex = 10
  const headers = [
    'Member',
    '',
    'Dues Paid + Buyout',
    'Dues Owed',
    'Total Contribution',
    'Previous Val. Units',
    'Val. Units Added',
    'New Val Unit Total',
    'Current Portfolio',
    '%'
  ]

  const headerRow = ws.getRow(headerRowIndex)
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h
  })

  let rowIndex = headerRowIndex + 1
  let totals = {
    dues_paid_buyout: 0,
    dues_owed: 0,
    total_contribution: 0,
    previous_units: 0,
    units_added: 0,
    total_units: 0,
    portfolio_value: 0
  }

  for (const m of members) {
    const row = ws.getRow(rowIndex)
    row.getCell(1).value = m.member_name
    row.getCell(3).value = m.dues_paid_buyout
    row.getCell(4).value = m.dues_owed
    row.getCell(5).value = m.total_contribution
    row.getCell(6).value = m.previous_units
    row.getCell(7).value = m.units_added
    row.getCell(8).value = m.total_units
    row.getCell(9).value = m.portfolio_value
    row.getCell(10).value = m.ownership_pct_of_club

    totals.dues_paid_buyout += m.dues_paid_buyout || 0
    totals.dues_owed += m.dues_owed || 0
    totals.total_contribution += m.total_contribution || 0
    totals.previous_units += m.previous_units || 0
    totals.units_added += m.units_added || 0
    totals.total_units += m.total_units || 0
    totals.portfolio_value += m.portfolio_value || 0

    rowIndex++
  }

  const totalsRow = ws.getRow(rowIndex)
  totalsRow.getCell(1).value = 'Totals'
  totalsRow.getCell(3).value = totals.dues_paid_buyout
  totalsRow.getCell(4).value = totals.dues_owed
  totalsRow.getCell(5).value = totals.total_contribution
  totalsRow.getCell(6).value = totals.previous_units
  totalsRow.getCell(7).value = totals.units_added
  totalsRow.getCell(8).value = totals.total_units
  totalsRow.getCell(9).value = totals.portfolio_value
  totalsRow.getCell(10).value = 1
}

async function exportHistory() {
  const meetings = await fetchMeetings()
  const workbook = new ExcelJS.Workbook()

  for (const meeting of meetings) {
    const sheetName = monthLabel(meeting.report_month)
    const ws = workbook.addWorksheet(sheetName)
    addTopBlock(ws, meeting)
    const members = await fetchMembersForMeeting(meeting.id)
    addMemberTable(ws, members, meeting)
  }

  const outFile = 'ffa_meeting_history_export.xlsx'
  await workbook.xlsx.writeFile(outFile)
}

exportHistory().catch(err => {
  console.error(err)
  process.exit(1)
})
