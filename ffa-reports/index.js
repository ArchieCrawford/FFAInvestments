/**
 * FFA Reports — CSV → HTML report + per-member email.
 *
 * Usage:
 *   node index.js                # build report + send personalized emails
 *   node index.js --no-send      # build HTML only (no emails)
 *   node index.js --operator     # build + email one consolidated report
 *                                  to OPERATOR_EMAIL only
 *
 * Inputs:
 *   input/report.csv             (or pass --in <path>)
 * Outputs:
 *   output/report.html
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import csv from 'csv-parser'
import nodemailer from 'nodemailer'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---- args ----
const argv = process.argv.slice(2)
const argVal = (flag, fallback) => {
  const i = argv.indexOf(flag)
  return i >= 0 ? argv[i + 1] : fallback
}
const flag = (name) => argv.includes(name)

const NO_SEND = flag('--no-send') || /^true$/i.test(process.env.DRY_RUN || '')
const OPERATOR_ONLY = flag('--operator')
const INPUT = path.resolve(
  __dirname,
  argVal('--in', 'input/report.csv')
)
const OUTPUT = path.resolve(__dirname, argVal('--out', 'output/report.html'))

if (!fs.existsSync(INPUT)) {
  console.error(`✗ Input CSV not found: ${INPUT}`)
  console.error('  Drop your file at input/report.csv or pass --in <path>')
  process.exit(1)
}
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })

// ---- helpers ----
const fmtMoney = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
const fmtNum = (n, d = 2) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: d })

const pickKey = (row, keys) => {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== '') return row[k]
  }
  return null
}

const parseNum = (v) => {
  if (v == null) return 0
  const n = Number(String(v).replace(/[$,%\s]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// ---- read CSV ----
const members = []

fs.createReadStream(INPUT)
  .pipe(csv())
  .on('data', (row) => {
    const name = pickKey(row, [
      'member_name',
      'Member_Name',
      'name',
      'Name',
      'Sender',
    ])
    if (!name) return // skip blank rows / summary rows

    members.push({
      name: String(name).trim(),
      email: pickKey(row, ['email', 'Email']) || null,
      value: parseNum(
        pickKey(row, ['portfolio_value', 'Portfolio_Value', 'value', 'Value'])
      ),
      units: parseNum(
        pickKey(row, ['total_units', 'Total_Units', 'units', 'Units'])
      ),
      pct: parseNum(
        pickKey(row, ['ownership_pct', 'Ownership_Pct', 'pct', 'percent'])
      ),
    })
  })
  .on('end', run)
  .on('error', (err) => {
    console.error('✗ CSV read error:', err.message)
    process.exit(1)
  })

async function run() {
  if (members.length === 0) {
    console.error('✗ No member rows found in CSV.')
    process.exit(1)
  }

  const totalValue = members.reduce((s, m) => s + m.value, 0)
  const totalUnits = members.reduce((s, m) => s + m.units, 0)

  // recompute ownership % if missing/zero
  for (const m of members) {
    if (!m.pct && totalValue > 0) m.pct = (m.value / totalValue) * 100
  }

  const html = generateHTML(members, { totalValue, totalUnits })
  fs.writeFileSync(OUTPUT, html)
  console.log(`✓ Wrote ${OUTPUT} (${members.length} members, ${fmtMoney(totalValue)} total)`)

  if (NO_SEND) {
    console.log('• --no-send / DRY_RUN set — skipping email')
    return
  }

  await sendEmails(members, { totalValue, totalUnits })
}

// ---- HTML ----
function generateHTML(members, totals) {
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const rows = members
    .slice()
    .sort((a, b) => b.value - a.value)
    .map(
      (m) => `
      <tr>
        <td>${escapeHtml(m.name)}</td>
        <td style="text-align:right">${fmtMoney(m.value)}</td>
        <td style="text-align:right">${fmtNum(m.units)}</td>
        <td style="text-align:right">${fmtNum(m.pct, 2)}%</td>
      </tr>`
    )
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>FFA Investments Report — ${today}</title>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 820px; margin: 32px auto; padding: 0 16px; color: #1f2937; }
    h1 { margin-bottom: 4px; }
    .subtitle { color: #6b7280; margin-top: 0; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 24px 0; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: #f9fafb; }
    .card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
    .card .value { font-size: 22px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; text-align: left; font-size: 13px; }
    tfoot td { font-weight: 600; background: #f9fafb; }
    .footer { margin-top: 32px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>FFA Investments Report</h1>
  <p class="subtitle">${today}</p>

  <div class="summary">
    <div class="card">
      <div class="label">Total Club Value</div>
      <div class="value">${fmtMoney(totals.totalValue)}</div>
    </div>
    <div class="card">
      <div class="label">Total Units</div>
      <div class="value">${fmtNum(totals.totalUnits)}</div>
    </div>
    <div class="card">
      <div class="label">Members</div>
      <div class="value">${members.length}</div>
    </div>
  </div>

  <h2>Member Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th style="text-align:right">Value</th>
        <th style="text-align:right">Units</th>
        <th style="text-align:right">% Ownership</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
    <tfoot>
      <tr>
        <td>Total</td>
        <td style="text-align:right">${fmtMoney(totals.totalValue)}</td>
        <td style="text-align:right">${fmtNum(totals.totalUnits)}</td>
        <td style="text-align:right">100%</td>
      </tr>
    </tfoot>
  </table>

  <p class="footer">Generated by ffa-reports • ${new Date().toISOString()}</p>
</body>
</html>`
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---- email ----
async function sendEmails(members, totals) {
  const { EMAIL, PASSWORD, FROM_NAME, OPERATOR_EMAIL } = process.env
  if (!EMAIL || !PASSWORD) {
    console.error(
      '✗ EMAIL / PASSWORD missing in .env — skipping send (use --no-send to silence).'
    )
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL, pass: PASSWORD },
  })
  const from = FROM_NAME ? `"${FROM_NAME}" <${EMAIL}>` : EMAIL

  if (OPERATOR_ONLY || (OPERATOR_EMAIL && OPERATOR_EMAIL.trim())) {
    const to = OPERATOR_EMAIL || EMAIL
    const html = fs.readFileSync(OUTPUT, 'utf-8')
    const info = await transporter.sendMail({
      from,
      to,
      subject: `FFA Investments Report — ${new Date().toLocaleDateString()}`,
      html,
    })
    console.log(`✓ Operator email sent → ${to} (id=${info.messageId})`)
    return
  }

  let sent = 0
  let skipped = 0
  for (const m of members) {
    if (!m.email) {
      skipped++
      continue
    }
    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;max-width:600px">
        <h2>Your FFA Investments Summary</h2>
        <p>Hi ${escapeHtml(m.name.split(/[, ]+/)[0])},</p>
        <p>Here's your latest snapshot from the club:</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb"><b>Name</b></td>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${escapeHtml(m.name)}</td></tr>
          <tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb"><b>Value</b></td>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${fmtMoney(m.value)}</td></tr>
          <tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb"><b>Units</b></td>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${fmtNum(m.units)}</td></tr>
          <tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb"><b>Ownership</b></td>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${fmtNum(m.pct, 2)}%</td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px"><b>Club total:</b> ${fmtMoney(totals.totalValue)} across ${members.length} members.</p>
        <p style="color:#9ca3af;font-size:12px">Sent by FFA Investments • ${new Date().toLocaleDateString()}</p>
      </div>`
    try {
      await transporter.sendMail({
        from,
        to: m.email,
        subject: 'FFA Monthly Investment Report',
        html,
      })
      sent++
      console.log(`  ✓ sent → ${m.email}`)
    } catch (err) {
      console.error(`  ✗ failed → ${m.email}: ${err.message}`)
    }
  }
  console.log(`✓ Done. Sent ${sent}, skipped ${skipped} (no email).`)
}
