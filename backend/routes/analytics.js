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
let ROWS = []   // ← keep full rows in memory for customer lookup

function loadAndCompute() {
  const csvPath = path.join(__dirname, '../data/EchoSense_Comprehensive_Banking_50k.csv')

  if (!fs.existsSync(csvPath)) {
    console.warn('⚠️  Analytics CSV not found at', csvPath)
    return
  }

  const raw = fs.readFileSync(csvPath, 'utf8')
  ROWS = parse(raw, { columns: true, skip_empty_lines: true })

  console.log(`✅ Analytics: loaded ${ROWS.length} rows from CSV`)

  const count = (field, val) => ROWS.filter(r => r[field] === val).length
  const sumField = field => ROWS.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0)
  const avgField = field => sumField(field) / ROWS.length
  const groupCount = field => ROWS.reduce((acc, r) => { acc[r[field]] = (acc[r[field]] || 0) + 1; return acc }, {})
  const groupSum = (groupField, sumF) => ROWS.reduce((acc, r) => { acc[r[groupField]] = (acc[r[groupField]] || 0) + (parseFloat(r[sumF]) || 0); return acc }, {})

  const txByType = groupCount('Transaction Type')
  const txAmountByType = groupSum('Transaction Type', 'Transaction Amount')
  const totalTxAmount = sumField('Transaction Amount')
  const avgTxAmount = totalTxAmount / ROWS.length

  const monthlyTx = {}
  ROWS.forEach(r => {
    const d = new Date(r['Transaction Date'])
    if (!isNaN(d)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyTx[key] = (monthlyTx[key] || 0) + 1
    }
  })
  const sortedMonths = Object.keys(monthlyTx).sort().slice(-12).map(m => ({ month: m, count: monthlyTx[m] }))

  const loanByType = groupCount('Loan Type')
  const loanByStatus = groupCount('Loan Status')
  const loanAmountByType = groupSum('Loan Type', 'Loan Amount')
  const totalLoanAmount = sumField('Loan Amount')
  const loanApprovalRate = ((count('Loan Status', 'Approved') / ROWS.length) * 100).toFixed(1)

  const feedbackByType = groupCount('Feedback Type')
  const resolutionByStatus = groupCount('Resolution Status')
  const totalComplaints = count('Feedback Type', 'Complaint')
  const resolvedComplaints = ROWS.filter(r => r['Feedback Type'] === 'Complaint' && r['Resolution Status'] === 'Resolved').length
  const complaintResolutionRate = totalComplaints
    ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
    : '0.0'

  const resolutionByFeedbackType = {}
  ;['Complaint', 'Suggestion', 'Praise'].forEach(type => {
    const total = count('Feedback Type', type)
    const resolved = ROWS.filter(r => r['Feedback Type'] === type && r['Resolution Status'] === 'Resolved').length
    resolutionByFeedbackType[type] = { total, resolved, rate: total ? ((resolved / total) * 100).toFixed(1) : '0' }
  })

  const anomalyFlagged = count('Anomaly', '-1')
  const anomalyNormal = count('Anomaly', '1')
  const anomalyRate = ((anomalyFlagged / ROWS.length) * 100).toFixed(2)
  const anomalyByTxType = {}
  ROWS.filter(r => r['Anomaly'] === '-1').forEach(r => { anomalyByTxType[r['Transaction Type']] = (anomalyByTxType[r['Transaction Type']] || 0) + 1 })

  const accountByType = groupCount('Account Type')
  const cardByType = groupCount('Card Type')
  const genderBreakdown = groupCount('Gender')
  const avgBalance = avgField('Account Balance').toFixed(2)
  const totalDeposits = ROWS.filter(r => r['Transaction Type'] === 'Deposit').reduce((a, r) => a + (parseFloat(r['Transaction Amount']) || 0), 0)
  const totalWithdrawals = ROWS.filter(r => r['Transaction Type'] === 'Withdrawal').reduce((a, r) => a + (parseFloat(r['Transaction Amount']) || 0), 0)

  const recentActivity = ROWS
    .filter(r => r['Transaction Date'])
    .sort((a, b) => new Date(b['Transaction Date']) - new Date(a['Transaction Date']))
    .slice(0, 10)
    .map(r => ({
      id: r['TransactionID'], name: `${r['First Name']} ${r['Last Name']}`,
      type: r['Transaction Type'], amount: parseFloat(r['Transaction Amount']).toFixed(2),
      date: r['Transaction Date'], accountType: r['Account Type'], anomaly: r['Anomaly'] === '-1',
    }))

  STATS = {
    meta: { totalCustomers: ROWS.length, generatedAt: new Date().toISOString() },
    transactions: {
      total: ROWS.length, byType: txByType,
      amountByType: Object.fromEntries(Object.entries(txAmountByType).map(([k, v]) => [k, parseFloat(v.toFixed(2))])),
      totalAmount: parseFloat(totalTxAmount.toFixed(2)), avgAmount: parseFloat(avgTxAmount.toFixed(2)),
      totalDeposits: parseFloat(totalDeposits.toFixed(2)), totalWithdrawals: parseFloat(totalWithdrawals.toFixed(2)),
      monthlyVolume: sortedMonths,
    },
    loans: {
      total: ROWS.length, byType: loanByType, byStatus: loanByStatus,
      amountByType: Object.fromEntries(Object.entries(loanAmountByType).map(([k, v]) => [k, parseFloat(v.toFixed(2))])),
      totalAmount: parseFloat(totalLoanAmount.toFixed(2)), approvalRate: parseFloat(loanApprovalRate),
      avgLoanAmount: parseFloat((totalLoanAmount / ROWS.length).toFixed(2)),
    },
    complaints: {
      total: totalComplaints, byType: feedbackByType, resolutionByStatus, resolutionByFeedbackType,
      complaintResolutionRate: parseFloat(complaintResolutionRate),
      pendingComplaints: ROWS.filter(r => r['Feedback Type'] === 'Complaint' && r['Resolution Status'] === 'Pending').length,
    },
    anomalies: { flagged: anomalyFlagged, normal: anomalyNormal, rate: parseFloat(anomalyRate), byTransactionType: anomalyByTxType },
    accounts: { byType: accountByType, byCard: cardByType, byGender: genderBreakdown, avgBalance: parseFloat(avgBalance) },
    recentActivity,
  }

  SUMMARY = `
[LIVE BANK DATA — Union Bank of India, ${ROWS.length.toLocaleString()} customers]
Transactions: ${txByType.Deposit || 0} deposits, ${txByType.Withdrawal || 0} withdrawals, ${txByType.Transfer || 0} transfers. Total value: Rs.${(totalTxAmount / 1e7).toFixed(1)} crore.
Loans: ${loanByStatus.Approved || 0} approved (${loanApprovalRate}% approval rate), ${loanByStatus.Rejected || 0} rejected, ${loanByStatus.Closed || 0} closed. Avg loan: Rs.${(totalLoanAmount / ROWS.length / 1000).toFixed(1)}K.
Complaints: ${totalComplaints} total, ${complaintResolutionRate}% resolved, ${STATS.complaints.pendingComplaints} pending.
Anomalies: ${anomalyFlagged} flagged transactions (${anomalyRate}% of total).
Accounts: ${accountByType.Savings || 0} savings, ${accountByType.Current || 0} current. Avg balance: Rs.${parseFloat(avgBalance).toLocaleString()}.
`.trim()

  console.log('✅ Analytics stats computed and cached.')
}

