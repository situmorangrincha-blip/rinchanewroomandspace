import { cookies } from 'next/headers'
import { decisionToken, makeToken, cookieOpts } from '@/lib/auth'
import { get, set, incr } from '@/lib/db'
import { json, uid } from '@/lib/http'
export const dynamic = 'force-dynamic'
const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))

export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim()
  if ((await incr(`rl:req:${ip}`, 3600)) > 5) return json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, 429)

  const b = await req.json().catch(() => ({}))
  const scope = b.scope === 'writing' ? 'writing' : 'works'
  const name = String(b.name || '').trim().slice(0, 80)
  const email = String(b.email || '').trim().slice(0, 120)
  const note = String(b.note || '').trim().slice(0, 300)
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Isi nama dan email yang valid.' }, 400)

  const id = uid() + uid()
  await set(`req:${id}`, { id, scope, name, email, note, status: 'pending', at: new Date().toISOString() }, 60 * 60 * 24 * 7)

  const origin = process.env.SITE_URL || new URL(req.url).origin
  const link = (a) => `${origin}/api/access/decide?id=${id}&action=${a}&t=${decisionToken(id, a)}`
  const room = scope === 'works' ? 'Karya' : 'Tulisan'

  if (process.env.RESEND_API_KEY && process.env.OWNER_EMAIL) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Rooms <onboarding@resend.dev>',
        to: [process.env.OWNER_EMAIL],
        reply_to: email,
        subject: `${name} minta akses ruang ${room}`,
        html: `<div style="font-family:system-ui;max-width:460px;margin:auto;padding:24px">
          <h2 style="margin:0 0 8px">Permintaan akses · ${room}</h2>
          <p style="color:#555;margin:0 0 16px"><b>${esc(name)}</b> (${esc(email)})${note ? `<br><i>“${esc(note)}”</i>` : ''}</p>
          <a href="${link('approve')}" style="display:inline-block;background:#3D4DFF;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;margin-right:8px">Setujui</a>
          <a href="${link('deny')}" style="display:inline-block;background:#eee;color:#222;padding:12px 20px;border-radius:999px;text-decoration:none">Tolak</a></div>`,
      }),
    }).catch(() => {})
  } else {
    console.log('[access request]', { name, email, scope, approve: link('approve') })
  }
  return json({ ok: true, id })
}

// Pengunjung polling status; begitu disetujui, cookie akses dipasang
export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id') || ''
  const r = await get(`req:${id}`)
  if (!r) return json({ status: 'expired' })
  if (r.status === 'approved') {
    const t = makeToken(r.scope, 14)
    cookies().set(`rm_${r.scope}`, t.value, cookieOpts(t.maxAge))
  }
  return json({ status: r.status })
}
