import { cookies } from 'next/headers'
import { has, makeToken, cookieOpts, codeFor, safeEqual, SCOPES } from '@/lib/auth'
import { incr } from '@/lib/db'
import { json } from '@/lib/http'
export const dynamic = 'force-dynamic'

export async function GET() {
  return json({ owner: has('owner'), works: has('works'), writing: has('writing') })
}

export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim()
  if ((await incr(`rl:auth:${ip}`, 600)) > 10) return json({ error: 'Terlalu banyak percobaan. Coba lagi 10 menit lagi.' }, 429)

  const { scope, code } = await req.json().catch(() => ({}))
  if (!SCOPES.includes(scope) || !code) return json({ error: 'Kode kosong.' }, 400)

  // kode pemilik berlaku di mana saja; kode tamu hanya untuk ruangnya
  let granted = null
  if (safeEqual(code, process.env.OWNER_CODE)) granted = 'owner'
  else if (scope !== 'owner' && safeEqual(code, codeFor(scope))) granted = scope
  if (!granted) return json({ error: 'Kode salah.' }, 401)

  const t = makeToken(granted, granted === 'owner' ? 30 : 14)
  cookies().set(`rm_${granted}`, t.value, cookieOpts(t.maxAge))
  return json({ ok: true, scope: granted })
}

export async function DELETE() {
  for (const s of SCOPES) cookies().set(`rm_${s}`, '', cookieOpts(0))
  return json({ ok: true })
}
