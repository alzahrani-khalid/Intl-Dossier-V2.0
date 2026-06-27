import type * as React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Globe, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

const loginSchema = z.object({
  email: z.string().min(1, 'validation:required').email('validation:email.invalid'),
  password: z.string().min(1, 'validation:required').min(6, 'validation:minLength'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage(): React.JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, resetPassword, isLoading, error } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      await login(data.email, data.password)
      navigate({ to: '/dashboard' })
    } catch {
      // login() re-throws on failure, so navigation only runs on success.
      toast.error(t('auth.invalidCredentials'))
    }
  }

  const handleForgotPassword = async (): Promise<void> => {
    const email = getValues('email')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('auth.enterEmailFirst'))
      return
    }

    try {
      await resetPassword(email)
      toast.success(t('auth.resetEmailSent'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.invalidCredentials'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-6 sm:p-8">
          {/* Brand + title */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-accent-soft">
              <Globe className="size-7 text-accent" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-ink">{t('common.appTitle')}</h1>
            <p className="mt-1 text-sm text-ink-mute">{t('auth.signIn')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                {t('auth.email')}
                <span className="ms-1 text-danger" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="user@gastat.sa"
                aria-invalid={errors.email ? true : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-start text-sm text-danger">{t(errors.email.message || '')}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {t('auth.password')}
                <span className="ms-1 text-danger" aria-hidden="true">
                  *
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pe-10"
                  aria-invalid={errors.password ? true : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" aria-hidden="true" />
                  ) : (
                    <Eye className="size-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-start text-sm text-danger">
                  {t(errors.password.message || '', {
                    min: 6,
                    current: getValues('password')?.length ?? 0,
                  })}
                </p>
              )}
            </div>

            {/* Remember me + forgot password */}
            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1 text-sm text-ink">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  aria-label={t('auth.rememberMe')}
                />
                <span>{t('auth.rememberMe')}</span>
              </label>
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                className="text-sm text-accent hover:underline"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            {/* Auth error */}
            {error && (
              <div className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 p-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button type="submit" fullWidth loading={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                  {t('common.loading')}
                </span>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          {/* Sign up */}
          <p className="mt-6 text-center text-sm text-ink-mute">
            {t('auth.dontHaveAccount')}{' '}
            <a
              href="/register"
              className="text-accent hover:underline"
              onClick={(event) => {
                event.preventDefault()
                navigate({ to: '/register' })
              }}
            >
              {t('auth.signUp')}
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-ink-mute">
          © {new Date().getFullYear()} GASTAT — General Authority for Statistics
        </p>
      </div>
    </div>
  )
}
