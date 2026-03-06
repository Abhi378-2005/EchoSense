import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import chatRoute from './routes/chat.js'
import complaintRoute from './routes/complaints.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// CORS configuration
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*'

const corsOptions = {
  origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}

const io = new Server(httpServer, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods
  }
})

// Basic request logging for debugging
app.use((req, res, next) => {
  const start = Date.now()
  console.log(`➡️  ${req.method} ${req.originalUrl}`)

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`⬅️  ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`)
  })

  next()
})

app.use(cors(corsOptions))
app.use(express.json())
app.use('/api/chat', chatRoute)
app.use('/api/complaints', complaintRoute)

app.get('/', (req, res) => {
  res.json({ status: '🟢 EchoSense Backend Live' })
})

const agentResponses = [
  "Hello! I'm Rajesh from Union Bank support. I can see your query. Let me help you right away!",
  "I have pulled up your account details. Could you please verify your registered mobile number?",
  "I understand your concern. I am escalating this to our specialist team and you will receive a callback within 2 hours.",
  "Is there anything else I can help you with today?",
  "I have raised a complaint ticket for you. Your ticket ID is UBI-" + Math.floor(Math.random() * 90000 + 10000)
]

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id)

  socket.on('escalate_to_agent', (data) => {
    console.log('🚨 Escalation request from:', socket.id, 'payload:', data)
    
    // Simulate agent connecting after 3 seconds
    setTimeout(() => {
      socket.emit('agent_joined', {
        agentName: 'Rajesh Kumar',
        agentId: 'AGT-' + Math.floor(Math.random() * 900 + 100),
        message: "Hello! I'm Rajesh Kumar from Union Bank of India support team. I can see you requested assistance. How can I help you today?"
      })
    }, 3000)
  })

  socket.on('message_to_agent', (data) => {
    console.log('💬 Message to agent from', socket.id, 'message:', data.message)
    
    // Simulate agent typing then responding
    setTimeout(() => {
      socket.emit('agent_typing')
    }, 500)

    setTimeout(() => {
      const response = agentResponses[Math.floor(Math.random() * agentResponses.length)]
      socket.emit('agent_message', {
        message: response,
        timestamp: new Date().toISOString()
      })
    }, 2500)
  })

  socket.on('disconnect', () => console.log('❌ Disconnected:', socket.id))
})

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
})