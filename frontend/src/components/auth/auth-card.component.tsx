import type { ReactNode } from 'react'
import { Logo } from '../shared/logo.component'

interface AuthCardProps {
  tagline: string
  children: ReactNode
}

export function AuthCard({ tagline, children }: AuthCardProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 440,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 32,
      }}
    >
      <Logo />
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 16, marginBottom: 24 }}>
        {tagline}
      </p>
      {children}
    </div>
  )
}
