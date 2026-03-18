import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const mockActivity = [
  { message: 'New complaint filed — ATM Issue', time: '2 min ago', color: '#dc2626', bg: 'rgba(220,38,38,0.06)', icon: '⚠️' },
  { message: 'KYC verified for user ****4521', time: '5 min ago', color: '#16a34a', bg: 'rgba(22,163,74,0.06)', icon: '✅' },
  { message: 'Loan enquiry handled by AI', time: '8 min ago', color: '#2563eb', bg: 'rgba(37,99,235,0.06)', icon: '💬' },
  { message: 'Live agent escalation — Rajesh Kumar', time: '12 min ago', color: '#d97706', bg: 'rgba(217,119,6,0.06)', icon: '👨‍💼' },
  { message: 'Account balance query resolved', time: '15 min ago', color: '#2563eb', bg: 'rgba(37,99,235,0.06)', icon: '💬' },
  { message: 'KYC verified for user ****8834', time: '18 min ago', color: '#16a34a', bg: 'rgba(22,163,74,0.06)', icon: '✅' },
  { message: 'Complaint UBI-45231 closed', time: '22 min ago', color: '#dc2626', bg: 'rgba(220,38,38,0.06)', icon: '⚠️' },
  { message: 'Card services query handled', time: '25 min ago', color: '#2563eb', bg: 'rgba(37,99,235,0.06)', icon: '💬' },
]

const quickActionStats = [
  { label: 'Account Balance', count: 342, color: '#2563eb', pct: 100 },
  { label: 'Loan Enquiry', count: 289, color: '#7c3aed', pct: 84 },
  { label: 'Card Services', count: 198, color: '#d97706', pct: 58 },
  { label: 'Branch Locator', count: 165, color: '#0891b2', pct: 48 },
  { label: 'File Complaint', count: 156, color: '#dc2626', pct: 45 },
  { label: 'KYC Verification', count: 134, color: '#16a34a', pct: 39 },
]

const statCards = [
  { label: 'Total Conversations', value: '1,284', sub: '+47 today', color: '#2563eb', bg: 'rgba(37,99,235,0.07)', border: 'rgba(37,99,235,0.12)', icon: '💬' },
  { label: 'Complaints Resolved', value: '892', sub: 'This month', color: '#16a34a', bg: 'rgba(22,163,74,0.07)', border: 'rgba(22,163,74,0.12)', icon: '✅' },
  { label: 'KYC Completed', value: '634', sub: 'Verified accounts', color: '#7c3aed', bg: 'rgba(124,58,237,0.07)', border: 'rgba(124,58,237,0.12)', icon: '🪪' },
  { label: 'Avg Response Time', value: '1.2s', sub: 'AI powered', color: '#d97706', bg: 'rgba(217,119,6,0.07)', border: 'rgba(217,119,6,0.12)', icon: '⚡' },
  { label: 'Satisfaction Rate', value: '94%', sub: 'Customer rating', color: '#0891b2', bg: 'rgba(8,145,178,0.07)', border: 'rgba(8,145,178,0.12)', icon: '⭐' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [liveCount, setLiveCount] = useState(3)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 100)
    axios.get(`${BACKEND_URL}/api/complaints`).then(res => setComplaints(res.data.complaints)).catch(() => {})
    const interval = setInterval(() => setLiveCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1)), 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b' }}>

      {/* Header */}
      <div style={{ padding: '1rem 2.5rem', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '8px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}>← Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #1a3a6b, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>📊</div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>EchoSense Analytics</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Union Bank of India — AI Dashboard</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: '50px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s infinite' }} />
          <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: '600' }}>{liveCount} Live Users</span>
        </div>
      </div>

      <div style={{ padding: '2rem 2.5rem', maxWidth: '1280px', margin: '0 auto' }}>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {statCards.map((stat, i) => (
            <div key={stat.label} style={{ padding: '1.25rem', background: '#fff', border: `1px solid ${stat.border}`, borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.3s ease', cursor: 'default', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${i * 0.08}s` }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${stat.border}` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', marginBottom: '0.75rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: '800', color: stat.color, letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500', marginBottom: '0.15rem' }}>{stat.label}</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Live users bar */}
        <div style={{ padding: '1rem 1.5rem', background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(124,58,237,0.03))', border: '1px solid rgba(37,99,235,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.5s' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>👥</div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.02em' }}>{liveCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Live Users Right Now</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s infinite' }} />
            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '600' }}>Real-time</span>
          </div>
        </div>

        {/* Middle row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Quick Actions */}
          <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>Quick Action Usage</h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#f8fafc', padding: '0.2rem 0.6rem', borderRadius: '50px', border: '1px solid #e2e8f0' }}>This Month</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {quickActionStats.map(stat => (
                <div key={stat.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: '500' }}>{stat.label}</span>
                    <span style={{ fontSize: '0.82rem', color: stat.color, fontWeight: '700' }}>{stat.count}</span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '3px', width: mounted ? `${stat.pct}%` : '0%', background: `linear-gradient(90deg, ${stat.color}, ${stat.color}88)`, transition: 'width 1.2s ease 0.6s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Language Distribution */}
            <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.4s' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.25rem' }}>Language Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[{ native: 'English', pct: 58, color: '#2563eb' }, { native: 'हिंदी', pct: 29, color: '#7c3aed' }, { native: 'मराठी', pct: 13, color: '#16a34a' }].map(l => (
                  <div key={l.native}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: '500' }}>{l.native}</span>
                      <span style={{ fontSize: '0.82rem', color: l.color, fontWeight: '700' }}>{l.pct}%</span>
                    </div>
                    <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '4px', width: mounted ? `${l.pct}%` : '0%', background: `linear-gradient(90deg, ${l.color}, ${l.color}88)`, transition: 'width 1.2s ease 0.7s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Complaints */}
            <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flex: 1, opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.5s' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>
                Session Complaints
                <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '50px', background: complaints.length > 0 ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)', color: complaints.length > 0 ? '#dc2626' : '#16a34a', border: `1px solid ${complaints.length > 0 ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.15)'}` }}>{complaints.length}</span>
              </h3>
              {complaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>✅</div>
                  No complaints this session
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                  {complaints.map((c, i) => (
                    <div key={i} style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', background: '#fafbfc', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#374151', fontWeight: '600' }}>{c.id}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{c.category}</div>
                      </div>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '50px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', color: '#d97706', fontSize: '0.68rem', fontWeight: '600' }}>{c.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.6s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>Live Activity Feed</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', borderRadius: '50px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s infinite' }} />
              <span style={{ color: '#16a34a', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.05em' }}>LIVE</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {mockActivity.map((activity, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.9rem', borderRadius: '10px', background: activity.bg, border: `1px solid ${activity.color}18`, transition: 'all 0.2s ease', opacity: mounted ? 1 : 0, transitionDelay: `${0.7 + i * 0.05}s` }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{activity.icon}</span>
                <span style={{ flex: 1, fontSize: '0.78rem', color: '#374151', fontWeight: '500' }}>{activity.message}</span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px}
      `}</style>
    </div>
  )
}