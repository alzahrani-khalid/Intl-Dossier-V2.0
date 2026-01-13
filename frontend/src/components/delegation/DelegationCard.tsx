/**
 * DelegationCard Component
 * Displays a single delegation item with status, dates, and actions
 *
 * Feature: delegation-management
 */

import { useTranslation } from 'react-i18next'
import { format, differenceInDays, isPast, isFuture } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowRight, Calendar, Clock, XCircle, AlertTriangle, User, FileText } from 'lucide-react'
import type { Delegation } from '@/services/user-management-api'

interface DelegationCardProps {
  delegation: Delegation
  type: 'granted' | 'received'
  onRevoke?: (delegationId: string) => void
  isRevoking?: boolean
}

export function DelegationCard({
  delegation,
  type,
  onRevoke,
  isRevoking = false,
}: DelegationCardProps) {
  const { t, i18n } = useTranslation('delegation')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  // Calculate status and expiry info
  const now = new Date()
  const expiresAt = new Date(delegation.valid_until)
  const startsAt = new Date(delegation.valid_from)
  const daysUntilExpiry = differenceInDays(expiresAt, now)
  const isExpired = isPast(expiresAt)
  const isNotStarted = isFuture(startsAt)
  const isRevoked = !!delegation.revoked_at
  const isExpiringSoon = !isExpired && !isRevoked && daysUntilExpiry <= 7

  // Determine badge status
  const getStatus = () => {
    if (isRevoked) return { label: t('badge.revoked'), variant: 'destructive' as const }
    if (isExpired) return { label: t('badge.expired'), variant: 'secondary' as const }
    if (isExpiringSoon) return { label: t('badge.expiringSoon'), variant: 'outline' as const }
    return { label: t('badge.active'), variant: 'default' as const }
  }

  const status = getStatus()

  // Get expiry text
  const getExpiryText = () => {
    if (isExpired) {
      const daysAgo = Math.abs(daysUntilExpiry)
      return t('card.expired', { days: daysAgo })
    }
    if (daysUntilExpiry === 0) return t('card.expiresToday')
    if (daysUntilExpiry === 1) return t('card.expiresTomorrow')
    return t('card.expiresIn', { days: daysUntilExpiry })
  }

  // Get initials for avatar
  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split(/[._-]/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  const displayUser = type === 'granted' ? delegation.grantee_email : delegation.grantor_email

  return (
    <Card
      className={`transition-all ${isRevoked || isExpired ? 'opacity-60' : ''} ${
        isExpiringSoon ? 'border-yellow-500/50' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(displayUser)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {type === 'granted' ? t('card.to') : t('card.from')}
                </span>
                <ArrowRight
                  className={`h-3 w-3 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`}
                />
              </div>
              <p className="font-medium truncate">{displayUser}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} className="min-h-6">
              {status.label}
            </Badge>
            {isExpiringSoon && !isRevoked && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{t('card.validFrom')}:</span>
            <span className="font-medium">{format(startsAt, 'PP', { locale: dateLocale })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{t('card.validUntil')}:</span>
            <span className="font-medium">{format(expiresAt, 'PP', { locale: dateLocale })}</span>
          </div>
        </div>

        {/* Expiry indicator */}
        {!isRevoked && (
          <div
            className={`flex items-center gap-2 text-sm ${
              isExpired
                ? 'text-destructive'
                : isExpiringSoon
                  ? 'text-yellow-600 dark:text-yellow-500'
                  : 'text-muted-foreground'
            }`}
          >
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{getExpiryText()}</span>
          </div>
        )}

        {/* Reason */}
        {delegation.reason && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground">{t('card.reason')}: </span>
              <span>{delegation.reason}</span>
            </div>
          </div>
        )}

        {/* Resource scope */}
        {(delegation.resource_type || delegation.resource_id) && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{t('card.resourceType')}: </span>
            <Badge variant="outline" className="text-xs">
              {delegation.resource_type
                ? t(`resourceTypes.${delegation.resource_type}`)
                : t('card.allResources')}
            </Badge>
          </div>
        )}

        {/* Revocation info */}
        {isRevoked && delegation.revoked_at && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span>{t('card.revokedAt')}: </span>
              <span className="font-medium">
                {format(new Date(delegation.revoked_at), 'PP', { locale: dateLocale })}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {type === 'granted' && !isRevoked && !isExpired && onRevoke && (
          <div className="pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRevoke(delegation.id)}
              disabled={isRevoking}
              className={`w-full sm:w-auto min-h-9 text-destructive hover:text-destructive ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <XCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {isRevoking ? t('common:common.loading') : t('actions.revoke')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
