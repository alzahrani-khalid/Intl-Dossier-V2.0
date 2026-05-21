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
import { useDirection } from '@/hooks/useDirection'

interface DelegationExpiryBannerProps {
  className?: string
}

export function DelegationExpiryBanner({ className }: DelegationExpiryBannerProps) {
  const { t } = useTranslation('delegation')
  const { isRTL } = useDirection()
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
      className={`border-warning/50 bg-warning/5 dark:bg-warning/20 ${className}`}
    >
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="flex items-center gap-2 text-warning">
        <Clock className="h-4 w-4" />
        {t('notification.expiringTitle')}
        <Badge variant="outline" className="ms-2 text-warning border-warning">
          {count}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-warning">
          {count === 1
            ? t('notification.expiringDescriptionSingle')
            : t('notification.expiringDescription', { count })}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className={`min-h-9 border-warning/50 hover:bg-warning/10 dark:hover:bg-warning/30 ${
              isRTL ? 'flex-row-reverse' : ''
            }`}
          >
            <Link to="/delegations">
              {t('notification.viewAll')}
              <ChevronRight className={`h-4 w-4 ${isRTL ? 'me-1 rotate-180' : 'ms-1'}`} />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 text-warning hover:text-warning hover:bg-warning/10 dark:hover:bg-warning/30"
            aria-label={t('notification.dismiss')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
