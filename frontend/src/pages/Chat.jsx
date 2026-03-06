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

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: language === 'hi'
        ? 'नमस्ते! मैं EchoSense हूं, आपका AI बैंकिंग सहायक। मैं आपकी कैसे मदद कर सकता हूं?'
        : language === 'mr'
        ? 'नमस्कार! मी EchoSense आहे, तुमचा AI बँकिंग सहाय्यक. मी तुम्हाला कशी मदत करू शकतो?'
        : 'Hello! I am EchoSense, your AI Banking Assistant for Union Bank of India. How can I help you today?',
      timestamp: new Date()
    }
  ])
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    socketRef.current = io(BACKEND_URL)

    socketRef.current.on('agent_joined', (data) => {
      setEscalating(false)
      setAgentMode(true)
      setAgentInfo(data)
      setMessages(prev => [...prev, {
        role: 'agent',
        content: data.message,
        agentName: data.agentName,
        timestamp: new Date()
      }])
    })

    socketRef.current.on('agent_typing', () => setAgentTyping(true))

    socketRef.current.on('agent_message', (data) => {
      setAgentTyping(false)
      setMessages(prev => [...prev, {
        role: 'agent',
        content: data.message,
        agentName: data.agentName || 'Agent',
        timestamp: new Date()
      }])
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
      setTimeout(() => {
        setKycStep(1)
        setKycData({ aadhaar: '', pan: '', otp: '' })
        setShowKYCModal(true)
      }, 300)
      setInput('')
      return
    }

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }])

    if (agentMode) {
      socketRef.current.emit('message_to_agent', { message: userMsg })
      return
    }

    setLoading(true)
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: userMsg, history, language
      })
      const reply = res.data.reply
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }])
      speak(reply)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting. Please try again.',
        timestamp: new Date()
      }])
    }
    setLoading(false)
  }

  const submitComplaint = async () => {
    if (!complaintCategory || !complaintDesc.trim()) return
    setComplaintLoading(true)
    try {
      const res = await axios.post(`${BACKEND_URL}/api/complaints`, {
        category: complaintCategory,
        description: complaintDesc,
        language
      })
      setShowComplaintModal(false)
      setComplaintCategory('')
      setComplaintDesc('')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Your complaint has been successfully registered!\n\nTicket ID: ${res.data.ticketId}\nCategory: ${complaintCategory}\nStatus: Open\n\nOur team will contact you within 24 hours. Is there anything else I can help you with?`,
        timestamp: new Date(),
        isTicket: true,
        ticketId: res.data.ticketId
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, could not file complaint. Please try again.',
        timestamp: new Date()
      }])
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
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'OTP sent to your registered mobile number ending in ****87',
        timestamp: new Date()
      }])
    } else if (kycStep === 3) {
      if (kycData.otp !== generatedOTP) return alert('Invalid OTP. Demo OTP: ' + generatedOTP)
      setKycLoading(true)
      setTimeout(() => {
        setKycLoading(false)
        setKycStep(4)
      }, 2000)
    } else if (kycStep === 4) {
      setShowKYCModal(false)
      setKycStep(1)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Your KYC verification has been completed successfully! Your account is now fully verified and all banking services are activated. Is there anything else I can help you with?',
        timestamp: new Date(),
        isKYC: true
      }])
    }
  }

  const escalateToAgent = () => {
    setEscalating(true)
    setMessages(prev => [...prev, {
      role: 'system',
      content: 'Connecting you to a live agent. Please wait...',
      timestamp: new Date()
    }])
    socketRef.current.emit('escalate_to_agent', { language })
  }

  const speak = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN'
    utterance.rate = 0.9
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return alert('Voice not supported in this browser')
    const recognition = new SpeechRecognition()
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN'
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e) => setInput(e.results[0][0].transcript)
    recognition.start()
  }

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      minHeight: '100vh',
      background: agentMode
        ? 'linear-gradient(135deg, #0a0a0a 0%, #0d2a1b 50%, #0a0a0a 100%)'
        : 'linear-gradient(135deg, #0a0a0a 0%, #0d1b2a 50%, #0a0a0a 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', sans-serif", color: '#fff',
      transition: 'background 1s ease', position: 'relative'
    }}>

      {/* Header */}
      <div style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#aaa', borderRadius: '8px', padding: '0.4rem 0.8rem',
            cursor: 'pointer', fontSize: '0.85rem'
          }}>Back</button>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: agentMode
              ? 'linear-gradient(135deg, #16a34a, #4ade80)'
              : 'linear-gradient(135deg, #1e64ff, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', transition: 'all 0.5s ease'
          }}>
            {agentMode ? '👨‍💼' : '🤖'}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem' }}>
              {agentMode ? agentInfo?.agentName || 'Live Agent' : 'EchoSense'}
            </div>
            <div style={{ fontSize: '0.75rem', color: agentMode ? '#4ade80' : speaking ? '#4ade80' : '#888' }}>
              {agentMode ? 'Live Agent Connected' : speaking ? 'Speaking...' : loading ? 'Thinking...' : 'Online'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {agentMode && (
            <div style={{
              padding: '0.3rem 0.8rem', borderRadius: '50px',
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80', fontSize: '0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#4ade80', animation: 'pulse 1.5s infinite'
              }} />
              Live Support
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
            <span style={{ color: '#888', fontSize: '0.8rem' }}>
              {language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'English'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {!agentMode && (
        <div style={{
          padding: '1rem 2rem', display: 'flex', gap: '0.75rem',
          overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          {quickActions.map(action => (
            <button key={action.label} onClick={() => sendMessage(action.label)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: '#ccc', cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: '0.8rem', display: 'flex', alignItems: 'center',
                gap: '0.4rem', transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(30,100,255,0.15)'
                e.currentTarget.style.borderColor = 'rgba(30,100,255,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '2rem',
        display: 'flex', flexDirection: 'column', gap: '1.5rem'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end', gap: '0.75rem'
          }}>
            {(msg.role === 'assistant' || msg.role === 'agent') && (
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: msg.role === 'agent'
                  ? 'linear-gradient(135deg, #16a34a, #4ade80)'
                  : 'linear-gradient(135deg, #1e64ff, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', flexShrink: 0
              }}>
                {msg.role === 'agent' ? '👨‍💼' : '🤖'}
              </div>
            )}

            {msg.role === 'system' && (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <span style={{
                  fontSize: '0.8rem', color: '#eab308',
                  background: 'rgba(234,179,8,0.1)',
                  border: '1px solid rgba(234,179,8,0.2)',
                  padding: '0.4rem 1rem', borderRadius: '50px'
                }}>{msg.content}</span>
              </div>
            )}

            {msg.role !== 'system' && (
              <div style={{ maxWidth: '65%' }}>
                {msg.role === 'agent' && (
                  <div style={{ fontSize: '0.7rem', color: '#4ade80', marginBottom: '0.3rem' }}>
                    {msg.agentName}
                  </div>
                )}
                <div style={{
                  padding: '0.9rem 1.2rem',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #1e64ff, #7c3aed)'
                    : msg.role === 'agent'
                    ? 'rgba(34,197,94,0.1)'
                    : msg.isTicket || msg.isKYC
                    ? 'rgba(30,100,255,0.12)'
                    : 'rgba(255,255,255,0.07)',
                  border: msg.role === 'user' ? 'none'
                    : msg.role === 'agent' ? '1px solid rgba(34,197,94,0.3)'
                    : msg.isTicket || msg.isKYC ? '1px solid rgba(30,100,255,0.3)'
                    : '1px solid rgba(255,255,255,0.08)',
                  fontSize: '0.95rem', lineHeight: '1.7', color: '#fff',
                  whiteSpace: 'pre-line'
                }}>
                  {(msg.isTicket || msg.isKYC) && (
                    <div style={{
                      display: 'inline-block', marginBottom: '0.5rem',
                      padding: '0.2rem 0.6rem', borderRadius: '6px',
                      background: msg.isKYC ? 'rgba(34,197,94,0.3)' : 'rgba(30,100,255,0.3)',
                      fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em'
                    }}>
                      {msg.isKYC ? 'KYC VERIFIED' : 'TICKET RAISED'}
                    </div>
                  )}
                  <div>{msg.content}</div>
                  {msg.isTicket && (
                    <div style={{
                      marginTop: '0.75rem', padding: '0.5rem 0.75rem',
                      background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
                      fontSize: '0.8rem', color: '#a0b4ff'
                    }}>
                      Track: UBI App → My Complaints → {msg.ticketId}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '0.7rem', color: '#555', marginTop: '0.3rem',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            )}
          </div>
        ))}

        {(loading || agentTyping) && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: agentTyping
                ? 'linear-gradient(135deg, #16a34a, #4ade80)'
                : 'linear-gradient(135deg, #1e64ff, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
            }}>
              {agentTyping ? '👨‍💼' : '🤖'}
            </div>
            <div style={{
              padding: '0.9rem 1.2rem', borderRadius: '18px 18px 18px 4px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', gap: '4px', alignItems: 'center'
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: agentTyping ? '#4ade80' : '#1e64ff',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1.5rem 2rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          display: 'flex', gap: '0.75rem', alignItems: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${agentMode ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '16px', padding: '0.5rem 0.5rem 0.5rem 1.2rem',
          transition: 'border 0.5s ease'
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={
              agentMode ? 'Message live agent...'
              : language === 'hi' ? 'अपना संदेश लिखें...'
              : language === 'mr' ? 'तुमचा संदेश लिहा...'
              : 'Type your message...'
            }
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: '#fff', fontSize: '0.95rem', outline: 'none'
            }}
          />
          {!agentMode && (
            <button onClick={escalateToAgent} disabled={escalating}
              title="Connect to Live Agent"
              style={{
                width: '42px', height: '42px', borderRadius: '12px', border: 'none',
                background: escalating ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.1)',
                color: escalating ? '#eab308' : '#4ade80',
                cursor: escalating ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem', transition: 'all 0.2s ease'
              }}>
              {escalating ? '⏳' : '👨‍💼'}
            </button>
          )}
          <button onClick={startListening} style={{
            width: '42px', height: '42px', borderRadius: '12px', border: 'none',
            background: listening ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.05)',
            color: listening ? '#ef4444' : '#888',
            cursor: 'pointer', fontSize: '1.2rem', transition: 'all 0.2s ease',
            boxShadow: listening ? '0 0 15px rgba(239,68,68,0.4)' : 'none'
          }}>
            {listening ? '🔴' : '🎙️'}
          </button>
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            style={{
              width: '42px', height: '42px', borderRadius: '12px', border: 'none',
              background: input.trim() && !loading
                ? agentMode
                  ? 'linear-gradient(135deg, #16a34a, #4ade80)'
                  : 'linear-gradient(135deg, #1e64ff, #7c3aed)'
                : 'rgba(255,255,255,0.05)',
              color: input.trim() && !loading ? '#fff' : '#555',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              fontSize: '1.1rem', transition: 'all 0.2s ease'
            }}>➤</button>
        </div>
        {agentMode && (
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>
              Connected to {agentInfo?.agentName} ({agentInfo?.agentId})
            </span>
          </div>
        )}
      </div>

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}
          onClick={(e) => e.target === e.currentTarget && setShowComplaintModal(false)}
        >
          <div style={{
            width: '100%', maxWidth: '600px',
            background: 'linear-gradient(180deg, #0d1b2a, #0a0a0a)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px 24px 0 0', padding: '2rem',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>File a Complaint</h2>
              <button onClick={() => setShowComplaintModal(false)} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#aaa', borderRadius: '8px', padding: '0.3rem 0.7rem',
                cursor: 'pointer', fontSize: '1rem'
              }}>✕</button>
            </div>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              SELECT CATEGORY
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {complaintCategories.map(cat => (
                <button key={cat} onClick={() => setComplaintCategory(cat)}
                  style={{
                    padding: '0.6rem 0.8rem', borderRadius: '10px', cursor: 'pointer',
                    border: complaintCategory === cat ? '1px solid #1e64ff' : '1px solid rgba(255,255,255,0.1)',
                    background: complaintCategory === cat ? 'rgba(30,100,255,0.2)' : 'rgba(255,255,255,0.03)',
                    color: complaintCategory === cat ? '#fff' : '#aaa',
                    fontSize: '0.8rem', textAlign: 'left', transition: 'all 0.2s'
                  }}>
                  {cat}
                </button>
              ))}
            </div>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              DESCRIBE YOUR ISSUE
            </p>
            <textarea
              value={complaintDesc}
              onChange={e => setComplaintDesc(e.target.value)}
              placeholder="Please describe your issue in detail..."
              rows={4}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '0.9rem 1rem',
                color: '#fff', fontSize: '0.9rem', resize: 'none',
                outline: 'none', marginBottom: '1.5rem',
                boxSizing: 'border-box', fontFamily: 'inherit'
              }}
            />
            <button onClick={submitComplaint}
              disabled={!complaintCategory || !complaintDesc.trim() || complaintLoading}
              style={{
                width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
                background: complaintCategory && complaintDesc.trim() && !complaintLoading
                  ? 'linear-gradient(135deg, #1e64ff, #7c3aed)' : 'rgba(255,255,255,0.1)',
                color: complaintCategory && complaintDesc.trim() ? '#fff' : '#555',
                fontSize: '1rem', fontWeight: '600',
                cursor: complaintCategory && complaintDesc.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease'
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
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}
          onClick={(e) => e.target === e.currentTarget && setShowKYCModal(false)}
        >
          <div style={{
            width: '100%', maxWidth: '480px',
            background: 'linear-gradient(180deg, #0d1b2a, #0a0a0a)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px', padding: '2rem',
            animation: 'slideUp 0.3s ease'
          }}>
            {/* Steps indicator */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{
                  flex: 1, height: '4px', borderRadius: '2px',
                  background: s <= kycStep
                    ? 'linear-gradient(90deg, #1e64ff, #7c3aed)'
                    : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.3s ease'
                }} />
              ))}
            </div>

            {kycStep === 1 && (
              <div>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🪪</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Aadhaar Verification</h2>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Enter your 12-digit Aadhaar number</p>
                <input type="number" placeholder="XXXX XXXX XXXX"
                  value={kycData.aadhaar}
                  onChange={e => setKycData(p => ({ ...p, aadhaar: e.target.value.slice(0, 12) }))}
                  style={{
                    width: '100%', padding: '0.9rem 1rem', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '1.1rem', outline: 'none',
                    letterSpacing: '0.1em', boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {kycStep === 2 && (
              <div>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📄</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>PAN Verification</h2>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Enter your 10-character PAN number</p>
                <input type="text" placeholder="ABCDE1234F"
                  value={kycData.pan}
                  onChange={e => setKycData(p => ({ ...p, pan: e.target.value.toUpperCase().slice(0, 10) }))}
                  style={{
                    width: '100%', padding: '0.9rem 1rem', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '1.1rem', outline: 'none',
                    letterSpacing: '0.2em', boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {kycStep === 3 && (
              <div>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📱</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>OTP Verification</h2>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Enter the 6-digit OTP sent to ****87</p>
                <p style={{ color: '#1e64ff', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Demo OTP: {generatedOTP}</p>
                <input type="number" placeholder="Enter OTP"
                  value={kycData.otp}
                  onChange={e => setKycData(p => ({ ...p, otp: e.target.value.slice(0, 6) }))}
                  style={{
                    width: '100%', padding: '0.9rem 1rem', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '1.5rem', outline: 'none',
                    letterSpacing: '0.3em', textAlign: 'center', boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {kycStep === 4 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'rgba(34,197,94,0.2)', border: '2px solid #4ade80',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.5rem', margin: '0 auto 1.5rem'
                }}>✅</div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>KYC Verified!</h2>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Your identity has been successfully verified.
                </p>
                <div style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: '12px', padding: '1rem',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem'
                }}>
                  {[
                    { label: 'Aadhaar', value: '****' + kycData.aadhaar.slice(-4) },
                    { label: 'PAN', value: kycData.pan.slice(0, 3) + '*****' + kycData.pan.slice(-2) },
                    { label: 'Status', value: 'Verified' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#888' }}>{item.label}</span>
                      <span style={{ color: item.label === 'Status' ? '#4ade80' : '#fff' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleKYCNext} disabled={kycLoading}
              style={{
                width: '100%', padding: '1rem', borderRadius: '12px',
                border: 'none', marginTop: '1.5rem',
                background: 'linear-gradient(135deg, #1e64ff, #7c3aed)',
                color: '#fff', fontSize: '1rem', fontWeight: '600',
                cursor: kycLoading ? 'not-allowed' : 'pointer',
                opacity: kycLoading ? 0.7 : 1, transition: 'all 0.3s ease'
              }}>
              {kycLoading ? 'Verifying...' : kycStep === 4 ? 'Done' : 'Continue →'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  )
}