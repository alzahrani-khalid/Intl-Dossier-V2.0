/**
 * Access Denied Card Component
 *
 * Displays when user doesn't have clearance to access a document.
 * Mobile-first with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { ShieldX, Lock, UserX, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClassificationBadge } from './ClassificationBadge'
import type { DocumentClassification } from '@/types/document-classification.types'

interface AccessDeniedCardProps {
  documentName?: string
  requiredClassification: DocumentClassification
  userClearance: number
  reason?: string
  onRequestAccess?: () => void
  className?: string
}

export function AccessDeniedCard({
  documentName,
  requiredClassification,
  userClearance,
  reason,
  onRequestAccess,
  className = '',
}: AccessDeniedCardProps) {
  const { t, i18n } = useTranslation('document-classification')
  const isRTL = i18n.language === 'ar'

  return (
    <Card
      className={`border-destructive/50 bg-destructive/5 ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg text-destructive">
              {t('accessDenied.title', 'Access Denied')}
            </CardTitle>
            <CardDescription>
              {t('accessDenied.subtitle', 'Insufficient clearance level')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {documentName && (
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-sm font-medium">{documentName}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t('accessDenied.requiredClearance', 'Required Clearance')}
            </p>
            <ClassificationBadge classification={requiredClassification} showTooltip={false} />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t('accessDenied.yourClearance', 'Your Clearance')}
            </p>
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {t(`clearanceLevels.${userClearance}`, `Level ${userClearance}`)}
              </span>
            </div>
          </div>
        </div>

        {reason && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{reason}</p>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {t(
            'accessDenied.description',
            'You do not have the required clearance level to access this document. Contact your administrator if you believe you should have access.',
          )}
        </p>

        {onRequestAccess && (
          <Button variant="outline" onClick={onRequestAccess} className="w-full sm:w-auto">
            <Lock className="h-4 w-4 me-2" />
            {t('accessDenied.requestAccess', 'Request Access')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default AccessDeniedCard
