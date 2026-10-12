import { isOwner } from '@/lib/auth'
import { get, set } from '@/lib/db'
import { json, uid } from '@/lib/http'
export const dynamic = 'force-dynamic'

const KEY = 'todos'
const guard = () => (isOwner() ? null : json({ error: 'Perlu kode.' }, 401))
const clean = (b) => ({
  title: String(b.title || '').trim().slice(0, 200),
  priority: [1, 2, 3].includes(b.priority) ? b.priority : 2,
  due: /^\d{4}-\d{2}-\d{2}$/.test(b.due || '') ? b.due : null,
  note: String(b.note || '').slice(0, 500),
})

export async function GET() {
  return guard() || json({ todos: await get(KEY, []) })
}

export async function POST(req) {
  const g = guard(); if (g) return g
  const b = await req.json()
  const c = clean(b)
  if (!c.title) return json({ error: 'Judul kosong.' }, 400)
  const todos = await get(KEY, [])
  const todo = { id: uid(), ...c, frog: false, done: false, doneAt: null, createdAt: new Date().toISOString() }
  if (b.frog) todos.forEach((t) => (t.frog = false)), (todo.frog = true)
  todos.push(todo)
  await set(KEY, todos)
  return json({ todos })
}

export async function PATCH(req) {
  const g = guard(); if (g) return g
  const b = await req.json()
  const todos = await get(KEY, [])
  const t = todos.find((x) => x.id === b.id)
  if (!t) return json({ error: 'Tidak ketemu.' }, 404)
  if ('title' in b || 'priority' in b || 'due' in b || 'note' in b) Object.assign(t, clean({ ...t, ...b }))
  if (typeof b.done === 'boolean' && b.done !== t.done) {
    t.done = b.done
    t.doneAt = b.done ? new Date().toISOString() : null
    if (b.done) { if (t.frog) t.wasFrog = true; t.frog = false }
  }
  if (typeof b.frog === 'boolean') {
    if (b.frog) todos.forEach((x) => (x.frog = false))
    t.frog = b.frog && !t.done
  }
  await set(KEY, todos)
  return json({ todos })
}

export async function DELETE(req) {
  const g = guard(); if (g) return g
  const id = new URL(req.url).searchParams.get('id')
  const todos = (await get(KEY, [])).filter((t) => t.id !== id)
  await set(KEY, todos)
  return json({ todos })
}
