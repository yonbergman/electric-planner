import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }
export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL!)
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

export const SHARE_TTL = 30 * 24 * 60 * 60 // 30 days in seconds
export const SHARE_KEY_PREFIX = 'share:'