loadAndCompute()

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  if (!STATS) return res.status(503).json({ error: 'Analytics data not loaded yet.' })
  res.json(STATS)
})

router.get('/summary', (req, res) => {
  if (!SUMMARY) return res.status(503).json({ error: 'Summary not ready.' })
  res.json({ summary: SUMMARY })
})

// ── Customer lookup by ID ─────────────────────────────────────────────────────
router.get('/customer/:id', (req, res) => {
  const { id } = req.params
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Customer ID must be numeric.' })
  }

  const customer = ROWS.find(r => r['Customer ID'] === id)

  if (!customer) {
    return res.status(404).json({ error: `Customer ID ${id} not found.` })
  }

  // Return only safe fields — no Aadhaar/PAN/PIN exposed
  res.json({
    customerId:             customer['Customer ID'],
    name:                   `${customer['First Name']} ${customer['Last Name']}`,
    accountType:            customer['Account Type'],
    accountBalance:         parseFloat(customer['Account Balance']).toFixed(2),
    lastTransactionDate:    customer['Last Transaction Date'],
    lastTransactionType:    customer['Transaction Type'],
    lastTransactionAmount:  parseFloat(customer['Transaction Amount']).toFixed(2),
    loanType:               customer['Loan Type'],
    loanAmount:             parseFloat(customer['Loan Amount']).toFixed(2),
    loanStatus:             customer['Loan Status'],
    cardType:               customer['Card Type'],
    creditLimit:            parseFloat(customer['Credit Limit']).toFixed(2),
    creditCardBalance:      parseFloat(customer['Credit Card Balance']).toFixed(2),
    rewardsPoints:          customer['Rewards Points'],
    city:                   customer['City'],
  })
})

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function normalizePan(value) {
  return String(value || '').trim().toUpperCase()
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeDateInput(value) {
  const text = String(value || '').trim()
  if (!text) return ''

  const parts = text.split(/[/-]/).map(part => part.trim())
  if (parts.length === 3 && parts.every(part => /^\d+$/.test(part))) {
    return `${Number(parts[0])}-${Number(parts[1])}-${Number(parts[2])}`
  }

  return text.toLowerCase()
}

router.post('/verify-customer', (req, res) => {
  const normalizedInput = {
    customerId: String(req.body?.customerId || '').trim(),
    aadhaarNumber: normalizeDigits(req.body?.aadhaarNumber),
    panCard: normalizePan(req.body?.panCard),
    dateOfBirth: normalizeDateInput(req.body?.dateOfBirth),
    email: normalizeEmail(req.body?.email),
    contactNumber: normalizeDigits(req.body?.contactNumber),
  }

  const providedEntries = Object.entries(normalizedInput).filter(([, value]) => Boolean(value))
  if (providedEntries.length < 3) {
    return res.status(400).json({
      error: 'Provide at least any 3 CSV fields for verification.',
    })
  }

  const fieldValidators = {
    customerId: value => /^\d+$/.test(value) || 'Customer ID must be numeric.',
    aadhaarNumber: value => /^\d{12}$/.test(value) || 'Aadhaar Number must be 12 digits.',
    panCard: value => /^[A-Z]{5}\d{4}[A-Z]$/.test(value) || 'PAN Card must be in format ABCDE1234F.',
    dateOfBirth: value => Boolean(value) || 'Date of Birth is required.',
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Email must be valid.',
    contactNumber: value => /^\d{10}$/.test(value) || 'Contact Number must be 10 digits.',
  }

  for (const [key, value] of providedEntries) {
    const validation = fieldValidators[key](value)
    if (validation !== true) {
      return res.status(400).json({ error: validation })
    }
  }

  const fieldExtractors = {
    customerId: row => String(row['Customer ID'] || '').trim(),
    aadhaarNumber: row => normalizeDigits(row['Aadhaar Number']),
    panCard: row => normalizePan(row['PAN Card']),
    dateOfBirth: row => normalizeDateInput(row['Date of Birth']),
    email: row => normalizeEmail(row['Email']),
    contactNumber: row => normalizeDigits(row['Contact Number']),
  }

  const matches = ROWS.filter(row =>
    providedEntries.every(([key, value]) => fieldExtractors[key](row) === value),
  )

  if (matches.length === 0) {
    return res.status(401).json({
      error: 'Verification failed. If one field is not remembered, try another CSV field and provide any 3 exact fields.',
    })
  }

  if (matches.length > 1) {
    const missingFields = ['customerId', 'aadhaarNumber', 'panCard', 'dateOfBirth', 'email', 'contactNumber']
      .filter(field => !normalizedInput[field])

    return res.status(409).json({
      error: 'Multiple matches found. Please provide one more field from CSV for precise verification.',
      missingFields,
      matchedCount: matches.length,
    })
  }

  const customer = matches[0]
  return res.json({
    verified: true,
    usedFields: providedEntries.map(([key]) => key),
    customer: {
      customerId: customer['Customer ID'],
      name: `${customer['First Name']} ${customer['Last Name']}`,
      email: customer['Email'],
      accountType: customer['Account Type'],
      accountBalance: parseFloat(customer['Account Balance']).toFixed(2),
      city: customer['City'],
      lastTransactionDate: customer['Last Transaction Date'],
    },
    note: 'This dataset has no separate account-number column. Use Customer ID as account reference.',
  })
})

export const getSummary = () => SUMMARY || ''

export default router
