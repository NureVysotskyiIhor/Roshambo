import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-20 h-20',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  avatarUrl?: string | null;
  username: string;
  className?: string;
}

export function Avatar({ avatarUrl, username, size, className }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size }), className)}>
      <AvatarPrimitive.Image
        src={avatarUrl ?? undefined}
        alt={username}
        className="h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-surface text-[var(--coltext-text-mutedxt-sm border border-border">
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
