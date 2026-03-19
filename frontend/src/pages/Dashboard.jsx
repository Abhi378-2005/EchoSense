import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const mockActivity = [
  { type: 'complaint', message: 'New complaint filed — ATM Issue', time: '2 min ago', bg: '#fef2f2', dot: '#ef4444' },
  { type: 'kyc', message: 'KYC verified for user ****4521', time: '5 min ago', bg: '#f0fdf4', dot: '#22c55e' },
  { type: 'chat', message: 'Loan enquiry handled by AI', time: '8 min ago', bg: '#eff6ff', dot: '#3b82f6' },
  { type: 'agent', message: 'Live agent escalation — Rajesh Kumar', time: '12 min ago', bg: '#fffbeb', dot: '#f59e0b' },
  { type: 'chat', message: 'Account balance query resolved', time: '15 min ago', bg: '#eff6ff', dot: '#3b82f6' },
  { type: 'kyc', message: 'KYC verified for user ****8834', time: '18 min ago', bg: '#f0fdf4', dot: '#22c55e' },
  { type: 'complaint', message: 'Complaint UBI-45231 closed', time: '22 min ago', bg: '#fef2f2', dot: '#ef4444' },
  { type: 'chat', message: 'Card services query handled', time: '25 min ago', bg: '#eff6ff', dot: '#3b82f6' },
]

const quickActionStats = [
  { label: 'Account Balance', count: 342, color: '#3b82f6' },
  { label: 'Loan Enquiry', count: 289, color: '#8b5cf6' },
  { label: 'Card Services', count: 198, color: '#f59e0b' },
  { label: 'Branch Locator', count: 165, color: '#f97316' },
  { label: 'File Complaint', count: 156, color: '#ef4444' },
  { label: 'KYC Verification', count: 134, color: '#22c55e' },
]

const statCards = (complaints, liveCount) => [
  { label: 'Total Conversations', value: '1,284', sub: '+47 today', icon: '💬', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { label: 'Complaints Resolved', value: '892', sub: `${complaints.length} this session`, icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { label: 'KYC Completed', value: '634', sub: 'Verified accounts', icon: '🪪', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { label: 'Avg Response Time', value: '1.2s', sub: 'AI powered', icon: '⚡', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { label: 'Satisfaction Rate', value: '94%', sub: 'Customer rating', icon: '⭐', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { label: 'Live Users', value: liveCount.toString(), sub: 'Right now', icon: '👥', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [liveCount, setLiveCount] = useState(3)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 100)
    axios.get(`${BACKEND_URL}/api/complaints`)
      .then(res => setComplaints(res.data.complaints))
      .catch(() => {})
    const interval = setInterval(() => {
      setLiveCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc', fontFamily: "'Georgia', 'Times New Roman', serif", color: '#1e293b' }}>

      <div style={{ height: '4px', background: 'linear-gradient(90deg, #1e40af, #3b82f6, #1e40af)' }} />

      <header style={{
        padding: '1rem 2.5rem', background: 'white',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{
            padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0',
            background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem',
            fontFamily: 'sans-serif', fontWeight: '500', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >← Back</button>
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0f172a' }}>EchoSense Analytics</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>UNION BANK OF INDIA — AI DASHBOARD</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '50px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.8rem', color: '#15803d', fontFamily: 'sans-serif', fontWeight: '600' }}>{liveCount} Live Users</span>
          </div>
          <div style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.78rem', color: '#1d4ed8', fontFamily: 'sans-serif', fontWeight: '600' }}>
            Today: March 19, 2026
          </div>
        </div>
      </header>

      <main style={{ padding: '2rem 2.5rem', maxWidth: '1300px', margin: '0 auto' }}>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {statCards(complaints, liveCount).map((stat, i) => (
            <div key={stat.label} style={{
              background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
              padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(16px)',
              transition: `all 0.5s ease ${i * 0.06}s`, cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = stat.border; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.9rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: stat.color, marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#475569', fontFamily: 'sans-serif', fontWeight: '500', marginBottom: '0.2rem' }}>{stat.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'sans-serif' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Middle Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>

          {/* Quick Action Usage */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s ease 0.35s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>Quick Action Usage</h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>THIS MONTH</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {quickActionStats.map(stat => {
                const max = Math.max(...quickActionStats.map(s => s.count))
                const pct = (stat.count / max) * 100
                return (
                  <div key={stat.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#475569', fontFamily: 'sans-serif' }}>{stat.label}</span>
                      <span style={{ fontSize: '0.82rem', color: stat.color, fontFamily: 'sans-serif', fontWeight: '700' }}>{stat.count}</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '3px', width: mounted ? `${pct}%` : '0%', background: stat.color, transition: 'width 1s ease 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Language Distribution */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s ease 0.4s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>Languages</h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>DISTRIBUTION</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { lang: 'English', native: 'English', pct: 67, color: '#3b82f6' },
                { lang: 'Hindi', native: 'हिंदी', pct: 33, color: '#8b5cf6' },
              ].map(l => (
                <div key={l.lang}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>{l.native}</span>
                    <span style={{ fontSize: '0.88rem', color: l.color, fontFamily: 'sans-serif', fontWeight: '700' }}>{l.pct}%</span>
                  </div>
                  <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '5px', width: mounted ? `${l.pct}%` : '0%', background: l.color, transition: 'width 1s ease 0.6s' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: '#f1f5f9', margin: '1.5rem 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>Session Complaints</h3>
              <span style={{ padding: '0.15rem 0.5rem', borderRadius: '50px', background: complaints.length > 0 ? '#fef2f2' : '#f0fdf4', color: complaints.length > 0 ? '#ef4444' : '#16a34a', fontSize: '0.72rem', fontFamily: 'sans-serif', fontWeight: '600' }}>{complaints.length}</span>
            </div>
            {complaints.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'sans-serif' }}>No complaints this session</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto' }}>
                {complaints.map((c, i) => (
                  <div key={i} style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: '#fafafa', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#334155', fontFamily: 'sans-serif', fontWeight: '600' }}>{c.id}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'sans-serif' }}>{c.category}</div>
                    </div>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', alignSelf: 'center', background: '#fffbeb', color: '#d97706', fontSize: '0.68rem', fontFamily: 'sans-serif', fontWeight: '600' }}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Activity */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s ease 0.45s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>Live Activity</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', borderRadius: '50px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: '0.68rem', color: '#15803d', fontFamily: 'sans-serif', fontWeight: '700', letterSpacing: '0.05em' }}>LIVE</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {mockActivity.map((activity, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.75rem', borderRadius: '8px',
                  background: activity.bg, border: `1px solid ${activity.dot}22`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(12px)',
                  transition: `all 0.4s ease ${0.5 + i * 0.05}s`,
                }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: activity.dot, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.78rem', color: '#334155', fontFamily: 'sans-serif' }}>{activity.message}</span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', opacity: mounted ? 1 : 0, transition: 'all 0.5s ease 0.55s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem' }}>🤖</span>
            <span style={{ fontSize: '0.82rem', color: '#475569', fontFamily: 'sans-serif' }}>
              <strong>EchoSense</strong> is handling queries autonomously · Groq AI (Llama 3.3 70B) · English & Hindi
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {[{ label: 'Uptime', value: '99.9%' }, { label: 'AI Accuracy', value: '96.2%' }, { label: 'Avg Handle Time', value: '48s' }].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e40af' }}>{m.value}</div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
      `}</style>
    </div>
  )
}