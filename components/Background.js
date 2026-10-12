'use client'
import { useEffect, useRef } from 'react'

// Garis kontur halus yang mengalir + beberapa orb warna samar; bereaksi pelan ke kursor
export default function Background() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let w, h, dpr, raf, t = 0
    const m = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }
    const N = 26
    const orbs = [
      { c: '61,77,255', x: 0.15, y: 0.2, r: 0.38, s: 0.00018, p: 0 },
      { c: '255,106,77', x: 0.85, y: 0.35, r: 0.32, s: 0.00022, p: 2 },
      { c: '20,184,138', x: 0.5, y: 0.95, r: 0.34, s: 0.00016, p: 4 },
    ]
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = innerWidth; h = innerHeight
      c.width = w * dpr; c.height = h * dpr
      c.style.width = w + 'px'; c.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const move = (e) => { m.tx = e.clientX / w; m.ty = e.clientY / h }
    const draw = () => {
      t += 0.012
      m.x += (m.tx - m.x) * 0.04; m.y += (m.ty - m.y) * 0.04
      ctx.clearRect(0, 0, w, h)
      for (const o of orbs) {
        const ox = (o.x + Math.sin(t * 0.6 + o.p) * 0.06 + (m.x - 0.5) * 0.04) * w
        const oy = (o.y + Math.cos(t * 0.5 + o.p) * 0.06) * h
        const r = o.r * Math.max(w, h)
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r)
        g.addColorStop(0, `rgba(${o.c},0.11)`); g.addColorStop(1, `rgba(${o.c},0)`)
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      }
      const my = m.y * h
      for (let i = 0; i < N; i++) {
        const y0 = h * (0.06 + 0.9 * (i / (N - 1)))
        const accent = i % 9 === 4 ? orbs[((i / 9) | 0) % 3] : null
        ctx.beginPath()
        for (let x = 0; x <= w + 16; x += 16) {
          const bump = Math.exp(-Math.pow((y0 - my) / (h * 0.18), 2)) * Math.sin(x * 0.006 - t * 1.4 + i) * 14 * (0.4 + m.x)
          const y = y0 + Math.sin(x * 0.0035 + t * 0.7 + i * 0.32) * 22 + Math.sin(x * 0.0105 - t * 0.5 + i * 0.2) * 8 + bump
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = accent ? `rgba(${accent.c},0.32)` : 'rgba(22,22,29,0.055)'
        ctx.lineWidth = accent ? 1.2 : 1
        ctx.stroke()
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    resize(); draw()
    addEventListener('resize', resize)
    addEventListener('pointermove', move)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointermove', move) }
  }, [])
  return <canvas ref={ref} className="bg" aria-hidden="true" />
}
