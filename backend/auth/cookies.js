import '../config/env.js'

const REFRESH_COOKIE_NAME = 'refresh_token'
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7)

function getSameSiteValue() {
  const configured = String(process.env.COOKIE_SAME_SITE || 'lax').toLowerCase()

  if (configured === 'none' || configured === 'strict' || configured === 'lax') {
    return configured
  }

  return 'lax'
}

export function parseCookies(req) {
  const header = req.headers.cookie || ''

  return header
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [key, ...valueParts] = part.split('=')
      acc[key] = decodeURIComponent(valueParts.join('='))
      return acc
    }, {})
}

export function readRefreshCookie(req) {
  const cookies = parseCookies(req)
  return cookies[REFRESH_COOKIE_NAME] || ''
}

export function setRefreshCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production'
  const sameSite = getSameSiteValue()

  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction || sameSite === 'none',
    sameSite,
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  })
}

export function clearRefreshCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production'
  const sameSite = getSameSiteValue()

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction || sameSite === 'none',
    sameSite,
    path: '/api/auth',
  })
}

export function getRefreshTokenTtlMs() {
  return REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
}
