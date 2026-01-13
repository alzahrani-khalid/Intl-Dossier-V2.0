import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, Loader2, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Checkbox } from '../components/ui/checkbox'

const loginSchema = z.object({
  email: z.string().min(1, 'validation.required').email('validation.email'),
  password: z.string().min(1, 'validation.required').min(6, 'validation.minLength'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showMfaInput, setShowMfaInput] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, showMfaInput ? mfaCode : undefined)
      // Redirect without showing toast - successful login is indicated by redirect
      navigate({ to: '/' })
    } catch (error) {
      // Check if MFA is required
      if (error instanceof Error && error.message.includes('MFA')) {
        setShowMfaInput(true)
      } else {
        toast.error(t('auth.invalidCredentials'))
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>

        {/* Login card */}
        <div className="rounded-2xl bg-card p-8 shadow-xl">
          {/* Logo and title */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Globe className="size-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t('common.appTitle')}</h1>
            <p className="mt-2 text-muted-foreground">{t('auth.signIn')}</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email field - with 48px touch target height */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                {t('auth.email')}
              </label>
              <Input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="username"
                placeholder="user@gastat.sa"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{t(errors.email.message || '')}</p>
              )}
            </div>

            {/* Password field - with 48px touch target height */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  className="pe-14"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </Button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">
                  {t(errors.password.message || '', { min: 6 })}
                </p>
              )}
            </div>

            {/* MFA Code field (if required) - with 48px touch target */}
            {showMfaInput && (
              <div>
                <label htmlFor="mfaCode" className="mb-2 block text-sm font-medium text-foreground">
                  {t('auth.mfaCode')}
                </label>
                <Input
                  type="text"
                  id="mfaCode"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                />
                <p className="mt-1 text-sm text-muted-foreground">{t('auth.enterMfaCode')}</p>
              </div>
            )}

            {/* Remember me and forgot password - with 48px touch targets */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={false}
                  onCheckedChange={(checked) => {
                    // Update form value when checkbox changes
                    const event = { target: { name: 'rememberMe', value: checked } }
                  }}
                />
                <label htmlFor="rememberMe" className="text-sm text-foreground cursor-pointer">
                  {t('auth.rememberMe')}
                </label>
              </div>
              <Button variant="link" asChild className="px-0">
                <a href="#">{t('auth.forgotPassword')}</a>
              </Button>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit button - with 48px touch target */}
            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="me-2 size-5 animate-spin" />
                  {t('common.loading')}
                </span>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.dontHaveAccount')}{' '}
            <a
              href="/register"
              className="text-primary hover:text-primary/80 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                navigate({ to: '/register' })
              }}
            >
              {t('auth.signUp')}
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          © 2025 GASTAT - General Authority for Statistics
        </p>
      </div>
    </div>
  )
}
