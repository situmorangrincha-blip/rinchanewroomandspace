import { decisionToken, safeEqual } from '@/lib/auth'
import { get, set } from '@/lib/db'
export const dynamic = 'force-dynamic'

const page = (title, sub, color) => new Response(
  `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui;background:#FBFBFD;color:#16161D">
  <div style="text-align:center"><div style="width:14px;height:14px;border-radius:50%;background:${color};margin:0 auto 18px"></div>
  <h1 style="font-weight:500;margin:0 0 6px">${title}</h1><p style="color:#777;margin:0">${sub}</p></div>`,
  { headers: { 'content-type': 'text/html; charset=utf-8' } })

export async function GET(req) {
  const u = new URL(req.url)
  const id = u.searchParams.get('id') || ''
  const action = u.searchParams.get('action')
  const t = u.searchParams.get('t') || ''
  if (!['approve', 'deny'].includes(action) || !safeEqual(t, decisionToken(id, action))) return page('Link tidak valid', 'Tanda tangan link tidak cocok.', '#FF6A4D')
  const r = await get(`req:${id}`)
  if (!r) return page('Permintaan sudah kedaluwarsa', 'Minta pengunjung kirim ulang.', '#FFC83D')
  r.status = action === 'approve' ? 'approved' : 'denied'
  await set(`req:${id}`, r, 60 * 60 * 24 * 7)
  return action === 'approve'
    ? page('Disetujui', `${r.name} sekarang bisa membuka ruangnya.`, '#14B88A')
    : page('Ditolak', `${r.name} tidak akan mendapat akses.`, '#FF6A4D')
}
