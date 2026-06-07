import { Avatar } from '../ui/avatar.component'

interface PlayerColumnProps {
  username: string
  avatarUrl: string
  badgeVariant: 'ready' | 'choosing' | 'waiting' | 'disconnected'
  badgeText: string
  isOpponent?: boolean
  opacity?: number
}

type BadgeVariant = PlayerColumnProps['badgeVariant']

const BADGE_STYLE: Record<BadgeVariant, { backgroundColor: string; border: string; color: string }> = {
  ready: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.4)',
    color: 'var(--color-win)',
  },
  choosing: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    border: '1px solid rgba(108, 99, 255, 0.4)',
    color: 'var(--color-primary)',
  },
  waiting: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    color: 'var(--color-draw)',
  },
  disconnected: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'rgba(239, 68, 68, 0.7)',
  },
}

const DOT_COLOR: Record<BadgeVariant, string> = {
  ready: 'var(--color-win)',
  choosing: 'var(--color-primary)',
  waiting: 'var(--color-draw)',
  disconnected: 'rgba(239, 68, 68, 0.7)',
}

export function PlayerColumn({
  username,
  avatarUrl,
  badgeVariant,
  badgeText,
  opacity = 1,
}: PlayerColumnProps) {
  const badge = BADGE_STYLE[badgeVariant]
  const dotColor = DOT_COLOR[badgeVariant]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity }}>
      <Avatar username={username || '?'} avatarUrl={avatarUrl} size="lg" />
      <p style={{ fontSize: 18, fontWeight: 600, marginTop: 12, color: 'var(--color-text)' }}>
        {username || 'Opponent'}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          padding: '4px 12px',
          borderRadius: 20,
          ...badge,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{badgeText}</span>
      </div>
    </div>
  )
}
