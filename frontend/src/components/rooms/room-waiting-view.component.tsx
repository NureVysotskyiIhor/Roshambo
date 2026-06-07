import type { ReactNode } from 'react'
import type { RoomResponseDto, UserResponseDto } from '@roshambo/shared'
import { RoomCodeDisplay } from './room-code-display.component'
import { CopyButton } from './copy-button.component'
import { PlayerCard } from './player-card.component'
import { WaitingIndicator } from './waiting-indicator.component'
import { WarningBanner } from './warning-banner.component'

export interface StatusBadgeView {
  label: string
  color: string
  background: string
  border: string
}

interface RoomWaitingViewProps {
  room: RoomResponseDto
  currentUser: UserResponseDto | null
  opponentLeft: boolean
  opponentName: string
  statusBadge: StatusBadgeView
  tabSwitcher: ReactNode
}

export function RoomWaitingView({
  room,
  currentUser,
  opponentLeft,
  opponentName,
  statusBadge,
  tabSwitcher,
}: RoomWaitingViewProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 620,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 32,
      }}
    >
      <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>

      {tabSwitcher}

      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 28 }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'var(--color-rock)',
              }}
            />
            <div style={{ width: 10, height: 10, backgroundColor: 'var(--color-paper)' }} />
            <div
              style={{
                width: 10,
                height: 10,
                backgroundColor: 'var(--color-scissors)',
                transform: 'rotate(45deg)',
              }}
            />
          </div>
          <div>
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
              }}
            >
              ROSHAMBO
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Rock · Scissors · Paper
            </p>
          </div>
        </div>

        <div
          className="flex items-center"
          style={{
            gap: 8,
            backgroundColor: statusBadge.background,
            border: statusBadge.border,
            borderRadius: 20,
            padding: '6px 12px',
            color: statusBadge.color,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: statusBadge.color,
              animation: 'pulse-dot 1.5s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{statusBadge.label}</span>
        </div>
      </div>

      {opponentLeft && (
        <div style={{ marginBottom: 20 }}>
          <WarningBanner
            message={`${opponentName || 'Opponent'} disconnected. Score has been reset — 0:0. Room is open for a new player.`}
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <RoomCodeDisplay code={room.code} />
      </div>

      <div className="flex justify-center" style={{ marginBottom: 24 }}>
        <CopyButton text={room.code} />
      </div>

      <p
        style={{
          fontSize: 14,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        Share this code with your opponent to start the game
      </p>

      <div style={{ height: 1, backgroundColor: 'var(--color-border)', marginBottom: 20 }} />

      <PlayerCard
        username={currentUser?.username ?? ''}
        avatarUrl={currentUser?.avatarUrl ?? ''}
        isYou={true}
      />

      <WaitingIndicator text="Waiting for opponent to join..." />
    </div>
  )
}
