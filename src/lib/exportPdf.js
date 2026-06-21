import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── palette ────────────────────────────────────────────────────────────────
const C = {
  navy:   [15,  40,  80],
  gold:   [180, 140, 60],
  green:  [34,  139, 34],
  red:    [180, 40,  40],
  mid:    [90,  105, 120],
  light:  [230, 235, 240],
  white:  [255, 255, 255],
  black:  [20,  20,  20],
}

const fmt$ = (n) =>
  '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtPct = (n) =>
  (Number(n || 0) * 100).toFixed(2) + '%'

// ── shared helpers ──────────────────────────────────────────────────────────

function header(doc, title, subtitle, dateStr) {
  const W = doc.internal.pageSize.getWidth()

  // navy banner
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, W, 28, 'F')

  // gold accent bar
  doc.setFillColor(...C.gold)
  doc.rect(0, 28, W, 3, 'F')

  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('FFA Investments', 14, 11)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 14, 19)

  doc.setFontSize(8)
  doc.setTextColor(...C.gold)
  doc.text(dateStr || '', W - 14, 19, { align: 'right' })

  if (subtitle) {
    doc.setTextColor(200, 210, 220)
    doc.setFontSize(8)
    doc.text(subtitle, 14, 26)
  }

  doc.setTextColor(...C.black)
  return 38 // y position after header
}

function metricCards(doc, y, cards) {
  const W  = doc.internal.pageSize.getWidth()
  const M  = 14
  const gap = 4
  const n   = cards.length
  const cw  = (W - M * 2 - gap * (n - 1)) / n

  cards.forEach(({ label, value, sub }, i) => {
    const x = M + i * (cw + gap)
    doc.setFillColor(...C.light)
    doc.roundedRect(x, y, cw, 20, 2, 2, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.mid)
    doc.text(label.toUpperCase(), x + 6, y + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...C.navy)
    doc.text(value, x + 6, y + 13)

    if (sub) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...C.mid)
      doc.text(sub, x + 6, y + 18)
    }
  })

  return y + 26
}

function sectionTitle(doc, y, text) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C.navy)
  doc.text(text, 14, y)
  doc.setDrawColor(...C.gold)
  doc.setLineWidth(0.5)
  doc.line(14, y + 1.5, doc.internal.pageSize.getWidth() - 14, y + 1.5)
  return y + 7
}

// Draw a horizontal bar chart
function barChart(doc, y, data, totalValue, maxBarWidth) {
  const M      = 14
  const LW     = 52  // label column width
  const BAR_H  = 5
  const ROW_H  = 8
  const BW     = maxBarWidth || (doc.internal.pageSize.getWidth() - M * 2 - LW - 30)

  data.forEach(({ label, value, pct }, i) => {
    const rowY  = y + i * ROW_H
    const barW  = totalValue > 0 ? (value / totalValue) * BW : 0

    // label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.black)
    const shortLabel = label.length > 20 ? label.slice(0, 19) + '…' : label
    doc.text(shortLabel, M, rowY + BAR_H - 1)

    // bar bg
    doc.setFillColor(...C.light)
    doc.rect(M + LW, rowY, BW, BAR_H, 'F')

    // bar fill
    doc.setFillColor(...C.navy)
    doc.rect(M + LW, rowY, Math.max(barW, 0.5), BAR_H, 'F')

    // value label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.mid)
    doc.text(
      `${fmt$(value)}  ${(pct * 100).toFixed(1)}%`,
      M + LW + BW + 2, rowY + BAR_H - 1
    )
  })

  return y + data.length * ROW_H + 4
}

// Draw a simple pie-like donut (sectors approximated as arcs)
function donutChart(doc, cx, cy, r, slices) {
  let startAngle = -Math.PI / 2
  const colors = [
    C.navy, C.gold, [70, 130, 180], [34, 139, 34], [180, 70, 40],
    [128, 0, 128], [0, 128, 128], [200, 80, 20], [60, 60, 180],
  ]

  slices.forEach(({ pct }, i) => {
    const sweep = pct * 2 * Math.PI
    const endAngle = startAngle + sweep
    const mid = startAngle + sweep / 2
    const color = colors[i % colors.length]

    // draw filled sector using polygon approximation
    const steps = Math.max(4, Math.round(sweep * 20))
    const pts = [[cx, cy]]
    for (let s = 0; s <= steps; s++) {
      const a = startAngle + (s / steps) * sweep
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
    }

    doc.setFillColor(...color)
    doc.setDrawColor(...C.white)
    doc.setLineWidth(0.3)

    // Use lines to approximate the sector
    doc.lines(
      pts.slice(1).map((p, j) => {
        const prev = pts[j]
        return [p[0] - prev[0], p[1] - prev[1]]
      }),
      pts[0][0], pts[0][1], [1, 1], 'FD', false
    )

    startAngle = endAngle
  })

  // white inner circle (donut hole)
  doc.setFillColor(...C.white)
  doc.circle(cx, cy, r * 0.52, 'F')
}

