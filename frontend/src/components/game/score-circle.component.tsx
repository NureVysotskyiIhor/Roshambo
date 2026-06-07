interface ScoreCircleProps {
  myScore: number
  opponentScore: number
  roundNumber: number
  gameState: 'playing' | 'round_result' | 'disconnected'
  resultLabel?: 'VICTORY' | 'DEFEAT' | 'DRAW' | 'FINAL'
}

export function ScoreCircle({
  myScore,
  opponentScore,
  roundNumber,
  gameState,
  resultLabel,
}: ScoreCircleProps) {
  const label = gameState === 'playing' ? `ROUND ${roundNumber}` : (resultLabel ?? 'FINAL')

  const myColor =
    myScore > opponentScore
      ? 'var(--color-win)'
      : myScore < opponentScore
        ? 'var(--color-lose)'
        : 'white'

  const opponentColor =
    opponentScore > myScore
      ? 'var(--color-win)'
      : opponentScore < myScore
        ? 'var(--color-lose)'
        : 'white'

  return (
    <div
      style={{
        width: 110,
        height: 110,
        borderRadius: '50%',
        backgroundColor: '#1a1a2e',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 28, fontWeight: 700 }}>
        <span style={{ color: myColor }}>{myScore}</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 20, margin: '0 4px' }}>:</span>
        <span style={{ color: opponentColor }}>{opponentScore}</span>
      </span>
    </div>
  )
}
