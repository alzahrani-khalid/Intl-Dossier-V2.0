/**
 * DelegationExpiryBanner Component
 * Shows a notification banner when delegations are expiring soon
 *
 * Feature: delegation-management
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, AlertTriangle, ChevronRight, Clock } from 'lucide-react'
import { useDelegationsExpiringSoon } from '@/hooks/useDelegation'

interface DelegationExpiryBannerProps {
  className?: string
}

export function DelegationExpiryBanner({ className }: DelegationExpiryBannerProps) {
  const { t, i18n } = useTranslation('delegation')
  const isRTL = i18n.language === 'ar'

  const [isDismissed, setIsDismissed] = useState(false)

  const { data: expiringSoon, isLoading } = useDelegationsExpiringSoon()

  // Don't show if loading, dismissed, or no expiring delegations
  if (isLoading || isDismissed || !expiringSoon || expiringSoon.total === 0) {
    return null
  }

  const count = expiringSoon.total

  return (
    <Alert
      variant="default"
      className={`border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20 ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <AlertTriangle className="size-4 text-yellow-600" />
      <AlertTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
        <Clock className="size-4" />
        {t('notification.expiringTitle')}
        <Badge variant="outline" className="ms-2 border-yellow-600 text-yellow-700">
          {count}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-yellow-700 dark:text-yellow-300">
          {count === 1
            ? t('notification.expiringDescriptionSingle')
            : t('notification.expiringDescription', { count })}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className={`min-h-9 border-yellow-600/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 ${
              isRTL ? 'flex-row-reverse' : ''
            }`}
          >
            <Link to="/delegations">
              {t('notification.viewAll')}
              <ChevronRight className={`size-4 ${isRTL ? 'me-1 rotate-180' : 'ms-1'}`} />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            className="size-8 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800 dark:hover:bg-yellow-900/30"
            aria-label={t('notification.dismiss')}
          >
            <X className="size-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
