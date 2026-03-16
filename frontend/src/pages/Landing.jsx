import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1b2a 50%, #0a0a0a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        borderRadius: '50%', top: '-100px', left: '-100px',
        background: 'radial-gradient(circle, rgba(30,100,255,0.15) 0%, transparent 70%)',
        animation: 'pulse 4s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        borderRadius: '50%', bottom: '-80px', right: '-80px',
        background: 'radial-gradient(circle, rgba(100,30,255,0.12) 0%, transparent 70%)',
        animation: 'pulse 6s ease-in-out infinite reverse'
      }} />

      {/* Union Bank Badge — top center */}
      <div style={{
        position: 'absolute', top: '2rem', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        whiteSpace: 'nowrap'
      }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: '#1e64ff', boxShadow: '0 0 10px #1e64ff'
        }} />
        <span style={{ color: '#888', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
          UNION BANK OF INDIA — AI SELF SERVICE
        </span>
      </div>

      {/* Main content */}
      <div style={{ textAlign: 'center', zIndex: 1, padding: '2rem' }}>

        {/* Chatbot Avatar Orb */}
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e64ff, #7c3aed)',
          margin: '4rem auto 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.8rem',
          boxShadow: '0 0 40px rgba(30,100,255,0.4), 0 0 80px rgba(124,58,237,0.2)',
          animation: 'glow 3s ease-in-out infinite'
        }}>
          🤖
        </div>

        <h1 style={{
          fontSize: '3.5rem', fontWeight: '800',
          background: 'linear-gradient(135deg, #ffffff 0%, #a0b4ff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem', letterSpacing: '-0.02em'
        }}>
          EchoSense
        </h1>

        <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '3rem', letterSpacing: '0.05em' }}>
          Your AI Banking Assistant — Available 24/7
        </p>

        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: '20px',
            padding: '10px 24px',
            color: '#a5b4fc',
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Supports all 22 Indian Languages — Hindi, Marathi, Tamil & more
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => navigate('/chat', { state: { language: 'en' } })}
          style={{
            padding: '1rem 3rem', borderRadius: '50px', border: 'none',
            background: 'linear-gradient(135deg, #1e64ff, #7c3aed)',
            color: '#fff',
            fontSize: '1rem', fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease', letterSpacing: '0.05em',
            boxShadow: '0 0 30px rgba(30,100,255,0.4)'
          }}
        >
          Get Started
        </button>

        {/* Features row */}
        <div style={{
          display: 'flex', gap: '2rem', marginTop: '3rem',
          justifyContent: 'center', flexWrap: 'wrap'
        }}>
          {[
            { icon: '🎙️', label: 'Voice Enabled' },
            { icon: '🔒', label: 'Secure & Private' },
            { icon: '⚡', label: 'Instant Response' },
            { icon: '🌐', label: 'Multilingual' },
          ].map(f => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              color: '#666', fontSize: '0.85rem'
            }}>
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Dashboard Link */}
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: '#888', cursor: 'pointer', fontSize: '0.85rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.color = '#888'
            }}
          >
            View Analytics Dashboard →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 40px rgba(30,100,255,0.4), 0 0 80px rgba(124,58,237,0.2); }
          50% { box-shadow: 0 0 60px rgba(30,100,255,0.6), 0 0 120px rgba(124,58,237,0.3); }
        }
      `}</style>
    </div>
  )
}