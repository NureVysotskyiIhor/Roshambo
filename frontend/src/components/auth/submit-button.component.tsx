import type { ReactNode } from 'react';

interface SubmitButtonProps {
  isLoading: boolean;
  loadingText: string;
  children: ReactNode;
}

export function SubmitButton({ isLoading, loadingText, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      style={{
        width: '100%',
        height: 48,
        backgroundColor: isLoading ? 'rgba(108, 99, 255, 0.7)' : 'var(--color-primary)',
        border: 'none',
        borderRadius: 8,
        color: 'white',
        fontSize: 16,
        fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'background-color 0.15s',
        marginTop: 4,
        fontFamily: 'var(--font-sans)',
      }}
      onMouseEnter={(e) => {
        if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--color-primary)';
      }}
    >
      {isLoading ? (
        <>
          <span
            className="animate-spin"
            style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              borderTopColor: 'transparent',
            }}
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
