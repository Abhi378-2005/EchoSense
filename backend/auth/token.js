import { createHmac, randomBytes } from 'crypto'
import '../config/env.js'

const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900)
const TOKEN_SECRET = String(process.env.AUTH_TOKEN_SECRET || '').trim()

if (!TOKEN_SECRET || TOKEN_SECRET === 'change-me-in-production') {
  throw new Error('AUTH_TOKEN_SECRET must be set to a strong secret before starting the backend.')
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(value) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')

  return Buffer.from(normalized, 'base64').toString('utf8')
}

function sign(payload) {
  return createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url')
}

export function signAccessToken(payload) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const body = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + ACCESS_TOKEN_TTL_SECONDS,
  }

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const encodedPayload = base64UrlEncode(JSON.stringify(body))
  const signature = sign(`${header}.${encodedPayload}`)

  return `${header}.${encodedPayload}.${signature}`
}

export function verifyAccessToken(token) {
  if (!token || token.split('.').length !== 3) {
    return { valid: false, reason: 'invalid-format' }
  }

  const [header, encodedPayload, signature] = token.split('.')
  const expectedSignature = sign(`${header}.${encodedPayload}`)

  if (signature !== expectedSignature) {
    return { valid: false, reason: 'invalid-signature' }
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    const nowSeconds = Math.floor(Date.now() / 1000)

    if (payload.exp <= nowSeconds) {
      return { valid: false, reason: 'expired' }
    }

    return { valid: true, payload }
  } catch {
    return { valid: false, reason: 'invalid-payload' }
  }
}

export function createOpaqueToken(bytes = 48) {
  return randomBytes(bytes).toString('base64url')
}

export function hashToken(token) {
  return createHmac('sha256', TOKEN_SECRET).update(token).digest('hex')
}
