import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

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
  const language = location.state?.language || 'en'
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const socketRef = useRef(null)

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: language === 'hi'
      ? 'नमस्ते! मैं EchoSense हूं, आपका AI बैंकिंग सहायक। मैं आपकी कैसे मदद कर सकता हूं?'
      : language === 'mr'
      ? 'नमस्कार! मी EchoSense आहे, तुमचा AI बँकिंग सहाय्यक. मी तुम्हाला कशी मदत करू शकतो?'
      : 'Hello! I am EchoSense, your AI Banking Assistant for Union Bank of India. How can I help you today?',
    timestamp: new Date()
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    socketRef.current = io(BACKEND_URL)
    socketRef.current.on('agent_joined', (data) => {
      setEscalating(false); setAgentMode(true); setAgentInfo(data)
      setMessages(prev => [...prev, { role: 'agent', content: data.message, agentName: data.agentName, timestamp: new Date() }])
    })
    socketRef.current.on('agent_typing', () => setAgentTyping(true))
    socketRef.current.on('agent_message', (data) => {
      setAgentTyping(false)
      setMessages(prev => [...prev, { role: 'agent', content: data.message, agentName: data.agentName || 'Agent', timestamp: new Date() }])
    })
    return () => socketRef.current.disconnect()
  }, [])

  const detectLanguage = (text) => {
    const hindiPattern = /[\u0900-\u097F]/
    const marathiWords = ['आहे', 'आहेत', 'मला', 'तुम्ही', 'कसे', 'नाही', 'हवे', 'सांगा']
    if (hindiPattern.test(text)) {
      return marathiWords.some(w => text.includes(w)) ? 'mr-IN' : 'hi-IN'
    }
    return 'en-IN'
  }

  const sendMessage = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg) return
    if (userMsg === 'File Complaint') {
      setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }])
      setTimeout(() => setShowComplaintModal(true), 300)
      setInput(''); return
    }
    if (userMsg === 'KYC Verification') {
      setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }])
      setTimeout(() => { setKycStep(1); setKycData({ aadhaar: '', pan: '', otp: '' }); setShowKYCModal(true) }, 300)
      setInput(''); return
    }
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }])
    if (agentMode) { socketRef.current.emit('message_to_agent', { message: userMsg }); return }
    setLoading(true)
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await axios.post(`${BACKEND_URL}/api/chat`, { message: userMsg, history, language })
      const reply = res.data.reply
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }])
      speak(reply)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting. Please try again.', timestamp: new Date() }])
    }
    setLoading(false)
  }

  const submitComplaint = async () => {
    if (!complaintCategory || !complaintDesc.trim()) return
    setComplaintLoading(true)
    try {
      const res = await axios.post(`${BACKEND_URL}/api/complaints`, { category: complaintCategory, description: complaintDesc, language })
      setShowComplaintModal(false); setComplaintCategory(''); setComplaintDesc('')
      setMessages(prev => [...prev, { role: 'assistant', content: `Your complaint has been successfully registered!\n\nTicket ID: ${res.data.ticketId}\nCategory: ${complaintCategory}\nStatus: Open\n\nOur team will contact you within 24 hours. Is there anything else I can help you with?`, timestamp: new Date(), isTicket: true, ticketId: res.data.ticketId }])
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
      setGeneratedOTP(otp); setKycStep(3)
      setMessages(prev => [...prev, { role: 'system', content: 'OTP sent to your registered mobile number ending in ****87', timestamp: new Date() }])
    } else if (kycStep === 3) {
      if (kycData.otp !== generatedOTP) return alert('Invalid OTP. Demo OTP: ' + generatedOTP)
      setKycLoading(true)
      setTimeout(() => { setKycLoading(false); setKycStep(4) }, 2000)
    } else if (kycStep === 4) {
      setShowKYCModal(false); setKycStep(1)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Your KYC verification has been completed successfully! Your account is now fully verified and all banking services are activated. Is there anything else I can help you with?', timestamp: new Date(), isKYC: true }])
    }
  }

  const escalateToAgent = () => {
    setEscalating(true)
    setMessages(prev => [...prev, { role: 'system', content: 'Connecting you to a live agent. Please wait...', timestamp: new Date() }])
    socketRef.current.emit('escalate_to_agent', { language })
  }

  const speak = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = detectLanguage(text)
    utterance.rate = 0.9
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert('Voice not supported in this browser')
    const recognition = new SR()
    recognition.lang = 'hi-IN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e) => setInput(e.results[0][0].transcript)
    recognition.onerror = () => setListening(false)
    recognition.start()
  }

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const accentColor = agentMode ? '#16a34a' : '#2563eb'
  const accentBg = agentMode ? 'rgba(22,163,74,0.08)' : 'rgba(37,99,235,0.08)'

  return (
    <div style={{
      minHeight: '100vh', background: '#f4f6fb',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1e293b', transition: 'all 0.5s ease',
    }}>

      {/* Header */}
      <div style={{
        padding: '0.9rem 1.75rem',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <button onClick={() => navigate('/')} style={{
            background: 'transparent', border: '1px solid #e2e8f0',
            color: '#64748b', borderRadius: '8px', padding: '0.35rem 0.8rem',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
          >← Back</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: agentMode
                ? 'linear-gradient(135deg, #15803d, #16a34a)'
                : 'linear-gradient(135deg, #1a3a6b, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', transition: 'all 0.5s ease',
              boxShadow: agentMode ? '0 4px 12px rgba(22,163,74,0.3)' : '0 4px 12px rgba(37,99,235,0.3)',
            }}>
              {agentMode ? '👨‍💼' : '🤖'}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>
                {agentMode ? agentInfo?.agentName || 'Live Agent' : 'EchoSense'}
              </div>
              <div style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: agentMode ? '#22c55e' : speaking ? '#22c55e' : loading ? '#d97706' : '#22c55e',
                  animation: 'blink 1.5s infinite',
                }} />
                <span style={{ color: '#64748b' }}>
                  {agentMode ? 'Live Agent Connected' : speaking ? 'Speaking...' : loading ? 'Thinking...' : 'Online'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {agentMode && (
            <div style={{
              padding: '0.3rem 0.75rem', borderRadius: '50px',
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
              color: '#16a34a', fontSize: '0.72rem', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s infinite' }} />
              Live Support
            </div>
          )}
          <div style={{
            padding: '0.3rem 0.75rem', borderRadius: '50px',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            fontSize: '0.72rem', color: '#64748b', fontWeight: '500',
          }}>Auto Language</div>
        </div>
      </div>

      {/* Quick Actions */}
      {!agentMode && (
        <div style={{
          padding: '0.75rem 1.75rem', display: 'flex', gap: '0.5rem',
          overflowX: 'auto', background: '#fff',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}>
          {quickActions.map(action => (
            <button key={action.label} onClick={() => sendMessage(action.label)}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '50px',
                border: '1px solid #e2e8f0', background: '#f8fafc',
                color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: '0.78rem', display: 'flex', alignItems: 'center',
                gap: '0.35rem', transition: 'all 0.2s ease', fontWeight: '500',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(37,99,235,0.06)'
                e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)'
                e.currentTarget.style.color = '#2563eb'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f8fafc'
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.color = '#374151'
              }}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        background: '#f4f6fb',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end', gap: '0.6rem',
            animation: 'fadeInUp 0.3s ease',
          }}>
            {(msg.role === 'assistant' || msg.role === 'agent') && (
              <div style={{
                width: '30px', height: '30px', borderRadius: '10px',
                background: msg.role === 'agent'
                  ? 'linear-gradient(135deg, #15803d, #16a34a)'
                  : 'linear-gradient(135deg, #1a3a6b, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', flexShrink: 0,
                boxShadow: msg.role === 'agent' ? '0 2px 8px rgba(22,163,74,0.25)' : '0 2px 8px rgba(37,99,235,0.25)',
              }}>
                {msg.role === 'agent' ? '👨‍💼' : '🤖'}
              </div>
            )}

            {msg.role === 'system' && (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <span style={{
                  fontSize: '0.75rem', color: '#d97706',
                  background: 'rgba(217,119,6,0.08)',
                  border: '1px solid rgba(217,119,6,0.15)',
                  padding: '0.35rem 0.9rem', borderRadius: '50px',
                  fontWeight: '500',
                }}>{msg.content}</span>
              </div>
            )}

            {msg.role !== 'system' && (
              <div style={{ maxWidth: '60%' }}>
                {msg.role === 'agent' && (
                  <div style={{ fontSize: '0.68rem', color: '#16a34a', marginBottom: '0.25rem', fontWeight: '600' }}>
                    {msg.agentName}
                  </div>
                )}
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #1a3a6b, #2563eb)'
                    : msg.role === 'agent'
                    ? '#fff'
                    : msg.isTicket || msg.isKYC
                    ? '#fff'
                    : '#fff',
                  border: msg.role === 'user' ? 'none'
                    : msg.role === 'agent' ? '1px solid rgba(22,163,74,0.2)'
                    : msg.isTicket ? '1px solid rgba(37,99,235,0.15)'
                    : msg.isKYC ? '1px solid rgba(22,163,74,0.15)'
                    : '1px solid rgba(0,0,0,0.06)',
                  fontSize: '0.88rem', lineHeight: '1.65',
                  color: msg.role === 'user' ? '#fff' : '#1e293b',
                  whiteSpace: 'pre-line',
                  boxShadow: msg.role === 'user' ? '0 4px 12px rgba(37,99,235,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  {(msg.isTicket || msg.isKYC) && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      marginBottom: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '6px',
                      background: msg.isKYC ? 'rgba(22,163,74,0.1)' : 'rgba(37,99,235,0.1)',
                      fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em',
                      color: msg.isKYC ? '#16a34a' : '#2563eb',
                      border: msg.isKYC ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(37,99,235,0.2)',
                    }}>
                      {msg.isKYC ? '✅ KYC VERIFIED' : '🎫 TICKET RAISED'}
                    </div>
                  )}
                  <div>{msg.content}</div>
                  {msg.isTicket && (
                    <div style={{
                      marginTop: '0.6rem', padding: '0.4rem 0.6rem',
                      background: 'rgba(37,99,235,0.05)', borderRadius: '8px',
                      fontSize: '0.72rem', color: '#2563eb', fontWeight: '500',
                      border: '1px solid rgba(37,99,235,0.1)',
                    }}>
                      Track: UBI App → My Complaints → {msg.ticketId}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            )}
          </div>
        ))}

        {(loading || agentTyping) && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '10px',
              background: agentTyping ? 'linear-gradient(135deg, #15803d, #16a34a)' : 'linear-gradient(135deg, #1a3a6b, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem',
            }}>
              {agentTyping ? '👨‍💼' : '🤖'}
            </div>
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '14px 14px 14px 4px',
              background: '#fff', border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', gap: '4px', alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: agentTyping ? '#16a34a' : '#2563eb',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.7,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1rem 1.75rem 1.25rem',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          display: 'flex', gap: '0.5rem', alignItems: 'center',
          background: '#f8fafc',
          border: `1.5px solid ${agentMode ? 'rgba(22,163,74,0.25)' : 'rgba(37,99,235,0.15)'}`,
          borderRadius: '14px', padding: '0.4rem 0.4rem 0.4rem 1rem',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={agentMode ? 'Message live agent...' : 'Type in any language — Hindi, Marathi, English...'}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: '#1e293b', fontSize: '0.88rem', outline: 'none',
              fontFamily: 'system-ui',
            }}
          />
          {!agentMode && (
            <button onClick={escalateToAgent} disabled={escalating} title="Connect to Live Agent"
              style={{
                width: '38px', height: '38px', borderRadius: '10px', border: 'none',
                background: escalating ? 'rgba(217,119,6,0.1)' : 'rgba(22,163,74,0.08)',
                color: escalating ? '#d97706' : '#16a34a',
                cursor: escalating ? 'not-allowed' : 'pointer',
                fontSize: '1rem', transition: 'all 0.2s ease', flexShrink: 0,
              }}>
              {escalating ? '⏳' : '👨‍💼'}
            </button>
          )}
          <button onClick={startListening}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', border: 'none',
              background: listening ? 'rgba(220,38,38,0.1)' : 'rgba(0,0,0,0.04)',
              color: listening ? '#dc2626' : '#64748b',
              cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: listening ? '0 0 12px rgba(220,38,38,0.2)' : 'none',
            }}>
            {listening ? '🔴' : '🎙️'}
          </button>
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', border: 'none',
              background: input.trim() && !loading
                ? agentMode ? 'linear-gradient(135deg, #15803d, #16a34a)' : 'linear-gradient(135deg, #1a3a6b, #2563eb)'
                : '#f1f5f9',
              color: input.trim() && !loading ? '#fff' : '#94a3b8',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              fontSize: '0.95rem', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: input.trim() && !loading ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
            }}>➤</button>
        </div>

        {agentMode && (
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '500' }}>
              Connected to {agentInfo?.agentName} ({agentInfo?.agentId})
            </span>
          </div>
        )}
        <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#94a3b8', paddingTop: '0.5rem' }}>
          Powered by Groq AI • Supports Hindi, Marathi, English & all Indian Languages
        </div>
      </div>

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={(e) => e.target === e.currentTarget && setShowComplaintModal(false)}>
          <div style={{
            width: '100%', maxWidth: '560px',
            background: '#fff', borderRadius: '24px 24px 0 0',
            padding: '2rem', animation: 'slideUp 0.35s ease',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>File a Complaint</h2>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>We'll resolve this within 24 hours</p>
              </div>
              <button onClick={() => setShowComplaintModal(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}>✕</button>
            </div>

            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.6rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Select Category</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {complaintCategories.map(cat => (
                <button key={cat} onClick={() => setComplaintCategory(cat)}
                  style={{
                    padding: '0.6rem 0.8rem', borderRadius: '10px', cursor: 'pointer',
                    border: complaintCategory === cat ? '1.5px solid #2563eb' : '1.5px solid #f1f5f9',
                    background: complaintCategory === cat ? 'rgba(37,99,235,0.06)' : '#fafbfc',
                    color: complaintCategory === cat ? '#2563eb' : '#64748b',
                    fontSize: '0.78rem', textAlign: 'left', transition: 'all 0.2s', fontWeight: '500',
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.6rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Describe Issue</p>
            <textarea value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)}
              placeholder="Please describe your issue in detail..."
              rows={4}
              style={{
                width: '100%', background: '#fafbfc',
                border: '1.5px solid #f1f5f9', borderRadius: '12px',
                padding: '0.8rem 1rem', color: '#1e293b', fontSize: '0.85rem',
                resize: 'none', outline: 'none', marginBottom: '1.25rem',
                boxSizing: 'border-box', fontFamily: 'system-ui',
                transition: 'border 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#f1f5f9'}
            />
            <button onClick={submitComplaint} disabled={!complaintCategory || !complaintDesc.trim() || complaintLoading}
              style={{
                width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
                background: complaintCategory && complaintDesc.trim() && !complaintLoading
                  ? 'linear-gradient(135deg, #1a3a6b, #2563eb)' : '#f1f5f9',
                color: complaintCategory && complaintDesc.trim() ? '#fff' : '#94a3b8',
                fontSize: '0.9rem', fontWeight: '700', fontFamily: 'system-ui',
                cursor: complaintCategory && complaintDesc.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: complaintCategory && complaintDesc.trim() ? '0 8px 24px rgba(37,99,235,0.3)' : 'none',
              }}>
              {complaintLoading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </div>
      )}

      {/* KYC Modal */}
      {showKYCModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={(e) => e.target === e.currentTarget && setShowKYCModal(false)}>
          <div style={{
            width: '100%', maxWidth: '440px', background: '#fff',
            borderRadius: '24px', padding: '2rem',
            animation: 'fadeInUp 0.35s ease',
            boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem' }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{
                  flex: 1, height: '3px', borderRadius: '2px',
                  background: s <= kycStep ? 'linear-gradient(90deg, #1a3a6b, #2563eb)' : '#f1f5f9',
                  transition: 'background 0.4s ease',
                }} />
              ))}
            </div>

            {kycStep === 1 && (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🪪</div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>Aadhaar Verification</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.5rem' }}>Enter your 12-digit Aadhaar number</p>
                <input type="number" placeholder="XXXX XXXX XXXX" value={kycData.aadhaar}
                  onChange={e => setKycData(p => ({ ...p, aadhaar: e.target.value.slice(0, 12) }))}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b', fontSize: '1.1rem', outline: 'none', letterSpacing: '0.15em', boxSizing: 'border-box', fontFamily: 'system-ui', transition: 'border 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
            )}
            {kycStep === 2 && (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>PAN Verification</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.5rem' }}>Enter your 10-character PAN number</p>
                <input type="text" placeholder="ABCDE1234F" value={kycData.pan}
                  onChange={e => setKycData(p => ({ ...p, pan: e.target.value.toUpperCase().slice(0, 10) }))}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b', fontSize: '1.1rem', outline: 'none', letterSpacing: '0.25em', boxSizing: 'border-box', fontFamily: 'system-ui', transition: 'border 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
            )}
            {kycStep === 3 && (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📱</div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>OTP Verification</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '0.4rem' }}>Enter the 6-digit OTP sent to ****87</p>
                <p style={{ color: '#2563eb', fontSize: '0.78rem', marginBottom: '1.5rem', fontWeight: '500' }}>Demo OTP: {generatedOTP}</p>
                <input type="number" placeholder="000000" value={kycData.otp}
                  onChange={e => setKycData(p => ({ ...p, otp: e.target.value.slice(0, 6) }))}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b', fontSize: '1.5rem', outline: 'none', letterSpacing: '0.4em', textAlign: 'center', boxSizing: 'border-box', fontFamily: 'system-ui', transition: 'border 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
            )}
            {kycStep === 4 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '2px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.25rem' }}>✅</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>KYC Verified!</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Your identity has been successfully verified.</p>
                <div style={{ background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.12)', borderRadius: '12px', padding: '1rem' }}>
                  {[{ label: 'Aadhaar', value: '****' + kycData.aadhaar.slice(-4) }, { label: 'PAN', value: kycData.pan.slice(0, 3) + '*****' + kycData.pan.slice(-2) }, { label: 'Status', value: 'Verified' }].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.3rem 0' }}>
                      <span style={{ color: '#64748b' }}>{item.label}</span>
                      <span style={{ fontWeight: '600', color: item.label === 'Status' ? '#16a34a' : '#1e293b' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleKYCNext} disabled={kycLoading}
              style={{
                width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
                marginTop: '1.5rem',
                background: 'linear-gradient(135deg, #1a3a6b, #2563eb)',
                color: '#fff', fontSize: '0.95rem', fontWeight: '700', fontFamily: 'system-ui',
                cursor: kycLoading ? 'not-allowed' : 'pointer',
                opacity: kycLoading ? 0.7 : 1, transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
              }}>
              {kycLoading ? 'Verifying...' : kycStep === 4 ? 'Done' : 'Continue →'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeInUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px}
        @media(max-width:768px){
          .quick-actions{flex-wrap:wrap;gap:6px}
        }
      `}</style>
    </div>
  )
}