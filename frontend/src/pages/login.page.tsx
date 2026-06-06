import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { useLogin } from '../queries/auth.queries'
import { AuthCard } from '../components/auth/auth-card.component'
import { ErrorBanner } from '../components/auth/error-banner.component'
import { FormField } from '../components/auth/form-field.component'
import { SubmitButton } from '../components/auth/submit-button.component'
import { loginSchema, type LoginFormData } from '../lib/validations/auth.validations'
import { parseError } from '../lib/parse-error'
import { PATHS } from '../routes/paths'

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const hasError = !!serverError || !!errors.password

  const onSubmit = (data: LoginFormData) => {
    setServerError(null)
    login.mutate(data, {
      onSuccess: () => {
        void navigate({ to: PATHS.ROOMS_NEW })
      },
      onError: (err) => {
        setServerError(parseError(err))
      },
    })
  }

  const displayError = serverError ?? errors.username?.message ?? errors.password?.message

  return (
    <AuthCard tagline="Sign in to challenge a friend to a duel.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          label="Username"
          icon={<User size={16} />}
          placeholder="player_one"
          error={!!errors.username}
          disabled={login.isPending}
          {...register('username')}
        />

        <FormField
          label="Password"
          icon={<Lock size={16} />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter password"
          error={hasError}
          disabled={login.isPending}
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

        <SubmitButton isLoading={login.isPending} loadingText="Signing in...">
          Sign in
        </SubmitButton>
      </form>

      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 20 }}>
        Don&apos;t have an account?{' '}
        <Link to={PATHS.REGISTER} style={{ color: 'var(--color-primary)' }}>
          Create account
        </Link>
      </p>
    </AuthCard>
  )
}
