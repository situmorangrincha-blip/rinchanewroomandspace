'use client'
import { useEffect, useRef, useState } from 'react'
import Overlay from './Overlay'

// scope: 'owner' (hanya kode) | 'works' | 'writing' (kode tamu ATAU minta izin via email)
export default function Gate({ scope, title, sub, color = '#3D4DFF', onClose, onGranted }) {
  const guest = scope !== 'owner'
  const [mode, setMode] = useState('code') // code | request | waiting | denied
  const [code, setCode] = useState('')
  const [f, setF] = useState({ name: '', email: '', note: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const key = `rm_req_${scope}`
  const poll = useRef(null)

  const check = async (id) => {
    const r = await fetch(`/api/access/request?id=${id}`).then((x) => x.json()).catch(() => ({}))
    if (r.status === 'approved') { localStorage.removeItem(key); clearInterval(poll.current); onGranted() }
    else if (r.status === 'denied') { localStorage.removeItem(key); clearInterval(poll.current); setMode('denied') }
    else if (r.status === 'expired') { localStorage.removeItem(key); clearInterval(poll.current); setMode((m) => (m === 'waiting' ? 'request' : m)) }
    else setMode('waiting')
  }

  useEffect(() => {
    const id = guest && localStorage.getItem(key)
    if (id) { check(id); poll.current = setInterval(() => check(id), 4000) }
    return () => clearInterval(poll.current)
  }, []) // eslint-disable-line

  const submitCode = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope, code }) })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (r.ok) onGranted(); else setErr(d.error || 'Gagal masuk.')
  }

  const submitReq = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const r = await fetch('/api/access/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope, ...f }) })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return setErr(d.error || 'Gagal mengirim.')
    localStorage.setItem(key, d.id)
    setMode('waiting')
    clearInterval(poll.current)
    poll.current = setInterval(() => check(d.id), 4000)
  }

  return (
    <Overlay onClose={onClose}>
      <div className="gate" style={{ '--a': color }}>
        <div className="dot" />
        <h2>{title}</h2>
        <p className="sub">{sub}</p>

        {mode === 'code' && (
          <form onSubmit={submitCode}>
            <input className="field" type="password" autoFocus placeholder="Masukkan kode" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
            {err && <p className="err">{err}</p>}
            <button className="btn solid" disabled={busy || !code}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
            {guest && <button type="button" className="btn ghost" onClick={() => { setErr(''); setMode('request') }}>Belum punya kode? Minta izin</button>}
          </form>
        )}

        {mode === 'request' && (
          <form onSubmit={submitReq}>
            <input className="field" placeholder="Nama" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
            <input className="field" type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <input className="field" placeholder="Pesan singkat (opsional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            {err && <p className="err">{err}</p>}
            <button className="btn solid" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim permintaan'}</button>
            <button type="button" className="btn ghost" onClick={() => setMode('code')}>Punya kode? Masukkan</button>
          </form>
        )}

        {mode === 'waiting' && (
          <div className="wait">
            <div className="pulse" />
            <p>Permintaan terkirim. Halaman ini otomatis terbuka begitu disetujui, jadi biarkan tetap terbuka.</p>
            <button className="btn ghost" onClick={() => setMode('code')}>Punya kode? Masukkan</button>
          </div>
        )}

        {mode === 'denied' && (
          <div className="wait">
            <p>Permintaan tidak disetujui.</p>
            <button className="btn ghost" onClick={() => setMode('code')}>Masukkan kode</button>
          </div>
        )}
      </div>
    </Overlay>
  )
}
