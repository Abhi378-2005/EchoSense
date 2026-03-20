import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const initialForm = { name: '', email: '', password: '' }

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from

  const onChange = event => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const onSubmit = async event => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (mode === 'register') {
        await register(form)
      } else {
        await login(form)
      }

      if (from?.pathname) {
        navigate(from.pathname, { replace: true, state: from.state })
      } else {
        navigate('/chat', { replace: true })
      }
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach backend. Check backend is running, VITE_BACKEND_URL, and FRONTEND_ORIGIN/CORS.')
      } else {
        setError(err.response?.data?.error || `Authentication failed (HTTP ${err.response.status}).`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #eff6ff 0%, #f8fafc 45%, #eef2ff 100%)',
      display: 'grid',
      placeItems: 'center',
      padding: '1rem',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #dbeafe',
        boxShadow: '0 18px 55px rgba(30,64,175,0.12)',
        padding: '1.5rem',
      }}>
        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem' }}>Secure Sign In</h1>
        <p style={{ margin: '0.45rem 0 1.2rem', color: '#64748b', fontSize: '0.9rem' }}>
          Authenticate to access banking chat, analytics, and complaint services.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['login', 'register'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => { setMode(type); setError('') }}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 10,
                border: mode === type ? '1px solid #2563eb' : '1px solid #cbd5e1',
                background: mode === type ? '#dbeafe' : '#fff',
                color: mode === type ? '#1d4ed8' : '#475569',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {type === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
          {mode === 'register' && (
            <input
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={onChange}
              required
              minLength={2}
              maxLength={80}
              style={inputStyle}
            />
          )}

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            required
            style={inputStyle}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            required
            minLength={8}
            style={inputStyle}
          />

          {error && <div style={{ color: '#dc2626', fontSize: '0.84rem' }}>{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              height: 44,
              borderRadius: 10,
              border: 'none',
              background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  height: 42,
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  padding: '0 12px',
  outline: 'none',
  fontSize: '0.95rem',
}
