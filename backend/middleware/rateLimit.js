const buckets = new Map()

export function createRateLimiter({ windowMs = 10 * 60 * 1000, max = 10, keyGenerator, message } = {}) {
  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    if (bucket.count >= max) {
      return res.status(429).json({
        error: message || 'Too many requests. Please try again later.',
      })
    }

    bucket.count += 1
    buckets.set(key, bucket)

    return next()
  }
}