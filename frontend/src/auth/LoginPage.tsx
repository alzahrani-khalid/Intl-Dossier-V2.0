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
      toast.success(t('auth.loginSuccess'))
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        {/* Login card */}
        <div className="bg-card rounded-2xl shadow-xl p-8">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('common.appTitle')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('auth.signIn')}
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t('auth.email')}
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                placeholder="user@gastat.sa"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">
                  {t(errors.email.message || '')}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full px-4 py-2 pe-12 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">
                  {t(errors.password.message || '', { min: 6 })}
                </p>
              )}
            </div>

            {/* MFA Code field (if required) */}
            {showMfaInput && (
              <div>
                <label
                  htmlFor="mfaCode"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  {t('auth.mfaCode')}
                </label>
                <input
                  type="text"
                  id="mfaCode"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                  placeholder="123456"
                  maxLength={6}
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('auth.enterMfaCode')}
                </p>
              </div>
            )}

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  id="rememberMe"
                  className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                />
                <label
                  htmlFor="rememberMe"
                  className="ms-2 text-sm text-foreground"
                >
                  {t('auth.rememberMe')}
                </label>
              </div>
              <a
                href="#"
                className="text-sm text-primary hover:text-primary/80"
              >
                {t('auth.forgotPassword')}
              </a>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  {error}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin me-2" />
                  {t('common.loading')}
                </span>
              ) : (
                t('auth.signIn')
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a
              href="/register"
              className="text-primary hover:text-primary/80 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                navigate({ to: '/register' })
              }}
            >
              Sign Up
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          © 2025 GASTAT - General Authority for Statistics
        </p>
      </div>
    </div>
  )
}