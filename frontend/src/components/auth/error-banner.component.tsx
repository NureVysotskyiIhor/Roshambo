interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="flex items-center gap-2.5"
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'var(--color-lose)',
          flexShrink: 0,
        }}
      />
      <p style={{ fontSize: 14, color: 'var(--color-lose)' }}>{message}</p>
    </div>
  );
}
