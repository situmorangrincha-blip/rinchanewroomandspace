'use client'
import { useCallback, useEffect, useState } from 'react'
import Gate from '@/components/Gate'
import Overlay from '@/components/Overlay'
import { ROOMS } from '@/lib/config'

const A = ROOMS.works.color

export default function Works() {
  const [data, setData] = useState(null)
  const [gate, setGate] = useState(null) // 'works' | 'owner'
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('Semua')
  const [f, setF] = useState({ url: '', title: '', desc: '' })
  const [err, setErr] = useState('')

  const load = useCallback(async () => setData(await fetch('/api/works').then((r) => r.json())), [])
  useEffect(() => { load() }, [load])

  const granted = () => { setGate(null); load() }
  const save = async (e) => {
    e.preventDefault(); setErr('')
    const r = await fetch('/api/works', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) })
    if (!r.ok) return setErr((await r.json()).error || 'Gagal menyimpan.')
    setAdding(false); setF({ url: '', title: '', desc: '' }); load()
  }
  const del = async (id) => { if (confirm('Hapus karya ini?')) { await fetch(`/api/works?id=${id}`, { method: 'DELETE' }); load() } }
  const logout = async () => { await fetch('/api/auth', { method: 'DELETE' }); load() }

  const kinds = ['Semua', ...new Set((data?.works || []).map((w) => w.kind))]
  const list = (data?.works || []).filter((w) => filter === 'Semua' || w.kind === filter)

  return (
    <section className="page works" style={{ '--a': A }}>
      <div className="page-head">
        <h1 className="mask"><span>Karya</span></h1>
        <div className="head-act">
          {data?.owner && <button className="btn solid sm" onClick={() => setAdding(true)}>Tambah karya</button>}
          {data?.owner ? <button className="btn ghost sm" onClick={logout}>Keluar</button> : <button className="btn ghost sm" onClick={() => setGate('owner')}>Pemilik</button>}
        </div>
      </div>
      <p className="intro">Pratinjau terbuka untuk siapa saja. Tautan ke proyeknya baru muncul setelah akses disetujui.</p>

      {kinds.length > 2 && (
        <div className="tabs">{kinds.map((k) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{k}</button>)}</div>
      )}

      {data && list.length === 0 && <p className="muted pad">Belum ada karya. {data.owner ? 'Tambah yang pertama.' : ''}</p>}

      <div className="wgrid">
        {list.map((w, i) => (
          <article className="wcard" key={w.id} style={{ '--i': i }}>
            <div className="shot">
              <div className="chrome"><i /><i /><i /></div>
              <div className="ph">{w.kind}</div>
              <img src={`/api/preview/${w.id}`} alt={`Pratinjau ${w.title}`} loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
            <div className="wbody">
              <div className="wtop"><h3>{w.title}</h3><span className="tag">{w.kind}</span></div>
              {w.desc && <p>{w.desc}</p>}
              <div className="wfoot">
                {data.open && w.url
                  ? <a className="btn solid sm" href={w.url} target="_blank" rel="noopener noreferrer">Buka proyek</a>
                  : <button className="btn ghost sm" onClick={() => setGate('works')}>Minta akses</button>}
                {data.owner && <button className="btn ghost sm" onClick={() => del(w.id)}>Hapus</button>}
              </div>
            </div>
          </article>
        ))}
      </div>

      {gate === 'works' && <Gate scope="works" color={A} title="Buka karya" sub="Masukkan kode, atau minta izin dan tunggu persetujuan." onClose={() => setGate(null)} onGranted={granted} />}
      {gate === 'owner' && <Gate scope="owner" color={A} title="Masuk pemilik" sub="Kode pribadi untuk mengelola karya." onClose={() => setGate(null)} onGranted={granted} />}

      {adding && (
        <Overlay onClose={() => setAdding(false)}>
          <form className="gate" style={{ '--a': A }} onSubmit={save}>
            <div className="dot" /><h2>Tambah karya</h2>
            <p className="sub">Tempel link Vercel atau GitHub. Pratinjau dibuat otomatis.</p>
            <input className="field" placeholder="https://proyek-lu.vercel.app" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} autoFocus />
            <input className="field" placeholder="Judul" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <input className="field" placeholder="Deskripsi singkat" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} />
            {err && <p className="err">{err}</p>}
            <button className="btn solid" disabled={!f.url}>Simpan karya</button>
          </form>
        </Overlay>
      )}
    </section>
  )
}
