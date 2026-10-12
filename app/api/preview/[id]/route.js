import { get } from '@/lib/db'
export const dynamic = 'force-dynamic'

// Screenshot diambil server-side supaya link asli nggak bocor ke HTML publik
export async function GET(_req, { params }) {
  const works = await get('works', [])
  const w = works.find((x) => x.id === params.id)
  if (!w) return new Response('Not found', { status: 404 })
  try {
    const api = `https://api.microlink.io/?url=${encodeURIComponent(w.url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800`
    const r = await fetch(api, { redirect: 'follow' })
    if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image')) throw new Error('no image')
    return new Response(r.body, {
      headers: { 'content-type': r.headers.get('content-type'), 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    })
  } catch {
    return new Response(null, { status: 204 })
  }
}
