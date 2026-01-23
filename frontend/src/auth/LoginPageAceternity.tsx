import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, Loader2, Globe, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { FormInputAceternity } from '../components/Forms/FormInputAceternity'
import { FormCheckboxAceternity } from '../components/Forms/FormCheckboxAceternity'

const loginSchema = z.object({
  email: z.string().min(1, 'validation.required').email('validation.email'),
  password: z.string().min(1, 'validation.required').min(6, 'validation.minLength'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPageAceternity() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showMfaInput, setShowMfaInput] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

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
            {/* Email field with Aceternity styling */}
            <FormInputAceternity
              label={t('auth.email')}
              name="email"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              register={register}
              error={errors.email}
              required
              variant="aceternity"
              placeholder="user@gastat.sa"
              autoComplete="username"
            />

            {/* Password field with custom show/hide toggle */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 text-start">
                {t('auth.password')}
                <span className="text-red-500 ms-1" aria-label={t('validation.required')}>
                  *
                </span>
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  className="w-full min-h-11 sm:min-h-10 md:min-h-12 text-sm sm:text-base px-4 ps-12 pe-12 py-2 border border-input dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent focus:ring-primary-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] focus:shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),_0px_1px_0px_0px_rgba(25,28,33,0.04),_0px_0px_0px_2px_rgba(var(--primary),0.3)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                <p className="text-sm text-red-600 dark:text-red-400 text-start">
                  {t(errors.password.message || '', { min: 6 })}
                </p>
              )}
            </div>

            {/* MFA Code field (if required) */}
            {showMfaInput && (
              <FormInputAceternity
                label={t('auth.mfaCode')}
                name="mfaCode"
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                variant="aceternity"
                placeholder="123456"
                maxLength={6}
                helpText={t('auth.enterMfaCode')}
              />
            )}

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between">
              <FormCheckboxAceternity
                label={t('auth.rememberMe')}
                name="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                variant="aceternity"
              />
              <a href="#" className="text-sm text-primary hover:text-primary/80">
                {t('auth.forgotPassword')}
              </a>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-11 sm:min-h-10 md:min-h-12 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="me-2 size-5 animate-spin" />
                  {t('common.loading')}
                </span>
              ) : (
                t('auth.signIn')
              )}
            </button>
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
