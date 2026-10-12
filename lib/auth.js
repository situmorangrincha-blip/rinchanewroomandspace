import crypto from 'crypto'
import { cookies } from 'next/headers'

const secret = () => process.env.SESSION_SECRET || 'dev-secret-ganti-di-production'
const hmac = (s) => crypto.createHmac('sha256', secret()).update(s).digest('base64url')

export const SCOPES = ['owner', 'works', 'writing']

export function safeEqual(a = '', b = '') {
  if (!a || !b) return false
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

export function makeToken(scope, days = 30) {
  const exp = Date.now() + days * 864e5
  return { value: `${exp}.${hmac(`${scope}.${exp}`)}`, maxAge: days * 86400 }
}

function valid(scope, token) {
  if (!token) return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  return safeEqual(sig, hmac(`${scope}.${exp}`))
}

export function has(scope) {
  const jar = cookies()
  if (valid('owner', jar.get('rm_owner')?.value)) return true
  return scope !== 'owner' && valid(scope, jar.get(`rm_${scope}`)?.value)
}

export const isOwner = () => has('owner')

export function cookieOpts(maxAge) {
  return { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge }
}

export const decisionToken = (id, action) => hmac(`decide.${id}.${action}`)

export const codeFor = (scope) =>
  scope === 'owner' ? process.env.OWNER_CODE
  : scope === 'works' ? process.env.GUEST_CODE_WORKS
  : scope === 'writing' ? process.env.GUEST_CODE_WRITING : ''
