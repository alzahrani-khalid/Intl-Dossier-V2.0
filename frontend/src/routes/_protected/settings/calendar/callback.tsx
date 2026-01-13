/**
 * OAuth Callback Route for Calendar Sync
 * Handles the OAuth redirect from external calendar providers
 */

import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCompleteOAuthCallback } from '@/hooks/useCalendarSync'
import type { ExternalCalendarProvider } from '@/types/calendar-sync.types'

interface CallbackSearch {
  code?: string
  state?: string
  error?: string
  error_description?: string
}

export const Route = createFileRoute('/_protected/settings/calendar/callback')({
  component: CalendarOAuthCallback,
  validateSearch: (search: Record<string, unknown>): CallbackSearch => {
    return {
      code: search.code as string | undefined,
      state: search.state as string | undefined,
      error: search.error as string | undefined,
      error_description: search.error_description as string | undefined,
    }
  },
})

function CalendarOAuthCallback() {
  const { t, i18n } = useTranslation('calendar-sync')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const completeOAuth = useCompleteOAuthCallback()

  useEffect(() => {
    async function handleCallback() {
      // Check for OAuth errors
      if (search.error) {
        setStatus('error')
        setErrorMessage(search.error_description || search.error)
        return
      }

      // Validate required parameters
      if (!search.code || !search.state) {
        setStatus('error')
        setErrorMessage('Missing authorization code or state')
        return
      }

      try {
        // Get provider from localStorage (set during OAuth initiation)
        const storedState = localStorage.getItem('calendar_oauth_state')
        const storedProvider = localStorage.getItem('calendar_oauth_provider')

        if (!storedState || storedState !== search.state) {
          throw new Error('Invalid state token - possible CSRF attack')
        }

        if (!storedProvider) {
          throw new Error('Provider information missing')
        }

        const provider = storedProvider as ExternalCalendarProvider

        // Complete OAuth flow
        await completeOAuth.mutateAsync({
          provider,
          code: search.code,
          state: search.state,
          redirectUri: `${window.location.origin}/settings/calendar/callback`,
        })

        // Clear stored state
        localStorage.removeItem('calendar_oauth_state')
        localStorage.removeItem('calendar_oauth_provider')

        setStatus('success')

        // Redirect to settings page after a short delay
        setTimeout(() => {
          navigate({ to: '/settings/calendar-sync' })
        }, 2000)
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error occurred')
      }
    }

    handleCallback()
  }, [search, completeOAuth, navigate])

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center min-h-[60vh]"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <h2 className="text-xl font-semibold">{t('oauth.connecting')}</h2>
              <p className="text-muted-foreground">{t('oauth.pleaseWait')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold text-green-600">{t('oauth.success')}</h2>
              <p className="text-muted-foreground">{t('oauth.redirecting')}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="text-xl font-semibold text-destructive">{t('oauth.error')}</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/settings/calendar-sync' })}
                className="mt-4"
              >
                {t('oauth.backToSettings')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
