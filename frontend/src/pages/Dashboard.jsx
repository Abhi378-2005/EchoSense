import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../lib/api'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed']

function StatCard({ title, value, subtitle, accent }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #dbe2ef',
      borderRadius: 12,
      padding: '14px 16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{ color: '#64748b', fontSize: 12 }}>{title}</div>
      <div style={{ color: accent || '#0f172a', fontSize: 24, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {subtitle && <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{subtitle}</div>}
    </div>
  )
}

function ChartCard({ title, children, height = 260 }) {
  return (
    <section style={{
      background: '#fff',
      border: '1px solid #dbe2ef',
      borderRadius: 12,
      padding: '14px 16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#334155' }}>{title}</h3>
      <div style={{ height }}>{children}</div>
    </section>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    api.get('/api/analytics')
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load analytics')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const layoutColumns = isMobile ? '1fr' : '1fr 1fr 1fr'

  const fmtMoney = amount => {
    const num = Number(amount || 0)
    if (num >= 10000000) return `Rs ${(num / 10000000).toFixed(1)} Cr`
    if (num >= 100000) return `Rs ${(num / 100000).toFixed(1)} L`
    return `Rs ${num.toLocaleString()}`
  }

  const chartData = useMemo(() => {
    if (!data) return null

    const { transactions, loans, complaints, anomalies, accounts } = data

    return {
      txByType: Object.entries(transactions.byType).map(([name, value]) => ({ name, value })),
      loanStatus: Object.entries(loans.byStatus).map(([name, value]) => ({ name, value })),
      feedback: Object.entries(complaints.byType).map(([name, value]) => ({ name, value })),
      anomaly: [
        { name: 'Normal', value: anomalies.normal },
        { name: 'Flagged', value: anomalies.flagged },
      ],
      accountType: Object.entries(accounts.byType).map(([name, value]) => ({ name, value })),
      monthly: transactions.monthlyVolume.map(item => ({ month: item.month.slice(5), count: item.count })),
    }
  }, [data])

  if (loading) {
    return <div style={centerStyle}>Loading analytics...</div>
  }

  if (error) {
    return <div style={centerStyle}>{error}</div>
  }

  const { transactions, loans, complaints, anomalies, recentActivity, meta } = data

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <header style={{
        background: '#0f3a67',
        color: '#fff',
        padding: isMobile ? '12px 14px' : '16px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: isMobile ? 16 : 18 }}>EchoSense Analytics</div>
          <div style={{ color: '#bfdbfe', fontSize: 12 }}>Union Bank of India</div>
        </div>
        <div style={{ color: '#bfdbfe', fontSize: 12 }}>
          {meta.totalCustomers.toLocaleString()} customers | Updated {new Date(meta.generatedAt).toLocaleTimeString()}
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '16px 12px' : '24px 28px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <StatCard title="Total Customers" value={meta.totalCustomers.toLocaleString()} subtitle="Active accounts" />
          <StatCard title="Total Transactions" value={transactions.total.toLocaleString()} subtitle={`Avg Rs ${transactions.avgAmount.toLocaleString()}`} />
          <StatCard title="Transaction Volume" value={fmtMoney(transactions.totalAmount)} subtitle={`Deposits ${fmtMoney(transactions.totalDeposits)}`} accent="#15803d" />
          <StatCard title="Loan Approval" value={`${loans.approvalRate}%`} subtitle={`${loans.byStatus.Approved || 0} approved`} accent="#15803d" />
          <StatCard title="Complaint Resolution" value={`${complaints.complaintResolutionRate}%`} subtitle={`${complaints.pendingComplaints} pending`} accent="#b45309" />
          <StatCard title="Anomalies" value={anomalies.flagged.toLocaleString()} subtitle={`${anomalies.rate}% flagged`} accent="#b91c1c" />
        </section>

        <section style={{ marginTop: 14, display: 'grid', gridTemplateColumns: layoutColumns, gap: 12 }}>
          <ChartCard title="Transactions by Type">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.txByType} dataKey="value" nameKey="name" outerRadius={isMobile ? 72 : 90}>
                  {chartData.txByType.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Loan Status">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.loanStatus} dataKey="value" nameKey="name" outerRadius={isMobile ? 72 : 90}>
                  {chartData.loanStatus.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Transactions">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section style={{ marginTop: 12, display: 'grid', gridTemplateColumns: layoutColumns, gap: 12 }}>
          <ChartCard title="Feedback Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.feedback} dataKey="value" nameKey="name" outerRadius={isMobile ? 72 : 90}>
                  {chartData.feedback.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Anomaly Split">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.anomaly} dataKey="value" nameKey="name" outerRadius={isMobile ? 72 : 90}>
                  {chartData.anomaly.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Account Types">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.accountType}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section style={{ marginTop: 12 }}>
          <h3 style={{ color: '#334155', marginBottom: 10 }}>Recent Activity</h3>
          {isMobile ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {recentActivity.map((row, idx) => (
                <div key={idx} style={{
                  background: '#fff',
                  border: row.anomaly ? '1px solid #fecaca' : '1px solid #dbe2ef',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Txn #{row.id}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{row.name}</div>
                  <div style={{ marginTop: 4, fontSize: 13 }}>{row.type} | Rs {Number(row.amount).toLocaleString()}</div>
                  <div style={{ marginTop: 2, fontSize: 12, color: '#64748b' }}>{row.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #dbe2ef', borderRadius: 12, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Txn', 'Customer', 'Type', 'Amount', 'Account', 'Date', 'Status'].map(header => (
                      <th key={header} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#64748b' }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((row, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #f1f5f9', background: row.anomaly ? '#fff7f7' : '#fff' }}>
                      <td style={cellStyle}>#{row.id}</td>
                      <td style={cellStyle}>{row.name}</td>
                      <td style={cellStyle}>{row.type}</td>
                      <td style={cellStyle}>Rs {Number(row.amount).toLocaleString()}</td>
                      <td style={cellStyle}>{row.accountType}</td>
                      <td style={cellStyle}>{row.date}</td>
                      <td style={{ ...cellStyle, color: row.anomaly ? '#b91c1c' : '#15803d', fontWeight: 600 }}>
                        {row.anomaly ? 'Flagged' : 'Clean'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

const centerStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: '#f8fafc',
  color: '#475569',
  fontFamily: 'sans-serif',
}

const cellStyle = {
  padding: '10px 12px',
  fontSize: 13,
  color: '#334155',
}
