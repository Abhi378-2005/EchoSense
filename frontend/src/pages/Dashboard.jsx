import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const mockStats = {
  totalConversations: 1284,
  todayConversations: 47,
  complaintsResolved: 892,
  kycCompleted: 634,
  avgResponseTime: '1.2s',
  satisfactionRate: '94%',
}

const mockActivity = [
  { type: 'complaint', message: 'New complaint filed — ATM Issue', time: '2 min ago', color: '#ef4444' },
  { type: 'kyc', message: 'KYC verified for user ****4521', time: '5 min ago', color: '#4ade80' },
  { type: 'chat', message: 'Loan enquiry handled by AI', time: '8 min ago', color: '#1e64ff' },
  { type: 'agent', message: 'Live agent escalation — Rajesh Kumar', time: '12 min ago', color: '#eab308' },
  { type: 'chat', message: 'Account balance query resolved', time: '15 min ago', color: '#1e64ff' },
  { type: 'kyc', message: 'KYC verified for user ****8834', time: '18 min ago', color: '#4ade80' },
  { type: 'complaint', message: 'Complaint UBI-45231 closed', time: '22 min ago', color: '#ef4444' },
  { type: 'chat', message: 'Card services query handled', time: '25 min ago', color: '#1e64ff' },
]

const quickActionStats = [
  { label: 'Account Balance', count: 342, icon: '💰', color: '#1e64ff' },
  { label: 'Loan Enquiry', count: 289, icon: '🏦', color: '#7c3aed' },
  { label: 'File Complaint', count: 156, icon: '📝', color: '#ef4444' },
  { label: 'Card Services', count: 198, icon: '💳', color: '#eab308' },
  { label: 'KYC Verification', count: 134, icon: '🪪', color: '#4ade80' },
  { label: 'Branch Locator', count: 165, icon: '📍', color: '#f97316' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [liveCount, setLiveCount] = useState(3)

  useEffect(() => {
    axios.get('http://localhost:5000/api/complaints')
      .then(res => setComplaints(res.data.complaints))
      .catch(() => {})

    // Simulate live users fluctuating
    const interval = setInterval(() => {
      setLiveCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1b2a 50%, #0a0a0a 100%)',
      fontFamily: "'Segoe UI', sans-serif", color: '#fff',
      padding: '0 0 3rem 0'
    }}>

      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#aaa', borderRadius: '8px', padding: '0.4rem 0.8rem',
            cursor: 'pointer', fontSize: '0.85rem'
          }}>Back</button>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: '800' }}>EchoSense Analytics</h1>
            <p style={{ fontSize: '0.75rem', color: '#888' }}>Union Bank of India — AI Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#4ade80', boxShadow: '0 0 8px #4ade80',
            animation: 'pulse 1.5s infinite'
          }} />
          <span style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: '600' }}>
            {liveCount} Live Users
          </span>
        </div>
      </div>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem', marginBottom: '2rem'
        }}>
          {[
            { label: 'Total Conversations', value: mockStats.totalConversations.toLocaleString(), icon: '💬', color: '#1e64ff', sub: `+${mockStats.todayConversations} today` },
            { label: 'Complaints Resolved', value: mockStats.complaintsResolved.toLocaleString(), icon: '✅', color: '#4ade80', sub: `${complaints.length} this session` },
            { label: 'KYC Completed', value: mockStats.kycCompleted.toLocaleString(), icon: '🪪', color: '#7c3aed', sub: 'Verified accounts' },
            { label: 'Avg Response Time', value: mockStats.avgResponseTime, icon: '⚡', color: '#eab308', sub: 'AI powered' },
            { label: 'Satisfaction Rate', value: mockStats.satisfactionRate, icon: '⭐', color: '#f97316', sub: 'Customer rating' },
            { label: 'Live Users', value: liveCount.toString(), icon: '👥', color: '#4ade80', sub: 'Right now' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `rgba(${stat.color === '#1e64ff' ? '30,100,255' : stat.color === '#4ade80' ? '74,222,128' : '124,58,237'},0.08)`
                e.currentTarget.style.borderColor = stat.color + '40'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: stat.color, marginBottom: '0.25rem' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>{stat.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#555' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Middle Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>

          {/* Quick Action Usage */}
          <div style={{
            padding: '1.5rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: '#fff' }}>
              Quick Action Usage
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {quickActionStats.map(stat => {
                const max = Math.max(...quickActionStats.map(s => s.count))
                const pct = (stat.count / max) * 100
                return (
                  <div key={stat.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#ccc' }}>{stat.icon} {stat.label}</span>
                      <span style={{ fontSize: '0.85rem', color: stat.color, fontWeight: '600' }}>{stat.count}</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${stat.color}, ${stat.color}99)`,
                        transition: 'width 1s ease'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Language Distribution */}
          <div style={{
            padding: '1.5rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              Language Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { lang: 'English', pct: 58, color: '#1e64ff', native: 'English' },
                { lang: 'Hindi', pct: 29, color: '#7c3aed', native: 'हिंदी' },
                { lang: 'Marathi', pct: 13, color: '#4ade80', native: 'मराठी' },
              ].map(l => (
                <div key={l.lang}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#ccc' }}>{l.native}</span>
                    <span style={{ fontSize: '0.9rem', color: l.color, fontWeight: '700' }}>{l.pct}%</span>
                  </div>
                  <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px' }}>
                    <div style={{
                      height: '100%', borderRadius: '5px', width: `${l.pct}%`,
                      background: `linear-gradient(90deg, ${l.color}, ${l.color}88)`,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Complaint Status */}
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '1.5rem 0 1rem' }}>
              Session Complaints ({complaints.length})
            </h3>
            {complaints.length === 0 ? (
              <p style={{ color: '#555', fontSize: '0.85rem' }}>No complaints filed this session</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                {complaints.map((c, i) => (
                  <div key={i} style={{
                    padding: '0.6rem 0.8rem', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#ccc' }}>{c.id}</div>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>{c.category}</div>
                    </div>
                    <div style={{
                      padding: '0.2rem 0.5rem', borderRadius: '50px',
                      background: 'rgba(234,179,8,0.15)',
                      border: '1px solid rgba(234,179,8,0.3)',
                      color: '#eab308', fontSize: '0.7rem'
                    }}>
                      {c.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div style={{
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Live Activity Feed</h3>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.2rem 0.6rem', borderRadius: '50px',
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.2)'
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#4ade80', animation: 'pulse 1.5s infinite'
              }} />
              <span style={{ color: '#4ade80', fontSize: '0.7rem' }}>LIVE</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mockActivity.map((activity, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.75rem 1rem', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s'
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: activity.color, flexShrink: 0,
                  boxShadow: `0 0 6px ${activity.color}`
                }} />
                <span style={{ flex: 1, fontSize: '0.85rem', color: '#ccc' }}>{activity.message}</span>
                <span style={{ fontSize: '0.75rem', color: '#555', whiteSpace: 'nowrap' }}>{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  )
}