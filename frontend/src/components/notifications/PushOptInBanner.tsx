import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import { useDirection } from '@/hooks/useDirection'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'

interface PushOptInBannerProps {
  hasActionableNotification: boolean
}

/**
 * Contextual soft-ask banner for push notification opt-in.
 * Appears inside the notification panel after the user's first actionable notification.
 * Handles subscribe/dismiss flows, persists dismissal to database.
 */
export default function PushOptInBanner({
  hasActionableNotification,
}: PushOptInBannerProps): React.ReactElement | null {
  const { t } = useTranslation('push-notifications')
  const { isRTL } = useDirection()
  const { toast } = useToast()

  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    isLoading: isSubscribing,
  } = usePushSubscription()

  const [isDismissed, setIsDismissed] = useState<boolean | null>(null)
  const [isDismissLoading, setIsDismissLoading] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  // Fetch dismissal state from user_preferences
  useEffect(() => {
    let cancelled = false

    const fetchDismissalState = async (): Promise<void> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user == null || cancelled) return

        const { data, error } = await supabase
          .from('user_preferences')
          .select('push_prompt_dismissed_at')
          .eq('user_id', user.id)
          .maybeSingle()

        if (cancelled) return

        if (error != null) {
          console.error('Failed to fetch push dismissal state:', error)
          setIsDismissed(false)
          return
        }

        setIsDismissed(data?.push_prompt_dismissed_at != null)
      } catch {
        if (!cancelled) {
          setIsDismissed(false)
        }
      }
    }

    void fetchDismissalState()

    return (): void => {
      cancelled = true
    }
  }, [])

  const handleEnable = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      toast({
        title: t('toast.notSupported'),
        variant: 'destructive',
      })
      return
    }

    const success = await subscribe()

    if (success) {
      toast({ title: t('toast.enabled') })
      setIsHidden(true)
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      toast({
        title: t('toast.denied'),
        variant: 'destructive',
      })
      // Persist dismissal since user blocked notifications
      await persistDismissal()
      setIsHidden(true)
    } else {
      toast({
        title: t('toast.failed'),
        variant: 'destructive',
      })
    }
  }, [isSupported, subscribe, toast, t])

  const persistDismissal = async (): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user == null) return

      await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            push_prompt_dismissed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
    } catch {
      console.error('Failed to persist push dismissal')
    }
  }

  const handleDismiss = useCallback(async (): Promise<void> => {
    setIsDismissLoading(true)
    setIsHidden(true)

    await persistDismissal()
    setIsDismissLoading(false)
  }, [])

  // Visibility conditions (ALL must be true to show)
  const shouldShow =
    isSupported &&
    permission !== 'granted' &&
    !isSubscribed &&
    isDismissed === false &&
    hasActionableNotification &&
    !isHidden

  if (!shouldShow) {
    return null
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="bg-muted/50 border border-border rounded-lg p-4 mx-2 mt-2"
      data-testid="push-opt-in-banner"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Bell className="h-5 w-5 text-primary-600 shrink-0" aria-hidden="true" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {t('softAsk.headline')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('softAsk.body')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleEnable()}
            disabled={isSubscribing}
            className="h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm font-normal min-h-11 min-w-11 hover:bg-primary/90 disabled:opacity-50 transition-colors"
            data-testid="push-enable-btn"
          >
            {isSubscribing ? '...' : t('softAsk.enable')}
          </button>

          <button
            type="button"
            onClick={() => void handleDismiss()}
            disabled={isDismissLoading}
            className="text-xs text-muted-foreground hover:text-foreground min-h-11 min-w-11 px-2 transition-colors"
            aria-label={isRTL ? '\u0627\u063a\u0644\u0627\u0642 \u0637\u0644\u0628 \u0627\u0644\u0627\u0634\u0639\u0627\u0631\u0627\u062a' : 'Dismiss notification prompt'}
            data-testid="push-dismiss-btn"
          >
            {t('softAsk.dismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
