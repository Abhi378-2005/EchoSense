import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import api, { API_BASE } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

const BACKEND_URL = API_BASE

const quickActions = [
  { icon: '💰', label: 'Account Balance' },
  { icon: '📋', label: 'Mini Statement' },
  { icon: '🏦', label: 'Loan Enquiry' },
  { icon: '📝', label: 'File Complaint' },
  { icon: '💳', label: 'Card Services' },
  { icon: '📍', label: 'Branch Locator' },
  { icon: '🪪', label: 'KYC Verification' },
]

const complaintCategories = [
  'ATM / Debit Card Issue',
  'Internet Banking Problem',
  'Loan Related Query',
  'Account Statement Issue',
  'Mobile Banking Issue',
  'Unauthorized Transaction',
  'KYC / Document Update',
  'Other',
]

export default function Chat() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const language = location.state?.language || 'en'
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const socketRef = useRef(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const controlButtonSize = isMobile ? 40 : 38

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: language === 'hi'
        ? 'नमस्ते! मैं EchoSense हूं, Union Bank of India का AI बैंकिंग सहायक। मैं आपकी कैसे मदद कर सकता हूं?'
        : 'Hello! I\'m EchoSense, your AI Banking Assistant for Union Bank of India. How can I help you today?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [muted, setMuted] = useState(false)                // ← mute state
  const [agentMode, setAgentMode] = useState(false)
  const [agentInfo, setAgentInfo] = useState(null)
  const [agentTyping, setAgentTyping] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [complaintCategory, setComplaintCategory] = useState('')
  const [complaintDesc, setComplaintDesc] = useState('')
  const [complaintLoading, setComplaintLoading] = useState(false)
  const [showKYCModal, setShowKYCModal] = useState(false)
  const [kycStep, setKycStep] = useState(1)
  const [kycData, setKycData] = useState({ aadhaar: '', pan: '', otp: '' })
  const [kycLoading, setKycLoading] = useState(false)
  const [generatedOTP, setGeneratedOTP] = useState('')


  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    socketRef.current = io(BACKEND_URL)
    socketRef.current.on('agent_joined', (data) => {
      setEscalating(false)
      setAgentMode(true)
      setAgentInfo(data)
      setMessages(prev => [...prev, { role: 'agent', content: data.message, agentName: data.agentName, timestamp: new Date() }])
    })
    socketRef.current.on('agent_typing', () => setAgentTyping(true))
    socketRef.current.on('agent_message', (data) => {
      setAgentTyping(false)
      setMessages(prev => [...prev, { role: 'agent', content: data.message, agentName: data.agentName || 'Agent', timestamp: new Date() }])
    })
    return () => socketRef.current.disconnect()
  }, [])


  const sendMessage = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg) return
    if (userMsg === 'File Complaint') {
      setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }])
      setTimeout(() => setShowComplaintModal(true), 300)
      setInput('')
      return
    }
    if (userMsg === 'KYC Verification') {
      setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }])
      setTimeout(() => { setKycStep(1); setKycData({ aadhaar: '', pan: '', otp: '' }); setShowKYCModal(true) }, 300)
      setInput('')
      return
    }
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }])
    if (agentMode) { socketRef.current.emit('message_to_agent', { message: userMsg }); return }
    setLoading(true)
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/api/chat', {
        message: userMsg,
        history,
        language,
      })
      const reply = res.data.reply
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }])
      speak(reply)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I\'m having trouble connecting. Please try again.', timestamp: new Date() }])
    }
    setLoading(false)
  }

  const submitComplaint = async () => {
    if (!complaintCategory || !complaintDesc.trim()) return
    setComplaintLoading(true)
    try {
      const res = await api.post('/api/complaints', { category: complaintCategory, description: complaintDesc, language })
      setShowComplaintModal(false)
      setComplaintCategory('')
      setComplaintDesc('')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Your complaint has been successfully registered!\n\nTicket ID: ${res.data.ticketId}\nCategory: ${complaintCategory}\nStatus: Open\n\nOur team will contact you within 24 hours. Is there anything else I can help you with?`,
        timestamp: new Date(), isTicket: true, ticketId: res.data.ticketId
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, could not file complaint. Please try again.', timestamp: new Date() }])
    }
    setComplaintLoading(false)
  }

  const handleKYCNext = () => {
    if (kycStep === 1) {
      if (kycData.aadhaar.length !== 12) return alert('Enter valid 12-digit Aadhaar')
      setKycStep(2)
    } else if (kycStep === 2) {
      if (kycData.pan.length !== 10) return alert('Enter valid 10-character PAN')
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOTP(otp)
      setKycStep(3)
      setMessages(prev => [...prev, { role: 'system', content: 'OTP sent to your registered mobile number ending in ****87', timestamp: new Date() }])
    } else if (kycStep === 3) {
      if (kycData.otp !== generatedOTP) return alert('Invalid OTP. Demo OTP: ' + generatedOTP)
      setKycLoading(true)
      setTimeout(() => { setKycLoading(false); setKycStep(4) }, 2000)
    } else if (kycStep === 4) {
      setShowKYCModal(false)
      setKycStep(1)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Your KYC verification has been completed successfully! Your account is now fully verified and all banking services are activated. Is there anything else I can help you with?', timestamp: new Date(), isKYC: true }])
    }
  }

  const escalateToAgent = () => {
    setEscalating(true)
    setMessages(prev => [...prev, { role: 'system', content: 'Connecting you to a live agent. Please wait...', timestamp: new Date() }])
    socketRef.current.emit('escalate_to_agent', { language })
  }

  // ── Speak with mute support ───────────────────────────────────────────────
  const speak = (text) => {
    if (!window.speechSynthesis || muted) return   // ← respects mute
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.rate = 0.9
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return alert('Voice not supported in this browser')
    const recognition = new SpeechRecognition()
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e) => setInput(e.results[0][0].transcript)
    recognition.onerror = () => setListening(false)
    recognition.start()
  }

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      minHeight: '100vh', height: '100vh',
      background: '#f8f9fc',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : 0,
    }}>
      <div style={{ height: '3px', background: agentMode ? 'linear-gradient(90deg, #16a34a, #4ade80)' : 'linear-gradient(90deg, #1e40af, #3b82f6)', flexShrink: 0, transition: 'all 0.5s' }} />

      <header style={{
        padding: isMobile ? '0.75rem 0.9rem' : '0.85rem 1.75rem', background: 'white',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '0.5rem',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
          <button onClick={() => navigate('/')} style={{
            padding: isMobile ? '0.55rem 0.8rem' : '0.4rem 0.9rem', borderRadius: '8px',
            border: '1px solid #e2e8f0', background: 'white',
            color: '#64748b', cursor: 'pointer', fontSize: '0.82rem',
            fontFamily: 'sans-serif', fontWeight: '600', transition: 'all 0.2s',
            minHeight: isMobile ? '44px' : 'auto',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >← Back</button>
          {!isMobile && <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />}
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: agentMode ? 'linear-gradient(135deg, #16a34a, #4ade80)' : 'linear-gradient(135deg, #1e40af, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', transition: 'all 0.5s ease',
            boxShadow: agentMode ? '0 4px 12px rgba(22,163,74,0.3)' : '0 4px 12px rgba(30,64,175,0.3)',
          }}>
            {agentMode ? '👨‍💼' : '🤖'}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>
              {agentMode ? agentInfo?.agentName || 'Live Agent' : 'EchoSense'}
            </div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'sans-serif', color: agentMode ? '#16a34a' : speaking ? '#16a34a' : loading ? '#d97706' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {(agentMode || speaking || loading) && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: agentMode ? '#22c55e' : speaking ? '#22c55e' : '#f59e0b', animation: 'pulse 1.5s infinite' }} />}
              {agentMode ? 'Live Agent Connected' : speaking ? 'Speaking...' : loading ? 'Thinking...' : isMobile ? 'Online' : 'Online · Union Bank of India'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: isMobile ? 'flex-start' : 'flex-end', width: isMobile ? '100%' : 'auto' }}>
          {user && (
            <div style={{ padding: isMobile ? '0.45rem 0.75rem' : '0.3rem 0.7rem', borderRadius: '50px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: isMobile ? '0.7rem' : '0.72rem', color: '#1d4ed8', fontFamily: 'sans-serif', fontWeight: '600', minHeight: isMobile ? '44px' : 'auto', display: 'flex', alignItems: 'center' }}>
              {user.name}
            </div>
          )}
          <button
            onClick={async () => { await logout(); navigate('/auth') }}
            style={{
              padding: isMobile ? '0.45rem 0.75rem' : '0.3rem 0.75rem',
              borderRadius: '50px',
              border: '1px solid #fecaca',
              background: '#fff1f2',
              color: '#be123c',
              fontSize: isMobile ? '0.7rem' : '0.72rem',
              fontWeight: '600',
              cursor: 'pointer',
              minHeight: isMobile ? '44px' : 'auto',
            }}
          >
            Logout
          </button>
          {agentMode && (
            <div style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.3rem 0.8rem', borderRadius: '50px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: '0.75rem', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', minHeight: isMobile ? '44px' : 'auto' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
              Live Support
            </div>
          )}
          {/* ── Mute toggle button ── */}
          <button
            onClick={() => { setMuted(m => !m); window.speechSynthesis.cancel(); setSpeaking(false) }}
            title={muted ? 'Unmute voice' : 'Mute voice'}
            style={{
              padding: isMobile ? '0.45rem 0.8rem' : '0.3rem 0.8rem', borderRadius: '50px',
              background: muted ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${muted ? '#FECACA' : '#BBF7D0'}`,
              color: muted ? '#DC2626' : '#16A34A',
              fontSize: isMobile ? '0.7rem' : '0.75rem', fontFamily: 'sans-serif',
              fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              minHeight: isMobile ? '44px' : 'auto',
            }}
          >
            {muted ? '🔇 Muted' : '🔊 Voice On'}
          </button>
          <div style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.3rem 0.8rem', borderRadius: '50px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: isMobile ? '0.7rem' : '0.75rem', color: '#1d4ed8', fontFamily: 'sans-serif', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', minHeight: isMobile ? '44px' : 'auto' }}>
            🇮🇳 {language === 'hi' ? 'हिंदी' : 'English'}
          </div>
        </div>
      </header>

      {!agentMode && (
        <div style={{
          padding: isMobile ? '0.6rem 0.9rem' : '0.75rem 1.75rem',
          background: 'white',
          borderBottom: '1px solid #f1f5f9',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(7, max-content)',
          gap: '0.55rem',
          overflowX: isMobile ? 'visible' : 'auto',
          flexShrink: 0,
          WebkitOverflowScrolling: 'touch',
          alignItems: 'stretch',
        }}>
          {quickActions.map(action => (
            <button key={action.label} onClick={() => sendMessage(action.label)}
              style={{
                padding: isMobile ? '0.6rem 0.9rem' : '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                background: 'white', color: '#475569', cursor: 'pointer', whiteSpace: isMobile ? 'normal' : 'nowrap',
                fontSize: isMobile ? '0.8rem' : '0.78rem', fontFamily: 'sans-serif', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.2s ease',
                minHeight: isMobile ? '44px' : 'auto',
                justifyContent: isMobile ? 'center' : 'flex-start',
                textAlign: isMobile ? 'center' : 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.color = '#1d4ed8' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      )}


      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem 0.8rem' : '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#f8f9fc' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.6rem', animation: 'fadeSlideIn 0.3s ease' }}>
            {(msg.role === 'assistant' || msg.role === 'agent') && (
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: msg.role === 'agent' ? 'linear-gradient(135deg, #16a34a, #4ade80)' : 'linear-gradient(135deg, #1e40af, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0, boxShadow: msg.role === 'agent' ? '0 2px 8px rgba(22,163,74,0.3)' : '0 2px 8px rgba(30,64,175,0.3)' }}>
                {msg.role === 'agent' ? '👨‍💼' : '🤖'}
              </div>
            )}
            {msg.role === 'system' && (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#d97706', fontFamily: 'sans-serif', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.35rem 1rem', borderRadius: '50px' }}>{msg.content}</span>
              </div>
            )}
            {msg.role !== 'system' && (
              <div style={{ maxWidth: isMobile ? '92%' : '62%' }}>
                {msg.role === 'agent' && <div style={{ fontSize: '0.68rem', color: '#16a34a', marginBottom: '0.25rem', fontFamily: 'sans-serif', fontWeight: '600' }}>{msg.agentName}</div>}
                <div style={{
                  padding: '0.85rem 1.1rem',
                  borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : msg.role === 'agent' ? '#f0fdf4' : msg.isTicket || msg.isKYC ? '#f0f9ff' : 'white',
                  border: msg.role === 'user' ? 'none' : msg.role === 'agent' ? '1px solid #bbf7d0' : msg.isTicket || msg.isKYC ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                  fontSize: '0.9rem', lineHeight: '1.6', color: msg.role === 'user' ? '#fff' : '#334155',
                  whiteSpace: 'pre-line', fontFamily: 'sans-serif',
                  boxShadow: msg.role === 'user' ? '0 4px 12px rgba(30,64,175,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {(msg.isTicket || msg.isKYC) && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: msg.isKYC ? '#dcfce7' : '#dbeafe', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em', color: msg.isKYC ? '#15803d' : '#1d4ed8' }}>
                      {msg.isKYC ? '✅ KYC VERIFIED' : '🎫 TICKET RAISED'}
                    </div>
                  )}
                  <div>{msg.content}</div>
                  {msg.isTicket && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.78rem', color: '#0369a1', border: '1px solid #bae6fd' }}>
                      Track: UBI App → My Complaints → {msg.ticketId}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem', textAlign: msg.role === 'user' ? 'right' : 'left', fontFamily: 'sans-serif' }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            )}
          </div>
        ))}

        {(loading || agentTyping) && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: agentTyping ? 'linear-gradient(135deg, #16a34a, #4ade80)' : 'linear-gradient(135deg, #1e40af, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
              {agentTyping ? '👨‍💼' : '🤖'}
            </div>
            <div style={{ padding: '0.85rem 1.1rem', borderRadius: '12px 12px 12px 3px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', gap: '4px', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: agentTyping ? '#22c55e' : '#3b82f6', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: isMobile ? '0.85rem 0.8rem calc(1rem + env(safe-area-inset-bottom, 0px))' : '1rem 1.75rem 1.25rem', background: 'white', borderTop: '1px solid #e2e8f0', flexShrink: 0, boxShadow: '0 -1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: isMobile ? '0.35rem' : '0.6rem', alignItems: 'center', background: '#f8f9fc', border: `1.5px solid ${agentMode ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '12px', padding: isMobile ? '0.45rem 0.45rem 0.45rem 0.65rem' : '0.4rem 0.4rem 0.4rem 1rem', transition: 'border 0.3s ease', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={agentMode ? 'Message live agent...' : language === 'hi' ? 'Apna sandesh likhen...' : 'Type your message...'}
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: '#1e293b', fontSize: isMobile ? '16px' : '0.9rem', outline: 'none', fontFamily: 'sans-serif' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.3rem' : '0.45rem', flexShrink: 0 }}>
            {!agentMode && (
              <button onClick={escalateToAgent} disabled={escalating} title="Connect to Live Agent"
                style={{ width: `${controlButtonSize}px`, height: `${controlButtonSize}px`, borderRadius: '10px', border: 'none', background: escalating ? '#fffbeb' : '#f0fdf4', color: escalating ? '#d97706' : '#16a34a', cursor: escalating ? 'not-allowed' : 'pointer', fontSize: '1rem', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {escalating ? '\u23F3' : '\u{1F468}\u200D\u{1F4BC}'}
              </button>
            )}
            <button onClick={startListening} style={{ width: `${controlButtonSize}px`, height: `${controlButtonSize}px`, borderRadius: '10px', border: 'none', background: listening ? '#fef2f2' : '#f8f9fc', color: listening ? '#ef4444' : '#94a3b8', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: listening ? '0 0 0 3px rgba(239,68,68,0.15)' : 'none', flexShrink: 0 }}>
              {listening ? '\u{1F534}' : '\u{1F3A4}\uFE0F'}
            </button>
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              style={{ width: `${controlButtonSize}px`, height: `${controlButtonSize}px`, borderRadius: '10px', border: 'none', background: input.trim() && !loading ? agentMode ? 'linear-gradient(135deg, #16a34a, #4ade80)' : 'linear-gradient(135deg, #1e40af, #3b82f6)' : '#f1f5f9', color: input.trim() && !loading ? '#fff' : '#94a3b8', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', fontSize: '1rem', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: input.trim() && !loading ? '0 4px 12px rgba(30,64,175,0.3)' : 'none', flexShrink: 0 }}>{'\u27A4'}</button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', padding: '0 0.25rem', gap: '0.5rem' }}>
          {agentMode ? (
            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontFamily: 'sans-serif', fontWeight: '600' }}>Connected to {agentInfo?.agentName} ({agentInfo?.agentId})</span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'sans-serif' }}>🔒 Secured · Union Bank of India</span>
          )}
          {!isMobile && <span style={{ fontSize: '0.68rem', color: '#cbd5e1', fontFamily: 'sans-serif' }}>Powered by Groq AI · English & Hindi</span>}
        </div>
      </div>

      {showComplaintModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => e.target === e.currentTarget && setShowComplaintModal(false)}>
          <div style={{ width: '100%', maxWidth: isMobile ? '100%' : '560px', minHeight: isMobile ? '100%' : 'auto', background: 'white', borderRadius: isMobile ? '0' : '20px 20px 0 0', padding: isMobile ? '1rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px))' : '2rem', animation: 'slideUp 0.35s ease', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>File a Complaint</h2>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'sans-serif', marginTop: '0.1rem' }}>We'll respond within 24 hours</p>
              </div>
              <button onClick={() => setShowComplaintModal(false)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8f9fc', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'sans-serif', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>SELECT CATEGORY</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {complaintCategories.map(cat => (
                <button key={cat} onClick={() => setComplaintCategory(cat)}
                  style={{ padding: isMobile ? '0.72rem 0.85rem' : '0.6rem 0.8rem', borderRadius: '8px', cursor: 'pointer', border: complaintCategory === cat ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0', background: complaintCategory === cat ? '#eff6ff' : '#fafafa', color: complaintCategory === cat ? '#1d4ed8' : '#475569', fontSize: '0.78rem', fontFamily: 'sans-serif', textAlign: 'left', fontWeight: complaintCategory === cat ? '600' : '400', transition: 'all 0.15s', minHeight: isMobile ? '44px' : 'auto' }}>
                  {cat}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'sans-serif', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>DESCRIBE YOUR ISSUE</p>
            <textarea value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} placeholder="Please describe your issue in detail..." rows={3}
              style={{ width: '100%', background: '#fafafa', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '0.8rem 0.9rem', color: '#1e293b', fontSize: '0.88rem', resize: 'none', outline: 'none', marginBottom: '1.25rem', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <button onClick={submitComplaint} disabled={!complaintCategory || !complaintDesc.trim() || complaintLoading}
              style={{ width: '100%', padding: isMobile ? '0.95rem' : '0.9rem', borderRadius: '10px', border: 'none', background: complaintCategory && complaintDesc.trim() && !complaintLoading ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : '#f1f5f9', color: complaintCategory && complaintDesc.trim() ? '#fff' : '#94a3b8', fontSize: '0.9rem', fontWeight: '600', fontFamily: 'sans-serif', cursor: complaintCategory && complaintDesc.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease', boxShadow: complaintCategory && complaintDesc.trim() ? '0 4px 16px rgba(30,64,175,0.3)' : 'none', minHeight: isMobile ? '46px' : 'auto' }}>
              {complaintLoading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </div>
      )}

      {showKYCModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '1rem' }}
          onClick={(e) => e.target === e.currentTarget && setShowKYCModal(false)}>
          <div style={{ width: '100%', maxWidth: isMobile ? '100%' : '440px', minHeight: isMobile ? '100%' : 'auto', background: 'white', borderRadius: isMobile ? '0' : '20px', padding: isMobile ? '1rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px))' : '2rem', animation: 'slideUp 0.35s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem' }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= kycStep ? '#3b82f6' : '#f1f5f9', transition: 'background 0.3s ease' }} />
              ))}
            </div>
            {kycStep === 1 && (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🪪</div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>Aadhaar Verification</h2>
                <p style={{ color: '#64748b', fontSize: '0.82rem', fontFamily: 'sans-serif', marginBottom: '1.5rem' }}>Enter your 12-digit Aadhaar number</p>
                <input type="number" placeholder="XXXX XXXX XXXX" value={kycData.aadhaar} onChange={e => setKycData(p => ({ ...p, aadhaar: e.target.value.slice(0, 12) }))}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', background: '#f8f9fc', border: '1.5px solid #e2e8f0', color: '#1e293b', fontSize: '1.1rem', outline: 'none', letterSpacing: '0.1em', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
            )}
            {kycStep === 2 && (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>PAN Verification</h2>
                <p style={{ color: '#64748b', fontSize: '0.82rem', fontFamily: 'sans-serif', marginBottom: '1.5rem' }}>Enter your 10-character PAN number</p>
                <input type="text" placeholder="ABCDE1234F" value={kycData.pan} onChange={e => setKycData(p => ({ ...p, pan: e.target.value.toUpperCase().slice(0, 10) }))}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', background: '#f8f9fc', border: '1.5px solid #e2e8f0', color: '#1e293b', fontSize: '1.1rem', outline: 'none', letterSpacing: '0.2em', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
            )}
            {kycStep === 3 && (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📱</div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>OTP Verification</h2>
                <p style={{ color: '#64748b', fontSize: '0.82rem', fontFamily: 'sans-serif', marginBottom: '0.4rem' }}>Enter the 6-digit OTP sent to ****87</p>
                <p style={{ color: '#3b82f6', fontSize: '0.8rem', fontFamily: 'sans-serif', marginBottom: '1.5rem', fontWeight: '600' }}>Demo OTP: {generatedOTP}</p>
                <input type="number" placeholder="• • • • • •" value={kycData.otp} onChange={e => setKycData(p => ({ ...p, otp: e.target.value.slice(0, 6) }))}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', background: '#f8f9fc', border: '1.5px solid #e2e8f0', color: '#1e293b', fontSize: '1.5rem', outline: 'none', letterSpacing: '0.4em', textAlign: 'center', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
            )}
            {kycStep === 4 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.25rem' }}>✅</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>KYC Verified!</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontFamily: 'sans-serif', marginBottom: '1.5rem' }}>Your identity has been successfully verified.</p>
                <div style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[{ label: 'Aadhaar', value: '****' + kycData.aadhaar.slice(-4) }, { label: 'PAN', value: kycData.pan.slice(0, 3) + '*****' + kycData.pan.slice(-2) }, { label: 'Status', value: 'Verified ✓' }].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontFamily: 'sans-serif' }}>
                      <span style={{ color: '#94a3b8' }}>{item.label}</span>
                      <span style={{ color: item.label === 'Status' ? '#16a34a' : '#334155', fontWeight: '600' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleKYCNext} disabled={kycLoading}
              style={{ width: '100%', padding: isMobile ? '0.95rem' : '0.9rem', borderRadius: '10px', border: 'none', marginTop: '1.5rem', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', fontSize: '0.9rem', fontWeight: '600', fontFamily: 'sans-serif', cursor: kycLoading ? 'not-allowed' : 'pointer', opacity: kycLoading ? 0.7 : 1, transition: 'all 0.3s ease', boxShadow: '0 4px 16px rgba(30,64,175,0.3)', minHeight: isMobile ? '46px' : 'auto' }}>
              {kycLoading ? 'Verifying...' : kycStep === 4 ? 'Done' : 'Continue →'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
      `}</style>
    </div>
  )
}
