import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const languages = [
  { code: 'en', label: 'English', native: 'English', sub: 'Continue in English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', sub: 'हिंदी में जारी रखें' },
]

const features = [
  { icon: '🎙️', label: 'Voice Enabled' },
  { icon: '🔒', label: 'Bank-Grade Security' },
  { icon: '⚡', label: 'Instant AI Response' },
  { icon: '🌐', label: 'Hindi & English' },
]

const stats = [
  { value: '50K+', label: 'Customers Served' },
  { value: '1.2s', label: 'Avg Response' },
  { value: '94%', label: 'Satisfaction' },
]

export default function Landing() {
  const [selected, setSelected] = useState(null)
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => setMounted(true), 100)
  }, [])

  const handleContinue = () => {
    if (selected) navigate('/chat', { state: { language: selected } })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(30,64,175,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,64,175,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div style={{ height: '4px', background: 'linear-gradient(90deg, #1e40af, #3b82f6, #1e40af)', position: 'relative', zIndex: 1 }} />

      <header style={{
        padding: '1rem 3rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>🏦</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b', letterSpacing: '-0.01em' }}>Union Bank of India</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.08em', fontFamily: 'sans-serif' }}>AI SELF SERVICE PORTAL</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px',
              border: '1px solid #e2e8f0', background: 'white',
              color: '#475569', cursor: 'pointer', fontSize: '0.85rem',
              fontFamily: 'sans-serif', fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#1e40af' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
          >
            Analytics Dashboard →
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 0.75rem', borderRadius: '50px',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.75rem', color: '#15803d', fontFamily: 'sans-serif', fontWeight: '600' }}>AI Assistant Online</span>
          </div>
        </div>
      </header>

      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '3rem 2rem', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '5rem', maxWidth: '1100px', width: '100%',
          alignItems: 'center',
        }}>

          {/* Left */}
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.7s ease',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1rem', borderRadius: '50px',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              marginBottom: '1.5rem',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.75rem', color: '#15803d', fontFamily: 'sans-serif', fontWeight: '600' }}>AI ASSISTANT ONLINE</span>
            </div>

            <h1 style={{
              fontSize: '3.8rem', fontWeight: '700',
              color: '#0f172a', lineHeight: '1.1',
              letterSpacing: '-0.03em', marginBottom: '1.5rem',
            }}>
              Banking Help,<br />
              <span style={{
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Instantly.</span>
            </h1>

            <p style={{
              color: '#64748b', fontSize: '1rem', lineHeight: '1.7',
              marginBottom: '2rem', fontFamily: 'sans-serif', fontWeight: '400',
              maxWidth: '420px',
            }}>
              EchoSense is your AI-powered banking assistant for Union Bank of India — available in English and Hindi, 24/7.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
              {features.map(f => (
                <div key={f.label} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 0.9rem', borderRadius: '6px',
                  background: 'white', border: '1px solid #e2e8f0',
                  fontSize: '0.8rem', color: '#475569',
                  fontFamily: 'sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  <span>{f.icon}</span>
                  <span style={{ fontWeight: '500' }}>{f.label}</span>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '1.75rem' }} />

            <div style={{ display: 'flex', gap: '2.5rem' }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#1e40af', letterSpacing: '-0.02em' }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'sans-serif', marginTop: '0.1rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Card */}
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.7s ease 0.15s',
          }}>
            <div style={{
              background: 'white', borderRadius: '20px',
              border: '1px solid #e2e8f0', padding: '2.25rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                marginBottom: '1.75rem', paddingBottom: '1.25rem',
                borderBottom: '1px solid #f1f5f9',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', boxShadow: '0 8px 24px rgba(30,64,175,0.3)',
                }}>🏦</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b' }}>Welcome to EchoSense</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'sans-serif' }}>Select your preferred language</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
                {languages.map((lang, i) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelected(lang.code)}
                    style={{
                      padding: '1rem 1.25rem', borderRadius: '10px',
                      border: selected === lang.code ? '2px solid #3b82f6' : '2px solid #f1f5f9',
                      background: selected === lang.code ? '#eff6ff' : '#fafafa',
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? 'translateX(0)' : 'translateX(16px)',
                      transitionDelay: `${0.3 + i * 0.1}s`,
                    }}
                    onMouseEnter={e => {
                      if (selected !== lang.code) {
                        e.currentTarget.style.borderColor = '#bfdbfe'
                        e.currentTarget.style.background = '#f8faff'
                      }
                    }}
                    onMouseLeave={e => {
                      if (selected !== lang.code) {
                        e.currentTarget.style.borderColor = '#f1f5f9'
                        e.currentTarget.style.background = '#fafafa'
                      }
                    }}
                  >
                    <div>
                      <div style={{
                        fontWeight: '600', fontSize: '1.05rem',
                        color: selected === lang.code ? '#1e40af' : '#1e293b',
                      }}>{lang.native}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'sans-serif', marginTop: '0.15rem' }}>{lang.sub}</div>
                    </div>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      border: selected === lang.code ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                      background: selected === lang.code ? '#3b82f6' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease', flexShrink: 0,
                    }}>
                      {selected === lang.code && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleContinue}
                disabled={!selected}
                style={{
                  width: '100%', padding: '0.95rem', borderRadius: '10px', border: 'none',
                  background: selected ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : '#f1f5f9',
                  color: selected ? '#fff' : '#94a3b8',
                  fontSize: '0.95rem', fontWeight: '600',
                  cursor: selected ? 'pointer' : 'not-allowed',
                  fontFamily: 'sans-serif', letterSpacing: '0.02em',
                  transition: 'all 0.3s ease',
                  boxShadow: selected ? '0 8px 24px rgba(30,64,175,0.3)' : 'none',
                }}
                onMouseEnter={e => { if (selected) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {selected ? `Get Started in ${languages.find(l => l.code === selected)?.label} →` : 'Select a Language'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '1.25rem' }}>
                {['🔒 Secure', '⚡ Fast', '🇮🇳 India-First'].map(item => (
                  <span key={item} style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'sans-serif' }}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer style={{
        padding: '1.1rem 3rem', borderTop: '1px solid #e2e8f0',
        background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 1,
      }}>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'sans-serif' }}>
          © 2025 Union Bank of India · EchoSense AI
        </span>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'sans-serif' }}>
          Powered by Groq AI · English & Hindi
        </span>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}