'use client'
import { useCallback, useEffect, useState } from 'react'
import Gate from '@/components/Gate'
import Overlay from '@/components/Overlay'
import { ROOMS } from '@/lib/config'

const A = ROOMS.writing.color
const fmt = (s) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Writing() {
  const [data, setData] = useState(null)
  const [gate, setGate] = useState(null)   // { scope, then }
  const [reading, setReading] = useState(null)
  const [editor, setEditor] = useState(null)
  const [filter, setFilter] = useState('semua')
  const [err, setErr] = useState('')

  const load = useCallback(async () => setData(await fetch('/api/posts').then((r) => r.json())), [])
  useEffect(() => { load() }, [load])

  const openPost = async (id) => {
    const r = await fetch(`/api/posts?id=${id}`)
    if (r.status === 401) return setGate({ scope: 'writing', then: id })
    setReading((await r.json()).post)
  }
  const granted = async () => { const id = gate?.then; setGate(null); await load(); if (id) openPost(id) }

  const save = async (e) => {
    e.preventDefault(); setErr('')
    const r = await fetch('/api/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(editor) })
    if (!r.ok) return setErr((await r.json()).error || 'Gagal menyimpan.')
    setEditor(null); setReading(null); load()
  }
  const del = async (id) => { if (confirm('Hapus tulisan ini?')) { await fetch(`/api/posts?id=${id}`, { method: 'DELETE' }); setReading(null); load() } }
  const logout = async () => { await fetch('/api/auth', { method: 'DELETE' }); load() }

  const list = (data?.posts || []).filter((p) => filter === 'semua' || p.kind === filter)

  return (
    <section className="page writing" style={{ '--a': A }}>
      <div className="page-head">
        <h1 className="mask"><span>Tulisan</span></h1>
        <div className="head-act">
          {data?.owner && <button className="btn solid sm" onClick={() => setEditor({ title: '', body: '', kind: 'opini' })}>Tulis baru</button>}
          {data?.owner ? <button className="btn ghost sm" onClick={logout}>Keluar</button> : <button className="btn ghost sm" onClick={() => setGate({ scope: 'owner' })}>Pemilik</button>}
        </div>
      </div>
      <p className="intro">Judul dan cuplikan terbuka untuk semua. Isi lengkapnya perlu kode atau izin.</p>

      <div className="tabs">
        {['semua', 'opini', 'fiksi'].map((k) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}
      </div>

      {data && list.length === 0 && <p className="muted pad">Belum ada tulisan.</p>}

      <ul className="plist">
        {list.map((p, i) => (
          <li key={p.id} style={{ '--i': i }}>
            <button className="prow" onClick={() => openPost(p.id)}>
              <span className={`kind ${p.kind}`}>{p.kind}</span>
              <span className="ptitle">{p.title}</span>
              <span className="pex">{p.excerpt}{p.excerpt.length >= 150 ? '…' : ''}</span>
              <span className="pmeta">{fmt(p.createdAt)} · {Math.max(1, Math.round(p.words / 200))} menit baca{!data.open && ' · terkunci'}</span>
            </button>
          </li>
        ))}
      </ul>

      {gate && <Gate scope={gate.scope} color={A} title={gate.scope === 'owner' ? 'Masuk pemilik' : 'Buka tulisan'} sub={gate.scope === 'owner' ? 'Kode pribadi untuk menulis dan mengelola.' : 'Masukkan kode, atau minta izin dan tunggu persetujuan.'} onClose={() => setGate(null)} onGranted={granted} />}

      {reading && (
        <Overlay side wide onClose={() => setReading(null)}>
          <article className="read" style={{ '--a': A }}>
            <span className={`kind ${reading.kind}`}>{reading.kind}</span>
            <h2>{reading.title}</h2>
            <p className="pmeta">{fmt(reading.createdAt)}</p>
            <div className="body">{reading.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>
            {data?.owner && (
              <div className="wfoot">
                <button className="btn ghost sm" onClick={() => setEditor(reading)}>Edit</button>
                <button className="btn ghost sm" onClick={() => del(reading.id)}>Hapus</button>
              </div>
            )}
          </article>
        </Overlay>
      )}

      {editor && (
        <Overlay side wide onClose={() => setEditor(null)}>
          <form className="editor" style={{ '--a': A }} onSubmit={save}>
            <div className="seg k2">
              {['opini', 'fiksi'].map((k) => <button type="button" key={k} className={editor.kind === k ? 'on' : ''} onClick={() => setEditor({ ...editor, kind: k })}>{k}</button>)}
            </div>
            <input className="ed-title" placeholder="Judul" value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} autoFocus />
            <textarea className="ed-body" placeholder="Mulai menulis. Pisahkan paragraf dengan baris kosong." value={editor.body} onChange={(e) => setEditor({ ...editor, body: e.target.value })} />
            {err && <p className="err">{err}</p>}
            <button className="btn solid">Simpan tulisan</button>
          </form>
        </Overlay>
      )}
    </section>
  )
}
