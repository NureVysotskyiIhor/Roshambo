interface PlayerCardProps {
  username: string;
  avatarUrl: string;
  isYou?: boolean;
}

export function PlayerCard({ username, avatarUrl, isYou }: PlayerCardProps) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div
      className="flex items-center"
      style={{
        gap: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '12px 16px',
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            fontWeight: 700,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{username}</p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
          {isYou ? 'Creator · you' : 'Player'}
        </p>
      </div>

      <div
        className="flex items-center"
        style={{
          gap: 6,
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: 20,
          padding: '4px 10px',
          color: 'var(--color-win)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'var(--color-win)',
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 500 }}>Online</span>
      </div>
    </div>
  );
}
