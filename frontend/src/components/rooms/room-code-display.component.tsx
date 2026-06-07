interface RoomCodeDisplayProps {
  code: string
}

export function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        ROOM CODE
      </p>
      <div className="flex items-center" style={{ gap: 8 }}>
        {code.split('').map((char, i) => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{
              width: 56,
              height: 68,
              backgroundColor: 'rgba(108, 99, 255, 0.08)',
              border: '1px solid rgba(108, 99, 255, 0.4)',
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>
              {char}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
