import type { ReactNode } from 'react';
import { useGetMe } from '../../queries/auth.queries';
import { Loader } from '../ui/loader.component';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isPending, isError } = useGetMe();

  if (isPending) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}
      >
        <Loader size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}
      >
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          Service unavailable. Please try again later.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
