// backend/routes/analytics.js  — ES Module version

import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Load & parse CSV once ────────────────────────────────────────────────────
let STATS = null
let SUMMARY = null

function loadAndCompute() {
  const csvPath = path.join(__dirname, '../data/EchoSense_Comprehensive_Banking_50k.csv')

  if (!fs.existsSync(csvPath)) {
    console.warn('⚠️  Analytics CSV not found at', csvPath)
    return
  }

  const raw = fs.readFileSync(csvPath, 'utf8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true })

  console.log(`✅ Analytics: loaded ${rows.length} rows from CSV`)

  // ── Helpers ──────────────────────────────────────────────────────────────
  const count = (field, val) => rows.filter(r => r[field] === val).length
  const sumField = field => rows.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0)
  const avgField = field => sumField(field) / rows.length

  const groupCount = field =>
    rows.reduce((acc, r) => {
      acc[r[field]] = (acc[r[field]] || 0) + 1
      return acc
    }, {})

  const groupSum = (groupField, sumF) =>
    rows.reduce((acc, r) => {
      acc[r[groupField]] = (acc[r[groupField]] || 0) + (parseFloat(r[sumF]) || 0)
      return acc
    }, {})

  // ── Transaction Analytics ─────────────────────────────────────────────────
  const txByType = groupCount('Transaction Type')
  const txAmountByType = groupSum('Transaction Type', 'Transaction Amount')
  const totalTxAmount = sumField('Transaction Amount')
  const avgTxAmount = totalTxAmount / rows.length

  const monthlyTx = {}
  rows.forEach(r => {
    const d = new Date(r['Transaction Date'])
    if (!isNaN(d)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyTx[key] = (monthlyTx[key] || 0) + 1
    }
  })
  const sortedMonths = Object.keys(monthlyTx)
    .sort()
    .slice(-12)
    .map(m => ({ month: m, count: monthlyTx[m] }))

  // ── Loan Analytics ────────────────────────────────────────────────────────
  const loanByType = groupCount('Loan Type')
  const loanByStatus = groupCount('Loan Status')
  const loanAmountByType = groupSum('Loan Type', 'Loan Amount')
  const totalLoanAmount = sumField('Loan Amount')
  const loanApprovalRate = ((count('Loan Status', 'Approved') / rows.length) * 100).toFixed(1)

  // ── Complaint / Feedback Analytics ───────────────────────────────────────
  const feedbackByType = groupCount('Feedback Type')
  const resolutionByStatus = groupCount('Resolution Status')
  const totalComplaints = count('Feedback Type', 'Complaint')
  const resolvedComplaints = rows.filter(
    r => r['Feedback Type'] === 'Complaint' && r['Resolution Status'] === 'Resolved'
  ).length
  const complaintResolutionRate = ((resolvedComplaints / totalComplaints) * 100).toFixed(1)

  const resolutionByFeedbackType = {}
  ;['Complaint', 'Suggestion', 'Praise'].forEach(type => {
    const total = count('Feedback Type', type)
    const resolved = rows.filter(
      r => r['Feedback Type'] === type && r['Resolution Status'] === 'Resolved'
    ).length
    resolutionByFeedbackType[type] = {
      total,
      resolved,
      rate: total ? ((resolved / total) * 100).toFixed(1) : '0',
    }
  })

  // ── Anomaly Analytics ────────────────────────────────────────────────────
  const anomalyFlagged = count('Anomaly', '-1')
  const anomalyNormal = count('Anomaly', '1')
  const anomalyRate = ((anomalyFlagged / rows.length) * 100).toFixed(2)

  const anomalyByTxType = {}
  rows
    .filter(r => r['Anomaly'] === '-1')
    .forEach(r => {
      anomalyByTxType[r['Transaction Type']] = (anomalyByTxType[r['Transaction Type']] || 0) + 1
    })

  // ── Account / Customer Overview ───────────────────────────────────────────
  const accountByType = groupCount('Account Type')
  const cardByType = groupCount('Card Type')
  const genderBreakdown = groupCount('Gender')
  const avgBalance = avgField('Account Balance').toFixed(2)
  const totalDeposits = rows
    .filter(r => r['Transaction Type'] === 'Deposit')
    .reduce((a, r) => a + (parseFloat(r['Transaction Amount']) || 0), 0)
  const totalWithdrawals = rows
    .filter(r => r['Transaction Type'] === 'Withdrawal')
    .reduce((a, r) => a + (parseFloat(r['Transaction Amount']) || 0), 0)

  // ── Recent Transactions ───────────────────────────────────────────────────
  const recentActivity = rows
    .filter(r => r['Transaction Date'])
    .sort((a, b) => new Date(b['Transaction Date']) - new Date(a['Transaction Date']))
    .slice(0, 10)
    .map(r => ({
      id: r['TransactionID'],
      name: `${r['First Name']} ${r['Last Name']}`,
      type: r['Transaction Type'],
      amount: parseFloat(r['Transaction Amount']).toFixed(2),
      date: r['Transaction Date'],
      accountType: r['Account Type'],
      anomaly: r['Anomaly'] === '-1',
    }))

  // ── Assemble STATS ────────────────────────────────────────────────────────
  STATS = {
    meta: {
      totalCustomers: rows.length,
      generatedAt: new Date().toISOString(),
    },
    transactions: {
      total: rows.length,
      byType: txByType,
      amountByType: Object.fromEntries(
        Object.entries(txAmountByType).map(([k, v]) => [k, parseFloat(v.toFixed(2))])
      ),
      totalAmount: parseFloat(totalTxAmount.toFixed(2)),
      avgAmount: parseFloat(avgTxAmount.toFixed(2)),
      totalDeposits: parseFloat(totalDeposits.toFixed(2)),
      totalWithdrawals: parseFloat(totalWithdrawals.toFixed(2)),
      monthlyVolume: sortedMonths,
    },
    loans: {
      total: rows.length,
      byType: loanByType,
      byStatus: loanByStatus,
      amountByType: Object.fromEntries(
        Object.entries(loanAmountByType).map(([k, v]) => [k, parseFloat(v.toFixed(2))])
      ),
      totalAmount: parseFloat(totalLoanAmount.toFixed(2)),
      approvalRate: parseFloat(loanApprovalRate),
      avgLoanAmount: parseFloat((totalLoanAmount / rows.length).toFixed(2)),
    },
    complaints: {
      total: totalComplaints,
      byType: feedbackByType,
      resolutionByStatus,
      resolutionByFeedbackType,
      complaintResolutionRate: parseFloat(complaintResolutionRate),
      pendingComplaints: rows.filter(
        r => r['Feedback Type'] === 'Complaint' && r['Resolution Status'] === 'Pending'
      ).length,
    },
    anomalies: {
      flagged: anomalyFlagged,
      normal: anomalyNormal,
      rate: parseFloat(anomalyRate),
      byTransactionType: anomalyByTxType,
    },
    accounts: {
      byType: accountByType,
      byCard: cardByType,
      byGender: genderBreakdown,
      avgBalance: parseFloat(avgBalance),
    },
    recentActivity,
  }

  // ── Compact AI summary ────────────────────────────────────────────────────
  SUMMARY = `
[LIVE BANK DATA — Union Bank of India, ${rows.length.toLocaleString()} customers]
Transactions: ${txByType.Deposit || 0} deposits, ${txByType.Withdrawal || 0} withdrawals, ${txByType.Transfer || 0} transfers. Total value: ₹${(totalTxAmount / 1e7).toFixed(1)} crore.
Loans: ${loanByStatus.Approved || 0} approved (${loanApprovalRate}% approval rate), ${loanByStatus.Rejected || 0} rejected, ${loanByStatus.Closed || 0} closed. Avg loan: ₹${(totalLoanAmount / rows.length / 1000).toFixed(1)}K.
Complaints: ${totalComplaints} total, ${complaintResolutionRate}% resolved, ${STATS.complaints.pendingComplaints} pending.
Anomalies: ${anomalyFlagged} flagged transactions (${anomalyRate}% of total).
Accounts: ${accountByType.Savings || 0} savings, ${accountByType.Current || 0} current. Avg balance: ₹${parseFloat(avgBalance).toLocaleString()}.
`.trim()

  console.log('✅ Analytics stats computed and cached.')
}

// Load immediately on import
loadAndCompute()

// ─── Routes ───────────────────────────────────────────────────────────────────

// Full analytics (for Dashboard)
router.get('/', (req, res) => {
  if (!STATS) return res.status(503).json({ error: 'Analytics data not loaded yet.' })
  res.json(STATS)
})

// Compact summary (for AI chat injection)
router.get('/summary', (req, res) => {
  if (!SUMMARY) return res.status(503).json({ error: 'Summary not ready.' })
  res.json({ summary: SUMMARY })
})

// Exported getter used by chat.js
export const getSummary = () => SUMMARY || ''

export default router