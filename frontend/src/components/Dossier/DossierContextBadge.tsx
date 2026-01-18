/**
 * DossierContextBadge Component
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 * Task: T038
 *
 * Visual badge showing dossier context with type icon and inheritance label.
 * Mobile-first, RTL support, multiple size variants.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DossierTypeIcon } from './DossierTypeIcon'
import type { DossierType } from '@/types/relationship.types'
import type { InheritanceSource } from '@/types/dossier-context.types'

// ============================================================================
// Types
// ============================================================================

export interface DossierContextBadgeProps {
  /**
   * The dossier ID.
   */
  dossierId: string
  /**
   * The dossier type.
   */
  dossierType: DossierType
  /**
   * English name of the dossier.
   */
  nameEn: string
  /**
   * Arabic name of the dossier (optional).
   */
  nameAr?: string | null
  /**
   * How this dossier was linked (direct or inherited).
   */
  inheritanceSource?: InheritanceSource
  /**
   * Whether this is the primary dossier.
   */
  isPrimary?: boolean
  /**
   * Size variant.
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg'
  /**
   * Whether to show the dossier type icon.
   * @default true
   */
  showIcon?: boolean
  /**
   * Whether to show the inheritance source label.
   * @default true when inherited
   */
  showInheritance?: boolean
  /**
   * Whether the badge is clickable (links to dossier).
   * @default true
   */
  clickable?: boolean
  /**
   * Additional CSS classes.
   */
  className?: string
}

// ============================================================================
// Size Classes
// ============================================================================

const sizeClasses = {
  sm: 'text-xs py-0.5 px-1.5',
  default: 'text-xs py-1 px-2',
  lg: 'text-sm py-1.5 px-3',
}

// ============================================================================
// Component
// ============================================================================

export function DossierContextBadge({
  dossierId,
  dossierType,
  nameEn,
  nameAr,
  inheritanceSource = 'direct',
  isPrimary = false,
  size = 'default',
  showIcon = true,
  showInheritance = true,
  clickable = true,
  className,
}: DossierContextBadgeProps) {
  const { t, i18n } = useTranslation('dossier-context')
  const isRTL = i18n.language === 'ar'

  // Get display name based on language
  const displayName = isRTL ? nameAr || nameEn : nameEn

  // Get inheritance label
  const getInheritanceLabel = () => {
    if (inheritanceSource === 'direct' || !showInheritance) return null

    const labelMap: Record<InheritanceSource, string> = {
      direct: '',
      engagement: t('badge.via_engagement', 'via Engagement'),
      after_action: t('badge.via_after_action', 'via After-Action'),
      position: t('badge.via_position', 'via Position'),
      mou: t('badge.via_mou', 'via MOU'),
    }

    return labelMap[inheritanceSource]
  }

  const inheritanceLabel = getInheritanceLabel()

  // Badge content
  const badgeContent = (
    <Badge
      variant={isPrimary ? 'default' : 'secondary'}
      className={cn(
        'inline-flex items-center gap-1.5 font-normal max-w-full',
        sizeClasses[size],
        clickable && 'cursor-pointer hover:bg-opacity-80 transition-colors',
        className,
      )}
    >
      {showIcon && (
        <DossierTypeIcon
          type={dossierType}
          size={size === 'lg' ? 'md' : size === 'sm' ? 'xs' : 'sm'}
          colored={!isPrimary}
          className={isPrimary ? 'text-primary-foreground' : undefined}
        />
      )}
      <span className="truncate max-w-[120px] sm:max-w-[180px]">{displayName}</span>
      {isPrimary && (
        <span className="text-[10px] opacity-75 shrink-0">{t('badge.primary', 'Primary')}</span>
      )}
      {inheritanceLabel && (
        <span className="text-[10px] opacity-75 shrink-0 hidden sm:inline">{inheritanceLabel}</span>
      )}
      {clickable && <ExternalLink className="size-3 opacity-50 shrink-0" />}
    </Badge>
  )

  // Wrap with tooltip for long names
  const badgeWithTooltip = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent side={isRTL ? 'left' : 'right'}>
          <div className="space-y-1">
            <p className="font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{t(`type.${dossierType}`, dossierType)}</p>
            {inheritanceLabel && (
              <p className="text-xs text-muted-foreground">{inheritanceLabel}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  // Wrap with link if clickable
  if (clickable) {
    return (
      <Link to={getDossierDetailPath(dossierId, dossierType)} className="no-underline">
        {badgeWithTooltip}
      </Link>
    )
  }

  return badgeWithTooltip
}

export default DossierContextBadge
