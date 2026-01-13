/**
 * Redacted Field Component
 *
 * Displays a redacted field indicator with classification info.
 * Mobile-first with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { EyeOff, Lock, ShieldAlert } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { DocumentClassification } from '@/types/document-classification.types'
import { CLASSIFICATION_COLORS } from '@/types/document-classification.types'

interface RedactedFieldProps {
  fieldName?: string
  requiredClearance?: DocumentClassification
  redactedText?: string
  showTooltip?: boolean
  className?: string
}

export function RedactedField({
  fieldName,
  requiredClearance = 'confidential',
  redactedText = '[REDACTED]',
  showTooltip = true,
  className = '',
}: RedactedFieldProps) {
  const { t, i18n } = useTranslation('document-classification')
  const isRTL = i18n.language === 'ar'

  const colors = CLASSIFICATION_COLORS[requiredClearance]

  const content = (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${colors.bg} ${colors.text} ${colors.border}
        border rounded px-2 py-0.5
        text-xs sm:text-sm font-mono
        ${className}
      `}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
      <span>{redactedText}</span>
    </span>
  )

  if (!showTooltip) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent
        side={isRTL ? 'left' : 'right'}
        className="max-w-[250px]"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <span className="font-medium">
              {t('redacted.accessRestricted', 'Access Restricted')}
            </span>
          </div>
          {fieldName && (
            <p className="text-xs text-muted-foreground">
              {t('redacted.fieldName', 'Field')}: {fieldName}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('redacted.requiresClearance', 'Requires {{level}} clearance or higher', {
              level: t(`levels.${requiredClearance}`, requiredClearance),
            })}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default RedactedField
