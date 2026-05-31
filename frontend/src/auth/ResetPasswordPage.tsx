import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Globe, Loader2, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../store/authStore'

const MIN_PASSWORD_LENGTH = 6

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && isMounted) {
        setHasRecoverySession(true)
        setIsCheckingSession(false)
      }
    })

    // The recovery token in the URL is auto-consumed by the client on load,
    // so an existing session here means the user arrived via a valid link.
    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }
      if (data.session) {
        setHasRecoverySession(true)
      }
      setIsCheckingSession(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(
        t('validation.minLength', { min: MIN_PASSWORD_LENGTH, current: newPassword.length }),
      )
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'))
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        throw error
      }
      toast.success(t('auth.passwordUpdated'))
      navigate({ to: '/login' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.invalidCredentials'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-card p-4 sm:p-6 lg:p-8 shadow-xl">
          {/* Logo and title */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Globe className="size-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t('auth.resetPasswordTitle')}</h1>
          </div>

          {isCheckingSession ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasRecoverySession ? (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
              {/* New password field */}
              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="block text-sm sm:text-base font-medium text-foreground text-start"
                >
                  {t('auth.newPassword')}
                  <span className="text-destructive ms-1" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    aria-required="true"
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    className="w-full min-h-11 sm:min-h-10 md:min-h-12 text-sm sm:text-base px-4 ps-12 pe-12 py-2 border border-input rounded-lg focus:ring-2 focus:border-transparent focus:ring-ring bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm focus:shadow-md"
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
              </div>

              {/* Confirm password field */}
              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="block text-sm sm:text-base font-medium text-foreground text-start"
                >
                  {t('auth.confirmPassword')}
                  <span className="text-destructive ms-1" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    aria-required="true"
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    className="w-full min-h-11 sm:min-h-10 md:min-h-12 text-sm sm:text-base px-4 ps-12 pe-4 py-2 border border-input rounded-lg focus:ring-2 focus:border-transparent focus:ring-ring bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm focus:shadow-md"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-11 sm:min-h-10 md:min-h-12 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="me-2 size-5 animate-spin" />
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.updatePassword')
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <p className="text-muted-foreground">{t('auth.resetLinkInvalid')}</p>
              <button
                type="button"
                onClick={() => navigate({ to: '/login' })}
                className="w-full min-h-11 sm:min-h-10 md:min-h-12 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          © 2025 GASTAT - General Authority for Statistics
        </p>
      </div>
    </div>
  )
}