function footer(doc) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.mid)
    doc.text(
      `FFA Investments — Confidential   |   Generated ${new Date().toLocaleDateString()}`,
      14, H - 6
    )
    doc.text(`Page ${i} of ${pages}`, W - 14, H - 6, { align: 'right' })
    doc.setDrawColor(...C.light)
    doc.setLineWidth(0.3)
    doc.line(14, H - 9, W - 14, H - 9)
  }
}

// ── HISTORY PDF ─────────────────────────────────────────────────────────────

export function exportHistoryPdf(snapshot, entries) {
  if (!snapshot) return
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  let y = header(
    doc,
    `Monthly Report — ${snapshot.month_label}`,
    'Partner Capital Account Summary',
    new Date().toLocaleDateString()
  )

  // metrics
  y = metricCards(doc, y, [
    { label: 'Total Portfolio Value', value: fmt$(snapshot.total_value) },
    { label: 'Unit Value',            value: fmt$(snapshot.unit_value) },
    { label: 'Total Units',           value: Number(snapshot.new_total_val_units || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) },
    { label: 'Members',               value: String(entries.length) },
  ])

  // asset breakdown
  y = sectionTitle(doc, y, 'Asset Allocation')

  const assetRows = [
    { label: 'Stock Value',           value: Number(snapshot.stock_value || 0) },
    { label: 'Cash — Credit Union',   value: Number(snapshot.cash_credit_union || 0) },
    { label: 'Cash — Schwab',         value: Number(snapshot.cash_schwab || 0) },
    { label: 'Money Market (Schwab)', value: Number(snapshot.mm_schwab || 0) },
    { label: 'Gold (Schwab)',         value: Number(snapshot.gold_schwab || 0) },
    { label: 'Other',                 value: Number(snapshot.other_value || 0) },
  ].filter(r => r.value > 0)

  const totalAssets = Number(snapshot.total_value || 0)
  y = barChart(doc, y, assetRows.map(r => ({ ...r, pct: totalAssets > 0 ? r.value / totalAssets : 0 })), totalAssets)

  // member allocation chart
  y = sectionTitle(doc, y + 2, 'Partner Portfolio Allocation')

  const sorted = [...entries].sort((a, b) => Number(b.current_portfolio || 0) - Number(a.current_portfolio || 0))
  const chartData = sorted.map(e => ({
    label: e.member_name || e.member_name_raw || '—',
    value: Number(e.current_portfolio || 0),
    pct:   totalAssets > 0 ? Number(e.current_portfolio || 0) / totalAssets : 0,
  }))

  y = barChart(doc, y, chartData, totalAssets)

  // member table
  y = sectionTitle(doc, y + 2, 'Partner Detail')

  const tableRows = sorted.map(e => [
    e.member_name || e.member_name_raw || '—',
    fmt$(e.dues_paid_buyout),
    fmt$(e.dues_owed),
    fmt$(e.total_contribution),
    Number(e.previous_val_units || 0).toFixed(4),
    Number(e.val_units_added  || 0).toFixed(4),
    Number(e.new_val_unit_total || 0).toFixed(4),
    fmt$(e.current_portfolio),
    fmtPct(e.ownership_pct),
  ])

  // totals row
  const totContrib  = entries.reduce((s, e) => s + Number(e.total_contribution || 0), 0)
  const totUnits    = entries.reduce((s, e) => s + Number(e.new_val_unit_total  || 0), 0)
  const totPortfolio = entries.reduce((s, e) => s + Number(e.current_portfolio  || 0), 0)

  autoTable(doc, {
    startY: y,
    head: [['Partner', 'Dues Paid', 'Dues Owed', 'Contribution', 'Prev Units', 'Units Added', 'Total Units', 'Portfolio', '%']],
    body: tableRows,
    foot: [['Totals', '', '', fmt$(totContrib), '', '', totUnits.toFixed(4), fmt$(totPortfolio), '100.00%']],
    styles: { fontSize: 6.5, cellPadding: 1.5, textColor: C.black },
    headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 7 },
    footStyles: { fillColor: C.light, textColor: C.navy, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
      8: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  footer(doc)
  doc.save(`FFA-${snapshot.month_label.replace(/\s+/g, '-')}-Report.pdf`)
}

// ── POSITIONS PDF ────────────────────────────────────────────────────────────

export function exportPositionsPdf(positions, totalMarketValue, latestDate) {
  if (!positions?.length) return
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  const W   = doc.internal.pageSize.getWidth()

  const dateStr = latestDate
    ? new Date(latestDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString()

  let y = header(doc, 'Portfolio Holdings', `Schwab Positions as of ${dateStr}`, dateStr)

  // counts
  const gainers = positions.filter(p => {
    const gl = Number(p.market_value || 0) - Number(p.cost_basis || 0)
    return p.cost_basis && gl > 0
  }).length
  const losers = positions.filter(p => {
    const gl = Number(p.market_value || 0) - Number(p.cost_basis || 0)
    return p.cost_basis && gl < 0
  }).length

  y = metricCards(doc, y, [
    { label: 'Total AUM',   value: fmt$(totalMarketValue), sub: `as of ${dateStr}` },
    { label: 'Positions',   value: String(positions.length) },
    { label: 'Gainers',     value: String(gainers),  sub: 'vs cost basis' },
    { label: 'Losers',      value: String(losers),   sub: 'vs cost basis' },
  ])

  // donut chart + legend side by side
  y = sectionTitle(doc, y, 'Portfolio Allocation')

  const sorted   = [...positions].sort((a, b) => Number(b.market_value || 0) - Number(a.market_value || 0))
  const top8     = sorted.slice(0, 8)
  const otherVal = sorted.slice(8).reduce((s, p) => s + Number(p.market_value || 0), 0)
  const sliceData = [
    ...top8.map(p => ({ label: p.symbol, value: Number(p.market_value || 0) })),
    ...(otherVal > 0 ? [{ label: 'Other', value: otherVal }] : []),
  ].map(s => ({ ...s, pct: totalMarketValue > 0 ? s.value / totalMarketValue : 0 }))

  const chartColors = [
    C.navy, C.gold, [70, 130, 180], [34, 139, 34], [180, 70, 40],
    [128, 0, 128], [0, 128, 128], [200, 80, 20], C.mid,
  ]

  const CX = 60, CY = y + 28, R = 22
  donutChart(doc, CX, CY, R, sliceData)

  // center label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.navy)
  doc.text(fmt$(totalMarketValue), CX, CY - 2, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...C.mid)
  doc.text('Total AUM', CX, CY + 3, { align: 'center' })

  // legend
  const LX = CX + R + 10
  sliceData.forEach(({ label, value, pct }, i) => {
    const ly = y + i * 7
    doc.setFillColor(...(chartColors[i % chartColors.length]))
    doc.rect(LX, ly, 4, 4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...C.black)
    doc.text(label, LX + 6, ly + 3.2)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.mid)
    doc.text(`${fmt$(value)}  (${(pct * 100).toFixed(1)}%)`, LX + 22, ly + 3.2)
  })

  y = CY + R + 8

  // positions table
  y = sectionTitle(doc, y, 'Holdings Detail')

  const tableRows = sorted.map(p => {
    const mv        = Number(p.market_value || 0)
    const cb        = Number(p.cost_basis   || 0)
    const gl        = cb > 0 ? mv - cb : null
    const glPct     = cb > 0 ? (gl / cb) * 100 : null
    const pctTotal  = totalMarketValue > 0 ? (mv / totalMarketValue) * 100 : 0
    const arrow     = gl === null ? '—' : gl >= 0 ? '▲' : '▼'
    const glStr     = gl === null ? '—' : `${arrow} ${fmt$(Math.abs(gl))}  (${Math.abs(glPct).toFixed(2)}%)`

    return [
      p.symbol || '—',
      p.description || '—',
      p.asset_type || '—',
      Number(p.long_quantity || p.quantity || 0).toLocaleString(),
      fmt$(p.average_price || p.price || 0),
      fmt$(mv),
      cb > 0 ? fmt$(cb) : '—',
      glStr,
      pctTotal.toFixed(2) + '%',
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Symbol', 'Description', 'Type', 'Qty', 'Price', 'Market Value', 'Cost Basis', 'Gain / Loss', '% of Total']],
    body: tableRows,
    foot: [['', 'TOTAL', '', '', '', fmt$(totalMarketValue), '', '', '100.00%']],
    styles: { fontSize: 6.5, cellPadding: 1.5, textColor: C.black },
    headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 7 },
    footStyles: { fillColor: C.light, textColor: C.navy, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 18 },
      1: { cellWidth: 50 },
      2: { cellWidth: 18 },
      3: { halign: 'right', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 28 },
      7: { halign: 'right', cellWidth: 36 },
      8: { halign: 'right', cellWidth: 18 },
    },
    didParseCell(data) {
      // colour the gain/loss column by sign
      if (data.section === 'body' && data.column.index === 7) {
        const txt = String(data.cell.raw || '')
        if (txt.startsWith('▲')) data.cell.styles.textColor = C.green
        else if (txt.startsWith('▼')) data.cell.styles.textColor = C.red
      }
    },
    margin: { left: 14, right: 14 },
  })

  footer(doc)
  const datePart = latestDate ? new Date(latestDate).toISOString().split('T')[0] : 'latest'
  doc.save(`FFA-Positions-${datePart}.pdf`)
}
