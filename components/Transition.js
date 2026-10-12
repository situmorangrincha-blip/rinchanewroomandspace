'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const Ctx = createContext(() => {})

// Tirai warna menyapu layar saat pindah ruang; warnanya mengikuti ruang tujuan
export function TransitionProvider({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState('idle')
  const [info, setInfo] = useState({ color: '#16161D', label: '' })
  const busy = useRef(false)
  const timers = useRef([])
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))

  const go = useCallback((href, color, label) => {
    if (busy.current || href === pathname) return
    busy.current = true
    setInfo({ color, label })
    setPhase('cover')
    later(() => router.push(href), 680)
    later(() => setPhase((p) => (p === 'cover' ? 'reveal' : p)), 2500) // pengaman
  }, [pathname, router])

  useEffect(() => {
    if (phase !== 'cover') return
    later(() => setPhase('reveal'), 180)
  }, [pathname]) // eslint-disable-line

  useEffect(() => {
    if (phase !== 'reveal') return
    later(() => { setPhase('idle'); busy.current = false }, 800)
  }, [phase])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  return (
    <Ctx.Provider value={go}>
      {children}
      <div className={`curtain ${phase}`} style={{ background: info.color }} aria-hidden="true">
        <span>{info.label}</span>
      </div>
    </Ctx.Provider>
  )
}

export function TLink({ href, color = '#16161D', label = '', children, ...rest }) {
  const go = useContext(Ctx)
  return (
    <a href={href} {...rest}
       onClick={(e) => {
         if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
         e.preventDefault(); go(href, color, label)
       }}>
      {children}
    </a>
  )
}
