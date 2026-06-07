import { cva, type VariantProps } from 'class-variance-authority';
import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

const inputVariants = cva(
  'w-full h-10 px-4 rounded-lg bg-[var(--color-surface)] border text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)]',
  {
    variants: {
      variant: {
        default: 'border-[var(--color-border)] focus:border-[var(--color-primary)]',
        error: 'border-[var(--color-lose)] focus:border-[var(--color-lose)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, ...props }, ref) => {
    return <input ref={ref} className={cn(inputVariants({ variant }), className)} {...props} />;
  },
);

Input.displayName = 'Input';
