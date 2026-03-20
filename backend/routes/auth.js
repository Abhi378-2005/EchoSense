import express from 'express'
import { timingSafeEqual } from 'crypto'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { signAccessToken, createOpaqueToken, hashToken } from '../auth/token.js'
import {
  findUserByEmail,
  findUserById,
  createUser,
  sanitizeUser,
  createSession,
  findSessionById,
  rotateSessionToken,
  revokeSession,
  cleanupExpiredSessions,
} from '../auth/store.js'
import {
  readRefreshCookie,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshTokenTtlMs,
} from '../auth/cookies.js'
import { requireAuth } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimit.js'

const router = express.Router()
const refreshTokenTtlMs = getRefreshTokenTtlMs()

const loginRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 8,
  keyGenerator: req => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    return `login:${req.ip}:${email || 'unknown'}`
  },
  message: 'Too many login attempts. Please wait 10 minutes and try again.',
})

const registerRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: req => `register:${req.ip}`,
  message: 'Too many registration attempts. Please wait 10 minutes and try again.',
})

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''))
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function parseRefreshToken(token) {
  if (!token || !token.includes('.')) {
    return { sessionId: '', secret: '' }
  }

  const splitIndex = token.indexOf('.')
  const sessionId = token.slice(0, splitIndex)
  const secret = token.slice(splitIndex + 1)

  return { sessionId, secret }
}

function safeEqualHex(a, b) {
  try {
    const aBuffer = Buffer.from(a, 'hex')
    const bBuffer = Buffer.from(b, 'hex')

    if (aBuffer.length !== bBuffer.length) {
      return false
    }

    return timingSafeEqual(aBuffer, bBuffer)
  } catch {
    return false
  }
}

function buildAccessTokenForUser(user) {
  return signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  })
}

function createSessionForUser(user, req, res) {
  cleanupExpiredSessions()

  const refreshSecret = createOpaqueToken()
  const expiresAt = new Date(Date.now() + refreshTokenTtlMs).toISOString()

  const session = createSession({
    userId: user.id,
    tokenHash: hashToken(refreshSecret),
    expiresAt,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
  })

  setRefreshCookie(res, `${session.id}.${refreshSecret}`)

  return {
    accessToken: buildAccessTokenForUser(user),
    user: sanitizeUser(user),
  }
}

router.post('/register', registerRateLimit, async (req, res) => {
  const name = String(req.body?.name || '').trim()
  const email = normalizeEmail(req.body?.email)
  const password = String(req.body?.password || '')

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' })
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'Unable to create account with provided details.' })
  }

  try {
    const { passwordHash, passwordSalt } = await hashPassword(password)
    const user = createUser({ name, email, passwordHash, passwordSalt })
    const response = createSessionForUser(user, req, res)

    return res.status(201).json(response)
  } catch {
    return res.status(500).json({ error: 'Unable to create account right now.' })
  }
})

router.post('/login', loginRateLimit, async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = String(req.body?.password || '')

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const user = findUserByEmail(email)

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  try {
    const isPasswordValid = await verifyPassword(password, user.passwordSalt, user.passwordHash)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    const response = createSessionForUser(user, req, res)
    return res.json(response)
  } catch {
    return res.status(500).json({ error: 'Unable to login right now.' })
  }
})

router.post('/refresh', (req, res) => {
  const refreshCookie = readRefreshCookie(req)
  const { sessionId, secret } = parseRefreshToken(refreshCookie)

  if (!sessionId || !secret) {
    return res.status(401).json({ error: 'Refresh token missing.' })
  }

  cleanupExpiredSessions()

  const session = findSessionById(sessionId)

  if (!session || session.revokedAt) {
    clearRefreshCookie(res)
    return res.status(401).json({ error: 'Session not valid.' })
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    revokeSession(session.id)
    clearRefreshCookie(res)
    return res.status(401).json({ error: 'Session expired.' })
  }

  const providedHash = hashToken(secret)

  if (!safeEqualHex(session.tokenHash, providedHash)) {
    revokeSession(session.id)
    clearRefreshCookie(res)
    return res.status(401).json({ error: 'Session not valid.' })
  }

  const user = findUserById(session.userId)

  if (!user) {
    revokeSession(session.id)
    clearRefreshCookie(res)
    return res.status(401).json({ error: 'User not found.' })
  }

  const nextSecret = createOpaqueToken()
  const expiresAt = new Date(Date.now() + refreshTokenTtlMs).toISOString()
  rotateSessionToken(session.id, hashToken(nextSecret), expiresAt)

  setRefreshCookie(res, `${session.id}.${nextSecret}`)

  return res.json({
    accessToken: buildAccessTokenForUser(user),
    user: sanitizeUser(user),
  })
})

router.post('/logout', (req, res) => {
  const refreshCookie = readRefreshCookie(req)
  const { sessionId } = parseRefreshToken(refreshCookie)

  if (sessionId) {
    revokeSession(sessionId)
  }

  clearRefreshCookie(res)
  return res.json({ success: true })
})

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.authUser })
})

export default router
