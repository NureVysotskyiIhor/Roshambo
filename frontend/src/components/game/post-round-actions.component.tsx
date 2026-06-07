interface PostRoundActionsProps {
  onPlayAgain: () => void
  onExit: () => void
  waitingForRestart: boolean
}

export function PostRoundActions({ onPlayAgain, onExit, waitingForRestart }: PostRoundActionsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 12,
        zIndex: 10,
      }}
    >
      <button
        onClick={onPlayAgain}
        disabled={waitingForRestart}
        style={{
          backgroundColor: waitingForRestart ? 'rgba(108, 99, 255, 0.5)' : 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
          cursor: waitingForRestart ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'background-color 0.15s',
        }}
      >
        {waitingForRestart ? 'Waiting...' : 'Play again'}
      </button>
      <button
        onClick={onExit}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        To lobby
      </button>
    </div>
  )
}
