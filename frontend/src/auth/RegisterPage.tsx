import type * as React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { Globe, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../store/authStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const registerSchema = z
  .object({
    name: z.string().min(1, 'validation:required').min(2, 'validation:minLength'),
    email: z.string().min(1, 'validation:required').email('validation:email.invalid'),
    password: z.string().min(1, 'validation:required').min(6, 'validation:minLength'),
    confirmPassword: z.string().min(1, 'validation:required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwordsDoNotMatch',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage(): React.JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setIsLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: 'user',
          },
        },
      })

      if (error) {
        throw error
      }

      if (authData.user) {
        toast.success(t('auth.accountCreated'))
        navigate({ to: '/login' })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.registrationFailed'))
    } finally {
      setIsLoading(false)
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
            <p className="mt-1 text-sm text-ink-mute">{t('auth.createAccount')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Full name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {t('auth.fullName')}
                <span className="ms-1 text-danger" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                disabled={isLoading}
                aria-invalid={errors.name ? true : undefined}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-start text-sm text-danger">
                  {t(errors.name.message || '', {
                    min: 2,
                    current: getValues('name')?.length ?? 0,
                  })}
                </p>
              )}
            </div>

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
                disabled={isLoading}
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
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={errors.password ? true : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-start text-sm text-danger">
                  {t(errors.password.message || '', {
                    min: 6,
                    current: getValues('password')?.length ?? 0,
                  })}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('auth.confirmPassword')}
                <span className="ms-1 text-danger" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={errors.confirmPassword ? true : undefined}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-start text-sm text-danger">
                  {t(errors.confirmPassword.message || '')}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" fullWidth loading={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                  {t('common.loading')}
                </span>
              ) : (
                t('auth.signUp')
              )}
            </Button>
          </form>

          {/* Sign in */}
          <p className="mt-6 text-center text-sm text-ink-mute">
            {t('auth.alreadyHaveAccount')}{' '}
            <a
              href="/login"
              className="text-accent hover:underline"
              onClick={(event) => {
                event.preventDefault()
                navigate({ to: '/login' })
              }}
            >
              {t('auth.signIn')}
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
