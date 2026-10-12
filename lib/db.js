import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

// fallback in-memory buat dev lokal tanpa Redis (hilang kalau server restart)
const mem = globalThis.__mem || (globalThis.__mem = new Map())

export async function get(key, def = null) {
  if (!redis) return mem.has(key) ? mem.get(key) : def
  const v = await redis.get(key)
  return v ?? def
}
export async function set(key, val, ttl) {
  if (!redis) { mem.set(key, val); return }
  if (ttl) await redis.set(key, val, { ex: ttl })
  else await redis.set(key, val)
}
export async function incr(key, ttl) {
  if (!redis) { const n = (mem.get(key) || 0) + 1; mem.set(key, n); return n }
  const n = await redis.incr(key)
  if (n === 1 && ttl) await redis.expire(key, ttl)
  return n
}
