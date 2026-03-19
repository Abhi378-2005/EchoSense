// frontend/src/pages/Dashboard.jsx
// Fetches live data from /api/analytics — no hardcoded numbers

import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";

const API = import.meta.env.VITE_BACKEND_URL || "https://echosense-backend-hwja.onrender.com";

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  blue: "#2563EB",
  green: "#16A34A",
  red: "#DC2626",
  amber: "#D97706",
  purple: "#7C3AED",
  slate: "#475569",
};
const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.red, COLORS.purple];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, color = COLORS.blue, icon }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E2E8F0",
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "Georgia, serif" }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: "#94A3B8" }}>{subtitle}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: 16, fontWeight: 700, color: "#1E3A5F",
      margin: "28px 0 12px", fontFamily: "Georgia, serif",
      borderLeft: `4px solid ${COLORS.blue}`, paddingLeft: 10,
    }}>
      {children}
    </h2>
  );
}

function ChartCard({ title, children, height = 260 }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12,
      padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 16 }}>{title}</div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/analytics`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { setError("Failed to load analytics."); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🏦</div>
        <div style={{ color: "#64748B", fontSize: 15 }}>Loading live analytics…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
      <div style={{ color: COLORS.red, fontSize: 15 }}>⚠️ {error}</div>
    </div>
  );

  const { transactions: tx, loans, complaints, anomalies, accounts, recentActivity, meta } = data;

  // ── Chart data shapes ──────────────────────────────────────────────────────
  const txByTypeData = Object.entries(tx.byType).map(([name, value]) => ({ name, value }));
  const loanStatusData = Object.entries(loans.byStatus).map(([name, value]) => ({ name, value }));
  const loanTypeData = Object.entries(loans.byType).map(([name, value]) => ({ name, value }));
  const feedbackData = Object.entries(complaints.byType).map(([name, value]) => ({ name, value }));
  const anomalyData = [
    { name: "Normal", value: anomalies.normal },
    { name: "Flagged", value: anomalies.flagged },
  ];
  const resolutionData = Object.entries(complaints.resolutionByFeedbackType).map(
    ([type, d]) => ({ type, Resolved: d.resolved, Pending: d.total - d.resolved })
  );
  const cardData = Object.entries(accounts.byCard).map(([name, value]) => ({ name, value }));
  const monthlyData = tx.monthlyVolume.map(m => ({
    month: m.month.slice(5), // "MM"
    transactions: m.count,
  }));

  const fmt = (n) => n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${Number(n).toLocaleString()}`;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{
        background: "#1E3A5F", color: "#fff", padding: "18px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26 }}>🏦</span>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700 }}>EchoSense Analytics</div>
            <div style={{ fontSize: 12, color: "#93C5FD" }}>Union Bank of India — Live Dashboard</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#93C5FD" }}>
          {meta.totalCustomers.toLocaleString()} customers &nbsp;|&nbsp; Updated: {new Date(meta.generatedAt).toLocaleTimeString()}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 32px" }}>

        {/* ── KPI Cards ── */}
        <SectionTitle>📊 Overview</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <StatCard title="Total Customers" value={meta.totalCustomers.toLocaleString()} icon="👥" subtitle="Active accounts" />
          <StatCard title="Total Transactions" value={tx.total.toLocaleString()} icon="💳" subtitle={`Avg ₹${tx.avgAmount.toLocaleString()}`} />
          <StatCard title="Transaction Volume" value={fmt(tx.totalAmount)} icon="💰" color={COLORS.green} subtitle={`Deposits: ${fmt(tx.totalDeposits)}`} />
          <StatCard title="Loan Approval Rate" value={`${loans.approvalRate}%`} icon="✅" color={COLORS.green} subtitle={`${loans.byStatus.Approved?.toLocaleString()} approved`} />
          <StatCard title="Complaint Resolution" value={`${complaints.complaintResolutionRate}%`} icon="🎯" color={COLORS.amber} subtitle={`${complaints.pendingComplaints} pending`} />
          <StatCard title="Anomalies Flagged" value={anomalies.flagged.toLocaleString()} icon="🚨" color={COLORS.red} subtitle={`${anomalies.rate}% of transactions`} />
        </div>

        {/* ── Transactions ── */}
        <SectionTitle>💳 Transaction Analytics</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <ChartCard title="Transactions by Type">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={txByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {txByTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Transaction Volume by Type (₹)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(tx.amountByType).map(([name, value]) => ({ name, value }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `₹${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="value" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Transaction Volume">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="transactions" stroke={COLORS.blue} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Loans ── */}
        <SectionTitle>🏠 Loan Portfolio</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <ChartCard title="Loan Status Breakdown">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={loanStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill={COLORS.green} />
                  <Cell fill={COLORS.red} />
                  <Cell fill={COLORS.slate} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Loans by Type">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanTypeData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={70} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.purple} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Loan Amount by Type (₹)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(loans.amountByType).map(([name, value]) => ({ name, value }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `${(v / 1e9).toFixed(1)}B`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="value" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Complaints ── */}
        <SectionTitle>📋 Complaint Analytics</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <ChartCard title="Feedback Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={feedbackData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {feedbackData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Resolution Rate by Feedback Type">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionData}>
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Resolved" fill={COLORS.green} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending" fill={COLORS.red} stackId="a" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Resolution KPI cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(complaints.resolutionByFeedbackType).map(([type, d]) => (
              <div key={type} style={{
                background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12,
                padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{type}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{d.resolved}/{d.total} resolved</div>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: parseFloat(d.rate) >= 50 ? COLORS.green : COLORS.red,
                  }}>{d.rate}%</div>
                </div>
                <div style={{ marginTop: 6, background: "#F1F5F9", borderRadius: 99, height: 6, overflow: "hidden" }}>
                  <div style={{
                    width: `${d.rate}%`, height: "100%",
                    background: parseFloat(d.rate) >= 50 ? COLORS.green : COLORS.red,
                    borderRadius: 99,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Anomalies ── */}
        <SectionTitle>🚨 Anomaly & Fraud Detection</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <ChartCard title="Normal vs Flagged Transactions">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={anomalyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                  <Cell fill={COLORS.green} />
                  <Cell fill={COLORS.red} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Anomalies by Transaction Type">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(anomalies.byTransactionType).map(([name, value]) => ({ name, value }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Anomaly alert banner */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              background: "#FEF2F2", border: `1px solid #FECACA`,
              borderRadius: 12, padding: "18px 20px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.red, marginBottom: 4 }}>
                🚨 Anomaly Alert Summary
              </div>
              <div style={{ fontSize: 13, color: "#7F1D1D", lineHeight: 1.7 }}>
                <div><b>{anomalies.flagged.toLocaleString()}</b> transactions flagged</div>
                <div>Anomaly rate: <b>{anomalies.rate}%</b></div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#991B1B" }}>
                  Flagged transactions are routed to the fraud review team automatically.
                </div>
              </div>
            </div>
            <div style={{
              background: "#F0FDF4", border: `1px solid #BBF7D0`,
              borderRadius: 12, padding: "18px 20px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.green, marginBottom: 4 }}>
                ✅ Clean Transactions
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.green }}>
                {anomalies.normal.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#166534" }}>
                {(100 - anomalies.rate).toFixed(2)}% of all transactions are clean
              </div>
            </div>
          </div>
        </div>

        {/* ── Accounts & Cards ── */}
        <SectionTitle>👥 Account & Card Overview</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <ChartCard title="Account Type Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={Object.entries(accounts.byType).map(([name, value]) => ({ name, value }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill={COLORS.blue} />
                  <Cell fill={COLORS.purple} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Card Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cardData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {cardData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Gender Breakdown">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={Object.entries(accounts.byGender).map(([name, value]) => ({ name, value }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {Object.keys(accounts.byGender).map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Recent Activity Feed ── */}
        <SectionTitle>⚡ Recent Activity Feed</SectionTitle>
        <div style={{
          background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12,
          overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Transaction ID", "Customer", "Type", "Amount", "Account", "Date", "Status"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748B" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((row, i) => (
                <tr key={i} style={{
                  borderBottom: "1px solid #F1F5F9",
                  background: row.anomaly ? "#FFF7F7" : "transparent",
                }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", fontFamily: "monospace" }}>#{row.id}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{row.name}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: row.type === "Deposit" ? "#DCFCE7" : row.type === "Withdrawal" ? "#FEE2E2" : "#DBEAFE",
                      color: row.type === "Deposit" ? COLORS.green : row.type === "Withdrawal" ? COLORS.red : COLORS.blue,
                    }}>{row.type}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#1E3A5F" }}>₹{Number(row.amount).toLocaleString()}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748B" }}>{row.accountType}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8" }}>{row.date}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {row.anomaly
                      ? <span style={{ color: COLORS.red, fontSize: 12, fontWeight: 600 }}>🚨 Flagged</span>
                      : <span style={{ color: COLORS.green, fontSize: 12 }}>✅ Clean</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}