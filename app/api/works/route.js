import { has, isOwner } from '@/lib/auth'
import { get, set } from '@/lib/db'
import { json, uid } from '@/lib/http'
export const dynamic = 'force-dynamic'
const KEY = 'works'

export async function GET() {
  const open = has('works')
  const works = await get(KEY, [])
  // url hanya dikirim kalau punya akses; preview gambar lewat /api/preview/[id]
  return json({
    open, owner: isOwner(),
    works: works.map(({ url, ...w }) => (open ? { ...w, url } : w)),
  })
}

export async function POST(req) {
  if (!isOwner()) return json({ error: 'Perlu kode.' }, 401)
  const b = await req.json()
  let url = String(b.url || '').trim()
  if (!/^https?:\/\//.test(url)) url = 'https://' + url
  let host
  try { host = new URL(url).hostname } catch { return json({ error: 'Link tidak valid.' }, 400) }
  const works = await get(KEY, [])
  works.unshift({
    id: uid(), url,
    title: String(b.title || host).slice(0, 80),
    desc: String(b.desc || '').slice(0, 220),
    kind: host.includes('github') ? 'GitHub' : host.includes('vercel') ? 'Vercel' : 'Web',
    createdAt: new Date().toISOString(),
  })
  await set(KEY, works)
  return json({ ok: true })
}

export async function DELETE(req) {
  if (!isOwner()) return json({ error: 'Perlu kode.' }, 401)
  const id = new URL(req.url).searchParams.get('id')
  await set(KEY, (await get(KEY, [])).filter((w) => w.id !== id))
  return json({ ok: true })
}
