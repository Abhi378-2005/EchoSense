import { verifyAccessToken } from '../auth/token.js'
import { findUserById, sanitizeUser } from '../auth/store.js'

function getBearerToken(req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return ''
  }

  return token
}

export function requireAuth(req, res, next) {
  const token = getBearerToken(req)

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  const verification = verifyAccessToken(token)

  if (!verification.valid || !verification.payload?.sub) {
    return res.status(401).json({ error: 'Invalid or expired access token.' })
  }

  const user = findUserById(verification.payload.sub)

  if (!user) {
    return res.status(401).json({ error: 'User not found.' })
  }

  req.authUser = sanitizeUser(user)
  next()
}