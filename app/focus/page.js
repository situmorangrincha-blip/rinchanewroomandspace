'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Gate from '@/components/Gate'
import { ROOMS } from '@/lib/config'

const A = ROOMS.focus.color
const PRI = { 1: { n: 'P1', c: '#FF6A4D' }, 2: { n: 'P2', c: '#FFC83D' }, 3: { n: 'P3', c: '#14B88A' } }
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const label = (s) => { const d = parse(s); return `${HARI[d.getDay()]}, ${d.getDate()} ${BLN[d.getMonth()]}` }

export default function Focus() {
  const [state, setState] = useState('loading') // loading | locked | ready
  const [todos, setTodos] = useState([])
  const [form, setForm] = useState({ title: '', priority: 2, due: '', frog: false })
  const [showDone, setShowDone] = useState(false)
  const [filter, setFilter] = useState('all') // all | timed | free

  const load = useCallback(async () => {
    const r = await fetch('/api/todos')
    if (r.status === 401) return setState('locked')
    setTodos((await r.json()).todos); setState('ready')
  }, [])
  useEffect(() => { load() }, [load])

  const api = async (method, body, qs = '') => {
    const r = await fetch('/api/todos' + qs, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) })
    if (r.status === 401) return setState('locked')
    const d = await r.json(); if (d.todos) setTodos(d.todos)
  }
  const patch = (id, p) => { setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, ...p, ...(p.done ? { doneAt: new Date().toISOString() } : {}) } : t))); api('PATCH', { id, ...p }) }
  const add = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    api('POST', { ...form, due: form.due || null })
    setForm({ ...form, title: '', frog: false })
  }
  const logout = async () => { await fetch('/api/auth', { method: 'DELETE' }); setState('locked') }

  const today = ymd(new Date())
  const tomorrow = ymd(addDays(new Date(), 1))
  const open = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)

  const frog = useMemo(() => {
    const manual = open.find((t) => t.frog)
    if (manual) return { t: manual, manual: true }
    const sug = [...open].sort((a, b) => a.priority - b.priority || (a.due || '9') .localeCompare(b.due || '9'))[0]
    return sug ? { t: sug, manual: false } : null
  }, [open])

  const timed = open.filter((t) => t.due).sort((a, b) => a.due.localeCompare(b.due) || a.priority - b.priority)
  const free = open.filter((t) => !t.due).sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt))
  const groups = useMemo(() => {
    const g = []
    for (const t of timed) {
      const k = t.due < today ? 'late' : t.due
      let x = g.find((y) => y.k === k)
      if (!x) g.push((x = { k, items: [] }))
      x.items.push(t)
    }
    return g
  }, [timed, today])

  // statistik 14 hari
  const stats = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => { const d = addDays(new Date(), i - 13); return { k: ymd(d), n: 0, frogs: 0, d } })
    const byPri = { 1: 0, 2: 0, 3: 0 }
    for (const t of done) {
      if (!t.doneAt) continue
      const k = ymd(new Date(t.doneAt))
      const x = days.find((y) => y.k === k)
      if (x) { x.n++; if (t.wasFrog) x.frogs++; byPri[t.priority]++ }
    }
    let streak = 0
    const set = new Set(done.filter((t) => t.doneAt).map((t) => ymd(new Date(t.doneAt))))
    let cur = new Date(); if (!set.has(ymd(cur))) cur = addDays(cur, -1)
    while (set.has(ymd(cur))) { streak++; cur = addDays(cur, -1) }
    const week = days.slice(7).reduce((s, d) => s + d.n, 0)
    const prev = days.slice(0, 7).reduce((s, d) => s + d.n, 0)
    return { days, byPri, streak, week, prev, today: days[13].n, frogs: days.reduce((s, d) => s + d.frogs, 0), max: Math.max(3, ...days.map((d) => d.n)) }
  }, [done])

  if (state === 'loading') return <section className="page"><p className="muted">Memuat…</p></section>
  if (state === 'locked')
    return (
      <section className="page">
        <Gate scope="owner" color={A} title="Ruang Fokus" sub="Hanya untuk pemilik. Masukkan kode pribadi." onClose={() => (location.href = '/')} onGranted={load} />
      </section>
    )

  const Row = ({ t }) => (
    <li className={`task ${t.done ? 'is-done' : ''}`} style={{ '--p': PRI[t.priority].c }}>
      <button className="chk" onClick={() => patch(t.id, { done: !t.done })} aria-label="Selesai"><svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg></button>
      <span className="t-title">{t.title}</span>
      <span className="t-meta">
        {t.frog && <em className="frog-tag">frog</em>}
        <i className="pdot" title={PRI[t.priority].n} />
        {t.due && t.due < today && !t.done && <b className="late">telat</b>}
      </span>
      {!t.done && (
        <span className="t-act">
          <button onClick={() => patch(t.id, { frog: !t.frog })} title="Jadikan frog" className={t.frog ? 'on' : ''}>🐸</button>
          <button onClick={() => api('DELETE', null, `?id=${t.id}`)} title="Hapus">×</button>
        </span>
      )}
    </li>
  )

  const showTimed = filter !== 'free', showFree = filter !== 'timed'

  return (
    <section className="page focus" style={{ '--a': A }}>
      <div className="page-head">
        <h1 className="mask"><span>Fokus</span></h1>
        <button className="btn ghost sm" onClick={logout}>Keluar</button>
      </div>

      <div className="dash">
        <div className="col-main">
          <div className="frog-card">
            <p className="k">Frog hari ini</p>
            {frog ? (
              <>
                <h2>{frog.t.title}</h2>
                <div className="frog-act">
                  <button className="btn solid" onClick={() => patch(frog.t.id, { done: true })}>Selesai</button>
                  {!frog.manual && <button className="btn ghost" onClick={() => patch(frog.t.id, { frog: true })}>Kunci sebagai frog</button>}
                  <span className="muted">{frog.manual ? 'Kerjakan ini sebelum yang lain.' : 'Saran: prioritas tertinggi dengan tenggat terdekat.'}</span>
                </div>
              </>
            ) : <h2 className="muted-h">Tidak ada tugas terbuka. Tambah satu di bawah.</h2>}
          </div>

          <form className="adder" onSubmit={add}>
            <input className="add-in" placeholder="Tugas baru, lalu Enter" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="add-opts">
              <div className="seg" role="group" aria-label="Prioritas">
                {[1, 2, 3].map((p) => (
                  <button type="button" key={p} className={form.priority === p ? 'on' : ''} style={{ '--p': PRI[p].c }} onClick={() => setForm({ ...form, priority: p })}>P{p}</button>
                ))}
              </div>
              <input type="date" className="date-in" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
              <button type="button" className={`tog ${form.frog ? 'on' : ''}`} onClick={() => setForm({ ...form, frog: !form.frog })}>🐸 Frog</button>
              <button className="btn solid sm">Tambah</button>
            </div>
          </form>

          <div className="tabs">
            {[['all', 'Semua'], ['timed', 'Berjadwal'], ['free', 'Fleksibel']].map(([k, n]) => (
              <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{n}</button>
            ))}
            <span className="count">{open.length} terbuka</span>
          </div>

          {showTimed && groups.map((g) => (
            <div className="grp" key={g.k}>
              <h3 className={g.k === 'late' ? 'late' : ''}>{g.k === 'late' ? 'Terlewat' : g.k === today ? 'Hari ini' : g.k === tomorrow ? 'Besok' : label(g.k)}</h3>
              <ul>{g.items.map((t) => <Row key={t.id} t={t} />)}</ul>
            </div>
          ))}
          {showFree && free.length > 0 && (
            <div className="grp">
              <h3>Tanpa tenggat</h3>
              <ul>{free.map((t) => <Row key={t.id} t={t} />)}</ul>
            </div>
          )}
          {open.length === 0 && <p className="muted pad">Bersih. Nikmati jedanya.</p>}
        </div>

        <aside className="col-side">
          <div className="chips">
            <div className="chip"><b>{stats.today}</b><span>selesai hari ini</span></div>
            <div className="chip"><b>{stats.streak}<small>hari</small></b><span>streak</span></div>
            <div className="chip"><b>{stats.week}</b><span>{stats.week >= stats.prev ? '▲' : '▼'} 7 hari ({stats.prev} sebelumnya)</span></div>
            <div className="chip"><b>{stats.frogs}</b><span>frog tertelan</span></div>
          </div>

          <div className="card">
            <p className="k">Tugas selesai · 14 hari</p>
            <svg viewBox="0 0 300 130" className="chart" role="img" aria-label="Grafik tugas selesai per hari">
              {[0.5, 1].map((g) => <line key={g} x1="0" x2="300" y1={104 - g * 92} y2={104 - g * 92} className="grid" />)}
              {stats.days.map((d, i) => {
                const bw = 14, x = i * 21.4 + 3
                const h = (d.n / stats.max) * 92, hf = (d.frogs / stats.max) * 92
                return (
                  <g key={d.k} className="bar" style={{ '--i': i }}>
                    <rect x={x} y={104 - h} width={bw} height={Math.max(h, 2)} rx="4" fill={i === 13 ? A : '#C9CEFF'} />
                    {hf > 0 && <rect x={x} y={104 - h} width={bw} height={hf} rx="4" fill="#FF6A4D" />}
                    <text x={x + bw / 2} y="122" textAnchor="middle">{d.d.getDate()}</text>
                    <title>{label(d.k)}: {d.n} selesai{d.frogs ? `, ${d.frogs} frog` : ''}</title>
                  </g>
                )
              })}
            </svg>
            <p className="legend"><i style={{ background: A }} />Selesai <i style={{ background: '#FF6A4D' }} />Frog</p>
          </div>

          <div className="card">
            <p className="k">Komposisi prioritas selesai</p>
            {[1, 2, 3].map((p) => {
              const tot = stats.byPri[1] + stats.byPri[2] + stats.byPri[3] || 1
              return (
                <div className="pb" key={p}>
                  <span>{PRI[p].n}</span>
                  <div><i style={{ width: `${(stats.byPri[p] / tot) * 100}%`, background: PRI[p].c }} /></div>
                  <b>{stats.byPri[p]}</b>
                </div>
              )
            })}
          </div>

          {done.length > 0 && (
            <div className="card">
              <button className="k lnk" onClick={() => setShowDone(!showDone)}>Riwayat selesai ({done.length}) {showDone ? '−' : '+'}</button>
              {showDone && <ul className="done-list">{[...done].sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 12).map((t) => <Row key={t.id} t={t} />)}</ul>}
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
