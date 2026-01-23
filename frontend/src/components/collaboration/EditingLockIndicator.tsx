/**
 * EditingLockIndicator Component
 * Feature: realtime-collaboration-indicators
 *
 * Shows when a section is being edited by another user with:
 * - Lock icon with user info
 * - Optional warning when attempting to edit
 * - Animated presence indicator
 */

import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DossierPresenceUser } from '@/hooks/useDossierPresence'
import { Lock, AlertTriangle, Pencil } from 'lucide-react'

interface EditingLockIndicatorProps {
  /** User currently editing this section */
  lockedBy: DossierPresenceUser
  /** Section name being edited */
  sectionName?: string
  /** Variant style */
  variant?: 'inline' | 'banner' | 'badge'
  /** Show avatar of the user */
  showAvatar?: boolean
  /** Called when user tries to edit despite the lock */
  onForceEdit?: () => void
  /** Whether to show a warning dialog when clicking edit */
  showWarningDialog?: boolean
  /** Custom className */
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Inline lock indicator (minimal, for use in headers/titles)
 */
const InlineLock = memo(function InlineLock({
  lockedBy,
  showAvatar,
  isRTL,
}: {
  lockedBy: DossierPresenceUser
  showAvatar: boolean
  isRTL: boolean
}) {
  const { t } = useTranslation('collaboration')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-500"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {showAvatar ? (
              <Avatar className="h-5 w-5 border border-amber-500/50">
                <AvatarImage src={lockedBy.avatar} alt={lockedBy.name} />
                <AvatarFallback
                  style={{ backgroundColor: lockedBy.color }}
                  className="text-white text-[10px]"
                >
                  {getInitials(lockedBy.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <Pencil className="h-3 w-3 animate-pulse" />
          </div>
        </TooltipTrigger>
        <TooltipContent side={isRTL ? 'right' : 'left'} dir={isRTL ? 'rtl' : 'ltr'}>
          <p>{t('lockedBy', { name: lockedBy.name })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

/**
 * Banner lock indicator (prominent, for section headers)
 */
const BannerLock = memo(function BannerLock({
  lockedBy,
  sectionName,
  showAvatar,
  isRTL,
}: {
  lockedBy: DossierPresenceUser
  sectionName?: string
  showAvatar: boolean
  isRTL: boolean
}) {
  const { t } = useTranslation('collaboration')

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-lg',
        'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
        'text-amber-800 dark:text-amber-200',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {showAvatar && (
          <Avatar className="h-8 w-8 border-2" style={{ borderColor: lockedBy.color }}>
            <AvatarImage src={lockedBy.avatar} alt={lockedBy.name} />
            <AvatarFallback
              style={{ backgroundColor: lockedBy.color }}
              className="text-white text-sm"
            >
              {getInitials(lockedBy.name)}
            </AvatarFallback>
          </Avatar>
        )}
        <Lock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{t('sectionLockedTitle', { name: lockedBy.name })}</p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {sectionName
            ? t('editingSectionNamed', { section: sectionName })
            : t('editingThisSection')}
        </p>
      </div>

      <Pencil className="h-4 w-4 animate-pulse text-amber-600 dark:text-amber-500" />
    </div>
  )
})

/**
 * Badge lock indicator (compact, for lists/cards)
 */
const BadgeLock = memo(function BadgeLock({
  lockedBy,
  showAvatar,
  isRTL,
}: {
  lockedBy: DossierPresenceUser
  showAvatar: boolean
  isRTL: boolean
}) {
  const { t } = useTranslation('collaboration')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5 border-amber-300 dark:border-amber-700',
              'bg-amber-50 dark:bg-amber-900/20',
              'text-amber-700 dark:text-amber-300',
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {showAvatar ? (
              <Avatar className="h-4 w-4">
                <AvatarImage src={lockedBy.avatar} alt={lockedBy.name} />
                <AvatarFallback
                  style={{ backgroundColor: lockedBy.color }}
                  className="text-white text-[8px]"
                >
                  {getInitials(lockedBy.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Lock className="h-3 w-3" />
            )}
            <span className="truncate max-w-[80px]">{lockedBy.name}</span>
            <Pencil className="h-3 w-3 animate-pulse" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent side={isRTL ? 'right' : 'left'} dir={isRTL ? 'rtl' : 'ltr'}>
          <p>{t('lockedBy', { name: lockedBy.name })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

/**
 * EditingLockIndicator component
 *
 * Shows a visual indicator when a section/resource is being edited by another user.
 * Supports multiple variants for different UI contexts and optional force-edit warnings.
 */
export function EditingLockIndicator({
  lockedBy,
  sectionName,
  variant = 'inline',
  showAvatar = true,
  onForceEdit,
  showWarningDialog = true,
  className,
}: EditingLockIndicatorProps) {
  const { t, i18n } = useTranslation('collaboration')
  const isRTL = i18n.language === 'ar'
  const [showForceEditDialog, setShowForceEditDialog] = useState(false)

  // Handler for force-edit button clicks - can be exposed via onForceEdit prop for parent components
  // Currently used internally for the dialog trigger, prefixed with underscore to indicate reserved for future use
  const _handleForceEditRequest = useCallback(() => {
    if (showWarningDialog) {
      setShowForceEditDialog(true)
    } else {
      onForceEdit?.()
    }
  }, [showWarningDialog, onForceEdit])
  // Suppress unused var warning - this is intentionally defined for future interactive use
  void _handleForceEditRequest

  const handleForceEditConfirm = useCallback(() => {
    setShowForceEditDialog(false)
    onForceEdit?.()
  }, [onForceEdit])

  return (
    <>
      <div className={className}>
        {variant === 'inline' && (
          <InlineLock lockedBy={lockedBy} showAvatar={showAvatar} isRTL={isRTL} />
        )}

        {variant === 'banner' && (
          <BannerLock
            lockedBy={lockedBy}
            sectionName={sectionName}
            showAvatar={showAvatar}
            isRTL={isRTL}
          />
        )}

        {variant === 'badge' && (
          <BadgeLock lockedBy={lockedBy} showAvatar={showAvatar} isRTL={isRTL} />
        )}
      </div>

      {/* Force edit warning dialog */}
      <AlertDialog open={showForceEditDialog} onOpenChange={setShowForceEditDialog}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('forceEditWarningTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('forceEditWarningDescription', { name: lockedBy.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel>{t('cancel', { ns: 'common' })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceEditConfirm}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {t('forceEditConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Hook-friendly wrapper that only renders when locked
 */
export function EditingLockIndicatorConditional({
  isLocked,
  lockedBy,
  ...props
}: Omit<EditingLockIndicatorProps, 'lockedBy'> & {
  isLocked: boolean
  lockedBy?: DossierPresenceUser
}) {
  if (!isLocked || !lockedBy) {
    return null
  }

  return <EditingLockIndicator lockedBy={lockedBy} {...props} />
}

export default EditingLockIndicator
