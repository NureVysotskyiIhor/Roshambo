import { cva, type VariantProps } from 'class-variance-authority'
import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
  {
    variants: {
      variant: {
        waiting:
          'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]',
        choosing:
          'bg-[var(--color-draw)]/20 text-[var(--color-draw)] border-[var(--color-draw)]',
        connected:
          'bg-[var(--color-win)]/20 text-[var(--color-win)] border-[var(--color-win)]',
        disconnected:
          'bg-[var(--color-lose)]/20 text-[var(--color-lose)] border-[var(--color-lose)]',
        win: 'bg-[var(--color-win)]/20 text-[var(--color-win)] border-[var(--color-win)]',
        lose: 'bg-[var(--color-lose)]/20 text-[var(--color-lose)] border-[var(--color-lose)]',
        draw: 'bg-[var(--color-draw)]/20 text-[var(--color-draw)] border-[var(--color-draw)]',
      },
    },
    defaultVariants: {
      variant: 'waiting',
    },
  },
)

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
