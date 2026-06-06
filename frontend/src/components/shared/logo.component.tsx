export function Logo() {
  return (
    <div>
      <div className="flex items-center gap-1.5" style={{ marginBottom: 12 }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: 'var(--color-rock)',
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            backgroundColor: 'var(--color-paper)',
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            backgroundColor: 'var(--color-scissors)',
            transform: 'rotate(45deg)',
          }}
        />
      </div>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
        }}
      >
        ROSHAMBO
      </h1>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
        Rock · Scissors · Paper
      </p>
    </div>
  )
}
