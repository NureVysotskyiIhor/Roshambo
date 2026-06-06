import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'

export function RootLayout() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen flex flex-col">
        <main
          className="flex-1 flex items-center justify-center"
          style={{ padding: '32px 16px' }}
        >
          <Outlet />
        </main>
        <footer style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            © 2026 Roshambo · One on One Duel
          </p>
        </footer>
      </div>
    </>
  )
}
