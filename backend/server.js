import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import chatRoute from './routes/chat.js'
import complaintRoute from './routes/complaints.js'
import analyticsRoute from './routes/analytics.js'
import authRoute from './routes/auth.js'
import { requireAuth } from './middleware/auth.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

const configuredOrigins = String(process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const allowedOriginsSet = new Set(configuredOrigins)

for (const origin of configuredOrigins) {
  if (origin.includes('localhost')) {
    allowedOriginsSet.add(origin.replace('localhost', '127.0.0.1'))
  }

  if (origin.includes('127.0.0.1')) {
    allowedOriginsSet.add(origin.replace('127.0.0.1', 'localhost'))
  }
}

const allowedOrigins = Array.from(allowedOriginsSet)

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: corsOptions.methods,
    credentials: true,
  },
})

app.use((req, res, next) => {
  const start = Date.now()
  console.log(`${req.method} ${req.originalUrl}`)

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`)
  })

  next()
})

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})

app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))

app.use('/api/auth', authRoute)
app.use('/api/chat', requireAuth, chatRoute)
app.use('/api/complaints', requireAuth, complaintRoute)
app.use('/api/analytics', requireAuth, analyticsRoute)

app.get('/', (req, res) => {
  res.json({ status: 'EchoSense backend is running.' })
})

const agentResponses = [
  "Hello! I'm Rajesh from Union Bank support. I can see your query. Let me help you right away!",
  'I have pulled up your account details. Please verify using any 3 details from CSV: Customer ID, Aadhaar Number, PAN Card, Date of Birth, Email, or Contact Number.',
  'I understand your concern. I am escalating this to our specialist team and you will receive a callback within 2 hours.',
  'Is there anything else I can help you with today?',
  `I have raised a complaint ticket for you. Your ticket ID is UBI-${Math.floor(Math.random() * 90000 + 10000)}`,
]

io.on('connection', socket => {
  console.log(`Socket connected: ${socket.id}`)

  socket.on('escalate_to_agent', () => {
    setTimeout(() => {
      socket.emit('agent_joined', {
        agentName: 'Rajesh Kumar',
        agentId: `AGT-${Math.floor(Math.random() * 900 + 100)}`,
        message: "Hello! I'm Rajesh Kumar from Union Bank of India support team. I can see you requested assistance. How can I help you today?",
      })
    }, 3000)
  })

  socket.on('message_to_agent', () => {
    setTimeout(() => {
      socket.emit('agent_typing')
    }, 500)

    setTimeout(() => {
      const response = agentResponses[Math.floor(Math.random() * agentResponses.length)]
      socket.emit('agent_message', {
        message: response,
        timestamp: new Date().toISOString(),
      })
    }, 2500)
  })

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })
})

app.use((err, req, res, next) => {
  if (err?.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'Request origin is not allowed.' })
  }

  return next(err)
})

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
