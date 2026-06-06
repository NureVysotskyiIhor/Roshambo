import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const loaderVariants = cva('animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent', {
  variants: {
    size: {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-16 h-16',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

interface LoaderProps extends VariantProps<typeof loaderVariants> {
  className?: string
}

export function Loader({ size, className }: LoaderProps) {
  return <div className={cn(loaderVariants({ size }), className)} />
}
