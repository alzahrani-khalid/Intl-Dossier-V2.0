/**
 * PermissionDeniedDialog Component
 * Dialog that displays permission denied errors with actionable guidance
 * and a request access form
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import {
  ShieldX,
  User,
  Mail,
  Send,
  X,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type {
  PermissionDeniedDialogProps,
  AccessGranter,
  PermissionDeniedError,
} from '@/types/permission-error.types'

// =============================================================================
// URGENCY BADGE STYLES
// =============================================================================

const urgencyStyles = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

// =============================================================================
// ACCESS GRANTER CARD
// =============================================================================

interface GranterCardProps {
  granter: AccessGranter
  isSelected: boolean
  onSelect: () => void
  isRTL: boolean
}

function GranterCard({ granter, isSelected, onSelect, isRTL }: GranterCardProps) {
  const { t } = useTranslation('permission-errors')

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'w-full p-3 sm:p-4 rounded-lg border text-start transition-all',
        'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
        isSelected ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-border bg-card',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {granter.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm sm:text-base truncate">{granter.name}</span>
            {granter.isPrimary && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {t('accessGranters.primaryContact')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-0.5">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{granter.email}</span>
          </div>
        </div>

        <ChevronRight
          className={cn(
            'h-5 w-5 text-muted-foreground shrink-0 transition-transform',
            isSelected && 'text-primary',
            isRTL && 'rotate-180',
          )}
        />
      </div>
    </motion.button>
  )
}

// =============================================================================
// REQUEST FORM
// =============================================================================

interface RequestFormProps {
  granter: AccessGranter
  error: PermissionDeniedError
  onSubmit: (
    reason: string,
    urgency: 'low' | 'medium' | 'high' | 'critical',
    duration?: number,
  ) => Promise<void>
  onCancel: () => void
  isRTL: boolean
}

function RequestForm({ granter, error, onSubmit, onCancel, isRTL }: RequestFormProps) {
  const { t } = useTranslation('permission-errors')
  const [reason, setReason] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [duration, setDuration] = useState<string>('permanent')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!reason.trim()) return

      setIsSubmitting(true)
      try {
        const durationDays = duration === 'permanent' ? undefined : parseInt(duration, 10)
        await onSubmit(reason.trim(), urgency, durationDays)
        setIsSuccess(true)
      } catch {
        // Error handling is done in parent
      } finally {
        setIsSubmitting(false)
      }
    },
    [reason, urgency, duration, onSubmit],
  )

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{t('requestAccess.success.title')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('requestAccess.success.message', { name: granter.name })}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {granter.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{granter.name}</p>
          <p className="text-xs text-muted-foreground">{granter.email}</p>
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason">{t('requestAccess.form.reason')}</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('requestAccess.form.reasonPlaceholder')}
          className="min-h-[100px] resize-none"
          required
        />
        <p className="text-xs text-muted-foreground">{t('requestAccess.form.reasonHelp')}</p>
      </div>

      {/* Urgency */}
      <div className="space-y-2">
        <Label htmlFor="urgency">{t('requestAccess.form.urgency')}</Label>
        <Select value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)}>
          <SelectTrigger id="urgency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', 'bg-slate-400')} />
                {t('requestAccess.form.urgencyOptions.low')}
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', 'bg-blue-500')} />
                {t('requestAccess.form.urgencyOptions.medium')}
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', 'bg-amber-500')} />
                {t('requestAccess.form.urgencyOptions.high')}
              </div>
            </SelectItem>
            <SelectItem value="critical">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', 'bg-red-500')} />
                {t('requestAccess.form.urgencyOptions.critical')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label htmlFor="duration">{t('requestAccess.form.duration')}</Label>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger id="duration">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="permanent">
              {t('requestAccess.form.durationOptions.permanent')}
            </SelectItem>
            <SelectItem value="7">{t('requestAccess.form.durationOptions.7')}</SelectItem>
            <SelectItem value="14">{t('requestAccess.form.durationOptions.14')}</SelectItem>
            <SelectItem value="30">{t('requestAccess.form.durationOptions.30')}</SelectItem>
            <SelectItem value="90">{t('requestAccess.form.durationOptions.90')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t('requestAccess.form.durationHelp')}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 sm:flex-none"
          disabled={isSubmitting}
        >
          {t('requestAccess.cancel')}
        </Button>
        <Button type="submit" className="flex-1 gap-2" disabled={!reason.trim() || isSubmitting}>
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Clock className="h-4 w-4" />
              </motion.div>
              {t('requestAccess.submitting')}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {t('requestAccess.submit')}
            </>
          )}
        </Button>
      </div>
    </motion.form>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PermissionDeniedDialog({
  open,
  onClose,
  error,
  onRequestAccess,
  showRequestForm = true,
  className,
}: PermissionDeniedDialogProps) {
  const { t, i18n } = useTranslation('permission-errors')
  const isRTL = i18n.language === 'ar'

  const [selectedGranter, setSelectedGranter] = useState<AccessGranter | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleGranterSelect = useCallback(
    (granter: AccessGranter) => {
      setSelectedGranter(granter)
      if (showRequestForm) {
        setShowForm(true)
      }
    },
    [showRequestForm],
  )

  const handleFormSubmit = useCallback(
    async (reason: string, urgency: 'low' | 'medium' | 'high' | 'critical', duration?: number) => {
      if (!selectedGranter || !onRequestAccess) return
      await onRequestAccess(selectedGranter, reason)
    },
    [selectedGranter, onRequestAccess],
  )

  const handleFormCancel = useCallback(() => {
    setShowForm(false)
    setSelectedGranter(null)
  }, [])

  const handleClose = useCallback(() => {
    setShowForm(false)
    setSelectedGranter(null)
    onClose()
  }, [onClose])

  const copyRequestLink = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('request_access', 'true')
    url.searchParams.set('resource', error.resourceType)
    if (error.resourceId) {
      url.searchParams.set('resource_id', error.resourceId)
    }
    navigator.clipboard.writeText(url.toString())
  }, [error.resourceType, error.resourceId])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn('max-w-md sm:max-w-lg overflow-hidden', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="text-start">
          <div className="flex items-start gap-3">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50">
              <ShieldX className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold">{t('title')}</DialogTitle>
              <DialogDescription className="mt-1 text-sm">
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
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {showForm && selectedGranter ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              <RequestForm
                granter={selectedGranter}
                error={error}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isRTL={isRTL}
              />
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Reason explanation */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {t(`reasons.${error.reason}`, {
                      role: t(`roles.${error.currentRole}`),
                    })}
                  </p>
                  {error.requiredRole && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      {t('message.roleRequired', {
                        requiredRole: t(`roles.${error.requiredRole}`),
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Current role badge */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t('message.currentRole', {
                    currentRole: t(`roles.${error.currentRole}`),
                  })}
                </span>
              </div>

              <Separator />

              {/* Access granters */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">{t('accessGranters.title')}</h4>
                <p className="text-xs text-muted-foreground">{t('accessGranters.subtitle')}</p>

                {error.accessGranters.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {error.accessGranters.map((granter) => (
                      <GranterCard
                        key={granter.userId}
                        granter={granter}
                        isSelected={selectedGranter?.userId === granter.userId}
                        onSelect={() => handleGranterSelect(granter)}
                        isRTL={isRTL}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {t('accessGranters.noGrantersAvailable')}
                  </p>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={copyRequestLink} className="gap-1.5">
                  <Copy className="h-3.5 w-3.5" />
                  {t('actions.copyRequestLink')}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href="/settings/permissions" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('actions.viewPermissions')}
                  </a>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {!showForm && (
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={handleClose}>
              {t('dialog.understand')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PermissionDeniedDialog
