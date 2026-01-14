/**
 * TemplateCard Component
 * Feature: Entity Creation Templates
 *
 * Displays a single template with:
 * - Icon and color theming
 * - Favorite toggle
 * - Keyboard shortcut badge
 * - RTL support
 */

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Star,
  FileText,
  Users,
  Globe,
  Building,
  Calendar,
  CheckCircle,
  UserCheck,
  AlertTriangle,
  Search,
  FileSearch,
  Plane,
  Flag,
  Lightbulb,
  Clock,
} from 'lucide-react'
import type { EntityTemplate, TemplateCardProps } from '@/types/entity-template.types'
import { formatKeyboardShortcut, getColorClass } from '@/types/entity-template.types'

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Users,
  Globe,
  Building,
  Calendar,
  CheckCircle,
  UserCheck,
  AlertTriangle,
  Search,
  FileSearch,
  Plane,
  Flag,
  Lightbulb,
  Clock,
  Star,
}

export function TemplateCard({
  template,
  isSelected = false,
  onClick,
  onFavoriteToggle,
  showKeyboardShortcut = false,
}: TemplateCardProps) {
  const { t, i18n } = useTranslation('entity-templates')
  const isRTL = i18n.language === 'ar'

  // Get icon component
  const IconComponent = ICON_MAP[template.icon] || FileText

  // Get localized name and description
  const name = isRTL ? template.name_ar : template.name_en
  const description = isRTL ? template.description_ar : template.description_en

  // Handle click
  const handleClick = () => {
    onClick(template)
  }

  // Handle favorite toggle
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onFavoriteToggle) {
      onFavoriteToggle(template)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`template-card-${template.id}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-all',
        'hover:border-primary hover:shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isSelected && 'border-primary ring-2 ring-primary ring-offset-2',
        'min-h-[6rem] sm:min-h-[7rem]',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md sm:h-9 sm:w-9',
              getColorClass(template),
            )}
          >
            <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium sm:text-base">{name}</h4>
            {template.scope === 'system' && (
              <Badge variant="secondary" className="mt-0.5 text-xs">
                {t('badge.system')}
              </Badge>
            )}
          </div>
        </div>

        {/* Favorite button */}
        {onFavoriteToggle && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7 shrink-0 opacity-0 transition-opacity',
              'group-hover:opacity-100',
              template.is_favorite && 'opacity-100',
            )}
            onClick={handleFavoriteClick}
          >
            <Star
              className={cn('h-4 w-4', template.is_favorite && 'fill-yellow-400 text-yellow-400')}
            />
            <span className="sr-only">
              {template.is_favorite ? t('action.unfavorite') : t('action.favorite')}
            </span>
          </Button>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">{description}</p>
      )}

      {/* Footer with keyboard shortcut and tags */}
      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        {showKeyboardShortcut && template.keyboard_shortcut && (
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {formatKeyboardShortcut(template.keyboard_shortcut)}
          </kbd>
        )}
        {template.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs capitalize">
            {tag}
          </Badge>
        ))}
        {template.tags.length > 2 && (
          <span className="text-xs text-muted-foreground">+{template.tags.length - 2}</span>
        )}
      </div>

      {/* Recent indicator */}
      {template.is_recent && !template.is_favorite && (
        <div
          className={cn(
            'absolute -top-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white',
            isRTL ? '-start-1' : '-end-1',
          )}
        >
          <Clock className="inline-block h-3 w-3" />
        </div>
      )}
    </div>
  )
}

export default TemplateCard
