/**
 * Classification Badge Component
 *
 * Displays document classification level as a styled badge.
 * Mobile-first with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Globe, Building, Lock, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { DocumentClassification } from '@/types/document-classification.types'
import {
  CLASSIFICATION_COLORS,
  getClassificationDescription,
} from '@/types/document-classification.types'

interface ClassificationBadgeProps {
  classification: DocumentClassification
  showIcon?: boolean
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const ClassificationIcon = ({
  classification,
  size,
}: {
  classification: DocumentClassification
  size: 'sm' | 'md' | 'lg'
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const iconClass = sizeClasses[size]

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

export function ClassificationBadge({
  classification,
  showIcon = true,
  showTooltip = true,
  size = 'md',
  className = '',
}: ClassificationBadgeProps) {
  const { t, i18n } = useTranslation('document-classification')
  const isRTL = i18n.language === 'ar'

  const colors = CLASSIFICATION_COLORS[classification]
  const label = t(`levels.${classification}`, classification)
  const description = t(
    `descriptions.${classification}`,
    getClassificationDescription(classification),
  )

  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-xs py-1 px-2',
    lg: 'text-sm py-1.5 px-3',
  }

  const badgeContent = (
    <Badge
      variant="outline"
      className={`
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
        inline-flex items-center gap-1
        font-medium
        ${className}
      `}
    >
      {showIcon && <ClassificationIcon classification={classification} size={size} />}
      <span>{label}</span>
    </Badge>
  )

  if (!showTooltip) {
    return badgeContent
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
      <TooltipContent
        side={isRTL ? 'left' : 'right'}
        className="max-w-[250px] text-start"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default ClassificationBadge
