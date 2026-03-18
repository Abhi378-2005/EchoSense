import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const languages = [
  { code: 'en', label: 'English', native: 'English', sub: 'Continue in English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', sub: 'हिंदी में जारी रखें' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', sub: 'मराठीत सुरू ठेवा' },
]

const features = [
  { icon: '🎙️', label: 'Voice Enabled' },
  { icon: '🔒', label: 'Bank-Grade Security' },
  { icon: '⚡', label: 'Instant AI Response' },
  { icon: '🌐', label: '22 Indian Languages' },
]

export default function Landing() {
  const [selected, setSelected] = useState(null)
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { setTimeout(() => setMounted(true), 100) }, [])

  const handleContinue = () => {
    if (selected) navigate('/chat', { state: { language: selected } })
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f4f6fb',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Georgia', serif", position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,58,107,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 3rem', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', position: 'relative', zIndex: 10, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.6s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #1a3a6b, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>🏦</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1a1a2e' }}>Union Bank of India</div>
            <div style={{ fontSize: '0.65rem', color: '#8892a4', letterSpacing: '0.08em', fontFamily: 'system-ui', textTransform: 'uppercase' }}>AI Self Service Portal</div>
          </div>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'system-ui', fontWeight: '500', transition: 'all 0.2s ease' }} onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}>Analytics Dashboard →</button>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', maxWidth: '1080px', width: '100%', alignItems: 'center' }}>

          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-30px)', transition: 'all 0.8s ease 0.2s' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '50px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)', marginBottom: '1.75rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: '600', letterSpacing: '0.08em', fontFamily: 'system-ui', textTransform: 'uppercase' }}>AI Assistant Online</span>
            </div>
            <h1 style={{ fontSize: '3.6rem', fontWeight: '800', lineHeight: '1.1', color: '#0f172a', marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
              Banking Help,<br />
              <span style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Instantly.</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: '#64748b', lineHeight: '1.8', marginBottom: '2.5rem', fontFamily: 'system-ui', maxWidth: '400px' }}>
              EchoSense understands Hindi, Marathi, English and all 22 Indian languages. Get instant answers to all your banking queries — 24/7.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {features.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: '50px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: '0.85rem' }}>{f.icon}</span>
                  <span style={{ fontSize: '0.75rem', color: '#374151', fontFamily: 'system-ui', fontWeight: '500' }}>{f.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
              {[{ value: '50K+', label: 'Customers Served' }, { value: '1.2s', label: 'Avg Response' }, { value: '94%', label: 'Satisfaction' }].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1a3a6b', letterSpacing: '-0.02em' }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'system-ui', marginTop: '0.2rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease 0.4s' }}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 24px 64px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, #1a3a6b, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(37,99,235,0.3)', animation: 'float 4s ease-in-out infinite' }}>🤖</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>Welcome to EchoSense</h2>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontFamily: 'system-ui', marginBottom: '1.75rem' }}>Choose your language to get started</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem' }}>
                {languages.map((lang, i) => (
                  <button key={lang.code} onClick={() => setSelected(lang.code)} style={{ padding: '0.9rem 1.2rem', borderRadius: '12px', border: selected === lang.code ? '2px solid #2563eb' : '2px solid #f1f5f9', background: selected === lang.code ? 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(26,58,107,0.03))' : '#fafbfc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease', opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(20px)', transitionDelay: `${0.5 + i * 0.1}s` }}
                    onMouseEnter={e => { if (selected !== lang.code) { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc' } }}
                    onMouseLeave={e => { if (selected !== lang.code) { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#fafbfc' } }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: selected === lang.code ? '#1a3a6b' : '#1e293b', marginBottom: '0.1rem' }}>{lang.native}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'system-ui' }}>{lang.sub}</div>
                    </div>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: selected === lang.code ? '2px solid #2563eb' : '2px solid #e2e8f0', background: selected === lang.code ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0 }}>
                      {selected === lang.code && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: '800' }}>✓</span>}
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={handleContinue} disabled={!selected} style={{ width: '100%', padding: '0.95rem', borderRadius: '12px', border: 'none', background: selected ? 'linear-gradient(135deg, #1a3a6b, #2563eb)' : '#f1f5f9', color: selected ? '#fff' : '#94a3b8', fontSize: '0.95rem', fontWeight: '700', cursor: selected ? 'pointer' : 'not-allowed', fontFamily: 'system-ui', transition: 'all 0.3s ease', boxShadow: selected ? '0 8px 24px rgba(37,99,235,0.35)' : 'none' }}
                onMouseEnter={e => { if (selected) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.45)' } }}
                onMouseLeave={e => { if (selected) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.35)' } }}>
                {selected ? 'Start Conversation →' : 'Choose a Language'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                {['🔒 Secure', '⚡ Fast', '🇮🇳 India-First'].map(b => (
                  <span key={b} style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'system-ui' }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: '3px', background: 'linear-gradient(90deg, #1a3a6b, #2563eb, #7c3aed, #2563eb, #1a3a6b)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  )
}