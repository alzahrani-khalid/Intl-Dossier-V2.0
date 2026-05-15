/**
 * DossierTypeSelector Component
 * Part of: 026-unified-dossier-architecture implementation (User Story 1 - T054)
 *
 * Mobile-first, RTL-compatible type selection component for creating dossiers.
 * Displays all 7 dossier types as selectable cards with icons and descriptions.
 * Note: elected_official is now a person_subtype, not a separate dossier type.
 *
 * Features:
 * - Responsive grid (1 col mobile → 2 cols tablet → 3 cols desktop)
 * - RTL support via logical properties
 * - Touch-friendly card buttons (min 44x44px height)
 * - Keyboard accessible
 * - Visual feedback for selection state
 * - EntityTypeGuide integration for contextual help
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Globe,
  Building2,
  Users,
  Calendar,
  Target,
  Briefcase,
  User,
  Check,
  HelpCircle,
} from 'lucide-react'
import { DossierTypeGuide } from './DossierTypeGuide'
import type { DossierType } from '@/services/dossier-api'

interface DossierTypeSelectorProps {
  value?: DossierType
  selectedType?: DossierType
  onChange: (type: DossierType) => void
  className?: string
  disabled?: boolean
}

interface DossierTypeOption {
  type: DossierType
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  descriptionKey: string
}

const dossierTypeOptions: DossierTypeOption[] = [
  {
    type: 'country',
    icon: Globe,
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#DossierTypeSelector
    colorClass: 'text-blue-600 dark:text-blue-400',
    descriptionKey: 'typeDescription.country',
  },
  {
    type: 'organization',
    icon: Building2,
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#DossierTypeSelector
    colorClass: 'text-purple-600 dark:text-purple-400',
    descriptionKey: 'typeDescription.organization',
  },
  {
    type: 'person',
    icon: User,
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#DossierTypeSelector
    colorClass: 'text-teal-600 dark:text-teal-400',
    descriptionKey: 'typeDescription.person',
  },
  {
    type: 'engagement',
    icon: Calendar,
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#DossierTypeSelector
    colorClass: 'text-orange-600 dark:text-orange-400',
    descriptionKey: 'typeDescription.engagement',
  },
  {
    type: 'forum',
    icon: Users,
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#DossierTypeSelector
    colorClass: 'text-green-600 dark:text-green-400',
    descriptionKey: 'typeDescription.forum',
  },
  {
    type: 'working_group',
    icon: Briefcase,
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#DossierTypeSelector
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    descriptionKey: 'typeDescription.working_group',
  },
  {
    type: 'topic',
    icon: Target,
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#DossierTypeSelector
    colorClass: 'text-pink-600 dark:text-pink-400',
    descriptionKey: 'typeDescription.topic',
  },
]

export function DossierTypeSelector({
  value,
  selectedType,
  onChange,
  className,
  disabled = false,
}: DossierTypeSelectorProps) {
  const { t } = useTranslation(['dossier', 'contextual-help'])
  // Support both value and selectedType props
  const currentValue = selectedType ?? value

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
        className,
      )}
    >
      {dossierTypeOptions.map((option) => {
        const Icon = option.icon
        const isSelected = currentValue === option.type

        return (
          <Card
            key={option.type}
            className={cn(
              'relative cursor-pointer transition-all',
              'hover:shadow-md hover:border-primary',
              'min-h-[140px] sm:min-h-[160px]',
              isSelected && 'border-primary ring-2 ring-primary ring-offset-2',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            onClick={() => !disabled && onChange(option.type)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onChange(option.type)
              }
            }}
            aria-pressed={isSelected}
            aria-disabled={disabled}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div
                className={cn(
                  'absolute top-2 end-2 bg-primary text-primary-foreground rounded-full p-1',
                  'animate-in zoom-in duration-200',
                )}
              >
                <Check className="h-4 w-4" />
              </div>
            )}

            {/* DossierTypeGuide for contextual help */}
            <div className="absolute top-2 start-2" onClick={(e) => e.stopPropagation()}>
              <DossierTypeGuide
                type={option.type}
                variant="popover"
                trigger={
                  <button
                    type="button"
                    className={cn(
                      'p-1.5 rounded-full',
                      'text-muted-foreground hover:text-foreground',
                      'hover:bg-muted transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    )}
                    aria-label={t('contextual-help:helpFor', {
                      field: t(`dossier:type.${option.type}`),
                    })}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                }
              />
            </div>

            <CardHeader className="flex flex-col items-center gap-2 p-4 sm:p-6 pt-10">
              {/* Icon */}
              <div
                className={cn(
                  'flex items-center justify-center',
                  'h-12 w-12 sm:h-14 sm:w-14',
                  'rounded-lg bg-muted',
                  isSelected && 'bg-primary/10',
                )}
              >
                <Icon className={cn('h-6 w-6 sm:h-7 sm:w-7', option.colorClass)} />
              </div>

              {/* Type name */}
              <CardTitle className="text-base sm:text-lg text-center">
                {t(`dossier:type.${option.type}`)}
              </CardTitle>
            </CardHeader>

            {/* Description */}
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              <CardDescription className="text-xs sm:text-sm text-center line-clamp-3">
                {t(`dossier:${option.descriptionKey}`)}
              </CardDescription>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
