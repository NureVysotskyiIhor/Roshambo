import { AlertTriangle } from 'lucide-react'

interface WarningBannerProps {
  message: string
}

export function WarningBanner({ message }: WarningBannerProps) {
  return (
    <div
      className="flex items-start"
      style={{
        gap: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 8,
        padding: '12px 16px',
      }}
    >
      <AlertTriangle
        size={20}
        style={{ color: 'var(--color-draw)', flexShrink: 0, marginTop: 1 }}
      />
      <p style={{ fontSize: 14, color: 'var(--color-draw)', lineHeight: 1.5 }}>{message}</p>
    </div>
  )
}
