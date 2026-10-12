import { TLink } from '@/components/Transition'
import { OWNER_NAME, ROOMS } from '@/lib/config'

export default function Home() {
  return (
    <section className="home">
      <p className="lede mask"><span>Tempat {OWNER_NAME} bekerja, memamerkan karya, dan menulis.</span></p>
      <ul className="rooms">
        {Object.values(ROOMS).map((r, i) => (
          <li key={r.href} style={{ '--a': r.color, '--d': `${0.25 + i * 0.12}s` }}>
            <TLink href={r.href} color={r.color} label={r.name} className="room">
              <span className="room-name">{r.name}</span>
              <span className="room-meta">
                <span>{r.hint}</span>
                <b>{r.private ? 'Privat' : 'Sebagian terkunci'}</b>
              </span>
              <svg className="arrow" viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </TLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
