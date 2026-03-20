import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(scryptCb)
const SALT_BYTES = 16
const KEY_LENGTH = 64

export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES).toString('hex')
  const derivedKey = await scrypt(password, salt, KEY_LENGTH)

  return {
    passwordSalt: salt,
    passwordHash: Buffer.from(derivedKey).toString('hex'),
  }
}

export async function verifyPassword(password, passwordSalt, passwordHash) {
  if (!password || !passwordSalt || !passwordHash) {
    return false
  }

  const derivedKey = await scrypt(password, passwordSalt, KEY_LENGTH)
  const hashBuffer = Buffer.from(passwordHash, 'hex')
  const derivedBuffer = Buffer.from(derivedKey)

  if (hashBuffer.length !== derivedBuffer.length) {
    return false
  }

  return timingSafeEqual(hashBuffer, derivedBuffer)
}