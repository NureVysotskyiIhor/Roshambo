import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useRegister } from '../queries/auth.queries'
import { AuthCard } from '../components/auth/auth-card.component'
import { ErrorBanner } from '../components/auth/error-banner.component'
import { FormField } from '../components/auth/form-field.component'
import { SubmitButton } from '../components/auth/submit-button.component'
import { registerSchema, type RegisterFormData } from '../lib/validations/auth.validations'
import { parseError } from '../lib/parse-error'
import { PATHS } from '../routes/paths'

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (data: RegisterFormData) => {
    setServerError(null)
    const payload = {
      username: data.username,
      password: data.password,
      ...(data.email ? { email: data.email } : {}),
    }
    registerMutation.mutate(payload, {
      onSuccess: () => {
        void navigate({ to: PATHS.ROOMS_NEW })
      },
      onError: (err) => {
        setServerError(parseError(err))
      },
    })
  }

  const displayError = serverError ?? Object.values(errors)[0]?.message

  return (
    <AuthCard tagline="Create an account to start your first duel.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          label="Username"
          icon={<User size={16} />}
          placeholder="player_one"
          error={!!errors.username}
          disabled={registerMutation.isPending}
          {...register('username')}
        />

        <FormField
          label="Email"
          labelRight={<span style={{ fontSize: 11 }}>Optional</span>}
          icon={<Mail size={16} />}
          type="email"
          placeholder="you@example.com"
          error={!!errors.email}
          disabled={registerMutation.isPending}
          {...register('email')}
        />

        <FormField
          label="Password"
          icon={<Lock size={16} />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Minimum 6 characters"
          error={!!errors.password}
          disabled={registerMutation.isPending}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register('password')}
        />

        {displayError && <ErrorBanner message={displayError} />}

        <SubmitButton isLoading={registerMutation.isPending} loadingText="Creating account...">
          Create account
        </SubmitButton>
      </form>

      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 20 }}>
        Already have an account?{' '}
        <Link to={PATHS.LOGIN} style={{ color: 'var(--color-primary)' }}>
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
