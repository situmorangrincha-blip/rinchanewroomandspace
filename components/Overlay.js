'use client'
import { useEffect } from 'react'

export default function Overlay({ onClose, children, wide, side }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className={`ov ${side ? 'ov-side' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`ov-panel ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <button className="x" onClick={onClose} aria-label="Tutup">×</button>
        {children}
      </div>
    </div>
  )
}
