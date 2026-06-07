interface WaitingIndicatorProps {
  text: string;
}

export function WaitingIndicator({ text }: WaitingIndicatorProps) {
  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.3 }
        }
      `}</style>
      <div className="flex items-center justify-center" style={{ gap: 8, marginTop: 16 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'var(--color-draw)',
            animation: 'pulse-dot 1.5s ease-in-out infinite',
          }}
        />
        <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
          {text}
        </p>
      </div>
    </>
  );
}
