import { cva, type VariantProps } from 'class-variance-authority'
import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const cardVariants = cva('rounded-xl', {
  variants: {
    variant: {
      default:
        'bg-[var(--color-surface)] border border-[var(--color-border)] p-6',
      game: 'bg-[var(--color-surface)] border border-[var(--color-primary)]/30 p-6',
      result:
        'bg-[var(--color-surface)] border border-[var(--color-primary)] p-8 text-center',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant }), className)} {...props} />
  )
}
