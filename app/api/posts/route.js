import { has, isOwner } from '@/lib/auth'
import { get, set } from '@/lib/db'
import { json, uid } from '@/lib/http'
export const dynamic = 'force-dynamic'
const KEY = 'posts'
const excerpt = (b) => b.replace(/\s+/g, ' ').trim().slice(0, 150)

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id')
  const posts = await get(KEY, [])
  if (id) {
    if (!has('writing')) return json({ error: 'locked' }, 401)
    const p = posts.find((x) => x.id === id)
    return p ? json({ post: p }) : json({ error: 'Tidak ketemu.' }, 404)
  }
  return json({
    open: has('writing'), owner: isOwner(),
    posts: posts.map(({ body, ...p }) => ({ ...p, excerpt: excerpt(body), words: body.split(/\s+/).length })),
  })
}

export async function POST(req) {
  if (!isOwner()) return json({ error: 'Perlu kode.' }, 401)
  const b = await req.json()
  const title = String(b.title || '').trim().slice(0, 140)
  const body = String(b.body || '').trim()
  if (!title || !body) return json({ error: 'Judul dan isi wajib diisi.' }, 400)
  const kind = b.kind === 'fiksi' ? 'fiksi' : 'opini'
  const posts = await get(KEY, [])
  if (b.id) {
    const p = posts.find((x) => x.id === b.id)
    if (p) Object.assign(p, { title, body, kind })
  } else posts.unshift({ id: uid(), title, body, kind, createdAt: new Date().toISOString() })
  await set(KEY, posts)
  return json({ ok: true })
}

export async function DELETE(req) {
  if (!isOwner()) return json({ error: 'Perlu kode.' }, 401)
  const id = new URL(req.url).searchParams.get('id')
  await set(KEY, (await get(KEY, [])).filter((p) => p.id !== id))
  return json({ ok: true })
}
