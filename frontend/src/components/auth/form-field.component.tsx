import { forwardRef } from 'react'
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  labelRight?: ReactNode
  icon: ReactNode
  rightElement?: ReactNode
  error?: boolean
  inputStyle?: CSSProperties
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, labelRight, icon, rightElement, error, inputStyle, ...inputProps }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{label}</span>
          {labelRight && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{labelRight}</span>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            {icon}
          </div>
          <input
            ref={ref}
            {...inputProps}
            style={{
              width: '100%',
              height: 44,
              backgroundColor: 'var(--color-surface)',
              border: `1px solid ${error ? 'var(--color-lose)' : 'var(--color-border)'}`,
              borderRadius: 8,
              paddingLeft: 40,
              paddingRight: rightElement ? 40 : 12,
              color: 'var(--color-text)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
              ...inputStyle,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = error ? 'var(--color-lose)' : 'var(--color-primary)'
              inputProps.onFocus?.(e)
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? 'var(--color-lose)' : 'var(--color-border)'
              inputProps.onBlur?.(e)
            }}
          />
          {rightElement && (
            <div
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
              }}
            >
              {rightElement}
            </div>
          )}
        </div>
      </div>
    )
  },
)
FormField.displayName = 'FormField'
