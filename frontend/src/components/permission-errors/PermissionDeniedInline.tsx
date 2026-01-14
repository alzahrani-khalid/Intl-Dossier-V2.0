/**
 * PermissionDeniedInline Component
 * Compact inline display for permission denied errors
 * Used within pages to show access denied messages with quick actions
 */

import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { ShieldX, ChevronRight, Mail, X, Send, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { PermissionDeniedInlineProps, AccessGranter } from '@/types/permission-error.types'

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PermissionDeniedInline({
  error,
  compact = false,
  onRequestAccess,
  onDismiss,
  className,
}: PermissionDeniedInlineProps) {
  const { t, i18n } = useTranslation('permission-errors')
  const isRTL = i18n.language === 'ar'

  // Get the primary granter or first available
  const primaryGranter = error.accessGranters.find((g) => g.isPrimary) || error.accessGranters[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        'rounded-lg border border-red-200 dark:border-red-800',
        'bg-red-50 dark:bg-red-950/30',
        compact ? 'p-3' : 'p-4',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'shrink-0 flex items-center justify-center rounded-full',
            'bg-red-100 dark:bg-red-900/50',
            compact ? 'w-8 h-8' : 'w-10 h-10',
          )}
        >
          <ShieldX
            className={cn('text-red-600 dark:text-red-400', compact ? 'h-4 w-4' : 'h-5 w-5')}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4
            className={cn(
              'font-medium text-red-800 dark:text-red-200',
              compact ? 'text-sm' : 'text-base',
            )}
          >
            {t('inline.accessDenied')}
          </h4>

          {/* Description */}
          {!compact && (
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error.resourceName
                ? t('message.withName', {
                    permission: t(`permissions.${error.requiredPermission}`),
                    action: t(`permissions.${error.requiredPermission}`),
                    resourceName: error.resourceName,
                  })
                : t('message.generic', {
                    permission: t(`permissions.${error.requiredPermission}`),
                    action: t(`permissions.${error.requiredPermission}`),
                    resource: t(`resources.${error.resourceType}`),
                  })}
            </p>
          )}

          {/* Reason badge */}
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="secondary"
              className={cn(
                'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
                compact && 'text-xs',
              )}
            >
              {t('inline.needPermission', {
                permission: t(`permissions.${error.requiredPermission}`),
              })}
            </Badge>
          </div>

          {/* Actions */}
          <div className={cn('flex flex-wrap gap-2', compact ? 'mt-2' : 'mt-3')}>
            {primaryGranter && onRequestAccess && (
              <Button
                size={compact ? 'sm' : 'default'}
                onClick={() => onRequestAccess(primaryGranter)}
                className={cn(
                  'gap-2',
                  'bg-red-600 hover:bg-red-700 text-white',
                  compact && 'h-8 px-3 text-xs',
                )}
              >
                <Send className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                <span className={compact ? 'hidden sm:inline' : ''}>
                  {t('inline.requestAccess', { name: primaryGranter.name })}
                </span>
                <span className={compact ? 'inline sm:hidden' : 'hidden'}>
                  {t('actions.requestAccess')}
                </span>
              </Button>
            )}

            {!compact && error.accessGranters.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
              >
                +{error.accessGranters.length - 1} {t('accessGranters.title').toLowerCase()}
                <ChevronRight className={cn('h-3 w-3', isRTL && 'rotate-180')} />
              </Button>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className={cn(
              'shrink-0 text-red-600 dark:text-red-400',
              'hover:bg-red-100 dark:hover:bg-red-900',
              compact ? 'h-7 w-7' : 'h-8 w-8',
            )}
            aria-label={t('actions.dismiss')}
          >
            <X className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </Button>
        )}
      </div>

      {/* Granter info (non-compact mode) */}
      {!compact && primaryGranter && (
        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 mb-2">
            {t('inline.contactForHelp', { name: primaryGranter.name })}
          </p>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                {primaryGranter.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-300">
              <Mail className="h-3 w-3" />
              <span>{primaryGranter.email}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// =============================================================================
// BADGE VARIANT
// =============================================================================

interface PermissionBadgeProps {
  error: {
    requiredPermission: string
    resourceType: string
  }
  onClick?: () => void
  className?: string
}

export function PermissionDeniedBadge({ error, onClick, className }: PermissionBadgeProps) {
  const { t, i18n } = useTranslation('permission-errors')
  const isRTL = i18n.language === 'ar'

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
        'text-xs font-medium cursor-pointer',
        'hover:bg-red-200 dark:hover:bg-red-800 transition-colors',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ShieldX className="h-3 w-3" />
      {t('badge.noAccess')}
      {onClick && <ChevronRight className={cn('h-3 w-3', isRTL && 'rotate-180')} />}
    </motion.button>
  )
}

// =============================================================================
// PENDING REQUEST INDICATOR
// =============================================================================

interface PendingRequestIndicatorProps {
  requestId: string
  granterName: string
  className?: string
}

export function PendingRequestIndicator({
  requestId,
  granterName,
  className,
}: PendingRequestIndicatorProps) {
  const { t, i18n } = useTranslation('permission-errors')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800',
        'text-amber-700 dark:text-amber-300 text-sm',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Clock className="h-4 w-4 animate-pulse" />
      <span>{t('inline.pendingRequest')}</span>
      <Badge variant="outline" className="text-xs">
        {granterName}
      </Badge>
    </div>
  )
}

export default PermissionDeniedInline
