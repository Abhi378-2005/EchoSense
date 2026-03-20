import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../data')
const usersPath = path.join(dataDir, 'auth-users.json')
const sessionsPath = path.join(dataDir, 'auth-sessions.json')

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, '[]', 'utf8')
  }

  if (!fs.existsSync(sessionsPath)) {
    fs.writeFileSync(sessionsPath, '[]', 'utf8')
  }
}

function readJson(filePath) {
  ensureStore()

  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeJson(filePath, value) {
  ensureStore()
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8')
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function getUsers() {
  return readJson(usersPath)
}

export function findUserByEmail(email) {
  const normalized = normalizeEmail(email)
  return getUsers().find(user => user.email === normalized)
}

export function findUserById(userId) {
  return getUsers().find(user => user.id === userId)
}

export function createUser({ name, email, passwordHash, passwordSalt }) {
  const users = getUsers()
  const normalizedEmail = normalizeEmail(email)

  const user = {
    id: randomUUID(),
    name: String(name || '').trim(),
    email: normalizedEmail,
    passwordHash,
    passwordSalt,
    linkedCustomerId: null,
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  writeJson(usersPath, users)

  return user
}

export function sanitizeUser(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    linkedCustomerId: user.linkedCustomerId || null,
    createdAt: user.createdAt,
  }
}

export function linkUserToCustomer(userId, customerId) {
  const users = getUsers()
  const index = users.findIndex(user => user.id === userId)

  if (index === -1) {
    return null
  }

  const normalizedCustomerId = String(customerId || '').trim()
  users[index].linkedCustomerId = normalizedCustomerId || null
  users[index].linkedCustomerLinkedAt = normalizedCustomerId ? new Date().toISOString() : null
  writeJson(usersPath, users)

  return users[index]
}

export function getSessions() {
  return readJson(sessionsPath)
}

export function cleanupExpiredSessions() {
  const now = Date.now()
  const sessions = getSessions()
  const filtered = sessions.filter(session => {
    if (session.revokedAt) {
      return false
    }

    return new Date(session.expiresAt).getTime() > now
  })

  if (filtered.length !== sessions.length) {
    writeJson(sessionsPath, filtered)
  }
}

export function createSession({ userId, tokenHash, expiresAt, ip, userAgent }) {
  const sessions = getSessions()

  const session = {
    id: randomUUID(),
    userId,
    tokenHash,
    expiresAt,
    ip,
    userAgent,
    createdAt: new Date().toISOString(),
    revokedAt: null,
  }

  sessions.push(session)
  writeJson(sessionsPath, sessions)

  return session
}

export function findSessionById(sessionId) {
  return getSessions().find(session => session.id === sessionId)
}

export function rotateSessionToken(sessionId, tokenHash, expiresAt) {
  const sessions = getSessions()
  const index = sessions.findIndex(session => session.id === sessionId)

  if (index === -1) {
    return null
  }

  sessions[index].tokenHash = tokenHash
  sessions[index].expiresAt = expiresAt
  sessions[index].rotatedAt = new Date().toISOString()

  writeJson(sessionsPath, sessions)
  return sessions[index]
}

export function revokeSession(sessionId) {
  const sessions = getSessions()
  const index = sessions.findIndex(session => session.id === sessionId)

  if (index === -1) {
    return false
  }

  sessions[index].revokedAt = new Date().toISOString()
  writeJson(sessionsPath, sessions)

  return true
}
