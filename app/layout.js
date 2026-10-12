import './globals.css'
import Background from '@/components/Background'
import { TransitionProvider, TLink } from '@/components/Transition'
import { OWNER_NAME, ROOMS } from '@/lib/config'

export const metadata = {
  title: `${OWNER_NAME} · Rooms`,
  description: 'Ruang kerja, karya, dan tulisan.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Background />
        <TransitionProvider>
          <header className="top">
            <TLink href="/" className="brand" label={OWNER_NAME}>{OWNER_NAME}<i /></TLink>
            <nav>
              {Object.values(ROOMS).map((r) => (
                <TLink key={r.href} href={r.href} color={r.color} label={r.name} className="nav-a" style={{ '--a': r.color }}>{r.name}</TLink>
              ))}
            </nav>
          </header>
          <main>{children}</main>
        </TransitionProvider>
      </body>
    </html>
  )
}
