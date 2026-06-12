import { useNavigate } from '@tanstack/react-router';
import { useLogout } from '../../queries/auth.queries';
import { authStore } from '../../store/auth.store';
import { PATHS } from '../../routes/paths';
import { Button } from '../ui/button.component';
import { Logo } from './logo.component';

export function AppHeader() {
  const user = authStore((state) => state.user);
  const navigate = useNavigate();
  const logout = useLogout();

  if (!user) return null;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        void navigate({ to: PATHS.LOGIN });
      },
    });
  };

  return (
    <header
      className="flex items-center justify-between"
      style={{
        padding: '12px 24px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Logo variant="inline" />
      <div className="flex items-center gap-3">
        <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          {user.username}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={logout.isPending}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
