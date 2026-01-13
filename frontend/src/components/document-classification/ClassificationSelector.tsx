/**
 * Classification Selector Component
 *
 * Dropdown selector for document classification levels.
 * Mobile-first with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Globe, Building, Lock, ShieldAlert, ChevronDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { DocumentClassification } from '@/types/document-classification.types'
import {
  CLASSIFICATION_COLORS,
  CLASSIFICATION_LEVELS,
  canAccessClassification,
} from '@/types/document-classification.types'

interface ClassificationSelectorProps {
  value: DocumentClassification
  onChange: (value: DocumentClassification) => void
  userClearance?: number
  disabled?: boolean
  showLabel?: boolean
  label?: string
  className?: string
}

const classificationOptions: DocumentClassification[] = [
  'public',
  'internal',
  'confidential',
  'secret',
]

const ClassificationIcon = ({ classification }: { classification: DocumentClassification }) => {
  const iconClass = 'h-4 w-4'

  switch (classification) {
    case 'public':
      return <Globe className={iconClass} />
    case 'internal':
      return <Building className={iconClass} />
    case 'confidential':
      return <Lock className={iconClass} />
    case 'secret':
      return <ShieldAlert className={iconClass} />
    default:
      return <Globe className={iconClass} />
  }
}

export function ClassificationSelector({
  value,
  onChange,
  userClearance = 3,
  disabled = false,
  showLabel = true,
  label,
  className = '',
}: ClassificationSelectorProps) {
  const { t, i18n } = useTranslation('document-classification')
  const isRTL = i18n.language === 'ar'

  // Filter options based on user clearance
  const availableOptions = classificationOptions.filter((opt) =>
    canAccessClassification(userClearance, opt),
  )

  return (
    <div className={`space-y-2 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {showLabel && (
        <Label className="text-sm font-medium">
          {label || t('selector.label', 'Classification Level')}
        </Label>
      )}
      <Select
        value={value}
        onValueChange={(newValue) => onChange(newValue as DocumentClassification)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full min-h-11 sm:min-h-10">
          <SelectValue placeholder={t('selector.placeholder', 'Select classification')}>
            <div className="flex items-center gap-2">
              <ClassificationIcon classification={value} />
              <span>{t(`levels.${value}`, value)}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent dir={isRTL ? 'rtl' : 'ltr'}>
          {availableOptions.map((option) => {
            const colors = CLASSIFICATION_COLORS[option]
            return (
              <SelectItem
                key={option}
                value={option}
                className={`flex items-center gap-2 min-h-10 ${colors.text}`}
              >
                <div className="flex items-center gap-2">
                  <ClassificationIcon classification={option} />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{t(`levels.${option}`, option)}</span>
                    <span className="text-xs text-muted-foreground">
                      {t(`shortDescriptions.${option}`, `Level ${CLASSIFICATION_LEVELS[option]}`)}
                    </span>
                  </div>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {t('selector.hint', 'Select the appropriate classification level for this document')}
      </p>
    </div>
  )
}

export default ClassificationSelector
